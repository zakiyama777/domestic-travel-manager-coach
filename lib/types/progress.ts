import type { SubjectId } from '@/lib/constants/subjects';

/**
 * 日別学習進捗 (1 レコード = 1 日)。
 * dateKey は yyyy-mm-dd (ローカルTZ)。
 */
export interface DailyProgress {
  dateKey: string;
  answered: number;
  correct: number;
  /** 1日あたりの大体の学習分 (問題数 * 0.5 を目安に推定) */
  estimatedMinutes: number;
}

/**
 * 問題ごとの最新記録 (弱点分析の種)。
 * attempts = 合計回答回数、correct = 合計正解数。
 */
export interface QuestionStat {
  questionId: string;
  subject: SubjectId;
  topic: string;
  attempts: number;
  correct: number;
  lastAnsweredAt: number; // unix ms
}

/**
 * 全体の永続化スキーマ。version を上げたら reset される。
 */
export interface ProgressState {
  /** dateKey → DailyProgress */
  daily: Record<string, DailyProgress>;
  /** questionId → QuestionStat */
  byQuestion: Record<string, QuestionStat>;
  /** 連続学習日数 (最後に更新した日付とカウント) */
  streak: { lastDate: string | null; days: number };
  /** トータル集計 */
  totals: { answered: number; correct: number };
}

export const EMPTY_PROGRESS: ProgressState = {
  daily: {},
  byQuestion: {},
  streak: { lastDate: null, days: 0 },
  totals: { answered: 0, correct: 0 },
};

/** その日のサマリ (UI 表示用) */
export interface TodayProgress {
  dateKey: string;
  answered: number;
  correct: number;
  accuracy: number; // 0..1 (answered==0 → 0)
  estimatedMinutes: number;
}
