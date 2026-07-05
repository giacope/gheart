# FDE / Forward Deployed Agents 市場・競合地図 — deep-research レポート

作成日: 2026-07-05 / 対象: c0mpiled ハッカソン(5時間開発・90秒デモ審査)
手法: deep-research harness(6検索角度 → 22ソース取得 → 106主張抽出 → 25主張を3票敵対的検証 → 24確認/1反証)

> **凡例**: 「事実」= 一次/高品質二次ソースで検証済み(3-0確認)。「分析」= 本レポートの戦略推論(未検証)。

---

## 0. 一行結論(最重要)

今朝の会議で収束した本命=**「会議/音声 → 構造化・再利用可能な知識 → proactive エージェント」は、すでに YC の CEO 本人(Garry Tan の GBrain)+ YC S26 の Hyper + Otter/MCP に占拠されている**。汎用の「meeting→knowledge」で出すと、審査員に derivative(二番煎じ)に見える構造的リスクがある。**勝ち筋は縦(construction/建築ドメイン)に切ること**——Tektome(Giacomo)の建築AI知見を moat にした、ドメイン特化のトピック分割 + tacit knowledge 吸い上げ + ドメインイベント駆動の proactivity。

---

## 1. FDE の実態と痛み(事実)

- **起源**: FDE は Palantir 発祥(2010年代初頭、社内名「Delta」)。Dev=「1機能を多顧客へ」(製品中心の深さ)に対し、Delta=「1顧客に多機能を」(顧客中心の広さ)。既存プラットフォーム(Gotham/Foundry)を単一顧客向けに構成する。~2016年まで Palantir は通常SWEより FDE の方が多かった。
  - 出典: [Palantir blog(A Day in the Life)](https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-45ef2de257b1), [Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers)
- **日々の仕事の核心 = 組織固有の文脈の吸い上げと実装化**。FDE は「その領域を最もよく知る現場ユーザー」から直接ドメイン知識を学び、顧客と手を取り合って高速反復する。3次元で動く: ①現場に埋め込まれ共同開発 ②機能を本体プロダクト/ロードマップにフィードバック ③営業と組んで受注・活性化。
- **AI時代のスタートアップが FDE を採用・改名**: Sierra は意図的に「agent engineer」と命名(システム統合 + エージェント開発 + 顧客業務理解の合成)。Sierra の Head of Agent Engineering は Palantir 出身(約5年)。Sierra の仕事の記述=「顧客システムを低遅延の音声/チャットエージェントと統合し、**顧客が自社の内部知識と文脈を適用できるよう支援する**」——これはまさに本チームが狙う「tacit context 吸い上げ」の痛みそのもの。
  - 出典: [Latent Space](https://www.latent.space/p/forward-deployed-engineers-aiewf), Sierra blog

## 2. Forward Deployed Agents(FDA)= 概念ではなく既に出荷済み(事実)

- **Palantir「AI FDE」**が本番稼働(early 2026 GA、AIP対応enrollment向け)。「the AI-powered forward deployed engineer」=会話コマンドで Foundry を操作する対話エージェント。**単に質問に答えるのではなく、ontology を構築・保守し、コードリポジトリを管理し、データパイプラインを改変する**=人間FDEの役割そのものをエージェント製品化。
  - 出典: [Palantir docs — AI FDE overview](https://www.palantir.com/docs/foundry/ai-fde/overview), [modes-and-skills](https://www.palantir.com/docs/foundry/ai-fde/modes-and-skills)
- **「FDA」という語の初出エッセイ**は Superagentic AI(Shashi Jagtap, 2025-10)——「人間の代わりにエージェントをクライアント環境に deploy、契約は価値実証の後」。※これはブログ品質ソース。

## 3. 投資・市場トレンド — FDE/FDA は2026年トップティアの賭け(事実)

- **AWS が $1B の社内 FDE 組織を新設(2026-06-30)**。VP Francessca Vasquez、初期顧客に Cox/NBA/NFL/Southwest。※研究時点でわずか5日前のニュース。
- 先行して **OpenAI が ~$4B の FDE ジョイントベンチャー**(Tomoro=約150人のFDE企業の買収計画含む)、**Anthropic が $1.5B の FDE JV**。いずれも PE と組成(TPG/Advent/Bain/Brookfield; Blackstone/H&F/Goldman)。
  - ※nuance: OpenAI の $4B は「調達資本」であって valuation ではない(valuation は ~$10B 報道)。
  - 出典: [TechCrunch](https://techcrunch.com/2026/06/30/amazon-launches-new-1-billion-fde-org-following-openai-and-anthropic/), Amazon newsroom, CNBC, Bloomberg
- **含意(分析)**: 三大プラットフォーム全社が2026年に FDE 組織を立てた=「モデルではなくデプロイ/文脈がボトルネック」という認識が業界コンセンサス化。ハッカソンのテーマ選択として時流に完全に乗っている。

## 4. YC RFS が本チームの thesis を canonical 化(事実)

- **Company Brain(Blomfield)**: 「AI自動化のボトルネックはもはやモデルではない。今やドメイン知識だ」。散在する非構造ソース(メール/Slack/チケット/DB/人の頭)から知識を抽出→**AIが実行できる skills file** に変換=「生データと信頼できるAI自動化の間の欠けた層」。**明示的に「検索でもチャットボットでもない」**。
- **Dynamic Software Interfaces(Gupta)**: 企業ソフトは顧客ごとに FDE がカスタマイズしてきた。「コーディングエージェントが十分良くなり、ユーザーが**自分自身の FDE** になれる」。
  - 出典: [YC RFS](https://www.ycombinator.com/rfs)(一次・verbatim)

## 5. ⚠️ 競合 — 本命 whitespace は既に埋まっている(事実)

| プレイヤー | 何をやっているか | 脅威度 |
|---|---|---|
| **GBrain**(Garry Tan=YC CEO本人) | 会議/メール/音声通話を **self-wiring knowledge graph**(typed edges, zero-LLM抽出)に取り込み、raw chunk でなく「答え」(合成・引用付き散文)を返す。**24/7 の proactive cron** で dedup/引用修正/統合(66 crons・~146k pages)。OSS。 | **最高**。本チームの差別化3点(音声→構造化 / トピック分割 / proactive)を全て既に出荷。しかも審査エコシステムの最高権威が作者。 |
| **Hyper**(YC Spring/S26 2026) | 「AI社員を動かす company brain」。documents/カレンダー/メール/Slack/GitHub PR から**手入力ゼロで**自動吸い上げ→自己保守型 knowledge graph(SPO triples, valid_from/until, 履歴の遡及インデックス)。 | 高。auto-capture whitespace を正面から。研究時点で~12日齢。 |
| **Otter** | 文字起こしを「workflow を動かす検索可能な知識」と位置づけ。AI Chat が会議+連携アプリ(Gmail/Drive/Notion/Jira/Salesforce)横断検索。**MCP Server で ChatGPT/Claude に会議知識を直結**。 | 中。ただし live query/RAG 層であり、curated なトピック分割再利用KBではない=そこは隙。 |

- ※反証(0-3で棄却): Remi8 の「topic/project/context で自動分類」主張は検証で否定=**多くの文字起こしツールは実は真のトピック分割をしていない**。横方向の隙は残るが、GBrain/Hyper が横方向版を塞いでいる。

---

## 6. 空白地帯と勝ち筋(分析 / confidence: medium)

汎用「meeting→company knowledge」は混雑(GBrain/Hyper/Otter、資金潤沢なインサイダー主導)。**5時間デモで防御可能な wedge は縦(vertical)**——本チームの建築/建設ドメイン(契約、価格前例、認証、専門家の暗黙知)。moat は「汎用RAG」ではなく「ドメイン特化のトピック分割 + tacit-expert capture」。

**RFSテーマ別の切り口マッピング**:
1. **ドメインスキーマ駆動のトピック分割**(建設 ontology: 入札 / 変更指示 / 認証 / 前例価格 を汎用エンティティグラフでなく構造化)→ **Company Brain** に最適合。
2. **そのドメイン知識に対し能動的に動くエージェント**(例: 新規入札が来たら過去の価格前例を自動でフラグ)→ **Software for Agents**。GBrain の cron 型 proactivity より**イベント/トリガー駆動のドメイン proactivity** の方が鋭く demo 映えする。
3. **契約/プロジェクトごとに自己再構成するドメインUI** → **Dynamic Software Interfaces**。

### 差別化を legible にする論点(会議の「proactive」を尖らせる)
- GBrain の proactive = スケジュール型バックグラウンド enrichment(cron)。
- 本チームが勝つ proactive = **ビジネスイベント発火型**(「特定の業務イベントが起きた瞬間にエージェントが動く」)。90秒で「入札到着 → 過去契約から価格前例を自動提示」の before/after を見せる方が圧倒的に鋭い。

---

## 7. 未解決の問い(次に潰すと勝率が上がる)

1. GBrain/Hyper は真の**ドメインスキーマ駆動**トピック分割(建設ontology)を持つか、汎用グラフだけか? 汎用だけなら縦の wedge は本物。
2. GBrain/Hyper の「音声」は**生オーディオを処理**するのか、文字起こし済みテキストを page として取り込むだけか? 「生の会議音声→構造化ドメイン知識」をワンステップは未開拓かもしれない。
3. cron型 proactivity vs イベント/トリガー駆動 proactivity の差を demo でどう見せるか。
4. Tektome の既存の契約/価格/認証コーパスと顧客関係は、横断的 company brain が複製できない**データ/関係の moat** になるか。90秒でその moat を審査員に伝えられるか。

---

## 8. caveats(重要)

- 時間感度が高い: AWS $1B FDE org は5日前、GBrain(~2026-04 OSS化)と Hyper(~12日齢)は高速で動いており競合図は数週間で変わりうる。
- ベンダー製品の能力主張(Palantir AI FDE / Hyper / GBrain / Otter)は**謳われた/意図された能力**であり独立ベンチマークではない。「何をするか」は信頼できるが「どれだけうまく動くか」は未検証。
- **最重要の戦略 caveat**: 本チームの当初 whitespace は GBrain(Garry Tan 作)と大きく重複。汎用版は差別化されず YC 近縁の審査員に derivative に見えうる。差別化は**縦(建設)の深さ**から来なければならない。
- MEMORY のフラグ: GStack/GBrain は CLAUDE.md 汚染リスクあり。ツールとして採用するなら慎重に。
