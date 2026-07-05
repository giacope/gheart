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
}

export type SwipeVerdict = 'approve' | 'reject' | 'skip';

/** How the server is authenticating against GitHub. */
export type AuthMode = 'oauth' | 'token' | 'demo';

export interface AuthUser {
  /** GitHub user id (0 for the synthetic demo user). */
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
}

export interface SessionInfo {
  mode: AuthMode;
  /** Null only in oauth mode before the user signs in. */
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
}

export interface UndoRequest {
  repo: string;
  number: number;
}

export interface ReviewRequest {
  repo: string;
  number: number;
  verdict: SwipeVerdict;
  comment?: string;
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
