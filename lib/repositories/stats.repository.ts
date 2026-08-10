import type { StatsRepository } from '@/lib/repositories/types';
import { buildMockDashboard } from '@/lib/mock/stats';
import { progressRepository } from '@/lib/repositories/progress.repository';
import type { DashboardSummary } from '@/lib/types/stats';

/**
 * 統計リポジトリ
 * --------------------------------------------------------------
 *  - mock の「カタログ情報」(科目ごとの総問題数、推奨アクションの文言など)
 *    を土台にしつつ、端末ローカルの learning progress を重ねて返す。
 *  - ブラウザでない (SSR) 場合は純粋な mock を返す (hydration で再取得される)。
 *  - 将来 Firestore 実装に置き換えるときは、ここ一枚だけ書き換えれば良い。
 * --------------------------------------------------------------
 */

function mergeWithLocalProgress(base: DashboardSummary): DashboardSummary {
  if (typeof window === 'undefined') return base;

  const today = progressRepository.getToday();
  const last7 = progressRepository.getLastNDays(7);
  const streak = progressRepository.getStreakDays();
  const weaknesses = progressRepository.getWeaknesses(5);
  const mastery = progressRepository.getSubjectMastery(
    base.subjectMastery.map(({ subject, totalQuestions }) => ({
      subject,
      totalQuestions,
    })),
  );

  // 「実データがまだ無い」場合は mock を表示して寂しさを防ぐ。
  const hasRealData = today.answered > 0 || last7.some((d) => d.questions > 0);
  const last7Merged = hasRealData ? last7 : base.last7Days;
  const weaknessMerged = weaknesses.length > 0 ? weaknesses : base.weaknessTop5;
  const masteryMerged = hasRealData ? mastery : base.subjectMastery;

  return {
    ...base,
    todayDoneMinutes: hasRealData ? today.estimatedMinutes : base.todayDoneMinutes,
    todayDoneQuestions: hasRealData ? today.answered : base.todayDoneQuestions,
    streakDays: hasRealData ? streak : base.streakDays,
    last7Days: last7Merged,
    weaknessTop5: weaknessMerged,
    subjectMastery: masteryMerged,
  };
}

export const statsRepository: StatsRepository = {
  async getDashboard() {
    const base = buildMockDashboard();
    return mergeWithLocalProgress(base);
  },
  async getWeaknessList() {
    const base = buildMockDashboard();
    const merged = mergeWithLocalProgress(base);
    return merged.weaknessTop5;
  },
};
