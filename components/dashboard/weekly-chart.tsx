'use client';

import type { DailyActivity } from '@/lib/types/stats';
import { weekdayJP } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

export function WeeklyChart({ data }: { data: DailyActivity[] }) {
  const max = Math.max(1, ...data.map((d) => d.questions));
  const todayIdx = data.length - 1;

  return (
    <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[11px] font-medium text-muted-foreground">学習した問題数</div>
        <div className="rounded-full bg-accent/10 px-2.5 py-1 font-display text-[10.5px] font-semibold tracking-wide text-accent">
          平均 <span className="tabular-nums">{Math.round(data.reduce((a, b) => a + b.questions, 0) / data.length)}</span>問/日
        </div>
      </div>

      <div className="flex items-end gap-2">
        {data.map((d, i) => {
          const date = new Date(d.date);
          const h = (d.questions / max) * 100;
          const active = i === todayIdx;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-[110px] w-full items-end">
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-700 ease-soft',
                    active
                      ? 'bg-gradient-to-t from-primary to-accent'
                      : d.questions === 0
                        ? 'bg-muted'
                        : 'bg-primary/35',
                  )}
                  style={{ height: `${Math.max(4, h)}%` }}
                  aria-label={`${date.getMonth() + 1}/${date.getDate()} ${d.questions}問`}
                />
                {active && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-bold text-background">
                    {d.questions}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium tracking-wide',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {weekdayJP(date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
