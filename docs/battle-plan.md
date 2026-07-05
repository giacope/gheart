# yc_20260705 作戦メモ — c0mpiled AI ハッカソン第3弾

- 日時: 2026-07-05(日)8:30–19:00 JST
- 会場: 立命館大学 大阪いばらきキャンパス(受付: Future Plaza、スタバ隣)
- テーマ: YC RFS Summer 2026 から1つ選択(Company Brain / Dynamic Software Interfaces / Software for Agents)
- 実開発時間: **12:00–17:00 の5時間**
- 言語: 提出・発表は英語(開発中は日本語OK)

## チーム(最大4名)

| メンバー | 強み |
|---|---|
| 自分 | Claude Code オーケストレーション、フルオート開発スタック |
| Arata Jingu | HCI/XR/ハプティクス研究(Sakana AI)、Python/React/GCP、マルチモーダルLLM |
| Giacomo Guiulfo | インフラ・ジェネラリスト(Go/K8s/Rails)、ex-Apple/Google/Twitch、プロダクトエンジニアリング統括 |

## 提出物(締切 17:00)

- [ ] RFS に基づく課題設定と解決アプローチ(英語)
- [ ] プロダクト・技術・ビジネスモデルの概要(英語)
- [ ] デモ or **90秒以内のデモ動画**(審査員はこれを評価)
- [ ] グローバル展開前提の市場・ユーザー視点

## 賞と狙い

- 1st ¥250,000 / 2nd ¥100,000 / 3rd ¥50,000 + YC Partner Office Hours
- Honorable Mentions: **The Investable Startup Award** / **The UX/UI Award** / **The Biggest Engineering Lift**
- 審査員: Sean Grove(Linzumi、3x YC)、Henry Ndubuaku(Cactus、YC S25)ほか

## 当日タイムライン

| 時刻 | 予定 | やること |
|---|---|---|
| 08:30 | Check-in | 早めに着いて席・電源確保 |
| 09:40 | Garry Tan Talk | RFS の力点をメモ(審査基準は当日発表) |
| 10:35 | ルール説明 | 提出形式を確定させる |
| 10:45–12:00 | Team Building | テーマ確定・役割分担・spec.md 起草開始 |
| 12:00–13:00 | 開発1h目 | scaffold + データ/API の骨格 + UI プロト並行 |
| 15:30 | 中間判定 | デモに映る縦切り1本が動いているか。動いてなければスコープ削減 |
| 16:00–17:00 | 仕上げ | デモ動画撮影(90秒)・pitch 資料・提出 |
| 17:00– | Judging / Pitches | 英語ピッチ |
| 18:30 | 結果発表 | |

## 技術スタック方針(playbooks/hackathon 準拠)

- 開発: Claude Code(bypass permissions)+ codex 併用、必要なら ralph-loop 系フルオート
- 指定ツール: **GStack / GBrain**(→ docs/hackathon-context/gstack-gbrain.md)
- 設計: spec.md に要件を書き切る(音声入力活用)、progress にタスク+チェックボックス
- UI プロト: Stitch(https://stitch.withgoogle.com/)
- API: openapi.json で一覧化して記録
- pitch: Canva
- フロント: ダークテーマなし・共通化、`/` = pitch ページ(ヘッダーに repo リンク)、`/dashboard` = 実演用実装

## 持ち物チェック

- [ ] ノートPC・充電器
- [ ] ポータブルWi-Fi or テザリング設定済みスマホ(会場150名で回線混雑の見込み)
- [ ] 延長コード
- [ ] 名刺

## 参照

- **アイデア候補(本命: Agent-Native Chat)**: docs/hackathon-context/idea-candidates.md
- 競合・想定問答: docs/hackathon-context/competitive-landscape.md / 技術実現性・工程表: docs/hackathon-context/tech-feasibility.md / Arata 活用: docs/hackathon-context/arata-angles.md
- 会議要旨(7/4): docs/meeting/26_7_4_21_45-summary.md
- イベント公式: docs/event/event official.md
- RFS テーマ分析: docs/hackathon-context/rfs-summer-2026.md(推奨順位: ①Dynamic Software Interfaces ②Company Brain ③Software for Agents。最終決定は当日のチームビルディングで)
- GStack/GBrain ガイド: docs/hackathon-context/gstack-gbrain.md(⚠️ GStack は CLAUDE.md を自動書き換えする — user スコープ導入前に憲法のバックアップ必須)
- Discord: https://discord.gg/XmySYCHTW
