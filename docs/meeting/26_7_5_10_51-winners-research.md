# セッションログ: 過去優勝作品の調査

- 日時: 2026-07-05 10:51 JST
- 目的: 今日の c0mpiled in Japan pt 3 に向け、優勝者が何を作ったかを調査

## 前提の確認

- 今日のイベント = **c0mpiled in Japan pt 3**(主催 Transpose Platform / 共催 立命館大学 / 協力 OUVC、会場: 立命館大阪いばらきキャンパス、8:30–19:00 JST)
- テーマ: **YC RFS Summer 2026** / 賞金総額40万円 / Garry Tan(YC President & CEO)来日参画
- **本日開催中のため、pt3 の優勝作品は未発表**
- → 「優勝者が何を作ったか」は同シリーズ・同スポンサー(gstack/gbrain)・Garry Tan審査の直近回から傾向を読む

## 主な発見: gstack × gbrain Hackathon #1(5/22, 200名超・87作品)受賞作

| 順位 | 作品 | 何を作ったか |
|---|---|---|
| 1位 | **Build your Phone**(Sina Matian) | Claude に iPhone 開発スキルを付与し、実機 iPhone を物理操作してバグを自動修正するフレームワーク。SwiftUI 全ソース自動マッピング、CoreDevice USB トンネル経由で状態をリアルタイム露出、`find→fix→verify` を自動化 |
| 2位 | **LearningGraph** | GBrain を記憶層に、習熟度で動的にレッスン調整+ナレッジをグラフ可視化する適応学習ツール |
| 3位 | **GBody** | ロボットアーム + MCP + Claude + GStack で物理空間の自己最適化。エージェントの物理領域進出を提示 |
| 4位 | **Hindsight** | GBrain の自己反省(self-reflection)層 |

スペシャルアワード: Conamur(小売AI音声エージェント/顧客記憶永続化)、Cortex(医学生向けDuolingo型)、OrderUp(レストランOS)、Docket(PACER訴訟記録×GBrain訴訟戦略エンジン)ほか。

## 勝ち筋の傾向(審査観点)

1. **実機・物理で「本当に動く」もの**が最上位に刺さる(1位・3位ともハードウェア連動、デモで価値が即伝わる)
2. **審査基準は「YC申請と同じ」**。審査員は確固たる意見を持ち、意図を即座に理解できるかで判断
3. 勝者の共通行動: 仲間・審査員とアイデアをストレステスト → 明確な方向へ積極構築 → プロンプト(RFS)に沿って作る
4. スポンサー技術(GBrain=記憶層 / GStack=スキル / The Hog / ZeroEntropy / Lightsprint)を深く組み込んだ作品が各賞を獲得(応募の約60%がGBrainトラック)

## 未解決 / 次アクション候補

- 日本版 pt1 / pt2 の受賞作の公開記録は未発見(luma/X/SNSに散在の可能性)→ ブラウザで深掘り余地あり
- シリーズ他拠点: c0mpiled-2=Abu Dhabi「The Adaptive City」、c0mpiled-3「The Climate Stack」、c0mpiled-6=Penn State 等
- 次アクション候補:
  - A. 勝ち筋を踏まえ `docs/hackathon-context/idea-candidates.md` の5案を採点・順位づけ
  - B. 日本版 pt1/pt2 の受賞作をブラウザで深掘り
  - C. 本ログの内容を `docs/hackathon-context/past-winners-hackathon-1.md` に反映

## 出典

- 立命館 RIMIX 告知: https://r-rimix.com/archives/20260705/
- gstack×gbrain Hackathon #1 記事: https://www.compiled.sh/articles/gstax-x-gbrain-hackathon-1
- c0mpiled-2 Post-Mortem: https://www.compiled.sh/articles/c0mpiled-2-the-adaptive-city-post-mortem
- YC GStack イベント: https://events.ycombinator.com/GStack
