# PDF → JSON Past-Exam Import Pipeline

半自動で過去問PDF（`content/past-exams/_raw/*.pdf`）から `content/past-exams/{R03-R07}.json` を再生成するためのユーティリティ群です。通常は既存の JSON を直接編集すれば十分で、このスクリプトは **PDFを差し替えた場合** や **パース精度を上げたい場合** のみ再実行します。

## 前提

```bash
sudo apt-get install -y poppler-utils  # pdftotext を提供
pip install pymupdf pypdf pdfplumber
```

## 使い方

```bash
# 1) 全PDFをテキスト抽出（/tmp/exam_txt に出力）
cd /home/user/webapp
mkdir -p /tmp/exam_txt
for f in content/past-exams/_raw/R0*mondai*.pdf content/past-exams/_raw/R0*mondairei*.pdf; do
  name=$(basename "$f" .pdf)
  pdftotext -layout "$f" "/tmp/exam_txt/${name}_poppler.txt"
done

# 2) 解答PDF → answer-key JSON
python3 scripts/pdf-import/parse-answers.py   # /tmp/parse/answers.json を出力

# 3) 問題PDF + 解答を結合して最終JSON生成
python3 scripts/pdf-import/build-past-exam-jsons.py  # content/past-exams/*.json を出力

# 4) 問題バンク再ビルド
npm run build:questions
```

## ファイル構成

- `parse-answers.py` — `R0X_kaitou_2.pdf` / `R0X_kaitourei_2.pdf` から正解を座標ベースで抽出。法令・約款各25問、実務は親・サブ番号付き構造で出力。
- `parse-old-mondai.py` — R03〜R05（令和3〜5年度 本試験）用。段組抽出＋ `(N)` 区切りで問題を分割し、`ア/イ/ウ/エ` 選択肢を抽出。約款の第2〜6サブセクションも処理。
- `parse-new-mondai.py` — R06〜R07（令和6〜7年度 出題例）用。`問N` + `ア．` 形式のクリーンなテキストを処理。
- `build-past-exam-jsons.py` — 上記を統合して `content/past-exams/{R03,R04,R05,R06,R07}.json` を生成。文字化けの正規化（`第○条`, `1つ選びなさい` 等）も実行。

## 既知の制約

- **小さな丸数字**（`第1条`の`1`など）は PDF フォント埋め込みの都合で抽出できず、 `○` に置換されます。
- **国内旅行実務**（section=practice）の問題には時刻表・料金表・地図などの図表問題が含まれ、本文のみでは解けない問題が多数あります。 JSON の `explanation` には必ず公式PDF（`content/past-exams/_raw/*mondai.pdf`）を参照するよう記載しています。
- **複数正解**（`ア・エ` 等）は `correctAnswer: [0, 3]` のように配列で保存。

## JSONスキーマ

`lib/types/past-exam.ts` 参照。
