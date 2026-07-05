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
