import type { AuthUser, CiState, FileStat, PRProfile, RepoInfo, SwipeVerdict } from '../shared/types';
import { extractMedia } from './media';
import { matchScore, summarize } from './summarize';

const API = 'https://api.github.com';

async function gh<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'user-agent': 'gheart',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

interface RawViewer {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

export async function fetchViewer(token: string): Promise<AuthUser> {
  const raw = await gh<RawViewer>('/user', token);
  return { id: raw.id, login: raw.login, name: raw.name, avatarUrl: raw.avatar_url };
}

interface RawRepo {
  full_name: string;
  private: boolean;
  description: string | null;
  pushed_at: string;
  stargazers_count: number;
  language: string | null;
  open_issues_count: number;
  archived: boolean;
}

function toRepoInfo(r: RawRepo): RepoInfo {
  return {
    fullName: r.full_name,
    private: r.private,
    description: r.description,
    pushedAt: r.pushed_at,
    stars: r.stargazers_count,
    language: r.language,
    openIssues: r.open_issues_count,
  };
}

export async function fetchUserRepos(token: string): Promise<RepoInfo[]> {
  const raw = await gh<RawRepo[]>(
    '/user/repos?sort=pushed&per_page=100&affiliation=owner,collaborator,organization_member',
    token,
  );
  return raw.filter((r) => !r.archived).map(toRepoInfo);
}

interface RawInstallations {
  total_count: number;
  installations: Array<{ id: number }>;
}

interface RawInstallationRepos {
  total_count: number;
  repositories: RawRepo[];
}

/**
 * Repos reachable through the gheart GitHub App: the union of repos across
 * the app's installations that the signed-in user can also access.
 */
export async function fetchInstalledRepos(token: string): Promise<RepoInfo[] | null> {
  const { installations } = await gh<RawInstallations>('/user/installations?per_page=100', token);
  if (installations.length === 0) return null; // app not installed anywhere yet

  const byName = new Map<string, RepoInfo>();
  await Promise.all(
    installations.map(async (inst) => {
      const { repositories } = await gh<RawInstallationRepos>(
        `/user/installations/${inst.id}/repositories?per_page=100`,
        token,
      );
      for (const r of repositories) {
        if (!r.archived) byName.set(r.full_name, toRepoInfo(r));
      }
    }),
  );
  return [...byName.values()].sort(
    (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime(),
  );
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
        const summary = await summarize(summaryInput);
        const ageDays = Math.max(
          0,
          Math.floor((Date.now() - new Date(detail.created_at).getTime()) / 86_400_000),
        );

        return {
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
  comment: string | undefined,
  token: string,
  opts: { viewerLogin?: string; authorLogin?: string } = {},
): Promise<void> {
  if (verdict === 'skip') return; // skips never touch GitHub

  const body =
    comment ??
    (verdict === 'approve'
      ? 'Approved via gheart 💚 (swiped right)'
      : 'Requesting changes via gheart 💔 (swiped left)');

  // GitHub forbids approving or requesting changes on your own PR (422). When
  // we can see it's a self-match up front, skip straight to a COMMENT review —
  // still records the swipe on the PR, just without the verdict GitHub won't
  // let you cast on yourself.
  const ownPR =
    !!opts.viewerLogin && !!opts.authorLogin && opts.viewerLogin === opts.authorLogin;
  const wanted = verdict === 'approve' ? 'APPROVE' : 'REQUEST_CHANGES';

  const post = (event: string) =>
    fetch(`${API}/repos/${repo}/pulls/${number}/reviews`, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
        'user-agent': 'gheart',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ event, body }),
    });

  let res = await post(ownPR ? 'COMMENT' : wanted);

  // Safety net: if the author wasn't known up front, GitHub still tells us with
  // a 422 self-review error. Retry once as a plain comment so the swipe lands.
  if (res.status === 422 && !ownPR) {
    const text = await res.clone().text().catch(() => '');
    if (/can ?not approve your own pull request|own pull request/i.test(text)) {
      res = await post('COMMENT');
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub review failed (${res.status}): ${text.slice(0, 300)}`);
  }
}
