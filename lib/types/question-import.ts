/**
 * Tabi Study — Question Import Canonical Schema
 * =================================================
 * これは「問題を追加するときに書く形式」の型です。
 * CSV / JSON どちらで書かれたものも、build script によってここに正規化され、
 * 最終的に `lib/types/question.ts` の BinaryQuestion / QuadQuestion へ変換されます。
 *
 * 設計方針:
 *   - 1 つの形 (CanonicalQuestion) で binary も quad も書けるようにする
 *   - CSV で人間が編集しやすい列構成にできる
 *   - 不要項目は空でよい（後方互換しやすい）
 *   - バリデーション失敗時は build script がスキップログを出す
 *
 * 変換ルール:
 *   type='binary' → BinaryQuestion
 *     - question  → statement
 *     - correctAnswer ('true'|'false'|'o'|'x'|'○'|'×') → answer: boolean
 *     - choices は無視してよい（あっても消される）
 *   type='quad'   → QuadQuestion
 *     - question  → prompt
 *     - choices   → [string, string, string, string] （4 個必須）
 *     - correctAnswer ('1'|'2'|'3'|'4' | 'ア'|'イ'|'ウ'|'エ' | 'A'|'B'|'C'|'D')
 *         → answerIndex: 0 | 1 | 2 | 3
 */

import type { SubjectId } from '@/lib/constants/subjects';

/** CSV / JSON で受け取る生入力の共通形 */
export interface CanonicalQuestion {
  /** 必須: 重複不可。命名例 `law-b-0001`, `terms-q-0012` */
  id: string;

  /** 必須: 'binary' | 'quad' */
  type: 'binary' | 'quad';

  /** 必須: 'law' | 'terms' | 'practice' */
  subject: SubjectId;

  /** 必須: 自由文字列（細分トピック）例 "旅程管理主任者" */
  topic: string;

  /** 必須: 問題文 */
  question: string;

  /**
   * quad のみ必須: 4 つの選択肢
   * binary の場合は空配列 `[]` か未指定で OK
   */
  choices?: string[];

  /**
   * 必須:
   *   - binary: 'true'|'false'|'o'|'x'|'○'|'×'|'1'|'0'
   *   - quad  : 1..4 / A..D / ア..エ
   */
  correctAnswer: string | number | boolean;

  /** 必須: 解説（空だと表示が寂しいので必須扱い） */
  explanation: string;

  /** 任意: 1..3 (未指定は 2 として扱う) */
  difficulty?: 1 | 2 | 3;

  /** 任意: 出題年 (例: 2023) */
  sourceYear?: number;

  /** 任意: 出典ラベル (例: "2023年 本試験 問1") */
  sourceLabel?: string;

  /** 任意: タグ (CSV の場合は '|' 区切り) */
  tags?: string[];

  /** 任意 — 将来用（今は未使用） */
  chapter?: string;
  subtopic?: string;
  estimatedSeconds?: number;
  memo?: string;

  /** 任意: false なら出題対象外。未指定は true (= 有効) */
  isActive?: boolean;

  /** 任意: YYYY-MM-DD */
  createdAt?: string;
  updatedAt?: string;
}

/** build script が出力する集計 */
export interface ImportSummary {
  totalInput: number;
  accepted: number;
  skipped: number;
  duplicates: number;
  byType: { binary: number; quad: number };
  bySubject: Record<SubjectId, number>;
  errors: Array<{ id: string; reason: string }>;
}
