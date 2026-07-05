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

gheart has three auth modes, picked automatically from the environment:

1. **GitHub OAuth (multi-user)** — the real thing. Each reviewer signs in with GitHub, picks one of their repos, and swipes with their own account. Reviews are submitted as the signed-in user, and every user gets their own deck (PRs you've already reviewed don't come back).

   [Create a GitHub OAuth app](https://github.com/settings/applications/new) with callback URL `http://localhost:5173/api/auth/callback` (or your deployed origin + `/api/auth/callback`), then:

   ```bash
   GITHUB_CLIENT_ID=xxx GITHUB_CLIENT_SECRET=yyy npm run dev
   ```

   This repo manages those with [mise](https://mise.jdx.dev) + [fnox](https://fnox.jdx.dev): `mise.toml` sets `GITHUB_CLIENT_ID` and pulls `GITHUB_CLIENT_SECRET` from the encrypted `fnox.toml` (age-encrypted; decryption needs the key in `~/.config/fnox/age.txt`). With mise activated, just `npm run dev` — the env is already there. To rotate the secret: `fnox set GITHUB_CLIENT_SECRET`. Without the age key, mise env resolution fails — fall back to plain env vars or your own fnox key.

2. **Single token** — quick and personal, no OAuth app needed:

   ```bash
   GITHUB_TOKEN=ghp_yourtoken GHEART_REPO=owner/repo npm run dev
   ```

3. **Demo** — no env vars at all.

| Env var | What it does |
| --- | --- |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Enables the GitHub OAuth sign-in flow (multi-user mode). The OAuth app needs the `repo` scope granted at authorize time (gheart requests `repo read:user`). |
| `GHEART_BASE_URL` | Public origin for the OAuth callback (e.g. `https://gheart.example.com`). Defaults to the request's host, which is right for local dev. |
| `GITHUB_TOKEN` | Single-token live mode (used when no OAuth app is configured). Needs `repo` scope. Swiping **right approves** the PR and **left requests changes** — for real. |
| `GHEART_REPO` | Default `owner/repo` to load. You can also pick any repo from the in-app picker. |
| `GHEART_DATA` | Where the JSON store (users, sessions, per-user swipe history) lives. Default `data/gheart.json`. |
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

- `server/` — small Express API: `GET /api/prs` (fetches open PRs, enriches with files/checks, summarizes, and filters out ones you've already reviewed), `POST /api/review` (submits the review as you), `GET /api/repos` (your repos for the picker), and `/api/auth/*` (GitHub OAuth flow + cookie sessions). `store.ts` is a tiny JSON-file store for users, sessions, and per-user swipe history. `mock.ts` powers demo mode with fully offline animated-SVG "UI clips".
- `src/` — React + Vite frontend. `SwipeDeck` implements the drag physics with pointer events (no gesture library): rotation follows the drag, stamps (`APPROVE` / `NOPE` / `SKIP`) fade in with distance, and vertical scrolling inside the card still works.
- `shared/types.ts` — the `PRProfile` contract both sides speak.
