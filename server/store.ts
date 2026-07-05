import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { AuthUser, SwipeVerdict } from '../shared/types';

const SESSION_TTL_MS = 30 * 86_400_000; // 30 days

export interface UserTokens {
  /** GitHub user-to-server token (or the env token in token mode, '' in demo mode). */
  accessToken: string;
  /** Refresh token for app-mode user tokens (they expire after ~8h). */
  refreshToken?: string;
  /** ISO timestamp when accessToken expires; absent = never. */
  tokenExpiresAt?: string;
}

export interface StoredUser extends AuthUser, UserTokens {
  createdAt: string;
  updatedAt: string;
}

/** Credentials of the gheart GitHub App, captured by the manifest setup flow. */
export interface AppCredentials {
  appId: number;
  slug: string;
  clientId: string;
  clientSecret: string;
  pem?: string;
  webhookSecret?: string | null;
}

interface StoredSession {
  id: string;
  userId: number;
  createdAt: string;
  expiresAt: string;
}

interface SwipeRecord {
  verdict: Exclude<SwipeVerdict, 'skip'>;
  at: string;
}

interface StoreData {
  users: Record<string, StoredUser>;
  sessions: Record<string, StoredSession>;
  /** userId -> "owner/name#number" -> record */
  swipes: Record<string, Record<string, SwipeRecord>>;
  app?: AppCredentials;
}

const EMPTY: StoreData = { users: {}, sessions: {}, swipes: {} };

/**
 * A tiny JSON-file-backed store. Fine for a hackathon-scale multi-user app;
 * swap for a real database when gheart IPOs.
 */
export class Store {
  private data: StoreData;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(private file: string) {
    this.data = this.load();
  }

  private load(): StoreData {
    try {
      const raw = fs.readFileSync(this.file, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreData>;
      return {
        users: parsed.users ?? {},
        sessions: parsed.sessions ?? {},
        swipes: parsed.swipes ?? {},
        app: parsed.app,
      };
    } catch {
      return structuredClone(EMPTY);
    }
  }

  private save(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        fs.mkdirSync(path.dirname(this.file), { recursive: true });
        const tmp = `${this.file}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
        fs.renameSync(tmp, this.file);
      } catch (err) {
        console.error('gheart: failed to persist store:', err);
      }
    }, 50);
  }

  // ---- app credentials ----

  getAppCredentials(): AppCredentials | null {
    return this.data.app ?? null;
  }

  setAppCredentials(app: AppCredentials): void {
    this.data.app = app;
    this.save();
  }

  // ---- users ----

  upsertUser(user: AuthUser, tokens: UserTokens): StoredUser {
    const now = new Date().toISOString();
    const existing = this.data.users[String(user.id)];
    const stored: StoredUser = {
      ...user,
      ...tokens,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.data.users[String(user.id)] = stored;
    this.save();
    return stored;
  }

  getUser(id: number): StoredUser | null {
    return this.data.users[String(id)] ?? null;
  }

  // ---- sessions ----

  createSession(userId: number): StoredSession {
    const now = Date.now();
    const session: StoredSession = {
      id: randomBytes(32).toString('hex'),
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    };
    this.data.sessions[session.id] = session;
    this.save();
    return session;
  }

  getSessionUser(sessionId: string | undefined): StoredUser | null {
    if (!sessionId) return null;
    const session = this.data.sessions[sessionId];
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.data.sessions[sessionId];
      this.save();
      return null;
    }
    return this.getUser(session.userId);
  }

  deleteSession(sessionId: string | undefined): void {
    if (!sessionId || !this.data.sessions[sessionId]) return;
    delete this.data.sessions[sessionId];
    this.save();
  }

  // ---- swipes (per-user review history) ----

  recordSwipe(userId: number, prId: string, verdict: SwipeVerdict): void {
    if (verdict === 'skip') return; // skips come back next session, like fate
    const mine = (this.data.swipes[String(userId)] ??= {});
    mine[prId] = { verdict, at: new Date().toISOString() };
    this.save();
  }

  removeSwipe(userId: number, prId: string): void {
    const mine = this.data.swipes[String(userId)];
    if (mine && prId in mine) {
      delete mine[prId];
      this.save();
    }
  }

  hasSwiped(userId: number, prId: string): boolean {
    return Boolean(this.data.swipes[String(userId)]?.[prId]);
  }

  swipedIds(userId: number): Set<string> {
    return new Set(Object.keys(this.data.swipes[String(userId)] ?? {}));
  }
}
