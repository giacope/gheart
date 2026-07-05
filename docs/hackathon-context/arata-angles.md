# Arata Jingu の強みを最大化するアングル調査

対象構想: 「agent-first チャットシステム——エージェントが一級参加者で、チャネル内に動的 UI をその場生成し(ダッシュボード等)、多人数でエージェントへのタスク委任・調整・セッション共有をする組織インターフェース」(YC RFS: Dynamic Software Interfaces / Software for Agents 系)

Arata プロフィール確認済み: Sakana AI 防衛チームで C2(Command & Control)システムをドローン等ハードウェアと統合開発(Python/React/GCP)。Saarland University で HCI/XR/ハプティクスの PhD(Google PhD Fellow、Funai Overseas Scholarship、CHI/UIST/Laval Virtual で6本の査読論文・受賞2件・デモ賞1件)。Google (Android XR) で AR × マルチモーダル LLM のインターン(2025年6-9月、Zurich)。
出典: [LinkedIn](https://www.linkedin.com/in/arata-jingu-972392168/), [ajingu.github.io](https://ajingu.github.io), [Saarland Informatics Campus](https://saarland-informatics-campus.de/en/piece-of-news/doctoral-student-from-saarbrucken-wins-prestigious-google-fellowship/)

---

## 1. HCI 研究の引用弾薬

チームの核テーゼは「チャット(線形テキスト)は複数人・複数エージェント・構造化タスクの管理に向かない → チャネル内で動的 UI をその場生成すべき」。2025-2026年の最新 HCI 研究がまさにこの主張を後押しする学説的裏付けを持っている。

| 論文 | 出典 | ピッチでの使い道 |
|---|---|---|
| **Software as Content: Dynamic Applications as the Human-Agent Interaction Layer** (Xie & Xie, 2026) | [arXiv:2603.21334](https://arxiv.org/abs/2603.21334) | ピッチの中核主張そのもの。「チャットは①構造化データと線形テキストのミスマッチ ②自然言語入力の高エントロピー ③永続的で進化する状態の欠如、という3つの根本的限界を持つ」という論文の問題提起は、我々の "generative UI in-channel" のモチベーションと一字一句レベルで一致。UI が「一過性の応答」から「共有・永続的なインタラクション層」に進化する、という記述はプロダクトの one-liner に転用可能。 |
| **Gradual Generation of User Interfaces as a Design Method for Malleable Software** (Min, Huang, Jiang, Xia — UCSD, 2026) | [arXiv:2601.17975](https://arxiv.org/abs/2601.17975) | 「AIが生成するUIをどう段階的に見せてカスタマイズを発見可能にするか」という設計手法。我々のダッシュボードが「一発生成で終わり」ではなく「使いながら育つ UI」であることの設計原理として引用可能。審査員に「行き当たりばったりのデモではなく、学術的に裏付けられた設計手法に基づく」ことを示せる。 |
| **Generative and Malleable User Interfaces with Generative and Evolving Task-Driven Data Model** (Cao, Jiang, Xia — CHI 2025) | [ACM DL 10.1145/3706598.3713285](https://dl.acm.org/doi/10.1145/3706598.3713285) | タスク駆動データモデルを基盤にUIを生成し、自然言語+直接操作でエンドユーザーが改変できるという枠組み。チャネル内でユーザーがエージェント生成ダッシュボードを直接いじって委任先を変える、というインタラクションの理論的支柱として使える。 |
| **Meridian: A Design Framework for Malleable Overview-Detail Interfaces** (Min & Xia — UIST 2025) | [ACM DL 10.1145/3746059.3747654](https://dl.acm.org/doi/10.1145/3746059.3747654) | Overview(全体俯瞰) と Detail(個別タスク)を行き来できるUI設計。複数エージェント・複数タスクを俯瞰しつつ個別に深掘りする「組織インターフェース」の画面設計原則として直接使える(例: チャネル全体ビュー ⇔ 個別エージェントのタスクカード)。 |
| **Hidden Technical Debt in Generative (GenUI) and Malleable User Interfaces** (2026) | [arXiv:2604.16354](https://arxiv.org/html/2604.16354) | GenUIの実装上の落とし穴を指摘する論文。5時間ハッカソンでは深掘りしないが、Q&Aで「スケーラビリティや技術負債をどう見るか」と聞かれた際の防御材料として頭出ししておく価値あり。 |
| **The Keyhole Effect: Why Chat Interfaces Fail at Data Analysis** (Reddy, 2026) | [arXiv:2602.00947](https://arxiv.org/abs/2602.00947) | 認知科学的に「チャットは複数ステップ・状態依存タスクで海馬の空間記憶・ワーキングメモリ限界・言語的隠蔽効果により分析性能を体系的に劣化させる」ことを定式化(O = max(0, m − v − W))。「なぜチャットではなくダッシュボードか」を数式付きで説明できる最強の引用。審査員向けに1枚スライド化する価値あり。 |
| **From Human Interfaces to Agent Interfaces: Rethinking Software Design in the Age of AI-Native Systems** (2026) | [arXiv:2603.20300](https://arxiv.org/pdf/2603.20300) | 「AIネイティブ時代にはソフトウェア設計そのものを人間向けからエージェント向けへ再考すべき」というフレーミング。プロダクトの一枚目のスライド(problem statement)のトーン設定に使える。 |
| **DuetUI: A Bidirectional Context Loop for Human-Agent Co-Generation of Task-Oriented Interfaces** (2025) | [arXiv:2509.13444](https://arxiv.org/pdf/2509.13444) | 人間とエージェントが双方向に文脈を共有しながらUIを共生成するループ。多人数がエージェントにタスク委任しつつ UI がフィードバックとして進化する、というマルチプレイヤー性の理論的裏付け。 |
| Google **A2UI** プロジェクト(2025-2026) | [Google Developers Blog](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) | 業界動向として引用(学術論文ではないが実装標準の裏付け)。「Googleも agent-driven UI のオープンプロトコルを推進しており、我々のアプローチは業界トレンドの最先端にいる」という文脈づけに使える。Arata が Google Android XR チームでマルチモーダル LLM に関わっていた経験と接続できる点が強み。 |

【分析】これらの論文はほぼ全て2025年後半〜2026年に集中しており、「malleable software」「generative UI」は今まさにHCI界でホットな研究潮流。Arata がこの文脈を「論文の存在を知っている」レベルではなく「同じ研究コミュニティで発表してきた当事者」として語れることが最大の武器。UCSD の Xia Lab(Cao, Min, Jiang)がこの分野をリードしており、Arata の CHI/UIST 発表実績はこのコミュニティの作法(evaluation, design rationale の書き方)を体得している証拠になる。

---

## 2. C2(Command & Control)メタファーの強度

### 軍事 C2 の設計原則 → エージェント群指揮 UI への転用

出典: [Air Force Doctrine Publication 3-0.1 Command and Control (2025)](https://www.doctrine.af.mil/Portals/61/documents/AFDP_3-0_1/AFDP3-0.1CommandandControl.pdf), [Corvus Intelligence: Complete Guide to C2 Systems](https://corvusintell.com/blog/c2-systems/complete-guide-to-c2-systems/), [The Air Power Journal: Decentralized C2](http://theairpowerjournal.com/decentralized-c2-air-operations-battle-management-mission-command/)

- **状況認識(Situational Awareness)**: C2とは「情報の継続的な取得・統合・分析・可視化により状況認識を可能にするシステム」。→ チャネル内ダッシュボードは複数エージェントの進行状況・成果物を一画面で可視化する「状況認識レイヤー」そのもの。
- **任務指揮(Mission Command)/権限委譲(Distributed Control)**: 「望ましいC2は分散型であり、指揮官の意図の範囲内で現場に裁量を与える」という軍事ドクトリンの核心。→ プロダクトの「タスク委任」設計思想と直結: 人間は意図(ゴール)を与え、エージェントが裁量を持って実行し、UIが逐次報告する、という構造がまさに mission command の民生応用。
- **意思決定速度(OODA的優位性)**: 「敵より速く適切な意思決定を繰り返せる指揮系統が優位」という原則。→ 複数エージェントが並列でタスクをこなし、人間がダッシュボードで素早く介入・修正できることの速度優位性の語りに転用可能。

### 既にこのメタファーを使うプロダクト

「Mission Control」を名乗るエージェントオーケストレーションダッシュボードは2025-2026年にかけて急増しており、レッドオーシャン気味である点は要注意。

- [Mission Control (builderz-labs, OSS)](https://github.com/builderz-labs/mission-control) — セルフホスト型、タスク配信・コスト監視・マルチエージェントワークフロー管理。
- [MissionControlHQ](https://missioncontrolhq.ai/) — 「ChatGPT/OpenClaw/Claude Codeエージェントに共有タスクボード・スレッド議論・ライブダッシュボードを与える」SaaS。
- [GitHub Copilot の "mission control" ブログ](https://github.blog/ai-and-ml/github-copilot/how-to-orchestrate-agents-using-mission-control/) — GitHub自身がこの語りを採用。
- OpenAI Codex App(2026年2月)は "command center for agents" と自称。[出典](https://intuitionlabs.ai/articles/openai-codex-app-ai-coding-agents)
- 一部の論考は「エアトラフィックコントロール」「RTSゲームの指揮」ともメタファー化している([proofofconcept.pub](https://www.proofofconcept.pub/p/real-time-strategy-games-and-ai-interfaces))。

【分析】"Mission Control for agents" という言葉自体はコモディティ化しつつある。差別化ポイントは「メタファーを言葉として借りている競合」に対し、Arataは「実際に軍事C2システムを、実ハードウェア(ドローン)と統合し、実運用(防衛省と共同)で作っている当事者」という点。これは"vibes"ではなく"lived expertise"であり、審査員(Sean Grove, Henry Ndubuaku含む3x YCファウンダー)に対して「このチームはメタファーで喋っているだけでなく、意思決定システムの設計を実地でやってきた人間が UI 側にいる」という信頼性の転換になる。ピッチでは「軍事レベルの意思決定の速さ・裁量委譲の設計原則を、日常の組織運営に落とし込む」というフレーミングが有効。

---

## 3. マルチモーダル入力の差別化ネタ(5時間実装可能)

90秒デモで「おっ」となる瞬間を作るための小ネタを3つ、実装コスト付きで。

| # | ネタ | 内容 | 実装コスト見積り |
|---|---|---|---|
| 1 | **音声でチャネルにタスク投げる(voice-to-task)** | チャネルでマイクボタンを押して喋ると、ブラウザの Web Speech API(または OpenAI Realtime / AssemblyAI Streaming)でリアルタイム文字起こしし、そのままエージェントへのタスク委任メッセージとして投稿。字幕が流れながらエージェントが即座にダッシュボードを生成し始める、という「喋る→UIが生成される」の速さがデモ映えする。 | **低(1-2h)**。ブラウザ標準 Web Speech API(Chrome限定でOK、デモ環境固定できるので十分)ならAPIキー不要・実装数十行。AssemblyAI/OpenAI Realtimeを使うなら$4.5/hr程度でレイテンシ~150msと十分速いが、鍵管理とWebSocket実装で+1hほど余分にかかる。ハッカソンならWeb Speech APIで割り切るのが速い。出典: [AssemblyAI Universal-3 Pro](https://www.assemblyai.com/blog/best-api-models-for-real-time-speech-recognition-and-transcription), [RealtimeSTT](https://github.com/KoljaB/RealtimeSTT) |
| 2 | **画面共有/画像を投げてUI生成(screenshot-to-dashboard)** | 既存のスプレッドシートやSlackのスクショ、手書きのワイヤーフレーム写真をチャネルに投げると、エージェントがそれを解析してその場でダッシュボードUIを生成する。v0/Vercel の screenshot-to-code のように「画像→UIの型・色・コンポーネントを推定してコード生成」する体験を、チャットの中でその場でやる。 | **中(2-3h)**。マルチモーダルLLM(Claude/GPT-4o系)への画像添付+UI生成プロンプトの組み合わせなので技術的難度は低いが、生成UIのレンダリング先(iframe/React動的コンポーネント)の実装が必要。Arata の Google AR×マルチモーダルLLM インターン経験が直接活きる領域。 |
| 3 | **エージェント同士の「委任の可視化」アニメーション** | 人間が1つのタスクをチャネルに投げると、複数エージェントに自動分解・委任される様子をノードグラフ/フローとしてリアルタイムアニメーションでダッシュボードに描画(C2のコマンドチェーン可視化を模したUI)。実データではなく見た目のインパクト重視。 | **低〜中(1-2h)**。React Flow等の既存ライブラリでノードグラフを組み、委任イベントをWebSocket/ポーリングで流し込むだけ。実際のエージェント処理と厳密に同期していなくてもデモ的には「それっぽく動く」だけで十分な効果。C2ドクトリンの「commander's intent → 分散実行」を視覚的メタファーとして体現でき、Arataの防衛C2文脈とも一番強く結びつく。 |

【分析】5時間という制約を考えると、#1(音声)と#3(委任可視化)の組み合わせが費用対効果最大。#1は「入力のマルチモーダル性」を、#3は「C2メタファーの視覚化」をそれぞれ10秒で見せられる。#2は面白いが実装がやや重く、時間が余った場合のストレッチゴール向き。

---

## 4. 総括: Arata の役割設計案

Arata を「見せ場の担当」として以下の3レイヤーに配置するのが最も強い:

1. **UI/UXの設計原則の総責任者**: 上記1のHCI論文群(特にMeridian・Software as Content・Gradual Generation)を設計指針として、ダッシュボードの「俯瞰⇔詳細」「段階的な生成」「永続化する状態」を実装レベルで意思決定する。単なる見た目ではなく学術的正統性を持つUI設計を担保する役割。
2. **C2メタファーの意匠責任者(#3のネタの実装 + ピッチのストーリーテリング)**: 「委任の可視化」アニメーションと、"mission command" 的な語彙選びをピッチスクリプトに落とし込む。彼自身が防衛C2の実務者であることを、デモの中の一言(下記案)で明示的に使う。
3. **マルチモーダル入力(#1, #2)の実装**: Google Android XR でのマルチモーダルLLM経験を活かし、音声/画像入力からUI生成へのパイプラインを担当。React/Python/GCPのスタックも他メンバー(Yoshi=Claude Codeオーケストレーション、Giacomo=インフラ全般)と噛み合う。

デモの尺配分イメージ(90秒): 0-15秒(音声でタスク投入)→ 15-45秒(委任の可視化+ダッシュボード生成、C2的な言葉遣いのナレーション)→ 45-75秒(生成UIで複数人が協調操作)→ 75-90秒(締めの一言、下記案)。

---

## ピッチで使える一言 案(3つ)

1. "We're not just borrowing the language of command and control — one of us builds it for a living, integrating C2 systems with drones for national defense. We brought that discipline of mission command to everyday teamwork."
2. "Our HCI researcher has published at CHI and UIST on how humans and AI should share an interface — this isn't a hackathon guess about generative UI, it's built on the same design principles being published this year."
3. "From defense command centers to Google's AR labs, our team has already lived in the interfaces of the future — we're just bringing that to the channel where your team already works."

---

## 5行報告

Arata の強みは①最新HCI学説(Software as Content, Meridian, Gradual Generation等 2025-2026)による「なぜチャットでなくダッシュボードか」の理論武装、②Sakana AIでの実務C2システム開発経験による「mission control」メタファーの信頼性転換(競合多数だが"当事者性"で差別化)、③Google AR×マルチモーダルLLMインターン経験を活かした音声/画像入力の実装力、の3点。役割は「UI設計原則の総責任者+C2ビジュアル演出+マルチモーダル入力実装」に置くのが最強。5時間の実装では「音声でタスク投入→委任の可視化アニメーション」の組み合わせが費用対効果最大、画像入力生成はストレッチゴール。ピッチの決め台詞は「防衛C2の実務者とCHI/UIST研究者が同じチームにいる」という当事者性を前面に出す案を3本用意した。全出典はファイル内にURL明記、推測部分は【分析】と明示。
