import { useEffect, useMemo, useState } from 'react';
import type { BrainMemory, BrainSnapshot, PRFingerprint, PRProfile } from '../../shared/types';
import { fetchBrain } from '../api';
import { REJECT_REASONS } from './ReasonChips';
import { SwipeHistoryList, type HistoryEntry } from './SwipeHistory';

const REASON_LABEL = new Map<string, string>(REJECT_REASONS.map((r) => [r.id, r.label]));

function reasonLabel(id: string): string {
  return REASON_LABEL.get(id) ?? id;
}

function agoLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function fingerprintLine(fp: PRFingerprint): string {
  const parts: string[] = [fp.size];
  if (fp.dirs[0]) parts.push(fp.dirs[0]);
  parts.push(fp.has_tests ? 'has tests' : 'no tests');
  return parts.join(' · ');
}

interface Props {
  /** The deck currently on screen — used to show which memories are scoring it. */
  currentPrs: PRProfile[];
  /** This session's swipes so far — the "This session" tab, incl. skips. */
  history: HistoryEntry[];
  /** In demo mode nothing is actually sent to GitHub — say so on the rows. */
  demo: boolean;
  onClose: () => void;
}

type Tab = 'all' | 'session';

/**
 * The Company Brain, made visible: every swipe captured so far, its stats, and
 * the live wiring showing which past decisions are scoring the deck right now.
 * The "This session" tab folds the deck's swipe history in here too — the Brain
 * is the one place history lives, all-time memories and the current run side by
 * side.
 */
export default function BrainPanel({ currentPrs, history, demo, onClose }: Props) {
  const [snap, setSnap] = useState<BrainSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');

  const load = () => {
    setLoading(true);
    fetchBrain()
      .then((data) => {
        setSnap(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Which memories are actively citing on the visible deck? Citations carry only
  // the PR number, so key the cross-reference by number.
  const citedBy = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const pr of currentPrs)
      for (const c of pr.compatibility?.citations ?? []) {
        const arr = map.get(c.pr) ?? [];
        if (!arr.includes(pr.number)) arr.push(pr.number);
        map.set(c.pr, arr);
      }
    return map;
  }, [currentPrs]);

  const stats = snap?.stats;

  // Newest-first, matching the deck drawer's ordering.
  const sessionEntries = useMemo(() => [...history].reverse(), [history]);
  const sessionApproved = history.filter((h) => h.verdict === 'approve').length;
  const sessionRejected = history.filter((h) => h.verdict === 'reject').length;
  const sessionSkipped = history.filter((h) => h.verdict === 'skip').length;

  return (
    <div className="brain-overlay" role="dialog" aria-label="The Company Brain">
      <aside className="brain-panel">
        <header className="brain-panel-head">
          <h2>🧠 Company Brain</h2>
          <div className="brain-panel-head-actions">
            <button className="brain-refresh" onClick={load} title="Refresh" disabled={loading}>
              ↻
            </button>
            <button className="brain-panel-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </header>

        <div className="brain-tabs" role="tablist">
          <button
            className={`brain-tab ${tab === 'all' ? 'active' : ''}`}
            role="tab"
            aria-selected={tab === 'all'}
            onClick={() => setTab('all')}
          >
            🧠 All memories
            {stats ? <span className="brain-tab-count"> · {stats.total}</span> : null}
          </button>
          <button
            className={`brain-tab ${tab === 'session' ? 'active' : ''}`}
            role="tab"
            aria-selected={tab === 'session'}
            onClick={() => setTab('session')}
          >
            🕘 This session<span className="brain-tab-count"> · {history.length}</span>
          </button>
        </div>

        {tab === 'all' ? (
          <>
            {stats && (
              <div className="brain-stats">
                <div className="brain-stat">
                  <span className="brain-stat-num">{stats.total}</span>
                  <span className="brain-stat-label">memories</span>
                </div>
                <div className="brain-stat">
                  <span className="brain-stat-num brain-approve">{stats.approved}</span>
                  <span className="brain-stat-label">approved</span>
                </div>
                <div className="brain-stat">
                  <span className="brain-stat-num brain-reject">{stats.rejected}</span>
                  <span className="brain-stat-label">rejected</span>
                </div>
              </div>
            )}

            {stats && stats.topReasons.length > 0 && (
              <div className="brain-top-reasons">
                <span className="brain-top-label">why they got noped:</span>
                {stats.topReasons.map((r) => (
                  <span key={r.reason} className="brain-reason-tally">
                    {reasonLabel(r.reason)} ×{r.count}
                  </span>
                ))}
              </div>
            )}

            <div className="brain-list">
              {error ? (
                <p className="brain-panel-msg error-text">{error}</p>
              ) : loading && !snap ? (
                <p className="brain-panel-msg">Reading the brain…</p>
              ) : snap && snap.memories.length === 0 ? (
                <p className="brain-panel-msg">
                  No memories yet. Swipe on a few PRs and every decision shows up here — the brain
                  starts learning your taste from the first one.
                </p>
              ) : (
                snap?.memories.map((m) => (
                  <MemoryRow key={`${m.repo}#${m.pr}`} m={m} citedBy={citedBy.get(m.pr)} />
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {history.length > 0 && (
              <div className="brain-stats">
                <div className="brain-stat">
                  <span className="brain-stat-num brain-approve">{sessionApproved}</span>
                  <span className="brain-stat-label">approved</span>
                </div>
                <div className="brain-stat">
                  <span className="brain-stat-num brain-reject">{sessionRejected}</span>
                  <span className="brain-stat-label">rejected</span>
                </div>
                <div className="brain-stat">
                  <span className="brain-stat-num">{sessionSkipped}</span>
                  <span className="brain-stat-label">skipped</span>
                </div>
              </div>
            )}
            <div className="brain-list brain-session">
              {history.length === 0 ? (
                <p className="brain-panel-msg">
                  No swipes yet this session. Every card you swipe lands here — and the approves and
                  rejects become memories the brain keeps. (Skips stay in this list only.)
                </p>
              ) : (
                <SwipeHistoryList entries={sessionEntries} demo={demo} />
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function MemoryRow({ m, citedBy }: { m: BrainMemory; citedBy?: number[] }) {
  const approved = m.verdict === 'approve';
  return (
    <div className={`brain-memory ${approved ? 'approve' : 'reject'}`}>
      <div className="brain-memory-top">
        <span className="brain-memory-verdict">{approved ? '💚' : '💔'}</span>
        <a href={m.url} target="_blank" rel="noreferrer" className="brain-memory-title">
          #{m.pr} {m.title}
        </a>
        <span className="brain-memory-ago">{agoLabel(m.swiped_at)}</span>
      </div>
      {m.reasons.length > 0 && (
        <div className="brain-memory-reasons">
          {m.reasons.map((r) => (
            <span key={r} className="brain-memory-reason">
              {reasonLabel(r)}
            </span>
          ))}
        </div>
      )}
      <div className="brain-memory-fp">{fingerprintLine(m.fingerprint)}</div>
      {citedBy && citedBy.length > 0 && (
        <div className="brain-memory-cited">
          🔗 scoring {citedBy.map((n) => `#${n}`).join(', ')} in the deck now
        </div>
      )}
    </div>
  );
}
