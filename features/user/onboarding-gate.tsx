'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/features/user/user-provider';

/**
 * (app) グループ配下で使うガード。
 * - ready を待ってから user の有無を判定
 * - 未オンボーディング時のみ /onboarding へリダイレクト
 * - ready 中は静かな placeholder を出してチラつきを防ぐ
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user?.onboarded) {
      router.replace('/onboarding');
    }
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-pulse-soft rounded-full bg-primary/20" />
      </div>
    );
  }

  if (!user?.onboarded) {
    // リダイレクト実行中の一瞬
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-pulse-soft rounded-full bg-primary/20" />
      </div>
    );
  }

  return <>{children}</>;
}
