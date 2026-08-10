'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SUBJECTS } from '@/lib/constants/subjects';
import type { WeaknessItem } from '@/lib/types/stats';
import { Badge } from '@/components/ui/badge';

export function WeaknessTop5({ items }: { items: WeaknessItem[] }) {
  return (
    <div className="rounded-[24px] border border-border/60 bg-card px-5 py-3 shadow-soft">
      <ul className="divide-y divide-border/60">
        {items.map((w, i) => {
          const subject = SUBJECTS[w.subject];
          const pct = Math.round(w.accuracy * 100);
          return (
            <li key={i}>
              <Link
                href={`/review?topic=${encodeURIComponent(w.topic)}`}
                className="group -mx-1 flex items-center gap-3 rounded-xl px-1 py-3 tap-highlight"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-display text-[13px] font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {w.topic}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={w.subject}>{subject.shortName}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {w.attempts}回挑戦
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-base font-semibold tabular-nums text-warning">
                    {pct}
                    <span className="ml-0.5 text-[10px] font-medium">%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">正答率</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-active:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
