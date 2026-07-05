import type { PRPreview, PRProfile } from '../../shared/types';
import { classifyPreviewKind } from './classify';
import { GENERATORS } from './generators';
import { hashString } from './artifacts';

/**
 * Synthesize a self-contained preview for a PR — the deterministic "generated"
 * tier that needs no API key, no repo checkout, and never blocks a request.
 * (The Agent-SDK and sandbox tiers layer richer artifacts on top of this.)
 */
export function synthesizePreview(pr: PRProfile, generatedAt: string): PRPreview {
  const kind = classifyPreviewKind(pr);
  const { artifact, caption } = GENERATORS[kind](pr);
  return {
    kind,
    tier: 'generated',
    status: 'ready',
    headSha: pr.headSha || syntheticSha(pr),
    generatedAt,
    caption,
    artifact,
  };
}

/**
 * Give a PR a preview when the author didn't ship media of their own. Author
 * screenshots/recordings are real artifacts a human chose, so they still win —
 * this only fills the gap that used to render a lone emoji.
 */
export function attachPreview(pr: PRProfile, generatedAt: string): void {
  if (pr.media) return;
  if (pr.preview?.status === 'ready') return; // already baked (e.g. cards.json)
  pr.preview = synthesizePreview(pr, generatedAt);
}

/** Deterministic stand-in when a profile has no real head SHA (mocks/demo). */
export function syntheticSha(pr: PRProfile): string {
  return hashString(`${pr.repo}#${pr.number}:${pr.stats.additions}/${pr.stats.deletions}`)
    .toString(16)
    .padStart(8, '0');
}
