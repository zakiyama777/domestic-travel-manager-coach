/**
 * Firestore のドキュメント / コレクションパスを 1 箇所に集約。
 * ============================================================
 *  users/{uid}                               … profile
 *  users/{uid}/progress/state                … 進捗 (単一ドキュメント)
 *  users/{uid}/sessions/active               … 中断セッション (単一ドキュメント)
 *
 *  当面は「既存 repository が扱う ProgressState / LearningSession を
 *   丸ごと 1 ドキュメントに入れる」最小構成。
 *   日次ブレイクダウンが必要になったら
 *   users/{uid}/progress/{yyyy-mm-dd} に分割する。
 * ============================================================
 */

import type { Firestore } from 'firebase/firestore';
import { doc } from 'firebase/firestore';

export const userDoc = (db: Firestore, uid: string) => doc(db, 'users', uid);

export const progressDoc = (db: Firestore, uid: string) =>
  doc(db, 'users', uid, 'progress', 'state');

export const sessionDoc = (db: Firestore, uid: string) =>
  doc(db, 'users', uid, 'sessions', 'active');

export const FIRESTORE_PATHS = {
  user: (uid: string) => `users/${uid}`,
  progress: (uid: string) => `users/${uid}/progress/state`,
  session: (uid: string) => `users/${uid}/sessions/active`,
} as const;
