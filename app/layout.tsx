import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/features/user/user-provider';

export const metadata: Metadata = {
  title: 'Tabi Study — 国内旅行業務取扱管理者',
  description:
    '国内旅行業務取扱管理者試験のための、1日3分から続けられる学習アプリ。',
  applicationName: 'Tabi Study',
  appleWebApp: {
    capable: true,
    title: 'Tabi Study',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#F9F8F4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-[100dvh] bg-background text-foreground">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
