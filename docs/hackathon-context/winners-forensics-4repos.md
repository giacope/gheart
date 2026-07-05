# Forensic Analysis of the Top 4 GStack Hackathon Projects

Subject: The top 4 projects from the GStack hackathon (hosted by Garry Tan) held on 2026-05-16. Each repository was cloned with full history, and we dissected "how they built it in limited time" from real `git log` data (commit hashes, timestamps, per-author file distribution).

---

## 0. The Big Picture

All four projects were completed in a **few-hour sprint on the same day (2026-05-16)** (4.7–8.2 hours of actual work), and their build methods were strikingly similar.

| | 1st Build your Phone | 2nd LearningGraph | 3rd GBody | 4th Hindsight |
|---|---|---|---|---|
| What | Skill set that has Claude auto-QA a real iOS device | AI learning search engine | MCP that gives a robot arm a Claude "body" | Skill set that verifies and calibrates past decisions |
| Form | **Skill set** (5) | Standalone app (Next.js) | Standalone app (Python/MCP) | **Skill set** (6) |
| People | **1 (solo)** | 2 | 2 | 3 |
| Work time | ~4.7h | ~8.2h | ~6h | ~6.9h |
| Spec locked | First commit (15:08) | 10 min in (11:35) | 1h in (14:08) | 1h in (12:32) |
| Pivots | 0 | 2 | 3 | 1 |
| Split axis | — | Layer | Layer | Track |
| Branch/PR | Minimal | None | None | None |

---

## 1. Evolution of the Requirements

### Common rule: "Lock the requirements at high resolution within the first hour, then barely touch them"

All four projects finalized a design document within 10 minutes to 1 hour of starting, and hardly rewrote it afterward.

- **1st**: Wrote `ios-qa/README.md` in the very first commit (15:08) and **never revised it once**. It already contained a "The Demo Moment" diagram up front.
- **2nd**: At 11:35, just 10 minutes in, `docs/design-learngraph.md` was locked at Status: **APPROVED**. It specified the 3-agent pipeline contract and the "single vertical slice (derivatives)" down to detail.
- **3rd**: At 14:08, GStack's `/office-hours` skill auto-generated `DESIGN.md`.
- **4th**: At 12:32, they dropped in `CLAUDE.md` (the spec). From the start it spelled out track ownership, work units A.0–A.7, and the principle "build backward from the 100-second demo."

**Note**: The 2nd and 3rd place teams had GStack's standard `/office-hours` skill write the design document itself — they had AI rapidly draft the requirements, reducing human deliberation time to nearly zero.

### Pivots happen in the "implementation focus," not the "requirements"

The requirement document (what to build) stayed fixed, while implementation-level course changes happened mid-build. The motive was almost always "to make the demo faster and stronger."

- **2nd place's GBrain removal (16:59)**: They judged the memory layer — the very core of the product's original thesis — to be a demo-latency bottleneck and **ripped it out entirely** (route.ts from 163 → 38 lines).
- **3rd place's three consecutive pivots**: USB serial → BLE wireless, 2D hardcoded coordinates → full 6DOF + inverse kinematics, CAPTCHA-clicking → real-object manipulation ("knock over the water bottle").
- **1st place had no pivots**: They nailed the requirements from the first move and deepened in one direction: `feat → perf → fix → feat(demo)`.

---

## 2. The Project Process (granularity → presentation)

### A common 3-phase structure across all projects

Looking at commit density over time, all four projects went through the same three stages:

```
Early (first 30–60 min)   Dump the skeleton all at once + lock the design doc
      ↓
Middle (a few hours)      Build the core + harden speed/stability
      ↓
Late (last 2–3 hrs)       Stop new features, go all-in on polishing the demo experience
```

- **The early ramp-up was abnormally fast**: 2nd place had the skeleton done in the first 38 minutes (scaffold → mock SSE → real agents → tests → deploy config). 1st place's first commit was already 1,553 lines (built locally before committing).
- **The late phase was, without exception, all-in on "demo polish"**: 2nd place's last 3 hours were all `fix(...)` with **zero new features**. 1st place added demo mode, a tap-ripple animation, a "Claude is debugging" blue-frame overlay, and a warm-start cache (819 lines, 37 min before the deadline). 3rd place slipped in live integrations for 4 sponsors right before the buzzer.

### "Work backward from the demo" is written down

Several projects wrote a demo-first design principle right into the design doc. They also thoroughly insured against live failures (4th place pre-computed demo fixtures, committed them, and read them via DEMO_MODE).

- 4th place CLAUDE.md: "build backward from the 100-second demo"
- 2nd place design doc: "pipeline IS the demo," "judges are the primary audience"
- 3rd place run_task.py: "There's an audience. Narrate your thinking charismatically and show off."

---

## 3. Division of Roles ★the crux

### Conclusion: the winners split by "layer/track," not "by skill"

Testing the hypotheses:

- **(a) "If you only make skills, it's hard to split into frontend/backend/pitch" → Correct.** That's exactly why nobody split along that axis.
- **(b) "Divide by skill" → The winners did not use this method.** Even the 3-person 4th place team had one person write all 6 skills.
- **(c) "Designed with a solid, sizable set of requirements" → Correct.** They could handle big requirements because they cut the division by "layer" (strata whose ownership doesn't overlap).

### Per-project data

**1st (solo)**: A single builder. Riding gstack's skill conventions, they broke through with 5 skills containing a working Swift debug bridge in ~4.7 hours. → With one person, the division problem disappears. A great example of building big even solo by "riding an existing platform."

**2nd (2 people, fully divided)**: Nicolas = backend / 9 agents / 13 tests / infra (`src/`); oski = frontend only (vanilla JS in `public/`, touched backend just once). Directory boundary = person boundary.

**3rd (2 people, fully divided)**: Anish = the entire Python core engine (+6,291 lines) + tests; Jake = README / demo HTML / design docs / narrative / sponsor integrations. File boundary = person boundary.

**4th (3 people, track division)** — closest to the hypothesis, but even more disciplined in practice: Within the first hour, Rayan wrote **an explicit "Track ownership — files you may / may not edit" boundary into `CLAUDE.md`** before parallel work began. Rayan = the entire skill-implementation layer (all 6 skills), Keshav = the entire data/corpus (228 essays)/API-integration layer, Rushil = the extension (separate repo) + presenting. **By layer, not by skill.**

### The shared collaboration pattern

- **No branches, no PRs** (3 of the 4 projects). Everyone pushed directly to `main`, integrating manually in real time via frequent `git pull`.
- **The absence of conflicts was by design, not luck.** They rigorously "drew the file/directory ownership boundaries first," then touched only within them. In a short sprint, PR-review round-trips are more of a hindrance.

---

## Summary: the winning formula shared by the top 4

1. **Lock a high-resolution design doc within the first hour** (and have an AI skill like `/office-hours` draft it, cutting human deliberation to zero). Fix the requirements and don't revise them afterward.
2. **Divide by "layer/track," not "by skill," and only after writing the edit boundaries down.** Because the boundaries separate cleanly along file paths, you need no branches or PRs — everyone pushes directly to `main` with zero conflicts. One person owns the engine (deep), another owns the demo/narrative (high frequency).
3. **Write "work backward from the demo" in as a design principle.** Build the core in the middle phase; in the final 2–3 hours stop new features and go all-in on polishing the demo experience, optimizing speed, and insuring against live failures.
4. **The resolve to drop even the product's original thesis in the final phase if it's a "demo bottleneck"** (2nd place's GBrain removal). Requirements stay fixed, but the implementation focus moves OODA-style, as many times as the demo needs.

---

*Source: Full-history Git forensic analysis of each repository (conducted 2026-07-05). Local clones retained under scratchpad/hackathon-repos/.*
