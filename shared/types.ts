export type CiState = 'passing' | 'failing' | 'pending' | 'none';

export interface FileStat {
  path: string;
  additions: number;
  deletions: number;
}

export interface PRLabel {
  name: string;
  color: string; // hex without '#'
}

export interface PRMedia {
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

export interface PRProfile {
  id: string;
  number: number;
  repo: string; // "owner/name"
  title: string;
  url: string;
  author: {
    login: string;
    avatarUrl: string;
  };
  branch: string;
  baseBranch: string;
  createdAt: string; // ISO date
  ageDays: number;
  draft: boolean;
  tldr: string;
  eli5: string;
  tags: string[];
  stats: {
    additions: number;
    deletions: number;
    changedFiles: number;
    commits: number;
    comments: number;
  };
  ci: CiState;
  labels: PRLabel[];
  topFiles: FileStat[];
  /** Screenshot / screen-recording pulled from the PR description, when present. */
  media?: PRMedia;
  /** 0-100 "match" score — how easy this PR is to say yes to. */
  matchScore: number;
  /** Learned score from past swipe decisions in the brain, when it has any. */
  compatibility?: Compatibility;
  /** Review findings from the offline gstack pass (precomputed cards). */
  greenFlags?: string[];
  redFlags?: string[];
  /** Structural signature, echoed back on swipe so the brain can capture it. */
  fingerprint?: PRFingerprint;
}

export type SwipeVerdict = 'approve' | 'reject' | 'skip';

/** How the server is authenticating against GitHub. */
export type AuthMode = 'app' | 'token' | 'demo';

export interface AuthUser {
  /** GitHub user id (0 for the synthetic demo user). */
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
}

export interface SessionInfo {
  mode: AuthMode;
  /** Null only in app mode before the user signs in. */
  user: AuthUser | null;
}

export interface RepoInfo {
  fullName: string; // "owner/name"
  private: boolean;
  description: string | null;
  pushedAt: string; // ISO date
  stars: number;
  language: string | null;
  /** Open issues + PRs — GitHub's cheap proxy for activity. */
  openIssues: number;
}

export interface RepoListResponse {
  repos: RepoInfo[];
  /** App mode only: true when the GitHub App isn't installed anywhere yet. */
  needsInstall?: boolean;
}

export interface UndoRequest {
  repo: string;
  number: number;
}

export interface MemoryCitation {
  pr: number;
  verdict: SwipeVerdict;
  reason: string;
  url: string;
}

export interface Compatibility {
  /** 0-100, learned from past swipes stored in the brain. */
  score: number;
  verdict: 'match' | 'maybe' | 'pass';
  /** Human-readable line, e.g. "You rejected #327 for the same reason". */
  why: string;
  /** True when this PR addresses every reason a similar PR was rejected for — the loop-closure beat. */
  closesLoop?: boolean;
  citations: MemoryCitation[];
}

export interface ReviewRequest {
  repo: string;
  number: number;
  verdict: SwipeVerdict;
  comment?: string;
  /** Structured rejection reasons picked from the chips (e.g. "no-tests"). */
  reasons?: string[];
  /** Fingerprint + tldr so the brain can capture without refetching the PR. */
  brain?: {
    title: string;
    tldr: string;
    author: string;
    url: string;
    fingerprint: PRFingerprint;
  };
}

/** Structural signature of a PR used to match it against past decisions. */
export interface PRFingerprint {
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  dirs: string[];
  has_tests: boolean;
  labels: string[];
  tags: string[];
  ci: CiState;
}

export interface PrecheckRequest {
  repo?: string;
  title: string;
  /** Short prose summary of the diff the agent is about to open. */
  summary: string;
  fingerprint?: Partial<PRFingerprint>;
}

export interface PrecheckMemory {
  pr: number;
  verdict: SwipeVerdict;
  reason: string;
  url: string;
}

export interface PrecheckResponse {
  predictedVerdict: 'approve' | 'reject' | 'unknown';
  confidence: number;
  memories: PrecheckMemory[];
  advice: string;
}

export interface ReviewResponse {
  ok: boolean;
  demo: boolean;
  message: string;
}

export interface PRListResponse {
  demo: boolean;
  repo: string;
  prs: PRProfile[];
}

/** One captured swipe as the brain view sees it (a DecisionRecord without the type tag). */
export interface BrainMemory {
  verdict: SwipeVerdict;
  repo: string;
  pr: number;
  title: string;
  author: string;
  reasons: string[];
  fingerprint: PRFingerprint;
  tldr: string;
  url: string;
  swiped_at: string;
}

export interface BrainStats {
  total: number;
  approved: number;
  rejected: number;
  /** Rejection reasons across all memories, most frequent first. */
  topReasons: { reason: string; count: number }[];
}

/** What the brain looks like right now — its stats plus every memory, newest first. */
export interface BrainSnapshot {
  stats: BrainStats;
  memories: BrainMemory[];
}
