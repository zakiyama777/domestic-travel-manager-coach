import type { SubjectId } from '@/lib/constants/subjects';

export type QuestionFormat = 'binary' | 'quad';

/**
 * 共通メタデータ（question-bank 投入時に付与される任意項目）
 * - mock は未付与でも型を満たす（すべて optional）
 * - 将来 Firestore 化する際にもそのまま写像できる形
 */
export interface QuestionMetadata {
  sourceYear?: number;
  sourceLabel?: string;
  tags?: string[];
  chapter?: string;
  subtopic?: string;
  estimatedSeconds?: number;
  memo?: string;
  isActive?: boolean; // 未指定は true 扱い
  createdAt?: string;
  updatedAt?: string;
}

/** 2択問題（○×） */
export interface BinaryQuestion extends QuestionMetadata {
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
export interface QuadQuestion extends QuestionMetadata {
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
