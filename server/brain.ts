import { execFile } from 'node:child_process';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type {
  BrainMemory,
  BrainSnapshot,
  Compatibility,
  MemoryCitation,
  PRFingerprint,
  PRProfile,
  PrecheckRequest,
  PrecheckResponse,
} from '../shared/types';

const exec = promisify(execFile);

/** One captured swipe. Identical schema for the gbrain and jsonl backends. */
export interface DecisionRecord extends BrainMemory {
  type: 'review-decision';
}

export interface BrainStore {
  /** Fire-and-forget: record a swipe decision. */
  captureDecision(d: DecisionRecord): Promise<void>;
  /** Learned compatibility for a PR, or null when the brain is empty. */
  scoreAgainstMemory(pr: PRProfile): Promise<Compatibility | null>;
  /** Agent-facing: predict the verdict for a diff that hasn't been opened yet. */
  precheck(req: PrecheckRequest): Promise<PrecheckResponse>;
  /** Read-only view of everything the brain has learned, newest memory first. */
  snapshot(): Promise<BrainSnapshot>;
}

// ---------------------------------------------------------------------------
// Fingerprinting
// ---------------------------------------------------------------------------

const TEST_PATH = /(^|\/)(__tests__|tests?|spec)(\/|\.)|\.(test|spec)\.[jt]sx?$/i;

function sizeBucket(additions: number, deletions: number): PRFingerprint['size'] {
  const total = additions + deletions;
  if (total <= 20) return 'tiny';
  if (total <= 120) return 'small';
  if (total <= 500) return 'medium';
  if (total <= 1500) return 'large';
  return 'huge';
}

function topDirs(paths: string[]): string[] {
  const dirs = new Set<string>();
  for (const p of paths) {
    const parts = p.split('/');
    dirs.add(parts.length > 1 ? parts.slice(0, Math.min(2, parts.length - 1)).join('/') : '.');
  }
  return [...dirs];
}

export function fingerprintFromProfile(pr: PRProfile): PRFingerprint {
  return {
    size: sizeBucket(pr.stats.additions, pr.stats.deletions),
    dirs: topDirs(pr.topFiles.map((f) => f.path)),
    has_tests: pr.topFiles.some((f) => TEST_PATH.test(f.path)) || pr.tags.includes('has-tests'),
    labels: pr.labels.map((l) => l.name.toLowerCase()),
    tags: pr.tags,
    ci: pr.ci,
  };
}

// ---------------------------------------------------------------------------
// Similarity scoring (shared by both backends as the deterministic core)
// ---------------------------------------------------------------------------

const SIZE_ORDER: PRFingerprint['size'][] = ['tiny', 'small', 'medium', 'large', 'huge'];

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  let inter = 0;
  for (const s of setA) if (setB.has(s)) inter += 1;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

const STOPWORDS = new Set(
  'a an the and or of to in on for with this that is are was be as it its from by at'.split(' '),
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function textSim(a: string, b: string): number {
  return jaccard(tokens(a), tokens(b));
}

function similarity(fp: PRFingerprint, text: string, d: DecisionRecord): number {
  const dir = jaccard(fp.dirs, d.fingerprint.dirs);
  const tag = jaccard([...fp.tags, ...fp.labels], [...d.fingerprint.tags, ...d.fingerprint.labels]);
  const txt = textSim(text, `${d.title} ${d.tldr}`);
  // Size and test-parity only reinforce a real content match (same area,
  // same kind of change, similar description); on their own they'd make
  // every mid-sized untested PR "similar" to every other one.
  const anchor = Math.min(1, dir * 2 + tag * 2 + txt * 3);
  const sizeDist = Math.abs(SIZE_ORDER.indexOf(fp.size) - SIZE_ORDER.indexOf(d.fingerprint.size));
  let s = 0.34 * dir + 0.22 * tag + 0.22 * txt;
  s += anchor * (sizeDist === 0 ? 0.14 : sizeDist === 1 ? 0.07 : 0);
  s += anchor * (fp.has_tests === d.fingerprint.has_tests ? 0.08 : 0);
  return s;
}

/**
 * Which of a past rejection's reasons does the current PR fix? "no-tests" is
 * addressed by having tests, "too-big" by being small — the loop-closure beat.
 */
function addressedReasons(fp: PRFingerprint, reasons: string[]): string[] {
  return reasons.filter((r) => {
    if (r === 'no-tests') return fp.has_tests;
    if (r === 'too-big') return SIZE_ORDER.indexOf(fp.size) <= 2;
    return false;
  });
}

const REASON_LABELS: Record<string, string> = {
  'too-big': 'being too big',
  'no-tests': 'having no tests',
  'touches-auth': 'touching auth',
  'wrong-layer': 'living in the wrong layer',
  duplicate: 'duplicating existing work',
  'vibe-off': 'the vibe being off',
};

function describeReasons(reasons: string[]): string {
  const parts = reasons.map((r) => REASON_LABELS[r] ?? r);
  if (parts.length === 0) return 'similar changes';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * Does a past rejection reason plausibly apply to the current PR? Used only
 * for the human-readable why-line — a CSS-only card shouldn't be told it
 * "touches auth" just because it resembles a PR that did.
 */
const AUTH_HINT = /\bauth|login|session|permission|token|credential/i;

function reasonApplies(r: string, fp: PRFingerprint, text: string): boolean {
  if (r === 'no-tests') return !fp.has_tests;
  if (r === 'too-big') return fp.size === 'large' || fp.size === 'huge';
  if (r === 'touches-auth') return AUTH_HINT.test(`${fp.dirs.join(' ')} ${fp.tags.join(' ')} ${text}`);
  return true;
}

interface Match {
  decision: DecisionRecord;
  sim: number;
  addressed: string[];
  outstanding: string[];
  applicable: string[];
}

function rankMatches(fp: PRFingerprint, text: string, decisions: DecisionRecord[]): Match[] {
  return decisions
    .filter((d) => d.verdict !== 'skip')
    .map((d) => {
      const addressed = d.verdict === 'reject' ? addressedReasons(fp, d.reasons) : [];
      const outstanding =
        d.verdict === 'reject' ? d.reasons.filter((r) => !addressed.includes(r)) : [];
      return {
        decision: d,
        sim: similarity(fp, text, d),
        addressed,
        outstanding,
        applicable: outstanding.filter((r) => reasonApplies(r, fp, text)),
      };
    })
    .filter((m) => m.sim >= 0.22)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 3);
}

function compatibilityFromMatches(matches: Match[]): Compatibility | null {
  if (matches.length === 0) return null;

  let score = 50;
  for (const [rank, m] of matches.entries()) {
    const weight = m.sim * [1, 0.6, 0.35][rank];
    if (m.decision.verdict === 'approve') {
      score += 42 * weight;
    } else if (m.addressed.length > 0 && m.outstanding.length === 0) {
      // Rejected before, but this PR fixes every named reason — strong positive.
      score += 52 * weight;
    } else if (m.outstanding.length > 0) {
      score -= 48 * weight;
    } else {
      // Rejected with no reasons given: similar things got noped, be wary.
      score -= 30 * weight;
    }
  }
  score = Math.max(3, Math.min(99, Math.round(score)));

  const top = matches[0];
  const d = top.decision;
  let why: string;
  if (d.verdict === 'approve') {
    why = `You approved #${d.pr} (${describeReasons(d.fingerprint.tags.slice(0, 2))}) — this looks like more of the same.`;
  } else if (top.addressed.length > 0 && top.outstanding.length === 0) {
    why = `You rejected #${d.pr} for ${describeReasons(d.reasons)} — this revision fixes exactly that.`;
  } else if (top.applicable.length > 0) {
    why = `You rejected #${d.pr} for ${describeReasons(top.applicable)} — this one has the same smell.`;
  } else {
    why = `You rejected #${d.pr} — this looks similar, so proceed with care.`;
  }

  const citations: MemoryCitation[] = matches.map((m) => ({
    pr: m.decision.pr,
    verdict: m.decision.verdict,
    reason: m.decision.reasons.join(', ') || m.decision.tldr.slice(0, 80),
    url: m.decision.url,
  }));

  return {
    score,
    verdict: score >= 65 ? 'match' : score >= 40 ? 'maybe' : 'pass',
    why,
    citations,
  };
}

/** Roll a set of decisions up into the read-only view the Brain panel renders. */
function snapshotFromDecisions(decisions: DecisionRecord[]): BrainSnapshot {
  const memories: BrainMemory[] = [...decisions]
    .sort((a, b) => b.swiped_at.localeCompare(a.swiped_at))
    .map(({ type: _type, ...m }) => m);
  const reasonCounts = new Map<string, number>();
  for (const d of decisions)
    for (const r of d.reasons) reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
  const topReasons = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
  return {
    stats: {
      total: decisions.length,
      approved: decisions.filter((d) => d.verdict === 'approve').length,
      rejected: decisions.filter((d) => d.verdict === 'reject').length,
      topReasons,
    },
    memories,
  };
}

// ---------------------------------------------------------------------------
// JSONL backend — zero-dependency fallback, same schema as the gbrain pages
// ---------------------------------------------------------------------------

export class JsonlBrainStore implements BrainStore {
  constructor(private file: string) {}

  private async load(): Promise<DecisionRecord[]> {
    try {
      const raw = await readFile(this.file, 'utf8');
      // Later lines win: a re-swipe after undo (or a re-run seed) replaces the
      // earlier decision for the same PR instead of double-counting it.
      const byPr = new Map<string, DecisionRecord>();
      for (const line of raw.split('\n').filter(Boolean)) {
        const d = JSON.parse(line) as DecisionRecord;
        byPr.set(`${d.repo}#${d.pr}`, d);
      }
      return [...byPr.values()];
    } catch {
      return [];
    }
  }

  async captureDecision(d: DecisionRecord): Promise<void> {
    await mkdir(path.dirname(this.file), { recursive: true });
    await appendFile(this.file, `${JSON.stringify(d)}\n`, 'utf8');
  }

  async scoreAgainstMemory(pr: PRProfile): Promise<Compatibility | null> {
    const decisions = await this.load();
    // A PR should not cite its own past swipe.
    const others = decisions.filter((d) => !(d.repo === pr.repo && d.pr === pr.number));
    const fp = pr.fingerprint ?? fingerprintFromProfile(pr);
    return compatibilityFromMatches(rankMatches(fp, `${pr.title} ${pr.tldr}`, others));
  }

  async snapshot(): Promise<BrainSnapshot> {
    return snapshotFromDecisions(await this.load());
  }

  async precheck(req: PrecheckRequest): Promise<PrecheckResponse> {
    const decisions = await this.load();
    const fp: PRFingerprint = {
      size: req.fingerprint?.size ?? 'medium',
      dirs: req.fingerprint?.dirs ?? [],
      has_tests: req.fingerprint?.has_tests ?? false,
      labels: req.fingerprint?.labels ?? [],
      tags: req.fingerprint?.tags ?? [],
      ci: req.fingerprint?.ci ?? 'none',
    };
    const matches = rankMatches(fp, `${req.title} ${req.summary}`, decisions);
    const compat = compatibilityFromMatches(matches);

    if (!compat) {
      return {
        predictedVerdict: 'unknown',
        confidence: 0,
        memories: [],
        advice: 'No relevant memories yet — open the PR and let the human decide.',
      };
    }

    const predictedVerdict =
      compat.score >= 65 ? 'approve' : compat.score <= 40 ? 'reject' : 'unknown';
    const confidence = Math.min(0.95, Math.abs(compat.score - 50) / 50 + matches[0].sim * 0.4);
    const outstanding = matches.flatMap((m) => m.outstanding);
    const advice =
      predictedVerdict === 'reject'
        ? `Likely rejected: past reviews flagged ${describeReasons([...new Set(outstanding)])}. Fix that before opening the PR.`
        : predictedVerdict === 'approve'
          ? `Likely approved — this matches what the reviewer said yes to before. ${compat.why}`
          : `Could go either way. ${compat.why}`;

    return {
      predictedVerdict,
      confidence: Number(confidence.toFixed(2)),
      memories: compat.citations.map((c) => ({ ...c })),
      advice,
    };
  }
}

// ---------------------------------------------------------------------------
// gbrain backend — shells out to the gbrain CLI, mirrors to jsonl so scoring
// stays deterministic even if a CLI call fails mid-demo.
// ---------------------------------------------------------------------------

function decisionPage(d: DecisionRecord): string {
  const front = [
    '---',
    `type: review-decision`,
    `verdict: ${d.verdict}`,
    `repo: ${d.repo}`,
    `pr: ${d.pr}`,
    `author: ${d.author}`,
    `reasons: [${d.reasons.join(', ')}]`,
    `fingerprint: { size: ${d.fingerprint.size}, dirs: [${d.fingerprint.dirs.join(', ')}], has_tests: ${d.fingerprint.has_tests}, labels: [${d.fingerprint.labels.join(', ')}] }`,
    `swiped_at: ${d.swiped_at}`,
    `url: ${d.url}`,
    '---',
    '',
    `${d.verdict === 'approve' ? 'Approved' : 'Rejected'} #${d.pr} (${d.title}).` +
      (d.reasons.length ? ` Reasons: ${describeReasons(d.reasons)}.` : ''),
    '',
    d.tldr,
  ];
  return front.join('\n');
}

export class GbrainStore implements BrainStore {
  private mirror: JsonlBrainStore;

  constructor(
    private brainDir: string,
    mirrorFile: string,
  ) {
    this.mirror = new JsonlBrainStore(mirrorFile);
  }

  async captureDecision(d: DecisionRecord): Promise<void> {
    await this.mirror.captureDecision(d);
    try {
      const pageDir = path.join(this.brainDir, 'pages');
      await mkdir(pageDir, { recursive: true });
      const pagePath = path.join(pageDir, `review-${d.repo.replace('/', '-')}-${d.pr}-${Date.now()}.md`);
      await writeFile(pagePath, decisionPage(d), 'utf8');
      await exec('gbrain', ['capture', pagePath], { cwd: this.brainDir, timeout: 10_000 });
    } catch (err) {
      console.error('gheart: gbrain capture failed (jsonl mirror has the decision):', err);
    }
  }

  async scoreAgainstMemory(pr: PRProfile): Promise<Compatibility | null> {
    // Deterministic scoring runs on the mirror; gbrain remains the durable,
    // searchable store (and what `think`/agents consume).
    return this.mirror.scoreAgainstMemory(pr);
  }

  async snapshot(): Promise<BrainSnapshot> {
    // The mirror holds every decision (gbrain pages are written from it), so
    // it's the authoritative source for the read-only view.
    return this.mirror.snapshot();
  }

  async precheck(req: PrecheckRequest): Promise<PrecheckResponse> {
    const base = await this.mirror.precheck(req);
    try {
      const { stdout } = await exec(
        'gbrain',
        ['think', `Would the reviewer approve or reject this PR? ${req.title} — ${req.summary}`],
        { cwd: this.brainDir, timeout: 20_000 },
      );
      const thought = stdout.trim();
      if (thought) return { ...base, advice: thought.slice(0, 600) };
    } catch (err) {
      console.error('gheart: gbrain think failed, using local precheck:', err);
    }
    return base;
  }
}

// ---------------------------------------------------------------------------
// Store selection
// ---------------------------------------------------------------------------

async function gbrainAvailable(): Promise<boolean> {
  try {
    await exec('gbrain', ['--version'], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

export async function createBrainStore(): Promise<BrainStore> {
  const dataDir = process.env.GHEART_BRAIN_DIR || path.resolve(process.cwd(), 'server/data');
  const jsonlFile = path.join(dataDir, 'brain.jsonl');
  const mode = process.env.GHEART_BRAIN || 'auto';

  if (mode === 'jsonl') {
    console.log(`gheart: brain = jsonl (${jsonlFile})`);
    return new JsonlBrainStore(jsonlFile);
  }
  if (mode === 'gbrain' || (mode === 'auto' && (await gbrainAvailable()))) {
    console.log(`gheart: brain = gbrain (${dataDir}, jsonl mirror alongside)`);
    return new GbrainStore(dataDir, jsonlFile);
  }
  console.log(`gheart: brain = jsonl (${jsonlFile}) — gbrain CLI not found`);
  return new JsonlBrainStore(jsonlFile);
}
