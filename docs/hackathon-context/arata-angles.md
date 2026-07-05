# Angle Research to Maximize Arata Jingu's Strengths

Target concept: "An agent-first chat system — where agents are first-class participants, dynamic UI is generated on the fly within channels (dashboards, etc.), and multiple people delegate tasks to agents, coordinate, and share sessions in an organizational interface" (YC RFS: Dynamic Software Interfaces / Software for Agents category)

Arata profile confirmed: At Sakana AI's defense team, co-developed C2 (Command & Control) systems integrated with drones and other hardware (Python/React/GCP). PhD in HCI/XR/Haptics at Saarland University (Google PhD Fellow, Funai Overseas Scholarship, 6 peer-reviewed papers at CHI/UIST/Laval Virtual, 2 awards, 1 demo award). Internship in AR × multimodal LLM at Google (Android XR) (June–September 2025, Zurich).
Sources: [LinkedIn](https://www.linkedin.com/in/arata-jingu-972392168/), [ajingu.github.io](https://ajingu.github.io), [Saarland Informatics Campus](https://saarland-informatics-campus.de/en/piece-of-news/doctoral-student-from-saarbrucken-wins-prestigious-google-fellowship/)

---

## 1. HCI Research Ammunition

The team's core thesis is: "Chat (linear text) is not suited to managing multi-person, multi-agent, structured tasks → dynamic UI should be generated on the fly within the channel." Recent 2025-2026 HCI research provides exactly the kind of theoretical backing that supports this claim.

| Paper | Source | How to use it in the pitch |
|---|---|---|
| **Software as Content: Dynamic Applications as the Human-Agent Interaction Layer** (Xie & Xie, 2026) | [arXiv:2603.21334](https://arxiv.org/abs/2603.21334) | This is the core claim of the pitch itself. The paper's framing — that "chat has three fundamental limitations: (1) a mismatch between structured data and linear text, (2) the high entropy of natural-language input, and (3) the lack of persistent, evolving state" — matches our "generative UI in-channel" motivation almost word for word. Its description of UI evolving from "a transient response" into "a shared, persistent interaction layer" can be repurposed as the product's one-liner. |
| **Gradual Generation of User Interfaces as a Design Method for Malleable Software** (Min, Huang, Jiang, Xia — UCSD, 2026) | [arXiv:2601.17975](https://arxiv.org/abs/2601.17975) | A design method for how to gradually reveal AI-generated UI so that customization becomes discoverable. Can be cited as the design principle behind our dashboard being not "a one-shot generation" but "a UI that grows as it's used." Lets us show judges that this isn't an improvised demo, but grounded in an academically-backed design method. |
| **Generative and Malleable User Interfaces with Generative and Evolving Task-Driven Data Model** (Cao, Jiang, Xia — CHI 2025) | [ACM DL 10.1145/3706598.3713285](https://dl.acm.org/doi/10.1145/3706598.3713285) | A framework where UI is generated on top of a task-driven data model, and end users can modify it via natural language plus direct manipulation. Can serve as the theoretical pillar for the interaction where a user directly manipulates an agent-generated dashboard within the channel to change who a task is delegated to. |
| **Meridian: A Design Framework for Malleable Overview-Detail Interfaces** (Min & Xia — UIST 2025) | [ACM DL 10.1145/3746059.3747654](https://dl.acm.org/doi/10.1145/3746059.3747654) | A UI design that lets users move between an Overview (bird's-eye view) and Detail (individual tasks). Can be used directly as the screen-design principle for an "organizational interface" that overviews multiple agents and multiple tasks while allowing deep dives into any one of them (e.g., whole-channel view ⇔ individual agent task cards). |
| **Hidden Technical Debt in Generative (GenUI) and Malleable User Interfaces** (2026) | [arXiv:2604.16354](https://arxiv.org/html/2604.16354) | A paper pointing out implementation pitfalls of GenUI. Not something to dive into during a 5-hour hackathon, but worth having in mind as a defense in case a judge asks about scalability or technical debt during Q&A. |
| **The Keyhole Effect: Why Chat Interfaces Fail at Data Analysis** (Reddy, 2026) | [arXiv:2602.00947](https://arxiv.org/abs/2602.00947) | Formalizes, from a cognitive-science angle, how chat systematically degrades analytical performance on multi-step, state-dependent tasks due to hippocampal spatial-memory and working-memory limits and linguistic-occlusion effects (O = max(0, m − v − W)). The strongest citation for explaining, with an actual formula, "why a dashboard instead of chat." Worth turning into a single slide for the judges. |
| **From Human Interfaces to Agent Interfaces: Rethinking Software Design in the Age of AI-Native Systems** (2026) | [arXiv:2603.20300](https://arxiv.org/pdf/2603.20300) | Frames the idea that in the AI-native era, software design itself must be rethought from human-facing to agent-facing. Useful for setting the tone of the product's opening slide (problem statement). |
| **DuetUI: A Bidirectional Context Loop for Human-Agent Co-Generation of Task-Oriented Interfaces** (2025) | [arXiv:2509.13444](https://arxiv.org/pdf/2509.13444) | A loop in which humans and agents co-generate UI while sharing context bidirectionally. Provides theoretical backing for the multiplayer nature of the product, where many people delegate tasks to agents while the UI evolves as feedback. |
| Google's **A2UI** project (2025-2026) | [Google Developers Blog](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) | Cite as an industry trend (not an academic paper, but backing for an emerging implementation standard). Can be used to frame the narrative: "Google is also pushing an open protocol for agent-driven UI, and our approach sits at the cutting edge of that industry trend." A strong connection point, given Arata's experience on Google's Android XR team working with multimodal LLMs. |

[Analysis] Nearly all of these papers are concentrated in late 2025 through 2026 — "malleable software" and "generative UI" are a research trend that is red-hot in HCI right now. Arata's biggest asset is being able to speak about this context not merely as someone who "knows these papers exist," but as an insider who has published within the same research community. UCSD's Xia Lab (Cao, Min, Jiang) is leading this field, and Arata's track record of presenting at CHI/UIST is proof that he has internalized this community's norms (evaluation methods, how to write design rationale).

---

## 2. The Strength of the C2 (Command & Control) Metaphor

### Military C2 design principles → applied to a multi-agent command UI

Sources: [Air Force Doctrine Publication 3-0.1 Command and Control (2025)](https://www.doctrine.af.mil/Portals/61/documents/AFDP_3-0_1/AFDP3-0.1CommandandControl.pdf), [Corvus Intelligence: Complete Guide to C2 Systems](https://corvusintell.com/blog/c2-systems/complete-guide-to-c2-systems/), [The Air Power Journal: Decentralized C2](http://theairpowerjournal.com/decentralized-c2-air-operations-battle-management-mission-command/)

- **Situational Awareness**: C2 is "a system that enables situational awareness through the continuous acquisition, integration, analysis, and visualization of information." → An in-channel dashboard that visualizes the progress and outputs of multiple agents in a single view is exactly this kind of "situational-awareness layer."
- **Mission Command / Distributed Control**: The core of military doctrine is that "good C2 is decentralized, granting discretion to those on the ground within the bounds of the commander's intent." → This maps directly onto the product's "task delegation" design philosophy: the human provides intent (the goal), the agent exercises discretion in execution, and the UI reports back progressively — a civilian application of mission command.
- **Speed of Decision-Making (OODA-style advantage)**: The principle that "the command structure that can repeatedly make good decisions faster than the adversary has the advantage." → Can be repurposed into a narrative about the speed advantage of having multiple agents work tasks in parallel while a human quickly intervenes and corrects via the dashboard.

### Products already using this metaphor

Products branding themselves as "Mission Control" agent-orchestration dashboards have proliferated in 2025-2026, so this space is fairly red ocean — worth being cautious about.

- [Mission Control (builderz-labs, OSS)](https://github.com/builderz-labs/mission-control) — Self-hosted; task distribution, cost monitoring, multi-agent workflow management.
- [MissionControlHQ](https://missioncontrolhq.ai/) — A SaaS that gives ChatGPT/OpenClaw/Claude Code agents a shared task board, threaded discussions, and a live dashboard.
- [GitHub Copilot's "mission control" blog post](https://github.blog/ai-and-ml/github-copilot/how-to-orchestrate-agents-using-mission-control/) — GitHub itself has adopted this narrative.
- OpenAI's Codex App (February 2026) calls itself a "command center for agents." [Source](https://intuitionlabs.ai/articles/openai-codex-app-ai-coding-agents)
- Some commentary frames it with metaphors like "air traffic control" or "RTS-game command" ([proofofconcept.pub](https://www.proofofconcept.pub/p/real-time-strategy-games-and-ai-interfaces)).

[Analysis] The phrase "Mission Control for agents" is itself becoming commoditized. The differentiator is that, against competitors who are merely borrowing the metaphor as language, Arata is someone who has actually built military C2 systems, integrated them with real hardware (drones), and operated them in production (in collaboration with the Ministry of Defense). This isn't "vibes" — it's lived expertise. This becomes a credibility shift in front of judges (including Sean Grove, Henry Ndubuaku, and other 3x YC founders): "This team isn't just talking metaphors — the person on the UI side has actually designed decision-making systems in the field." An effective framing for the pitch: "bringing military-grade principles of decision speed and delegation of discretion down into everyday organizational operations."

---

## 3. Multimodal Input Differentiation Ideas (implementable in 5 hours)

Three small ideas, each with an implementation-cost estimate, for creating an "oh!" moment in a 90-second demo.

| # | Idea | Description | Implementation cost estimate |
|---|---|---|---|
| 1 | **Throw a task into the channel by voice (voice-to-task)** | Press the mic button in the channel and speak; the browser's Web Speech API (or OpenAI Realtime / AssemblyAI Streaming) transcribes it in real time and posts it directly as a task-delegation message to an agent. Captions stream by as the agent immediately starts generating a dashboard — the speed of "speak → UI is generated" plays well on camera. | **Low (1-2h)**. The standard browser Web Speech API (Chrome-only is fine since the demo environment can be fixed) needs no API key and is only a few dozen lines of code. Using AssemblyAI/OpenAI Realtime costs roughly $4.5/hr with sufficiently low latency (~150ms), but adds about 1 extra hour for key management and WebSocket implementation. For a hackathon, going with the Web Speech API is the faster call. Sources: [AssemblyAI Universal-3 Pro](https://www.assemblyai.com/blog/best-api-models-for-real-time-speech-recognition-and-transcription), [RealtimeSTT](https://github.com/KoljaB/RealtimeSTT) |
| 2 | **Throw a screenshot/image to generate a UI (screenshot-to-dashboard)** | Drop a screenshot of an existing spreadsheet or Slack conversation, or a photo of a hand-drawn wireframe, into the channel, and an agent parses it to generate a dashboard UI on the spot. Similar to v0/Vercel's screenshot-to-code experience — "image → inferred UI layout/colors/components → generated code" — but done live inside the chat. | **Medium (2-3h)**. Technically low-difficulty since it's just combining a multimodal LLM (Claude/GPT-4o family) image attachment with a UI-generation prompt, but requires implementing a rendering target for the generated UI (iframe / dynamic React components). This is an area where Arata's Google AR × multimodal LLM internship experience directly applies. |
| 3 | **A "visualized delegation" animation between agents** | When a human throws a single task into the channel, the process of it being automatically decomposed and delegated across multiple agents is drawn in real time on the dashboard as a node graph/flow (a UI modeled on visualizing a C2 command chain). Prioritizes visual impact over strict data fidelity. | **Low-to-medium (1-2h)**. Just build a node graph with an existing library like React Flow and stream delegation events in via WebSocket/polling. It doesn't need to be strictly in sync with actual agent processing — "looking like it's working" is enough for demo purposes. This visually embodies the C2 doctrine of "commander's intent → distributed execution," and connects most strongly with Arata's defense-C2 background. |

[Analysis] Given the 5-hour constraint, the combination of #1 (voice) and #3 (delegation visualization) offers the best cost-to-impact ratio. #1 shows off "multimodality of input" and #3 shows off "visualization of the C2 metaphor," each in about 10 seconds. #2 is interesting but heavier to implement, better suited as a stretch goal if time remains.

---

## 4. Summary: Proposed Role Design for Arata

The strongest placement is to position Arata as "owner of the standout moments" across the following three layers:

1. **Overall lead for UI/UX design principles**: Using the HCI papers from Section 1 above (especially Meridian, Software as Content, and Gradual Generation) as design guidance, make implementation-level decisions on the dashboard's "overview ⇔ detail," "gradual generation," and "persistent state." A role that ensures the UI design has academic legitimacy rather than being merely cosmetic.
2. **Lead designer for the C2 metaphor (implementing idea #3 + pitch storytelling)**: Implement the "delegation visualization" animation and translate "mission command"-style vocabulary into the pitch script. Explicitly leverage the fact that he himself is a practitioner of defense C2, via a line in the demo (proposals below).
3. **Implementation of multimodal input (#1, #2)**: Leveraging his multimodal-LLM experience from Google Android XR, own the pipeline from voice/image input to UI generation. The React/Python/GCP stack also meshes well with the other members (Yoshi = Claude Code orchestration, Giacomo = infrastructure overall).

Demo timing plan (90 seconds): 0-15s (submit a task by voice) → 15-45s (delegation visualization + dashboard generation, narrated with C2-style language) → 45-75s (multiple people collaboratively operate the generated UI) → 75-90s (closing line, proposals below).

---

## Proposed Pitch One-Liners (3 options)

1. "We're not just borrowing the language of command and control — one of us builds it for a living, integrating C2 systems with drones for national defense. We brought that discipline of mission command to everyday teamwork."
2. "Our HCI researcher has published at CHI and UIST on how humans and AI should share an interface — this isn't a hackathon guess about generative UI, it's built on the same design principles being published this year."
3. "From defense command centers to Google's AR labs, our team has already lived in the interfaces of the future — we're just bringing that to the channel where your team already works."

---

## 5-Line Report

Arata's strengths are: (1) theoretical firepower for "why a dashboard instead of chat," drawn from cutting-edge 2025-2026 HCI scholarship (Software as Content, Meridian, Gradual Generation, etc.); (2) a credibility shift for the "mission control" metaphor earned through hands-on C2 system development at Sakana AI — a crowded space, but differentiated by lived authenticity; and (3) implementation strength in voice/image input, drawn from his Google AR × multimodal LLM internship. The strongest role placement is "overall lead for UI design principles + C2 visual direction + multimodal input implementation." Within the 5-hour build window, the combination of "submit a task by voice → delegation-visualization animation" offers the best cost-to-impact ratio, with image-input generation as a stretch goal. Three proposed pitch closing lines are provided, all built around foregrounding the authenticity of "a defense-C2 practitioner and a CHI/UIST researcher being on the same team." All sources are linked inline in the file; analytical/speculative sections are explicitly marked [Analysis].
