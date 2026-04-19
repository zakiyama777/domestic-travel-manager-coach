import type { SubjectId } from '@/lib/constants/subjects';

export interface ReviewTopic {
  id: string;
  subject: SubjectId;
  topic: string;
  accuracy: number; // 0..1
  attempts: number;
  lastSeenDaysAgo: number;
  dueSoon: boolean;
}

/** 復習画面のヒートマップ/優先度リスト用 */
export const MOCK_REVIEW_TOPICS: ReviewTopic[] = [
  // 法令
  { id: 't-1', subject: 'law', topic: '旅程管理主任者の要件', accuracy: 0.38, attempts: 13, lastSeenDaysAgo: 4, dueSoon: true },
  { id: 't-2', subject: 'law', topic: '登録業務範囲', accuracy: 0.51, attempts: 16, lastSeenDaysAgo: 2, dueSoon: true },
  { id: 't-3', subject: 'law', topic: '営業保証金', accuracy: 0.72, attempts: 18, lastSeenDaysAgo: 5, dueSoon: false },
  { id: 't-4', subject: 'law', topic: '変更登録', accuracy: 0.81, attempts: 10, lastSeenDaysAgo: 1, dueSoon: false },
  { id: 't-5', subject: 'law', topic: '取引条件説明書面', accuracy: 0.63, attempts: 12, lastSeenDaysAgo: 3, dueSoon: true },
  { id: 't-6', subject: 'law', topic: '広告規制', accuracy: 0.88, attempts: 8, lastSeenDaysAgo: 7, dueSoon: false },

  // 約款
  { id: 't-7', subject: 'terms', topic: '取消料（受注型・貸切）', accuracy: 0.45, attempts: 11, lastSeenDaysAgo: 6, dueSoon: true },
  { id: 't-8', subject: 'terms', topic: '旅程保証', accuracy: 0.67, attempts: 14, lastSeenDaysAgo: 2, dueSoon: false },
  { id: 't-9', subject: 'terms', topic: '特別補償', accuracy: 0.58, attempts: 10, lastSeenDaysAgo: 5, dueSoon: true },
  { id: 't-10', subject: 'terms', topic: '募集型企画旅行契約', accuracy: 0.77, attempts: 15, lastSeenDaysAgo: 1, dueSoon: false },
  { id: 't-11', subject: 'terms', topic: '宿泊約款', accuracy: 0.69, attempts: 8, lastSeenDaysAgo: 4, dueSoon: false },

  // 実務
  { id: 't-12', subject: 'practice', topic: 'JR特急料金 ― 特定特急料金', accuracy: 0.42, attempts: 12, lastSeenDaysAgo: 3, dueSoon: true },
  { id: 't-13', subject: 'practice', topic: '国内観光資源（中国地方）', accuracy: 0.55, attempts: 9, lastSeenDaysAgo: 6, dueSoon: true },
  { id: 't-14', subject: 'practice', topic: 'JR運賃 ― 往復割引', accuracy: 0.64, attempts: 14, lastSeenDaysAgo: 2, dueSoon: false },
  { id: 't-15', subject: 'practice', topic: '国内観光資源（東北地方）', accuracy: 0.79, attempts: 11, lastSeenDaysAgo: 1, dueSoon: false },
  { id: 't-16', subject: 'practice', topic: '貸切バス料金制度', accuracy: 0.52, attempts: 10, lastSeenDaysAgo: 4, dueSoon: true },
  { id: 't-17', subject: 'practice', topic: '国内航空運賃', accuracy: 0.71, attempts: 13, lastSeenDaysAgo: 2, dueSoon: false },
];

/** 正答率帯の閾値（色分けの基準） */
export const ACCURACY_THRESHOLDS = {
  red: 0.5,
  yellow: 0.7,
};

export function accuracyTier(a: number): 'red' | 'yellow' | 'green' {
  if (a < ACCURACY_THRESHOLDS.red) return 'red';
  if (a < ACCURACY_THRESHOLDS.yellow) return 'yellow';
  return 'green';
}
