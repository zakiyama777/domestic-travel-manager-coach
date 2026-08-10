# 問題投入ガイド（Tabi Study）

このドキュメントは「**最短で問題を増やすための運用マニュアル**」です。
CSV または JSON で問題ファイルを書き、1 コマンドでアプリに反映させます。

---

## TL;DR（30 秒で投入する手順）

1. `content/questions/` に CSV もしくは JSON を置く
2. `npm run build:questions` を実行
3. `npm run dev`（または `npm run build && npm start`）
4. 学習画面（`/learn/binary`, `/learn/quad`）と `/review` に自動反映

---

## 1. ディレクトリ構成

```
content/questions/
├── seed-binary-law.csv        # 2択 × 旅行業法令
├── seed-binary-terms.csv      # 2択 × 約款
├── seed-binary-practice.csv   # 2択 × 実務
├── seed-quad-law.csv          # 4択 × 旅行業法令
├── seed-quad-terms.csv        # 4択 × 約款
├── seed-quad-practice.csv     # 4択 × 実務
└── sample.json                # JSONサンプル（混在可能）
```

ファイル名の規則は厳密ではありません。`.csv` または `.json` であれば自動スキャンされます。
サブディレクトリも再帰的に読まれます。

ビルド生成物:

```
lib/question-bank/
├── data.ts        # 自動生成。ランタイムが読むファイル（編集禁止）
└── summary.json   # 件数・エラーのサマリ（human readable）
```

---

## 2. CSV の列定義

必須列（順不同）:

| 列名 | 型 | 必須? | 説明 |
| --- | --- | --- | --- |
| `id` | string | ✅ | 一意。例: `law-b-0001`, `terms-q-0042` |
| `type` | `binary` \| `quad` | ✅ | 問題形式 |
| `subject` | `law` \| `terms` \| `practice` | ✅ | 科目 |
| `topic` | string | ✅ | 細分トピック（例: `旅程管理主任者`） |
| `question` | string | ✅ | 問題文。binary は ○× 判定する文 |
| `correctAnswer` | string/number | ✅ | 正解（下の書き方参照） |
| `explanation` | string | ✅ | 解説 |

追加列（任意）:

| 列名 | 型 | 説明 |
| --- | --- | --- |
| `choice1`〜`choice4` | string | **quad のときのみ必須**。4択の各選択肢 |
| `difficulty` | 1\|2\|3 | 未指定は 2 扱い |
| `sourceYear` | number | 出題年（例: 2022） |
| `sourceLabel` | string | 出典ラベル（例: `2023年 本試験 問1`） |
| `tags` | string | `|` 区切り（例: `JR|学割`） |
| `isActive` | true/false | `false` で配信停止。未指定は true |

CSVヘッダー行サンプル:

```
id,type,subject,topic,question,choice1,choice2,choice3,choice4,correctAnswer,explanation,difficulty,sourceYear,sourceLabel,tags,isActive
```

### CSV の注意点

- **カンマを含むセルは `"..."` でクォート**してください（例: `"1,500万円"`）
- 改行を含みたい場合もクォートで囲み、内部改行のままでOK
- 列の順序は自由（ヘッダー名でマッピング）

### `correctAnswer` の書き方

| 形式 | 受け付ける表記 |
| --- | --- |
| `binary` | `true` / `false` / `1` / `0` / `o` / `x` / `○` / `×` / `yes` / `no` |
| `quad` | `1` / `2` / `3` / `4` / `A`〜`D` / `ア`〜`エ` |

大文字小文字は無視。日本語記号もそのまま使えます。

---

## 3. JSON の書き方

`content/questions/` 配下に `.json` を置くと、以下のどちらの形でも読めます。

```jsonc
{
  "questions": [
    {
      "id": "sample-b-0001",
      "type": "binary",
      "subject": "law",
      "topic": "取扱管理者の選任",
      "question": "旅行業者は、営業所ごとに旅行業務取扱管理者を2名以上選任しなければならない。",
      "correctAnswer": "false",
      "explanation": "必要なのは1名以上です。",
      "difficulty": 1,
      "tags": ["取扱管理者"]
    },
    {
      "id": "sample-q-0001",
      "type": "quad",
      "subject": "practice",
      "topic": "日本三景",
      "question": "次のうち、日本三景に含まれないものはどれか。",
      "choices": ["松島", "天橋立", "宮島", "石見銀山"],
      "correctAnswer": 4,
      "explanation": "日本三景は松島・天橋立・宮島。",
      "difficulty": 1
    }
  ]
}
```

または素直な配列形式 `[ { ... }, { ... } ]` でも OK。

---

## 4. 実行方法

```bash
# 問題をビルド（CSV/JSON → lib/question-bank/data.ts）
npm run build:questions

# 開発起動
npm run dev

# 本番ビルド（build:questions が自動で先に走る）
npm run build
```

成功時の出力例:

```
[build-question-bank] ✅ done
  input files : 7
  total rows  : 92
  accepted    : 92 (binary 61 / quad 31)
  duplicates  : 0
  errors      : 0
```

---

## 5. エラーが出たとき

build script は**エラーがあってもプロセスを落としません**（残りの問題を書き出すため）。
エラーは `summary.json` と標準出力の両方に出ます。

よくある失敗:

| メッセージ | 原因 | 直し方 |
| --- | --- | --- |
| `binary correctAnswer invalid: "..."` | 正解列がパース不能（カンマ紛れ等） | セルを `"..."` でクォート |
| `quad needs exactly 4 non-empty choices` | choice1〜4 のどれかが空 | 4 つ全部埋める |
| `subject must be law|terms|practice` | 科目コードがtypo | 値を確認 |
| `duplicate id` | id が他のレコードと衝突 | 別のidに変更 |
| `type must be binary|quad` | 形式タイポ | 値を確認 |

エラーがあった行は **スキップされるだけ** で、その他は正しく投入されます。

---

## 6. 重複IDの扱い

- build script は先着優先。最初に見つかった id を採用し、以降の同一 id はスキップ。
- どちらが先かはファイルのソート順に依存するので、**idは重複しないように命名規則を決めておく**のが安全です。
- 推奨命名:
  - `law-b-0001` (旅行業法令 × 2択 × 連番)
  - `terms-q-0042` (約款 × 4択 × 連番)

---

## 7. 反映先

投入後、以下の画面で自動的に読み出されます:

| 画面 | 使う問題 | 備考 |
| --- | --- | --- |
| `/learn/binary` | `type=binary`, `isActive!=false` | シャッフルして最大 10 問 |
| `/learn/quad` | `type=quad`, `isActive!=false` | シャッフルして最大 5 問 |
| `/review` | `topic` ベースの一覧 | 進捗と連動（将来 `question-bank` の topic を自動集計予定） |
| Dashboard | 総合進捗 | `progressRepository` 経由 |

---

## 8. 投入ワークフロー（おすすめ）

1. **Excel / Google Sheets で編集** → CSV エクスポート
2. `content/questions/` に投入
3. `npm run build:questions` で検証
4. エラーがあれば `summary.json` を見て修正
5. `npm run dev` で表示確認
6. OK なら commit（`content/` と `lib/question-bank/data.ts` を一緒にコミットすると、他環境でもすぐ動く）

---

## 9. Firebase との関係

- 問題データ本体は**アプリバンドル同梱**（`lib/question-bank/data.ts`）です
- Firestore には **学習結果・進捗・セッションのみ**が保存されます
- 大規模運用に移行する際は、`question-bank` を Firestore `questions/` コレクションに移行予定
- 現状は「最短で問題を増やす」ことを優先し、静的バンドルで十分

---

## 10. 将来の拡張ポイント

- [ ] `build:questions --check` で CI 上の検証のみ実行
- [ ] `tags` や `sourceYear` でのフィルタをUIに露出
- [ ] PDF/Word からの半自動取り込み（現段階では CSV 経由を推奨）
- [ ] admin UI からの直接投入（Firestore に寄せた段階で）

---

## 11. 過去問（過去問カテゴリ）の投入

過去問は `content/past-exams/` に年度単位の JSON を置きます。
スキーマ／ビルド／配信は ○×・4 択とは**別バンク**で独立しており、
既存の binary / quad の配信に影響しません。

### ディレクトリ

```
content/past-exams/
  R03.json      ← 令和3年度
  R04.json      ← 令和4年度（任意）
  ...
```

### JSON スキーマ（最小）

```json
{
  "_meta": {
    "year": "R03",
    "label": "令和3年度 (2021) 国内旅行業務取扱管理者試験",
    "westernYear": 2021,
    "source": "令和3年度 国内旅行業務取扱管理者試験 問題・解答（R03mondai.pdf / R03kaitou_2.pdf）を基に作成。"
  },
  "questions": [
    {
      "id": "pe-R03-law-01",
      "category": "past_exam",
      "year": "R03",
      "section": "law",
      "originalQuestionNumber": 1,
      "question": "…問題文…",
      "choices": ["…", "…", "…", "…"],
      "correctAnswer": 2,
      "explanation": "…解説…",
      "sourceLabel": "令和3年度 国内旅行業務取扱管理者試験 旅行業法 問1"
    }
  ]
}
```

### 必須フィールド

- `id` / `category: 'past_exam'` / `year` / `section` (law|terms|practice)
- `originalQuestionNumber` / `question` / `choices[]`
- `correctAnswer`（0-origin のインデックス。複数解は `[0,2]` のように配列）
- `explanation` / `sourceLabel`

### 任意フィールド

- `isActive`（false にするとその問題は出題停止）
- `subSection` / `topic` / `difficulty` / `tags` / `sourcePage`
- `createdAt` / `updatedAt`

### ビルド

```
npm run build:questions
```

出力:

- `lib/question-bank/past.ts`（`BANK_PAST`）
- `lib/question-bank/past-summary.json`

### UI

- `/past` — 年度一覧
- `/past/[year]` — 科目（law / terms / practice / all）選択
- `/past/[year]/[section]` — 原問順の問題演習（回答・解説・進捗記録）

### 進捗記録

過去問の正答／誤答は既存の `progressRepository.recordAnswer`
を使って科目（section）・トピック（`topic` または `{year} 問N`）で蓄積し、
そのまま Firestore ミラーへも反映されます（ローカルファースト）。
