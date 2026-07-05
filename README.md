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

```bash
GITHUB_TOKEN=ghp_yourtoken GHEART_REPO=owner/repo npm run dev
```

| Env var | What it does |
| --- | --- |
| `GITHUB_TOKEN` | Enables live mode. Needs `repo` scope (or fine-grained: PRs read/write). Swiping **right approves** the PR and **left requests changes** — for real. |
| `GHEART_REPO` | Default `owner/repo` to load. You can also type any repo in the top bar. |
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

- `server/` — small Express API: `GET /api/prs` (fetches open PRs, enriches with files/checks, summarizes) and `POST /api/review` (submits the review). `mock.ts` powers demo mode with fully offline animated-SVG "UI clips".
- `src/` — React + Vite frontend. `SwipeDeck` implements the drag physics with pointer events (no gesture library): rotation follows the drag, stamps (`APPROVE` / `NOPE` / `SKIP`) fade in with distance, and vertical scrolling inside the card still works.
- `shared/types.ts` — the `PRProfile` contract both sides speak.
