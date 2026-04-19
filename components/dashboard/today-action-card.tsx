'use client';

import Link from 'next/link';
import { ArrowRight, Clock3, Target } from 'lucide-react';
import type { RecommendedAction } from '@/lib/types/stats';

/**
 * 「今日やるべきこと」1等CTA。
 * - ダッシュボード最上段に置き、視線が1秒で落ちる導線
 * - 金属的な深いグラデ + 光沢 + 大きなタップターゲット
 */
export function TodayActionCard({ action }: { action: RecommendedAction }) {
  return (
    <Link
      href={action.deepLink}
      className="group relative block overflow-hidden rounded-[28px] p-[22px] tap-highlight shadow-premium"
      style={{
        background:
          'linear-gradient(140deg, hsl(221 70% 28%) 0%, hsl(221 70% 22%) 50%, hsl(172 68% 24%) 100%)',
      }}
    >
      {/* 光沢の斜めハイライト */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(420px 140px at 25% -10%, rgba(255,255,255,0.22), transparent 55%)',
        }}
      />
      {/* 下部の深み */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.18), transparent)',
        }}
      />

      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden />
          <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.24em] text-white/85">
            今日のはじめの一問
          </span>
        </div>

        <h3 className="font-display text-[22px] font-semibold leading-[1.35] tracking-tight text-white">
          {action.title}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.75] text-white/75">{action.subtitle}</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-sm">
              <Clock3 className="h-3 w-3" strokeWidth={2.4} />
              <span className="tabular-nums">約 {action.estMinutes} 分</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-sm">
              <Target className="h-3 w-3" strokeWidth={2.4} />弱点から出題
            </div>
          </div>
          <div
            aria-label="この問題を始める"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-transform group-active:scale-95"
          >
            <ArrowRight className="h-5 w-5" strokeWidth={2.6} />
          </div>
        </div>
      </div>
    </Link>
  );
}
