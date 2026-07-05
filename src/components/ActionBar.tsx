import type { SwipeVerdict } from '../../shared/types';

interface Props {
  onAction(verdict: SwipeVerdict): void;
  onUndo(): void;
  canUndo: boolean;
  disabled: boolean;
}

export default function ActionBar({ onAction, onUndo, canUndo, disabled }: Props) {
  return (
    <div className="action-bar">
      <button
        className="action undo"
        title="Undo last swipe (u)"
        onClick={onUndo}
        disabled={!canUndo}
      >
        ⟲
      </button>
      <button
        className="action nope"
        title="Request changes (←)"
        onClick={() => onAction('reject')}
        disabled={disabled}
      >
        ✕
      </button>
      <button
        className="action skip"
        title="Skip for now (↑)"
        onClick={() => onAction('skip')}
        disabled={disabled}
      >
        ↷
      </button>
      <button
        className="action like"
        title="Approve (→)"
        onClick={() => onAction('approve')}
        disabled={disabled}
      >
        ♥
      </button>
      <button
        className="action super"
        title="Super approve — the strongest yes (s)"
        onClick={() => onAction('superlike')}
        disabled={disabled}
      >
        ⭐
      </button>
    </div>
  );
}
