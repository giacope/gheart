# Technical Feasibility Study: agent-first chat × in-channel generative UI

Study date: 2026-07-05 / Premise: 5 hours of actual development, a team of 3-4, judged on a 90-second demo video

---

## 0. Conclusion (up front)

**Recommended stack**: Next.js + Anthropic Claude API (tool use, `sonnet-5` as the main model) + **a hand-built lightweight JSON-spec-to-React renderer** (a custom schema inspired by A2UI's message model, using a component allowlist approach) + **Supabase Realtime Broadcast** (channel synchronization). Off-the-shelf generative UI frameworks (CopilotKit/assistant-ui/Thesys C1) are all built around optimizing for a single client's chat thread, and the cost of rewiring them for our core multiplayer requirement — "multiple people watching the same generated UI in the same channel at the same time" — would eat into the 5-hour budget. So we won't adopt any of these frameworks wholesale; instead we'll borrow just their design philosophy (allowlist, JSON tree) and build it ourselves.

---

## 1. Comparing implementation patterns for in-chat generative UI

### a. Have the LLM emit a JSON spec and render it as React components

**Mechanism**: Define a single "UI rendering tool" via the LLM's tool use, and have it generate an input schema (e.g. a `{type, props, children}` tree structure) as JSON. The client side holds an "allowlist" of a handful to a dozen or so pre-built React components (Card, StatTile, BarChart, Form, KanbanBoard, etc.), checks component names in the JSON against the allowlist, and recursively renders them.

This is exactly the design philosophy behind Google's **A2UI (Agent-to-UI) protocol**, released in 2026. A2UI streams 4-6 kinds of messages — `createSurface` / `updateComponents` / `updateDataModel` / `deleteSurface` (with `actionResponse` / `callFunction` added in v1.0) — as streaming JSON, and the client assembles the component tree from them. This is designed so the LLM doesn't need to emit "perfect JSON in one shot" — it can generate it incrementally and the UI updates with diffs ([A2UI specification v1.0](https://a2ui.org/specification/v1.0-a2ui/), [Google Developers Blog](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)).

The same idea already exists in library implementations. **assistant-ui**'s Generative UI feature has the agent emit a tree of component names as a `generative-ui` message part, which is then resolved and rendered against a component allowlist prepared by the developer. Per the docs, this works with "5-10 component definitions plus about 15 lines of wiring," and the only dependency is `@assistant-ui/react`, with minimal backend requirements ([assistant-ui Generative UI docs](https://www.assistant-ui.com/docs/tools/generative-ui)).

- **Setup time**: About 1-1.5 hours if built from scratch (30 min schema design + 30 min renderer implementation + 5 components). Adopting assistant-ui would theoretically take about 30 minutes, but as discussed below it doesn't fit well with the multiplayer requirement.
- **Demo appeal**: High. Watching a dashboard/form/kanban board "assemble itself on the spot" is visually intuitive and well suited to a 90-second video.
- **Pitfalls**: The LLM may sometimes emit unknown component names or deviate from the schema — a guard that ignores or shows an error for anything outside the allowlist is essential. Since props are spread directly, never pass them into an execution context like `dangerouslySetInnerHTML` (assistant-ui's docs explicitly call this out too).

### b. Have the LLM generate React/HTML code directly and run it in a sandboxed iframe

**Mechanism**: Have the LLM write raw JSX/HTML/JS, and execute it via `<iframe sandbox srcdoc=...>` + Babel standalone (in-browser transpilation). The iframe's `sandbox` attribute allows script execution while isolating it from the parent frame, communicating only via `postMessage`, keeping native DOM access and forms separated ([iframe sandboxing explainer](https://joshua.hu/rendering-sandboxing-arbitrary-html-content-iframe-interacting), [react-safe-src-doc-iframe](https://github.com/godaddy/react-safe-src-doc-iframe)).

- **Setup time**: 2-3 hours. Heavy effort required for loading Babel standalone, bridging events between the iframe and parent (postMessage), error boundaries, CSS scope isolation, etc.
- **Demo appeal**: Maximum flexibility (the LLM can write whatever layout/animation it wants), but in a 5-hour hackathon the risk of "occasionally breaking" outweighs the benefit.
- **Pitfalls**: LLM-generated code must be treated as untrusted input, and layered defenses are recommended — detecting dangerous patterns like `eval`/`new Function`/`fetch`/`document.cookie`, module allowlisting, execution time limits, etc. ([Promptfoo: Sandboxed Evaluations](https://www.promptfoo.dev/docs/guides/sandboxed-code-evals/), [OWASP LLM Top 10 2026](https://elevateconsult.com/insights/owasp-llm-top-10-security-vulnerabilities-every-ai-developer-must-know-in-2026/)). Taking on this risk for a one-shot 90-second demo recording isn't worth it.

### c. Off-the-shelf generative UI libraries/SDKs

| Library | Features | Estimated time | Notes |
|---|---|---|---|
| **Vercel AI SDK `streamUI`** | Streams generative UI via RSC | - | Still **experimental** as of 2026. In the AI SDK 4.x line the RSC helpers are trending toward deprecation, with `useChat` positioned as the official path ([AI SDK RSC: streamUI](https://ai-sdk.dev/docs/reference/ai-sdk-rsc/stream-ui)). Not recommended for production = hard to bet on for a hackathon either. |
| **CopilotKit (AG-UI protocol)** | General-purpose React agent UI framework. Generative UI, shared state, and human-in-the-loop built in | Quickstart claimed to take under 5 minutes ([CopilotKit Quickstart](https://docs.copilotkit.ai/quickstart)) | Supports Anthropic. However, CopilotKit's "shared state" is primarily about **syncing agent and UI within a single client**; multiplayer sync across multiple browsers would need to be built separately on top. |
| **assistant-ui** | See (a) above. JSON-to-React generative UI is a standard feature | 30 min - 1 hour | Built on the assumption of Vercel AI SDK's `useChatRuntime`, with chat thread state management baked in, which tends to result in dual state management against our requirement of "multiple users viewing the same state in the same channel." |
| **Thesys C1** | Send a prompt to an OpenAI-compatible API (`api.thesys.dev/v1/embed`) and it auto-streams generated UI, rendered via `<C1Component>` | Claims 2-line integration ([Thesys official site](https://www.thesys.dev/)) | The middleware layer is designed around the OpenAI SDK, and we could not clearly confirm the official integration method or free tier/pricing for Anthropic Claude in the public docs ([Thesys Docs](https://docs.thesys.dev/guides/what-is-thesys-c1)). Paying the cost of verifying this on hackathon day is risky. |

### Recommended configuration (5-hour hackathon)

**Pattern (a), but without adopting an off-the-shelf framework — build it ourselves.** Reasons:

1. Every framework holds state on a per-"single user chat thread" basis, and our core requirement — "multiple people simultaneously viewing the same generated UI in the same channel" — has to be built outside the framework (in the realtime layer) regardless. Given that, the total effort is lower if we skip the learning/wiring cost of a framework and instead build our own JSON tree-to-recursive-renderer (roughly 30-50 lines) and ship it directly over Broadcast.
2. The "allowlisted components + tree-structured JSON" design used by A2UI and assistant-ui is simple enough that building it ourselves in 5 hours costs about the same as adopting a framework.
3. Pattern (b) (sandboxed iframe) trades flexibility for a high risk of breakage, which isn't a good investment for a single demo video shoot.

---

## 2. Realtime synchronization (multiplayer)

| Option | Setup | Fit |
|---|---|---|
| **Supabase Realtime Broadcast** | `npm install @supabase/supabase-js` → create a project → `supabase.channel(name).on('broadcast',...).subscribe()`. Delivers JSON payloads with low latency over WebSocket ([Supabase Broadcast docs](https://supabase.com/docs/guides/realtime/broadcast)) | **Recommended**. Fastest developer experience (least code, free tier is plenty). |
| **Liveblocks** | CRDT-based collaborative editing foundation with Room, Presence, LiveObject/LiveList, etc. | Overkill. Geared toward cursor sharing and collaborative document editing; since all we need here is "hand out a JSON blob and have everyone render the same thing," the overhead is excessive ([Liveblocks vs PartyKit comparison](https://www.pkgpulse.com/guides/liveblocks-vs-partykit-vs-hocuspocus-realtime-2026)). |
| **PartyKit (→ Cloudflare)** | Acquired by Cloudflare in 2024, continues to exist as `cloudflare/partykit`, running on Durable Objects. You write and deploy your own server class ([Cloudflare official announcement](https://blog.cloudflare.com/cloudflare-acquires-partykit/)) | Offers full control, but at the cost of extra effort writing server logic. The "one room = one channel" model fits well, but Supabase is sufficient for our needs here. |
| **Plain self-built WebSocket** | Fastest and fewest dependencies, but you need to run and manage your own server process | Best option for a local-LAN-only demo (see Section 4 below). |

**Recommendation**: Use **Supabase Realtime Broadcast** exclusively during development. Reasons: (1) Auth, DB, and Realtime all live in the same free project, so once keys are distributed, all three people can start using it immediately; (2) it has neither too much nor too little functionality for simply broadcasting JSON payloads; (3) sending and receiving takes just a few lines, e.g. `supabase.channel('demo-channel-1').send({type:'broadcast', event:'ui-spec', payload})` ([Broadcast docs](https://supabase.com/docs/guides/realtime/broadcast)).

**Fallback for demo day**: In case the venue's Wi-Fi is unstable, wrap the Realtime send/receive logic in a thin abstraction layer (`send(topic, payload)` / `subscribe(topic, cb)`) so it can fall back to the browser-native **`BroadcastChannel` API** (same-origin tab/window communication, no external network needed). If all you need to show is "2-3 clients displaying in sync" via multiple windows on the same PC, `BroadcastChannel` alone is enough to record with zero network dependency.

---

## 3. Where to use the Claude API

### Choosing which model to use

- **Use `claude-sonnet-5` as the main model**: As of July 2026 it's priced at an intro rate of $2/$10 (rising to $3/$15 after end of August) per million tokens, scoring 63.2% on SWE-bench Pro, close to Opus 4.8's 69.2% ([Anthropic official announcement](https://www.anthropic.com/news/claude-sonnet-5)). Since generating UI specs and calling the agent's tool use aren't complex multi-step reasoning tasks, Sonnet 5 is sufficient from a latency and cost standpoint.
- **Hold `claude-fable-5` in reserve**: It's the top-tier model, but at $10/$50 per million tokens it's priced at 2x Opus 4.8 and roughly 5x Sonnet 5 ([finout.io comparison article](https://www.finout.io/blog/claude-fable-5-mythos-5-pricing-benchmarks)). In a 90-second demo, a fast and stable response matters more than peak performance. If there's time to spare, consider swapping in Fable 5 for just one showcase moment (e.g. one-shot generation of a complex dashboard spec) to create a highlight, but no more than that.

### Streaming delivery of UI specs

The Claude Messages API's tool use supports **fine-grained tool streaming** (attach `eager_input_streaming: true` to the tool definition), which streams fragments of tool input (the `partial_json` from `input_json_delta` events) directly without server-side buffering ([Claude Platform Docs: Fine-grained tool streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming)).

Implementation pattern:
1. Define a tool named `render_ui`, set its `input_schema` to the JSON Schema for our custom UI spec (component tree), and attach `eager_input_streaming: true`.
2. Start streaming with `client.messages.stream(...)`.
3. Accumulate the `input_json_delta.partial_json` from `content_block_delta` events server-side, while **forwarding it as-is to a separate Supabase Broadcast channel** (e.g. `ui-spec-stream`).
4. On the client side, parse the partial JSON with a lenient parser (truncate the incomplete tail and attempt to parse; on failure, keep the last successful result) and render the UI progressively as it "assembles itself" (the same experience A2UI is aiming for).
5. Once `content_block_stop` confirms the complete JSON, re-parse it properly and render the final version. The docs explicitly specify that invalid JSON should be treated as an error and returned to Claude as a tool_result with `is_error: true`.

Note: since fine-grained tool streaming delivers fragments "with no parsing guarantee," always use guarded parsing (as warned in the official docs).

### Live-streaming the agent session

The Claude Agent SDK (the foundation underlying Claude Code, also usable for building general-purpose agents, [Anthropic's official explainer](https://www.mindstudio.ai/blog/what-is-claude-agent-sdk-vs-claude-api)) has a message iterator that yields `ToolUseBlock` / `ToolResultBlock` / `TextBlock` in sequence. By forwarding each of these events as-is as an "agent activity log" to a Supabase Broadcast `agent-activity` channel, we can display a live trace in the channel UI like "Running web_search..." / "Result received." This is essentially just "relay the SSE events received on the server straight to WebSocket/Broadcast," so the additional design cost is nearly zero.

---

## 4. Proposed starter stack and schedule (start at 12:00 → one vertical slice done by 15:30)

**Setup**: Next.js (App Router) + Anthropic SDK (`@anthropic-ai/sdk`) + Supabase JS Client. Role split for a 3-person team:
- **F = Frontend** (channel UI, renderer, components)
- **R = Realtime infrastructure** (Supabase setup, Broadcast wiring, server API routes)
- **A = Agent & prompts** (Claude tool definitions, schema, prompt design)

| Time | F: Frontend | R: Realtime infrastructure | A: Agent & prompts |
|---|---|---|---|
| 12:00-12:30 | Scaffold Next.js + Tailwind, build out the channel UI frame (message list + input box) | Create Supabase project, enable Realtime, scaffold the channel helper module, distribute API keys to all 3 people | Verify connectivity with the Anthropic API key, write a minimal tool use call script, agree on the UI spec schema types as a team |
| 12:30-13:00 | Implement component registry (Card/StatTile/BarChart/Form/KanbanBoard etc., 5-6 types) + recursive renderer | Consolidate the channel message log + "shared UI state" into a single React context, test connecting it to Broadcast send/receive (hello world sync across 2 tabs) | Finalize the JSON Schema for the `render_ui` tool, write the system prompt (including "only use these components" constraints), manually verify connectivity with 3 example prompts |
| 13:00-13:30 | Wire up channel input → API route call → local rendering (single client only at this point) | Add processing in the server API route to broadcast the generated spec after calling Claude | Tune prompts for edge cases (branching between kanban/form/dashboard switching) |
| 13:30-14:00 | **Checkpoint 1**: Confirm "input → generate → render" works on a single browser, fix bugs |||
| 14:00-14:30 | Add components (kanban drag, form submit → post message to channel), skeleton display while loading/streaming | Verify sync of the same channel across a 2nd/3rd browser (or the BroadcastChannel fallback), broadcast a "thinking" indicator | Introduce fine-grained tool streaming (`eager_input_streaming`), progressive emission of partial JSON. In parallel, implement streaming of the agent activity log |
| 14:30-15:00 | **Checkpoint 2**: Line up 2 browsers and confirm the "core demo shot" — one person's request makes UI appear simultaneously on both |||
| 15:00-15:30 | Bug fixes, freeze scope. By 15:30, confirm the vertical slice works: "request in channel → UI generated in channel → synced across 2 screens" |||
| 15:30-16:30 | (Beyond the scope of this study, but for reference) Polish styling, add a second demo scenario, prepare an error fallback (cache a known-good response) |||
| 16:30-17:00 | Record the 90-second demo video, take multiple takes; avoid a live demo — the recording is what gets judged |||

---

## 5. Pitfall list

1. **Unstable venue Wi-Fi**: Avoid depending on a deployment (e.g. Vercel); limit dependencies to the local dev machine (`next dev`) + Supabase only. Since Supabase still depends on the cloud, either record on a stable connection (home/office) ahead of time, or have a fallback path using the browser-native `BroadcastChannel` that works entirely within multiple windows on the same PC (see the end of Section 3).
2. **Prioritize the recording over a live demo**: Judging is based on the 90-second video, not a one-shot live performance at the venue. Once you've confirmed things are working (around 15:30-16:00), record one take early, and re-record later if time allows. A live, unrehearsed demo carries the double risk of network issues and LLM variability.
3. **LLM non-determinism**: Fix the exact request wording used in the demo to something you've tested repeatedly and that reliably produces a stable output. Lower the temperature if possible, and prepare one hardcoded "known good response" fallback in case the API misbehaves during a live run.
4. **Schema deviation / invalid JSON**: Assume that component names outside the allowlist or unparseable JSON will occur, and build in server-side validation (e.g. via zod) plus one retry on failure (this is especially essential when using fine-grained tool streaming, as the official docs also warn).
5. **Multiplayer edit conflicts**: Don't implement CRDT-style merging. Accept a last-write-wins model where "the most recently received spec overwrites everyone's view."
6. **Scope creep**: Don't try to build "dashboard, form, and kanban" all at once — narrow down early to the 2 types you'll show in the demo (e.g. dashboard + kanban), and freeze scope at the 13:30 checkpoint.
7. **API rate limits / key management**: Check the Anthropic API key's usage limits in advance, and keep one spare key ready. If all 3 people run in parallel on the same key, it could burn through the day's quota, so either standardize on one person's key during development, or set aside a period for mock development using cached responses.
8. **Security**: Since we won't adopt eval-execution of LLM-generated code as in pattern (b), strictly enforce the allowlist approach (pattern a), and make "never pass props into `dangerouslySetInnerHTML` etc." a fixed item on the code review checklist.

---

## References

- [A2UI (Agent to UI) Protocol v1.0](https://a2ui.org/specification/v1.0-a2ui/)
- [A2UI v0.9: Google Developers Blog](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)
- [assistant-ui: Generative UI (JSON spec)](https://www.assistant-ui.com/docs/tools/generative-ui)
- [CopilotKit Quickstart](https://docs.copilotkit.ai/quickstart)
- [CopilotKit / AG-UI Protocol GitHub](https://github.com/CopilotKit/CopilotKit)
- [CopilotKit: The Developer's Guide to Generative UI in 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)
- [Thesys C1 official site](https://www.thesys.dev/) / [What is C1 by Thesys - Docs](https://docs.thesys.dev/guides/what-is-thesys-c1)
- [Vercel AI SDK RSC: streamUI](https://ai-sdk.dev/docs/reference/ai-sdk-rsc/stream-ui)
- [Supabase Realtime Broadcast Docs](https://supabase.com/docs/guides/realtime/broadcast)
- [Liveblocks vs PartyKit vs Hocuspocus 2026 comparison](https://www.pkgpulse.com/guides/liveblocks-vs-partykit-vs-hocuspocus-realtime-2026)
- [Cloudflare acquires PartyKit](https://blog.cloudflare.com/cloudflare-acquires-partykit/) / [cloudflare/partykit GitHub](https://github.com/cloudflare/partykit)
- [iframe sandboxing/postMessage explainer](https://joshua.hu/rendering-sandboxing-arbitrary-html-content-iframe-interacting)
- [Promptfoo: Sandboxed Evaluations of LLM-Generated Code](https://www.promptfoo.dev/docs/guides/sandboxed-code-evals/)
- [OWASP LLM Top 10 (2026)](https://elevateconsult.com/insights/owasp-llm-top-10-security-vulnerabilities-every-ai-developer-must-know-in-2026/)
- [Claude Platform Docs: Fine-grained tool streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming)
- [What is Claude Agent SDK (MindStudio explainer)](https://www.mindstudio.ai/blog/what-is-claude-agent-sdk-vs-claude-api)
- [Introducing Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5)
- [Claude Fable 5 / Mythos 5 pricing and benchmarks (finout.io)](https://www.finout.io/blog/claude-fable-5-mythos-5-pricing-benchmarks)
