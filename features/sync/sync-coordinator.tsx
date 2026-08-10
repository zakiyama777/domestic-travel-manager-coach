'use client';

/**
 * SyncCoordinator
 * ============================================================
 *  Auth が確立した後に 1 度だけ:
 *   1. Firestore から profile / progress / session を pull
 *   2. ローカル側にデータがあれば Firestore へ push (初回 migration)
 *   3. 以降、ローカルが更新されるたび schedulePushProgress() が走る想定
 *  を回す軽量コンポーネント。
 *
 *  画面は持たず、<AuthProvider> の子として 1 箇所でマウントする。
 *  既存 UI に何も影響を与えない (fire-and-forget)。
 * ============================================================
 */

import { useEffect, useRef } from 'react';
import { useAuth, canSync } from '@/features/auth/auth-provider';
import { createLocalStore } from '@/lib/storage/local-store';
import { userRepositoryFirebase } from '@/lib/repositories/firebase/user.firebase';
import {
  flushPushProgress,
  pullProgressIfFresher,
  schedulePushProgress,
} from '@/lib/repositories/firebase/progress.firebase';
import {
  pullSessionIfMissing,
  pushSession,
} from '@/lib/repositories/firebase/session.firebase';
import { progressRepository } from '@/lib/repositories/progress.repository';
import { sessionRepository } from '@/lib/repositories/session.repository';
import { userRepository } from '@/lib/repositories/user.repository';
import { markSynced } from './sync-status';

/** 初回 migration 済みフラグ (uid ごとに保持) */
const migrationStore = createLocalStore<Record<string, boolean>>(
  'tabi-study:firebase-migrated',
  'v1',
  {},
);

export function SyncCoordinator() {
  const auth = useAuth();
  const migratedThisMount = useRef(false);

  // 1) Auth が確定したら pull/push を実行
  useEffect(() => {
    if (!canSync(auth)) return;
    if (migratedThisMount.current) return;
    migratedThisMount.current = true;

    const uid = auth.uid!;
    const migrated = migrationStore.read() ?? {};

    (async () => {
      // --- Pull: Firestore → local (あれば) -------------------
      try {
        await userRepositoryFirebase.getCurrentUser();
      } catch {
        /* ignore */
      }
      await pullProgressIfFresher();
      await pullSessionIfMissing();

      // --- Push: 初回 migration -----------------------------
      if (!migrated[uid]) {
        const localUser = userRepository.getCurrentUserSync();
        if (localUser) {
          // profile を Firestore に同期 (updateProfile は内部でバックグラウンド push)
          void userRepositoryFirebase.updateProfile({
            displayName: localUser.displayName,
            examDate: localUser.examDate,
            dailyGoalMinutes: localUser.dailyGoalMinutes,
            dailyGoalQuestions: localUser.dailyGoalQuestions,
          });
        }

        // progress: totals.answered > 0 のときだけ push
        const p = progressRepository.getAll();
        if ((p.totals?.answered ?? 0) > 0) {
          schedulePushProgress();
          await flushPushProgress();
        }

        // session: 現在のローカル値を push
        if (sessionRepository.get()) {
          await pushSession();
        }

        migrationStore.write({ ...migrated, [uid]: true });
      }

      // pull/push 一連が問題なく終わった印
      markSynced();
    })().catch(() => {
      /* swallow: sync-status は個別 push/pull で既に markFailed 済 */
    });
  }, [auth]);

  // 2) tab 非表示 / アンマウント時に強制 flush (debounce 残りを飛ばす)
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        void flushPushProgress();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      void flushPushProgress();
    };
  }, []);

  return null;
}
