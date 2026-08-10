/**
 * Repository DI entry point.
 * ================================================================
 *  Tabi Study のデータアクセス層。"local-first + cloud mirror" を基本方針とする。
 *
 *  - question / stats  : 現状は mock。Firebase 切替時に差し替え予定。
 *  - user              : hybrid (local を即時書き / Firestore に非同期 mirror)。
 *                        Firebase 未設定時は local のみで動作する。
 *  - progress / session: local が正本。Firestore はあくまでミラー
 *                        (use-*-quiz 内で schedulePush* が呼ばれる)。
 *
 *  UI からは常に `userRepository` / `progressRepository` / `sessionRepository`
 *  をインポートする。 Firebase 切替は index.ts 1 箇所で完結する。
 * ================================================================
 */

export { questionRepository } from './question.repository';
export { statsRepository } from './stats.repository';

// userRepository は hybrid 版を active にする (Firebase 未設定時は local only)
export { userRepositoryFirebase as userRepository } from './firebase/user.firebase';
// ローカル専用版が必要な場面 (migration / settings の reset 等) で直接利用
export { userRepository as userRepositoryLocal } from './user.repository';

export { progressRepository } from './progress.repository';
export { sessionRepository, getResumableSession } from './session.repository';

export type { QuestionRepository, StatsRepository, UserRepository } from './types';
