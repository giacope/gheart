import type { CiState, FileStat } from '../shared/types';

export interface SummaryInput {
  title: string;
  body: string;
  files: FileStat[];
  additions: number;
  deletions: number;
  changedFiles: number;
  ci: CiState;
  draft: boolean;
}

export interface Summary {
  tldr: string;
  eli5: string;
  tags: string[];
}

const TYPE_PATTERNS: Array<{ re: RegExp; tag: string; eli5: string }> = [
  {
    re: /^(fix|bugfix|hotfix)\b|(\bfix(es|ed)?\b)/i,
    tag: 'bugfix',
    eli5: 'Something was broken. After this, it works the way everyone expected it to.',
  },
  {
    re: /^feat\b|(\badd(s|ed)?\b)|(\bnew\b)/i,
    tag: 'feature',
    eli5: 'The app learns a new trick it could not do before.',
  },
  {
    re: /^refactor\b|\brefactor|\bcleanup\b|\bclean up\b|\brestructure/i,
    tag: 'refactor',
    eli5: 'Same behavior on the outside, tidier LEGO bricks on the inside.',
  },
  {
    re: /^docs?\b|\breadme\b|\bdocumentation\b/i,
    tag: 'docs',
    eli5: 'No code changes for the machine — just better instructions for the humans.',
  },
  {
    re: /^test(s)?\b|\bcoverage\b|\bspec(s)?\b/i,
    tag: 'tests',
    eli5: 'Adds more safety nets so future changes are less scary.',
  },
  {
    re: /^(chore|build|ci)\b|\bbump\b|\bupgrade\b|\bdependenc/i,
    tag: 'chore',
    eli5: 'Housekeeping. Keeps the lights on and the dependencies fresh.',
  },
  {
    re: /^perf\b|\bperformance\b|\bfaster\b|\bspeed(s)? up\b|\boptimi[sz]e/i,
    tag: 'performance',
    eli5: 'Makes the same thing happen, but faster and with less waste.',
  },
  {
    re: /\bsecurity\b|\bvulnerab|\bCVE-/i,
    tag: 'security',
    eli5: 'Locks a door that was accidentally left open.',
  },
];

const UI_EXTENSIONS = /\.(css|scss|less|svg|png|jpg|jpeg|gif|webp|tsx|jsx|vue|svelte|html)$/i;
const TEST_PATH = /(^|\/)(__tests__|tests?|spec)(\/|\.)|\.(test|spec)\.[jt]sx?$/i;
const CONFIG_PATH = /(^|\/)(package(-lock)?\.json|yarn\.lock|pnpm-lock\.yaml|Dockerfile|\.github\/|.*\.ya?ml|.*\.toml|\.gitignore)/i;

function sizeWord(additions: number, deletions: number): string {
  const total = additions + deletions;
  if (total <= 20) return 'tiny';
  if (total <= 120) return 'small';
  if (total <= 500) return 'medium-sized';
  if (total <= 1500) return 'large';
  return 'huge';
}

function firstSentenceOfBody(body: string): string | null {
  const cleaned = body
    .replace(/<!--[\s\S]*?-->/g, ' ') // comments
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/<[^>]+>/g, ' ') // html tags
    .replace(/^#+\s.*$/gm, ' ') // headings
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  const match = cleaned.match(/^.{10,240}?(?:\.(?:\s|$)|$)/);
  const sentence = (match ? match[0] : cleaned.slice(0, 200)).trim();
  return sentence.length >= 10 ? sentence.replace(/\.$/, '') : null;
}

/** Rule-based fallback used when no ANTHROPIC_API_KEY is configured. */
export function heuristicSummary(input: SummaryInput): Summary {
  const tags = new Set<string>();
  let eli5 = 'A change to the code. The title is honestly your best clue here.';

  for (const { re, tag, eli5: hint } of TYPE_PATTERNS) {
    if (re.test(input.title)) {
      tags.add(tag);
      if (tags.size === 1) eli5 = hint;
    }
  }

  const paths = input.files.map((f) => f.path);
  if (paths.some((p) => UI_EXTENSIONS.test(p))) tags.add('ui');
  if (paths.some((p) => TEST_PATH.test(p))) tags.add('has-tests');
  if (paths.length > 0 && paths.every((p) => CONFIG_PATH.test(p))) tags.add('config-only');
  if (input.draft) tags.add('draft');

  const size = sizeWord(input.additions, input.deletions);
  tags.add(size === 'tiny' || size === 'small' ? 'quick-read' : `${size}-diff`);

  const bodyLead = firstSentenceOfBody(input.body);
  const scope =
    input.changedFiles === 1
      ? `touches a single file`
      : `touches ${input.changedFiles} files`;
  const tldr = bodyLead
    ? `${bodyLead}. A ${size} change that ${scope} (+${input.additions}/−${input.deletions}).`
    : `${input.title.trim().replace(/\.$/, '')}. A ${size} change that ${scope} (+${input.additions}/−${input.deletions}).`;

  return { tldr, eli5, tags: [...tags].slice(0, 5) };
}

/**
 * Browser build: no server, no API key — the deck summarizes locally with the
 * heuristic so it works fully offline / static. (The web+server build keeps the
 * Claude-powered summary.)
 */
export function summarize(input: SummaryInput): Summary {
  return heuristicSummary(input);
}

/**
 * How easy is this PR to say yes to? 0-100.
 * Small, green-CI, well-described, tested PRs score high.
 */
export function matchScore(input: SummaryInput): number {
  let score = 50;

  const total = input.additions + input.deletions;
  if (total <= 20) score += 20;
  else if (total <= 120) score += 14;
  else if (total <= 500) score += 4;
  else if (total <= 1500) score -= 8;
  else score -= 18;

  if (input.ci === 'passing') score += 18;
  else if (input.ci === 'failing') score -= 25;
  else if (input.ci === 'pending') score += 2;

  if (input.body.trim().length > 80) score += 8;
  if (input.files.some((f) => TEST_PATH.test(f.path))) score += 8;
  if (input.draft) score -= 20;
  if (input.changedFiles > 30) score -= 6;

  return Math.max(3, Math.min(99, Math.round(score)));
}
