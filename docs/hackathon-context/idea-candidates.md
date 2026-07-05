# アイデア候補 — c0mpiled ハッカソン 2026-07-05

> 🇯🇵/🇺🇸 Bilingual document — each section appears in Japanese first, followed by its English translation.

準拠資料: 会議要旨(`docs/meeting/26_7_4_21_45-summary.md`)/ チーム(`docs/team/`)/ RFS 分析(`rfs-summer-2026.md`)。
裏付け調査: 競合(`competitive-landscape.md`)/ 技術実現性(`tech-feasibility.md`)/ Arata 活用(`arata-angles.md`)。

選定基準: ①会議で収束した「agent-first チャット」の線に乗る ②3人の強みが全員発揮される ③90秒動画で映える ④5時間で縦切り1本が通る。

Reference materials: Meeting summary (`docs/meeting/26_7_4_21_45-summary.md`) / Team (`docs/team/`) / RFS analysis (`rfs-summer-2026.md`).
Supporting research: Competitive landscape (`competitive-landscape.md`) / Technical feasibility (`tech-feasibility.md`) / Arata's edge (`arata-angles.md`).

Selection criteria: (1) rides the "agent-first chat" direction the team converged on in the meeting; (2) lets all three people's strengths shine; (3) looks great in a 90-second video; (4) a single vertical slice can be built and demoed in 5 hours.

---

## 候補A(本命): Agent-Native Chat — 「組織のインターフェースを作り直す」

**一言**: Slack の再発明ではなく、「人間はチャットに残り、実行はエージェント群がやり、応答は動的 UI として現れる」組織 OS の最初の画面。

**英語ピッチのワンライナー案**: *"Slack was built for humans messaging humans. We rebuilt team chat for the world where your teammates are agents — and their answers aren't messages, they're living interfaces."*

**コア体験(90秒デモ絵コンテ、1シーン約10秒)**:
1. 【課題 0:00–0:40】既存の姿: Slack にボットを「1メンバー」として後付け → テキストの壁、ツール接続地獄、返答は静的メッセージ。"AI integration" と "AI-first" は違う、と宣言
2. 【転 0:40–0:50】クライアント専用チャネルで「Show me a dashboard of our sales history with this client」と入力(または**音声**で指示 — Arata の見せ場)
3. 【デモ 0:50–1:10】チャネル内にダッシュボードが**その場で段階描画**され(streaming UI)、**隣の画面(Giacomo 側)にも同時に現れて双方が操作**——マルチプレイヤー
4. 【デモ 1:10–1:20】別チャネルでタスクを委任 → **エージェントの作業セッションがチャネルにライブ配信**され、チームが観戦・介入
5. 【締め 1:20–1:30】生成された UI はチャネルに**永続化**され、組織のツール/ナレッジになる。"The next Slack won't have AI. It will be made of it."

**RFS 適合**: Dynamic Software Interfaces 主軸で、Company Brain(チャット=知識の起点、生成 UI の永続化)と Software for Agents(エージェントが一級参加者)を1本で貫く。テーマ登録は **Dynamic Software Interfaces** を推奨(激戦区回避+UX/UI Award 本命、rfs-summer-2026.md の推奨①と一致)。

**役割分担**(tech-feasibility.md の工程表に対応):
- Yoshi: エージェント&プロンプト(render_ui ツール定義、Claude API 配線、セッション中継)+ 全体オーケストレーション
- Giacomo: リアルタイム基盤(Supabase Realtime Broadcast + BroadcastChannel フォールバック)+ バックエンド + デプロイ
- Arata: UI レンダラ(JSON ツリー → React、allowlist 方式)+ 音声入力 + デモ演出・録画監督
- (4人目が合流したら: 合成データ作成・pitch 資料・英語スクリプト)

**狙う賞**: UX/UI Award(本命)+ Biggest Engineering Lift(生成 UI×マルチプレイヤー×ライブセッションの縦貫)

**リスクと返し**(詳細は competitive-landscape.md):
- 「Linzumi と何が違う?」→ Linzumi は**開発チームの coding agent 統制**(diff/テスト/PR)。我々は**非エンジニア含む組織全体のインターフェース**。冒頭で自分から言及して differentiation を先取りする(審査員 Sean Grove の目の前でやる以上、言わない方が危険)
- 「Slack Agentforce / Claude Tag / Copilot Studio で十分では?」→ 全て既存チャットへの後付けで、応答は静的メッセージかブロック UI。生成 UI の永続化とマルチプレイヤーが無い
- 最大の実装リスクは Wi-Fi とライブ一発勝負 → 録画優先、13:30 スコープ凍結、BroadcastChannel でネットワーク非依存の録画

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

## 候補B(Aの尖らせ方1): "Channels that grow their own tools" — 生成 UI の永続化を主役に

Aと同じ土台で、**「チャネルが自分のツールを育てる」**を物語の中心に置く版。頼むたびに生成された UI がチャネルに蓄積し、チームの业务アプリ群が会話から「生えてくる」。Company Brain 文脈が強まり(会話→実行可能な組織知)、Investable Startup Award 向けの SaaS ストーリー(per-seat + per-agent 課金)が描きやすい。

- 選ぶ状況: チームビルディングで「ビジネスモデルの説得力」を重視する空気になったら/Dynamic Interfaces が予想外の激戦区だったら(Company Brain 登録でも語れる構図)
- デモ差分: 締めのシーンを「チャネルのサイドバーに、この1週間で生成されたツール群が並ぶ」画に差し替え
- リスク: 5時間で「蓄積」を見せるには演出(事前仕込みの合成履歴)が必要

## Candidate B (Sharpening A, Option 1): "Channels that Grow Their Own Tools" — Persisted Generative UI Takes the Lead

Same foundation as Candidate A, but with **"the channel grows its own tools"** as the central narrative. Every request adds another generated UI to the channel, and the team's business apps "grow organically" out of conversation. This leans harder into the Company Brain angle (conversation → actionable organizational knowledge) and makes it easier to tell a SaaS story (per-seat + per-agent pricing) for the Investable Startup Award.

- When to choose this: if team-building discussion leans toward valuing "business model credibility," or if Dynamic Interfaces turns out to be an unexpectedly crowded category (this framing also works if we register under Company Brain instead).
- Demo difference: swap the closing scene for one showing "the row of tools generated over the past week, lined up in the channel's sidebar."
- Risk: showing "accumulation" in 5 hours requires staging (a pre-seeded synthetic history).

## 候補C(Aの尖らせ方2): Mission Control — 組織がエージェント艦隊を指揮する C2

Aと同じ土台で、**多人数→多エージェントの指揮・状況認識**を主役に置く版。チャネル=作戦、委任したタスクの進行がチャネル内に生成される「状況ボード」(C2 風)に集約され、人間は例外処理だけ拾う。**防衛 C2 を実務開発している Arata の当事者性**が最強に効く(arata-angles.md: 比喩自体はコモディティ化気味だが、実務者が語ると差別化になる)。

- 選ぶ状況: 4人目にエンタープライズ/オペレーション系の人が合流したら/審査員が「エージェントの信頼・検証」に強く反応する空気なら(Sean Grove の関心領域)
- デモ差分: シーン4を拡張し、複数エージェントの並列タスクが1枚の生成状況ボードに集約される画を見せる
- リスク: Linzumi との近接が最大化する構図なので、差別化線(コードではなく組織業務)を最初に引くこと

## Candidate C (Sharpening A, Option 2): Mission Control — C2 for an Organization Commanding a Fleet of Agents

Same foundation as Candidate A, but with **many humans commanding many agents, plus situational awareness** as the central story. Channels become "operations," and the progress of delegated tasks converges into a generated, C2-style "status board" inside the channel, with humans only handling exceptions. **Arata's authenticity as someone who actually builds defense C2 systems** is our strongest asset here (per arata-angles.md: the metaphor itself is somewhat commoditized, but coming from a practitioner it becomes real differentiation).

- When to choose this: if a 4th teammate with an enterprise/operations background joins, or if the judges respond strongly to "agent trust and verification" (an area Sean Grove cares about).
- Demo difference: expand scene 4 to show multiple agents' parallel tasks converging onto a single generated status board.
- Risk: this framing maximizes proximity to Linzumi, so the differentiation line (organizational work, not code) needs to be drawn immediately.

---

## 候補D(保険1、テーマ変更時): Tacit Knowledge Interviewer — 声で吸い上げる Company Brain

チーム事情で Company Brain 一本に振る場合の差別化案(rfs-summer-2026.md 勝ち筋3)。文書取り込みに集中する他チームを尻目に、**「知識は人の頭の中にある」**へ音声インタビューエージェントで踏み込み、回答をリアルタイムに GBrain 互換 skills file へ構造化描画する。Arata のマルチモーダル経験直撃、Garry Tan 文脈(GBrain 互換)も回収。

## Candidate D (Fallback 1, if Theme Changes): Tacit Knowledge Interviewer — Company Brain, Captured by Voice

A differentiation option for if team circumstances push us to commit fully to Company Brain (win condition 3 in rfs-summer-2026.md). While other teams focus on ingesting documents, we go after the fact that **"knowledge lives in people's heads"** — a voice interview agent draws it out and structures the answers in real time into a GBrain-compatible skills file. This plays straight to Arata's multimodal experience and also captures the Garry Tan angle (GBrain compatibility).

## 候補E(保険2、最小構成): One Backend, N Interfaces

時間や布陣が崩れた場合の縮退案(rfs-summer-2026.md 勝ち筋1)。同一データストアに対し、ユーザーごとに UI をその場生成——営業にはタスクリスト、学生にはカレンダー。RFS 原文の例示そのままで審査員に一発で通じ、実装が最も軽い。候補Aの部品(JSON→React レンダラ)を流用できるので、**Aが 15:30 判定で崩れたときの退避先**としても機能する。

## Candidate E (Fallback 2, Minimal Build): One Backend, N Interfaces

A fallback for if time or team composition falls apart (win condition 1 in rfs-summer-2026.md). The same underlying data store generates a different UI on the fly per user — a task list for a salesperson, a calendar for a student. This maps directly onto an example straight from the RFS text, so judges get it instantly, and it's the lightest to build. It reuses a component from Candidate A (the JSON → React renderer), so it also works as **the landing spot if Candidate A falls apart at the 15:30 checkpoint**.

---

## 推奨と当日の決め方

- **推奨: 候補A**を基本線に、チームビルディング(10:45–12:00)で B/C どちらの尖らせ方にするかを決める(A/B/C は同じ実装土台なので 12:00 の着工に影響しない——決めるのは「90秒動画の物語」だけ)
- テーマ登録は Dynamic Software Interfaces(B に振るなら Company Brain も可)
- 15:30 中間判定で縦切りが通っていなければ E に縮退
- 4人目の強み次第で B(ビジネス系)/C(オペレーション系)/D(音声・演出系)に寄せる

## Recommendation and How We'll Decide on the Day

- **Recommendation: Candidate A** as the baseline. During team-building (10:45–12:00), decide whether to sharpen it toward B or C (A/B/C share the same implementation foundation, so this doesn't affect the 12:00 start of building — the only thing being decided is "the story for the 90-second video").
- Register the theme as Dynamic Software Interfaces (Company Brain also works if we lean toward B).
- If the vertical slice isn't working at the 15:30 checkpoint, fall back to E.
- Depending on the 4th teammate's strengths, lean toward B (business-focused), C (operations-focused), or D (voice/production-focused).
