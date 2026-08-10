# Firebase セットアップ手順 (Tabi Study)

Tabi Study は Firebase Authentication + Firestore を利用して学習データを
クラウド同期できるように設計されています。**未設定でもアプリは動作します**
(local-only モードに自動フォールバック)。

---

## 1. 必要な環境変数

`.env.local` に以下を設定してください。`.env.local.example` をコピーして値を入れるのが最短です。

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

> **1 つでも欠けていると**、アプリは Firebase 初期化をスキップして
> ローカル保存のみで動きます (Settings 画面にもそう表示されます)。

---

## 2. Firebase Console 側の作業

### 2-1. プロジェクト作成
1. https://console.firebase.google.com で新規プロジェクト作成
2. Web アプリを追加し、表示された設定値を `.env.local` に転記

### 2-2. Authentication
1. Console > **Authentication > Sign-in method**
2. **Anonymous** を有効化 (必須)
3. 将来 Google / Email を追加するときはここでプロバイダを足すだけ

### 2-3. Firestore
1. Console > **Firestore Database > Create database**
2. モードは **Production mode** 推奨 (後でルールを反映)
3. リージョンは `asia-northeast1` (東京) など適宜

### 2-4. Security Rules
リポジトリ直下の `firestore.rules` を反映してください。

```bash
# 初回
npm i -g firebase-tools
firebase login
firebase init firestore   # 既存ルールファイルを選択
firebase deploy --only firestore:rules
```

内容は「認証済みユーザーが自分の `users/{uid}` 配下のみ read/write 可」
です。匿名認証でも uid が付与されるため、正しく隔離されます。

---

## 3. 動作確認

1. `npm run dev` で開発サーバー起動
2. `/onboarding` で呼び名・試験日を入力
3. `/settings` を開き、**データの保存先** 欄が
   - `同期済み` (緑) / `同期中…` / `同期を一時停止` (オレンジ) のいずれかになっていれば接続成功
   - `ローカル保存` のままなら env が効いていない可能性 (dev サーバー再起動必要)
4. 2 択クイズを 1 問解く → Firestore Console で
   `users/{uid}/progress/state` が生成されるのを確認

---

## 4. Google / Email サインインへの拡張 (将来)

現状は Anonymous Auth のみです。Google Sign-In を足すときは:

1. Firebase Console > Authentication > Sign-in method で Google を有効化
2. `lib/firebase/auth.ts` に `signInWithGoogle()` (`signInWithPopup`) を追加
3. `AuthProvider` に「昇格 (匿名 → Google)」フローを追加
   - `linkWithCredential()` でローカルデータを引き継ぐ
4. Settings 画面に「アカウントでログイン」ボタンを追加

匿名 uid をマージするときはデータの衝突処理が発生するため、
別スプリントで仕様を決めることを推奨します。

---

## 5. ローカル → クラウド 初回移行 (Migration)

初回 Firebase 接続時、`SyncCoordinator` が以下を自動実行します。

1. Firestore から profile / progress / session を pull
   - `remote.totals.answered > local.totals.answered` または
     local が空なら remote で上書き
2. ローカルに有効データがあれば push
3. `tabi-study:firebase-migrated:v1` に `{ [uid]: true }` を記録し、
   同じ uid での二重実行を防止

**壊れた移行を再試行したい場合** は、ブラウザの DevTools で
`localStorage.removeItem('tabi-study:firebase-migrated:v1')` すると
次回ロード時に再度 migration が走ります。

---

## 6. トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| Settings が "ローカル保存" のまま | env が空 or 読み込まれていない | `.env.local` 保存後 `dev` サーバー再起動 |
| "接続中…" のまま固まる | Firebase Auth が到達不能 / rules が不正 | DevTools Console を確認。8 秒で自動 local-only に落ちる |
| 書き込みが 1 度だけ失敗 | 一時的な通信エラー | 次回 push で自動復旧 (debounce 1.2s) |
| 書き込みが恒常的に失敗 | Firestore rules が `request.auth != null` を拒否 | `firestore.rules` を再デプロイ |
