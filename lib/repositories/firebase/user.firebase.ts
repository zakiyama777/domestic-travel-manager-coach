/**
 * Firestore 実装 UserRepository (ハイブリッド)
 * ============================================================
 *  - 読み: Firestore にあればそれを返す / なければ local を返す
 *  - 書き: まず local (即時反映) → 非同期で Firestore に書き込み
 *  - auth 未確定 / Firebase 無効 時は完全に local にフォールバック
 *  - interface は types.ts の UserRepository に一致
 * ============================================================
 */

import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserRepository } from '@/lib/repositories/types';
import type { OnboardingInput, UserProfile } from '@/lib/types/user';
import { userRepository as localUserRepository } from '@/lib/repositories/user.repository';
import { getFirebase, isFirebaseAvailable } from '@/lib/firebase/client';
import { userDoc } from '@/lib/firebase/firestore-paths';
import { currentUid } from '@/lib/firebase/auth';
import { markFailed, markSynced, markSyncing } from '@/features/sync/sync-status';

/**
 * Firestore ドキュメント → UserProfile (最低限の型ガード)
 */
function fromFirestore(data: Record<string, unknown> | undefined): UserProfile | null {
  if (!data) return null;
  const id = typeof data.id === 'string' ? data.id : '';
  const displayName = typeof data.displayName === 'string' ? data.displayName : '';
  const examDate = typeof data.examDate === 'string' ? data.examDate : '';
  const dailyGoalMinutes =
    typeof data.dailyGoalMinutes === 'number' ? data.dailyGoalMinutes : 15;
  const dailyGoalQuestions =
    typeof data.dailyGoalQuestions === 'number' ? data.dailyGoalQuestions : 20;
  const onboarded = data.onboarded === true;
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : '';

  if (!id || !displayName || !examDate) return null;

  return {
    id,
    displayName,
    examDate,
    dailyGoalMinutes,
    dailyGoalQuestions,
    onboarded,
    createdAt,
  };
}

function toFirestore(u: UserProfile) {
  return {
    ...u,
    // 将来の同期解決 / 監査用
    updatedAt: serverTimestamp(),
    appVersion: '0.1.0',
  };
}

async function writeToFirestore(u: UserProfile): Promise<void> {
  const fb = getFirebase();
  const uid = currentUid();
  if (!fb || !uid) return;
  markSyncing();
  try {
    await setDoc(userDoc(fb.db, uid), toFirestore(u), { merge: true });
    markSynced();
  } catch (e) {
    markFailed(e instanceof Error ? e.message : 'profile sync failed');
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[firebase] writeProfile failed', e);
    }
  }
}

export const userRepositoryFirebase: UserRepository = {
  async getCurrentUser() {
    // まずローカルを即座に返す (UI を待たせない)
    const local = localUserRepository.getCurrentUserSync();
    if (!isFirebaseAvailable()) return local;

    const fb = getFirebase();
    const uid = currentUid();
    if (!fb || !uid) return local;

    // バックグラウンドで Firestore から最新を取り、違えばローカルに反映
    try {
      const snap = await getDoc(userDoc(fb.db, uid));
      const remote = snap.exists() ? fromFirestore(snap.data()) : null;
      if (remote) {
        // ローカルを Firestore で上書き (last-write-wins は呼び出し側で配慮)
        await localUserRepository.updateProfile({
          displayName: remote.displayName,
          examDate: remote.examDate,
          dailyGoalMinutes: remote.dailyGoalMinutes,
          dailyGoalQuestions: remote.dailyGoalQuestions,
        }).catch(() => {
          // ローカルに profile が無いなら completeOnboarding で新規作成
          return localUserRepository.completeOnboarding({
            displayName: remote.displayName,
            examDate: remote.examDate,
            dailyGoalMinutes: remote.dailyGoalMinutes,
            dailyGoalQuestions: remote.dailyGoalQuestions,
          });
        });
        return remote;
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[firebase] getProfile failed, using local', e);
      }
    }
    return local;
  },

  getCurrentUserSync() {
    // 同期経路は常にローカル (Firestore は await が必要)
    return localUserRepository.getCurrentUserSync();
  },

  async completeOnboarding(input: OnboardingInput) {
    // 1) ローカルに即保存 → UI は即時反映できる
    const u = await localUserRepository.completeOnboarding(input);
    // 2) Firestore にバックグラウンド書き込み
    void writeToFirestore(u);
    return u;
  },

  async updateProfile(patch) {
    const u = await localUserRepository.updateProfile(patch);
    void writeToFirestore(u);
    return u;
  },
};
