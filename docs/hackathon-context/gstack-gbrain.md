# GStack / GBrain セットアップ&活用ガイド(YC RFS ハッカソン 2026-07-05)

出典: 本ガイドは以下のソースを WebFetch/WebSearch で取得して作成した(2026-07-05 時点)。
- https://github.com/garrytan/gstack (README, docs/skills.md, USING_GBRAIN_WITH_GSTACK.md, setup スクリプト)
- https://github.com/garrytan/gbrain (README トップページ概要)
- YC 記事 "Inside Garry Tan's AI Coding Setup" (**本文を直接取得できず**。WebSearch のスニペット経由の二次情報のみ。下記で明記)
- https://vectorize.io/articles/what-is-gbrain
- https://www.marktechpost.com/2026/05/22/... (GBrain セットアップの実機チュートリアル記事)
- https://techcrunch.com/2026/03/17/... および Hacker News (id=47418576) — 批判・注意点の裏取り用

---

## 1. GStack とは何か

**GStack** は YC 社長兼 CEO の Garry Tan が公開した OSS ツールキットで、Claude Code(および Codex / Cursor / Factory / OpenCode など計10種のAIエージェント)を「一人で動かせる仮想エンジニアリングチーム」に変える。実体は **23個の専門ロール(スラッシュコマンド)+8個のパワーツール**で、すべて Markdown ファイルとして実装されている。独自ランタイムは無く、Claude Code の Skills 機構の上に乗るだけ。MIT ライセンス、無料。

### 仕組み・思想

- 生の Claude Code は「それらしいが実運用で壊れるコード」を書きがちという問題意識に対し、**役割(ロール)・プロセス・レビューという人間の組織構造をそのままプロンプト化**することでモデルの脱線を抑える、という設計思想。
- ワークフローは **Think → Plan → Build → Review → Test → Ship → Reflect** の7段階サイクルに沿ってスキルが並んでおり、各スキルの出力が次のスキルの入力になるよう連鎖する。
- Tan 自身の主張する生産性向上("2026年のペースは2013年比で約810倍"、直近60日で本番サービス3つ・機能40以上を出荷)は Hacker News / TechCrunch で強い批判も受けている(詳細は5章)。

### ファイル構成(概要)

```
~/.claude/skills/gstack/         # インストール先(Claude Code の場合)
├── setup                        # インストール/リンク用シェルスクリプト
├── docs/
│   └── skills.md                 # 全スキルのリファレンス
├── USING_GBRAIN_WITH_GSTACK.md   # GBrain 連携ガイド
├── bin/
│   ├── gstack-team-init
│   ├── gstack-uninstall
│   └── ...
└── (60以上のスキル/ブラウザツール/ベンチマーク用ディレクトリ、TypeScript ~79%)
```

インストールすると `~/.gstack/projects` にグローバル状態が作られ、プロジェクト側には `.claude/`(スキルへのシンボリックリンク等)と `CLAUDE.md` への追記が行われる。

### 主なスキル(ワークフロー順)

**THINK(発見・企画)**
- `/office-hours` — コーディング前に6つの詰問質問でプロダクトの前提を問い直す
- `/plan-ceo-review` — スコープの再定義(拡張/選択的拡張/現状維持/縮小の4モード)
- `/plan-eng-review` — アーキテクチャ・データフロー・エッジケース・テスト方針を固める
- `/plan-design-review` — デザインを0〜10で採点し「10とは何か」を明示
- `/autoplan` — CEO→デザイン→エンジニアリングレビューを自動連鎖

**BUILD(設計・実装)**
- `/design-consultation` — デザインシステムをゼロから構築
- `/design-shotgun` — UI案を複数生成し比較ボードで選定
- `/design-html` — 承認済みモックアップから本番相当の HTML/CSS を生成
- `/scrape` / `/skillify` — Web からのデータ取得を試作→再利用可能なスキルへ codify

**REVIEW(品質保証)**
- `/review` — 「CIは通るが本番で壊れる」バグを狙う辛口コードレビュー、自動修正付き
- `/investigate` — 「調査なしに修正しない」を鉄則にした根本原因調査
- `/design-review` — 本番相当サイトの80項目ビジュアル監査+修正+前後スクショ
- `/cso` — OWASP Top10 + STRIDE のセキュリティ監査
- `/codex` — OpenAI Codex CLI による独立したセカンドオピニオン(合否ゲート/敵対的検証/相談の3モード)

**TEST(検証)**
- `/browse` — 実 Chromium ブラウザでの実クリック・実スクショ(~100ms/コマンド)
- `/qa` — ブラウザ実操作でバグを見つけて即修正し、回帰テストも自動生成
- `/qa-only` — 修正せずレポートのみ
- `/benchmark` / `/canary` — パフォーマンス計測、デプロイ後の監視ループ

**SHIP(リリース)**
- `/ship` — main 同期→テスト→カバレッジ監査→push→PR作成
- `/land-and-deploy` — PRマージ〜デプロイ〜本番ヘルスチェックまで一気通貫
- `/document-release` / `/document-generate` — 出荷内容に合わせてドキュメントを自動更新/生成(Diataxis フレームワーク)

**REFLECT(振り返り)**
- `/retro` — チーム単位の週次振り返り
- `/learn` — セッションを跨ぐ学習内容(プロジェクト固有の知見)の管理
- `/context-save` / `/context-restore` — 作業コンテキストの保存/復元(セッションを跨いだ再開に有効)

**安全装置・ユーティリティ**
- `/careful`(破壊的コマンド警告)、`/freeze`(編集範囲を1ディレクトリに制限)、`/guard`(両方の組み合わせ)、`/unfreeze`
- `/health` — 型チェック・lint・テスト・デッドコード検出を統合した0〜10のコード品質スコア
- `/pair-agent` — 複数エージェント(OpenClaw/Codex/Cursor/Hermes)を同一ブラウザでペアリング
- `/setup-gbrain` / `/sync-gbrain` — GBrain 連携(次章参照)
- `/make-pdf`、`/diagram` — Markdown→PDF、英語記述→Mermaid/Excalidraw/SVG 図生成
- iOS 系: `/ios-qa`、`/ios-fix`、`/ios-design-review` など実機 iPhone を使った QA/修正ループ

### 典型ワークフロー例(公式README記載のサンプル)

```
/office-hours          → アイデアを話す。前提を問い直され、実装方針候補と工数見積りが出る
/plan-ceo-review        → スコープ再定義、隠れた要件の洗い出し
/plan-eng-review        → アーキテクチャ・図・エッジケースを確定
(実装が走る。目安: 2,400行を約8分)
/review                 → 自動修正+完成度ギャップの指摘
/qa https://staging.myapp.com  → 実ブラウザでフローをテストし、バグを直す
/ship                   → テスト実行→PR作成
```

---

## 2. GBrain とは何か

**GBrain** は Garry Tan が同じく OSS で公開した「AIエージェント用の永続記憶(brain)レイヤー」。公式README のキャッチコピーは **"Search gives you raw pages. GBrain gives you the answer."** — 検索エンジンが生のページを返すのに対し、GBrain は根拠付き(citation付き)の統合済みの答えを返す、という位置づけ。GStack 単体は「その場のセッション」を強くするツールであるのに対し、GBrain は「セッションを跨いだ記憶」を担当する補完関係にある。

### 仕組み(3層アーキテクチャ)

1. **Brain リポジトリ(Git管理の Markdown)** — 人物・企業・概念などトピック別に整理された Markdown が正本(source of truth)。各ページは「要約(compiled truth)+ 日付付きタイムライン」というパターンで書かれる。
2. **検索/取得層** — 2つのエンジンから選択:
   - **PGLite**(WASM版Postgres) — 個人利用・5万ページ程度まで、設定ゼロで動く
   - **Postgres + pgvector** — 共有・大規模・複数マシン向け
   ベクトル埋め込み + BM25 キーワード一致 + グラフ信号のハイブリッド検索(reciprocal rank fusion)。Claude Haiku によるクエリ拡張はオプション。
3. **エージェントスキル層** — 34〜43個(記事によって差あり)の Markdown スキルが、取り込み・エンリッチメント・検索・定期実行(cron)の作法をエージェントに教える。

### 主要機能

- **ハイブリッド検索**: ベクトル埋め込み+キーワード+グラフ信号、強度をカスタマイズ可能
- **自己配線ナレッジグラフ**: works_at / invested_in / founded のような型付きエッジを LLM 呼び出しなしで自動抽出
- **シンセシス層**: 引用付きで回答を生成し、情報が足りない箇所は正直に「ギャップ」として明示
- **ジョブキュー(Minions)**: Postgres ネイティブな永続サブエージェントで自律的なエンリッチメントを実行
- **リポジトリごとの信頼ポリシー**: `read-write` / `read-only` / `deny` の3種

### GStack との連携方法

GStack から GBrain を使うための導線が用意されている。

- **セットアップ**: `/setup-gbrain` スキル一つで、状態検知→最大3つの質問→初期設定・MCP登録・信頼ポリシー設定までを5分以内で完了させる。
- **接続先(4パス、いずれか選択)**:
  1. 既存 Supabase の Session Pooler URL を貼る
  2. Supabase Personal Access Token を渡して自動プロビジョニング(新規プロジェクト作成、約90秒でポーリング完了)— **注意: このトークンは新規作成するプロジェクトだけでなく、そのSupabaseアカウントの全プロジェクトへのフルアクセス権を持つ**と公式ドキュメントが明記
  3. `gbrain init --pglite` でローカルにゼロコンフィグ構築(約30秒)
  4. リモート MCP サーバーへの接続(Tailscale/ngrok/LAN経由。ブレインクエリはリモートMCP、コード検索はローカルPGLiteという分割運用も可能)
- **Claude Code への MCP 登録**:
  ```
  claude mcp add gbrain -- gbrain serve
  ```
  これでシェルアウトではなく、型付きツールとして gbrain がセッションに登場する。
- **同期コマンド**:
  ```
  /sync-gbrain                # 増分同期(クリーンな場合は数秒)
  /sync-gbrain --full         # 完全再インデックス(25〜35分)
  /sync-gbrain --code-only    # コード変更のみインデックス
  /sync-gbrain --dry-run      # 何が変わるかプレビューのみ
  ```
  同期は「コード」「メモリ」「brain-sync」の3ステージが独立して走るため、一部失敗しても部分的に成功しうる。
- 成功すると `CLAUDE.md` に「GBrain Search Guidance」ブロックが自動追記され、Grep より `gbrain search` / `code-def` を優先すべき場面をエージェントに教える(ラウンドトリップテストに失敗した場合はこのブロックが自動的に削除される=誤った案内をしない設計)。

---

## 3. セットアップ手順

**前提条件(GStack)**: Claude Code、Git、Bun v1.0以上(Windowsのみ追加でNode.js)。

### 3-1. GStack を Claude Code にインストールする

Claude Code のプロンプトに以下を貼り付ける(公式README記載、約30秒で完了):

```
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

`setup` スクリプトが行うこと:
- `bun` の存在確認(無ければ案内して終了)
- OS判定(Windows/macOS/Linux)、Windowsは Playwright/Chromium 起動用に Node.js も確認
- ブラウズ用バイナリのビルド(ソース差分または未ビルド時)
- Playwright(PDF生成用 Chromium)のインストール
- Linux では絵文字フォント(Noto Color Emoji)の自動導入を試行
- Apple Silicon Mac ではビルド済みバイナリをコード署名し直し(カーネル拒否防止)
- `--host <name>` でターゲットエージェント(claude/codex/cursor/factory/opencode等)を指定、スキルをシンボリックリンクまたはコピー
- `--prefix` / `--no-prefix` でコマンド名を `/gstack-qa` にするか `/qa` のように短くするか選択
- `~/.gstack/projects` にグローバル状態を作成

インストール後、CLAUDE.md に利用可能スキル一覧を追記することが推奨されている。

### 3-2. チーム(共有リポジトリ)モードにする場合

```
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required && git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

### 3-3. GBrain を単独導入する場合(GStack経由でなく直接)

```bash
curl -fsSL https://bun.sh/install | bash
exec $SHELL
bun --version
bun install -g github:garrytan/gbrain
gbrain --version

# ローカル(埋め込みなし・最速)
gbrain init --pglite --no-embedding
gbrain stats
```

埋め込み(ベクトル検索)を使う場合は事前に `ZEROENTROPY_API_KEY`(デフォルト)/`OPENAI_API_KEY`/`VOYAGE_API_KEY` のいずれかを設定し `--no-embedding` を外す。

Brain リポジトリの用意とインポート:
```bash
mkdir -p ~/my-brain/people ~/my-brain/companies ~/my-brain/concepts
gbrain import ~/my-brain/ --no-embed
gbrain extract links --source db
gbrain graph-query people/alice-chen --depth 1
gbrain backlinks companies/acme-ai
```
**ハマりどころ**: Wikilink は `[[people/alice-chen]]` のようにフルパスのスラッグで書く必要がある。短縮形だとリンクがサイレントに0件になる。

検索と埋め込み:
```bash
gbrain search "inference"
export OPENAI_API_KEY=sk-...
gbrain config set embedding_model openai:text-embedding-3-large
gbrain embed --all
gbrain query "who works on small-model inference?"
```

Claude Code への MCP 登録:
```bash
claude mcp add gbrain -- gbrain serve
claude mcp list
```
リモートHTTPアクセスが必要なら `gbrain serve --http --port 8787`。

バックグラウンド運用:
```bash
gbrain doctor --remediate --yes --target-score 90 --max-usd 5
gbrain autopilot --install
gbrain jobs submit sync --params '{}' --follow
```
**PGLiteの制約**: 監視デーモン(supervisor)は本物のPostgresが必要。PGLiteはファイルロックが排他的なため、別プロセスのワーカーをブロックしてしまう。

### 3-4. GStack 経由で GBrain を使う(推奨・最短ルート)

Claude Code 内で:
```
/setup-gbrain
```
これだけで検知→最大3問の質問→初期化→MCP登録→信頼ポリシー設定が完了する(前述の4パスのいずれかを選択)。以後は `/sync-gbrain` で同期する。

### 3-5. アンインストール

```
~/.claude/skills/gstack/bin/gstack-uninstall
```
または手動で:
```bash
pkill -f "gstack.*browse" 2>/dev/null || true
rm -rf ~/.claude/skills/gstack ~/.gstack
rm -rf .gstack .gstack-worktrees .claude/skills/gstack
```

### 3-6. Claude Code との併用について

GStack は Claude Code の Skills 機構(`~/.claude/skills/`)にそのまま乗る設計で、追加のランタイムは不要。つまり **今使っている Claude Code はそのままで、gstack のスキル群がスラッシュコマンドとして増えるだけ**。既存の CLAUDE.md やプロジェクト固有の運用ルールと共存できるが、`/setup-gbrain` 実行後に GBrain 用の案内ブロックが CLAUDE.md に自動追記される点は把握しておくこと(自分たちの CLAUDE.md 運用ルールと衝突しないか要確認)。

---

## 4. ハッカソン当日の活用パターン(5時間で spec→実装→QA→デモ)

公式ワークフロー(Think→Plan→Build→Review→Test→Ship)を5時間の持ち時間に圧縮するなら、目安として以下の配分が考えられる(公式ドキュメントに「ハッカソン向け時間配分」の明記は無いため、ここは各スキルの説明文から妥当性を導いた**推奨案**であり、実測値ではない点に注意)。

1. **0:00–0:20 企画・スコープ確定**
   - `/office-hours` でアイデアを一度言語化し、前提を問い直させる。ハッカソンでは深追いしすぎず、フォーカスを絞る目的で使う。
   - `/plan-ceo-review` で「Hold Scope(現状維持)」または「Reduction(縮小)」モードを選び、5時間で完走できる範囲までスコープを削る。ここで欲張ると後が崩れる。

2. **0:20–0:40 アーキテクチャ確定**
   - `/plan-eng-review` でデータフロー・エッジケース・最低限のテスト方針を固める。もしくは `/autoplan` で CEO→設計→エンジニアレビューを自動連鎖させて時短。

3. **0:40–3:00 実装**
   - 通常の Claude Code 実装フロー。必要に応じ `/design-shotgun`(UI案複数生成)や `/design-html`(モックアップ→実装)でフロントを高速化。
   - 危険な操作をしがちな終盤は `/careful` や `/guard` を有効にしておくと事故防止になる。
   - GBrain を使う場合は、チームの決定事項・過去の失敗・API仕様などを brain に書き溜めておくと、複数人・複数セッションでの手戻りを減らせる(ハッカソン規模では PGLite ローカルで十分、Supabase自動プロビジョニングの90秒待ちすら惜しい場面はある)。

4. **3:00–3:40 レビュー**
   - `/review` で「CIは通るが壊れる」バグを機械的に洗い出し、自動修正。
   - 余裕があれば `/cso` で最低限のセキュリティ確認(認証・入力値検証など、デモで恥をかかない範囲)。

5. **3:40–4:20 QA**
   - `/qa https://<staging-url>` で実ブラウザ操作によるバグ出し・自動修正・回帰テスト生成。デモ動線(審査員が触る導線)を重点的に流す。
   - 時間が無ければ `/qa-only` でレポートだけ受け取り、手動で直す判断も可。

6. **4:20–4:50 出荷・ドキュメント**
   - `/ship` でテスト→カバレッジ確認→push→PR作成。
   - `/document-release` でREADME等をデモ内容と整合させる(審査員が読むREADMEが古いと減点対象になりがち)。

7. **4:50–5:00 デモ直前チェック**
   - `/health` でざっくりコード品質スコアを確認し、致命的な赤信号が無いかだけ最終確認。
   - `/context-save` でその場の状態を保存しておけば、デモ後に続きの開発を別セッションで再開しやすい。

**チーム開発の場合**: `/pair-agent` で複数エージェント(例: 一人はCodex、一人はClaude Code)を同一ブラウザにペアリングして並行QAする使い方も想定されている。ただしハッカソンの短時間では設定コストとのトレードオフを見て判断すること。

---

## 5. 注意点・ハマりどころ

### セットアップ・運用上の実務的な注意点(一次情報ベース)

- **Supabase自動プロビジョニングは全プロジェクトへのフルアクセス権を要求する**: `/setup-gbrain` のパス2a(PAT自動プロビジョニング)で使うトークンは、新規作成するプロジェクトだけでなく、そのSupabaseアカウント内の全プロジェクトにアクセス可能。ハッカソン用に使い捨てのSupabaseアカウント/トークンを分けるなど検討した方がよい。
- **PGLiteはローカル専用、supervisor/autopilotとは相性が悪い**: PGLiteの排他ファイルロックにより、別プロセスのバックグラウンドワーカー(`gbrain autopilot`等)がブロックされる。ハッカソンでバックグラウンド運用まで使うなら最初からPostgresを検討。
- **Wikilinkはフルスラッグで書く**: `[[people/alice-chen]]` のような完全パス表記でないと、リンク抽出がサイレントに失敗し0件になる。エラーが出ないため気づきにくい。
- **PATH shadowing**: 別の `gbrain` バイナリがPATH上で先に見つかると、インストーラと衝突する。シャドーされたバイナリの削除、PATH順の調整、または `GBRAIN_INSTALL_DIR` の指定で回避。
- **Direct connection URL は拒否される**: Postgres接続はSession Pooler URL(ポート6543)を使う必要があり、直接接続URL(ポート5432)は弾かれる。
- **埋め込み未設定での同期後にsearchが機能しない**: `OPENAI_API_KEY`/`VOYAGE_API_KEY` を設定せずに同期すると埋め込みが欠落する。後から `/sync-gbrain --code-only` で埋め込みだけバックフィル可能。
- **秘密情報の扱い**: `SUPABASE_ACCESS_TOKEN` や `GBRAIN_DATABASE_URL` 等は環境変数経由のみで、コマンド引数やログには出さない設計になっている(CI上でも検証済みとの記載)。逆に言えば、自分たちの運用でうっかりコマンドライン引数に秘密鍵を渡すとこの設計思想に反する。
- **CLAUDE.mdの自動書き換え**: `/setup-gbrain` 成功時にGBrain案内ブロックがCLAUDE.mdへ自動追記される(失敗時は自動削除)。既存のCLAUDE.md運用(本ハッカソンの統治規程のような既存ルール)と重複・競合しないか確認した方がよい。

### 導入判断・評判に関する注意点(批判・懐疑論。二次情報)

- 本ツール群は "Markdown ファイル+プロンプトの集合" に過ぎず、独自の技術的ブレークスルーではないという批判がHacker News/TechCrunchで多数出ている。効果は「組織構造をプロンプトで模倣すること」自体にあるとされ、"魔法ではない" という評もある。
- Tan本人が主張する生産性倍率(コード行数ベースの比較)は、行数(LOC)を生産性指標にすること自体への批判(「もはや誰もLOCで進捗を測らない」)を含め、Hacker News上で強く疑問視されている。実際に60日で何が出荷されたかが不透明という指摘もある。
- 「YCのCEOだから注目された/Product Huntで上位に来た」という、内容以前の立場バイアスを指摘する声がある。
- Tanの睡眠時間(4時間程度)への言及に対し、危険な兆候(いわゆる"AI起因の躁的状態")ではないかという健康面の懸念も一部で出ている。ハッカソンで長時間ぶっ通し作業をする際の一般的な注意として留意する程度で良い。
- 上記はいずれも「GStack/GBrainが実務で無価値」という結論ではなく、**効果測定の指標(LOCなど)を鵜呑みにしない/宣伝文句と実装の中身を切り分けて評価する**、という参考情報として扱うべき。

### 未確認事項(取得できなかった情報)

- **YC公式記事 "Inside Garry Tan's AI Coding Setup"** (https://www.ycombinator.com/library/OW-inside-garry-tan-s-ai-coding-setup) は WebFetch で本文を直接取得できなかった(2回試行、いずれもページ本文が取得できずタイトルのみ)。本ガイドの記述はこの記事の直接引用ではなく、WebSearchのスニペット経由で得られた二次的な要約(GStackの目的・ワークフロー観・生産性主張)に基づく。正確な原文表現やハッカソン特有のTipsが記事内にある場合、本ガイドには反映できていない可能性がある。
- **GBrain リポジトリの README 本文**は GitHub blob 経由(`github.com/garrytan/gbrain/blob/main/README.md`)および raw.githubusercontent.com 経由のいずれも404で直接取得できなかった。GBrainの概要・機能一覧はリポジトリのトップページ(README冒頭相当)とVectorize記事、MarkTechPostのチュートリアル記事から再構成したものであり、README全文を確認したものではない。
- スター数・フォーク数など統計値(例: 「25K stars」「14,000 stars」等)はソースによって数値が食い違っており、取得時点でのスナップショットに過ぎないため本文では極力言及を避けた。正確な最新値が必要な場合は当日改めてリポジトリを直接確認すること。
