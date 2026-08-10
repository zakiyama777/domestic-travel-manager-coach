import type { SubjectId } from '@/lib/constants/subjects';

/** ダッシュボード用サマリ */
export interface DashboardSummary {
  examDate: string; // ISO
  todayGoalMinutes: number;
  todayDoneMinutes: number;
  todayGoalQuestions: number;
  todayDoneQuestions: number;
  streakDays: number; // 連続学習日数
  last7Days: DailyActivity[];
  weaknessTop5: WeaknessItem[];
  subjectMastery: SubjectMastery[];
  recommendedAction: RecommendedAction;
}

export interface DailyActivity {
  date: string; // ISO(日単位)
  questions: number;
  accuracy: number; // 0..1
}

export interface WeaknessItem {
  topic: string;
  subject: SubjectId;
  accuracy: number; // 0..1 低いほど弱点
  attempts: number;
}

export interface SubjectMastery {
  subject: SubjectId;
  mastery: number; // 0..1
  totalQuestions: number;
  answered: number;
}

export interface RecommendedAction {
  kind: 'binary' | 'quad' | 'review';
  title: string;
  subtitle: string;
  estMinutes: number;
  deepLink: string; // '/learn/binary?topic=xxx' 等
}
