/**
 * 学習セッション (中断時の再開情報)
 * - 離脱した時点の「モード / 進んでいた問題 / 正解数」を保存
 * - ダッシュボードに「続きから」を出すための最小スキーマ
 */
export type SessionMode = 'binary' | 'quad';

export interface LearningSession {
  mode: SessionMode;
  /** 取り組み中の問題 ID 列 (1 セッション確定しておく) */
  questionIds: string[];
  /** 何問目まで答えたか (0-based の index、未回答は 0) */
  answeredCount: number;
  correctCount: number;
  startedAt: number;
  updatedAt: number;
}
