/**
 * Past Exam (過去問) Canonical Schema
 * =====================================
 * 国内旅行業務取扱管理者試験の過去問を保持するための最小スキーマ。
 *
 * 設計方針:
 * - 既存の BinaryQuestion / QuadQuestion とは**別カテゴリ**として扱う
 *   （○×／4択へ無理に変換しない）
 * - 元の試験構成・年度・問番号・科目を保持する
 * - 年度を追加しやすい（R03 → R04/R05/R02 ... に拡張可能）
 * - 将来の「本試験演習モード」に繋げやすい
 */

import type { SubjectId } from '@/lib/constants/subjects';

/** 元号＋年度。例: 'R03' (令和3年), 'R04', 'R02' */
export type ExamYearKey = string;

/** 試験区分 */
export type ExamSection = SubjectId; // 'law' | 'terms' | 'practice'

/**
 * 試験タイプ
 *  - 'official'  本試験（R03〜R05 など）
 *  - 'sample'   出題例（R06・R07 の「問題例／解答例」形式）
 */
export type ExamType = 'official' | 'sample';

/** 過去問 1 問 */
export interface PastExamQuestion {
  /** グローバルユニークID。推奨: `pe-{year}-{section}-{q番号zero-padded}` */
  id: string;

  /** 固定値: 'past_exam' */
  category: 'past_exam';

  /** 年度キー。例: 'R03' */
  year: ExamYearKey;

  /** 科目 */
  section: ExamSection;

  /** 原問番号（1-origin）。例: 1, 2, ..., 30 */
  originalQuestionNumber: number;

  /** 問題文（そのまま） */
  question: string;

  /**
   * 選択肢。4択を基本とするが、本試験の問いは必ずしも4択とは限らないので可変配列。
   * 「次のうち正しいものはどれか」「次のうち誤っているものはどれか」形式はこれで表現。
   * 2択の○×判断のような問題も、choices=['正しい', '誤り'] として格納して OK。
   */
  choices: string[];

  /**
   * 正答のインデックス (0-origin)。
   * 配列で複数正答にも対応（例: 複数正解があり得る問題）。
   * 通常は長さ1。
   */
  correctAnswer: number | number[];

  /** 解答解説（最低限は解答根拠または簡潔解説） */
  explanation: string;

  /** 出典ラベル（例: '令和3年度 国内旅行業務取扱管理者試験 旅行業法 問1'） */
  sourceLabel: string;

  /** false で配信停止。未指定は true 扱い */
  isActive?: boolean;

  /** 本試験 / 出題例 の区別（未指定は official 扱い） */
  examType?: ExamType;

  /** 任意 */
  subSection?: string;
  topic?: string;
  difficulty?: 1 | 2 | 3;
  tags?: string[];
  sourcePage?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 年度メタ（UI の年度選択用） */
export interface PastExamYearMeta {
  year: ExamYearKey;
  /** 表示名（例: '令和3年度 (2021)'） */
  label: string;
  /** 西暦（任意） */
  westernYear?: number;
  /** 各セクションの問題数（投入済の実数） */
  counts: Record<ExamSection, number>;
  /** 合計 */
  total: number;
  /** 本試験 or 出題例（その年度に含まれる最初の examType を採用） */
  examType?: ExamType;
}

/** セクション表示名 */
export const PAST_EXAM_SECTION_LABELS: Record<ExamSection, string> = {
  law: '旅行業法令',
  terms: '約款',
  practice: '国内旅行実務',
};

/** 試験タイプ表示名 */
export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  official: '本試験',
  sample: '出題例',
};
