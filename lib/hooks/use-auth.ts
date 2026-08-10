/**
 * `useAuth` の re-export.
 * - 公開 API は `@/lib/hooks/use-auth` を使う想定。
 * - 実装本体は features/auth/auth-provider.tsx にある。
 */
export { useAuth, canSync, type AuthStatus } from '@/features/auth/auth-provider';
