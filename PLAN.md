# gheart — next build plan (post-P0/P1)

**One-liner:** Bumble for GitHub pull requests. Agents write the code; you swipe
to approve. Every swipe is captured into **gbrain** as structured judgment.

**Theme: Company Brain.** The claims we must show on screen:
*Capture* (the swipe is zero-schlep knowledge capture) → *Memory* (gbrain is the
structured store). The plumbing for both already ships; this plan makes each
**visible in the demo**. (The agent pre-check "execution layer" was cut — the
scripted agent never earned its keep.)

---

## Done (don't rebuild)

The swipe app, reason chips on reject, capture-on-swipe (`server/brain.ts`,
jsonl + gbrain backends), learned `compatibility` score + citation line,
the gstack `precompute.ts` pipeline, GitHub App multi-user
auth. `BrainStore.snapshot()` + `BrainSnapshot`/`BrainStats` types are already
written (uncommitted) but have **no endpoint and no UI** — feature 1 finishes them.

---

## 1. Brain panel — "watch the Company Brain fill up"  🎯 Memory · S

The single most direct proof of the thesis: the brain visibly grows as you swipe.
Finish the `snapshot()` work already in the working tree.

- [ ] `GET /api/brain` in `server/index.ts` → `res.json(await brain.snapshot())`
      (auth-gate it like `/api/prs`).
- [ ] `src/api.ts` — `fetchBrain(): Promise<BrainSnapshot>`.
- [ ] `src/components/BrainDrawer.tsx` — slide-out panel: total / approved /
      rejected counts, `topReasons` as a chip cloud, then the memory list
      (newest first) each showing verdict, `#pr`, title, reason chips.
- [ ] Trigger in `App.tsx` (a "🧠 brain" button in the header) + refetch after
      every swipe so the count ticks up live during the demo.
- [ ] Commit the staged `snapshot()` / `BrainSnapshot` changes with this.

## 2. Loop-closure moment, made visible in the UI  🎯 Execution · M

The star beat: reject → memory → the fixed PR arrives citing it. The logic is
already there (`addressedReasons`, and `compatibility.why` = *"this revision
fixes exactly that"*); it just isn't celebrated on the card.

- [ ] In `PRCard.tsx`, when `compatibility.verdict === 'match'` **and** the
      why-line is a fix-closure (addressed a prior rejection), render a
      distinct **"↩ back, and it listened"** ribbon above the match bar,
      styled to pop.
- [ ] Confirm demo ordering: `seed-brain.ts` seeds the #412 rejection; the deck
      must serve #414 (the fixed revision) so the beat fires. Pin the order in
      `mock.ts` / `cards.json`.
- [ ] Dry-run the exact swipe sequence so #412-reject → #414-match is one clean
      motion in the video.

## 5. Capture on approve, not just reject  🎯 Capture · S

Chips fire only on reject today, so the brain's positive side is inferred, not
stated. Symmetric capture makes "match" citations specific and cheap.

- [ ] `ReasonChips.tsx` — an approve chip set (*clean · well-tested · small ·
      great tests · good fit*); show it on swipe-right the same way reject shows.
- [ ] `App.tsx` — send approve `reasons` in the `ReviewRequest` (the field
      already exists and flows through `POST /api/review` → `captureDecision`).
- [ ] `server/brain.ts` — extend `REASON_LABELS` with the approve reasons and
      use captured approve reasons in the approve why-line (instead of falling
      back to `fingerprint.tags`).

---

## Model notes (unchanged)

- Per-card summary stays **Haiku 4.5** (`claude-haiku-4-5`, in-request).
- gstack review pass stays **Opus 4.8** (`claude-opus-4-8`, offline precompute).
- ⚠️ Do **not** default the review pass to Fable 5 — its cyber-safety classifier
  can refuse the C001 IDOR analysis and kill the star demo.

## Order & cut lines

Build **1 → 2**; each completes one thesis pillar visually, and both sit
on plumbing that already exists (1 is half-committed). **5** is the cheap
high-leverage add-on — slot it in wherever there's slack.

- **Never cut:** the swipe feel, capture-on-swipe, and the loop-closure beat (2).
- If the Brain panel (1) runs long → ship counts + top reasons only; the memory
  list is the polish, the growing count is the point.
