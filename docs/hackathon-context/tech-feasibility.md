# 技術実現性調査: agent-first チャット × チャネル内生成UI

調査日: 2026-07-05 / 前提: 実開発5時間・3〜4名チーム・審査対象は90秒デモ動画

---

## 0. 結論(先出し)

**推奨スタック**: Next.js + Anthropic Claude API(tool use, `sonnet-5` メイン)+ **自作の軽量JSONスペック→Reactレンダラ**(A2UIのメッセージモデルを参考にした独自スキーマ、コンポーネントallowlist方式)+ **Supabase Realtime Broadcast**(チャネルの同期)。既製の generative UI フレームワーク(CopilotKit/assistant-ui/Thesys C1)は単一クライアントのチャットスレッド最適化が前提で、「複数人が同じチャネルで同じUIを同時に見る」というマルチプレイヤー要件に配線し直すコストが5時間予算を圧迫するため、フレームワーク全体は採用せず、その設計思想(allowlist・JSON tree)だけを借りて自作する。

---

## 1. チャット内 generative UI の実装パターン比較

### a. LLMにJSONスペックを出させ、Reactコンポーネントとしてレンダリング

**仕組み**: LLMのtool useで「UIを描画するツール」を1個定義し、入力スキーマ(例: `{type, props, children}` の木構造)をJSONで生成させる。クライアント側は事前に用意した数個〜十数個のReactコンポーネント(Card, StatTile, BarChart, Form, KanbanBoard等)の「許可リスト(allowlist)」を持ち、JSON中のコンポーネント名をallowlistと突き合わせて再帰的にレンダリングする。

これはGoogleが2026年に公開した **A2UI(Agent-to-UI)プロトコル** の設計思想そのもの。A2UIは `createSurface` / `updateComponents` / `updateDataModel` / `deleteSurface`(v1.0では `actionResponse` / `callFunction` も追加)という4〜6種のメッセージをストリーミングJSONとして流し、クライアントがコンポーネントツリーを組み立てる方式で、LLMが「完璧なJSONを一発で出す」必要がなく、断片的に生成しても差分更新できるよう設計されている([A2UI仕様 v1.0](https://a2ui.org/specification/v1.0-a2ui/), [Google Developers Blog](https://developers.googleblog.com/a2ui-v0-9-generative-ui/))。

同じ考え方はライブラリ実装にも既にある。**assistant-ui** の Generative UI 機能は、エージェントが `generative-ui` メッセージパートとしてコンポーネント名の木を出力し、開発者が用意したコンポーネントallowlistに対して解決・レンダリングする。ドキュメント上は「5〜10個のコンポーネント定義+約15行の配線」で動くとされ、依存も `@assistant-ui/react` のみでバックエンド要件も薄い([assistant-ui Generative UI docs](https://www.assistant-ui.com/docs/tools/generative-ui))。

- **セットアップ時間**: 自作なら1〜1.5時間(スキーマ設計30分+レンダラ実装30分+コンポーネント5個分)。assistant-ui採用なら理論上30分程度だが、後述の理由でマルチプレイヤー要件との相性が悪い。
- **デモ映え**: 高い。ダッシュボード/フォーム/かんばんが「その場で組み上がる」様子は視覚的にわかりやすく90秒動画向き。
- **落とし穴**: LLMが未知のコンポーネント名やスキーマ逸脱を出すことがある→ allowlist外は無視/エラー表示にするガードが必須。propsをそのまま展開するため `dangerouslySetInnerHTML` 等の実行コンテキストに渡さないこと(assistant-uiのドキュメントもこの点を明記)。

### b. LLMにReact/HTMLコードを直接生成させ、sandboxed iframeで実行

**仕組み**: LLMに生のJSX/HTML/JSを書かせ、`<iframe sandbox srcdoc=...>` + Babel standalone(ブラウザ内トランスパイル)で実行する。iframeの `sandbox` 属性でscript実行を許可しつつ、親フレームとは `postMessage` でのみ通信させ、ネイティブのDOMアクセスやフォームは分離する([iframe sandboxing解説](https://joshua.hu/rendering-sandboxing-arbitrary-html-content-iframe-interacting), [react-safe-src-doc-iframe](https://github.com/godaddy/react-safe-src-doc-iframe))。

- **セットアップ時間**: 2〜3時間。Babel standaloneの読み込み、iframe⇔親のイベント橋渡し(postMessage)、エラーバウンダリ、CSSスコープ分離などが必要で工数が重い。
- **デモ映え**: 自由度は最大(LLMが好きなレイアウト・アニメーションを書ける)だが、5時間ハッカソンでは「たまに壊れる」リスクの方が大きい。
- **落とし穴**: LLM生成コードは信頼できない入力として扱う必要があり、`eval`/`new Function`/`fetch`/`document.cookie` 等の危険パターン検出、モジュールallowlist、実行時間制限などの多層防御が推奨される([Promptfoo: Sandboxed Evaluations](https://www.promptfoo.dev/docs/guides/sandboxed-code-evals/), [OWASP LLM Top 10 2026](https://elevateconsult.com/insights/owasp-llm-top-10-security-vulnerabilities-every-ai-developer-must-know-in-2026/))。90秒デモの1回勝負でこのリスクを取る価値は低い。

### c. 既製generative UIライブラリ/SDK

| ライブラリ | 特徴 | 所要時間の目安 | 所見 |
|---|---|---|---|
| **Vercel AI SDK `streamUI`** | RSCで生成UIをストリーミング | - | 2026年時点でも**実験的機能のまま**。AI SDK 4.x系でRSCヘルパーは非推奨方向、`useChat`が正式ルートとされている([AI SDK RSC: streamUI](https://ai-sdk.dev/docs/reference/ai-sdk-rsc/stream-ui))。本番非推奨=ハッカソンでも将来性に賭けにくい。 |
| **CopilotKit(AG-UI protocol)** | Reactの汎用エージェントUIフレームワーク。Generative UI・共有state・Human-in-the-loopを標準搭載 | クイックスタートは5分未満と謳われる([CopilotKit Quickstart](https://docs.copilotkit.ai/quickstart)) | Anthropicにも対応。ただしCopilotKitの「共有state」は**1クライアント内でのエージェント⇔UI同期**が主眼で、複数ブラウザ間のマルチプレイヤー同期は別レイヤーで自前実装が必要。 |
| **assistant-ui** | 上記a参照。JSON→Reactのgenerative UIが標準機能 | 30分〜1時間 | Vercel AI SDKの`useChatRuntime`前提でチャットスレッドの状態管理が組み込まれており、"複数ユーザーが同じチャネルの同じstateを見る"という要件に対しては状態モデルの二重管理になりやすい。 |
| **Thesys C1** | OpenAI互換API(`api.thesys.dev/v1/embed`)にプロンプトを投げると自動でUIをストリーミング生成、`<C1Component>`で描画 | 2行での統合を謳う([Thesys公式](https://www.thesys.dev/)) | ミドルウェア層がOpenAI SDK前提で設計されており、Anthropic Claudeとの正式な統合方法・料金/無料枠は公開ドキュメント上で明確に確認できなかった([Thesys Docs](https://docs.thesys.dev/guides/what-is-thesys-c1))。ハッカソン当日に検証コストを払うのはリスク。 |

### 推奨構成(5時間ハッカソン)

**パターンa・ただし既製フレームワークは使わず自作**。理由:

1. どのフレームワークも「1ユーザーのチャットスレッド」を単位にstateを持つ設計であり、今回の核心要件である「複数人が同じチャネルの同じ生成UIを同時に見る」はフレームワークの外側(Realtime層)で自前実装するしかない。であれば、フレームワークの学習・配線コストを払うより、JSON tree→再帰レンダラ(30〜50行程度)を自作しBroadcastでそのまま配信する方が総工数が少ない。
2. A2UIやassistant-uiの「allowlistコンポーネント+木構造JSON」という設計は十分にシンプルで、5時間で自作しても大差ない実装コストで済む。
3. パターンb(sandboxed iframe)は自由度と引き換えに壊れるリスクが高く、1回のデモ動画撮影のための投資として見合わない。

---

## 2. リアルタイム同期(マルチプレイヤー)

| 選択肢 | セットアップ | 適性 |
|---|---|---|
| **Supabase Realtime Broadcast** | `npm install @supabase/supabase-js`→プロジェクト作成→`supabase.channel(name).on('broadcast',...).subscribe()`。WebSocket経由で低遅延にJSONペイロードを配信([Supabase Broadcast docs](https://supabase.com/docs/guides/realtime/broadcast)) | **推奨**。開発体験が最速(コード量最少、無料枠で十分)。 |
| **Liveblocks** | Room・Presence・LiveObject/LiveListなどCRDTベースの共同編集基盤 | 過剰スペック。カーソル共有やドキュメント共同編集向けで、今回は「JSON blobを配って全員同じものを描画するだけ」なのでオーバーヘッドが大きい([Liveblocks vs PartyKit比較](https://www.pkgpulse.com/guides/liveblocks-vs-partykit-vs-hocuspocus-realtime-2026))。 |
| **PartyKit(→Cloudflare)** | 2024年にCloudflareが買収し `cloudflare/partykit` として存続、Durable Objects上で動作。サーバクラスを自分で書いてデプロイ([Cloudflare公式](https://blog.cloudflare.com/cloudflare-acquires-partykit/)) | 制御は自由だが「サーバロジックを書く」分の工数が増える。1部屋=1チャネルのモデルは相性が良いが、今回はSupabaseで足りる。 |
| **plain WebSocket自前実装** | 最速・依存最小だが自分でサーバプロセスを立てて管理する必要 | ローカルLAN限定デモなら最強(後述4章参照)。 |

**推奨**: 開発中は **Supabase Realtime Broadcast** 一本。理由: (1) 認証・DB・Realtimeが同じ無料プロジェクトで完結し、キー配布さえすれば3人ともすぐ使える、(2) JSONペイロードをブロードキャストするだけの用途に対して機能過不足がない、(3) `supabase.channel('demo-channel-1').send({type:'broadcast', event:'ui-spec', payload})` のように数行で送受信できる([Broadcast docs](https://supabase.com/docs/guides/realtime/broadcast))。

**当日デモの保険**: 会場Wi-Fiが不安定な場合に備え、ブラウザ標準の **`BroadcastChannel` API**(同一オリジンのタブ/ウィンドウ間通信、外部ネットワーク不要)にフォールバックできるよう、Realtime送受信をラップする薄い抽象層(`send(topic, payload)` / `subscribe(topic, cb)`)にしておくと良い。同一PC上で複数ウィンドウを開いて「2〜3クライアント同時表示」を見せるだけなら`BroadcastChannel`だけで完結し、ネットワーク依存ゼロで録画できる。

---

## 3. Claude APIの使いどころ

### モデルの使い分け

- **`claude-sonnet-5`をメインに使用**: 2026年7月時点でintro価格 $2/$10(→8月末以降$3/$15)per Mトークン、SWE-bench Proで63.2%とOpus 4.8(69.2%)に迫る性能([Anthropic公式](https://www.anthropic.com/news/claude-sonnet-5))。UIスペック生成やエージェントのtool use呼び出しは複雑な多段推論ではないため、レイテンシとコストの観点でSonnet 5で十分。
- **`claude-fable-5`は温存**: 最上位モデルだが$10/$50 per Mトークンと高額で、Opus 4.8の2倍・Sonnet 5の約5倍のレート([finout.io比較記事](https://www.finout.io/blog/claude-fable-5-mythos-5-pricing-benchmarks))。90秒デモという短時間勝負では「応答が速く安定していること」の方が「最高性能であること」より価値が高い。もし時間に余裕があれば、デモの目玉となる1シーン(複雑なダッシュボード仕様の一発生成など)だけFable 5に差し替えて見せ場を作る、程度の使い方に留める。

### UIスペックのストリーミング配信

Claude Messages APIのtool useには **fine-grained tool streaming**(`eager_input_streaming: true` をツール定義に付与)があり、サーバ側バッファリングなしにtool inputの断片(`input_json_delta`イベントの`partial_json`)をそのまま流せる([Claude Platform Docs: Fine-grained tool streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming))。

実装パターン:
1. `render_ui` という名前のツールを定義し、`input_schema` に自作UI spec(コンポーネント木)のJSON Schemaを設定、`eager_input_streaming: true` を付与。
2. `client.messages.stream(...)` でストリーミング開始。
3. `content_block_delta` イベントの `input_json_delta.partial_json` をサーバ側で蓄積しつつ、**そのままSupabase Broadcastの別チャネル(例: `ui-spec-stream`)に転送**する。
4. クライアント側は部分JSONを寛容パーサ(不完全な末尾を切り詰めてパースを試みる、失敗時は直前の成功結果を保持)で解釈し、UIを「組み上がっていく」ように段階的に描画する(A2UIが目指す体験と同じ)。
5. `content_block_stop` で完全なJSONが確定したら正規パースし直して確定描画。不正JSONの場合はエラーとして扱い、Claude側にも`is_error: true`のtool_resultで返す設計がドキュメントに明記されている。

注意点として、fine-grained tool streamingは「パース保証なしで断片が届く」ため、必ずガード付きパースにすること(公式ドキュメントの警告)。

### エージェントセッションのライブ配信

Claude Agent SDK(Claude Codeを支える基盤で汎用エージェント構築にも使える、[Anthropic公式解説](https://www.mindstudio.ai/blog/what-is-claude-agent-sdk-vs-claude-api))は、メッセージイテレータが `ToolUseBlock` / `ToolResultBlock` / `TextBlock` を順に返す。この各イベントをそのまま「エージェントの作業ログ」としてSupabase Broadcastの `agent-activity` チャネルに転送すれば、チャネルUI上に「🔧 web_searchを実行中…」「✅ 結果取得」のようなライブトレースを表示できる。実装は本質的に「サーバで受け取ったSSEイベントをWebSocket/Broadcastにそのまま中継する」だけなので、追加の設計コストはほぼゼロ。

---

## 4. 雛形スタック提案・工程表(12:00開始→15:30に縦切り1本)

**構成**: Next.js(App Router)+ Anthropic SDK(`@anthropic-ai/sdk`)+ Supabase JS Client。3人体制の役割分担:
- **F = フロント**(チャネルUI・レンダラ・コンポーネント)
- **R = リアルタイム基盤**(Supabase設定・Broadcast配線・サーバAPIルート)
- **A = エージェント&プロンプト**(Claude tool定義・スキーマ・プロンプト設計)

| 時刻 | F: フロント | R: リアルタイム基盤 | A: エージェント&プロンプト |
|---|---|---|---|
| 12:00–12:30 | Next.js+Tailwind雛形作成、チャネルUIの枠(メッセージリスト+入力欄) | Supabaseプロジェクト作成、Realtime有効化、channel helperモジュールの雛形、3人分にAPIキー配布 | Anthropic APIキー疎通確認、最小tool use呼び出しスクリプト作成、UI specスキーマの型を3人で合意 |
| 12:30–13:00 | コンポーネントレジストリ実装(Card/StatTile/BarChart/Form/KanbanBoard等5〜6種)+再帰レンダラ | チャネルのメッセージログ+「共有UI state」を1つのReact contextにまとめ、Broadcast送受信と接続するテスト(2タブでhello world同期) | `render_ui`ツールのJSON Schema確定、system prompt作成(「このコンポーネントのみ使用可」制約含む)、3例のプロンプトで手動疎通確認 |
| 13:00–13:30 | チャネル入力→APIルート呼び出し→ローカルレンダリングの結線(この時点では単一クライアントのみ) | サーバAPIルート内でClaude呼び出し後、生成specをBroadcastで配信する処理を追加 | プロンプトのエッジケース調整(かんばん/フォーム/ダッシュボード切り替えの分岐) |
| 13:30–14:00 | **チェックポイント1**: 1台のブラウザで「入力→生成→描画」が通ることを確認、バグ修正 |||
| 14:00–14:30 | コンポーネント追加(かんばんのドラッグ、フォーム送信→チャネルへメッセージ投稿)、ローディング/ストリーミング中の骨格表示 | 2台目・3台目のブラウザ(またはBroadcastChannelフォールバック)で同一チャネルの同期確認、"考え中"インジケータのブロードキャスト | fine-grained tool streaming導入(`eager_input_streaming`)、部分JSONの段階的送出。並行してエージェント活動ログのストリーム配信を実装 |
| 14:30–15:00 | **チェックポイント2**: 2ブラウザを並べて、片方の依頼で両方に同時にUIが出現する「デモの核」ショットを確認 |||
| 15:00–15:30 | バグ修正・スコープ凍結。15:30時点で「チャネルで頼む→UIがチャネル内に生成→2画面同期」の縦切りが動く状態を確定 |||
| 15:30–16:30 | (以降は本調査の範囲外だが参考)スタイリング仕上げ、2つ目のデモシナリオ追加、エラー時のフォールバック(既知の安定した応答をキャッシュしておく)を用意 |||
| 16:30–17:00 | 90秒デモ動画の撮影・複数テイク・ライブ実演は避け録画を審査対象にする |||

---

## 5. 落とし穴リスト

1. **会場Wi-Fi不安定**: デプロイ(Vercel等)への依存を避け、開発機のローカル(`next dev`)+ Supabaseのみに依存を絞る。それでもSupabaseはクラウド依存のため、録画時は事前に安定した回線(自宅/オフィス等)で撮る、またはブラウザ標準の`BroadcastChannel`を使い同一PC内の複数ウィンドウだけで完結させるフォールバック経路を用意しておく(3章末尾参照)。
2. **ライブデモより録画優先**: 審査対象は90秒動画。会場での一発本番ではなく、動く状態を確認した時点(目安15:30〜16:00)で早めに1本撮っておき、時間が余れば録り直す方針にする。ぶっつけ本番の実演はネットワーク・LLMのブレの二重リスクを負う。
3. **LLMの非決定性**: デモで使う依頼文言は事前に何度も試して安定した出力を得られるものに固定する。可能ならtemperatureを下げ、万一ライブでAPIが不調な場合の「既知の良い応答」をハードコードしたフォールバックも1つ用意しておく。
4. **スキーマ逸脱・不正JSON**: allowlist外のコンポーネント名やパース不能なJSONは落ちる前提で、サーバ側でzod等によるバリデーション+不正時のリトライ1回、を組み込む(fine-grained tool streaming使用時は特に必須、公式ドキュメントも警告)。
5. **マルチプレイヤーの競合編集**: CRDTのようなマージは実装しない。「最後に届いたspecで全員上書き」のlast-write-winsに割り切る。
6. **スコープ膨張**: 「ダッシュボード・フォーム・かんばん」を全部作ろうとせず、デモで見せる2種類(例: ダッシュボード+かんばん)に早期に絞り込み、13:30のチェックポイントでスコープを凍結する。
7. **APIレート制限・キー管理**: Anthropic APIキーの利用枠を事前に確認し、予備キーを1つ用意。3人が同じキーで並行実行すると当日枠を食い潰すため、開発中は誰か1人のキーに統一するか、キャッシュ済みレスポンスでモック開発する時間帯を作る。
8. **セキュリティ**: パターンbのようなLLM生成コードのeval実行は採用しないため、allowlist方式(パターンa)を徹底し、propsを`dangerouslySetInnerHTML`等に渡さないことをコードレビューの固定チェック項目にする。

---

## 参考出典

- [A2UI (Agent to UI) Protocol v1.0](https://a2ui.org/specification/v1.0-a2ui/)
- [A2UI v0.9: Google Developers Blog](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)
- [assistant-ui: Generative UI (JSON spec)](https://www.assistant-ui.com/docs/tools/generative-ui)
- [CopilotKit Quickstart](https://docs.copilotkit.ai/quickstart)
- [CopilotKit / AG-UI Protocol GitHub](https://github.com/CopilotKit/CopilotKit)
- [CopilotKit: The Developer's Guide to Generative UI in 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)
- [Thesys C1 公式](https://www.thesys.dev/) / [What is C1 by Thesys - Docs](https://docs.thesys.dev/guides/what-is-thesys-c1)
- [Vercel AI SDK RSC: streamUI](https://ai-sdk.dev/docs/reference/ai-sdk-rsc/stream-ui)
- [Supabase Realtime Broadcast Docs](https://supabase.com/docs/guides/realtime/broadcast)
- [Liveblocks vs PartyKit vs Hocuspocus 2026比較](https://www.pkgpulse.com/guides/liveblocks-vs-partykit-vs-hocuspocus-realtime-2026)
- [Cloudflare acquires PartyKit](https://blog.cloudflare.com/cloudflare-acquires-partykit/) / [cloudflare/partykit GitHub](https://github.com/cloudflare/partykit)
- [iframeサンドボックス/postMessage解説](https://joshua.hu/rendering-sandboxing-arbitrary-html-content-iframe-interacting)
- [Promptfoo: Sandboxed Evaluations of LLM-Generated Code](https://www.promptfoo.dev/docs/guides/sandboxed-code-evals/)
- [OWASP LLM Top 10 (2026)](https://elevateconsult.com/insights/owasp-llm-top-10-security-vulnerabilities-every-ai-developer-must-know-in-2026/)
- [Claude Platform Docs: Fine-grained tool streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming)
- [Claude Agent SDKとは (MindStudio解説)](https://www.mindstudio.ai/blog/what-is-claude-agent-sdk-vs-claude-api)
- [Introducing Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5)
- [Claude Fable 5 / Mythos 5 pricing and benchmarks (finout.io)](https://www.finout.io/blog/claude-fable-5-mythos-5-pricing-benchmarks)
