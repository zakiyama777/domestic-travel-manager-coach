import type { DashboardSummary } from '@/lib/types/stats';
import { recentDays } from '@/lib/utils/date';

/** 試験日: 本年9月の第1日曜あたりをダミーで設定 */
function mockExamDate(): string {
  const today = new Date();
  const year = today.getMonth() > 8 ? today.getFullYear() + 1 : today.getFullYear();
  const d = new Date(year, 8, 7); // 9/7 固定ダミー
  return d.toISOString();
}

export function buildMockDashboard(): DashboardSummary {
  const days = recentDays(7);

  return {
    examDate: mockExamDate(),
    todayGoalMinutes: 20,
    todayDoneMinutes: 12,
    todayGoalQuestions: 30,
    todayDoneQuestions: 18,
    streakDays: 6,
    last7Days: days.map((d, i) => ({
      date: d.toISOString(),
      questions: [22, 34, 28, 0, 41, 26, 18][i] ?? 0,
      accuracy: [0.72, 0.78, 0.74, 0, 0.81, 0.76, 0.7][i] ?? 0,
    })),
    weaknessTop5: [
      { topic: '旅程管理主任者の要件', subject: 'law', accuracy: 0.38, attempts: 13 },
      { topic: 'JR特急料金 ― 特定特急料金', subject: 'practice', accuracy: 0.42, attempts: 12 },
      { topic: '取消料（受注型・貸切）', subject: 'terms', accuracy: 0.45, attempts: 11 },
      { topic: '登録業務範囲', subject: 'law', accuracy: 0.51, attempts: 16 },
      { topic: '国内観光資源（中国地方）', subject: 'practice', accuracy: 0.55, attempts: 9 },
    ],
    subjectMastery: [
      { subject: 'law', mastery: 0.68, totalQuestions: 240, answered: 164 },
      { subject: 'terms', mastery: 0.54, totalQuestions: 180, answered: 98 },
      { subject: 'practice', mastery: 0.47, totalQuestions: 320, answered: 150 },
    ],
    recommendedAction: {
      kind: 'binary',
      title: '弱点・旅程管理を3分で',
      subtitle: '直近の正答率 38%。8問で感覚を取り戻しましょう。',
      estMinutes: 3,
      deepLink: '/learn/binary?topic=itinerary',
    },
  };
}
