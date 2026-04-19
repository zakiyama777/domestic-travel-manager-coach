/** 日付ユーティリティ（軽量・dayjs不使用） */

/**
 * 残り日数 (常に 0 以上)。
 * - target が無効/過去でも負値を返さない安全版
 * - ダッシュボードの数字部分で直接使う
 */
export function daysUntil(target: Date, base: Date = new Date()): number {
  if (!isValidDate(target)) return 0;
  const b = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.max(0, Math.round((t - b) / (1000 * 60 * 60 * 24)));
}

/**
 * 残り日数 (符号付き)。内部判定用。
 * - 今日なら 0、過去なら負、未来なら正
 */
export function daysUntilSigned(target: Date, base: Date = new Date()): number {
  if (!isValidDate(target)) return NaN;
  const b = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((t - b) / (1000 * 60 * 60 * 24));
}

export type ExamStatus =
  | { kind: 'unset' }                             // 未設定・無効
  | { kind: 'today'; date: Date }                 // 試験当日
  | { kind: 'upcoming'; date: Date; days: number } // 未来 (days > 0)
  | { kind: 'past'; date: Date; daysAgo: number }; // 過去

/**
 * 試験日の状態を分類して返す。
 * - UI 側は switch でメッセージを出し分ければ「-3日」等を出さずに済む
 */
export function examStatus(examDateISO?: string | null, base: Date = new Date()): ExamStatus {
  if (!examDateISO) return { kind: 'unset' };
  const d = new Date(examDateISO);
  if (!isValidDate(d)) return { kind: 'unset' };
  const signed = daysUntilSigned(d, base);
  if (Number.isNaN(signed)) return { kind: 'unset' };
  if (signed === 0) return { kind: 'today', date: d };
  if (signed > 0) return { kind: 'upcoming', date: d, days: signed };
  return { kind: 'past', date: d, daysAgo: -signed };
}

export function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export function formatJPDate(d: Date): string {
  if (!isValidDate(d)) return '—';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function weekdayJP(d: Date): string {
  if (!isValidDate(d)) return '';
  return ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
}

/** 直近N日の日付配列（古い→新しい） */
export function recentDays(n: number): Date[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}
