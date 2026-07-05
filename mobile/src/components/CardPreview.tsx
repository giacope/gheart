import type { PRProfile, PreviewKind } from '../../shared/types';
import TerminalPlayer from './TerminalPlayer';

const KIND_BADGE: Record<PreviewKind, string> = {
  frontend: '▶ UI preview',
  cli: '⌘ CLI demo',
  api: '⇄ API call',
  migration: '🗄 schema diff',
  docs: '📖 docs',
  tests: '🧪 tests',
  generic: '✎ diff',
};

/**
 * The card "profile photo". Precedence: an author-provided screenshot/clip wins
 * (a real artifact a human chose), then the auto-generated preview, then a
 * shimmer while it's still cooking, then the emoji fallback.
 */
export default function CardPreview({ pr, fallbackEmoji }: { pr: PRProfile; fallbackEmoji: string }) {
  // 1. Author media — unchanged behavior.
  if (pr.media) {
    return (
      <>
        {pr.media.type === 'video' ? (
          <video src={pr.media.url} autoPlay muted loop playsInline className="hero-media" />
        ) : (
          <img src={pr.media.url} alt={pr.media.alt ?? 'UI change preview'} className="hero-media" />
        )}
        <span className="clip-badge">▶ UI preview</span>
      </>
    );
  }

  const preview = pr.preview;

  // 2. Generated preview, ready.
  if (preview?.status === 'ready' && preview.artifact) {
    const a = preview.artifact;
    const badge = <span className="clip-badge">{KIND_BADGE[preview.kind]}</span>;
    const caption = preview.caption ?? KIND_BADGE[preview.kind];
    switch (a.format) {
      case 'svg':
        return (
          <>
            <img src={a.dataUri} alt={caption} className="hero-media" />
            {badge}
          </>
        );
      case 'image':
        return (
          <>
            <img src={a.url} alt={a.alt ?? caption} className="hero-media" />
            {badge}
          </>
        );
      case 'video':
        return (
          <>
            <video src={a.url} autoPlay muted loop playsInline className="hero-media" />
            {badge}
          </>
        );
      case 'html':
        return (
          <>
            <iframe
              className="hero-media hero-frame"
              srcDoc={a.srcdoc}
              sandbox=""
              scrolling="no"
              title={caption}
              tabIndex={-1}
            />
            {badge}
          </>
        );
      case 'terminal':
        return (
          <>
            <TerminalPlayer frames={a.frames} cols={a.cols} />
            {badge}
          </>
        );
    }
  }

  // 3. Still generating (live path, before the background job finishes).
  if (preview?.status === 'generating') {
    return (
      <div className="hero-shimmer" aria-hidden>
        <span className="shimmer-label">🎬 cooking a preview…</span>
      </div>
    );
  }

  // 4. Nothing to show — the original emoji fallback.
  return (
    <div className="hero-fallback" aria-hidden>
      <span className="hero-emoji">{fallbackEmoji}</span>
    </div>
  );
}
