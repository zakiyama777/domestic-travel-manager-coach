import type { QuestionRepository } from '@/lib/repositories/types';
import type { SubjectId } from '@/lib/constants/subjects';
import { pickBinary, pickQuad } from '@/lib/repositories/question-bank.repository';

/**
 * QuestionRepository 実装（question-bank を経由）
 * -------------------------------------------------
 * - bank に投入されたデータがあればそれを優先
 * - 無い場合は mock にフォールバック（question-bank/index.ts が担保）
 * - 同期 API を維持し、loading forever を再発させない
 */

function narrowSubject(s?: string): SubjectId | undefined {
  if (!s) return undefined;
  if (s === 'law' || s === 'terms' || s === 'practice') return s;
  return undefined;
}

export const questionRepository: QuestionRepository = {
  async fetchBinaryQuiz(params) {
    return pickBinary({ limit: params?.limit ?? 10, subject: narrowSubject(params?.subject) });
  },
  async fetchQuadQuiz(params) {
    return pickQuad({ limit: params?.limit ?? 5, subject: narrowSubject(params?.subject) });
  },
  getBinaryQuizSync(params) {
    return pickBinary({ limit: params?.limit ?? 10, subject: narrowSubject(params?.subject) });
  },
  getQuadQuizSync(params) {
    return pickQuad({ limit: params?.limit ?? 5, subject: narrowSubject(params?.subject) });
  },

  async submitAnswer(result) {
    // 学習結果本体は progressRepository / sessionRepository が扱う。
    // ここは将来 Firestore の answers コレクションに書き込む差し込み口。
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[question] submitAnswer', result);
    }
  },
};
