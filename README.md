# Tabi Study — 国内旅行業務取扱管理者

国内旅行業務取扱管理者試験のための、静かな学習体験を目指す PWA 学習アプリ。

## Tech

- Next.js 14 (App Router) / React 18 / TypeScript
- Tailwind CSS / shadcn/ui
- Framer Motion
- Data layer: Repository pattern (現在は in-memory mock + localStorage、将来 Firestore 差し替え)

## Getting Started

```bash
npm install
npm run dev
```

http://localhost:3000 で開きます。初回は `/onboarding` へ自動遷移します。

## Scripts

| command | 用途 |
|---|---|
| `npm run dev` | 開発サーバ (Next.js dev, hot reload) |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバ起動 |
| `npx tsc --noEmit` | 型チェックのみ |

## Directory

```
app/                Next.js App Router (ルーティング & レイアウト)
  (app)/              認証後のメイン領域 (下部ナビあり)
    dashboard/
    learn/binary/     2択モード
    learn/quad/       4択モード
    review/           弱点復習
    settings/         プロフィール編集
  onboarding/         初回オンボーディング
components/
  ui/                 shadcn/ui 基盤コンポーネント
  dashboard/ learn/ review/ nav/
features/             画面別の hook / Provider
lib/
  repositories/       データアクセス抽象層 (mock ⇄ firebase 差し替え想定)
  mock/               ダミーデータ
  types/ constants/ utils/
```

## Roadmap

- [x] UI 基盤 v1 (本 PR)
- [ ] Firebase Auth / Firestore 接続
- [ ] 弱点分析アルゴリズム (SM-2 / 忘却曲線)
- [ ] PWA 化 (Service Worker, manifest)
- [ ] PDF 問題インポート基盤
- [ ] 通知リマインド / 課金導線

## License

Private — MVP for personal study. Not for redistribution yet.
