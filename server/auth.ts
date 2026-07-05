import { randomBytes } from 'node:crypto';
import type { Request, Response, Router } from 'express';
import express from 'express';
import type { AuthMode, AuthUser, SessionInfo } from '../shared/types';
import { fetchViewer } from './github';
import type { AppCredentials, Store, StoredUser, UserTokens } from './store';

const COOKIE = 'gheart_session';
const STATE_TTL_MS = 10 * 60_000;
/** Refresh user tokens this long before they actually expire. */
const TOKEN_SLACK_MS = 2 * 60_000;

export interface AuthConfig {
  /** GitHub App credentials from the environment (override the stored ones). */
  app: Partial<AppCredentials>;
  envToken: string;
  /** Overrides the callback origin, e.g. "https://gheart.example.com". */
  baseUrl: string;
}

const DEMO_USER: AuthUser = {
  id: 0,
  login: 'demo-reviewer',
  name: 'Demo Reviewer',
  avatarUrl:
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#35d07f"/><text x="40" y="54" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#06281a">💚</text></svg>',
    ),
};

// ---- cookies (no dependency needed for one cookie) ----

export function sessionIdFrom(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function setSessionCookie(res: Response, sessionId: string): void {
  const attrs = [
    `${COOKIE}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${30 * 86_400}`,
  ];
  if (process.env.NODE_ENV === 'production') attrs.push('Secure');
  res.setHeader('set-cookie', attrs.join('; '));
}

function clearSessionCookie(res: Response): void {
  res.setHeader('set-cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error_description?: string;
}

function toUserTokens(body: TokenResponse): UserTokens {
  return {
    accessToken: body.access_token ?? '',
    refreshToken: body.refresh_token,
    tokenExpiresAt: body.expires_in
      ? new Date(Date.now() + body.expires_in * 1000).toISOString()
      : undefined,
  };
}

// ---- the auth service ----

export class Auth {
  /** OAuth `state` values waiting for the callback. */
  private pendingStates = new Map<string, number>();
  /** Lazily-resolved user for token mode (one user for the whole server). */
  private tokenUserPromise: Promise<StoredUser> | null = null;

  constructor(
    private cfg: AuthConfig,
    private store: Store,
  ) {}

  /** GitHub App credentials: env vars win, then whatever the setup flow stored. */
  appCredentials(): AppCredentials | null {
    const env = this.cfg.app;
    if (env.clientId && env.clientSecret) {
      return {
        appId: env.appId ?? 0,
        slug: env.slug ?? '',
        clientId: env.clientId,
        clientSecret: env.clientSecret,
      };
    }
    return this.store.getAppCredentials();
  }

  /** Recomputed per call so the manifest setup flow takes effect without a restart. */
  get mode(): AuthMode {
    if (this.appCredentials()) return 'app';
    if (this.cfg.envToken) return 'token';
    return 'demo';
  }

  installUrl(): string | null {
    const app = this.appCredentials();
    return app?.slug ? `https://github.com/apps/${app.slug}/installations/new` : null;
  }

  /** Resolve the requesting user, auto-provisioning sessions in demo/token mode. */
  async userFor(req: Request, res: Response): Promise<StoredUser | null> {
    const existing = this.store.getSessionUser(sessionIdFrom(req));
    if (existing) {
      if (this.mode !== 'app') return existing;
      // A leftover demo session from before the app was configured can't
      // talk to GitHub — treat it as signed out.
      if (existing.id === DEMO_USER.id) return null;
      return this.withFreshToken(existing);
    }

    if (this.mode === 'demo') {
      const user = this.store.upsertUser(DEMO_USER, { accessToken: '' });
      setSessionCookie(res, this.store.createSession(user.id).id);
      return user;
    }
    if (this.mode === 'token') {
      this.tokenUserPromise ??= fetchViewer(this.cfg.envToken).then((viewer) =>
        this.store.upsertUser(viewer, { accessToken: this.cfg.envToken }),
      );
      try {
        const user = await this.tokenUserPromise;
        setSessionCookie(res, this.store.createSession(user.id).id);
        return user;
      } catch (err) {
        this.tokenUserPromise = null; // retry next request
        throw err;
      }
    }
    return null; // app mode: must sign in
  }

  /** App-mode user tokens expire after ~8h; refresh when close to expiry. */
  private async withFreshToken(user: StoredUser): Promise<StoredUser | null> {
    const expiresAt = user.tokenExpiresAt ? Date.parse(user.tokenExpiresAt) : Infinity;
    if (expiresAt > Date.now() + TOKEN_SLACK_MS) return user;
    if (!user.refreshToken) return null; // expired and unrefreshable: sign in again

    const app = this.appCredentials();
    if (!app) return null;
    try {
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: app.clientId,
          client_secret: app.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: user.refreshToken,
        }),
      });
      const body = (await res.json()) as TokenResponse;
      if (!res.ok || !body.access_token) {
        throw new Error(body.error_description || `refresh failed (${res.status})`);
      }
      return this.store.upsertUser(
        { id: user.id, login: user.login, name: user.name, avatarUrl: user.avatarUrl },
        toUserTokens(body),
      );
    } catch (err) {
      console.error(`gheart: token refresh failed for ${user.login}:`, err);
      return null; // treated as signed out; the login flow re-mints everything
    }
  }

  sessionInfo(user: StoredUser | null): SessionInfo {
    return {
      mode: this.mode,
      user: user
        ? { id: user.id, login: user.login, name: user.name, avatarUrl: user.avatarUrl }
        : null,
    };
  }

  baseUrl(req: Request): string {
    if (this.cfg.baseUrl) return this.cfg.baseUrl.replace(/\/$/, '');
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    return `${proto}://${req.headers.host}`;
  }

  router(): Router {
    const r = express.Router();

    r.get('/login', (req, res) => {
      const app = this.appCredentials();
      if (!app) {
        res.redirect('/');
        return;
      }
      const state = randomBytes(16).toString('hex');
      this.pendingStates.set(state, Date.now() + STATE_TTL_MS);
      // Prune expired states so the map can't grow unbounded.
      for (const [s, exp] of this.pendingStates) {
        if (exp < Date.now()) this.pendingStates.delete(s);
      }
      // GitHub App user flow: no scopes — access comes from the app's
      // permissions intersected with where it's installed.
      const params = new URLSearchParams({
        client_id: app.clientId,
        redirect_uri: `${this.baseUrl(req)}/api/auth/callback`,
        state,
      });
      res.redirect(`https://github.com/login/oauth/authorize?${params}`);
    });

    r.get('/callback', (req, res) => {
      void this.handleCallback(req, res);
    });

    // Send the user to GitHub's "install this app" page.
    r.get('/install', (_req, res) => {
      const url = this.installUrl();
      if (url) res.redirect(url);
      else res.redirect('/');
    });

    r.post('/logout', (req, res) => {
      this.store.deleteSession(sessionIdFrom(req));
      clearSessionCookie(res);
      res.json({ ok: true });
    });

    return r;
  }

  private async handleCallback(req: Request, res: Response): Promise<void> {
    const app = this.appCredentials();
    const code = String(req.query.code || '');
    const state = String(req.query.state || '');
    const expiry = this.pendingStates.get(state);
    this.pendingStates.delete(state);
    const fromLogin = expiry !== undefined && expiry >= Date.now();
    // With request_oauth_on_install, GitHub redirects here on its own after an
    // app install, sending code + setup_action but no state of ours.
    const fromInstall = !state && Boolean(req.query.setup_action);
    if (!app || !code || (!fromLogin && !fromInstall)) {
      res.status(400).send('gheart: OAuth state mismatch or expired — try signing in again.');
      return;
    }

    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: app.clientId,
          client_secret: app.clientSecret,
          code,
          // Only echo redirect_uri for flows we initiated — the install
          // redirect's authorize step never had one.
          ...(fromLogin ? { redirect_uri: `${this.baseUrl(req)}/api/auth/callback` } : {}),
        }),
      });
      const tokenBody = (await tokenRes.json()) as TokenResponse;
      if (!tokenRes.ok || !tokenBody.access_token) {
        throw new Error(
          tokenBody.error_description || `token exchange failed (${tokenRes.status})`,
        );
      }

      const viewer = await fetchViewer(tokenBody.access_token);
      const user = this.store.upsertUser(viewer, toUserTokens(tokenBody));
      setSessionCookie(res, this.store.createSession(user.id).id);
      res.redirect('/');
    } catch (err) {
      console.error('gheart: sign-in callback failed:', err);
      res
        .status(502)
        .send(`gheart: sign-in failed — ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }
}
