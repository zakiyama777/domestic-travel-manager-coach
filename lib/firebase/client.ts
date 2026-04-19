/**
 * Firebase クライアント初期化 (二重初期化防止 + SSR 安全)
 * ============================================================
 * 設計:
 *   - `getFirebase()` はブラウザでのみ初期化。サーバーでは null を返す。
 *   - 環境変数が欠けていれば null を返し、アプリは local-only モードで継続。
 *   - Next.js の fast-refresh / 再マウントで複数回 init されないよう
 *     `getApps().length` でガード。
 * ============================================================
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './config';

export interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cached: FirebaseClient | null = null;

/**
 * Firebase のインスタンスを取得する。
 * - SSR (window === undefined) では null
 * - 環境変数不足時も null
 * - ブラウザ + 設定揃いなら singleton を返す
 */
export function getFirebase(): FirebaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured) return null;
  if (cached) return cached;

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    cached = { app, auth, db };
    return cached;
  } catch (e) {
    // init 失敗時は local-only にフォールバック
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[firebase] initialization failed, falling back to local-only', e);
    }
    return null;
  }
}

/** true のときは Firebase を使った機能 (同期など) を試みてよい */
export function isFirebaseAvailable(): boolean {
  return typeof window !== 'undefined' && isFirebaseConfigured;
}
