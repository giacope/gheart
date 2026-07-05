import type { PRProfile, SwipeVerdict } from '../../shared/types';

interface Props {
  history: Array<{ pr: PRProfile; verdict: SwipeVerdict }>;
  onRestart(): void;
}

const VERDICT_ICON: Record<SwipeVerdict, string> = {
  approve: '💚',
  superlike: '⭐',
  reject: '💔',
  skip: '🙈',
};

export default function EmptyDeck({ history, onRestart }: Props) {
  const approved = history.filter(
    (h) => h.verdict === 'approve' || h.verdict === 'superlike',
  ).length;
  const rejected = history.filter((h) => h.verdict === 'reject').length;
  const skipped = history.filter((h) => h.verdict === 'skip').length;

  return (
    <div className="empty-deck">
      <div className="empty-emoji">🎉</div>
      <h2>Inbox zero, review edition</h2>
      <p>
        No more PRs in your area. {approved} approved · {rejected} sent back · {skipped} left on
        read.
      </p>
      {history.length > 0 && (
        <ul className="history-list">
          {history.map(({ pr, verdict }) => (
            <li key={pr.id}>
              <span>{VERDICT_ICON[verdict]}</span>
              <code>#{pr.number}</code> {pr.title}
            </li>
          ))}
        </ul>
      )}
      <button className="restart" onClick={onRestart}>
        Refresh the deck
      </button>
    </div>
  );
}
