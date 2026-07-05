# Competitive Research: agent-first chat/collaboration systems

Research date: 2026-07-05
Target: YC RFS hackathon (5-hour build, 90-second demo, YC judges)

Premise: The team's concept is "rebuild Slack AI-first. Agents behave as first-class participants, generating dynamic UI as responses within channels, and chat becomes the source of truth for company knowledge" — an agent-native team collaboration platform.

---

## 1. Most important: Linzumi (founded by judge Sean Grove)

### 1.1 Company overview

- **Company name**: Linzumi / product also referred to as "Codex commander"
- **Founder**: Sean Grove. Previously worked on post-training/alignment research (model-spec, deliberative alignment) at OpenAI. Previously founded OneGraph (acquired by Netlify), and was Netlify Chief Architect. This is his 3rd company and 3rd YC batch.
- **YC batch**: Spring 2026, status Active, team of 3, based in San Francisco, partner Garry Tan.
  Source: [Y Combinator: Linzumi](https://www.ycombinator.com/companies/linzumi)
- **Launch announcement**: YC's official X account introduced it as "Bring your whole team and dozens of AI coding agents into the same chat threads." Free tier offered via partnership with Wafer.ai (GLM 5.2).
  Source: [Y Combinator on X](https://x.com/ycombinator/status/2069465556433211583)
- Garry Tan's comment: "Linzumi is Codex but actually multiplayer" / "magical for teams." Reaction after launch reported as positive (94.4% positive, per reports).
  Source: [Digg article](https://digg.com/tech/bnuy2maq)

### 1.2 Actual product scope

The official site ([linzumi.com](https://linzumi.com/)) taglines are **"A familiar team chat with a fleet of coding agents inside every channel"** and **"Your team in the thread, your coding agents on your own machine"**.

Key features:
- **Channels as the venue for agent execution**: Within a single thread, agents implement code changes → show diffs → post test results, all end-to-end. Team members can review and redirect instructions within the thread.
- **Continuous Context Compilation**: Continuously records team decisions ("what to build," "why it changed," "who approved it") to reduce the overhead of context recovery.
- **Decision Inbox**: Extracts and notifies only the items that need human judgment. Positioned as "a single shared interface for piloting a fleet of agents."
- **Security controls**: Directory-level access control, explicit approval required for network egress and repo writes, permissions expire at session end.
- **Mobile support**: Agent progress can be monitored and instructions changed from a phone.
- **Supported agents**: Codex is currently the primary agent ("Codex commander"); Claude Code integration reported as "coming soon" (per the YC description).
- **Pricing**: Personal free / Company $100/month (unlimited users, no per-seat billing) / Enterprise contact sales (SSO/SAML, self-hosting).
  Source: [linzumi.com](https://linzumi.com/), [YC company page](https://www.ycombinator.com/companies/linzumi)

### 1.3 Positioning (founder's problem framing)

Sean Grove's thesis: "Execution (code generation) has become nearly free, while **human decision-making and verification have become the new bottleneck**." Running multiple agents in parallel creates problems where approvals get buried in Slack threads, or agents stall waiting on human judgment. The vision is "to let anyone become the CEO of a 1,000-agent AI company."
Source: [YC company page](https://www.ycombinator.com/companies/linzumi)

### 1.4 Overlap and differences with our concept [Analysis]

**Overlapping areas:**
- The basic architecture of "placing chat (threads/channels) at the center of AI agent operations" is the same.
- The experience of "agent work being visualized in chat, with the team reviewing and intervening there" is also similar.
- The fact that judge Sean Grove himself is a player in the "commanding agents via chat" space is unavoidable.

**Clearly different areas:**
- **Scope**: Linzumi explicitly is "a dev tool that governs a fleet of coding agents." Its target is limited to software engineering workflows (code changes, diffs, tests, PRs). Our concept can aim to be "an interface for the whole organization" — enabling general-purpose agent participation across sales, support, PM, and executive decision-making, not just code generation.
- **Role of the agent**: Linzumi's agents are essentially "subcontractors executing assigned coding tasks," and the UI presented is mainly code artifacts like diffs/test results. Our concept's "agents generate dynamic UI as responses" can aim for a more general-purpose generative UI layer that **renders any response as application-like UI** — dashboards, forms, decision tools — not limited to code changes.
- **Claim of being the origin of knowledge**: Linzumi's "Continuous Context Compilation" is closer to logging decision history, focused on auditing decisions in a coding context. Our claim that "chat becomes the origin of company knowledge" can be a broader knowledge-management claim that positions chat itself as a knowledge base/search foundation, not just a decision log.

**Pitch opportunities and risks [Analysis]**:
- Opportunity: If we can clearly differentiate with one line — "Linzumi governs coding agents, we are an interface for the whole organization" — while standing partly on the judge's home turf, we can create a good impression of "respecting the judge's expertise while competing in an adjacent space."
- Risk: If the differentiation is left vague, there's a high risk of being read as "a smaller/inferior copy of Linzumi." In the 90-second demo, an opening line making clear "this is not Linzumi — our target includes non-engineers across the whole company" is essential.
- Unconfirmed: Whether Linzumi actually plans to expand into "non-coding work" cannot be confirmed from public information (its current messaging is consistently limited to engineering teams).

---

## 2. Existing players in agent-native chat/collaboration (2025-2026)

Classification axis: **(A) AI-bolted-on type (AI added onto existing chat as an add-on)** vs. **(B) agent-first type (agents are first-class participants / the system itself is agent-native)**.

| Player | Category | Overview | Source |
|---|---|---|---|
| **Slack Agentforce 2.0** | (A) Bolted-on | Summons Agentforce via @mention into existing Slack channels/DMs/threads. A resident Channel Expert agent answers using in-channel knowledge. Agent Builder has pre-built Slack actions (Create Canvas, Message Channel, etc.). | [Slack Blog](https://slack.com/blog/news/limitless-workforce-with-agentforce-in-slack), [Slack AI Agents](https://slack.com/ai-agents) |
| **Slack Block Kit new agent components** | (A→intermediate) | Announced April 15, 2026. Added 6 types — Card/Alert/Carousel/Data Table/Work Object/Code — aiming to shift agent responses from a "wall of text" to structured UI. Card (icon, title, hero image, action buttons), Carousel (horizontal scroll up to 10 items), Data Table (renders tabular data directly, coming soon). | [Slack Dev Blog](https://slack.dev/build-richer-agent-experiences-with-block-kit/) |
| **Claude Tag (Anthropic's new Slack integration)** | Leans (B) | Public beta released June 23, 2026. Replaces the old "Claude in Slack" app; **one persistent Claude per channel** talks with everyone (not a per-user instance). Powered by Opus 4.8. Distinctive **ambient behavior** — actively picks up information from monitored channels/tools and follows up on abandoned threads, extending from passive response to active monitoring. The old app is scheduled to be retired on August 3, 2026. | [Anthropic official](https://www.anthropic.com/news/introducing-claude-tag), [TechCrunch](https://techcrunch.com/2026/06/23/anthropics-claude-tag-is-learning-your-company-one-slack-message-at-a-time/), [VentureBeat](https://venturebeat.com/technology/anthropic-launches-claude-tag-replacing-its-slack-app-with-a-persistent-ai-teammate-that-learns-monitors-and-works-autonomously) |
| **Microsoft Teams / Copilot Studio multi-agent** | Strongly (A), some (B)-like features | Copilot Studio's multi-agent orchestration expanded to GA in 2026. Agent-to-Agent (A2A) communication, Fabric agent integration. **Agents built with Copilot Studio can display rich interactive app experiences directly within Copilot Chat** (checking data, updating records, approvals, asset creation all completed within chat) — this is close precedent for "dynamic UI generation within a channel." | [Microsoft Copilot Blog](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/) |
| **Dust** (based in Paris, backed by Sequoia/Abstract) | (B) multiplayer AI | Advocates moving from "isolated chatbots" to a "multiplayer system where humans and agents share the same information, permissions, notifications, artifacts, and goals." Raised $40M (Series B) in May 2026. Used by 3,000+ organizations, with 300,000+ agents created. | [SiliconANGLE](https://siliconangle.com/2026/05/18/multiplayer-ai-startup-dust-swipes-40m-funding-help-enterprises-move-beyond-isolated-ai-assistants/), [French Tech Journal](https://www.frenchtechjournal.com/dust-multiplayer-ai-enterprise-ai-agents/) |
| **Ano** (ano.chat) | (B) agent-first, potential direct competitor | **"Team chat with Claude Code built in."** Designed to directly replace Slack: "a Claude Code agent resides in each channel, executing commands, editing files, creating PRs, and posting results inline." Local-first sync, CLI/MCP connections to GitHub/Linear/Stripe/HubSpot/Notion/Jira/Figma etc., EU-based data hosting, free for the whole company (users bring their own Claude Code account). Whether it has YC backing could not be confirmed within our search scope — **unconfirmed**. | [ano.chat](https://ano.chat/), [ano.chat/slack-alternative](https://ano.chat/slack-alternative) |
| **Discord AI bots** (Quickchat, AgentX, Poe, etc.) | (A) Bolted-on | All add AI features on top of Discord's existing Bot API. Mostly knowledge-base responses and model routing; no examples found of agents acting as first-class channel participants generating UI. | [Quickchat AI](https://quickchat.ai/post/best-ai-discord-bots) |
| **Linzumi** (recap) | (B) agent-first, coding-focused | See section above. | See above |

### 2.1 Classification summary [Analysis]

- **Common pattern for bolted-on type (A)**: A design where agents are summoned as "guests" on top of existing chat (Slack/Teams/Discord) message/Bot APIs. UI is constrained within existing block/card components.
- **Common pattern for agent-first type (B)**: Agents are persistently resident, and the reason the channel exists (a venue for code execution, a venue for multiplayer knowledge sharing) is designed premised on agents. However, current (B) players lean toward either "coding-task specialized" (Linzumi, Ano) or "enterprise knowledge/permission-sharing specialized" (Dust), and **no player was found that explicitly claims "agents generate general-purpose dynamic UI (dashboards, forms, decision tools) on the fly as responses within a channel."**
- Ano in particular has the concept skeleton closest to ours — "replace Slack, make agents first-class participants." However, Ano's execution scope is limited to "command execution, file editing, PRs," and no mention of dynamic UI generation was found on its site (unconfirmed).

---

## 3. Prior examples of dynamic UI generation within chat

| Example | Overview | Source |
|---|---|---|
| **Google A2UI (Agent-to-UI) protocol** | Public preview v0.8 in December 2025, then **officially open-sourced as v0.9 in 2026** (made bidirectional, added Python SDK). A framework-agnostic standard specification where agents describe UI components (forms, charts, maps, dashboards) as declarative JSON, and the client natively renders them on web/mobile/desktop. Aims to resolve the "wall of text" response problem. Adopted by Opal, Gemini Enterprise, and the Flutter GenUI SDK. The official "RizzCharts" sample demonstrates conversation-driven UI generation for an e-commerce dashboard: "show me the sales breakdown" → generates a donut chart, "which stores are outliers?" → generates a pinned map. | [Google Developers Blog: A2UI v0.9](https://developers.googleblog.com/a2ui-v0-9-generative-ui/), [InfoQ](https://www.infoq.com/news/2026/07/google-a2ui-genui/), [chartgen.ai](https://chartgen.ai/resources/blog/from-chatbot-to-dashboard-a2ui) |
| **Slack Block Kit's limits and extensions** | Traditionally constrained to static layouts (max 50 blocks per message / max 100 blocks per modal or Home tab). In April 2026, added agent-oriented components (Card/Alert/Carousel/Data Table, etc.) moving closer to "dynamic task-oriented UI," but this **remains a combination of pre-defined components**, differing in design philosophy from A2UI's general-purpose declarative UI generation (closer to Static Generative UI). | [Slack Dev Blog](https://slack.dev/build-richer-agent-experiences-with-block-kit/) |
| **OpenAI Apps SDK (apps within ChatGPT)** | Announced October 6, 2025. An MCP-based standard for embedding interactive apps (Spotify, Zillow, Canva, Expedia, etc.) within ChatGPT conversations. App Directory added December 18, 2025. **Rather than UI being generated as a natural-language response, pre-built and reviewed apps are summoned into the chat** — a model where the agent does not improvise the UI assembly on the fly. | [OpenAI official](https://openai.com/index/introducing-apps-in-chatgpt/) |
| **Claude Artifacts / Live Artifacts** | Introduced "Live Artifacts" in April 2026. Dashboards/trackers auto-update to the latest data on revisit, persistent storage across sessions, and Artifacts can call the Claude API directly from within themselves (i.e., the Artifact becomes a small app with reasoning running inside it). Can connect to Google Calendar/Gmail/Slack etc. via MCP. However, **Artifacts are designed as a side panel within a 1:1 Claude.ai conversation**, not designed for an experience where multiple people simultaneously review and intervene within a multiplayer team channel. | [VentureBeat](https://venturebeat.com/data/anthropics-claude-code-artifacts-update-brings-live-shared-dashboards-and-interactive-workspaces-to-enterprises), [buildfastwithai](https://www.buildfastwithai.com/ai-tools/claude-artifacts) |
| **Microsoft Copilot Studio "rich app experience within Copilot Chat"** | See section above. Agents display interactive screens directly within Copilot Chat for record checking, approvals, and asset creation. Usage skews toward enterprise workflows (approvals, record editing). | [Microsoft Copilot Blog](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/) |

### 3.1 Prior examples closest to "an agent generating a dashboard/UI on the fly within a channel," and the remaining white space [Analysis]

- **Technically closest** is Google A2UI (its design philosophy — declarative, general-purpose, agent-driven UI generation — fully matches). However, A2UI is a **protocol/infrastructure layer**, not itself a "multiplayer team chat product." Demos like RizzCharts also assume a single user conversing with an agent, and **the multiplayer property of multiple team members viewing and jointly editing/approving the same generated UI in the same channel has not been demonstrated**.
- **As a product, the closest** is Microsoft Copilot Studio (rich apps within Copilot Chat), but it skews toward fixed UI for enterprise workflows (approvals, record editing), and the claim of general-purpose, improvisational generation ("turn this data into a graph right now," assembled from scratch) is weak.
- **Remaining white space**: A product that satisfies all four of the following was not found within our research scope: (1) A2UI-like general-purpose generative UI, (2) within a Slack/Teams-like multiplayer channel structure, (3) with agents as first-class participants, and (4) where the generated UI itself is persisted as conversation history/knowledge. In particular, the experience of "multiple people simultaneously viewing a generated UI and jointly editing/approving it in real time" is not explicitly mentioned in any prior example.

---

## 4. Summary

### 4.1 Where the novelty stands (3 lines)

1. **The combination of integrating general-purpose generative UI into a multiplayer channel structure** is an intersection that neither A2UI (general-purpose UI generation, but 1:1 and stuck at the infrastructure layer) nor Slack/Teams (multiplayer, but stuck at fixed block UI) satisfies simultaneously — no existing player satisfies both at once.
2. **The design of treating the agent as "a member" of the channel, whose responses are immediately persisted and shared as app-like UI** is a different role definition from Linzumi/Ano's "coding task executor" or Agentforce/Claude Tag's "Q&A role," and leads to a claim of being the "origin of knowledge" company-wide, not limited to engineering.
3. The claim that generated UI itself accumulates as conversation logs, searchable and reusable later, such that "chat itself becomes the company's knowledge base," has a different scope from both Dust (multiplayer AI, but centered on text/agent permission-sharing rather than generated UI) and Linzumi (decision logs limited to a coding context).

### 4.2 Top 3 "how is that different from X?" questions expected at the pitch, and how to respond

1. **"How is that different from Linzumi? (Isn't that the judge's own company?)"**
   Response: "Linzumi is a development platform that governs a fleet of coding agents, targeting engineering teams' diffs/tests/PRs. We're reinventing the organization's interface itself for the whole company, including non-engineers, where agent responses are generated instantly as dashboards or decision tools, not limited to code changes. We're not extending Linzumi — we're targeting an adjacent but different layer of the problem."

2. **"How is that different from Slack Agentforce / Claude Tag / Copilot Studio? (Big players have already shipped this.)"**
   Response: "The big players' design bolts agents onto existing chat as 'guests' (summoned via @mention, responding with fixed block UI). We've redesigned the agent as an architectural premise — a first-class participant — so responses aren't a combination of fixed components but UI freely generated to fit the task at hand. It's not a 'plugin' to an existing product; the design philosophy of chat itself is different."

3. **"Couldn't that be sufficiently achieved with Google A2UI or Claude Artifacts?"**
   Response: "A2UI is an excellent generative UI protocol, but it's an infrastructure layer premised on a single user conversing with an agent, not a multiplayer team chat. Claude Artifacts is also a side panel for a 1:1 conversation. We're building an integration layer that brings those technical ideas into the context of a shared channel where a team simultaneously views, jointly edits, and makes decisions together."

### 4.3 Notable unconfirmed items

- Whether Ano.chat has YC backing, and whether it has dynamic UI generation features, could not be confirmed from public information (unconfirmed).
- Whether Linzumi has plans to expand into non-coding business areas is not public (unconfirmed).
- "Convictional" (YC W2019, "company brain that replaces Slack") is mentioned only in the YC company directory description; its current state (whether it supports AI agents) could not be confirmed (unconfirmed).

---

## Source list

- [Y Combinator: Linzumi](https://www.ycombinator.com/companies/linzumi)
- [Y Combinator on X (launch announcement)](https://x.com/ycombinator/status/2069465556433211583)
- [Digg: Sean Grove / Linzumi coverage roundup](https://digg.com/tech/bnuy2maq)
- [linzumi.com](https://linzumi.com/)
- [Slack: Agentforce 2.0 in Slack](https://slack.com/blog/news/limitless-workforce-with-agentforce-in-slack)
- [Slack AI Agents](https://slack.com/ai-agents)
- [Slack Dev Blog: new Block Kit components for agents](https://slack.dev/build-richer-agent-experiences-with-block-kit/)
- [Anthropic: Claude Tag announcement](https://www.anthropic.com/news/introducing-claude-tag)
- [TechCrunch: Claude Tag coverage](https://techcrunch.com/2026/06/23/anthropics-claude-tag-is-learning-your-company-one-slack-message-at-a-time/)
- [VentureBeat: Claude Tag coverage](https://venturebeat.com/technology/anthropic-launches-claude-tag-replacing-its-slack-app-with-a-persistent-ai-teammate-that-learns-monitors-and-works-autonomously)
- [Microsoft Copilot Blog: multi-agent orchestration](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/)
- [SiliconANGLE: Dust raises $40M](https://siliconangle.com/2026/05/18/multiplayer-ai-startup-dust-swipes-40m-funding-help-enterprises-move-beyond-isolated-ai-assistants/)
- [French Tech Journal: Dust multiplayer AI](https://www.frenchtechjournal.com/dust-multiplayer-ai-enterprise-ai-agents/)
- [ano.chat](https://ano.chat/)
- [ano.chat/slack-alternative](https://ano.chat/slack-alternative)
- [Quickchat AI: Discord AI bot roundup](https://quickchat.ai/post/best-ai-discord-bots)
- [Google Developers Blog: A2UI v0.9](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)
- [InfoQ: Google A2UI GenUI](https://www.infoq.com/news/2026/07/google-a2ui-genui/)
- [chartgen.ai: A2UI RizzCharts case study](https://chartgen.ai/resources/blog/from-chatbot-to-dashboard-a2ui)
- [OpenAI: Introducing apps in ChatGPT](https://openai.com/index/introducing-apps-in-chatgpt/)
- [VentureBeat: Claude Live Artifacts](https://venturebeat.com/data/anthropics-claude-code-artifacts-update-brings-live-shared-dashboards-and-interactive-workspaces-to-enterprises)
- [buildfastwithai: Claude Artifacts 2026 review](https://www.buildfastwithai.com/ai-tools/claude-artifacts)
