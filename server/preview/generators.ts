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
.bar{height:36px;flex:none;display:flex;align-items:center;gap:7px;padding:0 14px;background:${P.card};border-bottom:1px solid #2b2b3c}
.d{width:11px;height:11px;border-radius:50%}
.addr{margin-left:10px;font:11.5px ui-monospace,monospace;color:${P.muted};background:${P.bg};padding:4px 14px;border-radius:9px}
.view{flex:1;position:relative;overflow:hidden;padding:24px 24px}
.h{font-size:18px;font-weight:800;letter-spacing:-.3px}
`;
  let view = '';

  if (variant === 'theme') {
    css += `
.view{transition:none;animation:day 5s ease-in-out infinite}
@keyframes day{0%,40%{background:#f5f5f7;color:#17171f}55%,95%{background:${P.bg};color:${P.text}}100%{background:#f5f5f7;color:#17171f}}
.sk{height:12px;border-radius:6px;margin-top:12px;background:currentColor;opacity:.16}
.blk{height:84px;border-radius:14px;margin-top:18px;background:currentColor;opacity:.08}
.toggle{position:absolute;right:22px;top:24px;width:50px;height:27px;border-radius:999px;background:${P.green};opacity:.9}
.knob{position:absolute;top:3px;width:21px;height:21px;border-radius:50%;background:#fff;animation:slide 5s ease-in-out infinite}
@keyframes slide{0%,40%{left:3px}55%,95%{left:26px}100%{left:3px}}`;
    view = `<div class="h">${title}</div>
      <div class="sk" style="width:70%"></div><div class="sk" style="width:52%"></div><div class="sk" style="width:63%"></div>
      <div class="blk"></div>
      <div class="sk" style="width:58%"></div><div class="sk" style="width:44%"></div>
      <div class="blk" style="height:64px"></div>
      <div class="toggle"><span class="knob"></span></div>`;
  } else if (variant === 'cta') {
    css += `
.h{color:${P.text}}
.sk{height:11px;border-radius:6px;margin-top:12px;background:#fff;opacity:.12}
.cta{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);padding:16px 38px;border-radius:999px;
  font-weight:800;font-size:16px;color:#06281a;background:linear-gradient(90deg,#1fa864,${P.green});
  box-shadow:0 10px 30px rgba(53,208,127,.4);animation:pulse 1.8s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.06)}}
.ring{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:190px;height:58px;border-radius:999px;
  border:2px solid ${P.green};opacity:0;animation:ripple 1.8s ease-out infinite}
@keyframes ripple{0%{opacity:.5;transform:translate(-50%,-50%) scale(.8)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
.foot{position:absolute;left:24px;right:24px;bottom:26px}`;
    view = `<div class="h">${title}</div><div class="sk" style="width:60%"></div><div class="sk" style="width:42%"></div>
      <span class="ring"></span><span class="cta">Get started</span>
      <div class="foot"><div class="sk" style="width:84%"></div><div class="sk" style="width:66%"></div></div>`;
  } else {
    css += `
.h{color:${P.text};margin-bottom:16px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.tile{height:88px;border-radius:14px;background:linear-gradient(135deg,${P.card},${P.card2});
  border:1px solid #2b2b3c;opacity:0;transform:translateY(10px);animation:rise .6s ease forwards}
.tile:nth-child(1){animation-delay:.1s}.tile:nth-child(2){animation-delay:.25s}.tile:nth-child(3){animation-delay:.4s}
.tile:nth-child(4){animation-delay:.55s}.tile:nth-child(5){animation-delay:.7s}.tile:nth-child(6){animation-delay:.85s}
.tile::after{content:'';display:block;width:38%;height:7px;border-radius:4px;margin:16px;background:${P.green};opacity:.7}
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
      { text: `  exit code 0 (was 1)`, delayMs: 900 },
      { text: ` `, delayMs: 240 },
      { text: `$ ${cmd} test`, delayMs: 500 },
      { text: `✓ ${Math.max(3, pr.stats.changedFiles * 2)} passing, 0 failing`, delayMs: 1400 },
    );
  } else {
    frames.push(
      { text: `▸ ${truncate(pr.title.replace(/^(feat|add)(\([^)]*\))?:\s*/i, ''), 42)}`, delayMs: 460 },
      { text: `✓ done in 0.4s`, delayMs: 500 },
      { text: ` `, delayMs: 240 },
      { text: `$ ${cmd} --version`, delayMs: 500 },
      { text: `${cmd} v1.${(seedOf(pr) % 8) + 1}.0`, delayMs: 420 },
      { text: `  see ${cmd} ${flag} for more`, delayMs: 1400 },
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
.wrap{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:24px 26px}
.req{display:flex;align-items:center;gap:10px;font:14px ui-monospace,monospace;flex-wrap:wrap}
.verb{font-weight:800;color:${color};border:1.5px solid ${color};border-radius:8px;padding:4px 10px;font-size:13px}
.path{color:${P.text}}
.arrow{color:${P.muted};animation:go 1.6s ease-in-out infinite}
@keyframes go{0%,100%{opacity:.3;transform:translateX(0)}50%{opacity:1;transform:translateX(4px)}}
.status{font-size:12px;font-weight:800;color:${ok ? P.green : P.muted};
  border-radius:999px;padding:4px 12px;background:${ok ? 'rgba(53,208,127,.14)' : 'rgba(154,154,176,.14)'};
  animation:flash 1.6s ease-out}
@keyframes flash{0%{box-shadow:0 0 0 0 ${ok ? 'rgba(53,208,127,.5)' : 'transparent'}}100%{box-shadow:0 0 0 8px transparent}}
.res{background:${P.bg};border:1px solid #2b2b3c;border-radius:14px;padding:16px 18px;font:13.5px/1.8 ui-monospace,monospace;color:${P.blue}}
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
// migration — animated schema diff, stacked before → after (portrait SVG)
// ---------------------------------------------------------------------------

const migration: Generator = (pr) => {
  const table = esc(tableName(pr));
  const added = esc(
    (pr.title.toLowerCase().match(/\b(status|email|created_at|deleted_at|role|token|amount|slug|price)\b/) || [
      'status',
    ])[0],
  );
  const { w, h } = CANVAS;
  const cx = w / 2;
  const rows = ['id', 'name', 'updated_at'];
  const tw = 216;
  const tx = cx - tw / 2;
  const headH = 28;
  const rowH = 21;
  const rowsSvg = (y0: number) =>
    rows
      .map(
        (r, i) =>
          `<text x="${tx + 16}" y="${y0 + headH + 16 + i * rowH}" font-family="ui-monospace,monospace" font-size="13" fill="${P.muted}">${r}</text>`,
      )
      .join('');

  const beforeY = 108;
  const beforeH = headH + rows.length * rowH + 14;
  const arrowY = beforeY + beforeH + 16;
  const afterY = arrowY + 46;
  const dividerY = afterY + headH + rows.length * rowH + 6;
  const addedRowY = dividerY + 22;
  const afterH = dividerY - afterY + rowH + 18;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${P.bg}"/>
  <text x="${cx}" y="76" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="15" font-weight="700" fill="${P.text}">ALTER TABLE <tspan fill="${P.blue}">${table}</tspan></text>
  <!-- before -->
  <rect x="${tx}" y="${beforeY}" width="${tw}" height="${beforeH}" rx="14" fill="${P.card}" stroke="#2b2b3c"/>
  <rect x="${tx}" y="${beforeY}" width="${tw}" height="${headH}" rx="14" fill="${P.card2}"/>
  <text x="${tx + 16}" y="${beforeY + 20}" font-family="ui-monospace,monospace" font-size="13" font-weight="700" fill="${P.text}">${table}</text>
  ${rowsSvg(beforeY)}
  <!-- arrow down (base state = visible, so paused/frozen renders show the payoff) -->
  <g><animate attributeName="opacity" values="0;0;1;1" dur="2.8s" begin="0.5s" repeatCount="indefinite"/>
    <path d="M${cx} ${arrowY} v26" stroke="${P.green}" stroke-width="2" fill="none"/>
    <path d="M${cx - 5} ${arrowY + 22} l5 7 l5 -7" stroke="${P.green}" stroke-width="2" fill="none"/>
  </g>
  <!-- after -->
  <rect x="${tx}" y="${afterY}" width="${tw}" height="${afterH}" rx="14" fill="${P.card}" stroke="${P.green}"/>
  <rect x="${tx}" y="${afterY}" width="${tw}" height="${headH}" rx="14" fill="rgba(53,208,127,.16)"/>
  <text x="${tx + 16}" y="${afterY + 20}" font-family="ui-monospace,monospace" font-size="13" font-weight="700" fill="${P.green}">${table} ✓</text>
  ${rowsSvg(afterY)}
  <line x1="${tx + 16}" y1="${dividerY}" x2="${tx + tw - 16}" y2="${dividerY}" stroke="#2b2b3c"/>
  <text x="${tx + 16}" y="${addedRowY}" font-family="ui-monospace,monospace" font-size="13" font-weight="700" fill="${P.green}">+ ${added}
    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.45;0.6;1" dur="2.8s" begin="0.5s" repeatCount="indefinite"/>
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
.page{width:100%;height:100%;padding:30px 28px;background:${P.card2}}
.badge{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.4px;color:${P.blue};
  border:1px solid ${P.blue};border-radius:999px;padding:3px 10px;margin-bottom:16px}
.title{font-size:18px;font-weight:800;letter-spacing:-.3px;color:${P.text};margin-bottom:16px}
.line{height:10px;border-radius:5px;background:#fff;opacity:.12;margin:10px 0}
.add{background:${P.green};opacity:.28;border-left:3px solid ${P.green};padding-left:0}
.quote{margin:18px 0;padding:12px 16px;border-left:3px solid ${P.blue};border-radius:0 10px 10px 0;background:rgba(88,166,255,.08)}
.quote .line{margin:6px 0}
.typing{position:relative;height:16px;margin-top:14px;color:${P.green};font:13px ui-monospace,monospace;white-space:nowrap;overflow:hidden;
  border-right:2px solid ${P.green};width:0;animation:tw 3.4s steps(30) infinite}
@keyframes tw{0%{width:0}45%,100%{width:66%}}`;
  const html = `<div class="page">
    <span class="badge">DOCS</span>
    <div class="title">${heading}</div>
    <div class="line" style="width:88%"></div>
    <div class="line" style="width:74%"></div>
    <div class="line add" style="width:66%"></div>
    <div class="typing">+ ${esc(truncate(pr.tldr || 'new documentation', 44))}</div>
    <div class="line" style="width:80%"></div>
    <div class="quote"><div class="line" style="width:82%"></div><div class="line" style="width:58%"></div></div>
    <div class="line" style="width:86%"></div>
    <div class="line" style="width:70%"></div>
    <div class="line" style="width:78%"></div>
  </div>`;
  return { artifact: htmlArtifact(css, html), caption: 'docs update' };
};

// ---------------------------------------------------------------------------
// tests — green test runner, centered dot grid (portrait SVG)
// ---------------------------------------------------------------------------

const tests: Generator = (pr) => {
  const count = Math.max(6, Math.min(25, Math.round((pr.stats.additions || 40) / 6)));
  const cols = 5;
  const gap = 34;
  const { w, h } = CANVAS;
  const cx = w / 2;
  const rows = Math.ceil(count / cols);
  const gridTop = 232;
  const dots: string[] = [];
  for (let i = 0; i < count; i++) {
    const inRow = Math.min(cols, count - Math.floor(i / cols) * cols);
    const x = cx - ((inRow - 1) * gap) / 2 + (i % cols) * gap;
    const y = gridTop + Math.floor(i / cols) * gap;
    dots.push(`<circle cx="${x}" cy="${y}" r="8" fill="${P.green}">
      <animate attributeName="fill" values="#3a3a52;#3a3a52;${P.green};${P.green}" keyTimes="0;${(0.08 + i * 0.016).toFixed(3)};${(0.13 + i * 0.016).toFixed(3)};1" dur="4s" begin="0.5s" repeatCount="indefinite"/>
    </circle>`);
  }
  const barW = 232;
  const barY = gridTop + rows * gap + 26;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${P.bg}"/>
  <text x="${cx}" y="180" text-anchor="middle" font-family="ui-monospace,monospace" font-size="14" fill="${P.muted}">running ${count} tests…</text>
  ${dots.join('')}
  <rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="6" rx="3" fill="${P.card2}"/>
  <rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="6" rx="3" fill="${P.green}">
    <animate attributeName="width" values="0;${barW};${barW}" keyTimes="0;0.55;1" dur="4s" begin="0.5s" repeatCount="indefinite"/>
  </rect>
  <text x="${cx}" y="${barY + 40}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="14" font-weight="700" fill="${P.green}">✓ ${count} passing
    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.55;0.65;1" dur="4s" begin="0.5s" repeatCount="indefinite"/>
  </text>
</svg>`;
  return { artifact: svgArtifact(svg), caption: 'tests pass' };
};

// ---------------------------------------------------------------------------
// generic — animated diff bars + commit graph, centered (portrait SVG)
// ---------------------------------------------------------------------------

const generic: Generator = (pr) => {
  const { w, h } = CANVAS;
  const cx = w / 2;
  const add = pr.stats.additions || 1;
  const del = pr.stats.deletions || 1;
  const total = add + del;
  const maxW = 190;
  const addW = Math.max(12, Math.round((add / total) * maxW));
  const delW = Math.max(12, Math.round((del / total) * maxW));
  const barX = cx - 130;
  const emoji = pick(['📦', '✨', '🔧', '🧹'], seedOf(pr));
  const graphY = 462;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="g" cx="50%" cy="20%" r="95%">
      <stop offset="0%" stop-color="#23233a"/><stop offset="70%" stop-color="${P.bg}"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <text x="${cx}" y="208" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="54">${emoji}</text>
  <text x="${cx}" y="258" text-anchor="middle" font-family="ui-monospace,monospace" font-size="14" fill="${P.text}">${pr.stats.changedFiles} files · ${pr.stats.commits} commits</text>
  <g transform="translate(${barX},316)">
    <rect x="0" y="0" width="${addW}" height="20" rx="6" fill="${P.green}">
      <animate attributeName="width" values="0;${addW};${addW}" keyTimes="0;0.2;1" dur="4s" begin="0.5s" repeatCount="indefinite"/>
    </rect>
    <text x="${addW + 12}" y="15" font-family="ui-monospace,monospace" font-size="14" font-weight="800" fill="${P.green}">+${add}
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.18;0.26;1" dur="4s" begin="0.5s" repeatCount="indefinite"/>
    </text>
  </g>
  <g transform="translate(${barX},350)">
    <rect x="0" y="0" width="${delW}" height="20" rx="6" fill="${P.red}">
      <animate attributeName="width" values="0;${delW};${delW}" keyTimes="0;0.24;1" dur="4s" begin="0.5s" repeatCount="indefinite"/>
    </rect>
    <text x="${delW + 12}" y="15" font-family="ui-monospace,monospace" font-size="14" font-weight="800" fill="${P.red}">−${del}
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.22;0.3;1" dur="4s" begin="0.5s" repeatCount="indefinite"/>
    </text>
  </g>
  <g stroke="${P.blue}" stroke-width="2" fill="${P.blue}">
    <line x1="${cx - 130}" y1="${graphY}" x2="${cx + 130}" y2="${graphY}" opacity="0.3"/>
    ${[0, 1, 2, 3, 4]
      .map(
        (i) =>
          `<circle cx="${cx - 120 + i * 60}" cy="${graphY}" r="5"><animate attributeName="r" values="0;0;5;5" keyTimes="0;${(0.2 + i * 0.04).toFixed(2)};${(0.26 + i * 0.04).toFixed(2)};1" dur="4s" begin="0.5s" repeatCount="indefinite"/></circle>`,
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
