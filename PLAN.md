# gheart — build plan (YC RFS Summer 2026)

**One-liner:** Bumble for GitHub pull requests. Agents write the code; you swipe
to approve. Every swipe is captured into **gbrain** as structured judgment, and
agents query that brain *before* opening the next PR — so the deck learns your
taste and stops showing you PRs you'd reject.

**Theme: Company Brain** (Tom Blomfield). The swipe is zero-schlep knowledge
capture; gbrain is the structured store; the agent pre-check endpoint is the
"execution layer for AI." Positioning: *gstack gave agents hands, gbrain gave
them memory, gheart gives them taste — and humans make the first move.*

---

## 1. Where the prototype is now (what already exists on `main`)

A genuinely polished **L0 swipe app** — but with **zero memory and no gstack/gbrain**.

- **Frontend (`src/`)** — React + Vite. `SwipeDeck.tsx` hand-rolls pointer
  swipe physics (approve/reject/skip), `PRCard.tsx` renders the profile (hero
  media, match bar, stat chips, TL;DR, ELI5, tags, top files), `MatchOverlay`,
  `ActionBar`, keyboard shortcuts + undo. Looks like a dating app already.
- **Backend (`server/`)** — Express. `GET /api/prs` lists+enriches open PRs
  (`github.ts`), `POST /api/review` submits APPROVE/REQUEST_CHANGES. `summarize.ts`
  makes **one Haiku call** for tldr/eli5 with a heuristic fallback. `matchScore`
  is a **static heuristic** (size + CI + tests). `mock.ts` has 9 hand-written
  demo PRs for offline mode.
- **Shared (`shared/types.ts`)** — `PRProfile`, `SwipeVerdict`, review req/resp.

**The gap = the whole thesis.** Today a swipe hits the GitHub API and vanishes.
Nothing is captured, nothing is learned, the score isn't informed by history,
the "green/red flags" aren't real review findings, and neither gstack nor gbrain
is wired in. The re-plan closes exactly that gap.

## 2. Target architecture

```
OFFLINE (before the demo) ─ scripts/precompute.ts
  demo PRs ─▶ Claude Agent SDK runs gstack /review + /cso ─▶ green/red flags, risk
                    │  (Opus 4.8, ~10–30s/PR — never in request path)
                    ├─▶ gbrain: seed prior decisions (loop-closure demo)
                    └─▶ writes cards.json  ─────────────────────────────┐
                                                                        │
LIVE (fast) ─ Express server                                            ▼
  GET  /api/prs      cards.json (or GitHub) + per-card compatibility  ◀─ gbrain search
  POST /api/review   GitHub review  +  gbrain capture(decision + chips) ─▶ gbrain
  POST /api/precheck  agent posts a diff → gbrain think → verdict+memories (agent-facing)
                                                                        ▲
  agents (before opening a PR) ───────────────────────────────────────┘
```

Rule: **gstack/Agent-SDK runs offline; gbrain reads are fast so they run live;
gbrain writes are fire-and-forget on swipe.** The demo path never blocks on an
agent.

## 3. How we use gbrain (three touch points)

gbrain surface we rely on: `gbrain init` (local PGLite, ~2s), `gbrain capture`
(ingest a typed page), `gbrain search` (hybrid retrieval), `gbrain think`
(synthesized answer + citations), `gbrain serve` (stdio/HTTP MCP). A "brain" is
a DB of git-backed markdown pages with frontmatter and `[[wikilinks]]`.

**(a) Capture on swipe — the knowledge-capture claim.**
In `POST /api/review`, after the GitHub review, write a `review-decision` page.
New `server/brain.ts` → `captureDecision()`, shelling out to `gbrain capture`
(or POST to its `/ingest` webhook). Page:
```md
---
type: review-decision
verdict: reject
repo: demo/lovable-app
pr: 351
author: bug-whisperer
reasons: [no-tests, touches-auth]
fingerprint: { size: large, dirs: [services/payments], has_tests: false, labels: [refactor] }
swiped_at: 2026-07-05T…
url: https://github.com/…/pull/351
---
Rejected #351. No tests on a large payments refactor.
<PR tldr pasted here so `think`/`search` has semantic content to retrieve on>
```
The reason chip is the structured signal; the tldr gives `think` something to
reason over. This is why capture actually happens: two taps, real data.

**(b) Score on load — the compatibility claim (the money shot).**
When building each `PRProfile`, call `gbrain search`/`think` with the PR's
fingerprint to find nearest past decisions, and derive a **learned**
compatibility score + a citation. Replaces/augments the static `matchScore`.
Add to `PRProfile`:
```ts
compatibility?: {
  score: number;               // 0–100, learned from past swipes
  verdict: 'match' | 'maybe' | 'pass';
  why: string;                 // "You rejected #327 for the same reason"
  citations: { pr: number; verdict: SwipeVerdict; reason: string; url: string }[];
}
```
Card shows the citation line under the match bar. Over a demo session the score
visibly climbs as the brain fills — that's Company Brain on screen.

**(c) Agent pre-check — the execution-layer claim (Software for Agents).**
New `POST /api/precheck`: an agent about to open a PR posts a diff summary; we
run the same gbrain lookup (`think`) and return **machine-readable** JSON:
```json
{ "predictedVerdict": "reject", "confidence": 0.82,
  "memories": [{ "pr": 327, "reason": "no rollback on schema drop", "url": "…" }] }
```
The agent self-corrects before the human ever sees the card. One endpoint makes
"the brain is an execution layer" concrete.

## 4. Claude Agent SDK running gstack (the profile pipeline)

`scripts/precompute.ts` uses `@anthropic-ai/claude-agent-sdk`. For each demo PR
it checks the diff into a temp dir and runs gstack's review skills headlessly,
returning structured findings — which become the card's green/red flags:

```ts
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const msg of query({
  prompt: "Run /review and /cso on the diff in ./work. Return findings only.",
  options: {
    settingSources: ["user", "project"],     // loads ~/.claude/skills/gstack
    skills: "all",                             // enable gstack's /review, /cso
    mcpServers: { gbrain: { command: "gbrain", args: ["serve", "--stdio"] } },
    allowedTools: ["Read","Grep","Bash","mcp__gbrain__*"],
    outputFormat: { type: "json_schema", schema: FINDINGS_SCHEMA }, // validated JSON
  },
})) {
  if (msg.type === "result" && msg.subtype === "success") cards.push(normalize(msg.structured_output));
}
```

Notes that matter:
- **It's slow (~10–30s and several tool turns per PR).** Run it **before** the
  demo; write `cards.json`; the server serves that in demo mode. Never live.
- gstack skills trigger by task match; if a bare `/review` in the prompt doesn't
  fire the skill on the day, describe the task so the skill's description
  matches. Pin this in the pre-event rehearsal.
- Registering **gbrain as an MCP server** here lets the review agent consult
  past decisions while it writes the card, and powers the pre-check agent.

## 5. Concrete build list (mapped to files)

**P0 — the thesis must be demonstrable (do first):**
- [ ] `server/brain.ts` — `captureDecision()` + `scoreAgainstMemory()` behind a
      `BrainStore` interface. Two impls: real gbrain (CLI/MCP) and a
      `brain.jsonl` fallback with identical schema (de-risk install day-of).
- [ ] Wire `captureDecision()` into `POST /api/review`; add `reasons?: string[]`
      to `ReviewRequest`.
- [ ] Reason-chip picker on reject — new `src/components/ReasonChips.tsx`
      (6 chips: *too big · no tests · touches auth · wrong layer · duplicate ·
      vibe off*), send chips in the review.
- [ ] `compatibility` on `PRProfile` from `scoreAgainstMemory()`; render the
      citation line in `PRCard.tsx`.
- [ ] Loop-closure seed: pre-load the brain with C002-iter1 rejection; show
      C002-iter2 arriving with a high score citing the memory.

**P1 — makes it real, not just live:**
- [ ] `scripts/precompute.ts` (Agent SDK + gstack) → `cards.json`; serve it in
      demo mode instead of `mock.ts`.
- [ ] `greenFlags` / `redFlags` on `PRProfile` from gstack findings; render on card.
- [ ] `POST /api/precheck` + a tiny agent-demo script that shows self-correction.

**P2 — polish / stretch:**
- [ ] "Super like" → gstack `/ship` (approve + merge queue).
- [ ] Live GitHub reviews citing chips + gbrain refs in the comment body.
- [ ] Match-rate line chart falling over the session.

## 6. Model choices (and one real gotcha)

- **Per-card summary (in-request):** keep **Haiku 4.5** (`claude-haiku-4-5`) —
  already used in `summarize.ts`; cheap and fast, correct for a per-PR tldr.
- **gstack review pass (offline precompute):** **Opus 4.8** (`claude-opus-4-8`)
  — strong real-bug finding; latency/cost don't matter offline.
- **⚠️ Do NOT default the review pass to Fable 5.** Fable 5 runs cyber-safety
  classifiers that can **refuse** security analysis, and our C001 card runs
  through gstack `/cso` on an IDOR — a refusal would kill the star demo. Opus
  4.8 has no such classifier. Use Fable 5 only for non-security lenses if we
  want max recall, with an Opus fallback.

## 7. Cut lines (protect the thesis)

Real gbrain **(a)+(b)** — capture on swipe and the learned, citing score — is
the theme. Guard it:

1. gstack Agent-SDK pipeline too flaky → hand-author `cards.json` from `mock.ts`
   (green/red flags written by hand) but **keep gbrain live**. The memory loop
   is the thesis; the gstack review is garnish.
2. Real gbrain install painful → flip `BrainStore` to the `brain.jsonl` impl
   (same schema, same demo, cosine/tag-overlap scoring).
3. Pre-check endpoint → scripted terminal moment in the video.
4. **Never cut:** the swipe feel, capture-on-swipe, and the loop-closure beat
   (reject → memory → next PR arrives fixed, citing it).

## 8. Day-of ownership (4 people)

- **A (UI):** reason chips, compatibility/citation line, match moment, polish.
- **B (pipeline):** `precompute.ts` + Agent SDK + gstack → `cards.json`; GitHub
  review wiring.
- **C (brain):** `server/brain.ts`, gbrain init + schema, capture + score wiring,
  pre-check endpoint, loop-closure seed.
- **D (pitch/demo):** freeze demo script first, dry-run the swipe session,
  record the 90s video, submission materials.

Reuse the **gheart-eval** seeded-defect corpus (`forward/.claude/worktrees/
gheart-eval/`) for demo PRs: C001 IDOR (red-flag card), C002 migration
(loop-closure star), C005 clean decoy (instant right-swipe).
