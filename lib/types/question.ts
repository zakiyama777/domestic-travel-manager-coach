import type { SubjectId } from '@/lib/constants/subjects';

export type QuestionFormat = 'binary' | 'quad';

/** 2択問題（○×） */
export interface BinaryQuestion {
  id: string;
  format: 'binary';
  subject: SubjectId;
  topic: string; // 例: "旅程管理主任者"
  statement: string; // 問題文
  answer: boolean; // true=○ / false=×
  explanation: string;
  difficulty: 1 | 2 | 3;
}

/** 4択問題 */
export interface QuadQuestion {
  id: string;
  format: 'quad';
  subject: SubjectId;
  topic: string;
  prompt: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  difficulty: 1 | 2 | 3;
}

export type Question = BinaryQuestion | QuadQuestion;

/** 回答結果 */
export interface AnswerResult {
  questionId: string;
  correct: boolean;
  answeredAt: number; // unix ms
  elapsedMs: number;
}
