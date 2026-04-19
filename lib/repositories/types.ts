import type { AnswerResult, BinaryQuestion, QuadQuestion } from '@/lib/types/question';
import type { DashboardSummary, WeaknessItem } from '@/lib/types/stats';
import type { UserProfile, OnboardingInput } from '@/lib/types/user';

/**
 * Repository Interface
 * ============================================================
 * すべてのデータアクセスはここを通す。
 * 現在: in-memory mock 実装
 * 将来: Firestore 実装に差し替え（同じ interface を満たせばOK）
 * ============================================================
 */

export interface QuestionRepository {
  /** 非同期取得（本番Firestore時の主経路） */
  fetchBinaryQuiz(params?: { limit?: number; subject?: string }): Promise<BinaryQuestion[]>;
  fetchQuadQuiz(params?: { limit?: number; subject?: string }): Promise<QuadQuestion[]>;
  /**
   * 同期取得（mock専用の最適化経路）
   * - Firestore実装では一旦 空配列 を返し、fetch* で補完する前提
   * - 初回表示の「ローディング地獄」を避けるためのSSR-first hatch
   */
  getBinaryQuizSync(params?: { limit?: number; subject?: string }): BinaryQuestion[];
  getQuadQuizSync(params?: { limit?: number; subject?: string }): QuadQuestion[];

  submitAnswer(result: AnswerResult): Promise<void>;
}

export interface StatsRepository {
  getDashboard(): Promise<DashboardSummary>;
  getWeaknessList(): Promise<WeaknessItem[]>;
}

export interface UserRepository {
  /** 非同期版(主経路) */
  getCurrentUser(): Promise<UserProfile | null>;
  /** SSR/初回描画のための同期版 — nullなら未オンボーディング扱い */
  getCurrentUserSync(): UserProfile | null;
  /** オンボーディング完了時に保存 */
  completeOnboarding(input: OnboardingInput): Promise<UserProfile>;
  /** プロフィール更新 */
  updateProfile(patch: Partial<OnboardingInput>): Promise<UserProfile>;
}
