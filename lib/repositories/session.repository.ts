/**
 * 学習セッションリポジトリ (localStorage)
 * ================================================================
 *  - 2択 / 4択 のどちらかが中断されたとき、その進捗を保存する
 *  - ダッシュボードから「続きから再開」を実現するための最小永続化
 *  - セッション完了 or リスタートで `clear()` される前提
 * ================================================================
 */
import { createLocalStore } from '@/lib/storage/local-store';
import type { LearningSession, SessionMode } from '@/lib/types/session';

const store = createLocalStore<LearningSession | null>(
  'tabi-study:session',
  'v1',
  null,
);

export interface StartSessionInput {
  mode: SessionMode;
  questionIds: string[];
}

export interface UpdateSessionInput {
  answeredCount: number;
  correctCount: number;
}

export const sessionRepository = {
  get(): LearningSession | null {
    return store.read();
  },

  start(input: StartSessionInput): LearningSession {
    const now = Date.now();
    const next: LearningSession = {
      mode: input.mode,
      questionIds: input.questionIds,
      answeredCount: 0,
      correctCount: 0,
      startedAt: now,
      updatedAt: now,
    };
    store.write(next);
    return next;
  },

  update(input: UpdateSessionInput): void {
    const prev = store.read();
    if (!prev) return; // 何も開始してなければ無視
    store.write({
      ...prev,
      answeredCount: input.answeredCount,
      correctCount: input.correctCount,
      updatedAt: Date.now(),
    });
  },

  clear(): void {
    store.write(null);
  },
};

/** ダッシュボード表示用のヘルパ: 「再開可能な未完了セッション」を返す */
export function getResumableSession(): LearningSession | null {
  const s = sessionRepository.get();
  if (!s) return null;
  if (s.answeredCount <= 0) return null; // 1問も進んでいない
  if (s.answeredCount >= s.questionIds.length) return null; // 完了済
  return s;
}
