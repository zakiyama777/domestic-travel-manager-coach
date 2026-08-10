'use client';

import Link from 'next/link';
import { Flame, Clock3, Play } from 'lucide-react';
import { SUBJECTS } from '@/lib/constants/subjects';
import type { ReviewTopic } from '@/lib/mock/review';
import { accuracyTier } from '@/lib/mock/review';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface Props {
  topics: ReviewTopic[];
}

/**
 * 復習優先度リスト。
 * - 各行に "今すぐ開始" ボタンを直接配置 (タップ迷いゼロ)
 * - 行全体も詳細画面へのリンクとしたいが、ボタンと競合するため、
 *   行タップ = 学習開始 に統一 (最短導線)
 */
function priorityScore(t: ReviewTopic): number {
  const freshness = Math.min(1, t.lastSeenDaysAgo / 7);
  return (1 - t.accuracy) * 0.7 + freshness * 0.3;
}

export function PriorityList({ topics }: Props) {
  const ranked = [...topics].sort((a, b) => priorityScore(b) - priorityScore(a));

  return (
    <ul className="space-y-2.5">
      {ranked.map((t, i) => {
        const s = SUBJECTS[t.subject];
        const tier = accuracyTier(t.accuracy);
        const pct = Math.round(t.accuracy * 100);
        const href = `/learn/quad?topic=${encodeURIComponent(t.topic)}`;

        return (
          <li key={t.id}>
            <div className="group relative rounded-[20px] border border-border/60 bg-card p-3.5 pr-[60px] shadow-soft transition-shadow hover:shadow-premium">
              <Link
                href={href}
                className="flex items-start gap-3 tap-highlight"
                aria-label={`${t.topic} を学習開始`}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-semibold tabular-nums',
                    tier === 'red' && 'bg-warning/12 text-warning',
                    tier === 'yellow' && 'bg-[#E6B94B]/20 text-[#A47208]',
                    tier === 'green' && 'bg-accent/12 text-accent',
                  )}
                >
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1 pr-2">
                  <p className="truncate text-[14px] font-semibold tracking-tight text-foreground">
                    {t.topic}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted-foreground">
                    <Badge variant={t.subject}>{s.shortName}</Badge>
                    <span className="inline-flex items-center gap-0.5">
                      <Clock3 className="h-3 w-3" /> {t.lastSeenDaysAgo}日前
                    </span>
                    <span className="tabular-nums">{t.attempts}回</span>
                    {t.dueSoon && (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-warning">
                        <Flame className="h-3 w-3" /> 要復習
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-soft',
                          tier === 'red' && 'bg-warning',
                          tier === 'yellow' && 'bg-[#D9A521]',
                          tier === 'green' && 'bg-accent',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'font-display text-[12px] font-semibold tabular-nums',
                        tier === 'red' && 'text-warning',
                        tier === 'yellow' && 'text-[#A47208]',
                        tier === 'green' && 'text-accent',
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              </Link>

              {/* 独立した「今すぐ開始」CTA */}
              <Link
                href={href}
                aria-label={`${t.topic} を今すぐ開始`}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  'shadow-soft transition-all tap-highlight',
                  tier === 'red'
                    ? 'bg-warning text-white hover:brightness-105'
                    : tier === 'yellow'
                      ? 'bg-[#D9A521] text-white hover:brightness-105'
                      : 'bg-primary text-white hover:brightness-105',
                )}
                style={{
                  // 行タップリンクと独立させるため、視覚的にだけ浮かせる
                  // （上のLinkはabsoluteで埋めていないので両立する）
                }}
              >
                <Play className="h-4 w-4 translate-x-[1px]" strokeWidth={2.4} fill="currentColor" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
