import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Store } from './store';

const alice = { id: 1, login: 'alice', name: 'Alice', avatarUrl: 'a.png' };
const bob = { id: 2, login: 'bob', name: 'Bob', avatarUrl: 'b.png' };

describe('Store', () => {
  let dir: string;
  let store: Store;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gheart-store-'));
    store = new Store(path.join(dir, 'gheart.json'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('upserts users and preserves createdAt across updates', () => {
    const first = store.upsertUser(alice, { accessToken: 'tok-1' });
    const second = store.upsertUser({ ...alice, name: 'Alice B' }, { accessToken: 'tok-2' });
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.accessToken).toBe('tok-2');
    expect(store.getUser(1)?.name).toBe('Alice B');
  });

  it('resolves users through sessions and rejects unknown/expired ids', () => {
    store.upsertUser(alice, { accessToken: 'tok' });
    const session = store.createSession(alice.id);
    expect(store.getSessionUser(session.id)?.login).toBe('alice');
    expect(store.getSessionUser('nope')).toBeNull();
    expect(store.getSessionUser(undefined)).toBeNull();
    store.deleteSession(session.id);
    expect(store.getSessionUser(session.id)).toBeNull();
  });

  it('keeps swipe history separate per user', () => {
    store.upsertUser(alice, { accessToken: 't1' });
    store.upsertUser(bob, { accessToken: 't2' });
    store.recordSwipe(alice.id, 'o/r#1', 'approve');
    store.recordSwipe(bob.id, 'o/r#2', 'reject');

    expect(store.swipedIds(alice.id)).toEqual(new Set(['o/r#1']));
    expect(store.swipedIds(bob.id)).toEqual(new Set(['o/r#2']));
  });

  it('does not persist skips, and undo removes a swipe', () => {
    store.upsertUser(alice, { accessToken: 't1' });
    store.recordSwipe(alice.id, 'o/r#1', 'skip');
    expect(store.hasSwiped(alice.id, 'o/r#1')).toBe(false);

    store.recordSwipe(alice.id, 'o/r#1', 'approve');
    expect(store.hasSwiped(alice.id, 'o/r#1')).toBe(true);
    store.removeSwipe(alice.id, 'o/r#1');
    expect(store.hasSwiped(alice.id, 'o/r#1')).toBe(false);
  });

  it('stores refresh tokens and app credentials', async () => {
    const stored = store.upsertUser(alice, {
      accessToken: 'short-lived',
      refreshToken: 'refresh-me',
      tokenExpiresAt: '2026-01-01T00:00:00.000Z',
    });
    expect(stored.refreshToken).toBe('refresh-me');
    expect(stored.tokenExpiresAt).toBe('2026-01-01T00:00:00.000Z');

    expect(store.getAppCredentials()).toBeNull();
    store.setAppCredentials({
      appId: 42,
      slug: 'gheart-test',
      clientId: 'Iv1.abc',
      clientSecret: 'shh',
    });
    await new Promise((r) => setTimeout(r, 120));
    const reloaded = new Store(path.join(dir, 'gheart.json'));
    expect(reloaded.getAppCredentials()?.slug).toBe('gheart-test');
    expect(reloaded.getUser(1)?.refreshToken).toBe('refresh-me');
  });

  it('persists to disk and reloads', async () => {
    store.upsertUser(alice, { accessToken: 'tok' });
    store.recordSwipe(alice.id, 'o/r#7', 'approve');
    // The store debounces writes by 50ms.
    await new Promise((r) => setTimeout(r, 120));

    const reloaded = new Store(path.join(dir, 'gheart.json'));
    expect(reloaded.getUser(1)?.login).toBe('alice');
    expect(reloaded.hasSwiped(1, 'o/r#7')).toBe(true);
  });
});
