import type { PRProfile } from '../../shared/types';

export default function MatchOverlay({ pr }: { pr: PRProfile }) {
  return (
    <div className="match-overlay">
      <div className="match-inner">
        <div className="match-hearts" aria-hidden>
          💚
        </div>
        <h2>It&apos;s a merge!</h2>
        <p>
          You approved <strong>#{pr.number}</strong> by <strong>{pr.author.login}</strong>
        </p>
        <img src={pr.author.avatarUrl} alt="" className="match-avatar" />
      </div>
    </div>
  );
}
