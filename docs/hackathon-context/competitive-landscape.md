# 競合調査: agent-first チャット/コラボレーションシステム

調査日: 2026-07-05
対象: YC RFS ハッカソン(5時間開発・90秒デモ・YC審査員)向け

前提: チーム構想は「Slack を AI-first で作り直す。エージェントが一級参加者(first-class participant)として振る舞い、チャネル内で応答として動的 UI を生成し、チャットが会社の知識の起点(source of truth)になる」というagent-nativeなチーム・コラボレーション基盤。

---

## 1. 最重要: Linzumi(審査員 Sean Grove 創業)

### 1.1 会社概要

- **社名**: Linzumi / プロダクト名"Codex commander"表記あり
- **創業者**: Sean Grove。元OpenAIでpost-training/alignment研究(model-spec、deliberative alignment)に従事。過去にOneGraph創業(Netlifyが買収)、Netlify Chief Architect。今回が3社目・3度目のYCバッチ。
- **YCバッチ**: Spring 2026、ステータスActive、チーム3名、拠点サンフランシスコ、担当パートナーGarry Tan。
  出典: [Y Combinator: Linzumi](https://www.ycombinator.com/companies/linzumi)
- **ローンチ発信**: YC公式Xアカウントが "Bring your whole team and dozens of AI coding agents into the same chat threads" と紹介。Wafer.ai(GLM 5.2)とのパートナーシップで無料枠提供。
  出典: [Y Combinator on X](https://x.com/ycombinator/status/2069465556433211583)
- Garry Tanのコメント: "Linzumi is Codex but actually multiplayer"「magical for teams」。ローンチ後の反応は肯定的(94.4%ポジティブ、との報道)。
  出典: [Digg記事](https://digg.com/tech/bnuy2maq)

### 1.2 プロダクトの実態・スコープ

公式サイト([linzumi.com](https://linzumi.com/))のキャッチコピーは **"A familiar team chat with a fleet of coding agents inside every channel"**、および **"Your team in the thread, your coding agents on your own machine"**。

主要機能:
- **チャネル=エージェント実行の場**: 1スレッド内でエージェントがコード変更を実装→diff表示→テスト結果投稿までを完結。チームメンバーはスレッド内でレビュー・指示変更が可能。
- **Continuous Context Compilation**: チームの意思決定(「何を作るか」「なぜ変えたか」「誰が承認したか」)を継続的に記録し、コンテキスト復元の手間を減らす。
- **Decision Inbox**: 人間の判断が必要な項目だけを抽出して通知。「エージェントのfleetを操縦する一つの共有インターフェース」という位置づけ。
- **セキュリティ統制**: ディレクトリ単位のアクセス制御、ネットワーク送信・リポジトリ書き込みは明示承認必須、セッション終了時に権限失効。
- **モバイル対応**: スマホからもエージェントの進捗監視・指示変更が可能。
- **対応エージェント**: 現状Codexが主軸("Codex commander")、Claude Code統合は"coming soon"と報道あり(YC説明文より)。
- **価格**: Personal無料 / Company $100/月(ユーザー数無制限、seat課金なし)/ Enterprise要問い合わせ(SSO/SAML、自社ホスティング)。
  出典: [linzumi.com](https://linzumi.com/), [YC company page](https://www.ycombinator.com/companies/linzumi)

### 1.3 ポジショニング(創業者の問題意識)

Sean Groveの主張: 「実行(コード生成)はほぼ無料になった一方、**人間の意思決定と検証が新たなボトルネック**になっている」。複数エージェントを並行運用すると、承認がSlackのスレッドに埋もれる/エージェントが人間の判断待ちで止まる、という課題に対処する。ビジョンは「誰もが1,000体のAIエージェント企業のCEOになれるようにする」。
出典: [YC company page](https://www.ycombinator.com/companies/linzumi)

### 1.4 私たちの構想との重複・差異分析【分析】

**重複する部分:**
- 「チャット(スレッド/チャネル)をAIエージェント運用の中心に据える」という基本アーキテクチャは同一。
- 「エージェントの作業がチャット内に可視化され、チームがそこでレビュー・介入する」という体験も類似。
- 審査員Sean Grove自身が「チャットでエージェントを指揮する」領域のプレイヤーである、という事実は動かない。

**明確に異なる部分:**
- **スコープの射程**: Linzumiは名指しで「コーディングエージェントのfleetを統制する開発ツール」。対象はソフトウェア開発チームのエンジニアリングワークフロー(コード変更・diff・テスト・PR)に限定されている。私たちの構想は「組織全体のインターフェース」――営業・サポート・PM・経営判断など、コード生成に限らない汎用エージェント参加を志向できる。
- **エージェントの役割**: Linzumiのエージェントは基本「指示されたコーディングタスクを実行する下請け」であり、UIとして提示されるのは主にdiff/テスト結果というコード成果物。私たちの構想における「エージェントが動的UIを生成する」は、コード変更に限らずダッシュボード・フォーム・意思決定ツールなど**あらゆる応答をアプリケーション的UIとして描画する**という、より汎用的なgenerative UIレイヤーを狙える。
- **ナレッジの起点という主張**: Linzumiの「Continuous Context Compilation」は決定履歴のログ化に近く、コーディング文脈の意思決定監査が主眼。私たちが掲げる「チャットが会社の知識の起点になる」は、意思決定ログに留まらずチャット自体をナレッジベース/検索基盤として位置づける、より広いナレッジ経営の主張になり得る。

**ピッチ機会とリスク【分析】**:
- 機会: 審査員の土俵に片足を置きつつ「Linzumiはcoding agentの統制、私たちは組織全体のインターフェース」という一行で明確に差別化できれば、「審査員の専門性に敬意を払いつつ隣接領域で戦っている」という好印象を作れる。
- リスク: 差別化が曖昧なまま出すと「Linzumiの縮小版/劣化コピー」と読まれる危険が高い。90秒デモでは冒頭で「これはLinzumiではない、対象は非エンジニア含む全社員」であることを明示する一言が必須。
- 未確認: Linzumiが実際に「非コーディング業務」への展開を計画しているかどうかは公開情報からは確認できない(現状の訴求はエンジニアリングチームに一貫して限定)。

---

## 2. agent-nativeチャット/コラボの既存プレイヤー(2025–2026)

分類軸: **(A) AI後付け型(既存チャットにAIをアドオン)** か **(B) agent-first型(エージェントが一級参加者/システム自体がagent-native)**。

| プレイヤー | 分類 | 概要 | 出典 |
|---|---|---|---|
| **Slack Agentforce 2.0** | (A) 後付け型 | 既存Slackチャネル/DM/スレッドにAgentforceを@mentionで召喚。Channel Expertエージェントが常駐しチャネル内知識に回答。Agent BuilderにSlack向けpre-built actions(Create Canvas、Message Channel等)。 | [Slack Blog](https://slack.com/blog/news/limitless-workforce-with-agentforce-in-slack), [Slack AI Agents](https://slack.com/ai-agents) |
| **Slack Block Kit エージェント新コンポーネント** | (A→中間) | 2026年4月15日発表。Card/Alert/Carousel/Data Table/Work Object/Codeの6種を追加し、エージェント応答を「壁のようなテキスト」から構造化UIへ転換する狙い。Card(アイコン・タイトル・ヒーロー画像・アクションボタン)、Carousel(最大10枚横スクロール)、Data Table(表形式を直接レンダー、近日提供)。 | [Slack Dev Blog](https://slack.dev/build-richer-agent-experiences-with-block-kit/) |
| **Claude Tag(Anthropicの新Slack統合)** | (B)寄り | 2026年6月23日ベータ公開。旧「Claude in Slack」アプリを置き換え、**チャネルにつき1体の永続Claude**が全員と対話(ユーザーごとのインスタンスではない)。Opus 4.8で駆動。**ambient挙動**が特徴的で、監視対象チャネル・ツールから能動的に情報を拾い上げ、放置されたスレッドをフォローアップする=受動応答から能動的モニタリングへ拡張。旧アプリは2026年8月3日廃止予定。 | [Anthropic公式](https://www.anthropic.com/news/introducing-claude-tag), [TechCrunch](https://techcrunch.com/2026/06/23/anthropics-claude-tag-is-learning-your-company-one-slack-message-at-a-time/), [VentureBeat](https://venturebeat.com/technology/anthropic-launches-claude-tag-replacing-its-slack-app-with-a-persistent-ai-teammate-that-learns-monitors-and-works-autonomously) |
| **Microsoft Teams / Copilot Studio マルチエージェント** | (A)強め、一部(B)的機能 | Copilot Studioのマルチエージェントオーケストレーションが2026年にGA拡大。Agent-to-Agent(A2A)通信、Fabricエージェント連携。**Copilot Studioで構築したエージェントはCopilot Chat内にリッチなインタラクティブapp体験を直接表示可能**(データ確認・レコード更新・承認・アセット作成をチャット内で完結)――これは「チャネル内での動的UI生成」に近い先行事例。 | [Microsoft Copilot Blog](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/) |
| **Dust**(パリ拠点、Sequoia/Abstract出資) | (B) multiplayer AI | 「孤立したチャットボット」から「人間とエージェントが同じ情報・権限・通知・成果物・目標を共有するmultiplayerシステム」への転換を掲げる。2026年5月に$40M調達(Series B)。3,000超の組織が利用、30万超のエージェントが作成された実績。 | [SiliconANGLE](https://siliconangle.com/2026/05/18/multiplayer-ai-startup-dust-swipes-40m-funding-help-enterprises-move-beyond-isolated-ai-assistants/), [French Tech Journal](https://www.frenchtechjournal.com/dust-multiplayer-ai-enterprise-ai-agents/) |
| **Ano**(ano.chat) | (B) agent-first、直接競合候補 | **"team chat with Claude Code built in"**。「チャネルごとにClaude Codeエージェントが常駐し、コマンド実行・ファイル編集・PR作成・結果のインライン投稿まで行う」構成でSlackを直接置き換える設計。ローカルファースト同期、GitHub/Linear/Stripe/HubSpot/Notion/Jira/Figma等のCLI・MCP接続、EU自社データ拠点、全社無料(ユーザーは自分のClaude Codeアカウント持参)。YC出資有無は検索範囲では確認できず**未確認**。 | [ano.chat](https://ano.chat/), [ano.chat/slack-alternative](https://ano.chat/slack-alternative) |
| **Discord系AIボット**(Quickchat, AgentX, Poe等) | (A) 後付け型 | いずれもDiscordの既存Bot API上にAI機能を追加する形。ナレッジベース応答やモデルルーティングが中心で、エージェントがチャネルの一級参加者としてUIを生成する事例は確認できず。 | [Quickchat AI](https://quickchat.ai/post/best-ai-discord-bots) |
| **Linzumi**(再掲) | (B) agent-first、コーディング特化 | 前章参照。 | 前章 |

### 2.1 分類の総括【分析】

- **後付け型(A)の共通パターン**: 既存チャット(Slack/Teams/Discord)のメッセージ/Bot APIの上に、エージェントを"ゲスト"として召喚する設計。UIは既存のブロック/カードコンポーネントの範囲内に制約される。
- **agent-first型(B)の共通パターン**: エージェントが常駐し、チャネル自体の存在理由(コード実行の場、multiplayerな知識共有の場)がエージェントを前提に設計されている。ただし現状の(B)勢は「コーディングタスク特化」(Linzumi, Ano)か「エンタープライズナレッジ/権限共有特化」(Dust)のどちらかに寄っており、**「エージェントが応答としてチャネル内に汎用的な動的UI(ダッシュボード・フォーム・意思決定ツール)をその場生成する」を明確に主張しているプレイヤーは確認できなかった**。
- 特にAnoは「Slackを置き換え、エージェントを一級参加者にする」という構想の骨格が私たちに最も近い。ただしAnoは実行対象が「コマンド実行・ファイル編集・PR」に限定されており、動的UI生成の言及はサイト上に見当たらない(未確認)。

---

## 3. チャット内動的UI生成の先行事例

| 事例 | 概要 | 出典 |
|---|---|---|
| **Google A2UI(Agent-to-UI)プロトコル** | 2025年12月にv0.8 public preview、2026年に**v0.9として正式オープンソース化**(bidirectional化、Python SDK追加)。エージェントが宣言的JSONでUIコンポーネント(フォーム・チャート・マップ・ダッシュボード)を記述し、クライアントがWeb/モバイル/デスクトップにネイティブレンダリングする、フレームワーク非依存の標準仕様。狙いは「壁のようなテキスト応答」問題の解消。Opal、Gemini Enterprise、Flutter GenUI SDKで採用。公式サンプル"RizzCharts"はECダッシュボードで「売上内訳を見せて」→ドーナツチャート生成、「外れ値の店舗は?」→ピン付きマップ生成、という対話駆動UI生成を実演。 | [Google Developers Blog: A2UI v0.9](https://developers.googleblog.com/a2ui-v0-9-generative-ui/), [InfoQ](https://www.infoq.com/news/2026/07/google-a2ui-genui/), [chartgen.ai](https://chartgen.ai/resources/blog/from-chatbot-to-dashboard-a2ui) |
| **Slack Block Kitの限界と拡張** | 従来はメッセージ最大50ブロック/モーダル・Home最大100ブロックという静的レイアウト制約。2026年4月にCard/Alert/Carousel/Data Table等のエージェント向けコンポーネントを追加し「動的タスク指向UI」に近づけたが、**あくまで事前定義されたコンポーネントの組み合わせ**であり、A2UIのような汎用宣言的UI生成とは設計思想が異なる(Static Generative UIに近い)。 | [Slack Dev Blog](https://slack.dev/build-richer-agent-experiences-with-block-kit/) |
| **OpenAI Apps SDK(ChatGPT内アプリ)** | 2025年10月6日発表。MCPベースの標準でChatGPT会話内に対話型アプリ(Spotify, Zillow, Canva, Expedia等)を埋め込み。2025年12月18日にApp Directory追加。**自然言語の応答としてUIが生成されるのではなく、事前に開発・審査されたアプリがチャット内に召喚される**モデルで、エージェントが即興でUIを組み立てる方式ではない。 | [OpenAI公式](https://openai.com/index/introducing-apps-in-chatgpt/) |
| **Claude Artifacts / Live Artifacts** | 2026年4月に"Live Artifacts"導入。ダッシュボード/トラッカーが再訪時に最新データへ自動更新、セッション間の永続ストレージ、Artifact自身からClaude APIを直接呼べる(=Artifact内で推論が回る小さなアプリ化)。MCP経由でGoogle Calendar/Gmail/Slack等と接続可能。ただし**Artifactsは1:1のClaude.ai会話のサイドパネルという設計**であり、マルチプレイヤーなチームチャネル内で複数人が同時にレビュー・介入する体験としては設計されていない。 | [VentureBeat](https://venturebeat.com/data/anthropics-claude-code-artifacts-update-brings-live-shared-dashboards-and-interactive-workspaces-to-enterprises), [buildfastwithai](https://www.buildfastwithai.com/ai-tools/claude-artifacts) |
| **Microsoft Copilot Studio「Copilot Chat内リッチapp体験」** | 前章参照。エージェントがCopilot Chat内にレコード確認・承認・アセット作成のためのインタラクティブ画面を直接表示。企業向けワークフロー(承認・レコード編集)に用途が寄っている。 | [Microsoft Copilot Blog](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/) |

### 3.1 「チャネル内でエージェントがダッシュボード/UIをその場生成する」に最も近い先行事例と残る余白【分析】

- **技術的に最も近い**のはGoogle A2UI(宣言的・汎用的・エージェント駆動UI生成という設計思想が完全に一致)。ただしA2UIは**プロトコル/インフラ層**であり、それ自体は「マルチプレイヤーのチームチャットプロダクト」ではない。RizzCharts等のデモも1人のユーザーとエージェントの対話が前提で、**チームメンバー複数人が同じチャネルで同じ生成UIを見ながら共同編集・承認するマルチプレイヤー性**は実証されていない。
- **プロダクトとして最も近い**のはMicrosoft Copilot Studio(Copilot Chat内リッチapp)だが、企業ワークフロー(承認・レコード編集)向けの定型UIに寄っており、汎用的・即興的な生成(「今すぐこのデータをグラフにして」に応じてゼロから組み立てる)という主張は弱い。
- **残る余白**: (1) A2UI的な汎用生成UIを (2) Slack/Teams的なマルチプレイヤー・チャネル構造の中で (3) エージェントが一級参加者として、かつ (4) 生成されたUI自体が会話の履歴・ナレッジとして永続化される――この4点をすべて満たすプロダクトは調査範囲内で見当たらなかった。特に「複数人が同時に見ている生成UI上でリアルタイムに共同編集・承認する」体験は、どの先行事例にも明示的な言及がない。

---

## 4. 総括

### 4.1 新規性が立つポイント(3行)

1. **汎用generative UIをマルチプレイヤー・チャネル構造の中に統合する**組み合わせは、A2UI(汎用UI生成だが1:1・インフラ層止まり)ともSlack/Teams(マルチプレイヤーだが定型ブロックUI止まり)とも異なる交点であり、既存プレイヤーが同時に満たしていない。
2. **エージェントをチャネルの「1メンバー」として扱い、その応答が即座にアプリ的UIとして永続化・共有される**設計は、Linzumi/Anoの「コーディングタスク実行者」やAgentforce/Claude Tagの「質問応答役」とは異なる役割規定であり、対象業務をエンジニアリングに限定しない全社的な「知識の起点」という主張につながる。
3. 生成UI自体が会話ログとして蓄積され、後から検索・再利用できる形で「チャットが会社のナレッジベースそのものになる」という主張は、Dust(multiplayer AIだが生成UIではなくテキスト/エージェント権限共有が主眼)ともLinzumi(決定ログはコーディング文脈限定)とも異なる射程を持つ。

### 4.2 ピッチで突っ込まれそうな「それはXと何が違うの?」トップ3と返し方

1. **「それはLinzumiと何が違うの?(審査員の会社では?)」**
   返し: 「Linzumiはコーディングエージェントのfleetを統制する開発基盤で、対象はエンジニアリングチームのdiff/テスト/PRです。私たちは全社員(非エンジニアを含む)が使う組織のインターフェースそのものを再発明していて、エージェントの応答はコード変更に限らずダッシュボードや意思決定ツールとして即座に生成されます。Linzumiの延長線ではなく、隣接するが別レイヤーの課題を狙っています。」

2. **「それはSlack Agentforce / Claude Tag / Copilot Studioと何が違うの?(大手がもう出している)」**
   返し: 「大手勢は既存チャットにエージェントを"ゲスト"として後付けする設計(@mentionで呼ぶ、固定ブロックUIで返す)です。私たちはエージェントをアーキテクチャの前提=一級参加者として設計し直しているので、応答が固定コンポーネントの組み合わせではなく、その場のタスクに合わせて自由に生成されるUIになります。既存製品への「プラグイン」ではなく、チャット自体の設計思想が違います。」

3. **「それはGoogle A2UIやClaude Artifactsで十分実現できるのでは?」**
   返し: 「A2UIは優れた生成UIプロトコルですが、あくまで1人のユーザーとエージェントの対話を前提にしたインフラ層で、マルチプレイヤーのチームチャットではありません。Claude Artifactsも1:1会話のサイドパネルです。私たちはそれらの技術思想を、チームが同時に見て・共同編集し・意思決定する共有チャネルという文脈に持ち込む統合レイヤーを作っています。」

### 4.3 特筆すべき未確認事項

- Ano.chatのYC出資有無、および動的UI生成機能の有無は公開情報から確認できず(未確認)。
- Linzumiが今後コーディング以外の業務領域へ展開する計画があるかは非公開(未確認)。
- 「Convictional」(YC W2019、"company brain that replaces Slack")はYC企業ディレクトリの説明文にのみ言及があり、現在の実態(AI agent対応の有無)は確認できていない(未確認)。

---

## 出典一覧

- [Y Combinator: Linzumi](https://www.ycombinator.com/companies/linzumi)
- [Y Combinator on X (ローンチ告知)](https://x.com/ycombinator/status/2069465556433211583)
- [Digg: Sean Grove / Linzumi報道まとめ](https://digg.com/tech/bnuy2maq)
- [linzumi.com](https://linzumi.com/)
- [Slack: Agentforce 2.0 in Slack](https://slack.com/blog/news/limitless-workforce-with-agentforce-in-slack)
- [Slack AI Agents](https://slack.com/ai-agents)
- [Slack Dev Blog: Block Kitエージェント向け新コンポーネント](https://slack.dev/build-richer-agent-experiences-with-block-kit/)
- [Anthropic: Claude Tag発表](https://www.anthropic.com/news/introducing-claude-tag)
- [TechCrunch: Claude Tag報道](https://techcrunch.com/2026/06/23/anthropics-claude-tag-is-learning-your-company-one-slack-message-at-a-time/)
- [VentureBeat: Claude Tag報道](https://venturebeat.com/technology/anthropic-launches-claude-tag-replacing-its-slack-app-with-a-persistent-ai-teammate-that-learns-monitors-and-works-autonomously)
- [Microsoft Copilot Blog: マルチエージェントオーケストレーション](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/)
- [SiliconANGLE: Dust $40M調達](https://siliconangle.com/2026/05/18/multiplayer-ai-startup-dust-swipes-40m-funding-help-enterprises-move-beyond-isolated-ai-assistants/)
- [French Tech Journal: Dust multiplayer AI](https://www.frenchtechjournal.com/dust-multiplayer-ai-enterprise-ai-agents/)
- [ano.chat](https://ano.chat/)
- [ano.chat/slack-alternative](https://ano.chat/slack-alternative)
- [Quickchat AI: Discord AI Bot一覧](https://quickchat.ai/post/best-ai-discord-bots)
- [Google Developers Blog: A2UI v0.9](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)
- [InfoQ: Google A2UI GenUI](https://www.infoq.com/news/2026/07/google-a2ui-genui/)
- [chartgen.ai: A2UI RizzCharts事例](https://chartgen.ai/resources/blog/from-chatbot-to-dashboard-a2ui)
- [OpenAI: Introducing apps in ChatGPT](https://openai.com/index/introducing-apps-in-chatgpt/)
- [VentureBeat: Claude Live Artifacts](https://venturebeat.com/data/anthropics-claude-code-artifacts-update-brings-live-shared-dashboards-and-interactive-workspaces-to-enterprises)
- [buildfastwithai: Claude Artifacts 2026レビュー](https://www.buildfastwithai.com/ai-tools/claude-artifacts)
