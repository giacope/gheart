import type { CiState, FileStat, PRProfile, SwipeVerdict } from '../shared/types';
import { extractMedia } from './media';
import { attachPreview } from './preview/generate';
import { matchScore, summarize } from './summarize';

// Browser build: talk to the GitHub REST API directly (it sends CORS headers),
// authenticated with the user's own token. No gheart backend needed.
const API = 'https://api.github.com';

async function gh<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

interface RawPR {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  draft: boolean;
  created_at: string;
  user: { login: string; avatar_url: string };
  head: { ref: string; sha: string };
  base: { ref: string };
  labels: Array<{ name: string; color: string }>;
}

interface RawPRDetail extends RawPR {
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  comments: number;
  review_comments: number;
}

interface RawFile {
  filename: string;
  additions: number;
  deletions: number;
}

interface RawCheckRuns {
  total_count: number;
  check_runs: Array<{ status: string; conclusion: string | null }>;
}

function ciState(checks: RawCheckRuns): CiState {
  if (checks.total_count === 0) return 'none';
  if (checks.check_runs.some((c) => c.conclusion === 'failure' || c.conclusion === 'timed_out')) {
    return 'failing';
  }
  if (checks.check_runs.some((c) => c.status !== 'completed')) return 'pending';
  return 'passing';
}

export async function fetchOpenPRs(repo: string, token: string, limit = 15): Promise<PRProfile[]> {
  const list = await gh<RawPR[]>(`/repos/${repo}/pulls?state=open&per_page=${limit}`, token);

  const profiles = await Promise.all(
    list.map(async (raw): Promise<PRProfile | null> => {
      try {
        const [detail, rawFiles, checks] = await Promise.all([
          gh<RawPRDetail>(`/repos/${repo}/pulls/${raw.number}`, token),
          gh<RawFile[]>(`/repos/${repo}/pulls/${raw.number}/files?per_page=100`, token),
          gh<RawCheckRuns>(`/repos/${repo}/commits/${raw.head.sha}/check-runs?per_page=50`, token),
        ]);

        const files: FileStat[] = rawFiles.map((f) => ({
          path: f.filename,
          additions: f.additions,
          deletions: f.deletions,
        }));
        const ci = ciState(checks);
        const summaryInput = {
          title: detail.title,
          body: detail.body ?? '',
          files,
          additions: detail.additions,
          deletions: detail.deletions,
          changedFiles: detail.changed_files,
          ci,
          draft: detail.draft,
        };
        const summary = summarize(summaryInput);
        const ageDays = Math.max(
          0,
          Math.floor((Date.now() - new Date(detail.created_at).getTime()) / 86_400_000),
        );

        const profile: PRProfile = {
          id: `${repo}#${detail.number}`,
          number: detail.number,
          repo,
          title: detail.title,
          url: detail.html_url,
          author: { login: detail.user.login, avatarUrl: detail.user.avatar_url },
          branch: detail.head.ref,
          baseBranch: detail.base.ref,
          headSha: detail.head.sha,
          createdAt: detail.created_at,
          ageDays,
          draft: detail.draft,
          tldr: summary.tldr,
          eli5: summary.eli5,
          tags: summary.tags,
          stats: {
            additions: detail.additions,
            deletions: detail.deletions,
            changedFiles: detail.changed_files,
            commits: detail.commits,
            comments: detail.comments + detail.review_comments,
          },
          ci,
          labels: detail.labels.map((l) => ({ name: l.name, color: l.color })),
          topFiles: [...files]
            .sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions))
            .slice(0, 4),
          media: extractMedia(detail.body),
          matchScore: matchScore(summaryInput),
        };
        attachPreview(profile, new Date().toISOString());
        return profile;
      } catch (err) {
        console.error(`gheart: skipping ${repo}#${raw.number}:`, err);
        return null;
      }
    }),
  );

  return profiles.filter((p): p is PRProfile => p !== null);
}

export async function submitReview(
  repo: string,
  number: number,
  verdict: SwipeVerdict,
  token: string,
  comment?: string,
): Promise<void> {
  if (verdict === 'skip') return; // skips never touch GitHub

  const event = verdict === 'approve' ? 'APPROVE' : 'REQUEST_CHANGES';
  const body =
    comment ??
    (verdict === 'approve'
      ? 'Approved via gheart 💚 (swiped right)'
      : 'Requesting changes via gheart 💔 (swiped left)');

  const res = await fetch(`${API}/repos/${repo}/pulls/${number}/reviews`, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ event, body }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub review failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

/** Who am I? Confirms the token works and greets the user by login. */
export async function whoami(token: string): Promise<string> {
  const me = await gh<{ login: string }>(`/user`, token);
  return me.login;
}
