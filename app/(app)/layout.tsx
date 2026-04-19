import { BottomNav } from '@/components/nav/bottom-nav';
import { OnboardingGate } from '@/features/user/onboarding-gate';

/**
 * 認証後メイン領域のレイアウト。
 * - 未オンボーディングユーザーはゲートで onboarding にリダイレクト
 * - スマホ前提で max-w-[480px] に中央寄せ
 * - .pb-nav で safe-area + 下部ナビ高さ以上のクリアランスを確保
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <div className="relative min-h-[100dvh]">
        <main className="app-container pb-nav pt-safe">{children}</main>
        <BottomNav />
      </div>
    </OnboardingGate>
  );
}
