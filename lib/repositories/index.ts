/**
 * Repository DI entry point.
 *
 * ここで mock 実装と firebase 実装を切り替える。
 * Firebase有効化時の想定:
 *   export { questionRepositoryFirebase as questionRepository } from './question.firebase';
 */
export { questionRepository } from './question.repository';
export { statsRepository } from './stats.repository';
export { userRepository } from './user.repository';
export type { QuestionRepository, StatsRepository, UserRepository } from './types';
