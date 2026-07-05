import { describe, expect, it } from 'vitest';
import { extractMedia } from './media';
import { heuristicSummary, matchScore, type SummaryInput } from './summarize';

function input(overrides: Partial<SummaryInput> = {}): SummaryInput {
  return {
    title: 'fix: broken thing',
    body: '',
    files: [],
    additions: 10,
    deletions: 2,
    changedFiles: 1,
    ci: 'passing',
    draft: false,
    ...overrides,
  };
}

describe('heuristicSummary', () => {
  it('tags a conventional-commit fix as bugfix', () => {
    const s = heuristicSummary(input({ title: 'fix: cart total wrong' }));
    expect(s.tags).toContain('bugfix');
    expect(s.eli5.toLowerCase()).toContain('broken');
  });

  it('tags features and UI files', () => {
    const s = heuristicSummary(
      input({
        title: 'feat: add dark mode',
        files: [{ path: 'src/App.tsx', additions: 5, deletions: 1 }],
      }),
    );
    expect(s.tags).toContain('feature');
    expect(s.tags).toContain('ui');
  });

  it('detects test files', () => {
    const s = heuristicSummary(
      input({ files: [{ path: 'src/foo.test.ts', additions: 5, deletions: 0 }] }),
    );
    expect(s.tags).toContain('has-tests');
  });

  it('uses the PR body lead sentence in the tldr', () => {
    const s = heuristicSummary(
      input({ body: 'The memoized total was keyed on item ids only. More detail follows.' }),
    );
    expect(s.tldr).toContain('The memoized total was keyed on item ids only');
  });

  it('strips markdown noise from the body before summarizing', () => {
    const s = heuristicSummary(
      input({
        body: '<!-- template -->\n## Summary\n![screenshot](https://x.test/a.png)\nFixes the [login](https://x.test) flow for SSO users.',
      }),
    );
    expect(s.tldr).toContain('Fixes the login flow for SSO users');
    expect(s.tldr).not.toContain('![');
  });
});

describe('matchScore', () => {
  it('scores small green-CI tested PRs high', () => {
    const score = matchScore(
      input({
        additions: 12,
        deletions: 3,
        body: 'A very thorough description of the change and why it is safe to merge.',
        files: [{ path: 'src/foo.test.ts', additions: 10, deletions: 0 }],
      }),
    );
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('scores huge failing drafts low', () => {
    const score = matchScore(
      input({ additions: 3000, deletions: 200, ci: 'failing', draft: true, changedFiles: 40 }),
    );
    expect(score).toBeLessThan(20);
  });

  it('stays within 3..99', () => {
    expect(matchScore(input({ additions: 0, deletions: 0 }))).toBeLessThanOrEqual(99);
    expect(
      matchScore(input({ additions: 99999, deletions: 99999, ci: 'failing', draft: true })),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe('extractMedia', () => {
  it('returns undefined for plain text', () => {
    expect(extractMedia('just words')).toBeUndefined();
    expect(extractMedia(null)).toBeUndefined();
  });

  it('finds markdown images', () => {
    const m = extractMedia('Before/after:\n![shot](https://x.test/img.png)');
    expect(m).toEqual({ type: 'image', url: 'https://x.test/img.png', alt: 'shot' });
  });

  it('prefers a video clip over images', () => {
    const m = extractMedia(
      '![shot](https://x.test/img.png)\nhttps://github.com/user-attachments/assets/abc-123',
    );
    expect(m?.type).toBe('video');
    expect(m?.url).toContain('user-attachments');
  });

  it('finds html img tags', () => {
    const m = extractMedia('<img width="400" src="https://x.test/ui.gif">');
    expect(m).toMatchObject({ type: 'image', url: 'https://x.test/ui.gif' });
  });
});
