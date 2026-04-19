# Firebase Implementation Skeleton

このディレクトリは **将来の Firebase / Firestore 差し替え用プレースホルダ** です。
現在はすべての Repository が `lib/repositories/*.repository.ts` (localStorage / in-memory mock)
で実装されています。

## 切り替えの手順 (予定)

1. `firebase` SDK を `package.json` に追加 (`firebase` v10 系)
2. `lib/firebase/client.ts` を作成し `initializeApp` + `getFirestore` / `getAuth` を export
3. 以下のファイルを作成 (シグネチャは `lib/repositories/types.ts` を満たす):
   - `question.firebase.ts` — `questions/` コレクション参照
   - `stats.firebase.ts` — `users/{uid}/stats` を集計
   - `user.firebase.ts` — `users/{uid}` ドキュメント + `onAuthStateChanged`
4. `lib/repositories/index.ts` の import を差し替える:

   ```ts
   export { questionRepositoryFirebase as questionRepository } from './firebase/question.firebase';
   export { statsRepositoryFirebase   as statsRepository   } from './firebase/stats.firebase';
   export { userRepositoryFirebase    as userRepository    } from './firebase/user.firebase';
   ```

5. `progress` / `session` は **端末ローカル優先** のまま残す想定です
   (オフラインファースト + 起動速度のため)。必要であれば Firestore へミラーリングする
   `progress.mirror.firebase.ts` を追加します。

## コレクション設計 (下書き)

```
users/{uid}
  displayName, examDate, dailyGoalMinutes, dailyGoalQuestions, onboarded, createdAt

users/{uid}/answers/{answerId}
  questionId, correct, answeredAt, elapsedMs

users/{uid}/stats/daily/{yyyy-mm-dd}
  answered, correct, estimatedMinutes

questions/{questionId}
  format, subject, topic, statement | prompt, answer(Boolean) | answerIndex, explanation, difficulty
```

## 注意

- 本ディレクトリ配下のファイルは **まだ import されていません** (ビルドに影響しません)
- 実装着手時は必ず `types.ts` を見て interface を一致させる
- ルールはクライアント側で `submitAnswer` から直接書かず、Cloud Functions 経由で
  スコアリング + 書き込みするのが推奨 (改竄防止)
