# Idea Candidates — c0mpiled Hackathon 2026-07-05

Reference materials: Meeting summary (`docs/meeting/26_7_4_21_45-summary.md`) / Team (`docs/team/`) / RFS analysis (`rfs-summer-2026.md`).
Supporting research: Competitive landscape (`competitive-landscape.md`) / Technical feasibility (`tech-feasibility.md`) / Arata's edge (`arata-angles.md`).

Selection criteria: (1) rides the "agent-first chat" direction the team converged on in the meeting; (2) lets all three people's strengths shine; (3) looks great in a 90-second video; (4) a single vertical slice can be built and demoed in 5 hours.

---

## Candidate A (Primary): Agent-Native Chat — "Rebuilding the Organization's Interface"

**One-liner**: Not a Slack clone — the first screen of an organizational OS where humans stay in chat, agents do the executing, and responses show up as living, dynamic UI.

**English pitch one-liner (draft)**: *"Slack was built for humans messaging humans. We rebuilt team chat for the world where your teammates are agents — and their answers aren't messages, they're living interfaces."*

**Core experience (90-second demo storyboard, ~10 seconds per scene)**:
1. [Problem, 0:00–0:40] The status quo: bots bolted onto Slack as "just another member" → walls of text, tool-connection hell, replies that are static messages. We call out that "AI integration" and "AI-first" are not the same thing.
2. [Turn, 0:40–0:50] In a client-only channel, type "Show me a dashboard of our sales history with this client" (or give the instruction **by voice** — Arata's moment to shine).
3. [Demo, 0:50–1:10] A dashboard **renders live, step by step, right inside the channel** (streaming UI), and **appears simultaneously on the screen next to it (Giacomo's side), with both people able to interact** — true multiplayer.
4. [Demo, 1:10–1:20] Delegate a task in a different channel → the **agent's working session streams live into the channel**, and the team watches and jumps in.
5. [Close, 1:20–1:30] The generated UI **persists** in the channel, becoming part of the organization's tools and knowledge. "The next Slack won't have AI. It will be made of it."

**RFS fit**: Anchored in Dynamic Software Interfaces, while threading Company Brain (chat as the origin point of knowledge, persisted generative UI) and Software for Agents (agents as first-class participants) through the same build. Recommended theme registration: **Dynamic Software Interfaces** (avoids the most crowded category, best shot at the UX/UI Award, matches recommendation #1 in rfs-summer-2026.md).

**Role split** (maps to the timeline in tech-feasibility.md):
- Yoshi: agents & prompting (defining the `render_ui` tool, wiring the Claude API, session relay) + overall orchestration
- Giacomo: real-time infrastructure (Supabase Realtime Broadcast + BroadcastChannel fallback) + backend + deployment
- Arata: UI renderer (JSON tree → React, allowlist-based) + voice input + demo direction/recording
- (If a 4th person joins: synthetic data generation, pitch deck, English script)

**Awards targeted**: UX/UI Award (primary) + Biggest Engineering Lift (the full vertical of generative UI x multiplayer x live sessions)

**Risks and responses** (details in competitive-landscape.md):
- "How is this different from Linzumi?" → Linzumi governs **coding agents for dev teams** (diffs/tests/PRs). We're the **interface for the whole organization, including non-engineers**. We raise this ourselves up front to get ahead of it — with judge Sean Grove in the room, staying silent about it is the riskier move.
- "Isn't Slack Agentforce / Claude Tag / Copilot Studio enough?" → All of them are bolted onto existing chat, and their responses are static messages or block UI at best. None of them persist generative UI or support multiplayer.
- The biggest execution risk is Wi-Fi and a live, one-shot demo → prioritize a recording, freeze scope at 13:30, and use BroadcastChannel so the recording doesn't depend on the network.

---

## Candidate B (Sharpening A, Option 1): "Channels that Grow Their Own Tools" — Persisted Generative UI Takes the Lead

Same foundation as Candidate A, but with **"the channel grows its own tools"** as the central narrative. Every request adds another generated UI to the channel, and the team's business apps "grow organically" out of conversation. This leans harder into the Company Brain angle (conversation → actionable organizational knowledge) and makes it easier to tell a SaaS story (per-seat + per-agent pricing) for the Investable Startup Award.

- When to choose this: if team-building discussion leans toward valuing "business model credibility," or if Dynamic Interfaces turns out to be an unexpectedly crowded category (this framing also works if we register under Company Brain instead).
- Demo difference: swap the closing scene for one showing "the row of tools generated over the past week, lined up in the channel's sidebar."
- Risk: showing "accumulation" in 5 hours requires staging (a pre-seeded synthetic history).

## Candidate C (Sharpening A, Option 2): Mission Control — C2 for an Organization Commanding a Fleet of Agents

Same foundation as Candidate A, but with many humans commanding many agents, plus situational awareness as the central story. Channels become "operations," and the progress of delegated tasks converges into a generated, C2-style "status board" inside the channel, with humans only handling exceptions. **Arata's authenticity as someone who actually builds defense C2 systems** is our strongest asset here (per arata-angles.md: the metaphor itself is somewhat commoditized, but coming from a practitioner it becomes real differentiation).

- When to choose this: if a 4th teammate with an enterprise/operations background joins, or if the judges respond strongly to "agent trust and verification" (an area Sean Grove cares about).
- Demo difference: expand scene 4 to show multiple agents' parallel tasks converging onto a single generated status board.
- Risk: this framing maximizes proximity to Linzumi, so the differentiation line (organizational work, not code) needs to be drawn immediately.

---

## Candidate D (Fallback 1, if Theme Changes): Tacit Knowledge Interviewer — Company Brain, Captured by Voice

A differentiation option for if team circumstances push us to commit fully to Company Brain (win condition 3 in rfs-summer-2026.md). While other teams focus on ingesting documents, we go after the fact that **"knowledge lives in people's heads"** — a voice interview agent draws it out and structures the answers in real time into a GBrain-compatible skills file. This plays straight to Arata's multimodal experience and also captures the Garry Tan angle (GBrain compatibility).

## Candidate E (Fallback 2, Minimal Build): One Backend, N Interfaces

A fallback for if time or team composition falls apart (win condition 1 in rfs-summer-2026.md). The same underlying data store generates a different UI on the fly per user — a task list for a salesperson, a calendar for a student. This maps directly onto an example straight from the RFS text, so judges get it instantly, and it's the lightest to build. It reuses a component from Candidate A (the JSON → React renderer), so it also works as **the landing spot if Candidate A falls apart at the 15:30 checkpoint**.

---

## Recommendation and How We'll Decide on the Day

- **Recommendation: Candidate A** as the baseline. During team-building (10:45–12:00), decide whether to sharpen it toward B or C (A/B/C share the same implementation foundation, so this doesn't affect the 12:00 start of building — the only thing being decided is "the story for the 90-second video").
- Register the theme as Dynamic Software Interfaces (Company Brain also works if we lean toward B).
- If the vertical slice isn't working at the 15:30 checkpoint, fall back to E.
- Depending on the 4th teammate's strengths, lean toward B (business-focused), C (operations-focused), or D (voice/production-focused).
