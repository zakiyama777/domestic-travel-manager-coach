'use client';

import { cn } from '@/lib/utils/cn';

interface HeroProgressProps {
  doneMinutes: number;
  goalMinutes: number;
  doneQuestions: number;
  goalQuestions: number;
  streakDays: number;
}

/**
 * Appleヘルスケア風の進捗リング + 右側にスタッツ。
 * - リング: primary → accent のグラデ
 * - 背景: 紙のような暖かいオフホワイト + 淡いグロー2つ
 */
export function HeroProgress({
  doneMinutes,
  goalMinutes,
  doneQuestions,
  goalQuestions,
  streakDays,
}: HeroProgressProps) {
  const pct = Math.min(1, doneMinutes / Math.max(1, goalMinutes));
  const size = 168;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] p-5',
        'bg-gradient-to-br from-white via-[hsl(36_30%_98%)] to-[hsl(172_40%_96%)]',
        'shadow-premium',
      )}
    >
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(hsl(var(--primary)/0.16), transparent 60%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(hsl(var(--accent)/0.14), transparent 60%)' }}
      />

      <div className="relative flex items-center gap-4">
        {/* リング */}
        <div className="relative shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            <defs>
              <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="hsl(var(--muted))"
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="url(#ring-grad)"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[9.5px] font-bold tracking-[0.22em] text-muted-foreground">
              本 日 達 成 率
            </span>
            <span className="mt-0.5 font-display text-[38px] font-semibold tabular-nums leading-none tracking-tight text-foreground">
              {Math.round(pct * 100)}
              <span className="ml-0.5 align-top text-lg font-semibold text-muted-foreground">%</span>
            </span>
            <span className="mt-1 text-[10.5px] font-medium tabular-nums text-muted-foreground">
              {doneMinutes} / {goalMinutes} 分
            </span>
          </div>
        </div>

        {/* サマリ */}
        <div className="flex-1 space-y-2.5">
          <StatRow
            label="解いた問題"
            value={`${doneQuestions}`}
            sub={`/ ${goalQuestions}問`}
          />
          <div className="h-px w-full bg-border/60" />
          <StatRow label="連続学習" value={`${streakDays}`} sub="日目" highlight />
          <div className="h-px w-full bg-border/60" />
          <StatRow
            label="目標まで"
            value={`${Math.max(0, goalMinutes - doneMinutes)}`}
            sub="分"
          />
        </div>
      </div>
    </section>
  );
}

function StatRow({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[11.5px] font-medium tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-0.5">
        <span
          className={cn(
            'font-display tabular-nums tracking-tight',
            highlight
              ? 'text-[22px] font-semibold text-gradient-primary'
              : 'text-[18px] font-semibold text-foreground',
          )}
        >
          {value}
        </span>
        <span className="text-[10.5px] font-medium text-muted-foreground">{sub}</span>
      </span>
    </div>
  );
}
