import type { PRProfile, PreviewArtifact, PreviewKind, TerminalFrame } from '../../shared/types';
import { CANVAS, esc, hashString, htmlArtifact, PALETTE as P, pick, svgArtifact } from './artifacts';

export interface GeneratedPreview {
  artifact: PreviewArtifact;
  caption: string;
}

export type Generator = (pr: PRProfile) => GeneratedPreview;

// ---------------------------------------------------------------------------
// Derivations shared across generators (deterministic per PR)
// ---------------------------------------------------------------------------

function seedOf(pr: PRProfile): number {
  return hashString(pr.id || `${pr.repo}#${pr.number}`);
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

/** A plausible binary name for the repo, e.g. demo/lovable-app -> lovable-app. */
function binaryName(pr: PRProfile): string {
  const name = (pr.repo.split('/')[1] || pr.repo).replace(/[^a-z0-9-]+/gi, '').toLowerCase();
  return name || 'app';
}

/** Pull a --flag out of the title, else invent one from the first noun. */
function derivedFlag(pr: PRProfile): string {
  const explicit = pr.title.match(/--[\w-]+/);
  if (explicit) return explicit[0];
  const word = pr.title.toLowerCase().match(/\b(json|watch|verbose|dry-run|force|quiet|debug|init)\b/);
  return word ? `--${word[0]}` : '--help';
}

function tableName(pr: PRProfile): string {
  const t = pr.title.toLowerCase();
  const pluralize = (w: string) => w.replace(/s$/, '') + 's';
  // "…orders table" — the word right before "table" is the table.
  const beforeTable = t.match(/\b([a-z]+?)s?\s+table\b/);
  if (beforeTable) return pluralize(beforeTable[1]);
  const noun = t.match(/\b(user|order|payment|session|account|event|post|invoice|product)s?\b/);
  if (noun) return pluralize(noun[1]);
  // Fall back to a filename like 003_create_orders.sql -> orders.
  const fromFile = pr.topFiles
    .map((f) => f.path)
    .join(' ')
    .match(/(?:create|add|alter|update)_([a-z]+)/i);
  return fromFile ? pluralize(fromFile[1].toLowerCase()) : 'records';
}

function httpMethod(pr: PRProfile): { verb: string; color: string } {
  const t = pr.title.toLowerCase();
  if (/\b(delete|remove|drop)\b/.test(t)) return { verb: 'DELETE', color: P.red };
  if (/\b(update|edit|patch|change)\b/.test(t)) return { verb: 'PATCH', color: P.amber };
  if (/\b(get|list|fetch|read|show)\b/.test(t)) return { verb: 'GET', color: P.blue };
  return { verb: 'POST', color: P.green };
}

function apiPath(pr: PRProfile): string {
  const routeFile = pr.topFiles.find((f) => /(routes?|api|controllers?|handlers?)/i.test(f.path));
  if (routeFile) {
    const seg = routeFile.path
      .replace(/\.[a-z]+$/i, '')
      .split('/')
      .filter((s) => !/^(src|api|routes?|controllers?|handlers?|index)$/i.test(s))
      .pop();
    if (seg) return `/api/${seg.replace(/[^a-z0-9-]/gi, '')}`;
  }
  return `/api/${binaryName(pr)}`;
}

// ---------------------------------------------------------------------------
// frontend — a live browser mock (HTML, CSS-only animation)
// ---------------------------------------------------------------------------

const frontend: Generator = (pr) => {
  const seed = seedOf(pr);
  const variant = pick(['theme', 'cta', 'grid'] as const, seed);
  const title = esc(truncate(pr.title.replace(/^(feat|fix|ui|refactor)(\([^)]*\))?:\s*/i, ''), 34));
  const addr = esc(`${binaryName(pr)}.app`);

  const chrome = (view: string) => `
<div class="win">
  <div class="bar">
    <span class="d" style="background:${P.red}"></span>
    <span class="d" style="background:${P.amber}"></span>
    <span class="d" style="background:${P.green}"></span>
    <span class="addr">${addr}</span>
  </div>
  <div class="view">${view}</div>
</div>`;

  let css = `
.win{width:100%;height:100%;display:flex;flex-direction:column;background:${P.card2}}
.bar{height:30px;display:flex;align-items:center;gap:7px;padding:0 12px;background:${P.card};border-bottom:1px solid #2b2b3c}
.d{width:10px;height:10px;border-radius:50%}
.addr{margin-left:10px;font:11px ui-monospace,monospace;color:${P.muted};background:${P.bg};padding:3px 12px;border-radius:8px}
.view{flex:1;position:relative;overflow:hidden;padding:16px 18px}
.h{font-size:15px;font-weight:800;letter-spacing:-.2px}
`;
  let view = '';

  if (variant === 'theme') {
    css += `
.view{transition:none;animation:day 5s ease-in-out infinite}
@keyframes day{0%,40%{background:#f5f5f7;color:#17171f}55%,95%{background:${P.bg};color:${P.text}}100%{background:#f5f5f7;color:#17171f}}
.sk{height:11px;border-radius:5px;margin-top:9px;background:currentColor;opacity:.16}
.toggle{position:absolute;right:16px;top:16px;width:44px;height:24px;border-radius:999px;background:${P.green};opacity:.9}
.knob{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;animation:slide 5s ease-in-out infinite}
@keyframes slide{0%,40%{left:3px}55%,95%{left:23px}100%{left:3px}}`;
    view = `<div class="h">${title}</div>
      <div class="sk" style="width:70%"></div><div class="sk" style="width:52%"></div><div class="sk" style="width:63%"></div>
      <div class="toggle"><span class="knob"></span></div>`;
  } else if (variant === 'cta') {
    css += `
.h{color:${P.text}}
.sk{height:10px;border-radius:5px;margin-top:9px;background:#fff;opacity:.12}
.cta{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);padding:13px 30px;border-radius:999px;
  font-weight:800;font-size:14px;color:#06281a;background:linear-gradient(90deg,#1fa864,${P.green});
  box-shadow:0 8px 24px rgba(53,208,127,.4);animation:pulse 1.8s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.06)}}
.ring{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:150px;height:46px;border-radius:999px;
  border:2px solid ${P.green};opacity:0;animation:ripple 1.8s ease-out infinite}
@keyframes ripple{0%{opacity:.5;transform:translate(-50%,-50%) scale(.8)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}`;
    view = `<div class="h">${title}</div><div class="sk" style="width:60%"></div>
      <span class="ring"></span><span class="cta">Get started</span>`;
  } else {
    css += `
.h{color:${P.text};margin-bottom:12px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.tile{height:46px;border-radius:10px;background:linear-gradient(135deg,${P.card},${P.card2});
  border:1px solid #2b2b3c;opacity:0;transform:translateY(10px);animation:rise .6s ease forwards}
.tile:nth-child(1){animation-delay:.1s}.tile:nth-child(2){animation-delay:.25s}.tile:nth-child(3){animation-delay:.4s}
.tile:nth-child(4){animation-delay:.55s}.tile:nth-child(5){animation-delay:.7s}.tile:nth-child(6){animation-delay:.85s}
.tile::after{content:'';display:block;width:34%;height:6px;border-radius:3px;margin:12px;background:${P.green};opacity:.7}
@keyframes rise{to{opacity:1;transform:none}}`;
    view = `<div class="h">${title}</div><div class="grid">${'<div class="tile"></div>'.repeat(6)}</div>`;
  }

  return { artifact: htmlArtifact(css, chrome(view)), caption: 'UI preview' };
};

// ---------------------------------------------------------------------------
// cli — a scripted terminal session (played by TerminalPlayer)
// ---------------------------------------------------------------------------

const cli: Generator = (pr) => {
  const cmd = binaryName(pr);
  const flag = derivedFlag(pr);
  const isFix = pr.tags.includes('bugfix') || /\bfix\b/i.test(pr.title);
  const frames: TerminalFrame[] = [
    { text: `$ ${cmd} ${flag}`.trim(), delayMs: 700 },
  ];
  if (isFix) {
    frames.push(
      { text: `resolving ${cmd} state…`, delayMs: 420 },
      { text: `✓ ${truncate(pr.title.replace(/^fix(\([^)]*\))?:\s*/i, ''), 40)}`, delayMs: 500 },
      { text: `  exit code 0 (was 1)`, delayMs: 1200 },
    );
  } else {
    frames.push(
      { text: `▸ ${truncate(pr.title.replace(/^(feat|add)(\([^)]*\))?:\s*/i, ''), 42)}`, delayMs: 460 },
      { text: `✓ done in 0.4s`, delayMs: 500 },
      { text: `  see ${cmd} ${flag} for more`, delayMs: 1200 },
    );
  }
  return { artifact: { format: 'terminal', frames, cols: 48 }, caption: 'CLI demo' };
};

// ---------------------------------------------------------------------------
// api — request → response (HTML)
// ---------------------------------------------------------------------------

const api: Generator = (pr) => {
  const { verb, color } = httpMethod(pr);
  const path = esc(apiPath(pr));
  const ok = verb !== 'DELETE';
  const status = ok ? '200 OK' : '204 No Content';
  const lines = ok
    ? ['{', `  "id": "${(seedOf(pr) % 9000) + 1000}",`, `  "ok": true,`, `  "resource": "${esc(binaryName(pr))}"`, '}']
    : ['{', '  "deleted": true', '}'];
  const body = lines
    .map((l, i) => `<div class="ln" style="animation-delay:${0.5 + i * 0.18}s">${esc(l)}</div>`)
    .join('');

  const css = `
.wrap{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:18px 22px}
.req{display:flex;align-items:center;gap:10px;font:13px ui-monospace,monospace}
.verb{font-weight:800;color:${color};border:1.5px solid ${color};border-radius:7px;padding:3px 9px;font-size:12px}
.path{color:${P.text}}
.arrow{color:${P.muted};animation:go 1.6s ease-in-out infinite}
@keyframes go{0%,100%{opacity:.3;transform:translateX(0)}50%{opacity:1;transform:translateX(4px)}}
.status{margin-left:6px;font-size:11px;font-weight:800;color:${ok ? P.green : P.muted};
  border-radius:999px;padding:3px 10px;background:${ok ? 'rgba(53,208,127,.14)' : 'rgba(154,154,176,.14)'};
  animation:flash 1.6s ease-out}
@keyframes flash{0%{box-shadow:0 0 0 0 ${ok ? 'rgba(53,208,127,.5)' : 'transparent'}}100%{box-shadow:0 0 0 8px transparent}}
.res{background:${P.bg};border:1px solid #2b2b3c;border-radius:12px;padding:12px 14px;font:12.5px/1.7 ui-monospace,monospace;color:${P.blue}}
.ln{opacity:0;animation:type .01s linear forwards}
@keyframes type{to{opacity:1}}`;
  const html = `<div class="wrap">
    <div class="req"><span class="verb">${verb}</span><span class="path">${path}</span>
      <span class="arrow">→</span><span class="status">${status}</span></div>
    <div class="res">${body}</div>
  </div>`;
  return { artifact: htmlArtifact(css, html), caption: 'API call' };
};

// ---------------------------------------------------------------------------
// migration — animated schema diff (SVG)
// ---------------------------------------------------------------------------

const migration: Generator = (pr) => {
  const table = esc(tableName(pr));
  const added = esc(
    (pr.title.toLowerCase().match(/\b(status|email|created_at|deleted_at|role|token|amount|slug|price)\b/) || [
      'status',
    ])[0],
  );
  const { w } = CANVAS;
  const rows = ['id', 'name', 'updated_at'];
  const topY = 42;
  const rowY = (i: number) => topY + 42 + i * 20;
  const baseRows = (x: number) =>
    rows.map((r, i) => `<text x="${x}" y="${rowY(i)}" font-family="ui-monospace,monospace" font-size="12" fill="${P.muted}">${r}</text>`).join('');
  const dividerY = rowY(rows.length - 1) + 12;
  const addedY = dividerY + 20;
  const tableH = addedY - topY + 12;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 180">
  <rect width="${w}" height="180" fill="${P.bg}"/>
  <text x="22" y="28" font-family="-apple-system,sans-serif" font-size="13" font-weight="700" fill="${P.text}">ALTER TABLE <tspan fill="${P.blue}">${table}</tspan></text>
  <!-- before -->
  <rect x="18" y="${topY}" width="150" height="${tableH}" rx="11" fill="${P.card}" stroke="#2b2b3c"/>
  <rect x="18" y="${topY}" width="150" height="24" rx="11" fill="${P.card2}"/>
  <text x="28" y="${topY + 16}" font-family="ui-monospace,monospace" font-size="12" font-weight="700" fill="${P.text}">${table}</text>
  ${baseRows(28)}
  <!-- arrow -->
  <g opacity="0"><animate attributeName="opacity" values="0;0;1;1" dur="2.8s" repeatCount="indefinite"/>
    <path d="M182 ${topY + tableH / 2} h30" stroke="${P.green}" stroke-width="2" fill="none"/>
    <path d="M208 ${topY + tableH / 2 - 5} l7 5 l-7 5" stroke="${P.green}" stroke-width="2" fill="none"/>
  </g>
  <!-- after -->
  <rect x="230" y="${topY}" width="152" height="${tableH}" rx="11" fill="${P.card}" stroke="${P.green}"/>
  <rect x="230" y="${topY}" width="152" height="24" rx="11" fill="rgba(53,208,127,.16)"/>
  <text x="240" y="${topY + 16}" font-family="ui-monospace,monospace" font-size="12" font-weight="700" fill="${P.green}">${table} ✓</text>
  ${baseRows(240)}
  <line x1="240" y1="${dividerY}" x2="372" y2="${dividerY}" stroke="#2b2b3c"/>
  <text x="240" y="${addedY}" font-family="ui-monospace,monospace" font-size="12" font-weight="700" fill="${P.green}">+ ${added}
    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.45;0.6;1" dur="2.8s" repeatCount="indefinite"/>
  </text>
</svg>`;
  return { artifact: svgArtifact(svg), caption: 'schema diff' };
};

// ---------------------------------------------------------------------------
// docs — before/after page with a typing line (HTML)
// ---------------------------------------------------------------------------

const docs: Generator = (pr) => {
  const heading = esc(truncate(pr.title.replace(/^docs(\([^)]*\))?:\s*/i, ''), 40));
  const css = `
.page{width:100%;height:100%;padding:18px 22px;background:${P.card2}}
.badge{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.4px;color:${P.blue};
  border:1px solid ${P.blue};border-radius:999px;padding:2px 9px;margin-bottom:12px}
.title{font-size:15px;font-weight:800;color:${P.text};margin-bottom:12px}
.line{height:9px;border-radius:5px;background:#fff;opacity:.12;margin:8px 0}
.add{background:${P.green};opacity:.28;border-left:3px solid ${P.green};padding-left:0}
.typing{position:relative;height:14px;margin-top:10px;color:${P.green};font:12px ui-monospace,monospace;white-space:nowrap;overflow:hidden;
  border-right:2px solid ${P.green};width:0;animation:tw 3.4s steps(30) infinite}
@keyframes tw{0%{width:0}45%,100%{width:62%}}`;
  const html = `<div class="page">
    <span class="badge">DOCS</span>
    <div class="title">${heading}</div>
    <div class="line" style="width:88%"></div>
    <div class="line" style="width:74%"></div>
    <div class="line add" style="width:66%"></div>
    <div class="typing">+ ${esc(truncate(pr.tldr || 'new documentation', 44))}</div>
    <div class="line" style="width:80%"></div>
  </div>`;
  return { artifact: htmlArtifact(css, html), caption: 'docs update' };
};

// ---------------------------------------------------------------------------
// tests — green test runner (SVG)
// ---------------------------------------------------------------------------

const tests: Generator = (pr) => {
  const count = Math.max(6, Math.min(24, Math.round((pr.stats.additions || 40) / 6)));
  const cols = 8;
  const { w, h } = CANVAS;
  const dots: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = 30 + (i % cols) * 26;
    const y = 56 + Math.floor(i / cols) * 26;
    const begin = (i * 0.09).toFixed(2);
    dots.push(`<circle cx="${x}" cy="${y}" r="7" fill="#3a3a52">
      <animate attributeName="fill" values="#3a3a52;#3a3a52;${P.green}" keyTimes="0;${(0.15 + i * 0.02).toFixed(2)};${(0.2 + i * 0.02).toFixed(2)}" dur="3s" repeatCount="indefinite"/>
    </circle>`);
  }
  const barW = w - 60;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${P.bg}"/>
  <text x="30" y="36" font-family="ui-monospace,monospace" font-size="13" fill="${P.muted}">running ${count} tests…</text>
  ${dots.join('')}
  <rect x="30" y="132" width="${barW}" height="8" rx="4" fill="${P.card2}"/>
  <rect x="30" y="132" width="0" height="8" rx="4" fill="${P.green}">
    <animate attributeName="width" values="0;${barW}" dur="2.7s" repeatCount="indefinite"/>
  </rect>
  <text x="30" y="164" font-family="ui-monospace,monospace" font-size="13" font-weight="700" fill="${P.green}" opacity="0">✓ ${count} passing
    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.85;0.92;1" dur="3s" repeatCount="indefinite"/>
  </text>
</svg>`;
  return { artifact: svgArtifact(svg), caption: 'tests pass' };
};

// ---------------------------------------------------------------------------
// generic — animated diff bars + commit graph (SVG)
// ---------------------------------------------------------------------------

const generic: Generator = (pr) => {
  const { w, h } = CANVAS;
  const add = pr.stats.additions || 1;
  const del = pr.stats.deletions || 1;
  const total = add + del;
  const maxW = w - 150;
  const addW = Math.max(10, Math.round((add / total) * maxW));
  const delW = Math.max(10, Math.round((del / total) * maxW));
  const emoji = pick(['📦', '✨', '🔧', '🧹'], seedOf(pr));
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="g" cx="18%" cy="12%" r="95%">
      <stop offset="0%" stop-color="#26263c"/><stop offset="70%" stop-color="${P.bg}"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <text x="28" y="46" font-family="-apple-system,sans-serif" font-size="30">${emoji}</text>
  <text x="70" y="45" font-family="ui-monospace,monospace" font-size="13" fill="${P.text}">${pr.stats.changedFiles} files · ${pr.stats.commits} commits</text>
  <g transform="translate(30,74)">
    <rect x="0" y="0" width="0" height="22" rx="6" fill="${P.green}">
      <animate attributeName="width" values="0;${addW}" dur="0.9s" fill="freeze"/>
    </rect>
    <text x="${addW + 10}" y="16" font-family="ui-monospace,monospace" font-size="14" font-weight="800" fill="${P.green}" opacity="0">+${add}
      <animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.8s" fill="freeze"/>
    </text>
  </g>
  <g transform="translate(30,106)">
    <rect x="0" y="0" width="0" height="22" rx="6" fill="${P.red}">
      <animate attributeName="width" values="0;${delW}" dur="0.9s" begin="0.15s" fill="freeze"/>
    </rect>
    <text x="${delW + 10}" y="16" font-family="ui-monospace,monospace" font-size="14" font-weight="800" fill="${P.red}" opacity="0">−${del}
      <animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.95s" fill="freeze"/>
    </text>
  </g>
  <g stroke="${P.blue}" stroke-width="2" fill="${P.blue}">
    <line x1="30" y1="152" x2="${w - 30}" y2="152" opacity="0.3"/>
    ${[0, 1, 2, 3, 4]
      .map(
        (i) =>
          `<circle cx="${40 + i * ((w - 80) / 4)}" cy="152" r="0"><animate attributeName="r" values="0;5" dur="0.4s" begin="${(0.7 + i * 0.15).toFixed(2)}s" fill="freeze"/></circle>`,
      )
      .join('')}
  </g>
</svg>`;
  return { artifact: svgArtifact(svg), caption: `+${add} −${del}` };
};

export const GENERATORS: Record<PreviewKind, Generator> = {
  frontend,
  cli,
  api,
  migration,
  docs,
  tests,
  generic,
};
