import { useCallback, useEffect, useRef, useState } from 'react';
import type { PRProfile, SwipeVerdict } from '../shared/types';
import { fetchPRs, sendReview } from './api';
import ActionBar from './components/ActionBar';
import EmptyDeck from './components/EmptyDeck';
import MatchOverlay from './components/MatchOverlay';
import SwipeDeck, { type SwipeDeckHandle } from './components/SwipeDeck';

interface HistoryEntry {
  pr: PRProfile;
  verdict: SwipeVerdict;
}

export default function App() {
  const [prs, setPrs] = useState<PRProfile[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [demo, setDemo] = useState(true);
  const [repo, setRepo] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const [loading, setLoading] = useState(true);
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
    async (targetRepo?: string) => {
      setLoading(true);
      setError(null);
      setHistory([]);
      try {
        const data = await fetchPRs(targetRepo);
        setPrs(data.prs);
        setDemo(data.demo);
        setRepo(data.repo);
        setRepoInput(data.repo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PRs');
        setPrs([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!demo && last.verdict !== 'skip') {
        showToast('Card restored — note: the review was already sent to GitHub');
      }
      return h.slice(0, -1);
    });
  }, [demo, showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || loading) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') deck.current?.swipe('approve');
      else if (e.key === 'ArrowLeft') deck.current?.swipe('reject');
      else if (e.key === 'ArrowUp') deck.current?.swipe('skip');
      else if (e.key === 'u') handleUndo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [match, loading, handleUndo]);

  const submitRepo = (e: React.FormEvent) => {
    e.preventDefault();
    const value = repoInput.trim();
    if (value && value !== repo) void load(value);
  };

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
            spellCheck={false}
          />
          <button type="submit">load</button>
        </form>
        {demo && (
          <span className="demo-badge" title="Set GITHUB_TOKEN to review real PRs">
            demo mode
          </span>
        )}
      </header>

      <main className="stage">
        {loading ? (
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
            <p className="hint">
              swipe → to approve · ← to request changes · ↑ to skip
            </p>
          </>
        )}
      </main>

      {match && <MatchOverlay pr={match} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
