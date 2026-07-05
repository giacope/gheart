import type { PRProfile } from '../../shared/types';

export default function MatchOverlay({ pr, super: isSuper }: { pr: PRProfile; super?: boolean }) {
  return (
    <div className={`match-overlay${isSuper ? ' super' : ''}`}>
      <div className="match-inner">
        <div className="match-hearts" aria-hidden>
          {isSuper ? '⭐' : '💚'}
        </div>
        <h2>{isSuper ? "It's a SUPER merge!" : "It's a merge!"}</h2>
        <p>
          You {isSuper ? 'super approved' : 'approved'} <strong>#{pr.number}</strong> by{' '}
          <strong>{pr.author.login}</strong>
        </p>
        <img src={pr.author.avatarUrl} alt="" className="match-avatar" />
      </div>
    </div>
  );
}
