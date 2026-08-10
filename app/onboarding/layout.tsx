/**
 * Onboarding layout — 下部ナビ無しのフルスクリーン。
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] bg-background">
      <div className="app-container min-h-[100dvh] flex flex-col">{children}</div>
    </div>
  );
}
