import type { PRProfile } from '../shared/types';
import { heuristicSummary, matchScore } from './summarize';

function svgClip(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

// Tiny animated SVGs stand in for the "clip of the UI changes" so demo mode
// works fully offline. Portrait, like the phone screenshots authors attach —
// the hero renders them full-bleed with object-fit: cover, so content stays
// clear of the outer ~40px on every side.
const DARK_MODE_CLIP = svgClip(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 640">
  <rect width="400" height="640" fill="#f5f5f7">
    <animate attributeName="fill" values="#f5f5f7;#f5f5f7;#17171f;#17171f;#f5f5f7" dur="4s" repeatCount="indefinite"/>
  </rect>
  <rect x="48" y="88" width="304" height="34" rx="8" fill="#d9d9e3">
    <animate attributeName="fill" values="#d9d9e3;#d9d9e3;#2b2b3d;#2b2b3d;#d9d9e3" dur="4s" repeatCount="indefinite"/>
  </rect>
  <rect x="48" y="150" width="220" height="16" rx="5" fill="#c3c3cf">
    <animate attributeName="fill" values="#c3c3cf;#c3c3cf;#3a3a52;#3a3a52;#c3c3cf" dur="4s" repeatCount="indefinite"/>
  </rect>
  <rect x="48" y="180" width="270" height="16" rx="5" fill="#c3c3cf">
    <animate attributeName="fill" values="#c3c3cf;#c3c3cf;#3a3a52;#3a3a52;#c3c3cf" dur="4s" repeatCount="indefinite"/>
  </rect>
  <rect x="48" y="210" width="180" height="16" rx="5" fill="#c3c3cf">
    <animate attributeName="fill" values="#c3c3cf;#c3c3cf;#3a3a52;#3a3a52;#c3c3cf" dur="4s" repeatCount="indefinite"/>
  </rect>
  <rect x="48" y="260" width="304" height="120" rx="14" fill="#e4e4ec">
    <animate attributeName="fill" values="#e4e4ec;#e4e4ec;#22222f;#22222f;#e4e4ec" dur="4s" repeatCount="indefinite"/>
  </rect>
  <rect x="48" y="410" width="240" height="16" rx="5" fill="#c3c3cf">
    <animate attributeName="fill" values="#c3c3cf;#c3c3cf;#3a3a52;#3a3a52;#c3c3cf" dur="4s" repeatCount="indefinite"/>
  </rect>
  <rect x="48" y="440" width="200" height="16" rx="5" fill="#c3c3cf">
    <animate attributeName="fill" values="#c3c3cf;#c3c3cf;#3a3a52;#3a3a52;#c3c3cf" dur="4s" repeatCount="indefinite"/>
  </rect>
  <circle cx="330" cy="530" r="26" fill="#ffcf33">
    <animate attributeName="fill" values="#ffcf33;#ffcf33;#8f9dff;#8f9dff;#ffcf33" dur="4s" repeatCount="indefinite"/>
  </circle>
  <text x="48" y="540" font-family="sans-serif" font-size="16" fill="#666">
    <animate attributeName="fill" values="#666;#666;#aab;#aab;#666" dur="4s" repeatCount="indefinite"/>
    toggling theme…
  </text>
</svg>`);

const BUTTON_CLIP = svgClip(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 640">
  <rect width="400" height="640" fill="#101018"/>
  <rect x="70" y="120" width="260" height="150" rx="16" fill="#1a1a26"/>
  <rect x="70" y="300" width="200" height="14" rx="5" fill="#2b2b3c"/>
  <rect x="70" y="326" width="150" height="14" rx="5" fill="#2b2b3c"/>
  <rect x="112" y="400" width="176" height="54" rx="27" fill="#e94074">
    <animate attributeName="width" values="176;188;176" dur="1.6s" repeatCount="indefinite"/>
    <animate attributeName="x" values="112;106;112" dur="1.6s" repeatCount="indefinite"/>
  </rect>
  <text x="200" y="433" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#fff">Buy now</text>
  <circle cx="200" cy="427" r="0" fill="#ffffff" opacity="0.35">
    <animate attributeName="r" values="0;80" dur="1.6s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.35;0" dur="1.6s" repeatCount="indefinite"/>
  </circle>
</svg>`);

const CHART_CLIP = svgClip(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 640">
  <rect width="400" height="640" fill="#0e1420"/>
  <text x="56" y="120" font-family="sans-serif" font-size="17" fill="#8ea2c6">live dashboard ✨</text>
  <rect x="56" y="150" width="130" height="12" rx="4" fill="#1c2941"/>
  <g fill="#4f8ef7">
    <rect x="64" y="460" width="40" height="40"><animate attributeName="height" values="40;140;40" dur="2.4s" repeatCount="indefinite"/><animate attributeName="y" values="460;360;460" dur="2.4s" repeatCount="indefinite"/></rect>
    <rect x="124" y="400" width="40" height="100"><animate attributeName="height" values="100;220;100" dur="2.4s" begin="0.2s" repeatCount="indefinite"/><animate attributeName="y" values="400;280;400" dur="2.4s" begin="0.2s" repeatCount="indefinite"/></rect>
    <rect x="184" y="420" width="40" height="80"><animate attributeName="height" values="80;180;80" dur="2.4s" begin="0.4s" repeatCount="indefinite"/><animate attributeName="y" values="420;320;420" dur="2.4s" begin="0.4s" repeatCount="indefinite"/></rect>
    <rect x="244" y="380" width="40" height="120"><animate attributeName="height" values="120;240;120" dur="2.4s" begin="0.6s" repeatCount="indefinite"/><animate attributeName="y" values="380;260;380" dur="2.4s" begin="0.6s" repeatCount="indefinite"/></rect>
    <rect x="304" y="440" width="40" height="60"><animate attributeName="height" values="60;160;60" dur="2.4s" begin="0.8s" repeatCount="indefinite"/><animate attributeName="y" values="440;340;440" dur="2.4s" begin="0.8s" repeatCount="indefinite"/></rect>
  </g>
  <line x1="56" y1="500" x2="344" y2="500" stroke="#1c2941" stroke-width="2"/>
</svg>`);

function avatar(seed: string, bg: string): string {
  const initials = seed
    .split(/[-_]/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
  return svgClip(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="${bg}"/>
  <text x="40" y="52" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="#fff">${initials}</text>
</svg>`);
}

interface Seed {
  number: number;
  title: string;
  body: string;
  author: string;
  avatarBg: string;
  branch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  commits: number;
  comments: number;
  ageDays: number;
  draft?: boolean;
  ci: PRProfile['ci'];
  labels: PRProfile['labels'];
  files: PRProfile['topFiles'];
  media?: PRProfile['media'];
  greenFlags?: string[];
  redFlags?: string[];
}

const SEEDS: Seed[] = [
  {
    number: 342,
    title: 'feat: add dark mode toggle to settings',
    body: 'Adds a theme switcher with system preference detection. Persists the choice to localStorage and respects prefers-color-scheme on first load.',
    author: 'nightowl-dev',
    avatarBg: '#5b4b8a',
    branch: 'feat/dark-mode',
    additions: 214,
    deletions: 38,
    changedFiles: 9,
    commits: 4,
    comments: 3,
    ageDays: 2,
    ci: 'passing',
    labels: [
      { name: 'enhancement', color: 'a2eeef' },
      { name: 'frontend', color: 'fbca04' },
    ],
    files: [
      { path: 'src/theme/ThemeProvider.tsx', additions: 96, deletions: 0 },
      { path: 'src/components/Settings.tsx', additions: 54, deletions: 12 },
      { path: 'src/styles/tokens.css', additions: 40, deletions: 20 },
      { path: 'src/theme/useTheme.test.ts', additions: 24, deletions: 6 },
    ],
    media: { type: 'image', url: DARK_MODE_CLIP, alt: 'Dark mode toggle demo' },
  },
  {
    // C001 from the gheart-eval corpus: seeded IDOR — the red-flag card.
    number: 402,
    title: 'feat: let support agents look up any order by id',
    body: 'Adds GET /api/orders/:id for the support panel so agents can pull up an order directly. Returns the full order record as JSON.',
    author: 'ship-it-sam',
    avatarBg: '#8a4b2d',
    branch: 'feat/order-lookup',
    additions: 74,
    deletions: 2,
    changedFiles: 3,
    commits: 2,
    comments: 1,
    ageDays: 1,
    ci: 'passing',
    labels: [
      { name: 'feature', color: 'a2eeef' },
      { name: 'support-tools', color: 'fbca04' },
    ],
    files: [
      { path: 'server/orders/lookup.ts', additions: 48, deletions: 0 },
      { path: 'server/routes.ts', additions: 14, deletions: 2 },
      { path: 'src/support/OrderPanel.tsx', additions: 12, deletions: 0 },
    ],
    greenFlags: ['Small, focused diff — one endpoint, one panel'],
    redFlags: [
      'IDOR: GET /api/orders/:id returns any order with no ownership or role check',
      'No test covers the unauthorized-caller path',
    ],
  },
  {
    number: 351,
    title: 'fix: cart total ignores coupon when quantity changes',
    body: 'The memoized total was keyed on item ids only, so bumping a quantity kept the stale discount. Recomputes when quantities or coupons change and adds a regression test.',
    author: 'bug-whisperer',
    avatarBg: '#b23a48',
    branch: 'fix/coupon-total',
    additions: 31,
    deletions: 9,
    changedFiles: 2,
    commits: 1,
    comments: 5,
    ageDays: 0,
    ci: 'passing',
    labels: [{ name: 'bug', color: 'd73a4a' }],
    files: [
      { path: 'src/cart/useCartTotal.ts', additions: 14, deletions: 9 },
      { path: 'src/cart/useCartTotal.test.ts', additions: 17, deletions: 0 },
    ],
  },
  {
    // C002-iter2: the loop-closure star. Iter1 (#412) was rejected for landing
    // a schema drop with no rollback and no tests — that rejection is seeded
    // into the brain by scripts/seed-brain.ts, so this card arrives with a
    // high learned score citing the memory.
    number: 414,
    title: 'feat: drop legacy sessions table — now with rollback + tests',
    body: 'Second attempt at the legacy sessions migration (first round: #412). Adds a down() rollback that restores the table from the archive, plus a migration test that runs up/down against a scratch database.',
    author: 'schema-shepherd',
    avatarBg: '#2d5a8a',
    branch: 'feat/drop-legacy-sessions-v2',
    additions: 128,
    deletions: 41,
    changedFiles: 4,
    commits: 3,
    comments: 2,
    ageDays: 0,
    ci: 'passing',
    labels: [{ name: 'migration', color: '5319e7' }],
    files: [
      { path: 'db/migrations/0042_drop_legacy_sessions.ts', additions: 62, deletions: 8 },
      { path: 'db/migrations/0042_drop_legacy_sessions.test.ts', additions: 44, deletions: 0 },
      { path: 'services/sessions/store.ts', additions: 18, deletions: 30 },
      { path: 'docs/runbooks/sessions-migration.md', additions: 4, deletions: 3 },
    ],
    greenFlags: [
      'down() rollback restores the table from archive before dropping',
      'Migration test exercises up → down → up on a scratch DB',
    ],
  },
  {
    number: 327,
    title: 'refactor: migrate payment service to async/await',
    body: 'Replaces the promise-chain spaghetti in PaymentService with async/await. No behavior change intended; existing integration tests all pass.',
    author: 'callback-hell-survivor',
    avatarBg: '#2d6a4f',
    branch: 'refactor/payments-async',
    additions: 412,
    deletions: 471,
    changedFiles: 14,
    commits: 7,
    comments: 11,
    ageDays: 6,
    ci: 'pending',
    labels: [{ name: 'refactor', color: '6f42c1' }],
    files: [
      { path: 'services/payments/PaymentService.ts', additions: 180, deletions: 220 },
      { path: 'services/payments/retry.ts', additions: 64, deletions: 88 },
      { path: 'services/payments/webhooks.ts', additions: 58, deletions: 71 },
      { path: 'services/payments/PaymentService.test.ts', additions: 44, deletions: 30 },
    ],
  },
  {
    number: 355,
    title: 'feat: micro-interaction polish on checkout CTA',
    body: 'Adds a subtle ripple + hover scale to the "Buy now" button. Video of the interaction below. Bounces were down 4% in the A/B test.',
    author: 'pixel-perfectionist',
    avatarBg: '#c86f2c',
    branch: 'feat/cta-ripple',
    additions: 58,
    deletions: 4,
    changedFiles: 3,
    commits: 2,
    comments: 1,
    ageDays: 1,
    ci: 'passing',
    labels: [
      { name: 'ui', color: 'fbca04' },
      { name: 'a/b-tested', color: '0e8a16' },
    ],
    files: [
      { path: 'src/components/BuyButton.tsx', additions: 32, deletions: 4 },
      { path: 'src/styles/button.css', additions: 26, deletions: 0 },
    ],
    media: { type: 'image', url: BUTTON_CLIP, alt: 'Buy now button ripple animation' },
  },
  {
    // C005: the clean decoy — everything a reviewer wants to see. Instant yes.
    number: 418,
    title: 'fix: reject negative quantities at the cart API boundary',
    body: 'A crafted request could POST a negative quantity and drive the cart total below zero. Validates quantity at the API boundary and returns 422. The regression test reproduces the exploit first, then asserts the fix.',
    author: 'belt-and-braces',
    avatarBg: '#3d7068',
    branch: 'fix/negative-quantity',
    additions: 26,
    deletions: 2,
    changedFiles: 2,
    commits: 1,
    comments: 0,
    ageDays: 0,
    ci: 'passing',
    labels: [{ name: 'bug', color: 'd73a4a' }],
    files: [
      { path: 'server/cart/validate.ts', additions: 11, deletions: 2 },
      { path: 'server/cart/validate.test.ts', additions: 15, deletions: 0 },
    ],
    greenFlags: [
      'Input validated at the API boundary, not in the UI',
      'Regression test reproduces the exploit before asserting the fix',
    ],
  },
  {
    number: 349,
    title: 'chore: bump 47 dependencies because dependabot never sleeps',
    body: 'Weekly dependency roll-up. Mostly patch bumps; lodash and axios get minor versions. Lockfile only.',
    author: 'dependabot-fan',
    avatarBg: '#4a5568',
    branch: 'chore/deps-weekly',
    additions: 1876,
    deletions: 1742,
    changedFiles: 2,
    commits: 1,
    comments: 0,
    ageDays: 4,
    ci: 'passing',
    labels: [{ name: 'dependencies', color: '0366d6' }],
    files: [
      { path: 'package-lock.json', additions: 1861, deletions: 1729 },
      { path: 'package.json', additions: 15, deletions: 13 },
    ],
  },
  {
    number: 333,
    title: 'feat: real-time analytics dashboard (WIP)',
    body: 'First cut of the live dashboard — websocket feed, animated bar charts, per-region drill-down. Still needs error states and tests, opening early for design feedback.',
    author: 'dashboard-dreamer',
    avatarBg: '#1d6fa5',
    branch: 'feat/live-dashboard',
    additions: 1204,
    deletions: 87,
    changedFiles: 23,
    commits: 12,
    comments: 8,
    ageDays: 9,
    draft: true,
    ci: 'failing',
    labels: [
      { name: 'epic', color: '5319e7' },
      { name: 'needs-design-review', color: 'e99695' },
    ],
    files: [
      { path: 'src/dashboard/LiveDashboard.tsx', additions: 340, deletions: 0 },
      { path: 'src/dashboard/useMetricsSocket.ts', additions: 188, deletions: 0 },
      { path: 'src/dashboard/charts/BarRace.tsx', additions: 176, deletions: 0 },
      { path: 'server/metrics/stream.ts', additions: 150, deletions: 12 },
    ],
    media: { type: 'image', url: CHART_CLIP, alt: 'Animated dashboard preview' },
  },
  {
    number: 358,
    title: 'docs: explain why we do NOT use microservices (yet)',
    body: 'Adds an ADR documenting the decision to stay with the modular monolith until we hit real scaling limits. Includes the trade-off table from the architecture offsite.',
    author: 'monolith-enjoyer',
    avatarBg: '#7d5ba6',
    branch: 'docs/adr-monolith',
    additions: 142,
    deletions: 0,
    changedFiles: 1,
    commits: 1,
    comments: 19,
    ageDays: 3,
    ci: 'none',
    labels: [{ name: 'documentation', color: '0075ca' }],
    files: [{ path: 'docs/adr/0014-modular-monolith.md', additions: 142, deletions: 0 }],
  },
  {
    number: 361,
    title: 'fix: off-by-one in pagination made page 2 show page 3',
    body: 'Classic. offset = page * size should have been (page - 1) * size. Users paging through orders skipped 20 rows. Adds a table-driven test over the boundary cases.',
    author: 'zero-indexed',
    avatarBg: '#00695c',
    branch: 'fix/pagination-offset',
    additions: 12,
    deletions: 3,
    changedFiles: 2,
    commits: 1,
    comments: 2,
    ageDays: 0,
    ci: 'passing',
    labels: [
      { name: 'bug', color: 'd73a4a' },
      { name: 'good first review', color: '7057ff' },
    ],
    files: [
      { path: 'server/orders/paginate.ts', additions: 2, deletions: 3 },
      { path: 'server/orders/paginate.test.ts', additions: 10, deletions: 0 },
    ],
  },
  {
    number: 340,
    title: 'perf: cache expensive permission checks per request',
    body: 'Permission resolution was hitting the DB up to 40x per request. Adds a request-scoped memo cache. P95 latency on /api/projects drops from 480ms to 95ms in staging.',
    author: 'latency-hunter',
    avatarBg: '#9a3b90',
    branch: 'perf/permission-cache',
    additions: 88,
    deletions: 21,
    changedFiles: 5,
    commits: 3,
    comments: 6,
    ageDays: 5,
    ci: 'passing',
    labels: [{ name: 'performance', color: '0e8a16' }],
    files: [
      { path: 'server/auth/permissionCache.ts', additions: 52, deletions: 0 },
      { path: 'server/auth/middleware.ts', additions: 16, deletions: 18 },
      { path: 'server/auth/permissionCache.test.ts', additions: 20, deletions: 3 },
    ],
  },
];

export function mockPRs(repo = 'demo/lovable-app'): PRProfile[] {
  return SEEDS.map((s) => {
    const summaryInput = {
      title: s.title,
      body: s.body,
      files: s.files,
      additions: s.additions,
      deletions: s.deletions,
      changedFiles: s.changedFiles,
      ci: s.ci,
      draft: s.draft ?? false,
    };
    const summary = heuristicSummary(summaryInput);
    const createdAt = new Date(Date.now() - s.ageDays * 86_400_000).toISOString();
    return {
      id: `${repo}#${s.number}`,
      number: s.number,
      repo,
      title: s.title,
      url: `https://github.com/${repo}/pull/${s.number}`,
      author: { login: s.author, avatarUrl: avatar(s.author, s.avatarBg) },
      branch: s.branch,
      baseBranch: 'main',
      // Stable synthetic SHA so a mock PR keys the same preview every run.
      headSha: `mock${s.number.toString(16).padStart(8, '0')}`,
      createdAt,
      ageDays: s.ageDays,
      draft: s.draft ?? false,
      tldr: summary.tldr,
      eli5: summary.eli5,
      tags: summary.tags,
      stats: {
        additions: s.additions,
        deletions: s.deletions,
        changedFiles: s.changedFiles,
        commits: s.commits,
        comments: s.comments,
      },
      ci: s.ci,
      labels: s.labels,
      topFiles: s.files,
      media: s.media,
      matchScore: matchScore(summaryInput),
      greenFlags: s.greenFlags,
      redFlags: s.redFlags,
    };
  });
}
