import { useEffect, useMemo, useState } from 'react';
import type { RepoInfo } from '../../shared/types';
import { fetchRepos } from '../api';

interface Props {
  currentRepo: string;
  onPick: (repo: string) => void;
  onClose?: () => void;
  /** App mode: show the "add more repos" installation link. */
  showInstallLink?: boolean;
}

function agoLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'active today';
  if (days === 1) return 'active yesterday';
  if (days < 30) return `active ${days}d ago`;
  return `active ${Math.floor(days / 30)}mo ago`;
}

export default function RepoPicker({ currentRepo, onPick, onClose, showInstallLink }: Props) {
  const [repos, setRepos] = useState<RepoInfo[] | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchRepos()
      .then((data) => {
        setRepos(data.repos);
        setNeedsInstall(Boolean(data.needsInstall));
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const shown = useMemo(() => {
    if (!repos) return [];
    const q = query.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q),
    );
  }, [repos, query]);

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const value = query.trim();
    if (/^[\w.-]+\/[\w.-]+$/.test(value)) onPick(value);
  };

  if (needsInstall) {
    return (
      <div className="repo-picker">
        <div className="repo-picker-head">
          <h2>Install gheart on your repos</h2>
        </div>
        <p className="repo-picker-loading">
          gheart isn&apos;t installed anywhere yet. Install the GitHub App on the repos you want
          to review — only those repos become swipeable.
        </p>
        <a className="install-cta" href="/api/auth/install">
          Install on GitHub →
        </a>
      </div>
    );
  }

  return (
    <div className="repo-picker">
      <div className="repo-picker-head">
        <h2>Pick a repo to swipe on</h2>
        {onClose && (
          <button className="repo-picker-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>
      <form onSubmit={submitCustom}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter… or type any owner/repo and press enter"
          spellCheck={false}
        />
      </form>
      {error ? (
        <p className="error-text">{error}</p>
      ) : repos === null ? (
        <p className="repo-picker-loading">Loading your repos…</p>
      ) : shown.length === 0 ? (
        <p className="repo-picker-loading">
          No matches — press enter to load <code>{query.trim() || 'owner/repo'}</code> directly.
        </p>
      ) : (
        <ul className="repo-list">
          {shown.map((r) => (
            <li key={r.fullName}>
              <button
                className={`repo-item${r.fullName === currentRepo ? ' current' : ''}`}
                onClick={() => onPick(r.fullName)}
              >
                <span className="repo-name">
                  {r.fullName}
                  {r.private && <span className="repo-private">private</span>}
                </span>
                {r.description && <span className="repo-desc">{r.description}</span>}
                <span className="repo-meta">
                  {r.language && <span>{r.language}</span>}
                  {r.stars > 0 && <span>★ {r.stars}</span>}
                  <span>{agoLabel(r.pushedAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {showInstallLink && (
        <a className="install-link" href="/api/auth/install">
          missing a repo? add it to the gheart installation →
        </a>
      )}
    </div>
  );
}
