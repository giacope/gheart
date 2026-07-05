import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PRListResponse, ReviewRequest, ReviewResponse } from '../shared/types';
import { fetchOpenPRs, submitReview } from './github';
import { mockPRs } from './mock';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 8788);
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const DEFAULT_REPO = process.env.GHEART_REPO || '';
const DEMO = !TOKEN;

const REPO_RE = /^[\w.-]+\/[\w.-]+$/;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, demo: DEMO });
});

app.get('/api/prs', async (req, res) => {
  const repo = String(req.query.repo || DEFAULT_REPO || 'demo/lovable-app');
  if (!REPO_RE.test(repo)) {
    res.status(400).json({ error: `"${repo}" is not an owner/name repo` });
    return;
  }
  try {
    const prs = DEMO ? mockPRs(repo) : await fetchOpenPRs(repo, TOKEN);
    const payload: PRListResponse = { demo: DEMO, repo, prs };
    res.json(payload);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'failed to load PRs' });
  }
});

app.post('/api/review', async (req, res) => {
  const { repo, number, verdict, comment } = req.body as ReviewRequest;
  if (!REPO_RE.test(repo || '') || !Number.isInteger(number) || !verdict) {
    res.status(400).json({ error: 'expected { repo, number, verdict }' });
    return;
  }
  try {
    if (!DEMO) await submitReview(repo, number, verdict, comment, TOKEN);
    const messages = {
      approve: DEMO ? `Demo: would approve ${repo}#${number}` : `Approved ${repo}#${number}`,
      reject: DEMO
        ? `Demo: would request changes on ${repo}#${number}`
        : `Requested changes on ${repo}#${number}`,
      skip: `Skipped ${repo}#${number} — maybe it's the one that got away`,
    } as const;
    const payload: ReviewResponse = { ok: true, demo: DEMO, message: messages[verdict] };
    res.json(payload);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'review failed' });
  }
});

// In production, serve the built frontend.
if (process.env.NODE_ENV === 'production') {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const dist = path.resolve(here, '../dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(
    `gheart api on http://localhost:${PORT} ${DEMO ? '(demo mode — set GITHUB_TOKEN for live PRs)' : '(live GitHub mode)'}`,
  );
});
