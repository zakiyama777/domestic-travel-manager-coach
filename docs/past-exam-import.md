# 過去問投入ガイド（Past Exam Import）

このドキュメントは、**国内旅行業務取扱管理者試験の過去問を年度単位で追加・運用する最短手順**をまとめたものです。
「美しい設計」より「今すぐ問題を増やせる構造」を優先しています。

---

## TL;DR（3〜5 分で 1 年度追加）

```bash
# 1. テンプレをコピー
cp content/past-exams/_templates/RXX.template.json content/past-exams/R04.json

# 2. R04.json を編集（year / westernYear / questions[] を実データに差し替え）

# 3. ビルド
npm run build:questions

# 4. 画面確認
npm run dev
# → /past, /past/R04, /past/R04/law などを開く
```

---

## 1. ディレクトリ構成

```
content/past-exams/
  R03.json          # 令和3年度（本試験）
  R04.json          # 令和4年度（本試験）
  R05.json          # 令和5年度（本試験）
  R06.json          # 令和6年度（出題例）
  R07.json          # 令和7年度（出題例）
  _templates/
    RXX.template.json   # 年度追加用テンプレ
```

- `_templates/` 配下はビルド対象外（ファイル名が `_` で始まるディレクトリはスキャン除外）
- 1 年度 = 1 JSON ファイル（分割したい場合は `R03.law.json` のように分けても OK。`_meta.year` が同じなら集約される）

---

## 2. JSON スキーマ

### 2.1 ファイルの `_meta`

```jsonc
{
  "_meta": {
    "year": "R04",                              // 必須: 年度キー
    "label": "令和4年度 (2022) 国内旅行業務取扱管理者試験", // UI 表示名
    "westernYear": 2022,                        // 任意: 西暦
    "examType": "official",                     // 'official' | 'sample'
    "sourcePdfs": ["R04mondai.pdf", "R04kaitou_2.pdf"], // 出典 PDF ファイル名
    "source": "…任意の出典メモ…",
    "notes": "…運用メモ（編集者に残したいコメント）…"
  },
  "questions": [ /* ↓ */ ]
}
```

- `examType`
  - `official` — 本試験（R03〜R05 は official）
  - `sample`  — 出題例・解答例（R06・R07 は sample）
- `sourcePdfs` — 確認・照合のために原典 PDF のファイル名を残す
- `examType` は `_meta` に書いておけば、配下の `questions[]` に個別記載しなくてもその年度の既定値として使われる

### 2.2 1 問の構造（questions[]）

```jsonc
{
  "id": "pe-R04-law-01",         // 必須・グローバルユニーク
  "category": "past_exam",       // 必須・固定
  "year": "R04",                 // 必須
  "section": "law",              // 'law' | 'terms' | 'practice'
  "originalQuestionNumber": 1,   // 原問番号 (1-origin)
  "question": "問題文…",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctAnswer": 2,            // ★ 0-origin の index（例: 3番目が正解なら 2）
  "explanation": "解答根拠…",
  "sourceLabel": "令和4年度 国内旅行業務取扱管理者試験 旅行業法 問1",
  // 任意
  "examType": "official",        // 省略時は _meta.examType を継承
  "topic": "登録業務範囲",
  "subSection": "",
  "tags": ["登録", "業務範囲"],
  "difficulty": 2,
  "sourcePage": 1,
  "isActive": true
}
```

- `correctAnswer`
  - **原則 0-origin の index**（`choices[correctAnswer]` が正解）
  - ビルドスクリプトは「1–N の 1-origin」も自動で 0-origin に正規化する（選択肢数の範囲内なら）
  - 文字列指定も許容: `"1"`/`"2"`/`"3"`/`"4"`、`"A"`〜`"D"`、`"ア"`〜`"エ"`
  - 複数正答は配列: `"correctAnswer": [0, 2]`
- `id` 衝突時はビルド時に warn して後勝ち回避（スキップ）

---

## 3. PDF → JSON 化の最短ワークフロー

完全自動 OCR にこだわらず、**正しい投入が最短**。以下を推奨します。

### 3.1 R03 を例に（本試験）

1. AI Drive の `R03mondai.pdf` を開く
2. AI Drive の `R03kaitou_2.pdf` を開いて正答表を確認
3. テンプレをコピー: `cp _templates/RXX.template.json R03.json`
4. `_meta.year = "R03"`, `westernYear = 2021`, `examType = "official"` に書き換え
5. `questions[]` を 1 問ずつ埋める
   - 問題文・選択肢は PDF の本文をそのまま貼る（改行は `\n` に変換）
   - `correctAnswer` は解答表から **0-origin の index** に変換して書く
6. `explanation` は最低限の根拠で OK（例: 「旅行業法第6条の3」）
7. `npm run build:questions` を実行
8. エラー／警告が出たらメッセージを見て JSON を修正
9. `npm run dev` で `/past/R03/law` などを目視確認

### 3.2 R06・R07 のような「出題例」

- `_meta.examType = "sample"` にする
- ファイル名の規則は本試験と同じでよい（例: `R06.json`）
- UI 上では自動的に「出題例」バッジが出る

---

## 4. ビルドと配信

```bash
npm run build:questions
```

出力:
- `lib/question-bank/past.ts`（`BANK_PAST` と `BANK_PAST_META`）
- `lib/question-bank/summary.json`（`past` セクション）

ランタイム:
- `/past` — 年度一覧（R07 → R03 の新しい順）
- `/past/[year]` — 科目選択（law / terms / practice / all）
- `/past/[year]/[section]` — 原問順の問題演習（回答・解説・進捗記録）
- `/past/mix` — 年度横断ランダム 10 問

---

## 5. よくあるエラーと対処

| エラー | 原因 | 対処 |
|---|---|---|
| `id is required` | `id` が空 | `pe-RYY-law-NN` などを付ける |
| `year is required` | `year` が空 | `_meta.year` と行の `year` を一致させる |
| `section must be law\|terms\|practice` | typo | `law` / `terms` / `practice` のいずれかに |
| `originalQuestionNumber must be a positive integer` | 文字列 / 0 | 1 以上の数値に |
| `at least 2 choices are required` | 空配列 | `choices` を 2 個以上 |
| `correctAnswer invalid` | 想定外文字 | 数値 (0-origin / 1-origin) もしくは A–D / ア–エ |
| `correctAnswer out of range` | `choices.length` 超過 | インデックスが 0〜N-1 の範囲か確認 |
| `duplicate id` | 同一 ID | 年度/科目/問番号を含むユニーク ID に |

---

## 6. 命名規則（推奨）

- **ID**: `pe-{year}-{section}-{NN}`（例: `pe-R04-law-01`）
  - `NN` は 2 桁ゼロ埋め推奨（ソートのため）
- **`sourceLabel`**: `令和{N}年度 国内旅行業務取扱管理者試験 {section名} 問{番号}`
- **`topic`**: 短く。例: `登録業務範囲` / `取消料` / `JR運賃`
- **`tags`**: `|` 区切り（CSV 時）または配列。横断検索のメタ

---

## 7. R03〜R07 の整備状況メモ（公式PDFから半自動抽出）

2026-04 時点での正規データ（公式 PDF → JSON 半自動変換）：

| 年度 | examType | 投入件数 | 内訳 |
|---|---|---|---|
| R03 | official | **86 問** | law 25 / terms 25 / practice 36 |
| R04 | official | **81 問** | law 25 / terms 25 / practice 31 |
| R05 | official | **86 問** | law 25 / terms 25 / practice 36 |
| R06 | sample   | **67 問** | law 25 / terms 25 / practice 17 |
| R07 | sample   | **68 問** | law 25 / terms 25 / practice 18 |
| **合計** | | **388 問** | law 125 / terms 125 / practice 138 |

### 変換の特徴と制約

- **Section 1 (法令)・Section 2 (約款) は全 25 問ずつ、本文＋4 択＋正解を抽出**
- **Section 3 (国内旅行実務)** は問題本文と選択肢、正解を抽出。ただし：
  - 時刻表・運賃表・料金表・地図など**図表問題の資料は JSON に含めていない**
  - 各 `explanation` に「公式 PDF の図表も参照してください」と明記
  - 計算問題は数値のみで成立するものは通常プレイ可
- **複数正解**（「ア・エ」「ア・イ・ウ・エ」等）は `correctAnswer: [0, 3]` のように配列で保存
  - UI は既に配列形式をサポート（`lib/question-bank/data.ts` / `app/(app)/past/...`）
- **小さな丸数字** (第 1 条の `1` など) は PDF フォント埋め込みの都合で文字化けが発生するため、
  `第○条` `第○項` のように `○` で置換。本文の意味は保持されている

### 原典と抽出パイプライン

- 元 PDF：`content/past-exams/_raw/*.pdf`（本試験問題・解答・実施状況）
- 抽出中間テキスト：`content/past-exams/_raw/txt/*_poppler.txt`
- 変換スクリプト：`scripts/pdf-import/` （`parse-answers.py` / `parse-old-mondai.py` / `parse-new-mondai.py` / `build-past-exam-jsons.py`）
- 詳細は `scripts/pdf-import/README.md` 参照

### 修正方法

問題文や選択肢の文字化けを見つけたら、直接 `content/past-exams/RYY.json` を編集して `npm run build:questions` を打てば即反映。スキーマ通りであれば自動で JSON と UI が連動します。

---

## 9. Firebase 同期との整合

- 過去問データ本体は**アプリバンドル同梱** (`lib/question-bank/past.ts`)
- 回答結果は既存の `progressRepository.recordAnswer({ subject: section, topic, correct })` 経由で
  LocalFirst + Firestore mirror として蓄積
- ○× / 4 択 の既存進捗と**同じストアに乗る** (混線しない: section = 科目 / topic = トピック or 年度+問番号)
- オフラインでもローカルに記録され、オンライン復帰で自動 mirror
- 既存 `sessionRepository` との連携は未接続（過去問は基本ステートレス進行で十分）

---

## 10. 年度追加チェックリスト（1 年度 5 分）

- [ ] `content/past-exams/RYY.json` を作成
- [ ] `_meta.year = "RYY"` と全 question の `year` が一致
- [ ] `examType` が適切（official or sample）
- [ ] ID が全問でユニーク (`pe-RYY-section-NN`)
- [ ] `correctAnswer` が `choices.length` の範囲内
- [ ] `sourceLabel` が原典と一致
- [ ] `npm run build:questions` でエラー 0 / 重複 0
- [ ] `/past/RYY` が表示される
- [ ] `/past/RYY/law` で最初の問題が解ける
- [ ] `/past/mix` に混ざってくる
- [ ] `npx tsc --noEmit` と `npm run build` が通る
