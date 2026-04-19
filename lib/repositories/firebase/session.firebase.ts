/**
 * Firestore 同期レイヤ for SessionRepository
 * ============================================================
 *  中断セッション (現在進めているクイズ) を Firestore にミラーし、
 *  端末を変えても「続きから」が拾えるようにする薄いレイヤ。
 * ============================================================
 */

import { deleteDoc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebase, isFirebaseAvailable } from '@/lib/firebase/client';
import { currentUid } from '@/lib/firebase/auth';
import { sessionDoc } from '@/lib/firebase/firestore-paths';
import { sessionRepository as localSession } from '@/lib/repositories/session.repository';
import type { LearningSession } from '@/lib/types/session';
import { markFailed, markSynced, markSyncing } from '@/features/sync/sync-status';

function extractSession(
  data: Record<string, unknown> | undefined,
): LearningSession | null {
  if (!data) return null;
  const mode = data.mode;
  const questionIds = data.questionIds;
  const answeredCount = data.answeredCount;
  const correctCount = data.correctCount;
  const startedAt = data.startedAt;
  const updatedAt = data.updatedAtMs ?? data.updatedAt;

  if (
    (mode !== 'binary' && mode !== 'quad') ||
    !Array.isArray(questionIds) ||
    typeof answeredCount !== 'number' ||
    typeof correctCount !== 'number' ||
    typeof startedAt !== 'number'
  ) {
    return null;
  }
  return {
    mode,
    questionIds: questionIds.filter((q): q is string => typeof q === 'string'),
    answeredCount,
    correctCount,
    startedAt,
    updatedAt: typeof updatedAt === 'number' ? updatedAt : Date.now(),
  };
}

export async function pushSession(): Promise<void> {
  const fb = getFirebase();
  const uid = currentUid();
  if (!fb || !uid) return;
  const s = localSession.get();
  try {
    if (!s) {
      await deleteDoc(sessionDoc(fb.db, uid)).catch(() => {
        /* 既に無ければ OK */
      });
      return;
    }
    markSyncing();
    await setDoc(
      sessionDoc(fb.db, uid),
      {
        ...s,
        updatedAtMs: Date.now(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    markSynced();
  } catch (e) {
    markFailed(e instanceof Error ? e.message : 'session sync failed');
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[firebase] session push failed', e);
    }
  }
}

export async function pullSessionIfMissing(): Promise<'pulled' | 'skipped' | 'empty'> {
  const fb = getFirebase();
  const uid = currentUid();
  if (!fb || !uid) return 'skipped';
  try {
    // ローカルに既に有効なセッションがあれば優先
    if (localSession.get()) return 'skipped';

    const snap = await getDoc(sessionDoc(fb.db, uid));
    if (!snap.exists()) return 'empty';
    const remote = extractSession(snap.data() as Record<string, unknown>);
    if (!remote) return 'empty';
    // 完了済セッションは拾わない
    if (remote.answeredCount >= remote.questionIds.length) return 'empty';

    try {
      window.localStorage.setItem('tabi-study:session:v1', JSON.stringify(remote));
    } catch {
      /* ignore */
    }
    return 'pulled';
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[firebase] session pull failed', e);
    }
    return 'skipped';
  }
}

export function schedulePushSession() {
  if (!isFirebaseAvailable()) return;
  // セッションは書き込み頻度が低い (問題確定時のみ) ので debounce 不要
  void pushSession();
}
