# GStack / GBrain Setup & Usage Guide (YC RFS Hackathon 2026-07-05)

Source: This guide was compiled by fetching the following sources via WebFetch/WebSearch (as of 2026-07-05).
- https://github.com/garrytan/gstack (README, docs/skills.md, USING_GBRAIN_WITH_GSTACK.md, setup script)
- https://github.com/garrytan/gbrain (README top-page overview)
- YC article "Inside Garry Tan's AI Coding Setup" (**the body text could not be fetched directly**. Only secondary information via WebSearch snippets. Noted explicitly below.)
- https://vectorize.io/articles/what-is-gbrain
- https://www.marktechpost.com/2026/05/22/... (hands-on tutorial article for GBrain setup)
- https://techcrunch.com/2026/03/17/... and Hacker News (id=47418576) — for corroborating criticisms and caveats

---

## 1. What is GStack

**GStack** is an OSS toolkit released publicly by Garry Tan, President and CEO of YC, that turns Claude Code (and a total of 10 kinds of AI agents including Codex / Cursor / Factory / OpenCode) into "a virtual engineering team you can run by yourself." In substance it is **23 specialized roles (slash commands) + 8 power tools**, all implemented as Markdown files. There is no proprietary runtime — it simply sits on top of Claude Code's Skills mechanism. MIT licensed, free.

### Mechanism / philosophy

- In response to the concern that plain Claude Code tends to write "code that looks plausible but breaks in production," the design philosophy is to **turn human organizational structures — roles, processes, review — directly into prompts** in order to curb the model's drift.
- Skills are arranged along a **Think → Plan → Build → Review → Test → Ship → Reflect** seven-stage cycle, chained so that the output of each skill becomes the input to the next.
- Tan's own claimed productivity gains ("2026 pace is roughly 810x compared to 2013," having shipped 3 production services and 40+ features in the last 60 days) have also drawn strong criticism on Hacker News / TechCrunch (details in Section 5).

### File layout (overview)

```
~/.claude/skills/gstack/         # install location (for Claude Code)
├── setup                        # install/link shell script
├── docs/
│   └── skills.md                 # reference for all skills
├── USING_GBRAIN_WITH_GSTACK.md   # GBrain integration guide
├── bin/
│   ├── gstack-team-init
│   ├── gstack-uninstall
│   └── ...
└── (60+ skills/browser-tool/benchmark directories, TypeScript ~79%)
```

Once installed, global state is created at `~/.gstack/projects`, and on the project side `.claude/` (symlinks to skills, etc.) is created and `CLAUDE.md` is appended to.

### Main skills (in workflow order)

**THINK (discovery / planning)**
- `/office-hours` — re-examines product assumptions with six probing questions before coding
- `/plan-ceo-review` — redefines scope (4 modes: expand / selectively expand / hold scope / reduction)
- `/plan-eng-review` — nails down architecture, data flow, edge cases, and test policy
- `/plan-design-review` — scores design on a 0–10 scale and makes explicit what "a 10" looks like
- `/autoplan` — auto-chains CEO → design → engineering review

**BUILD (design / implementation)**
- `/design-consultation` — builds a design system from scratch
- `/design-shotgun` — generates multiple UI proposals and selects via a comparison board
- `/design-html` — generates production-grade HTML/CSS from an approved mockup
- `/scrape` / `/skillify` — prototypes web data retrieval, then codifies it into a reusable skill

**REVIEW (quality assurance)**
- `/review` — a harsh code review targeting "bugs that pass CI but break in production," with auto-fixes
- `/investigate` — root-cause investigation built on the iron rule "don't fix without investigating"
- `/design-review` — an 80-item visual audit of a production-equivalent site, with fixes and before/after screenshots
- `/cso` — a security audit covering OWASP Top 10 + STRIDE
- `/codex` — an independent second opinion via the OpenAI Codex CLI (3 modes: pass/fail gate / adversarial verification / consultation)

**TEST (verification)**
- `/browse` — real clicks and real screenshots in an actual Chromium browser (~100ms/command)
- `/qa` — finds bugs via real browser interaction, fixes them immediately, and auto-generates regression tests
- `/qa-only` — report only, no fixes
- `/benchmark` / `/canary` — performance measurement, post-deploy monitoring loop

**SHIP (release)**
- `/ship` — sync with main → test → coverage audit → push → create PR
- `/land-and-deploy` — an end-to-end flow from PR merge through deploy to production health check
- `/document-release` / `/document-generate` — auto-update/generate documentation to match what shipped (Diataxis framework)

**REFLECT (retrospective)**
- `/retro` — a team-level weekly retrospective
- `/learn` — manages learnings (project-specific knowledge) that carry across sessions
- `/context-save` / `/context-restore` — save/restore working context (useful for resuming across sessions)

**Safety devices / utilities**
- `/careful` (destructive command warnings), `/freeze` (restrict edit scope to one directory), `/guard` (combination of both), `/unfreeze`
- `/health` — a unified 0–10 code quality score combining type checking, lint, tests, and dead-code detection
- `/pair-agent` — pairs multiple agents (OpenClaw/Codex/Cursor/Hermes) on the same browser
- `/setup-gbrain` / `/sync-gbrain` — GBrain integration (see next chapter)
- `/make-pdf`, `/diagram` — Markdown→PDF, English description → Mermaid/Excalidraw/SVG diagram generation
- iOS-related: `/ios-qa`, `/ios-fix`, `/ios-design-review`, etc. — QA/fix loops using a real iPhone

### Typical workflow example (sample from the official README)

```
/office-hours          → talk through the idea. Assumptions get questioned, and candidate implementation approaches and effort estimates come out
/plan-ceo-review        → redefine scope, surface hidden requirements
/plan-eng-review        → nail down architecture, diagrams, edge cases
(implementation runs. rough guide: ~2,400 lines in about 8 minutes)
/review                 → auto-fixes + flags completeness gaps
/qa https://staging.myapp.com  → test the flow in a real browser and fix bugs
/ship                   → run tests → create PR
```

---

## 2. What is GBrain

**GBrain** is another OSS project released by Garry Tan — a "persistent memory (brain) layer for AI agents." The official README's tagline is **"Search gives you raw pages. GBrain gives you the answer."** — positioning it so that where a search engine returns raw pages, GBrain returns a synthesized, citation-backed answer. Where GStack alone strengthens "the current session," GBrain is the complementary piece that handles "memory across sessions."

### Mechanism (3-layer architecture)

1. **Brain repository (Git-managed Markdown)** — Markdown organized by topic (people, companies, concepts, etc.) serves as the source of truth. Each page is written in a "summary (compiled truth) + dated timeline" pattern.
2. **Search/retrieval layer** — choose between two engines:
   - **PGLite** (WASM Postgres) — for individual use, up to roughly 50k pages, works with zero configuration
   - **Postgres + pgvector** — for shared, large-scale, multi-machine use
   Hybrid search combining vector embeddings + BM25 keyword matching + graph signals (reciprocal rank fusion). Query expansion via Claude Haiku is optional.
3. **Agent skill layer** — 34–43 Markdown skills (the count varies by article) that teach the agent the conventions for ingestion, enrichment, search, and scheduled (cron) execution.

### Key features

- **Hybrid search**: vector embeddings + keywords + graph signals, with customizable weighting
- **Self-wiring knowledge graph**: automatically extracts typed edges such as works_at / invested_in / founded without any LLM calls
- **Synthesis layer**: generates cited answers, and honestly flags "gaps" wherever information is insufficient
- **Job queue (Minions)**: Postgres-native persistent subagents that carry out autonomous enrichment
- **Per-repository trust policy**: three kinds — `read-write` / `read-only` / `deny`

### How to integrate with GStack

A path is provided for using GBrain from within GStack.

- **Setup**: the single `/setup-gbrain` skill completes state detection → up to 3 questions → initial configuration, MCP registration, and trust policy setup, all in under 5 minutes.
- **Connection destination (4 paths, choose one)**:
  1. Paste in the Session Pooler URL of an existing Supabase project
  2. Hand over a Supabase Personal Access Token for auto-provisioning (creates a new project, polling completes in about 90 seconds) — **note: the official documentation explicitly states that this token has full access not only to the newly created project but to every project in that Supabase account**
  3. `gbrain init --pglite` to build a zero-config local setup (about 30 seconds)
  4. Connect to a remote MCP server (via Tailscale/ngrok/LAN. A split setup is also possible where brain queries go to a remote MCP while code search stays on local PGLite)
- **MCP registration with Claude Code**:
  ```
  claude mcp add gbrain -- gbrain serve
  ```
  This makes gbrain appear in the session as a typed tool rather than a shell-out.
- **Sync commands**:
  ```
  /sync-gbrain                # incremental sync (a few seconds when clean)
  /sync-gbrain --full         # full re-index (25–35 minutes)
  /sync-gbrain --code-only    # index code changes only
  /sync-gbrain --dry-run      # preview only, what would change
  ```
  Sync runs three independent stages — "code," "memory," and "brain-sync" — so partial success is possible even if one stage fails.
- On success, a "GBrain Search Guidance" block is automatically appended to `CLAUDE.md`, teaching the agent when to prefer `gbrain search` / `code-def` over Grep (if the round-trip test fails, this block is automatically removed — a design meant to avoid giving incorrect guidance).

---

## 3. Setup steps

**Prerequisites (GStack)**: Claude Code, Git, Bun v1.0 or later (Windows additionally needs Node.js).

### 3-1. Installing GStack into Claude Code

Paste the following into the Claude Code prompt (per the official README, completes in about 30 seconds):

```
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

What the `setup` script does:
- Checks for the presence of `bun` (if missing, guides the user and exits)
- Detects the OS (Windows/macOS/Linux); on Windows also checks for Node.js for launching Playwright/Chromium
- Builds the browsing binaries (if there's a source diff or they haven't been built yet)
- Installs Playwright (Chromium for PDF generation)
- On Linux, attempts to auto-install emoji fonts (Noto Color Emoji)
- On Apple Silicon Macs, re-signs the prebuilt binaries (to prevent kernel rejection)
- Use `--host <name>` to specify the target agent (claude/codex/cursor/factory/opencode, etc.); skills are symlinked or copied accordingly
- Use `--prefix` / `--no-prefix` to choose between command names like `/gstack-qa` or the shorter `/qa`
- Creates global state at `~/.gstack/projects`

After installation, it's recommended to append the list of available skills to CLAUDE.md.

### 3-2. Setting up team (shared repository) mode

```
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required && git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

### 3-3. Installing GBrain standalone (directly, not via GStack)

```bash
curl -fsSL https://bun.sh/install | bash
exec $SHELL
bun --version
bun install -g github:garrytan/gbrain
gbrain --version

# local (no embeddings, fastest)
gbrain init --pglite --no-embedding
gbrain stats
```

To use embeddings (vector search), first set one of `ZEROENTROPY_API_KEY` (default) / `OPENAI_API_KEY` / `VOYAGE_API_KEY`, and omit `--no-embedding`.

Preparing and importing the brain repository:
```bash
mkdir -p ~/my-brain/people ~/my-brain/companies ~/my-brain/concepts
gbrain import ~/my-brain/ --no-embed
gbrain extract links --source db
gbrain graph-query people/alice-chen --depth 1
gbrain backlinks companies/acme-ai
```
**Gotcha**: Wikilinks must be written as full-path slugs, like `[[people/alice-chen]]`. Shortened forms silently result in zero links.

Search and embedding:
```bash
gbrain search "inference"
export OPENAI_API_KEY=sk-...
gbrain config set embedding_model openai:text-embedding-3-large
gbrain embed --all
gbrain query "who works on small-model inference?"
```

MCP registration with Claude Code:
```bash
claude mcp add gbrain -- gbrain serve
claude mcp list
```
If remote HTTP access is needed, use `gbrain serve --http --port 8787`.

Running in the background:
```bash
gbrain doctor --remediate --yes --target-score 90 --max-usd 5
gbrain autopilot --install
gbrain jobs submit sync --params '{}' --follow
```
**PGLite constraint**: the monitoring daemon (supervisor) requires real Postgres. Because PGLite's file locking is exclusive, it ends up blocking workers running in separate processes.

### 3-4. Using GBrain via GStack (recommended, fastest route)

Inside Claude Code:
```
/setup-gbrain
```
This alone completes detection → up to 3 questions → initialization → MCP registration → trust policy setup (choosing one of the 4 paths described above). From then on, sync with `/sync-gbrain`.

### 3-5. Uninstalling

```
~/.claude/skills/gstack/bin/gstack-uninstall
```
or manually:
```bash
pkill -f "gstack.*browse" 2>/dev/null || true
rm -rf ~/.claude/skills/gstack ~/.gstack
rm -rf .gstack .gstack-worktrees .claude/skills/gstack
```

### 3-6. On coexisting with Claude Code

GStack is designed to sit directly on top of Claude Code's Skills mechanism (`~/.claude/skills/`) and requires no additional runtime. In other words, **the Claude Code you're already using stays as-is; the gstack skill set just adds more slash commands**. It can coexist with your existing CLAUDE.md and project-specific operating rules, but be aware that after running `/setup-gbrain`, a GBrain guidance block is automatically appended to CLAUDE.md (worth checking whether this conflicts with your own CLAUDE.md operating rules).

---

## 4. Usage patterns on hackathon day (5 hours: spec → implementation → QA → demo)

If you compress the official workflow (Think→Plan→Build→Review→Test→Ship) into a 5-hour window, the following allocation could be considered as a rough guide (note: the official documentation does not explicitly state a "hackathon time allocation" — this is a **recommended proposal** derived from the description of each skill, not a measured figure).

1. **0:00–0:20 Planning / scope confirmation**
   - Use `/office-hours` to verbalize the idea once and have assumptions questioned. In a hackathon, use it to narrow focus rather than dig too deep.
   - Use `/plan-ceo-review` to choose "Hold Scope" or "Reduction" mode, cutting scope down to what can be completed in 5 hours. Being greedy here will cause things to fall apart later.

2. **0:20–0:40 Architecture confirmation**
   - Use `/plan-eng-review` to nail down data flow, edge cases, and a minimal test policy. Alternatively, use `/autoplan` to auto-chain CEO → design → engineering review to save time.

3. **0:40–3:00 Implementation**
   - The normal Claude Code implementation flow. Use `/design-shotgun` (generate multiple UI proposals) or `/design-html` (mockup → implementation) as needed to speed up the frontend.
   - Toward the end, when risky operations become more likely, enabling `/careful` or `/guard` helps prevent accidents.
   - If using GBrain, accumulating team decisions, past failures, API specs, etc. into the brain reduces rework across multiple people/sessions (at hackathon scale, local PGLite is sufficient — there may even be cases where the 90-second wait for Supabase auto-provisioning feels wasteful).

4. **3:00–3:40 Review**
   - Use `/review` to mechanically surface "bugs that pass CI but break," with auto-fixes.
   - If time allows, use `/cso` for a minimal security check (authentication, input validation, etc. — enough to avoid embarrassment during the demo).

5. **3:40–4:20 QA**
   - Use `/qa https://<staging-url>` to find bugs via real browser interaction, auto-fix them, and generate regression tests. Focus heavily on the demo path (the flow judges will actually click through).
   - If short on time, `/qa-only` to get a report only and decide manually whether to fix by hand is also an option.

6. **4:20–4:50 Shipping / documentation**
   - Use `/ship` for test → coverage check → push → create PR.
   - Use `/document-release` to align the README, etc. with the demo content (an outdated README that judges read tends to cost points).

7. **4:50–5:00 Final pre-demo check**
   - Use `/health` to get a rough code quality score and do a final check for any critical red flags.
   - Using `/context-save` to save the current state makes it easier to resume further development in a separate session after the demo.

**For team development**: using `/pair-agent` to pair multiple agents (e.g., one person on Codex, one on Claude Code) on the same browser for parallel QA is also envisioned. However, given the short time of a hackathon, weigh this against the setup cost before deciding.

---

## 5. Caveats and gotchas

### Practical setup/operational caveats (based on primary sources)

- **Supabase auto-provisioning requires full access to all projects**: the token used in path 2 (PAT auto-provisioning) of `/setup-gbrain` can access not only the newly created project but every project in that Supabase account. It's worth considering using a disposable Supabase account/token dedicated to the hackathon.
- **PGLite is local-only and doesn't play well with supervisor/autopilot**: PGLite's exclusive file locking blocks background workers running in separate processes (e.g., `gbrain autopilot`). If you plan to use background operation at the hackathon, consider Postgres from the start.
- **Write Wikilinks as full slugs**: unless written as a complete path like `[[people/alice-chen]]`, link extraction silently fails and yields zero results. Since no error is raised, this is easy to miss.
- **PATH shadowing**: if a different `gbrain` binary is found earlier on PATH, it conflicts with the installer. Avoid this by removing the shadowing binary, adjusting PATH order, or specifying `GBRAIN_INSTALL_DIR`.
- **Direct connection URLs are rejected**: Postgres connections must use the Session Pooler URL (port 6543); the direct connection URL (port 5432) is rejected.
- **Search doesn't work after syncing without embeddings configured**: syncing without setting `OPENAI_API_KEY`/`VOYAGE_API_KEY` results in missing embeddings. These can be backfilled later with `/sync-gbrain --code-only`.
- **Handling of secrets**: things like `SUPABASE_ACCESS_TOKEN` and `GBRAIN_DATABASE_URL` are designed to be passed only via environment variables, never appearing in command arguments or logs (documented as verified on CI as well). Conversely, if your own operations carelessly pass secret keys as command-line arguments, that goes against this design philosophy.
- **Automatic rewriting of CLAUDE.md**: on success, `/setup-gbrain` automatically appends a GBrain guidance block to CLAUDE.md (and automatically removes it on failure). It's worth checking whether this duplicates or conflicts with your existing CLAUDE.md operations (such as this hackathon's governance rules).

### Adoption-judgment / reputation caveats (criticism, skepticism, secondary information)

- Many on Hacker News/TechCrunch criticize this tool set as merely "a collection of Markdown files and prompts," not a genuine technical breakthrough. The effect is said to lie in "imitating organizational structure via prompts" itself, with some calling it "not magic."
- Tan's own claimed productivity multiplier (based on lines-of-code comparison) is strongly questioned on Hacker News, including criticism of using LOC as a productivity metric at all ("nobody measures progress by LOC anymore"). There are also claims that it's unclear what was actually shipped in those 60 days.
- Some point out a bias toward attention/ranking purely because "he's YC's CEO / it topped Product Hunt," independent of the content itself.
- Regarding Tan's mentions of his sleep duration (around 4 hours), there are also some health-related concerns about whether this might be a warning sign (a so-called "AI-induced manic state"). This is worth keeping in mind only as a general caution when working long uninterrupted hours during a hackathon.
- None of the above amounts to a conclusion that "GStack/GBrain is worthless in practice" — rather, they should be treated as reference information suggesting: **don't take effectiveness metrics (like LOC) at face value / separate marketing claims from the substance of the implementation** when evaluating.

### Unconfirmed items (information that could not be obtained)

- **The official YC article "Inside Garry Tan's AI Coding Setup"** (https://www.ycombinator.com/library/OW-inside-garry-tan-s-ai-coding-setup) could not be fetched directly via WebFetch (tried twice, both times only the title was obtained, not the body). The descriptions in this guide are not direct quotes from this article but are based on secondary summaries obtained via WebSearch snippets (GStack's purpose, view of workflow, productivity claims). If the article contains precise original wording or hackathon-specific tips, those may not be reflected in this guide.
- **The body of the GBrain repository's README** could not be fetched directly, either via GitHub blob (`github.com/garrytan/gbrain/blob/main/README.md`) or via raw.githubusercontent.com — both returned 404. The overview and feature list of GBrain were reconstructed from the repository's top page (roughly equivalent to the README's opening), the Vectorize article, and the MarkTechPost tutorial article, not from a confirmed full reading of the README.
- Statistics such as star/fork counts (e.g., "25K stars," "14,000 stars," etc.) differ across sources and are merely a snapshot at the time of retrieval, so this guide deliberately avoids mentioning them wherever possible. If an accurate up-to-date figure is needed, check the repository directly again on the day.
