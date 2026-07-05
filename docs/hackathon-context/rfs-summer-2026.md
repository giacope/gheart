# YC RFS Summer 2026 テーマ分析 — c0mpiled ハッカソン用

作成日: 2026-07-05 / 対象: 5時間開発・英語提出・90秒デモ動画審査のハッカソン(詳細は `docs/battle-plan.md`)

> **凡例**: 「原文」= RFS ページからの verbatim 引用(事実)。「文脈」= 検証済みの外部ソース(事実、出典付き)。「分析」= 本ドキュメントの推測・戦略判断(事実ではない)。

RFS 本体: https://www.ycombinator.com/rfs/ (Summer 2026 は全15テーマ。本ハッカソンはうち3つから選択)

---

## 1. Company Brain — Tom Blomfield

- アンカー: https://www.ycombinator.com/rfs/#company-brain
- パートナー: Tom Blomfield(Monzo / GoCardless 共同創業者、YC General Partner)

### YC が何を求めているか(原文ベース)

原文の骨子(出典: https://www.ycombinator.com/rfs/):

> "The biggest blocker to AI automation of companies is no longer the models... Now the blocker is the domain knowledge."
>
> "We need Garry's G-Brain, but for every business in the world. A system that pulls knowledge out of all these fragmented sources, structures it, keeps it current, and turns it into an executable skills file for AI."
>
> "This isn't a company-wide search or a chatbot over documents. It's a living map of how a company works: how refunds get handled, how pricing exceptions are decided or how engineers respond to incidents."
>
> "The company brain becomes the missing layer between raw company data and reliable AI automation. I think every company in the world is going to need one."

要点:

- **ボトルネックはモデルではなくドメイン知識**。知識は人の頭・古いメール・Slack・サポートチケット・DB に散在し、人間は「なんとなく覚えている」から会社が回るが、AI エージェントはそれができない。
- 求めるのは **検索でもチャットボットでもない**。断片知識を抽出→構造化→最新に保ち→**AI が実行できる skills file** に変換するシステム。「会社がどう動くかの生きた地図」。
- 例示: 返金処理の手順、価格例外の決め方、エンジニアのインシデント対応。
- 明示的に **Garry Tan の G-Brain を「全企業向けに」一般化せよ** と書かれている。

### なぜ今か・パートナーの問題意識(文脈)

- Blomfield 本人の X ポスト: 「社員の90%を、会社の動き方を何も知らない天才チームに置き換えたら大混乱になる。それが今の AI。足りないのは人の頭の中のドメイン知識を構造化されたコンテキストとしてモデルに与えること」(https://x.com/t_blom/status/2060806313001746792 — 検索スニペット経由の再構成で全文未検証)。続き: "Once you have this, AI will seem magical"(https://x.com/t_blom/status/2045966024676356400)。
- Blomfield の YC バッチトーク「How to Build a Self-Improving Company with AI」(2026年5月頃、https://www.ycombinator.com/library/Qf-how-to-build-a-self-improving-company-with-ai)が概念的な対。会社を「再帰的な自己改善 AI ループ」として再設計する話で、Company Brain はそのループが走る知識基盤にあたる。"burn tokens, not headcount" というフレーズも(二次ソース経由の要約であり verbatim ではない)。
- 先行事例(文脈、出典: https://colrows.com/blogs/yc-company-brain-rfs/ , https://www.alexlockey.com/writing/the-company-brain-four-builders-one-architecture/): Garry Tan の **GBrain**(OSS、公開2ヶ月で GitHub 23.6k stars)、Hyper、Ramp 社内の "Glass"(350+ skills)、Karpathy 由来の「LLM が raw ソースを markdown wiki に整理する」ワークフロー。共通アーキテクチャは「構造化ストレージ → ルーティング層 → skills → write-back 規律」。
- 市場文脈: Glean が $4.6B 評価で調達(エンタープライズ検索)。ただし RFS は「検索の先」を要求している(https://ycinsight.com/ideas/company-brain)。
- 既存ツールの失敗モード(https://colrows.com/blogs/yc-company-brain-rfs/): ①メトリクスの計算方法が AI と CFO でズレる「metric hallucination」②生スキーマ再処理によるトークンコスト爆発 ③監査可能性の欠如。

**分析**: 本ハッカソンは GStack/GBrain が指定ツールで、Garry Tan 本人が来場する。「G-Brain を全企業へ」という原文と大会設計が直結しており、主催側の本命テーマである可能性が高い。裏返すと **参加チームが最も集中し、かつ「ドキュメント RAG チャットボット」という原文が明示的に禁じた形に落ちるチームが続出する** と予想される。差別化の軸は「実行可能性(skills file をエージェントが実際に実行する)」と「鮮度維持(living map)」。

### 勝ち筋(5時間・90秒デモ前提)【分析】

1. **Before/After 実行デモ「Chaos → Brain → Execution」**: 合成した企業データ(Slack ログ・チケット・メール)を投入 → skills file(GBrain 互換 markdown)を自動生成 → 同じタスク(例: 返金依頼への対応)を「brain なしエージェント(失敗・でたらめ)」と「brain ありエージェント(正しく実行)」で並べて見せる。RFS の例示(返金)をそのまま使い、90秒で対比が完結する。GBrain 互換にすれば Garry Tan / 審査員に一発で通じる。
2. **Living Map / ドリフト検知**: Slack で意思決定が変わる(「返金期限を30日→60日に変更」)のを検知して skills file を自動更新し、矛盾する古い記述をフラグする。原文の "keeps it current" と、既存ツール批判(監査可能性)に正面から答える。エンタープライズ向け investable ストーリーが作りやすい。
3. **Tacit Knowledge Interviewer(暗黙知の吸い上げ)**: 「知識の一部は人の頭の中にある」という原文の指摘に対し、音声で社員に短いインタビューを行い、回答を構造化 skills に変換するマルチモーダルエージェント。会話→構造化のリアルタイム描画は動画映えし、Arata のマルチモーダル LLM 経験が直接効く。他チームが文書取り込みに集中する中で「頭の中」を取りに行く差別化。

---

## 2. Dynamic Software Interfaces — Ankit Gupta

- アンカー: https://www.ycombinator.com/rfs/#dynamic-software-interfaces
- パートナー: Ankit Gupta(Reverie Labs 共同創業者〔YC W18、ML 創薬、2024年 Ginkgo Bioworks が買収〕、YC General Partner)。※イベント告知等で経歴が混同されることがあるが、UI/UX 出身ではなく ML 出身(出典: https://www.ycombinator.com/people/ankit-gupta)。

### YC が何を求めているか(原文ベース)

原文の骨子(出典: https://www.ycombinator.com/rfs/):

> "most software has a one-sized-fits-all feel rather than being hypercustomized to a user. As an example: the way I use an email is very different from how most college students use email, yet all email clients look basically the same."
>
> "We think that coding agents have now gotten good enough to allow users to become their own forward deployed engineers and more radically customize the software they consume."
>
> "perhaps my email client looks more like a task list, and a students' looks more like an events calendar. But these two interfaces likely share some underlying primitives and design decisions that a software team can build and ship."
>
> "To enable this future, we will have to rethink the whole stack of software delivery. How will a developer make software that can be accessed by the user's coding agents? Do they have to deliver source code rather than packaged binaries? Can they only modify front-end visual elements, or are there ways for them to modify middleware on the fly...?"

要点:

- 従来の「パーソナライズ」(Netflix 型)はレイアウト同一・画像差し替えにすぎない。ソフトウェアは one-size-fits-all のまま。
- 例外はエンタープライズの **forward deployed engineer(FDE)** による顧客ごとのカスタマイズ。**コーディングエージェントの進化により、全ユーザーが「自分自身の FDE」になれる** というのが中心テーゼ。
- ベンダーは最終 UI ではなく **共有プリミティブ** を出荷し、ユーザー(のエージェント)が最終インターフェースを大改造する未来。
- 未解決の問い(=スタートアップの余白): ①ユーザーのエージェントがアクセスできる配布形態(ソースコード配布?)②改変はフロントエンドだけか、**ミドルウェアの動的改変** まで踏み込めるか ③ソフトウェア配布スタック全体の再考。

### なぜ今か・パートナーの問題意識(文脈)

- Gupta 本人によるテーマの長文の敷衍(エッセイ・ポッドキャスト)は見つからず、一次ソースは RFS 本文がほぼすべて。関連する X ポストとして、エージェント専用メールクライアント AgentMail を称賛するツイートあり(https://x.com/GuptaAnkitV/status/1952779315692654992)——「メールというインターフェースの再発明」への関心は RFS のメール例と一貫。
- 業界文脈: Vercel v0(generative UI、2026年にフルスタックサンドボックス化)、Retool AI AppGen(2025年10月、テキストからアプリ全体生成)が先行(https://vercel.com/blog/announcing-v0-generative-ui)。InfoWorld の generative UI 三分類(Static=既製コンポーネント選択 / Declarative=A2UI 等の構造化 UI スペック / Open-ended=任意 HTML 生成)が整理として有用(https://www.openfor.co/post/yc-summer-2026-requests-for-startups-an-independent-reading)。
- 学術文脈: 「malleable software」は 2026 年の CHI 系 arXiv 論文群が扱う現役の研究テーマ(例: "Software as Content: Dynamic Applications as the Human-Agent Interaction Layer" https://arxiv.org/pdf/2603.21334 、"Gradual Generation of User Interfaces as a Design Method for Malleable Software" https://arxiv.org/pdf/2601.17975)。
- 批判的視点(文脈): generative UI は「ブランド一貫性・セキュリティサンドボックス・ネイティブ対応が未解決」で実務的には未成熟、という指摘あり(https://www.openfor.co/post/yc-summer-2026-requests-for-startups-an-independent-reading)。**分析**: 5時間ハッカソンではこの「未成熟さ」はむしろ好機——完成度ではなく未来のビジョン提示で勝負できる。

### 勝ち筋(5時間・90秒デモ前提)【分析】

1. **「1つのバックエンド、N個のインターフェース」**: 同一のメール(またはタスク)データストアに対し、ユーザーが自然言語で頼むと自分専用 UI をエージェントがその場で生成——営業パーソンにはタスクリスト型、学生にはカレンダー型、と **RFS の例示をそのまま実演** する。画面がライブでモーフィングする映像は 90 秒動画で最も映える部類。UX/UI Award の本命形。
2. **プリミティブ + エージェント改変プロトコル**: 「ベンダーが shared primitives を出荷し、ユーザーの coding agent が安全に UI を書き換える」ための小さな SDK/プロトコルを定義してデモ(コンポーネント宣言 + 権限境界 + エージェント用マニフェスト)。Gupta の未解決の問いに直接答える設計提案で、「radical thinker」を求める原文に刺さる。investable 度は 1 より高いがデモの派手さで劣る。
3. **既存 SaaS の malleable 化オーバーレイ**: ブラウザ拡張 or プロキシで、実在の SaaS(CRM・カレンダー等)の UI を席(ユーザー)ごとに自然言語で再構成する。「今日から使える」現実性と市場の広さを示せる(参考アイデア出典: https://superframeworks.com/articles/yc-summer-2026-rfs-hard-tech-pivot)。ただし他人のプロダクトの上に載るデモは審査員の受け止めが分かれるリスクあり。

---

## 3. Software for Agents — Aaron Epstein

- アンカー: https://www.ycombinator.com/rfs/#software-for-agents
- パートナー: Aaron Epstein(Creative Market 共同創業者・CEO〔YC W10、Autodesk へ売却〕、YC General Partner。8,000 件以上の YC 応募審査、Retool/OpenSea/Deel 等をアドバイス。出典: https://www.ycombinator.com/people/aaron-epstein)。※イベント資料等で経歴が混同されることがあるが、デザイン資産マーケットプレイス出身。

### YC が何を求めているか(原文ベース)

原文の骨子(出典: https://www.ycombinator.com/rfs/):

> "The next trillion users on the internet won't be people, they'll be AI agents. And now is the time to 'Make Something Agents Want'."
>
> "Agents are already browsing the web, doing research, making purchases, and managing legacy CRMs – but they're doing it on top of software that was designed for humans clicking buttons in a browser, which is slow, inconsistent, and brittle."
>
> "Instead of visual interfaces like forms, buttons, and dashboards, they need machine-readable interfaces like APIs, MCPs, and CLIs. Agents also need thorough documentation, to enable them to discover, sign up for, and instantly start using new tools programmatically, without needing a human in the loop."
>
> "the new agent-first software won't come from incumbents bolting on agent support, it'll come from startups that build explicitly for agents as first-class citizens. While everyone else is building agents, the biggest opportunity might be building the software those agents depend on."

要点:

- 「次の1兆ユーザーは人間ではなくエージェント」。YC の標語 "Make Something People Want" を **"Make Something Agents Want"** に読み替えた宣言。
- エージェントは既に実務(閲覧・調査・購買・CRM 操作)をしているが、人間向け UI の上で動いており「遅く・不安定で・脆い」。
- 必要なのは API / **MCP** / CLI + **エージェントが人間の介在なしに発見→サインアップ→即利用できる徹底したドキュメント**。
- 「全ソフトウェアカテゴリの agent-first 再構築」は既存企業のボルトオンではなくスタートアップから生まれる。「皆がエージェントを作る中、最大の機会はエージェントが依存するソフトウェアを作ることかもしれない」。

### なぜ今か・パートナーの問題意識(文脈)

- YC 公式 X が Epstein 名義でこのテーマを増幅(https://x.com/ycombinator/status/2048834309994565832)。Epstein 個人の長文エッセイは見つからず、敷衍は YC Lightcone ポッドキャストの "Make Something Agents Want" 回(グループ討議)と二次ソース経由: **ドキュメント品質が新しい GTM** になる——Resend はドキュメントをエージェント向けに最適化した結果、ChatGPT/エージェント経由が上位のコンバージョンチャネルになったとされる(二次ソース: https://blog.juchunko.com/en/yc-make-something-agents-want/ 、未検証の伝聞を含む)。"Agents hate using websites"(Harj Taggar、同上・伝聞)。
- プロトコルの成熟(いずれも事実、出典付き): **MCP** はコミュニティ製サーバー 5,000+ 、Linux Foundation 傘下の Agentic AI Foundation(2025年12月発足、AWS/Anthropic/Google/Microsoft/OpenAI 等)でガバナンス標準化(https://www.openfor.co/post/yc-summer-2026-requests-for-startups-an-independent-reading)。**A2A**(Google、2025年4月)は署名付き Agent Card による相互認証で 150+ 組織が本番利用(https://atlan.com/know/google-a2a-protocol/)。**エージェント決済**は Stripe の x402(HTTP 402 による機械可読な支払いチャレンジ)や Machine Payments Protocol が整備され、x402 Foundation に Visa/Mastercard/Google/AWS 等が参加(https://docs.stripe.com/payments/machine/x402 、https://www.linuxfoundation.org/press/linux-foundation-is-launching-the-x402-foundation-and-welcoming-the-contribution-of-the-x402-protocol)。
- 先行スタートアップ(文脈): AgentMail(エージェント専用メール)、Browser Use、Mem0(エージェントメモリ)等が「並行エージェント経済」の実例として紹介されている(https://www.forbes.com/sites/dariashunina/2026/03/11/make-something-agents-want---humans-are-no-longer-the-customer/)。
- 批判的視点(文脈): 「agent 向けソフトは大半がインフラでありスタートアップとして収益化が難しい。レール(Stripe/Visa/Salesforce)を握る既存企業が構造的に有利」という指摘(https://www.openfor.co/post/yc-summer-2026-requests-for-startups-an-independent-reading)。**分析**: ピッチでは「インフラ全般」ではなく特定カテゴリの agent-first 再構築(垂直)に絞ると、この批判をかわしつつ investable に見せられる。

### 勝ち筋(5時間・90秒デモ前提)【分析】

1. **Agent-Ready 変換レイヤー「どんなサービスも90秒でエージェント対応に」**: 既存の(人間向け)Web サービス/ドキュメントを入力すると、MCP サーバー + エージェント最適化ドキュメント(llms.txt 的)+ サインアップ用マシンインターフェースを自動生成するツール。デモは「Before: エージェントがブラウザをクリックして迷走・失敗 / After: 生成された MCP 経由で即完了」の対比動画。原文の "slow, inconsistent, and brittle" を映像で証明でき、審査員 Sean Grove(AI coding agent devtools)にも刺さる構図。
2. **Human-out-of-the-loop サインアップ & 決済デモ**: エージェントが自律的にサービスを「発見→登録→API キー取得→x402 風の少額決済→利用開始」まで完走するエンドツーエンドを実装。原文の "discover, sign up for, and instantly start using new tools programmatically, without needing a human in the loop" の完全な実演で、決済まで通せば Biggest Engineering Lift の有力候補。実装量が最も重い切り口。
3. **エージェント向けアナリティクス/オブザーバビリティ「Google Analytics for agent traffic」**: 自社サービスに来るトラフィックのうちエージェント由来を識別し、どこでエージェントが失敗・離脱するかを可視化、ドキュメント改善を提案する SaaS。「ドキュメントが GTM になる」という Lightcone の論点を製品化したもので、investable なリカーリング収益ストーリーが最も描きやすい。デモは合成トラフィックのダッシュボードで成立する。

---

## 4. チーム適性【分析】

| メンバー | 強み | Company Brain | Dynamic Interfaces | Software for Agents |
|---|---|---|---|---|
| 自分(オーケストレーション) | Claude Code 高度運用、skills/メモリ設計を日常実践、フルオート開発 | ◎ skills file・メモリ設計はまさに日々の実務。GBrain 互換設計を最速で出せる | ○ エージェントに UI を生成・改変させるパイプラインの組み立て役 | ◎ MCP・エージェントツール連携は主戦場 |
| Arata(HCI/XR/マルチモーダル、Sakana AI) | CHI/UIST 級の HCI 研究、React、マルチモーダル LLM、C2 システム開発 | ○ 音声インタビュー→構造化などマルチモーダル取り込みで差別化可能 | ◎ **malleable software は本人の研究領域そのもの**。学術的裏付け付きでピッチでき、UI の質で他チームを圧倒できる | △ インフラ寄りテーマでは強みが出にくい(エージェント UX の可視化なら活きる) |
| Giacomo(インフラ・ジェネラリスト) | Go/K8s/Rails、ex-Apple Maps/GKE/Twitch、Head of Product Engineering | ◎ インジェスト・パイプラインと監査可能なストレージ設計。エンタープライズ文脈の説得力 | ○ プリミティブ/SDK の設計・デプロイ基盤 | ◎ API/プロトコル/決済のバックエンドは適性ど真ん中 |

- **Company Brain**: 3人全員が◎〜○で総合力は最高。ただしテーマ自体の競争率も最高と予想。
- **Dynamic Software Interfaces**: Arata の研究者としての正統性が **他チームには複製不可能な差別化**。ピッチで「この領域の CHI/UIST 研究者が創業チームにいる」と言えるのは investable 観点でも強い。
- **Software for Agents**: 自分+Giacomo の適性は高いが、Arata の強みが遊びやすい。90秒動画で「地味な API デモ」に見えるリスク管理が必要。

## 5. 審査観点(Honorable Mentions への刺さり方)【分析】

- **The Investable Startup Award**: 市場サイズの主張がしやすいのは Company Brain(原文自ら「世界中の全企業が必要とする」と断言、Glean $4.6B の比較対象あり)と Software for Agents の垂直特化(「次の1兆ユーザー」ナラティブ)。ピッチに「per-seat / per-agent の課金モデル」を一枚入れると効く。
- **The UX/UI Award**: Dynamic Software Interfaces がほぼ本命。テーマの性質上、UI そのものがプロダクト。ライブモーフィングする UI + Arata の HCI 的裏付けで最有力。Company Brain でも「知識の生きた地図」の可視化(グラフ・鮮度表示)で狙える。
- **The Biggest Engineering Lift**: Software for Agents の「発見→登録→決済→利用」エンドツーエンド(勝ち筋2)や、Dynamic Interfaces の「ミドルウェア動的改変」(Gupta の最難問への回答)のような、5時間でよくそこまで通したと言わせる縦貫デモ。Claude Code フルオート並列開発というチームの開発スタイル自体も、このアワードの文脈で語れる。

なお審査員的な補正(分析): Sean Grove(Linzumi = チームチャットから AI coding agent を統制・検証する devtools、元 OpenAI Model Spec)はエージェントの統制・検証・ドキュメント品質の話に反応しやすく、Henry Ndubuaku(Cactus = オンデバイス低遅延推論)はレイテンシ・エッジ・実装の深さに反応しやすいと推測される。どのテーマでも「エージェントの動作をどう検証・信頼するか」に一言触れる価値がある。

---

## 6. 総括

- **Company Brain**: 「散在する社内知識を、AI が実行できる skills file に変換する missing layer」。GBrain 直系でイベント本命だが最激戦区。検索/チャットボットに落ちたら負け。
- **Dynamic Software Interfaces**: 「コーディングエージェントで全ユーザーが自分の FDE になり、UI を根本から作り替える」。ビジョン勝負・デモ映え最強のテーマ。
- **Software for Agents**: 「次の1兆ユーザー=エージェントのために、機械可読なソフトウェアを作り直す」。プロトコル成熟(MCP/A2A/x402)で今が旬。デモの絵作りが課題。

**推奨順位(分析)**: ①Dynamic Software Interfaces — Arata の研究領域そのもので差別化が構造的、90秒動画の映えと UX/UI Award の本命性、激戦区回避。②Company Brain — チーム総合力と GBrain/Garry Tan シナジーは最高だが、競争率と「RAG チャットボット化」の同質化リスクを織り込む(選ぶなら「実行」と「鮮度」で尖らせる)。③Software for Agents — 適性は高いが Arata が遊び、動画映えの設計難度が最も高い。当日のチームビルディング(4人目の合流)とテーマ別の混雑状況を見て最終判断すること。
