import { randomBytes } from 'node:crypto';
import type { Request, Response, Router } from 'express';
import express from 'express';
import type { AuthMode, AuthUser, SessionInfo } from '../shared/types';
import { fetchViewer } from './github';
import type { Store, StoredUser } from './store';

const COOKIE = 'gheart_session';
const STATE_TTL_MS = 10 * 60_000;

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  envToken: string;
  /** Overrides the callback origin, e.g. "https://gheart.example.com". */
  baseUrl: string;
}

export function authModeOf(cfg: AuthConfig): AuthMode {
  if (cfg.clientId && cfg.clientSecret) return 'oauth';
  if (cfg.envToken) return 'token';
  return 'demo';
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

// ---- the auth service ----

export class Auth {
  readonly mode: AuthMode;
  /** OAuth `state` values waiting for the callback. */
  private pendingStates = new Map<string, number>();
  /** Lazily-resolved user for token mode (one user for the whole server). */
  private tokenUserPromise: Promise<StoredUser> | null = null;

  constructor(
    private cfg: AuthConfig,
    private store: Store,
  ) {
    this.mode = authModeOf(cfg);
  }

  /** Resolve the requesting user, auto-provisioning sessions in demo/token mode. */
  async userFor(req: Request, res: Response): Promise<StoredUser | null> {
    const existing = this.store.getSessionUser(sessionIdFrom(req));
    if (existing) return existing;

    if (this.mode === 'demo') {
      const user = this.store.upsertUser(DEMO_USER, '');
      setSessionCookie(res, this.store.createSession(user.id).id);
      return user;
    }
    if (this.mode === 'token') {
      this.tokenUserPromise ??= fetchViewer(this.cfg.envToken).then((viewer) =>
        this.store.upsertUser(viewer, this.cfg.envToken),
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
    return null; // oauth mode: must sign in
  }

  sessionInfo(user: StoredUser | null): SessionInfo {
    return {
      mode: this.mode,
      user: user ? { id: user.id, login: user.login, name: user.name, avatarUrl: user.avatarUrl } : null,
    };
  }

  router(): Router {
    const r = express.Router();

    r.get('/login', (req, res) => {
      if (this.mode !== 'oauth') {
        res.redirect('/');
        return;
      }
      const state = randomBytes(16).toString('hex');
      this.pendingStates.set(state, Date.now() + STATE_TTL_MS);
      // Prune expired states so the map can't grow unbounded.
      for (const [s, exp] of this.pendingStates) {
        if (exp < Date.now()) this.pendingStates.delete(s);
      }
      const params = new URLSearchParams({
        client_id: this.cfg.clientId,
        redirect_uri: `${this.baseUrl(req)}/api/auth/callback`,
        scope: 'repo read:user',
        state,
      });
      res.redirect(`https://github.com/login/oauth/authorize?${params}`);
    });

    r.get('/callback', (req, res) => {
      void this.handleCallback(req, res);
    });

    r.post('/logout', (req, res) => {
      this.store.deleteSession(sessionIdFrom(req));
      clearSessionCookie(res);
      res.json({ ok: true });
    });

    return r;
  }

  private baseUrl(req: Request): string {
    if (this.cfg.baseUrl) return this.cfg.baseUrl.replace(/\/$/, '');
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    return `${proto}://${req.headers.host}`;
  }

  private async handleCallback(req: Request, res: Response): Promise<void> {
    const code = String(req.query.code || '');
    const state = String(req.query.state || '');
    const expiry = this.pendingStates.get(state);
    this.pendingStates.delete(state);
    if (!code || !expiry || expiry < Date.now()) {
      res.status(400).send('gheart: OAuth state mismatch or expired — try signing in again.');
      return;
    }

    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: this.cfg.clientId,
          client_secret: this.cfg.clientSecret,
          code,
          redirect_uri: `${this.baseUrl(req)}/api/auth/callback`,
        }),
      });
      const tokenBody = (await tokenRes.json()) as {
        access_token?: string;
        error_description?: string;
      };
      if (!tokenRes.ok || !tokenBody.access_token) {
        throw new Error(tokenBody.error_description || `token exchange failed (${tokenRes.status})`);
      }

      const viewer = await fetchViewer(tokenBody.access_token);
      const user = this.store.upsertUser(viewer, tokenBody.access_token);
      setSessionCookie(res, this.store.createSession(user.id).id);
      res.redirect('/');
    } catch (err) {
      console.error('gheart: OAuth callback failed:', err);
      res
        .status(502)
        .send(`gheart: sign-in failed — ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }
}
