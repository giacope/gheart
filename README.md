# gheart 💚

**Tinder for pull request reviews.** Swipe right to approve, left to request changes, up to skip. Every open PR gets a dating-style profile: a TL;DR, an "explain like I'm five", vitals (diff size, CI, age, labels), and — when the PR description has screenshots or a screen recording — a clip of the UI changes.

> Because your review queue deserves the same energy as your dating queue.

<p align="center">
  <img src="docs/screenshot-deck.png" alt="The swipe deck" width="320" />
  <img src="docs/screenshot-match.png" alt="It's a merge!" width="320" />
</p>

## Quick start

```bash
npm install
npm run dev        # server on :8788, app on http://localhost:5173
```

With no configuration, gheart runs in **demo mode** with a deck of fictional-but-plausible PRs, so you can feel the swipe immediately. Swipes in demo mode go nowhere.

## Reviewing real PRs

gheart is a **GitHub App** (not an OAuth app): least-privilege permissions (pull requests read/write, checks + contents read), access only to the repos you install it on, and short-lived user tokens that gheart refreshes automatically. Reviews are still submitted **as the signed-in user** — approvals count for branch protection, with a "via gheart" attribution.

Three auth modes, picked automatically:

1. **GitHub App (multi-user)** — the real thing. One-time setup, no GitHub forms to fill:

   ```bash
   npm run dev            # then visit http://localhost:5173/api/setup
   ```

   The setup page creates the GitHub App for you via GitHub's [manifest flow](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest) — one confirmation click on GitHub and the credentials land in gheart's data file automatically (no restart needed). Then install the app on the repos you want to review. Each reviewer signs in with GitHub, sees the installed repos in the picker, and gets their own deck (PRs you've already reviewed don't come back).

2. **Single token** — quick and personal, no app needed:

   ```bash
   GITHUB_TOKEN=ghp_yourtoken GHEART_REPO=owner/repo npm run dev
   ```

3. **Demo** — no configuration at all.

| Env var | What it does |
| --- | --- |
| `GITHUB_APP_CLIENT_ID` / `GITHUB_APP_CLIENT_SECRET` / `GITHUB_APP_SLUG` | Optional — the `/api/setup` flow stores these in the data file for you. Set them (e.g. via [mise](https://mise.jdx.dev) + [fnox](https://fnox.jdx.dev), see `mise.toml`) to override the stored credentials, e.g. in another deployment. |
| `GHEART_BASE_URL` | Public origin for OAuth/setup callbacks (e.g. `https://gheart.example.com`). Defaults to the request's host, which is right for local dev. |
| `GITHUB_TOKEN` | Single-token live mode (used when no GitHub App is configured). Needs `repo` scope. Swiping **right approves** the PR and **left requests changes** — for real. |
| `GHEART_REPO` | Default `owner/repo` to load. You can also pick any repo from the in-app picker. |
| `GHEART_DATA` | Where the JSON store (app credentials, users, sessions, per-user swipe history) lives. Default `data/gheart.json`. |
| `ANTHROPIC_API_KEY` | Optional. Uses Claude to write the TL;DR and ELI5. Without it, a rule-based summarizer takes over. |
| `GHEART_MODEL` | Claude model for summaries (default `claude-haiku-4-5-20251001`). |
| `PORT` | API server port (default `8788`). |

## The profile card

- **Hero** — the first image/video found in the PR description (GitHub attachment links, markdown images, `<img>`/`<video>` tags), or a mood banner if the PR has no visuals. PRs list their age like a dating profile lists, well, age.
- **Mergeability score** — a 0–100 "how easy is this to say yes to": small diffs, green CI, real descriptions, and tests score high; huge failing drafts do not.
- **TL;DR / ELI5** — Claude-written when an API key is present, heuristic otherwise.
- **Vitals** — +/− lines, files, commits, comments, CI status, biggest changed files, labels, branch → base.

## Controls

| Gesture | Keyboard | Button | Result |
| --- | --- | --- | --- |
| Swipe right | `→` | ♥ | Approve (submits an APPROVE review in live mode) |
| Swipe left | `←` | ✕ | Request changes |
| Swipe up | `↑` | ↷ | Skip — no review is sent |
| — | `u` | ⟲ | Undo (restores the card; already-sent reviews stay sent) |

Approving triggers the *It's a merge!* screen. Obviously.

## Scripts

```bash
npm run dev     # dev servers with hot reload
npm test        # vitest unit tests (summarizer, match score, media extraction)
npm run build   # typecheck + production bundle to dist/
npm start       # serve the built app + API on :8788
```

## How it's put together

- `server/` — small Express API: `GET /api/prs` (fetches open PRs, enriches with files/checks, summarizes, and filters out ones you've already reviewed), `POST /api/review` (submits the review as you), `GET /api/repos` (repos from the app's installations), `/api/auth/*` (GitHub App user flow + cookie sessions + token refresh), and `/api/setup` (one-click app creation via the manifest flow). `store.ts` is a tiny JSON-file store for app credentials, users, sessions, and per-user swipe history. `mock.ts` powers demo mode with fully offline animated-SVG "UI clips".
- `src/` — React + Vite frontend. `SwipeDeck` implements the drag physics with pointer events (no gesture library): rotation follows the drag, stamps (`APPROVE` / `NOPE` / `SKIP`) fade in with distance, and vertical scrolling inside the card still works.
- `shared/types.ts` — the `PRProfile` contract both sides speak.
