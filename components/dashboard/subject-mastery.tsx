'use client';

import type { SubjectMastery as Item } from '@/lib/types/stats';
import { SUBJECTS } from '@/lib/constants/subjects';

export function SubjectMastery({ items }: { items: Item[] }) {
  return (
    <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-soft">
      <ul className="space-y-4">
        {items.map((m) => {
          const subj = SUBJECTS[m.subject];
          const pct = Math.round(m.mastery * 100);
          return (
            <li key={m.subject}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: `hsl(var(--${subj.colorVar}))` }}
                  />
                  <span className="text-[13px] font-semibold">{subj.name}</span>
                </div>
                <span className="font-display text-sm font-semibold tabular-nums text-foreground">
                  {pct}
                  <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">
                    %
                  </span>
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-soft"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, hsl(var(--${subj.colorVar})/0.8), hsl(var(--${subj.colorVar})))`,
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {m.answered} / {m.totalQuestions} 問
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
