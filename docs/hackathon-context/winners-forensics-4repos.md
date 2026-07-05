# GStack ハッカソン 上位4作品 Gitフォレンジック解剖 / Forensic Analysis of the Top 4 GStack Hackathon Projects

> 🇯🇵/🇺🇸 Bilingual document — each section appears in Japanese first, followed by its English translation.

対象: 2026-05-16 開催の GStack(Garry Tan 主催)ハッカソン上位4作品。各リポジトリをフルヒストリでクローンし、`git log` の実データ(コミットハッシュ・日時・著者別ファイル分布)から「限られた時間でどう作り上げたか」を解剖した。

Subject: The top 4 projects from the GStack hackathon (hosted by Garry Tan) held on 2026-05-16. Each repository was cloned with full history, and we dissected "how they built it in limited time" from real `git log` data (commit hashes, timestamps, per-author file distribution).

---

## 0. 全体像 / The Big Picture

4作品とも **同じ日(2026-05-16)の数時間スプリント**(実働 4.7〜8.2時間)で完成させており、作り方が驚くほど共通していた。

All four projects were completed in a **few-hour sprint on the same day (2026-05-16)** (4.7–8.2 hours of actual work), and their build methods were strikingly similar.

| | 1位 Build your Phone | 2位 LearningGraph | 3位 GBody | 4位 Hindsight |
|---|---|---|---|---|
| 何を作ったか / What | iOS実機を Claude が自動QAするスキル群 | AI学習検索エンジン | ロボアームに Claude の「身体」を与えるMCP | 過去の判断を検証・較正するスキル集 |
| 形態 / Form | **スキル集**(5) | 独立アプリ(Next.js) | 独立アプリ(Python/MCP) | **スキル集**(6) |
| 人数 / People | **1名(ソロ)** | 2名 | 2名 | 3名 |
| 実働 / Work time | 約4.7h | 約8.2h | 約6h | 約6.9h |
| 設計確定 / Spec locked | 初回コミット(15:08) | 開始10分(11:35) | 開始1h(14:08) | 開始1h(12:32) |
| ピボット / Pivots | 0回 | 2回 | 3回 | 1回 |
| 分担軸 / Split axis | — | レイヤー | レイヤー | トラック |
| ブランチ/PR | 最小 / minimal | 不使用 / none | 不使用 / none | 不使用 / none |

---

## 1. 要件定義の変遷 / Evolution of the Requirements

### 共通則:「要件は開始1時間以内に高解像度で固定。以後ほぼ改訂しない」

4作品すべてが制作開始から10分〜1時間の間に設計文書を確定させ、その後は文書をほとんど書き換えていない。

- **1位**: `ios-qa/README.md` を初回コミット(15:08)で書き、以降**一度も改訂なし**。冒頭に "The Demo Moment" の構成図まで完備。
- **2位**: 開始10分の 11:35 に `docs/design-learngraph.md` が Status: **APPROVED** で確定。3エージェントのpipeline契約・「縦切り1本(derivatives)」まで明記。
- **3位**: 14:08 に GStack の `/office-hours` skill が `DESIGN.md` を自動生成。
- **4位**: 12:32 に `CLAUDE.md`(仕様書)を投入。トラック所有権・作業単位 A.0–A.7・「100秒デモから逆算せよ」まで最初から明記。

**注目**: 2位・3位は GStack 標準の `/office-hours` skill に設計文書を書かせている。要件定義そのものを AI に高速で起草させ、人間が悩む時間をほぼゼロにした。

### Common rule: "Lock the requirements at high resolution within the first hour, then barely touch them"

All four projects finalized a design document within 10 minutes to 1 hour of starting, and hardly rewrote it afterward.

- **1st**: Wrote `ios-qa/README.md` in the very first commit (15:08) and **never revised it once**. It already contained a "The Demo Moment" diagram up front.
- **2nd**: At 11:35, just 10 minutes in, `docs/design-learngraph.md` was locked at Status: **APPROVED**. It specified the 3-agent pipeline contract and the "single vertical slice (derivatives)" down to detail.
- **3rd**: At 14:08, GStack's `/office-hours` skill auto-generated `DESIGN.md`.
- **4th**: At 12:32, they dropped in `CLAUDE.md` (the spec). From the start it spelled out track ownership, work units A.0–A.7, and the principle "build backward from the 100-second demo."

**Note**: The 2nd and 3rd place teams had GStack's standard `/office-hours` skill write the design document itself — they had AI rapidly draft the requirements, reducing human deliberation time to nearly zero.

### ピボットは「要件」ではなく「実装の焦点」で起きる / Pivots happen in the "implementation focus," not the "requirements"

要件文書(=何を作るか)は固定されたまま、実装レベルの方向転換が制作中に起きた。動機はほぼ全て「デモを速く・強くするため」。

- **2位のGBrain撤去(16:59)**: 製品の元テーゼの中核だった記憶層を、デモのレイテンシのボトルネックと判断して**丸ごと撤去**(route.ts を163→38行)。
- **3位の3連続ピボット**: USBシリアル→BLE無線化、2D座標ハードコード→本格6DOF+逆運動学、CAPTCHAクリック→「水のボトルを倒す」実物体操作。
- **1位のみピボットなし**: 要件を初手で固め切り、`feat→perf→fix→feat(demo)` と一方向に深化。

The requirement document (what to build) stayed fixed, while implementation-level course changes happened mid-build. The motive was almost always "to make the demo faster and stronger."

- **2nd place's GBrain removal (16:59)**: They judged the memory layer — the very core of the product's original thesis — to be a demo-latency bottleneck and **ripped it out entirely** (route.ts from 163 → 38 lines).
- **3rd place's three consecutive pivots**: USB serial → BLE wireless, 2D hardcoded coordinates → full 6DOF + inverse kinematics, CAPTCHA-clicking → real-object manipulation ("knock over the water bottle").
- **1st place had no pivots**: They nailed the requirements from the first move and deepened in one direction: `feat → perf → fix → feat(demo)`.

---

## 2. プロジェクト進行プロセス / The Project Process (granularity → presentation)

### 全作品に共通する3フェーズ構造

Git履歴のコミット密度を時系列で見ると、4作品すべてが同じ3段を踏んでいる。

```
序盤(最初の30分〜1時間)  骨格を一気に投下 + 設計文書を確定
      ↓
中盤(数時間)             本体実装 + 速度/安定性の作り込み
      ↓
終盤(締切前2〜3時間)      新機能を止め、デモ体験の磨き込みに全振り
```

- **序盤の立ち上がりが異常に速い**: 2位は最初の38分で骨格完成(スキャフォールド→モックSSE→実エージェント→テスト→デプロイ設定)。1位は初回コミットが既に1,553行(コミット前にローカルで作り込み済み)。
- **終盤は例外なく「デモ磨き」に全振り**: 2位は締切前3時間が全て `fix(...)` で**新機能ゼロ**。1位は demo mode・タップ波紋アニメ・"Claude is debugging" 青枠オーバーレイ・warm startキャッシュ(締切37分前に819行)。3位は締切直前にスポンサー4社の実働統合を滑り込み。

### A common 3-phase structure across all projects

Looking at commit density over time, all four projects went through the same three stages:

```
Early (first 30–60 min)   Dump the skeleton all at once + lock the design doc
      ↓
Middle (a few hours)      Build the core + harden speed/stability
      ↓
Late (last 2–3 hrs)       Stop new features, go all-in on polishing the demo experience
```

- **The early ramp-up was abnormally fast**: 2nd place had the skeleton done in the first 38 minutes (scaffold → mock SSE → real agents → tests → deploy config). 1st place's first commit was already 1,553 lines (built locally before committing).
- **The late phase was, without exception, all-in on "demo polish"**: 2nd place's last 3 hours were all `fix(...)` with **zero new features**. 1st place added demo mode, a tap-ripple animation, a "Claude is debugging" blue-frame overlay, and a warm-start cache (819 lines, 37 min before the deadline). 3rd place slipped in live integrations for 4 sponsors right before the buzzer.

### 「デモから逆算」が明文化されている / "Work backward from the demo" is written down

複数作品が設計文書にデモ起点の設計原則を明記していた。ライブ障害への保険も徹底(4位はデモ用フィクスチャを事前計算してコミットし DEMO_MODE で読む設計)。

- 4位 CLAUDE.md: 「build backward from the 100-second demo」
- 2位 design doc: 「pipeline IS the demo」「judges are the primary audience」
- 3位 run_task.py: 「観客がいる。カリスマ的に思考を実況し、見せつけろ」

Several projects wrote a demo-first design principle right into the design doc. They also thoroughly insured against live failures (4th place pre-computed demo fixtures, committed them, and read them via DEMO_MODE).

- 4th place CLAUDE.md: "build backward from the 100-second demo"
- 2nd place design doc: "pipeline IS the demo," "judges are the primary audience"
- 3rd place run_task.py: "There's an audience. Narrate your thinking charismatically and show off."

---

## 3. 開発の役割分担 ★核心 / Division of Roles ★the crux

### 結論:勝者は「スキルごと」ではなく「レイヤー/トラックごと」に分けた

仮説の検証:

- **(a)「スキルだけ作るとフロント/バック/ピッチで割りにくい」→ 正しい。** だから誰もその軸で割っていない。
- **(b)「スキルごとに分担」→ 勝者はこの方式を採らなかった。** 3名の4位ですら、スキル6本を1人が全部書いた。
- **(c)「しっかり動く大きめの要件で設計」→ 正しい。** 大きい要件を捌けたのは、分担を「レイヤー(所有権が重ならない層)」で切ったから。

### Conclusion: the winners split by "layer/track," not "by skill"

Testing the hypotheses:

- **(a) "If you only make skills, it's hard to split into frontend/backend/pitch" → Correct.** That's exactly why nobody split along that axis.
- **(b) "Divide by skill" → The winners did not use this method.** Even the 3-person 4th place team had one person write all 6 skills.
- **(c) "Designed with a solid, sizable set of requirements" → Correct.** They could handle big requirements because they cut the division by "layer" (strata whose ownership doesn't overlap).

### 各作品の実データ / Per-project data

**1位(ソロ)**: 単独制作。gstackのスキル規約に寄生し、約4.7時間で動くSwiftデバッグブリッジ入り5スキルを一点突破。→ 1人なら分担問題は消える。「既存プラットフォームに乗る」ことで1人でも大きく作れた好例。

**2位(2名・完全分業)**: Nicolas=バックエンド/エージェント9本/テスト13本/インフラ(`src/`)、oski=フロントエンド専任(`public/` のバニラJS、バックエンド接触1回のみ)。ディレクトリ境界=人の境界。

**3位(2名・完全分業)**: Anish=Pythonコアエンジン全部(+6291行)+テスト、Jake=README/デモHTML/設計文書/物語/スポンサー統合。ファイル境界=人の境界。

**4位(3名・トラック分業)** ※仮説に最も近いが実態はより徹底: 開始1時間で Rayan が `CLAUDE.md` に **「Track ownership — 編集していい/ダメなファイル」の境界を明文化**してから並行作業。Rayan=スキル実装レイヤー丸ごと(6スキル全部)、Keshav=データ/コーパス228本/API連携レイヤー丸ごと、Rushil=拡張(別リポ)+発表。**スキル単位ではなくレイヤー単位**。

**1st (solo)**: A single builder. Riding gstack's skill conventions, they broke through with 5 skills containing a working Swift debug bridge in ~4.7 hours. → With one person, the division problem disappears. A great example of building big even solo by "riding an existing platform."

**2nd (2 people, fully divided)**: Nicolas = backend / 9 agents / 13 tests / infra (`src/`); oski = frontend only (vanilla JS in `public/`, touched backend just once). Directory boundary = person boundary.

**3rd (2 people, fully divided)**: Anish = the entire Python core engine (+6,291 lines) + tests; Jake = README / demo HTML / design docs / narrative / sponsor integrations. File boundary = person boundary.

**4th (3 people, track division)** — closest to the hypothesis, but even more disciplined in practice: Within the first hour, Rayan wrote **an explicit "Track ownership — files you may / may not edit" boundary into `CLAUDE.md`** before parallel work began. Rayan = the entire skill-implementation layer (all 6 skills), Keshav = the entire data/corpus (228 essays)/API-integration layer, Rushil = the extension (separate repo) + presenting. **By layer, not by skill.**

### 共通する協働の型 / The shared collaboration pattern

- **ブランチもPRも使わない**(4作品中3作品)。全員 `main` に直push。頻繁な `git pull` によるリアルタイム手動統合。
- **衝突しないのは偶然ではなく設計**。「担当するファイル/ディレクトリの境界を最初に引く」→ その境界どおりに触る、を徹底したから。短時間ではPRレビューの往復がむしろ足かせになる。

- **No branches, no PRs** (3 of the 4 projects). Everyone pushed directly to `main`, integrating manually in real time via frequent `git pull`.
- **The absence of conflicts was by design, not luck.** They rigorously "drew the file/directory ownership boundaries first," then touched only within them. In a short sprint, PR-review round-trips are more of a hindrance.

---

## 総括:上位4作品に共通する「勝ち筋」 / Summary: the winning formula shared by the top 4

1. **開始1時間以内に高解像度の設計文書を確定させる**(しかも `/office-hours` のようなAIスキルに起草させて人間の逡巡時間をゼロにする)。要件は固定、以後改訂しない。
2. **分担は「スキルごと」ではなく「レイヤー/トラックごと」に、編集境界を明文化してから切る**。境界がファイルパスで分離するので、ブランチもPRも要らず、全員main直pushで衝突ゼロ。1人はエンジン(深く)、1人はデモ/物語(高頻度で)。
3. **「デモから逆算」を設計原則として明文化**。中盤で本体を作り、終盤2〜3時間は新機能を止めてデモ体験の磨き込み・速度最適化・ライブ障害の保険に全振り。
4. **製品の元テーゼすら「デモのボトルネック」なら終盤に捨てる割り切り**(2位のGBrain撤去)。要件は固定でも実装の焦点はデモのためにOODA的に何度でも動かす。

1. **Lock a high-resolution design doc within the first hour** (and have an AI skill like `/office-hours` draft it, cutting human deliberation to zero). Fix the requirements and don't revise them afterward.
2. **Divide by "layer/track," not "by skill," and only after writing the edit boundaries down.** Because the boundaries separate cleanly along file paths, you need no branches or PRs — everyone pushes directly to `main` with zero conflicts. One person owns the engine (deep), another owns the demo/narrative (high frequency).
3. **Write "work backward from the demo" in as a design principle.** Build the core in the middle phase; in the final 2–3 hours stop new features and go all-in on polishing the demo experience, optimizing speed, and insuring against live failures.
4. **The resolve to drop even the product's original thesis in the final phase if it's a "demo bottleneck"** (2nd place's GBrain removal). Requirements stay fixed, but the implementation focus moves OODA-style, as many times as the demo needs.

---

*出典: 各リポジトリのフルヒストリ Gitフォレンジック解析(2026-07-05実施)。ローカルクローンは scratchpad/hackathon-repos/ に保持。*
*Source: Full-history Git forensic analysis of each repository (conducted 2026-07-05). Local clones retained under scratchpad/hackathon-repos/.*
