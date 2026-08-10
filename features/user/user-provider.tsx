'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { userRepository } from '@/lib/repositories';
import type { OnboardingInput, UserProfile } from '@/lib/types/user';

interface Ctx {
  user: UserProfile | null;
  ready: boolean; // localStorage 読み出し完了フラグ
  completeOnboarding: (input: OnboardingInput) => Promise<UserProfile>;
  updateProfile: (patch: Partial<OnboardingInput>) => Promise<UserProfile>;
  signOut: () => void;
}

const UserContext = createContext<Ctx | null>(null);

/**
 * グローバルユーザー状態プロバイダ。
 * - 初期描画時は ready=false (サーバーと同値)
 * - マウント後に localStorage から読み出して ready=true
 * - 子コンポーネントは user?.displayName 等にアクセス可能
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const u = userRepository.getCurrentUserSync();
    setUser(u);
    setReady(true);
  }, []);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    const u = await userRepository.completeOnboarding(input);
    setUser(u);
    return u;
  }, []);

  const updateProfile = useCallback(async (patch: Partial<OnboardingInput>) => {
    const u = await userRepository.updateProfile(patch);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem('tabi-study:user-profile:v1');
    } catch {
      /* ignore */
    }
    setUser(null);
    router.replace('/onboarding');
  }, [router]);

  const value = useMemo<Ctx>(
    () => ({ user, ready, completeOnboarding, updateProfile, signOut }),
    [user, ready, completeOnboarding, updateProfile, signOut],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
