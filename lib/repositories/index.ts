/**
 * Repository DI entry point.
 *
 * ここで mock 実装と firebase 実装を切り替える。
 * Firebase 有効化時の想定:
 *   export { questionRepositoryFirebase as questionRepository } from './firebase/question.firebase';
 *   export { statsRepositoryFirebase    as statsRepository    } from './firebase/stats.firebase';
 *   export { userRepositoryFirebase     as userRepository     } from './firebase/user.firebase';
 *
 * progress / session は「端末ローカルで完結させるほうが UX が良い」データ
 * なので、本番でも localStorage を優先的に残す想定 (必要に応じ Firestore ミラー)。
 */
export { questionRepository } from './question.repository';
export { statsRepository } from './stats.repository';
export { userRepository } from './user.repository';
export { progressRepository } from './progress.repository';
export { sessionRepository, getResumableSession } from './session.repository';

export type { QuestionRepository, StatsRepository, UserRepository } from './types';
