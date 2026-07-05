import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  PRListResponse,
  PRProfile,
  RepoInfo,
  RepoListResponse,
  ReviewRequest,
  ReviewResponse,
  UndoRequest,
} from '../shared/types';
import { Auth } from './auth';
import { createBrainStore, fingerprintFromProfile, type DecisionRecord } from './brain';
import { fetchInstalledRepos, fetchOpenPRs, fetchUserRepos, submitReview } from './github';
import { mockPRs } from './mock';
import { attachPreview } from './preview/generate';
import { setupRouter } from './setup';
import { Store } from './store';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 8788);
const here = path.dirname(fileURLToPath(import.meta.url));

const store = new Store(process.env.GHEART_DATA || path.resolve(here, '../data/gheart.json'));
const auth = new Auth(
  {
    app: {
      appId: Number(process.env.GITHUB_APP_ID || 0) || undefined,
      slug: process.env.GITHUB_APP_SLUG || undefined,
      clientId: process.env.GITHUB_APP_CLIENT_ID || undefined,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET || undefined,
    },
    envToken: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
    baseUrl: process.env.GHEART_BASE_URL || '',
  },
  store,
);

const DEFAULT_REPO = process.env.GHEART_REPO || '';
const REPO_RE = /^[\w.-]+\/[\w.-]+$/;

const brain = await createBrainStore();

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
app.use('/api/setup', setupRouter(auth, store));

/** Demo deck: precomputed cards.json (gstack pipeline output) if present, else mocks. */
async function demoPRs(repo: string): Promise<PRProfile[]> {
  const cardsFile =
    process.env.GHEART_CARDS || path.resolve(process.cwd(), 'server/data/cards.json');
  try {
    const cards = JSON.parse(await readFile(cardsFile, 'utf8')) as PRProfile[];
    if (Array.isArray(cards) && cards.length > 0) return cards;
  } catch {
    // no precomputed cards — fall through to mocks
  }
  return mockPRs(repo);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, demo: auth.mode === 'demo', mode: auth.mode });
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
    let payload: RepoListResponse;
    if (auth.mode === 'demo') {
      payload = { repos: DEMO_REPOS };
    } else if (auth.mode === 'token') {
      payload = { repos: await fetchUserRepos(user.accessToken) };
    } else {
      // App mode: repos come from where the app is installed.
      const repos = await fetchInstalledRepos(user.accessToken);
      payload = repos === null ? { repos: [], needsInstall: true } : { repos };
    }
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
    const demo = auth.mode === 'demo';
    const repo = String(req.query.repo || DEFAULT_REPO || (demo ? 'demo/lovable-app' : ''));
    if (!REPO_RE.test(repo)) {
      res
        .status(400)
        .json({ error: repo ? `"${repo}" is not an owner/name repo` : 'pick a repo first' });
      return;
    }
    const all = demo ? await demoPRs(repo) : await fetchOpenPRs(repo, user.accessToken);
    // Multi-user: each reviewer only sees PRs they haven't already reviewed.
    const swiped = store.swipedIds(user.id);
    const prs = all.filter((p) => !swiped.has(p.id));
    // Enrich every card with its fingerprint, the learned compatibility score
    // from past swipes, and a synthesized preview when the author left none.
    // All of this is fast/local, so it stays in-request.
    const now = new Date().toISOString();
    await Promise.all(
      prs.map(async (pr) => {
        pr.fingerprint = pr.fingerprint ?? fingerprintFromProfile(pr);
        attachPreview(pr, now);
        try {
          pr.compatibility = (await brain.scoreAgainstMemory(pr)) ?? undefined;
        } catch (err) {
          console.error(`gheart: compatibility failed for ${pr.id}:`, err);
        }
      }),
    );
    const payload: PRListResponse = { demo, repo, prs };
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
    const { repo, number, verdict, comment, reasons, brain: brainMeta } =
      req.body as ReviewRequest;
    if (!REPO_RE.test(repo || '') || !Number.isInteger(number) || !verdict) {
      res.status(400).json({ error: 'expected { repo, number, verdict }' });
      return;
    }
    const demo = auth.mode === 'demo';
    if (!demo)
      await submitReview(repo, number, verdict, comment, user.accessToken, {
        viewerLogin: user.login,
        authorLogin: brainMeta?.author,
      });
    store.recordSwipe(user.id, `${repo}#${number}`, verdict);

    // Capture the decision into the brain — fire-and-forget so the swipe
    // never waits on memory writes. Skips are not judgments; don't store them.
    if (verdict !== 'skip' && brainMeta) {
      const decision: DecisionRecord = {
        type: 'review-decision',
        verdict,
        repo,
        pr: number,
        title: brainMeta.title,
        author: brainMeta.author,
        reasons: (reasons ?? []).slice(0, 8).map(String),
        fingerprint: brainMeta.fingerprint,
        tldr: brainMeta.tldr,
        url: brainMeta.url,
        swiped_at: new Date().toISOString(),
      };
      void brain
        .captureDecision(decision)
        .catch((err) => console.error('gheart: capture failed:', err));
    }

    const messages = {
      approve: demo ? `Demo: would approve ${repo}#${number}` : `Approved ${repo}#${number}`,
      superlike: demo
        ? `Demo: would super approve ${repo}#${number} ⭐`
        : `Super approved ${repo}#${number} ⭐`,
      reject: demo
        ? `Demo: would request changes on ${repo}#${number}`
        : `Requested changes on ${repo}#${number}`,
      skip: `Skipped ${repo}#${number} — maybe it's the one that got away`,
    } as const;
    const payload: ReviewResponse = { ok: true, demo, message: messages[verdict] };
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

// Read-only window into the brain: every captured swipe plus rollup stats,
// so the "Company Brain" is something you can watch fill up as you swipe.
app.get('/api/brain', (req, res) => {
  void (async () => {
    const user = await auth.userFor(req, res);
    if (!user) {
      res.status(401).json({ error: 'sign in with GitHub first' });
      return;
    }
    res.json(await brain.snapshot());
  })().catch((err) =>
    res.status(502).json({ error: err instanceof Error ? err.message : 'failed to load brain' }),
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
    app: '(GitHub App mode — multi-user)',
    token: '(single-token mode — visit /api/setup to create the GitHub App)',
    demo: '(demo mode — visit /api/setup to create the GitHub App, or set GITHUB_TOKEN)',
  }[auth.mode];
  console.log(`gheart api on http://localhost:${PORT} ${modeNote}`);
});
