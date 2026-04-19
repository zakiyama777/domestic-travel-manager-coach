import type { UserRepository } from '@/lib/repositories/types';
import type { OnboardingInput, UserProfile } from '@/lib/types/user';

/**
 * localStorage ベースの UserRepository 実装。
 * - SSR では常に null を返す（クライアント hydration で再取得）
 * - 将来 Firestore 実装時は同じ interface を満たす別ファイルに差し替え
 */

const STORAGE_KEY = 'tabi-study:user-profile:v1';

function readFromStorage(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    // 最低限の型チェック
    if (!parsed?.id || !parsed?.displayName || !parsed?.examDate) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeToStorage(u: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

export const userRepository: UserRepository = {
  async getCurrentUser() {
    return readFromStorage();
  },
  getCurrentUserSync() {
    return readFromStorage();
  },
  async completeOnboarding(input: OnboardingInput) {
    const now = new Date().toISOString();
    const u: UserProfile = {
      id: `u-${Math.random().toString(36).slice(2, 10)}`,
      displayName: input.displayName.trim(),
      examDate: input.examDate,
      dailyGoalMinutes: input.dailyGoalMinutes,
      dailyGoalQuestions: input.dailyGoalQuestions,
      onboarded: true,
      createdAt: now,
    };
    writeToStorage(u);
    return u;
  },
  async updateProfile(patch) {
    const prev = readFromStorage();
    if (!prev) throw new Error('User not found');
    const next: UserProfile = {
      ...prev,
      ...patch,
      displayName: patch.displayName?.trim() || prev.displayName,
    };
    writeToStorage(next);
    return next;
  },
};
