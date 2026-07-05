import type { PreviewArtifact } from '../../shared/types';

/** gheart's card palette (mirrors the CSS custom properties in src/styles.css). */
export const PALETTE = {
  bg: '#0d0d14',
  card: '#191924',
  card2: '#20202e',
  text: '#f2f2f7',
  muted: '#9a9ab0',
  green: '#35d07f',
  red: '#ff5864',
  blue: '#58a6ff',
  amber: '#ffcf33',
  pink: '#e94074',
} as const;

/** The hero is a wide landscape strip; keep every SVG on one canvas. */
export const CANVAS = { w: 400, h: 180 } as const;

/** Deterministic 32-bit hash so a given PR always renders the same preview. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

/** Escape for use in SVG/HTML text and double-quoted attributes. */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Encode a full <svg>…</svg> string as an inert data URI (mock.ts idiom). */
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

export function svgArtifact(svg: string): PreviewArtifact {
  return { format: 'svg', dataUri: svgDataUri(svg) };
}

/**
 * Wrap generated body markup in a self-contained, script-free HTML document.
 * The strict CSP means even if markup slipped through, nothing can execute or
 * phone home — it renders inside a `sandbox=""` iframe (see CardPreview).
 */
export function htmlArtifact(css: string, body: string): PreviewArtifact {
  const srcdoc = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:${PALETTE.bg};
  color:${PALETTE.text};font-family:-apple-system,'Segoe UI',system-ui,sans-serif}
${css}
</style></head><body>${body}</body></html>`;
  return { format: 'html', srcdoc };
}
