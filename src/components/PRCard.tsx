import type { CiState, PRProfile } from '../../shared/types';

const CI_BADGE: Record<CiState, { icon: string; label: string; cls: string }> = {
  passing: { icon: '✓', label: 'CI passing', cls: 'ci-passing' },
  failing: { icon: '✗', label: 'CI failing', cls: 'ci-failing' },
  pending: { icon: '◷', label: 'CI running', cls: 'ci-pending' },
  none: { icon: '—', label: 'no CI', cls: 'ci-none' },
};

const TAG_EMOJI: Record<string, string> = {
  bugfix: '🐛',
  feature: '✨',
  refactor: '🧹',
  docs: '📚',
  tests: '🧪',
  chore: '🔧',
  performance: '⚡',
  security: '🔒',
  ui: '🎨',
};

function bannerEmoji(pr: PRProfile): string {
  for (const t of pr.tags) if (TAG_EMOJI[t]) return TAG_EMOJI[t];
  return '📦';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'an easy yes';
  if (score >= 60) return 'looking good';
  if (score >= 40) return 'needs a real look';
  return 'proceed with caution';
}

export default function PRCard({ pr }: { pr: PRProfile }) {
  const ci = CI_BADGE[pr.ci];
  return (
    <article className="pr-card">
      <div className="card-hero">
        {pr.media ? (
          pr.media.type === 'video' ? (
            <video src={pr.media.url} autoPlay muted loop playsInline className="hero-media" />
          ) : (
            <img src={pr.media.url} alt={pr.media.alt ?? 'UI change preview'} className="hero-media" />
          )
        ) : (
          <div className="hero-fallback" aria-hidden>
            <span className="hero-emoji">{bannerEmoji(pr)}</span>
          </div>
        )}
        {pr.media && <span className="clip-badge">▶ UI preview</span>}
        <div className="hero-shade" />
        <div className="hero-title">
          <h2>
            {pr.title}
            <span className="hero-age">
              , {pr.ageDays === 0 ? 'today' : `${pr.ageDays}d`}
            </span>
          </h2>
          <div className="hero-author">
            <img src={pr.author.avatarUrl} alt="" className="avatar" />
            <span>
              {pr.author.login} · {pr.repo}#{pr.number}
              {pr.draft && <em className="draft-pill">draft</em>}
            </span>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="match-row">
          <div className="match-bar">
            <div
              className={`match-fill ${pr.matchScore >= 60 ? 'good' : pr.matchScore >= 40 ? 'meh' : 'bad'}`}
              style={{ width: `${pr.matchScore}%` }}
            />
          </div>
          <span className="match-text">
            {pr.matchScore}% mergeable — {scoreLabel(pr.matchScore)}
          </span>
        </div>

        <div className="stat-chips">
          <span className="chip add">+{pr.stats.additions.toLocaleString()}</span>
          <span className="chip del">−{pr.stats.deletions.toLocaleString()}</span>
          <span className="chip">{pr.stats.changedFiles} files</span>
          <span className="chip">{pr.stats.commits} commits</span>
          <span className="chip">{pr.stats.comments} 💬</span>
          <span className={`chip ${ci.cls}`}>
            {ci.icon} {ci.label}
          </span>
        </div>

        <section>
          <h3>TL;DR</h3>
          <p>{pr.tldr}</p>
        </section>

        <section>
          <h3>Explain like I&apos;m five</h3>
          <p className="eli5">“{pr.eli5}”</p>
        </section>

        {pr.tags.length > 0 && (
          <div className="tag-row">
            {pr.tags.map((t) => (
              <span key={t} className="tag">
                {TAG_EMOJI[t] ? `${TAG_EMOJI[t]} ` : ''}
                {t}
              </span>
            ))}
          </div>
        )}

        {pr.topFiles.length > 0 && (
          <section>
            <h3>Biggest changes</h3>
            <ul className="file-list">
              {pr.topFiles.map((f) => (
                <li key={f.path}>
                  <code>{f.path}</code>
                  <span>
                    <em className="add">+{f.additions}</em> <em className="del">−{f.deletions}</em>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="card-footer">
          <code className="branch">{pr.branch}</code> → <code className="branch">{pr.baseBranch}</code>
          {pr.labels.map((l) => (
            <span key={l.name} className="gh-label" style={{ borderColor: `#${l.color}`, color: `#${l.color}` }}>
              {l.name}
            </span>
          ))}
          <a href={pr.url} target="_blank" rel="noreferrer" className="open-link" onPointerDown={(e) => e.stopPropagation()}>
            open on GitHub ↗
          </a>
        </footer>
      </div>
    </article>
  );
}
