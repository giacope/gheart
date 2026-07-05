import { useCallback, useEffect, useRef, useState } from 'react';
import type { PRProfile, SwipeVerdict } from '../shared/types';
import { fetchOpenPRs, submitReview, whoami } from './github';
import ActionBar from './components/ActionBar';
import EmptyDeck from './components/EmptyDeck';
import MatchOverlay from './components/MatchOverlay';
import SwipeDeck, { type SwipeDeckHandle } from './components/SwipeDeck';

interface HistoryEntry {
  pr: PRProfile;
  verdict: SwipeVerdict;
}

const TOKEN_KEY = 'gheart.token';
const REPO_KEY = 'gheart.repo';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [login, setLogin] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [prs, setPrs] = useState<PRProfile[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [repo, setRepo] = useState(() => localStorage.getItem(REPO_KEY) || '');
  const [repoInput, setRepoInput] = useState(() => localStorage.getItem(REPO_KEY) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<PRProfile | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const deck = useRef<SwipeDeckHandle>(null);
  const toastTimer = useRef<number>();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(
    async (targetRepo: string, tok: string) => {
      const r = targetRepo.trim();
      if (!/^[\w.-]+\/[\w.-]+$/.test(r)) {
        setError(`"${r || '(empty)'}" is not an owner/repo`);
        return;
      }
      setLoading(true);
      setError(null);
      setHistory([]);
      try {
        const data = await fetchOpenPRs(r, tok);
        setPrs(data);
        setRepo(r);
        localStorage.setItem(REPO_KEY, r);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PRs');
        setPrs([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Verify a stored / freshly-pasted token, then greet the user.
  useEffect(() => {
    if (!token) return;
    let alive = true;
    void whoami(token)
      .then((who) => {
        if (!alive) return;
        setLogin(who);
        if (repo) void load(repo, token);
      })
      .catch(() => {
        if (!alive) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setLogin(null);
        setAuthError('That token was rejected by GitHub — paste a fresh one.');
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = tokenInput.trim();
    if (!value) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      const who = await whoami(value);
      localStorage.setItem(TOKEN_KEY, value);
      setLogin(who);
      setToken(value);
      setTokenInput('');
    } catch {
      setAuthError('GitHub rejected that token. Needs Pull requests: write (or public_repo).');
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setLogin(null);
    setPrs([]);
    setHistory([]);
  };

  const handleVerdict = useCallback(
    (pr: PRProfile, verdict: SwipeVerdict) => {
      // Optimistic: the card is already gone before GitHub answers.
      setPrs((rest) => rest.filter((p) => p.id !== pr.id));
      setHistory((h) => [...h, { pr, verdict }]);
      if (verdict === 'approve') {
        setMatch(pr);
        window.setTimeout(() => setMatch(null), 1500);
      }
      if (verdict === 'skip' || !token) return;
      void submitReview(pr.repo, pr.number, verdict, token)
        .then(() => {
          if (verdict !== 'approve') {
            showToast(
              verdict === 'reject'
                ? `Requested changes on #${pr.number}`
                : `Sent on #${pr.number}`,
            );
          }
        })
        .catch((err: Error) => {
          // Rollback: put the card back so nothing is silently lost.
          setPrs((rest) => [pr, ...rest]);
          setHistory((h) => h.filter((e) => !(e.pr.id === pr.id && e.verdict === verdict)));
          showToast(`⚠️ ${err.message}`);
        });
    },
    [showToast, token],
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setPrs((rest) => [last.pr, ...rest]);
      if (last.verdict !== 'skip') {
        showToast('Card restored — the review was already sent to GitHub');
      }
      return h.slice(0, -1);
    });
  }, [showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || loading || !token) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') deck.current?.swipe('approve');
      else if (e.key === 'ArrowLeft') deck.current?.swipe('reject');
      else if (e.key === 'ArrowUp') deck.current?.swipe('skip');
      else if (e.key === 'u') handleUndo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [match, loading, token, handleUndo]);

  const submitRepo = (e: React.FormEvent) => {
    e.preventDefault();
    const value = repoInput.trim();
    if (value && token) void load(value, token);
  };

  // ---- Login gate ---------------------------------------------------------
  if (!token || !login) {
    return (
      <div className="app">
        <div className="login-gate">
          <div className="login-heart">💚</div>
          <h1>gheart</h1>
          <p className="login-tag">Swipe your PR review queue. On your phone.</p>
          <form className="login-form" onSubmit={connect}>
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="GitHub token (ghp_… / github_pat_…)"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              type="password"
            />
            <button type="submit" disabled={authBusy || !tokenInput.trim()}>
              {authBusy ? 'Checking…' : 'Sign in'}
            </button>
          </form>
          {authError && <p className="error-text">{authError}</p>}
          <p className="login-hint">
            Create a fine-grained token with <strong>Pull requests: write</strong> (or a classic
            token with <code>public_repo</code>).{' '}
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noreferrer"
            >
              Generate one ↗
            </a>
          </p>
          <p className="login-hint dim">
            The token stays on this device (localStorage) and talks to GitHub directly — no gheart
            server.
          </p>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  // ---- Deck ---------------------------------------------------------------
  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <span className="logo-heart">💚</span> gheart
        </div>
        <form className="repo-form" onSubmit={submitRepo}>
          <input
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="owner/repo"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit">load</button>
        </form>
        <button className="who-badge" onClick={logout} title="Sign out">
          @{login} ⏻
        </button>
      </header>

      <main className="stage">
        {!repo ? (
          <div className="empty-deck">
            <div className="empty-emoji">👆</div>
            <h2>Pick a repo</h2>
            <p>Type an <code>owner/repo</code> above to load its open PRs.</p>
          </div>
        ) : loading ? (
          <div className="loading">
            <span className="loading-heart">💚</span>
            <p>Finding PRs near you…</p>
          </div>
        ) : error ? (
          <div className="empty-deck">
            <div className="empty-emoji">💔</div>
            <h2>Couldn&apos;t load PRs</h2>
            <p className="error-text">{error}</p>
            <button className="restart" onClick={() => token && void load(repo, token)}>
              Try again
            </button>
          </div>
        ) : prs.length === 0 ? (
          <EmptyDeck history={history} onRestart={() => token && void load(repo, token)} />
        ) : (
          <>
            <SwipeDeck ref={deck} prs={prs} onVerdict={handleVerdict} />
            <ActionBar
              onAction={(v) => deck.current?.swipe(v)}
              onUndo={handleUndo}
              canUndo={history.length > 0}
              disabled={prs.length === 0}
            />
            <p className="hint">swipe → to approve · ← to request changes · ↑ to skip</p>
          </>
        )}
      </main>

      {match && <MatchOverlay pr={match} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
