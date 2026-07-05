import type { PRProfile, PreviewKind } from '../../shared/types';
import { CONFIG_PATH, TEST_PATH, UI_EXTENSIONS } from '../summarize';

// High-signal path patterns, reusing summarize.ts where it already has one.
const MIGRATION_PATH =
  /(^|\/)(migrations?|migrate|schema)(\/|\.)|\.sql$|schema\.prisma$|(^|\/)(knexfile|alembic)|(^|\/)db\//i;
const DOCS_PATH = /\.(md|mdx|rst|adoc)$|(^|\/)docs?\//i;
const CLI_PATH =
  /(^|\/)(cmd|cli|bin|commands?)\/|(^|\/)(cli|main|command)\.[a-z]+$|\.(sh|bash|zsh|fish)$/i;
const API_PATH =
  /(^|\/)(routes?|controllers?|handlers?|endpoints?|resolvers?|api|graphql)\/|\.(proto)$|openapi|swagger/i;
// Dependency names that betray a CLI even when paths are neutral.
const CLI_DEPS = /\b(commander|yargs|oclif|clap|cobra|argparse|click|clipanion|inquirer)\b/i;

function paths(pr: PRProfile): string[] {
  return pr.topFiles.map((f) => f.path);
}

/** Every changed file matches — i.e. the PR is *only* this kind of file. */
function every(pr: PRProfile, re: RegExp): boolean {
  const ps = paths(pr);
  return ps.length > 0 && ps.every((p) => re.test(p));
}

function some(pr: PRProfile, re: RegExp): boolean {
  return paths(pr).some((p) => re.test(p));
}

function hay(pr: PRProfile): string {
  // Title + tags + labels give a cheap secondary signal for path-poor diffs.
  return [pr.title, pr.tldr, ...pr.tags, ...pr.labels.map((l) => l.name)].join(' ');
}

/**
 * Route a PR to the preview we'll synthesize. Ordered by signal specificity:
 * "only-this-kind" checks first (tests, docs), then high-signal structural
 * markers (migrations), then the visual/interactive kinds, then a fallback.
 */
export function classifyPreviewKind(pr: PRProfile): PreviewKind {
  // Pure test / pure docs PRs get their dedicated animation, but only when the
  // *whole* diff is that kind — a feature PR that also adds tests is a feature.
  if (every(pr, TEST_PATH) || (pr.tags.includes('tests') && !some(pr, UI_EXTENSIONS))) {
    return 'tests';
  }
  if (every(pr, DOCS_PATH) || (pr.tags.includes('docs') && every(pr, /(\.md$)|(^|\/)docs?\//i))) {
    return 'docs';
  }

  if (some(pr, MIGRATION_PATH)) return 'migration';

  // Visual change: any front-end file extension (css/tsx/vue/svelte/html/img).
  if (some(pr, UI_EXTENSIONS) || pr.tags.includes('ui')) return 'frontend';

  // Command-line change: cmd/bin/cli paths, shell scripts, or a CLI arg lib.
  if (some(pr, CLI_PATH) || CLI_DEPS.test(hay(pr))) return 'cli';

  // Backend surface: routes/controllers/handlers/resolvers/proto/openapi.
  if (some(pr, API_PATH)) return 'api';

  // Docs as a soft fallback when the title screams it but paths were sparse.
  if (DOCS_PATH.test(hay(pr)) && !every(pr, CONFIG_PATH)) return 'docs';

  return 'generic';
}
