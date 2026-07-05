const STEPS = [
  { key: 'approve', arrow: '→', emoji: '💚', title: 'Swipe right', body: 'Approve. Submitted as you, counts for branch protection.' },
  { key: 'reject', arrow: '←', emoji: '💔', title: 'Swipe left', body: 'Request changes. Six reason chips capture why.' },
  { key: 'skip', arrow: '↑', emoji: '↷', title: 'Swipe up', body: 'Skip. No review sent, card comes back later.' },
] as const;

const BRAIN_STEPS = [
  {
    emoji: '🧠',
    title: 'Capture',
    body: 'Every swipe is zero-schlep knowledge: a left swipe asks why (too big · no tests · touches auth · wrong layer · duplicate · vibe off) and stores the verdict.',
  },
  {
    emoji: '💯',
    title: 'Memory',
    body: 'Each card gets a learned compatibility score with a citation — "you rejected #412 for having no tests, this revision fixes exactly that."',
  },
  {
    emoji: '🤖',
    title: 'Pre-check',
    body: 'Agents ask the brain before opening a PR, see the predicted verdict, and self-correct — the fix arrives citing the memory it addressed.',
  },
] as const;

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="logo">
          <span className="logo-heart">💚</span> gheart
        </div>
        <button className="landing-nav-cta" onClick={onEnter}>
          Start swiping →
        </button>
      </nav>

      <header className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">🧠 learns from every swipe</span>
          <h1>Tinder for pull request reviews</h1>
          <p className="landing-sub">
            Swipe right to approve, left to request changes, up to skip. Every open PR gets a
            dating-style profile — a TL;DR, an &quot;explain like I&apos;m five&quot;, and vitals
            that matter.
          </p>
          <div className="landing-cta-row">
            <button className="github-login" onClick={onEnter}>
              <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              Sign in with GitHub
            </button>
            <span className="landing-cta-hint">or try the demo deck — no setup needed</span>
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden>
          <div className="landing-mock-card back">
            <div className="landing-mock-hero red">📦</div>
          </div>
          <div className="landing-mock-card front">
            <div className="landing-mock-stamp">MATCH</div>
            <div className="landing-mock-hero green">✨</div>
            <div className="landing-mock-body">
              <div className="landing-mock-title">Add kind-aware PR previews</div>
              <div className="landing-mock-meta">octocat · gheart#414 · today</div>
              <div className="match-bar">
                <div className="match-fill good" style={{ width: '92%' }} />
              </div>
              <div className="landing-mock-brain">🧠 92% your type — fixes the #412 rejection</div>
            </div>
          </div>
        </div>
      </header>

      <section className="landing-section">
        <h2>Three gestures, real reviews</h2>
        <div className="landing-steps">
          {STEPS.map((s) => (
            <div key={s.key} className="landing-step">
              <div className="landing-step-arrow">{s.arrow}</div>
              <div className="landing-step-emoji">{s.emoji}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <h2>Capture → memory → execution</h2>
        <p className="landing-section-sub">
          Because your review queue deserves the same energy as your dating queue.
        </p>
        <div className="landing-brain-grid">
          {BRAIN_STEPS.map((b) => (
            <div key={b.title} className="landing-brain-card">
              <div className="landing-brain-emoji">{b.emoji}</div>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <button className="github-login" onClick={onEnter}>
          Start swiping →
        </button>
        <p className="landing-fineprint">
          gheart is a GitHub App with least-privilege access: pull requests read/write on only the
          repos where you install it. Swipes are real reviews, submitted as you.
        </p>
      </footer>
    </div>
  );
}
