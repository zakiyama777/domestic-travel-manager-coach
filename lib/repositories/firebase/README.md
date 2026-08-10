# Firebase Integration — Tabi Study

このディレクトリは **Firebase (Auth + Firestore) 連携の実装本体** です。
Tabi Study は「local-first + cloud mirror」方針で運用しています。

## 役割分担

| ファイル | 役割 |
|---|---|
| `user.firebase.ts` | `UserRepository` の hybrid 実装。ローカル即時反映 + Firestore 非同期書き込み |
| `progress.firebase.ts` | 学習進捗の Firestore ミラー (debounce push + 差分 pull) |
| `session.firebase.ts` | 中断セッションの Firestore ミラー |

いずれも **ローカル (`localStorage`) が正本** で、Firestore はミラーに徹します。
Firebase が使えない場合 (env 未設定 / ネット断 / init 失敗) は、
`getFirebase()` / `currentUid()` が `null` を返すことで自動的に no-op になります。

## ディレクトリ全体像

```
lib/
  firebase/
    client.ts            # initializeApp + singleton
    config.ts            # env 読み込み + isFirebaseConfigured
    auth.ts              # ensureAnonymousUser (timeout 付き)
    firestore-paths.ts   # users/{uid}/... の doc ref を集約
  repositories/
    index.ts             # DI entry. user は hybrid 版を active にする
    user.repository.ts        # local 専用 (hybrid の下請け + migration)
    progress.repository.ts    # local 専用 (UI が sync で参照)
    session.repository.ts     # local 専用
    firebase/
      user.firebase.ts
      progress.firebase.ts
      session.firebase.ts
features/
  auth/auth-provider.tsx      # 起動時に匿名サインイン (タイムアウト付)
  sync/sync-coordinator.tsx   # 初回 pull/push と migration の実行
  sync/sync-status.ts         # UI 表示用の同期状態ストア
```

## データモデル (現状 MVP)

```
users/{uid}
  id, displayName, examDate, dailyGoalMinutes, dailyGoalQuestions,
  onboarded, createdAt, updatedAt (serverTimestamp), appVersion

users/{uid}/progress/state
  state: {
    daily: { "yyyy-mm-dd": { answered, correct, estimatedMinutes } },
    byQuestion: { [questionId]: { attempts, correct, lastAnsweredAt, subject, topic } },
    streak: { lastDate, days },
    totals: { answered, correct },
  }
  updatedAtMs  (ms, client clock, 比較用)
  updatedAt    (serverTimestamp)
  schemaVersion

users/{uid}/sessions/active
  mode: "binary" | "quad"
  questionIds: string[]
  answeredCount, correctCount
  startedAt (ms, client clock)
  updatedAtMs
  updatedAt (serverTimestamp)
```

> 将来、日次の時系列分析を厚くするときは
> `users/{uid}/progress/{yyyy-mm-dd}` に分割する予定です。
> 現状は「1 ドキュメントまとめて同期」で十分な情報量に抑えています。

## Migration

`features/sync/sync-coordinator.tsx` が auth 確立後に 1 度だけ

1. Firestore から profile / progress / session を **pull**
   - 初期比較: `remote.totals.answered > local.totals.answered` または
     `local.totals.answered === 0` ならローカルを上書き (last-write-wins)
2. 端末に `uid → migrated = true` を記録 (`tabi-study:firebase-migrated:v1`)
3. ローカルに有効データがあれば Firestore に push

...を実行します。失敗しても local は無傷なので UX に影響しません。

## Google / Email へ拡張する場合

1. `lib/firebase/auth.ts` に `signInWithGoogle()` / `signInWithEmail()` を追加
2. `AuthProvider` の `status` は `'authenticated'` に昇格
3. 匿名 uid と認証済 uid のマージは別スプリントで設計
   (Firebase の [Account Linking](https://firebase.google.com/docs/auth/web/account-linking) 相当)

## 注意点

- `progress.firebase.ts` / `session.firebase.ts` では
  Firestore 側のデータを localStorage に **直接書き戻し**ている箇所があります
  (ローカルリポジトリの interface には「setAll」がないため、スキーマキーを決め打ち)。
  これに依存しているキー:
  - `tabi-study:progress:v1`
  - `tabi-study:session:v1`
  スキーマ version を上げるときは両方同時に更新してください。

- **submitAnswer の直接書き込み** はやっていません。回答は常に
  progressRepository に集約し、その内容をまとめて push しています。
  将来 Cloud Functions で改竄検知を入れるときはここを専用 API に差し替えます。
