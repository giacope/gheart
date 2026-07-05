import { useCallback, useEffect, useRef, useState } from 'react';
import type { PRProfile, SessionInfo, SwipeVerdict } from '../shared/types';
import { fetchPRs, fetchSession, logout, sendReview, undoReview } from './api';
import ActionBar from './components/ActionBar';
import EmptyDeck from './components/EmptyDeck';
import LoginScreen from './components/LoginScreen';
import MatchOverlay from './components/MatchOverlay';
import RepoPicker from './components/RepoPicker';
import SwipeDeck, { type SwipeDeckHandle } from './components/SwipeDeck';

interface HistoryEntry {
  pr: PRProfile;
  verdict: SwipeVerdict;
}

function repoKey(userId: number): string {
  return `gheart:repo:${userId}`;
}

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [prs, setPrs] = useState<PRProfile[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [demo, setDemo] = useState(true);
  const [repo, setRepo] = useState('');
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<PRProfile | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const deck = useRef<SwipeDeckHandle>(null);
  const toastTimer = useRef<number>();

  const user = session?.user ?? null;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(async (targetRepo?: string) => {
    setLoading(true);
    setError(null);
    setHistory([]);
    try {
      const data = await fetchPRs(targetRepo);
      setPrs(data.prs);
      setDemo(data.demo);
      setRepo(data.repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PRs');
      setPrs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Boot: who am I, and do they already have a repo picked?
  useEffect(() => {
    fetchSession()
      .then((info) => {
        setSession(info);
        if (info.user) {
          const saved = localStorage.getItem(repoKey(info.user.id)) ?? '';
          if (saved || info.mode === 'demo') {
            void load(saved || undefined);
          } else {
            setPicking(true);
          }
        }
      })
      .catch((err: Error) => setSessionError(err.message));
  }, [load]);

  const pickRepo = useCallback(
    (fullName: string) => {
      if (user) localStorage.setItem(repoKey(user.id), fullName);
      setPicking(false);
      void load(fullName);
    },
    [user, load],
  );

  const handleLogout = useCallback(() => {
    void logout().finally(() => window.location.reload());
  }, []);

  const handleVerdict = useCallback(
    (pr: PRProfile, verdict: SwipeVerdict) => {
      setPrs((rest) => rest.filter((p) => p.id !== pr.id));
      setHistory((h) => [...h, { pr, verdict }]);
      if (verdict === 'approve') {
        setMatch(pr);
        window.setTimeout(() => setMatch(null), 1500);
      }
      void sendReview({ repo: pr.repo, number: pr.number, verdict })
        .then((res) => {
          if (verdict !== 'approve') showToast(res.message);
        })
        .catch((err: Error) => showToast(`⚠️ ${err.message}`));
    },
    [showToast],
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setPrs((rest) => [last.pr, ...rest]);
      if (last.verdict !== 'skip') {
        // Forget the swipe server-side so the card comes back on reload too.
        void undoReview({ repo: last.pr.repo, number: last.pr.number }).catch(() => undefined);
        if (!demo) {
          showToast('Card restored — note: the review was already sent to GitHub');
        }
      }
      return h.slice(0, -1);
    });
  }, [demo, showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || loading || picking) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') deck.current?.swipe('approve');
      else if (e.key === 'ArrowLeft') deck.current?.swipe('reject');
      else if (e.key === 'ArrowUp') deck.current?.swipe('skip');
      else if (e.key === 'u') handleUndo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [match, loading, picking, handleUndo]);

  // ---- pre-auth states ----
  if (sessionError) {
    return (
      <div className="app">
        <main className="stage">
          <div className="empty-deck">
            <div className="empty-emoji">💔</div>
            <h2>Couldn&apos;t reach the server</h2>
            <p className="error-text">{sessionError}</p>
            <button className="restart" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="app">
        <main className="stage">
          <div className="loading">
            <span className="loading-heart">💚</span>
            <p>Warming up…</p>
          </div>
        </main>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="app">
        <main className="stage">
          <LoginScreen />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <span className="logo-heart">💚</span> gheart
        </div>
        <button className="repo-button" onClick={() => setPicking(true)} title="Switch repo">
          {repo || 'pick a repo'} <span className="repo-caret">▾</span>
        </button>
        {demo && (
          <a
            className="demo-badge"
            href="/api/setup"
            title="Visit /api/setup to create the GitHub App and review real PRs"
          >
            demo mode
          </a>
        )}
        <div className="user-chip" title={user.name ?? user.login}>
          <img className="user-avatar" src={user.avatarUrl} alt="" />
          <span className="user-login">{user.login}</span>
          {session.mode === 'app' && (
            <button className="logout" onClick={handleLogout} title="Sign out">
              sign out
            </button>
          )}
        </div>
      </header>

      <main className="stage">
        {picking ? (
          <RepoPicker
            currentRepo={repo}
            onPick={pickRepo}
            onClose={repo ? () => setPicking(false) : undefined}
            showInstallLink={session.mode === 'app'}
          />
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
            <button className="restart" onClick={() => void load(repo || undefined)}>
              Try again
            </button>
          </div>
        ) : prs.length === 0 ? (
          <EmptyDeck history={history} onRestart={() => void load(repo || undefined)} />
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
