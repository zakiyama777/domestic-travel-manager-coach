# CLAUDE.md — Tabi Study 開発ノート（Claude Code 向け）

このファイルは Claude Code が自動的に読み込む運用ガイドです。
最新の実装は `README.md` と `docs/` を参照してください。

## アプリ概要

- **国内旅行業務取扱管理者試験** 対策の学習 PWA
- スタック: Next.js 14 (App Router) / React 18 / TypeScript / Tailwind / shadcn/ui
- データ: Firebase Anonymous Auth + Firestore（未設定時は local-only にフォールバック）
- 永続化: LocalFirst（IndexedDB）→ オンライン復帰時 mirror

## オーナー/開発体制

- オーナー: 山崎さん（@zakiyama777, yamazaki@inbound-hd.jp）
- これまでの開発: GenSpark AI Developer（PR #1）
- 引き継ぎ後: Claude Code（このリポジトリ内のセッション）
- 主な業務言語: 日本語（出力・コミットメッセージ・PR 文章すべて日本語可）

## ブランチ運用

- 作業ブランチ: `genspark_ai_developer`
- main へは PR #1 経由で squash merge（オーナー判断待ち）
- **直接 push 禁止 / force-push は rebase 後のみ可**
- 新しい機能追加時は `genspark_ai_developer` から派生ブランチを作る案も検討

## ディレクトリ規約

| パス | 役割 | 編集 |
|---|---|---|
| `app/` | Next.js App Router pages | 編集可 |
| `components/`, `features/` | UI 部品・画面別 hook | 編集可 |
| `lib/repositories/` | データアクセス抽象層 | 編集可 |
| `content/questions/` | ○×/4択 CSV/JSON | **編集対象** |
| `content/past-exams/` | 過去問 RYY.json | **編集対象** |
| `content/past-exams/_raw/` | 原典 PDF・抽出 txt・answers.json | 編集可（追加用） |
| `content/past-exams/_templates/` | テンプレ（ビルド対象外想定） | 触らない |
| `lib/question-bank/` | **自動生成、手動編集禁止** | 触らない |
| `scripts/build-question-bank.mjs` | データ層生成スクリプト | 慎重に編集 |
| `scripts/pdf-import/` | 過去問抽出パイプライン（Python） | 慎重に編集 |

## 標準ワークフロー

### コンテンツ編集

1. `content/` 配下を編集
2. `npm run build:questions` （0 errors / 0 duplicates を確認）
3. `npx tsc --noEmit`
4. `npm run build`
5. `git commit` → `git push origin genspark_ai_developer`
6. PR #1 にコメントで進捗報告

### 過去問の追加（要 Python 環境）

詳細は `docs/past-exam-import.md` §10 チェックリスト参照。ざっくり:

```bash
# 1) mondai/kaitou PDF を _raw/ に置く
cp /path/to/RYY_mondai.pdf content/past-exams/_raw/
cp /path/to/RYY_kaitou.pdf content/past-exams/_raw/

# 2) PDF → テキスト抽出
pdftotext -layout content/past-exams/_raw/RYY_mondai.pdf

# 3) 解答パース
python3 scripts/pdf-import/parse-answers.py

# 4) JSON 構築
python3 scripts/pdf-import/build-past-exam-jsons.py

# 5) ビルド
npm run build:questions
```

**Python 環境の現状（2026-05-13 時点）:** 山崎さんの Windows には Python 未インストール。
過去問追加が必要な場合は事前に Python 3.10+ と PyMuPDF / pdftotext (poppler 版) をセットアップ。

## やってはいけないこと

- UI 構造の破壊的変更（`/past`, `/past/[year]`, `/past/[year]/[section]`, `/past/mix`）
- Firebase スキーマ変更（既存データとの互換を壊さない）
- Service Worker 大改修（PWA としての挙動が壊れるため）
- AI 生成解説の自動投入（手動レビュー必須）
- main への直接マージ（必ず PR #1 ルート）
- `lib/question-bank/` 直接編集（必ず `content/` 経由で再生成）

## 既知の課題（次スプリント候補）

1. **セキュリティ**
   - Next.js 14.2.15 → 14.2 系の最新パッチへ（脆弱性アナウンス: <https://nextjs.org/blog/security-update-2025-12-11>）
   - `npm audit` の 17 件（critical 1 / high 5 / moderate 11）対応
2. **ビルドスクリプト軽微バグ**
   - `content/past-exams/_templates/RXX.template.json` がビルドに混入（過去問 422 が 423 になる）
   - `scripts/build-question-bank.mjs` でテンプレフォルダを除外
   - `summary.json` の `sourceFiles` が絶対パスで保存されてしまう（環境依存。**相対パスに変更必要**）
3. **コンテンツ品質**
   - 国内旅行実務 figure/table の SVG/Markdown 化
   - 解説文の肉付け
   - 親子問題（R07 Q56/Q69/Q70）の子問題個別化
   - 「○」に置換された丸数字の手修正

## 環境変数（`.env.local`）

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

未設定でも local-only で動作する（README §Firebase 連携 参照）。

## 配置場所メモ（山崎さんの開発機）

- ローカルクローン: `C:\Users\yamaz\projects\株式会社インバウンドホールディングス\営業・マーケ\domestic-travel-manager-coach\`
- パスに日本語を含むため、ごく一部の古い npm パッケージで警告が出る可能性あり（実害なし）

## リファレンス

- README.md — プロジェクト概要・使い方
- docs/firebase-setup.md — Firebase 接続手順
- docs/question-import.md — ○×/4択の追加方法
- docs/past-exam-import.md — 過去問追加の詳細フロー
- PR #1: <https://github.com/zakiyama777/domestic-travel-manager-coach/pull/1>
