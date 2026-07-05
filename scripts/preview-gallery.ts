/**
 * QA/demo tool: render one synthesized preview per kind into a single HTML page
 * at real card-hero dimensions, so the artifacts can be eyeballed without the
 * full auth flow. Prints HTML to stdout.
 *
 *   npx tsx scripts/preview-gallery.ts > /tmp/gallery.html
 */
import type { FileStat, PRProfile } from '../shared/types';
import { synthesizePreview } from '../server/preview/generate';

function pr(over: Partial<PRProfile> & { topFiles: FileStat[]; title: string }): PRProfile {
  return {
    id: `demo/app#${over.number ?? 1}`,
    number: over.number ?? 1,
    repo: 'demo/lovable-app',
    url: '#',
    author: { login: 'dev', avatarUrl: '' },
    branch: 'feat/x',
    baseBranch: 'main',
    headSha: 'abc',
    createdAt: new Date(0).toISOString(),
    ageDays: 1,
    draft: false,
    eli5: '',
    tldr: over.tldr ?? 'A representative change to the codebase.',
    tags: over.tags ?? [],
    stats: over.stats ?? { additions: 120, deletions: 24, changedFiles: 4, commits: 2, comments: 1 },
    ci: 'passing',
    labels: [],
    matchScore: 60,
    ...over,
  };
}

const f = (...paths: string[]): FileStat[] => paths.map((path) => ({ path, additions: 30, deletions: 4 }));

const SAMPLES: PRProfile[] = [
  pr({ number: 1, title: 'feat: add dark mode toggle to settings', topFiles: f('src/theme/Toggle.tsx', 'src/styles/tokens.css'), tags: ['feature', 'ui'] }),
  pr({ number: 2, title: 'feat: add --json output flag to the exporter', topFiles: f('cmd/export.go', 'internal/flags.go'), tldr: 'Adds a --json flag.' }),
  pr({ number: 3, title: 'feat: create POST /api/orders endpoint', topFiles: f('server/routes/orders.ts', 'server/db.ts') }),
  pr({ number: 4, title: 'feat: add status column to orders table', topFiles: f('db/migrations/003_add_status.sql'), tldr: 'ALTER TABLE orders ADD status.' }),
  pr({ number: 5, title: 'docs: explain why we avoid microservices', topFiles: f('docs/adr/0014-monolith.md'), tldr: 'An ADR documenting the modular-monolith decision.' }),
  pr({ number: 6, title: 'test: cover pagination boundary cases', topFiles: f('server/orders/paginate.test.ts'), stats: { additions: 96, deletions: 0, changedFiles: 1, commits: 1, comments: 0 } }),
  pr({ number: 7, title: 'refactor: split the config loader', topFiles: f('lib/config.ts', 'lib/env.ts'), stats: { additions: 210, deletions: 180, changedFiles: 6, commits: 3, comments: 2 } }),
];

const tiles = SAMPLES.map((p) => {
  const pv = synthesizePreview(p, 'now');
  const a = pv.artifact!;
  let inner = '';
  if (a.format === 'svg') inner = `<img class="hero" src="${a.dataUri}"/>`;
  else if (a.format === 'html') inner = `<iframe class="hero" sandbox="" scrolling="no" srcdoc="${a.srcdoc.replace(/"/g, '&quot;')}"></iframe>`;
  else if (a.format === 'terminal')
    inner = `<div class="hero term" data-frames='${JSON.stringify(a.frames).replace(/'/g, '&#39;')}'></div>`;
  return `<figure><div class="card">${inner}<span class="badge">${pv.caption}</span></div>
    <figcaption><b>${pv.kind}</b> · ${p.title}</figcaption></figure>`;
}).join('\n');

// A small terminal player just for the gallery page (the real app uses the React one).
const termScript = `
for (const el of document.querySelectorAll('.term')) {
  const frames = JSON.parse(el.dataset.frames);
  const body = document.createElement('div'); body.className = 'tbody'; el.appendChild(body);
  async function run() {
    while (true) {
      body.innerHTML = ''; const printed = [];
      for (const fr of frames) {
        const line = document.createElement('div'); line.className = 'tl ' + cls(fr.text); body.appendChild(line);
        if (fr.text.startsWith('$ ')) { for (let i=2;i<=fr.text.length;i++){ line.textContent = fr.text.slice(0,i); await sleep(26);} }
        else line.textContent = fr.text;
        await sleep(fr.delayMs);
      }
      await sleep(1500);
    }
  }
  function cls(t){ return t.startsWith('$ ')?'c-cmd':t[0]==='✓'?'c-ok':t[0]==='✗'?'c-err':t[0]==='▸'?'c-note':'c-out'; }
  const sleep = (ms) => new Promise(r=>setTimeout(r,ms));
  run();
}`;

process.stdout.write(`<!doctype html><html><head><meta charset="utf-8"><style>
:root{--bg:#0d0d14;--card:#191924;--card2:#20202e;--muted:#9a9ab0;--green:#35d07f;--red:#ff5864;--blue:#58a6ff;--text:#f2f2f7}
body{margin:0;background:radial-gradient(1200px 800px at 50% -10%,#232338,#0d0d14 60%);color:var(--text);
  font-family:-apple-system,'Segoe UI',system-ui,sans-serif;padding:28px}
h1{font-size:20px;margin:0 0 20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:22px}
figure{margin:0}
.card{position:relative;height:175px;border-radius:16px 16px 0 0;overflow:hidden;background:var(--card2);
  border:1px solid #2b2b3c;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.hero{width:100%;height:100%;border:0;display:block;object-fit:cover}
.badge{position:absolute;top:12px;right:12px;font-size:11px;font-weight:700;background:rgba(0,0,0,.6);border-radius:999px;padding:4px 10px}
figcaption{font-size:12.5px;color:var(--muted);padding:9px 4px;border:1px solid #2b2b3c;border-top:0;border-radius:0 0 12px 12px;background:var(--card)}
figcaption b{color:var(--text);text-transform:uppercase;letter-spacing:.4px;font-size:11px}
.term{background:linear-gradient(180deg,#0b0b12,#14141d);padding:12px 14px;font:12.5px/1.5 ui-monospace,Menlo,monospace;color:var(--muted)}
.tbody{display:flex;flex-direction:column;gap:1px}.tl{white-space:pre}
.c-cmd{color:var(--text)}.c-ok{color:var(--green)}.c-err{color:var(--red)}.c-note{color:var(--blue)}
</style></head><body><h1>💚 gheart — generated PR previews (one per kind, at hero size)</h1>
<div class="grid">${tiles}</div><script>${termScript}</script></body></html>`);
