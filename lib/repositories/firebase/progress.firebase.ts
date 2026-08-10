/**
 * Firestore 同期レイヤ for ProgressRepository
 * ============================================================
 *  設計方針:
 *   - 既存の synchronous progressRepository (localStorage) は壊さず、
 *     この layer が「バックグラウンドで Firestore にミラーする」役割を持つ。
 *   - 書き込みは debounce して無駄な put を避ける。
 *   - 読み込みは auth 確立直後に 1 回だけ: Firestore 側が新しければローカルに流し込む。
 *   - 失敗してもアプリは継続利用できる (sync-status で UI に控えめに伝える)。
 * ============================================================
 */

import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebase, isFirebaseAvailable } from '@/lib/firebase/client';
import { currentUid } from '@/lib/firebase/auth';
import { progressDoc } from '@/lib/firebase/firestore-paths';
import { progressRepository as localProgress } from '@/lib/repositories/progress.repository';
import type { ProgressState } from '@/lib/types/progress';
import { markFailed, markSynced, markSyncing } from '@/features/sync/sync-status';

const DEBOUNCE_MS = 1_200;

interface RemoteProgressDoc {
  state: ProgressState;
  updatedAt: number; // ms (client 時計)
}

function extractState(data: Record<string, unknown> | undefined): RemoteProgressDoc | null {
  if (!data) return null;
  const state = data.state as ProgressState | undefined;
  const updatedAtRaw = (data.updatedAtMs ?? data.updatedAt) as number | undefined;
  if (!state || typeof state !== 'object') return null;
  // 最低限のフィールドチェック
  if (
    typeof state.daily !== 'object' ||
    typeof state.byQuestion !== 'object' ||
    typeof state.totals !== 'object'
  ) {
    return null;
  }
  return { state, updatedAt: typeof updatedAtRaw === 'number' ? updatedAtRaw : 0 };
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function pushNow() {
  const fb = getFirebase();
  const uid = currentUid();
  if (!fb || !uid) return;
  const state = localProgress.getAll();
  markSyncing();
  try {
    await setDoc(
      progressDoc(fb.db, uid),
      {
        state,
        updatedAtMs: Date.now(),
        updatedAt: serverTimestamp(),
        schemaVersion: 1,
      },
      { merge: true },
    );
    markSynced();
  } catch (e) {
    markFailed(e instanceof Error ? e.message : 'progress sync failed');
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[firebase] progress push failed', e);
    }
  }
}

/**
 * 書き込み要求 (debounce) — 学習中に毎問呼ばれても OK
 */
export function schedulePushProgress() {
  if (!isFirebaseAvailable()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void pushNow();
  }, DEBOUNCE_MS);
}

/** 強制即時 push (アンマウント時など) */
export async function flushPushProgress() {
  if (!isFirebaseAvailable()) return;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  await pushNow();
}

/**
 * 初回 pull: Firestore が新しいときだけローカルを上書き。
 *   - 判定は「Firestore 側の totals.answered がローカルより多い」
 *     or 「Firestore に updatedAtMs があり、ローカルに answered 0」
 *   を last-write-wins の簡易判定として採用。
 *   - これにより「古い端末でログインしても空データで上書き」が起きにくい。
 */
export async function pullProgressIfFresher(): Promise<'pulled' | 'skipped' | 'empty'> {
  const fb = getFirebase();
  const uid = currentUid();
  if (!fb || !uid) return 'skipped';
  try {
    const snap = await getDoc(progressDoc(fb.db, uid));
    if (!snap.exists()) return 'empty';
    const remote = extractState(snap.data() as Record<string, unknown>);
    if (!remote) return 'empty';

    const local = localProgress.getAll();
    const remoteAnswered = remote.state.totals?.answered ?? 0;
    const localAnswered = local.totals?.answered ?? 0;

    if (remoteAnswered > localAnswered || localAnswered === 0) {
      // ローカルを上書き (簡易マージ方針)
      // 書き込みは localProgress 側のインターフェイスでは直接出来ないため、
      // ここでは localStorage を直書きする (同一スキーマなので安全)
      try {
        window.localStorage.setItem(
          'tabi-study:progress:v1',
          JSON.stringify(remote.state),
        );
      } catch {
        /* quota 等: 無視して継続 */
      }
      return 'pulled';
    }
    return 'skipped';
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[firebase] progress pull failed', e);
    }
    return 'skipped';
  }
}
