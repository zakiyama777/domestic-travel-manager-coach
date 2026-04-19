/**
 * Firebase Auth ヘルパ (MVP: 匿名認証)
 * ============================================================
 * - `ensureAnonymousUser()` を呼ぶと、
 *   1) 既に onAuthStateChanged で user が返れば即解決
 *   2) いなければ signInAnonymously し、最初の auth state 変化を待つ
 * - タイムアウトを設けて "loading forever" を防ぐ。
 * - 将来 Google / Email を追加するときは、このファイルに
 *   signInWithGoogle() / signInWithEmail() を足していく想定。
 * ============================================================
 */

import {
  onAuthStateChanged,
  signInAnonymously,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { getFirebase } from './client';

const ENSURE_TIMEOUT_MS = 8_000;

/**
 * auth.currentUser が確定するまで待つ。
 * - 一度は onAuthStateChanged を通してから判断する (初期 null 対策)
 * - 時間切れなら null を返す (UI は local-only で継続)
 */
export function ensureAnonymousUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const fb = getFirebase();
    if (!fb) {
      resolve(null);
      return;
    }

    let settled = false;
    let unsub: Unsubscribe | null = null;

    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      try {
        unsub?.();
      } catch {
        /* noop */
      }
      resolve(user);
    };

    const timer = setTimeout(() => finish(null), ENSURE_TIMEOUT_MS);

    unsub = onAuthStateChanged(
      fb.auth,
      async (user) => {
        if (settled) return;
        if (user) {
          clearTimeout(timer);
          finish(user);
          return;
        }
        // 未ログインなら匿名サインインを試す
        try {
          const cred = await signInAnonymously(fb.auth);
          clearTimeout(timer);
          finish(cred.user);
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[firebase] anonymous sign-in failed', e);
          }
          clearTimeout(timer);
          finish(null);
        }
      },
      (err) => {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[firebase] auth state error', err);
        }
        clearTimeout(timer);
        finish(null);
      },
    );
  });
}

/** 現在のログイン user (ブラウザ側のみ) */
export function currentUid(): string | null {
  const fb = getFirebase();
  return fb?.auth.currentUser?.uid ?? null;
}
