import type { QuestionRepository } from '@/lib/repositories/types';
import { MOCK_BINARY_QUESTIONS, MOCK_QUAD_QUESTIONS } from '@/lib/mock/questions';

/** in-memory mock 実装。将来 Firestore 実装に差し替え可能。 */
function pickBinary(params?: { limit?: number; subject?: string }) {
  const limit = params?.limit ?? 10;
  let items = [...MOCK_BINARY_QUESTIONS];
  if (params?.subject) items = items.filter((q) => q.subject === params.subject);
  return items.slice(0, limit);
}

function pickQuad(params?: { limit?: number; subject?: string }) {
  const limit = params?.limit ?? 5;
  let items = [...MOCK_QUAD_QUESTIONS];
  if (params?.subject) items = items.filter((q) => q.subject === params.subject);
  return items.slice(0, limit);
}

export const questionRepository: QuestionRepository = {
  async fetchBinaryQuiz(params) {
    return pickBinary(params);
  },
  async fetchQuadQuiz(params) {
    return pickQuad(params);
  },
  getBinaryQuizSync(params) {
    return pickBinary(params);
  },
  getQuadQuizSync(params) {
    return pickQuad(params);
  },

  async submitAnswer(result) {
    // 現状は console ログのみ。将来 Firestore の users/{uid}/answers に書き込み。
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[mock] submitAnswer', result);
    }
  },
};
