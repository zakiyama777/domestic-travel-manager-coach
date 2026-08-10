/**
 * Firebase 設定値のロード + バリデーション
 * ============================================================
 * - NEXT_PUBLIC_* の環境変数を読み、値が揃っていなければ
 *   `isFirebaseConfigured = false` を返して初期化をスキップする。
 * - これにより「環境変数未設定で画面が真っ白」を防ぐ。
 * ============================================================
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function readEnv(key: string): string {
  // Next.js の client bundle では process.env.NEXT_PUBLIC_* が静的置換される。
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : '';
}

const rawConfig: FirebaseClientConfig = {
  apiKey: readEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

/** 6 項目すべてが埋まっていれば true。1 つでも欠けていれば false */
export const isFirebaseConfigured: boolean = Object.values(rawConfig).every(
  (v) => v.length > 0,
);

export const firebaseConfig: FirebaseClientConfig = rawConfig;
