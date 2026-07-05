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

interface Props {
  pr: PRProfile;
  onSubmit(reasons: string[]): void;
}

/**
 * Two-tap knowledge capture: after a left swipe, ask why. The chips become
 * structured signal in the brain; skipping still records the rejection.
 */
export default function ReasonChips({ pr, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="reason-overlay" role="dialog" aria-label="Why the nope?">
      <div className="reason-inner">
        <h2>Why the nope? 💔</h2>
        <p className="reason-sub">
          #{pr.number} · {pr.title}
        </p>
        <div className="reason-chips">
          {REJECT_REASONS.map((r) => (
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
            no reason, just no
          </button>
          <button
            className="reason-send"
            onClick={() => onSubmit(selected)}
            disabled={selected.length === 0}
          >
            remember this 🧠
          </button>
        </div>
      </div>
    </div>
  );
}
