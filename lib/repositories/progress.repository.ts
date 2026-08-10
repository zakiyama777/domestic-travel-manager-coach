/**
 * 学習進捗リポジトリ (localStorage 実装)
 * ================================================================
 * 責務:
 *   - 「1日あたりの学習量」「問題ごとの正答率」「連続学習日数」を保持
 *   - UI 側は `recordAnswer` / `getToday` / `getLast7Days` などを呼ぶだけ
 *
 * 将来:
 *   - Firestore に差し替え。同 interface で `firebase/progress.firebase.ts`
 *     を作成するだけで `lib/repositories/index.ts` の import を差し替え可能。
 * ================================================================
 */

import { createLocalStore, todayKey, dayDiff } from '@/lib/storage/local-store';
import {
  EMPTY_PROGRESS,
  type DailyProgress,
  type ProgressState,
  type QuestionStat,
  type TodayProgress,
} from '@/lib/types/progress';
import type { SubjectId } from '@/lib/constants/subjects';
import type { DailyActivity, SubjectMastery, WeaknessItem } from '@/lib/types/stats';

const store = createLocalStore<ProgressState>(
  'tabi-study:progress',
  'v1',
  EMPTY_PROGRESS,
);

/** 1問 ≒ 0.5 分 として分換算 (UI 見積り用) */
function minutesFromQuestions(n: number): number {
  return Math.round(n * 0.5);
}

function updateStreak(
  prev: ProgressState['streak'],
  todayK: string,
): ProgressState['streak'] {
  if (prev.lastDate === todayK) return prev; // 同日なら維持
  if (!prev.lastDate) return { lastDate: todayK, days: 1 };
  const gap = dayDiff(todayK, prev.lastDate);
  if (gap === 1) return { lastDate: todayK, days: prev.days + 1 };
  // 2日以上空いた → リセット (本日から 1)
  return { lastDate: todayK, days: 1 };
}

export interface RecordAnswerInput {
  questionId: string;
  subject: SubjectId;
  topic: string;
  correct: boolean;
  answeredAt?: number;
}

export const progressRepository = {
  /* ------------------------------------------------------------
   * 読み取り系
   * ---------------------------------------------------------- */
  getAll(): ProgressState {
    return store.read() ?? EMPTY_PROGRESS;
  },

  /** 本日分のサマリ。未回答なら全て 0 */
  getToday(): TodayProgress {
    const s = store.read() ?? EMPTY_PROGRESS;
    const k = todayKey();
    const d: DailyProgress = s.daily[k] ?? {
      dateKey: k,
      answered: 0,
      correct: 0,
      estimatedMinutes: 0,
    };
    const accuracy = d.answered === 0 ? 0 : d.correct / d.answered;
    return {
      dateKey: k,
      answered: d.answered,
      correct: d.correct,
      accuracy,
      estimatedMinutes: d.estimatedMinutes,
    };
  },

  /** 直近 N 日分の DailyActivity。データなしの日は 0 埋め */
  getLastNDays(n: number): DailyActivity[] {
    const s = store.read() ?? EMPTY_PROGRESS;
    const today = new Date();
    const out: DailyActivity[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      const rec = s.daily[k];
      out.push({
        date: d.toISOString(),
        questions: rec?.answered ?? 0,
        accuracy: rec && rec.answered > 0 ? rec.correct / rec.answered : 0,
      });
    }
    return out;
  },

  getStreakDays(): number {
    const s = store.read() ?? EMPTY_PROGRESS;
    if (!s.streak.lastDate) return 0;
    // 最終回答日が「昨日 or 今日」でなければ streak 切れ表示 (0)
    const diff = dayDiff(todayKey(), s.streak.lastDate);
    if (diff > 1) return 0;
    return s.streak.days;
  },

  /** 正答率の低い順で Top N (試行数 3 以上のみ) */
  getWeaknesses(n: number): WeaknessItem[] {
    const s = store.read() ?? EMPTY_PROGRESS;
    const items: (WeaknessItem & { attemptsRaw: number })[] = Object.values(s.byQuestion)
      .filter((q) => q.attempts >= 3)
      .map((q) => ({
        topic: q.topic,
        subject: q.subject,
        accuracy: q.correct / q.attempts,
        attempts: q.attempts,
        attemptsRaw: q.attempts,
      }));
    items.sort((a, b) => a.accuracy - b.accuracy || b.attemptsRaw - a.attemptsRaw);
    return items.slice(0, n).map(({ attemptsRaw: _a, ...rest }) => rest);
  },

  /** 科目別の到達度 (mastery = 0..1, totalQuestions = カタログ値) */
  getSubjectMastery(catalog: {
    subject: SubjectId;
    totalQuestions: number;
  }[]): SubjectMastery[] {
    const s = store.read() ?? EMPTY_PROGRESS;
    return catalog.map(({ subject, totalQuestions }) => {
      const subjectStats = Object.values(s.byQuestion).filter(
        (q) => q.subject === subject,
      );
      const answered = subjectStats.length;
      const totalAttempts = subjectStats.reduce((a, q) => a + q.attempts, 0);
      const totalCorrect = subjectStats.reduce((a, q) => a + q.correct, 0);
      const mastery = totalAttempts === 0 ? 0 : totalCorrect / totalAttempts;
      return { subject, mastery, totalQuestions, answered };
    });
  },

  /* ------------------------------------------------------------
   * 書き込み系
   * ---------------------------------------------------------- */
  recordAnswer(input: RecordAnswerInput): void {
    const now = input.answeredAt ?? Date.now();
    const k = todayKey(new Date(now));
    store.update((prev) => {
      const day: DailyProgress = prev.daily[k] ?? {
        dateKey: k,
        answered: 0,
        correct: 0,
        estimatedMinutes: 0,
      };
      const nextAnswered = day.answered + 1;
      const nextCorrect = day.correct + (input.correct ? 1 : 0);

      const q: QuestionStat = prev.byQuestion[input.questionId] ?? {
        questionId: input.questionId,
        subject: input.subject,
        topic: input.topic,
        attempts: 0,
        correct: 0,
        lastAnsweredAt: 0,
      };

      return {
        daily: {
          ...prev.daily,
          [k]: {
            ...day,
            answered: nextAnswered,
            correct: nextCorrect,
            estimatedMinutes: minutesFromQuestions(nextAnswered),
          },
        },
        byQuestion: {
          ...prev.byQuestion,
          [input.questionId]: {
            ...q,
            subject: input.subject,
            topic: input.topic,
            attempts: q.attempts + 1,
            correct: q.correct + (input.correct ? 1 : 0),
            lastAnsweredAt: now,
          },
        },
        streak: updateStreak(prev.streak, k),
        totals: {
          answered: prev.totals.answered + 1,
          correct: prev.totals.correct + (input.correct ? 1 : 0),
        },
      };
    });
  },

  /** 学習データを完全に消去 (設定画面の Danger zone 用) */
  resetAll(): void {
    store.clear();
  },
};
