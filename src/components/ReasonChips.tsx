import { useState } from 'react';
import type { PRProfile } from '../../shared/types';

export const REJECT_REASONS = [
  { id: 'too-big', label: '📏 too big' },
  { id: 'no-tests', label: '🧪 no tests' },
  { id: 'touches-auth', label: '🔒 touches auth' },
  { id: 'wrong-layer', label: '🧅 wrong layer' },
  { id: 'duplicate', label: '👯 duplicate' },
  { id: 'vibe-off', label: '🫥 vibe off' },
] as const;

export const APPROVE_REASONS = [
  { id: 'clean', label: '✨ clean' },
  { id: 'well-tested', label: '🧪 well-tested' },
  { id: 'small', label: '🤏 small' },
  { id: 'great-fit', label: '🎯 good fit' },
  { id: 'nice-docs', label: '📚 documented' },
] as const;

interface Props {
  pr: PRProfile;
  onSubmit(reasons: string[]): void;
  verdict?: 'approve' | 'reject';
}

/** Copy + chip set differ by verdict; the brain learns from either signal. */
const COPY = {
  reject: {
    reasons: REJECT_REASONS,
    aria: 'Why the nope?',
    heading: 'Why the nope? 💔',
    skip: 'no reason, just no',
    send: 'remember this 🧠',
  },
  approve: {
    reasons: APPROVE_REASONS,
    aria: 'What do you love?',
    heading: 'What do you love? 💚',
    skip: 'just yes',
    send: 'remember this 🧠',
  },
} as const;

/**
 * Two-tap knowledge capture: after a swipe, ask why. The chips become
 * structured signal in the brain; skipping still records the decision.
 */
export default function ReasonChips({ pr, onSubmit, verdict = 'reject' }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const copy = COPY[verdict];

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div
      className={`reason-overlay${verdict === 'approve' ? ' approve' : ''}`}
      role="dialog"
      aria-label={copy.aria}
    >
      <div className="reason-inner">
        <h2>{copy.heading}</h2>
        <p className="reason-sub">
          #{pr.number} · {pr.title}
        </p>
        <div className="reason-chips">
          {copy.reasons.map((r) => (
            <button
              key={r.id}
              className={`reason-chip ${selected.includes(r.id) ? 'on' : ''}`}
              onClick={() => toggle(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="reason-actions">
          <button className="reason-skip" onClick={() => onSubmit([])}>
            {copy.skip}
          </button>
          <button
            className="reason-send"
            onClick={() => onSubmit(selected)}
            disabled={selected.length === 0}
          >
            {copy.send}
          </button>
        </div>
      </div>
    </div>
  );
}
