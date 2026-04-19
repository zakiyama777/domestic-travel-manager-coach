import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/features/user/user-provider';

export const metadata: Metadata = {
  title: 'Tabi Study — 国内旅行業務取扱管理者',
  description:
    '国内旅行業務取扱管理者試験のための、1日3分から続けられる静かな学習アプリ。',
  applicationName: 'Tabi Study',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Tabi Study',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9F8F4' },
    { media: '(prefers-color-scheme: dark)', color: '#F9F8F4' },
  ],
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
