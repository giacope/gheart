# YC RFS Summer 2026 Theme Analysis — for the c0mpiled Hackathon

Created: 2026-07-05 / Target: A hackathon with 5-hour development, English submission, and 90-second demo video judging (see `docs/battle-plan.md` for details)

> **Legend**: "Original text" = verbatim quotes from the RFS page (facts). "Context" = verified external sources (facts, with citations). "Analysis" = speculation and strategic judgment in this document (not facts).

Full RFS: https://www.ycombinator.com/rfs/ (Summer 2026 has 15 themes total. This hackathon selects from 3 of them)

---

## 1. Company Brain — Tom Blomfield

- Anchor: https://www.ycombinator.com/rfs/#company-brain
- Partner: Tom Blomfield (co-founder of Monzo / GoCardless, YC General Partner)

### What YC Is Looking For (based on original text)

Gist of the original text (source: https://www.ycombinator.com/rfs/):

> "The biggest blocker to AI automation of companies is no longer the models... Now the blocker is the domain knowledge."
>
> "We need Garry's G-Brain, but for every business in the world. A system that pulls knowledge out of all these fragmented sources, structures it, keeps it current, and turns it into an executable skills file for AI."
>
> "This isn't a company-wide search or a chatbot over documents. It's a living map of how a company works: how refunds get handled, how pricing exceptions are decided or how engineers respond to incidents."
>
> "The company brain becomes the missing layer between raw company data and reliable AI automation. I think every company in the world is going to need one."

Key points:

- **The bottleneck is not the models but domain knowledge**. Knowledge is scattered across people's heads, old emails, Slack, support tickets, and databases; companies run because humans "just kind of remember" things, but AI agents can't do that.
- What's wanted is **neither search nor a chatbot**. It's a system that extracts fragmented knowledge → structures it → keeps it current → converts it into an **executable skills file for AI**. "A living map of how the company works."
- Examples given: refund handling procedures, how pricing exceptions are decided, how engineers respond to incidents.
- It explicitly states to **generalize Garry Tan's G-Brain "for every business"**.

### Why Now / The Partner's Problem Awareness (context)

- Blomfield's own X post: "If you replaced 90% of your employees with a genius team that knew nothing about how the company works, it would be chaos. That's AI today. What's missing is giving the model the domain knowledge that's in people's heads as structured context" (https://x.com/t_blom/status/2060806313001746792 — reconstructed via search snippets, full text unverified). Continued: "Once you have this, AI will seem magical" (https://x.com/t_blom/status/2045966024676356400).
- Blomfield's YC batch talk "How to Build a Self-Improving Company with AI" (around May 2026, https://www.ycombinator.com/library/Qf-how-to-build-a-self-improving-company-with-ai) is a conceptual counterpart. It discusses redesigning a company as a "recursive self-improving AI loop," with Company Brain serving as the knowledge foundation that loop runs on. Also the phrase "burn tokens, not headcount" (a summary via secondary sources, not verbatim).
- Prior examples (context, sources: https://colrows.com/blogs/yc-company-brain-rfs/ , https://www.alexlockey.com/writing/the-company-brain-four-builders-one-architecture/): Garry Tan's **GBrain** (OSS, 23.6k GitHub stars within 2 months of release), Hyper, Ramp's internal "Glass" (350+ skills), and a Karpathy-derived workflow where an LLM organizes raw sources into a markdown wiki. The common architecture is "structured storage → routing layer → skills → write-back discipline."
- Market context: Glean raised at a $4.6B valuation (enterprise search). However, the RFS demands "beyond search" (https://ycinsight.com/ideas/company-brain).
- Failure modes of existing tools (https://colrows.com/blogs/yc-company-brain-rfs/): (1) "metric hallucination" where AI and the CFO compute metrics differently; (2) token cost explosion from reprocessing raw schemas; (3) lack of auditability.

**Analysis**: This hackathon designates GStack/GBrain as the required tool, and Garry Tan himself will attend. The original text's "G-Brain for every company" is directly tied to the event's design, making this likely the organizers' flagship theme. Conversely, this is expected to be **the theme most teams will converge on, with many falling into the "document RAG chatbot" form that the original text explicitly forbids**. The axis for differentiation is "executability (the skills file is actually run by an agent)" and "freshness (living map)".

### Winning Angles (assuming 5-hour dev, 90-second demo) [Analysis]

1. **A Before/After execution demo, "Chaos → Brain → Execution"**: Feed in synthetic company data (Slack logs, tickets, emails) → auto-generate a skills file (GBrain-compatible markdown) → show the same task (e.g., handling a refund request) side by side with a "brain-less agent" (failing, making things up) and a "brain-equipped agent" (executing correctly). Using the RFS's own example (refunds) lets the contrast play out fully within 90 seconds. Making it GBrain-compatible will instantly land with Garry Tan and the judges.
2. **Living Map / Drift Detection**: Detect when a decision changes on Slack (e.g., "refund window changed from 30 to 60 days"), automatically update the skills file, and flag conflicting outdated entries. This directly answers the original text's "keeps it current" and the critique of existing tools (auditability). Easy to build into an investable, enterprise-facing story.
3. **Tacit Knowledge Interviewer**: In response to the original text's point that "some knowledge lives only in people's heads," a multimodal agent that conducts short voice interviews with employees and converts their answers into structured skills. Real-time visualization of conversation → structuring makes for a great demo video, and it directly leverages Arata's multimodal LLM experience. While other teams focus on ingesting documents, this differentiates by going after what's "in people's heads."

---

## 2. Dynamic Software Interfaces — Ankit Gupta

- Anchor: https://www.ycombinator.com/rfs/#dynamic-software-interfaces
- Partner: Ankit Gupta (co-founder of Reverie Labs [YC W18, ML-driven drug discovery, acquired by Ginkgo Bioworks in 2024], YC General Partner). *Note: his background is sometimes conflated in event announcements, but he comes from an ML background, not UI/UX (source: https://www.ycombinator.com/people/ankit-gupta).

### What YC Is Looking For (based on original text)

Gist of the original text (source: https://www.ycombinator.com/rfs/):

> "most software has a one-sized-fits-all feel rather than being hypercustomized to a user. As an example: the way I use an email is very different from how most college students use email, yet all email clients look basically the same."
>
> "We think that coding agents have now gotten good enough to allow users to become their own forward deployed engineers and more radically customize the software they consume."
>
> "perhaps my email client looks more like a task list, and a students' looks more like an events calendar. But these two interfaces likely share some underlying primitives and design decisions that a software team can build and ship."
>
> "To enable this future, we will have to rethink the whole stack of software delivery. How will a developer make software that can be accessed by the user's coding agents? Do they have to deliver source code rather than packaged binaries? Can they only modify front-end visual elements, or are there ways for them to modify middleware on the fly...?"

Key points:

- Traditional "personalization" (Netflix-style) is nothing more than swapping images while keeping the same layout. Software remains one-size-fits-all.
- The exception is per-customer customization by enterprise **forward deployed engineers (FDEs)**. The central thesis is that **advances in coding agents let every user become "their own FDE."**
- A future in which vendors ship **shared primitives** rather than a final UI, and users (via their agents) radically customize the final interface.
- Open questions (= room for startups): (1) What distribution form can the user's agent access (source code distribution?); (2) Is modification limited to the frontend, or can it extend to **dynamic middleware modification**?; (3) Rethinking the entire software delivery stack.

### Why Now / The Partner's Problem Awareness (context)

- No long-form elaboration of this theme (essay, podcast) by Gupta himself was found; the primary source is almost entirely the RFS text itself. A related X post praises AgentMail, an agent-only email client (https://x.com/GuptaAnkitV/status/1952779315692654992) — this interest in "reinventing email as an interface" is consistent with the RFS's email example.
- Industry context: Vercel v0 (generative UI, became a full-stack sandbox in 2026) and Retool AI AppGen (October 2025, generating entire apps from text) are precedents (https://vercel.com/blog/announcing-v0-generative-ui). InfoWorld's three-way taxonomy of generative UI (Static = selecting from pre-built components / Declarative = structured UI specs like A2UI / Open-ended = generating arbitrary HTML) is a useful framework (https://www.openfor.co/post/yc-summer-2026-requests-for-startups-an-independent-reading).
- Academic context: "Malleable software" is an active research topic covered by a cluster of 2026 CHI-adjacent arXiv papers (e.g., "Software as Content: Dynamic Applications as the Human-Agent Interaction Layer" https://arxiv.org/pdf/2603.21334, "Gradual Generation of User Interfaces as a Design Method for Malleable Software" https://arxiv.org/pdf/2601.17975).
- Critical perspective (context): There are claims that generative UI is practically immature, with "brand consistency, security sandboxing, and native support still unresolved" (https://www.openfor.co/post/yc-summer-2026-requests-for-startups-an-independent-reading). **Analysis**: In a 5-hour hackathon, this "immaturity" is actually an opportunity — you can compete on presenting a future vision rather than on polish.

### Winning Angles (assuming 5-hour dev, 90-second demo) [Analysis]

1. **"One backend, N interfaces"**: Against the same email (or task) data store, when a user asks in natural language, the agent generates a personalized UI on the spot — a task-list style for a salesperson, a calendar style for a student — **directly re-enacting the RFS's own example**. Footage of the screen live-morphing is among the most visually striking things you can put in a 90-second video. The prime candidate for the UX/UI Award.
2. **Primitives + an agent-modification protocol**: Define and demo a small SDK/protocol for "vendors ship shared primitives, and the user's coding agent safely rewrites the UI" (component declarations + permission boundaries + an agent manifest). A design proposal that directly answers Gupta's open questions, resonating with the original text's call for a "radical thinker." More investable than idea 1, but less flashy as a demo.
3. **A malleability overlay for existing SaaS**: A browser extension or proxy that reconstructs the UI of real SaaS products (CRM, calendar, etc.) per-seat via natural language. Demonstrates "usable starting today" realism and market breadth (reference idea source: https://superframeworks.com/articles/yc-summer-2026-rfs-hard-tech-pivot). However, a demo built on top of someone else's product carries the risk of mixed reactions from judges.

---

## 3. Software for Agents — Aaron Epstein

- Anchor: https://www.ycombinator.com/rfs/#software-for-agents
- Partner: Aaron Epstein (co-founder & CEO of Creative Market [YC W10, acquired by Autodesk], YC General Partner. Has reviewed over 8,000 YC applications and advised Retool/OpenSea/Deel and others. Source: https://www.ycombinator.com/people/aaron-epstein). *Note: his background is sometimes conflated in event materials, but he comes from a design-asset marketplace background.

### What YC Is Looking For (based on original text)

Gist of the original text (source: https://www.ycombinator.com/rfs/):

> "The next trillion users on the internet won't be people, they'll be AI agents. And now is the time to 'Make Something Agents Want'."
>
> "Agents are already browsing the web, doing research, making purchases, and managing legacy CRMs – but they're doing it on top of software that was designed for humans clicking buttons in a browser, which is slow, inconsistent, and brittle."
>
> "Instead of visual interfaces like forms, buttons, and dashboards, they need machine-readable interfaces like APIs, MCPs, and CLIs. Agents also need thorough documentation, to enable them to discover, sign up for, and instantly start using new tools programmatically, without needing a human in the loop."
>
> "the new agent-first software won't come from incumbents bolting on agent support, it'll come from startups that build explicitly for agents as first-class citizens. While everyone else is building agents, the biggest opportunity might be building the software those agents depend on."

Key points:

- "The next trillion users won't be people, they'll be agents." A declaration reinterpreting YC's motto "Make Something People Want" as **"Make Something Agents Want."**
- Agents are already doing real work (browsing, research, purchasing, CRM operations), but they run on top of human-facing UIs, making them "slow, inconsistent, and brittle."
- What's needed is APIs / **MCP** / CLIs, plus **thorough documentation that lets agents discover, sign up for, and instantly start using tools without human intervention**.
- The "agent-first rebuilding of every software category" won't come from incumbents bolting it on, but from startups. "While everyone else is building agents, the biggest opportunity might be building the software those agents depend on."

### Why Now / The Partner's Problem Awareness (context)

- YC's official X account amplified this theme under Epstein's name (https://x.com/ycombinator/status/2048834309994565832). No long-form essay by Epstein himself was found; the elaboration comes via the YC Lightcone podcast's "Make Something Agents Want" episode (group discussion) and secondary sources: **documentation quality becomes the new GTM** — Resend is said to have optimized its docs for agents, resulting in ChatGPT/agent referrals becoming a top conversion channel (secondary source: https://blog.juchunko.com/en/yc-make-something-agents-want/, includes unverified hearsay). "Agents hate using websites" (Harj Taggar, same source, hearsay).
- Protocol maturity (all factual, with sources): **MCP** has 5,000+ community-built servers, with governance being standardized under the Linux Foundation's Agentic AI Foundation (launched December 2025, with AWS/Anthropic/Google/Microsoft/OpenAI and others) (https://www.openfor.co/post/yc-summer-2026-requests-for-startups-an-independent-reading). **A2A** (Google, April 2025) uses signed Agent Cards for mutual authentication and is in production use at 150+ organizations (https://atlan.com/know/google-a2a-protocol/). **Agent payments** are being built out via Stripe's x402 (a machine-readable payment challenge over HTTP 402) and the Machine Payments Protocol, with the x402 Foundation including Visa/Mastercard/Google/AWS and others (https://docs.stripe.com/payments/machine/x402, https://www.linuxfoundation.org/press/linux-foundation-is-launching-the-x402-foundation-and-welcoming-the-contribution-of-the-x402-protocol).
- Pioneer startups (context): AgentMail (agent-only email), Browser Use, and Mem0 (agent memory), among others, are cited as examples of the "parallel agent economy" (https://www.forbes.com/sites/dariashunina/2026/03/11/make-something-agents-want---humans-are-no-longer-the-customer/).
- Critical perspective (context): There's a critique that "most agent-facing software is infrastructure, which is hard for a startup to monetize; incumbents that control the rails (Stripe/Visa/Salesforce) are structurally advantaged" (https://www.openfor.co/post/yc-summer-2026-requests-for-startups-an-independent-reading). **Analysis**: In the pitch, focusing on agent-first rebuilding of a specific vertical category — rather than "infrastructure in general" — can sidestep this critique while still looking investable.

### Winning Angles (assuming 5-hour dev, 90-second demo) [Analysis]

1. **An Agent-Ready conversion layer, "Turn any service agent-ready in 90 seconds"**: A tool that takes an existing (human-facing) web service/documentation as input and auto-generates an MCP server + agent-optimized documentation (llms.txt-style) + a machine interface for sign-up. The demo is a contrast video: "Before: the agent clicks around the browser, gets lost, and fails / After: instant completion via the generated MCP." This visually proves the original text's "slow, inconsistent, and brittle," and the framing should also resonate with judge Sean Grove (AI coding agent devtools).
2. **A human-out-of-the-loop sign-up & payment demo**: Implement an end-to-end flow where an agent autonomously completes "discover → register → obtain API key → x402-style micropayment → start using" a service. This is a full re-enactment of the original text's "discover, sign up for, and instantly start using new tools programmatically, without needing a human in the loop," and getting all the way through payment makes it a strong contender for Biggest Engineering Lift. The heaviest implementation lift of the three.
3. **Analytics/observability for agents, "Google Analytics for agent traffic"**: A SaaS that identifies which traffic to your service originates from agents, visualizes where agents fail or drop off, and suggests documentation improvements. This productizes the Lightcone podcast's point that "documentation becomes the GTM," making it the easiest to frame as an investable, recurring-revenue story. The demo works with a dashboard of synthetic traffic.

---

## 4. Team Fit [Analysis]

| Member | Strengths | Company Brain | Dynamic Interfaces | Software for Agents |
|---|---|---|---|---|
| Me (orchestration) | Advanced Claude Code operation, daily hands-on skills/memory design, fully-automated development | ◎ skills file and memory design is exactly my daily work; can ship a GBrain-compatible design fastest | ○ Role of assembling the pipeline that has agents generate/modify UI | ◎ MCP and agent tool integration is home turf |
| Arata (HCI/XR/multimodal, Sakana AI) | CHI/UIST-caliber HCI research, React, multimodal LLMs, C2 system development | ○ Can differentiate via multimodal ingestion such as voice interview → structuring | ◎ **Malleable software is literally his own research area**. Can pitch with academic backing and overwhelm other teams on UI quality | △ Strengths are harder to leverage on an infra-leaning theme (though would shine for visualizing agent UX) |
| Giacomo (infrastructure generalist) | Go/K8s/Rails, ex-Apple Maps/GKE/Twitch, Head of Product Engineering | ◎ Ingestion pipeline and auditable storage design; persuasive in enterprise contexts | ○ Design of primitives/SDK and deployment infrastructure | ◎ Backend for APIs/protocols/payments is squarely in his wheelhouse |

- **Company Brain**: All three members score ◎–○, giving it the highest overall team strength. However, this theme is also expected to have the fiercest competition.
- **Dynamic Software Interfaces**: Arata's legitimacy as a researcher is **a differentiator no other team can replicate**. Being able to say in the pitch "we have a CHI/UIST researcher in this exact field on the founding team" is also strong from an investable standpoint.
- **Software for Agents**: My and Giacomo's fit is high, but Arata's strengths are more likely to go unused. Need to manage the risk of the 90-second video looking like a "plain API demo."

## 5. Judging Criteria (How to Land Honorable Mentions) [Analysis]

- **The Investable Startup Award**: Market-size claims are easiest to make for Company Brain (the original text itself asserts "every company in the world" will need one, with Glean's $4.6B valuation as a comparable) and for Software for Agents' vertical focus (the "next trillion users" narrative). Including a slide on a "per-seat / per-agent pricing model" in the pitch would help.
- **The UX/UI Award**: Dynamic Software Interfaces is nearly the sure bet. Given the nature of the theme, the UI itself is the product. A live-morphing UI plus Arata's HCI backing makes this the strongest candidate. Company Brain could also go for it via visualization (graphs, freshness indicators) of the "living map of knowledge."
- **The Biggest Engineering Lift**: A vertically-integrated demo that makes people say "how did you get that far in 5 hours" — such as Software for Agents' end-to-end "discover → register → pay → use" flow (winning angle 2), or Dynamic Interfaces' "dynamic middleware modification" (an answer to Gupta's hardest open question). The team's own development style — fully-automated parallel development with Claude Code — can also be pitched in the context of this award.

Also, a judge-specific adjustment (analysis): Sean Grove (Linzumi = devtools that govern and verify AI coding agents from team chat, formerly of OpenAI Model Spec) is presumed to respond well to talk of agent governance, verification, and documentation quality, while Henry Ndubuaku (Cactus = on-device low-latency inference) is presumed to respond well to latency, edge computing, and depth of implementation. Whichever theme you choose, it's worth touching on "how do you verify and trust agent behavior" at least briefly.

---

## 6. Summary

- **Company Brain**: "The missing layer that converts scattered internal knowledge into an executable skills file for AI." A direct descendant of GBrain and the event's flagship theme, but also the most fiercely contested arena. Falling into search/chatbot territory means losing.
- **Dynamic Software Interfaces**: "With coding agents, every user becomes their own FDE and remakes the UI from the ground up." The strongest theme for competing on vision and demo appeal.
- **Software for Agents**: "Rebuilding machine-readable software for the next trillion users — agents." With protocol maturity (MCP/A2A/x402), the timing is ripe. Making the demo visually compelling is the challenge.

**Recommended ranking (analysis)**: ① Dynamic Software Interfaces — differentiation is structural since it's literally Arata's research area; strong 90-second video appeal and a leading UX/UI Award candidate; avoids the most contested arena. ② Company Brain — team-wide fit and GBrain/Garry Tan synergy are the best, but factor in the competitive intensity and the risk of converging into a "RAG chatbot" (if chosen, sharpen the edge on "execution" and "freshness"). ③ Software for Agents — high fit, but Arata's strengths go unused, and it's the hardest to design for video appeal. Make the final call based on team-building on the day (a fourth member joining) and how crowded each theme turns out to be.
