'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, Layers, Sparkles, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ITEMS = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/learn/binary', label: '○×', icon: Target },
  { href: '/learn/quad', label: '4択', icon: Layers },
  { href: '/past', label: '過去問', icon: ScrollText },
  { href: '/review', label: '復習', icon: Sparkles },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインナビゲーション"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
    >
      <div className="app-container">
        <div className="glass pointer-events-auto mx-auto flex items-center justify-between rounded-full border border-white/70 px-1.5 py-1.5 shadow-premium">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/dashboard'
                ? pathname === '/' || pathname?.startsWith('/dashboard')
                : pathname?.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-2 tap-highlight',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon
                  strokeWidth={active ? 2.4 : 1.8}
                  className={cn(
                    'h-5 w-5 transition-transform',
                    active ? 'scale-110' : 'scale-100',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-wide',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
                {active && (
                  <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
