# gheart — hackathon plan (YC RFS Summer 2026)

**One-liner:** Bumble for GitHub pull requests. Agents write the code; you
swipe to approve. Every swipe becomes a memory in your company brain, so the
agents learn your taste and stop showing you PRs you'd reject.

**The line that sells it:** Garry gave agents hands (gstack) and a brain
(gbrain). gheart gives them a heart — taste, judgment, and the rule that
**humans make the first move**.

## Theme: Company Brain

Submitted under **Company Brain** (Tom Blomfield): "structure and update
fragmented internal knowledge and convert it into an execution layer for AI."

The pitch mapping is exact:

- **Fragmented internal knowledge** = engineering judgment. Why PRs get
  rejected lives in review comments, Slack threads, and senior engineers'
  heads. It evaporates. Nobody writes it down because writing it down is a
  schlep (paulgraham.com/schlep.html — keep the opener from the old plan).
- **Structure and update** = the swipe. A swipe left with a reason chip is the
  lowest-friction knowledge capture ever invented. Each one is written to
  gbrain as a typed page (verdict, reasons, diff fingerprint, PR link).
- **Execution layer for AI** = agents query gbrain *before* opening a PR.
  "Would this get swiped left?" is an API call. The brain isn't a wiki — it
  gates and shapes agent work.

The other two themes appear as demonstrated properties, not the submission:
*Dynamic Software Interfaces* (code review reimagined as a card stack, cards
composed per-viewer by agents) and *Software for Agents* (gheart's pre-check
MCP endpoint is agent-first: machine-readable verdicts, not human prose).

## The metaphor, played completely straight

| Bumble | gheart |
|---|---|
| Profile card | PR card: title, author avatar, age, diff stats |
| Bio | gstack-generated summary (what it does, in two sentences) |
| Green flags / red flags | gstack `/review` + `/cso` findings, distilled |
| Compatibility score | gbrain: does this match our past decisions? cites them |
| Swipe right | approve (GitHub review APPROVE) |
| Swipe left | request changes + reason chips → gbrain memory |
| Super like | approve + merge queue (gstack `/ship`) |
| "Women message first" | **Humans make the first move.** No agent merges until a human likes it. |
| It's a match! | your swipe agrees with the agent reviewers' verdict → auto-merge |
| Ghosting | stale agent PRs auto-close after N days unswiped |

Reason chips on swipe-left (tap 1–2, or dictate one sentence): *too big ·
no tests · touches auth · wrong layer · duplicate · vibe is off*. The chip is
the knowledge. This is why capture actually happens: rejecting a PR takes two
seconds and produces structured data as a side effect.

## The flywheel (this is the demo arc)

1. Agent PRs flood in (seeded from the gheart-eval corpus).
2. You swipe through 10 in 60 seconds. Left-swipes carry reasons.
3. Each swipe → `gbrain capture` (typed page: decision, with frontmatter).
4. Next agent, before opening a PR, hits gheart's pre-check endpoint →
   `gbrain think` → "you rejected a schema drop without rollback on C002;
   include a down-migration." The PR arrives already conforming, **citing the
   memory that shaped it**.
5. Compatibility scores rise over the session. Fewer left-swipes. The brain
   is visibly compounding — that's the Company Brain money shot.

## Architecture

```
GitHub PRs ──▶ profile pipeline ──▶ card store ──▶ swipe UI (the demo)
              (gstack /review,        (JSON)          │
               /cso via headless                      ▼ swipe events
               Claude Code)                    GitHub review API
                                                      │
                                                      ▼
                                              gbrain capture (typed pages)
                                                      ▲
agents (pre-check MCP/API) ── gbrain think ───────────┘
```

- **Swipe UI** — single-page card stack, mobile-feel, pointer/touch drag with
  spring physics. This is the centerpiece; it must feel like a dating app,
  not a dashboard. Haptic-style feedback, "It's a match!" full-screen moment.
- **Profile pipeline** — headless Claude Code running gstack `/review` +
  `/cso` per PR, output normalized to a card JSON (bio, green flags, red
  flags, risk). **Pre-generate all demo cards before the stage** — never run
  gstack live in the demo path.
- **gbrain** — local PGLite brain (`gbrain init`, 2s startup, no server).
  Swipes written via `capture` with a `decision` page type; compatibility via
  `think` with citations; agents connect over its MCP server.
- **GitHub** — real reviews via API (APPROVE / REQUEST_CHANGES with generated
  comment citing the reason chips + gbrain references). Demo repo, not a live
  org.
- **Pre-check endpoint** — small HTTP/MCP shim: agent posts a diff summary,
  gets back predicted verdict + the memories it would trip. This one endpoint
  is the "execution layer" claim made concrete.

## What we reuse

- **gheart-eval corpus** (`forward/.claude/worktrees/gheart-eval/`): the
  seeded-defect cases become the demo PRs — C001 IDOR (the red-flag card the
  audience gasps at), C002 irreversible migration (the loop-closure star),
  C005 clean decoy (instant right-swipe, shows we're not crying wolf).
- **Loop-closure story** from the old organism plan survives intact: C002
  rejected in iteration 1 → memory → iteration 2 arrives fixed, citing it.
  Same learning demo, better costume.
- **Old plan's schlep opener** and the head-to-head honesty ethos.

## Pre-event checklist

- [ ] Demo repo with 10–12 seeded PRs (port from gheart-eval corpus + a few
      mundane ones for swipe-rhythm)
- [ ] gstack + gbrain installed, profile pipeline script working end-to-end
      on one PR
- [ ] Card design mocked (this is a *dating app* — it needs to be pretty)
- [ ] Reason-chip taxonomy frozen (6 chips max)
- [ ] Pitch skeleton + 90s video beat sheet
- [ ] One full stack rehearsal

## Day of (build 12:00–17:00, 4 people)

| Time | A (UI) | B (pipeline) | C (brain/agents) | D (pitch/demo) |
|---|---|---|---|---|
| 12:00–12:30 | roles, repo, demo repo seeded, **demo script frozen first** ||||
| 12:30–14:00 | card stack + swipe physics | gstack → card JSON for all PRs | gbrain init, capture schema, swipe→capture wiring | pitch draft, video beat sheet |
| 14:00–15:30 | match moment, reason chips, polish | GitHub review API wiring | pre-check endpoint + agent loop-closure demo | dry-run swipe session, freeze card content |
| 15:30–16:15 | integrate, freeze, **record 90s video** ||||
| 16:15–17:00 | rehearse ×3, submission materials, buffer ||||

**Cut lines in order:** live GitHub API (fall back to local queue, show the
API call in the video) → pre-check endpoint becomes a scripted terminal
moment → gbrain becomes a JSONL ledger with identical schema → **never cut
the swipe feel or the loop-closure beat.**

## 90-second video

- 0–10s — Schlep quote. "Agents opened 4,000 PRs at your company last month.
  Someone has to say no." (screenshot: PR list from hell)
- 10–30s — The swipe. Ten PRs in twenty seconds. C001's IDOR card comes up
  red-flagged with the attack path. Left. *"Humans make the first move."*
- 30–55s — The brain. Swipe left on C002 (no rollback) → gbrain page appears
  → next agent PR arrives with a down-migration, citing the memory. Line
  chart: left-swipe rate falling.
- 55–75s — The match. Clean PR, agent verdict and human swipe agree, "It's a
  match!", merge queue. Pre-check call shown: agent asks before it builds.
- 75–90s — "gstack gave agents hands. gbrain gave them memory. gheart is
  taste — and taste is the only moat left. Your best engineer's judgment,
  captured two seconds at a time, working after they log off."

## Business / judges

- **Pricing:** per seat for swiping; per verified merge for the agent
  pre-check API (the brain is the billing meter, same as the old plan's
  ledger-as-billing-record).
- **Moat:** the swipe ledger. Engineering taste as an accumulating asset that
  survives attrition. Switching cost grows with every swipe.
- **GTM:** free "taste audit" — point gheart at a repo's closed PRs, show the
  org what its own rejection patterns are, sell the brain.
- **Tan:** built *on* gstack + gbrain, not beside them — gheart is the
  missing organ in his own stack. Name the family on the slide.
- **Blomfield (Company Brain):** capture-without-schlep is the whole thesis;
  the reason chip is the answer to "how do you get people to feed the brain."

## Submission mapping

problem = review bottleneck + evaporating judgment (schlep framing) ·
product/tech = swipe capture → gbrain → agent pre-check flywheel ·
business = per-merge pricing, taste-as-moat · demo video = above.
