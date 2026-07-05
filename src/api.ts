import type { PRListResponse, ReviewRequest, ReviewResponse } from '../shared/types';

export async function fetchPRs(repo?: string): Promise<PRListResponse> {
  const qs = repo ? `?repo=${encodeURIComponent(repo)}` : '';
  const res = await fetch(`/api/prs${qs}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Failed to load PRs (${res.status})`);
  }
  return res.json();
}

export async function sendReview(req: ReviewRequest): Promise<ReviewResponse> {
  const res = await fetch('/api/review', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Review failed (${res.status})`);
  }
  return res.json();
}
