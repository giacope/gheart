import { useState } from 'react';
import type { PRProfile, SwipeVerdict } from '../../shared/types';

export interface HistoryEntry {
  pr: PRProfile;
  verdict: SwipeVerdict;
}

interface Props {
  history: HistoryEntry[];
  /** In demo mode nothing is actually sent to GitHub — say so. */
  demo: boolean;
}

const VERDICT_META: Record<SwipeVerdict, { icon: string; label: string; cls: string }> = {
  approve: { icon: '💚', label: 'Approved', cls: 'approve' },
  superlike: { icon: '⭐', label: 'Super approved', cls: 'superlike' },
  reject: { icon: '💔', label: 'Changes requested', cls: 'reject' },
  skip: { icon: '🙈', label: 'Skipped', cls: 'skip' },
};

/**
 * A collapsible drawer at the bottom of the deck showing this session's swipes,
 * their verdict, and a jump-to-GitHub link for each PR. Renders nothing until
 * the first swipe so it stays out of the way on a fresh deck.
 */
export default function SwipeHistory({ history, demo }: Props) {
  const [open, setOpen] = useState(false);
  if (history.length === 0) return null;

  const approved = history.filter((h) => h.verdict === 'approve').length;
  const superliked = history.filter((h) => h.verdict === 'superlike').length;
  const rejected = history.filter((h) => h.verdict === 'reject').length;
  const skipped = history.filter((h) => h.verdict === 'skip').length;
  // Newest first — the last swipe is the one you're most likely reconsidering.
  const entries = [...history].reverse();

  return (
    <section className={`swipe-history ${open ? 'open' : ''}`}>
      <button
        className="swipe-history-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="swipe-history-title">🕘 {history.length} swiped this session</span>
        <span className="swipe-history-tally">
          <span className="sh-tally approve">💚 {approved}</span>
          <span className="sh-tally superlike">⭐ {superliked}</span>
          <span className="sh-tally reject">💔 {rejected}</span>
          <span className="sh-tally skip">🙈 {skipped}</span>
        </span>
        <span className="swipe-history-caret">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <ul className="swipe-history-list">
          {entries.map(({ pr, verdict }) => {
            const meta = VERDICT_META[verdict];
            return (
              <li key={pr.id} className={`swipe-history-item ${meta.cls}`}>
                <span className="sh-verdict" title={meta.label}>
                  {meta.icon}
                </span>
                <span className="sh-body">
                  <span className="sh-pr">
                    <code>#{pr.number}</code> {pr.title}
                  </span>
                  <span className="sh-meta">
                    {meta.label}
                    {demo && verdict !== 'skip' ? ' · demo, not sent' : ''} · {pr.repo}
                  </span>
                </span>
                <a
                  className="sh-link"
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open this PR on GitHub"
                >
                  GitHub ↗
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
