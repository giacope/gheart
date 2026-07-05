import type {
  BrainSnapshot,
  PRListResponse,
  RepoListResponse,
  ReviewRequest,
  ReviewResponse,
  SessionInfo,
  UndoRequest,
} from '../shared/types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function post<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function fetchSession(): Promise<SessionInfo> {
  return request<SessionInfo>('/api/auth/me');
}

export function logout(): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>('/api/auth/logout', {});
}

export function fetchRepos(): Promise<RepoListResponse> {
  return request<RepoListResponse>('/api/repos');
}

export function fetchPRs(repo?: string): Promise<PRListResponse> {
  const qs = repo ? `?repo=${encodeURIComponent(repo)}` : '';
  return request<PRListResponse>(`/api/prs${qs}`);
}

export function sendReview(req: ReviewRequest): Promise<ReviewResponse> {
  return post<ReviewResponse>('/api/review', req);
}

export function undoReview(req: UndoRequest): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>('/api/review/undo', req);
}

export function fetchBrain(): Promise<BrainSnapshot> {
  return request<BrainSnapshot>('/api/brain');
}
