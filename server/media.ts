import type { PRMedia } from '../shared/types';

const VIDEO_EXT = /\.(mp4|mov|webm)(\?|#|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i;

/**
 * Pull the first screenshot / screen recording out of a PR description.
 * GitHub uploads land as markdown images, bare user-attachments URLs, or
 * <img>/<video> tags.
 */
export function extractMedia(body: string | null | undefined): PRMedia | undefined {
  if (!body) return undefined;

  const candidates: PRMedia[] = [];

  // Markdown image: ![alt](url)
  for (const m of body.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)) {
    candidates.push({ type: 'image', url: m[2], alt: m[1] || undefined });
  }
  // HTML tags
  for (const m of body.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi)) {
    candidates.push({ type: 'image', url: m[1] });
  }
  for (const m of body.matchAll(/<video[^>]+src=["'](https?:\/\/[^"']+)["']/gi)) {
    candidates.push({ type: 'video', url: m[1] });
  }
  // Bare GitHub attachment URLs (screen recordings paste as plain links)
  for (const m of body.matchAll(
    /(?<!\()(https?:\/\/(?:github\.com\/user-attachments\/assets|user-images\.githubusercontent\.com)\/[^\s)>'"]+)/g,
  )) {
    const url = m[1];
    candidates.push({ type: VIDEO_EXT.test(url) || !IMAGE_EXT.test(url) ? 'video' : 'image', url });
  }

  // Prefer a video ("small clip of the UI changes"), else first image.
  const video = candidates.find((c) => c.type === 'video' || VIDEO_EXT.test(c.url));
  if (video) return { ...video, type: 'video' };
  return candidates[0];
}
