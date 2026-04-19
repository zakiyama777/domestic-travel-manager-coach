'use client';

/**
 * AuthProvider
 * ============================================================
 *  アプリ全体に認証状態を供給する。
 *  - Firebase 設定が揃っていれば 起動時に匿名サインインを試みる。
 *  - 設定が無い / オフライン / サインイン失敗 の場合も、
 *    `status = 'local-only'` に落ちてアプリは継続利用できる。
 *  - "loading forever" を防ぐため、初期化はタイムアウト付き。
 *
 *  UI 側は `useAuth()` で `{ uid, status, ready }` を受け取るだけで OK。
 * ============================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebase, isFirebaseAvailable } from '@/lib/firebase/client';
import { ensureAnonymousUser } from '@/lib/firebase/auth';

/**
 * 認証の状態ラベル
 *  - initializing  : 初期化中 (UI には出さず、即 local fallback で動かせる)
 *  - anonymous     : 匿名認証済み (Firestore 同期可)
 *  - authenticated : (将来) Google/Email 等で本認証済み
 *  - local-only    : Firebase 無効 or 失敗。ローカル保存のみで継続
 */
export type AuthStatus = 'initializing' | 'anonymous' | 'authenticated' | 'local-only';

interface AuthCtx {
  /** Firebase user uid (local-only 時は null) */
  uid: string | null;
  /** 表示用の状態 */
  status: AuthStatus;
  /** 初期化ループが終わっているか (UI で spinner を出すときだけ参照) */
  ready: boolean;
  /** Firebase の設定が env に揃っているか (UI の説明文に使う) */
  firebaseConfigured: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseAvailable() ? 'initializing' : 'local-only',
  );
  const [ready, setReady] = useState<boolean>(!isFirebaseAvailable());

  // 1 度だけ init を走らせる (strict mode での二重実行対策)
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    // Firebase 未設定なら即 local-only で ready
    if (!isFirebaseAvailable()) {
      setStatus('local-only');
      setReady(true);
      return;
    }

    const fb = getFirebase();
    if (!fb) {
      setStatus('local-only');
      setReady(true);
      return;
    }

    let cancelled = false;

    // 継続監視: currentUser 変化に追従 (将来の sign-out / upgrade 対応)
    const unsub = onAuthStateChanged(fb.auth, (user: User | null) => {
      if (cancelled) return;
      if (user) {
        setUid(user.uid);
        // 匿名か否かは isAnonymous で判定
        setStatus(user.isAnonymous ? 'anonymous' : 'authenticated');
      } else {
        setUid(null);
      }
    });

    // 初回: 匿名サインインまで進める (タイムアウトあり)
    ensureAnonymousUser()
      .then((user) => {
        if (cancelled) return;
        if (user) {
          setUid(user.uid);
          setStatus(user.isAnonymous ? 'anonymous' : 'authenticated');
        } else {
          // sign-in 失敗 → local-only にフォールバック
          setStatus('local-only');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('local-only');
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
      try {
        unsub();
      } catch {
        /* noop */
      }
    };
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      uid,
      status,
      ready,
      firebaseConfigured: isFirebaseAvailable(),
    }),
    [uid, status, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // 呼び出し側が Provider の外でも壊さない (SSR safety)
    return {
      uid: null,
      status: 'local-only',
      ready: true,
      firebaseConfigured: false,
    };
  }
  return ctx;
}

/** 「いま Firestore に書いて良いか」の判定ヘルパ */
export function canSync(ctx: AuthCtx): boolean {
  return (
    ctx.ready &&
    !!ctx.uid &&
    (ctx.status === 'anonymous' || ctx.status === 'authenticated')
  );
}

export default useAuth;
