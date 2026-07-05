# CLAUDE.md

gheart — "Tinder for pull request reviews." React + Vite front end (`src/`),
Express API (`server/`), shared contract in `shared/types.ts`. See `README.md`
for the product tour and `PLAN.md` for the thesis (capture → learned score →
agent pre-check).

## Verifying changes side-by-side (cmux)

The core loop is meant to be *watched*: seed a rejection → an agent asks the
brain before opening a PR → it self-corrects → you swipe → the next card cites
that memory. When verifying a change, lay the three surfaces next to each other
with the `cmux` CLI so the loop is visible in one glance. (The `/cmux` skill
covers the same commands.)

Build a three-surface workspace — **dev logs | swipe deck | agent** — from the
repo root. Every `new-*` command echoes the ref it just created; `cmux
list-panels` reprints them if you lose track, so read the printed refs rather
than assuming the `surface:A/B/C` numbers below.

```bash
# One workspace rooted in the repo
cmux new-workspace --name "gheart 💚 verify" --cwd "$(pwd)"        # → workspace:N

# Left surface: dev servers (server :8788 + web :5173)
cmux send-panel --panel surface:A "npm run dev\n"                  # surface:A = the first terminal

# Middle surface: the swipe deck, as a live browser pane
cmux new-pane --type browser --direction right --url http://localhost:5173   # → surface:B

# Right surface: the brain + agent pre-check loop
cmux new-split right                                              # → surface:C
cmux send-panel --panel surface:C "npm run seed:brain && npm run precheck:demo\n"
```

What each surface proves, all at once:

- **Right** — the agent hits `POST /api/precheck` about a table-dropping
  migration, is told *reject* (citing the seeded #412), adds a rollback + test,
  and flips to *approve* 💚.
- **Middle** — deal the deck and card **#414** arrives with a high learned score
  whose citation line links the #412 rejection the agent just reasoned about.
- **Left** — each swipe fires a `review-decision` capture; watch it land in the log.

Drive the swipe from the CLI and screenshot the payoff — no mouse:

```bash
cmux browser surface:B press ArrowRight                    # swipe right = approve (the app's → shortcut)
cmux browser surface:B screenshot --out docs/its-a-merge.png   # the "It's a merge!" screen
```

For a hands-off / scripted assertion, read a surface back instead of eyeballing it:

```bash
cmux read-screen --surface surface:C --lines 40 | grep -qi "approve" && echo "loop closed ✅"
```

Tear the workspace down when done: `cmux close-workspace --workspace workspace:N`.
