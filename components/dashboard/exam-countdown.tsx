'use client';

import { CalendarDays } from 'lucide-react';
import { daysUntil, formatJPDate } from '@/lib/utils/date';

export function ExamCountdown({ examDate }: { examDate: string }) {
  const d = new Date(examDate);
  const days = daysUntil(d);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-white/90 p-4 shadow-soft backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
          <CalendarDays className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[10px] font-bold tracking-[0.22em] text-muted-foreground">
            試 験 日 ま で
          </p>
          <p className="mt-0.5 text-[13px] font-medium tabular-nums text-foreground/85">
            {formatJPDate(d)}
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-[32px] font-semibold leading-none tabular-nums tracking-tight text-foreground">
          {days}
        </span>
        <span className="text-[13px] font-medium text-muted-foreground">日</span>
      </div>
    </div>
  );
}
