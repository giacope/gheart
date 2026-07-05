import { describe, expect, it } from 'vitest';
import type { FileStat, PRProfile } from '../../shared/types';
import { classifyPreviewKind } from './classify';
import { attachPreview, synthesizePreview } from './generate';

function pr(overrides: Partial<PRProfile> = {}): PRProfile {
  const files: FileStat[] = overrides.topFiles ?? [{ path: 'src/index.ts', additions: 10, deletions: 2 }];
  return {
    id: 'demo/app#1',
    number: 1,
    repo: 'demo/app',
    title: 'chore: something',
    url: 'https://github.com/demo/app/pull/1',
    author: { login: 'dev', avatarUrl: '' },
    branch: 'feat/x',
    baseBranch: 'main',
    headSha: 'abc123',
    createdAt: new Date(0).toISOString(),
    ageDays: 1,
    draft: false,
    tldr: 'A change.',
    eli5: 'A change.',
    tags: [],
    stats: { additions: 40, deletions: 8, changedFiles: 2, commits: 1, comments: 0 },
    ci: 'passing',
    labels: [],
    topFiles: files,
    matchScore: 50,
    ...overrides,
  };
}

const files = (...paths: string[]): FileStat[] =>
  paths.map((path) => ({ path, additions: 10, deletions: 1 }));

describe('classifyPreviewKind', () => {
  it('routes a pure test PR to tests', () => {
    expect(classifyPreviewKind(pr({ topFiles: files('src/cart/total.test.ts', 'src/cart/util.spec.ts') }))).toBe(
      'tests',
    );
  });

  it('routes a pure docs PR to docs', () => {
    expect(classifyPreviewKind(pr({ topFiles: files('docs/adr/0014.md', 'README.md') }))).toBe('docs');
  });

  it('routes a migration PR to migration even with mixed files', () => {
    expect(
      classifyPreviewKind(pr({ topFiles: files('db/migrations/003_add_status.sql', 'src/models/order.ts') })),
    ).toBe('migration');
  });

  it('routes a UI PR to frontend', () => {
    expect(classifyPreviewKind(pr({ topFiles: files('src/components/Button.tsx', 'src/styles/button.css') }))).toBe(
      'frontend',
    );
  });

  it('routes a CLI PR to cli', () => {
    expect(classifyPreviewKind(pr({ topFiles: files('cmd/root.go', 'internal/flags.go') }))).toBe('cli');
  });

  it('routes a route/controller PR to api', () => {
    expect(classifyPreviewKind(pr({ topFiles: files('server/routes/orders.ts', 'server/db.ts') }))).toBe('api');
  });

  it('falls back to generic for a neutral diff', () => {
    expect(classifyPreviewKind(pr({ topFiles: files('lib/core.ts', 'lib/util.ts') }))).toBe('generic');
  });

  it('a feature PR that also adds tests is still frontend, not tests', () => {
    expect(
      classifyPreviewKind(pr({ topFiles: files('src/Toggle.tsx', 'src/Toggle.test.tsx'), tags: ['feature'] })),
    ).toBe('frontend');
  });
});

describe('synthesizePreview', () => {
  const kinds = [
    { name: 'frontend', files: files('src/App.tsx'), format: 'html' },
    { name: 'cli', files: files('cmd/main.go'), format: 'terminal' },
    { name: 'api', files: files('server/routes/x.ts'), format: 'html' },
    { name: 'migration', files: files('db/migrations/1.sql'), format: 'svg' },
    { name: 'docs', files: files('docs/x.md'), format: 'html' },
    { name: 'tests', files: files('a.test.ts'), format: 'svg' },
    { name: 'generic', files: files('lib/core.ts'), format: 'generic-svg' },
  ] as const;

  for (const k of kinds) {
    it(`produces a ready ${k.format} artifact for ${k.name}`, () => {
      const p = synthesizePreview(pr({ topFiles: k.files }), 'now');
      expect(p.status).toBe('ready');
      expect(p.kind).toBe(k.name);
      expect(p.artifact).toBeTruthy();
      expect(p.caption && p.caption.length).toBeGreaterThan(0);
    });
  }

  it('is deterministic — same PR yields an identical artifact', () => {
    const a = synthesizePreview(pr(), 't');
    const b = synthesizePreview(pr(), 't');
    expect(JSON.stringify(a.artifact)).toBe(JSON.stringify(b.artifact));
  });

  it('never embeds a <script> in html/svg artifacts', () => {
    for (const k of kinds) {
      const art = synthesizePreview(pr({ topFiles: k.files }), 't').artifact!;
      const serialized = JSON.stringify(art).toLowerCase();
      expect(serialized).not.toContain('<script');
    }
  });

  it('does not throw on an empty diff', () => {
    expect(() => synthesizePreview(pr({ topFiles: [], stats: { additions: 0, deletions: 0, changedFiles: 0, commits: 0, comments: 0 } }), 't')).not.toThrow();
  });
});

describe('attachPreview', () => {
  it('fills a preview when the author left no media', () => {
    const p = pr();
    attachPreview(p, 'now');
    expect(p.preview?.status).toBe('ready');
  });

  it('leaves author media untouched (media wins)', () => {
    const p = pr({ media: { type: 'image', url: 'x' } });
    attachPreview(p, 'now');
    expect(p.preview).toBeUndefined();
  });
});
