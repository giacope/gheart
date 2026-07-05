import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  PRListResponse,
  RepoInfo,
  RepoListResponse,
  ReviewRequest,
  ReviewResponse,
  UndoRequest,
} from '../shared/types';
import { Auth } from './auth';
import { fetchOpenPRs, fetchUserRepos, submitReview } from './github';
import { mockPRs } from './mock';
import { Store } from './store';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 8788);
const here = path.dirname(fileURLToPath(import.meta.url));

const store = new Store(process.env.GHEART_DATA || path.resolve(here, '../data/gheart.json'));
const auth = new Auth(
  {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    envToken: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
    baseUrl: process.env.GHEART_BASE_URL || '',
  },
  store,
);

const DEMO = auth.mode === 'demo';
const DEFAULT_REPO = process.env.GHEART_REPO || '';
const REPO_RE = /^[\w.-]+\/[\w.-]+$/;

const DEMO_REPOS: RepoInfo[] = [
  {
    fullName: 'demo/lovable-app',
    private: false,
    description: 'The demo deck — nine PRs looking for love',
    pushedAt: new Date().toISOString(),
    stars: 128,
    language: 'TypeScript',
    openIssues: 9,
  },
  {
    fullName: 'demo/legacy-monolith',
    private: true,
    description: 'It has been through a lot. Be gentle.',
    pushedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    stars: 4,
    language: 'JavaScript',
    openIssues: 9,
  },
];

app.use('/api/auth', auth.router());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, demo: DEMO, mode: auth.mode });
});

app.get('/api/auth/me', (req, res) => {
  auth
    .userFor(req, res)
    .then((user) => res.json(auth.sessionInfo(user)))
    .catch((err) =>
      res.status(502).json({ error: err instanceof Error ? err.message : 'auth failed' }),
    );
});

app.get('/api/repos', (req, res) => {
  void (async () => {
    const user = await auth.userFor(req, res);
    if (!user) {
      res.status(401).json({ error: 'sign in with GitHub first' });
      return;
    }
    const payload: RepoListResponse = {
      repos: DEMO ? DEMO_REPOS : await fetchUserRepos(user.accessToken),
    };
    res.json(payload);
  })().catch((err) =>
    res.status(502).json({ error: err instanceof Error ? err.message : 'failed to load repos' }),
  );
});

app.get('/api/prs', (req, res) => {
  void (async () => {
    const user = await auth.userFor(req, res);
    if (!user) {
      res.status(401).json({ error: 'sign in with GitHub first' });
      return;
    }
    const repo = String(req.query.repo || DEFAULT_REPO || (DEMO ? 'demo/lovable-app' : ''));
    if (!REPO_RE.test(repo)) {
      res
        .status(400)
        .json({ error: repo ? `"${repo}" is not an owner/name repo` : 'pick a repo first' });
      return;
    }
    const all = DEMO ? mockPRs(repo) : await fetchOpenPRs(repo, user.accessToken);
    // Multi-user: each reviewer only sees PRs they haven't already reviewed.
    const swiped = store.swipedIds(user.id);
    const prs = all.filter((p) => !swiped.has(p.id));
    const payload: PRListResponse = { demo: DEMO, repo, prs };
    res.json(payload);
  })().catch((err) =>
    res.status(502).json({ error: err instanceof Error ? err.message : 'failed to load PRs' }),
  );
});

app.post('/api/review', (req, res) => {
  void (async () => {
    const user = await auth.userFor(req, res);
    if (!user) {
      res.status(401).json({ error: 'sign in with GitHub first' });
      return;
    }
    const { repo, number, verdict, comment } = req.body as ReviewRequest;
    if (!REPO_RE.test(repo || '') || !Number.isInteger(number) || !verdict) {
      res.status(400).json({ error: 'expected { repo, number, verdict }' });
      return;
    }
    if (!DEMO) await submitReview(repo, number, verdict, comment, user.accessToken);
    store.recordSwipe(user.id, `${repo}#${number}`, verdict);
    const messages = {
      approve: DEMO ? `Demo: would approve ${repo}#${number}` : `Approved ${repo}#${number}`,
      reject: DEMO
        ? `Demo: would request changes on ${repo}#${number}`
        : `Requested changes on ${repo}#${number}`,
      skip: `Skipped ${repo}#${number} — maybe it's the one that got away`,
    } as const;
    const payload: ReviewResponse = { ok: true, demo: DEMO, message: messages[verdict] };
    res.json(payload);
  })().catch((err) =>
    res.status(502).json({ error: err instanceof Error ? err.message : 'review failed' }),
  );
});

// Undo forgets the swipe so the PR reappears next load (the GitHub review,
// if one was sent, stays sent — we're a dating app, not a time machine).
app.post('/api/review/undo', (req, res) => {
  void (async () => {
    const user = await auth.userFor(req, res);
    if (!user) {
      res.status(401).json({ error: 'sign in with GitHub first' });
      return;
    }
    const { repo, number } = req.body as UndoRequest;
    if (!REPO_RE.test(repo || '') || !Number.isInteger(number)) {
      res.status(400).json({ error: 'expected { repo, number }' });
      return;
    }
    store.removeSwipe(user.id, `${repo}#${number}`);
    res.json({ ok: true });
  })().catch((err) =>
    res.status(502).json({ error: err instanceof Error ? err.message : 'undo failed' }),
  );
});

// In production, serve the built frontend.
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(here, '../dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  const modeNote = {
    oauth: '(GitHub OAuth mode — multi-user)',
    token: '(single-token mode — set GITHUB_CLIENT_ID/SECRET for OAuth)',
    demo: '(demo mode — set GITHUB_CLIENT_ID/SECRET or GITHUB_TOKEN for live PRs)',
  }[auth.mode];
  console.log(`gheart api on http://localhost:${PORT} ${modeNote}`);
});
