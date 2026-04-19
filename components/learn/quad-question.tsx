'use client';

import { Badge } from '@/components/ui/badge';
import { SUBJECTS } from '@/lib/constants/subjects';
import type { QuadQuestion } from '@/lib/types/question';

/**
 * 4択の設問カード。情報密度を落とし、選択肢1枚目までファーストビューに収める。
 */
export function QuadQuestionCard({ q }: { q: QuadQuestion }) {
  const subj = SUBJECTS[q.subject];
  return (
    <div className="rounded-[22px] border border-border/70 bg-card p-4 shadow-soft">
      {/* 1行でまとめる (科目 · トピック · 難易度) */}
      <div className="flex items-center gap-1.5">
        <Badge variant={q.subject}>{subj.shortName}</Badge>
        <span className="truncate text-[11.5px] font-medium text-muted-foreground">
          {q.topic}
        </span>
        <span className="ml-auto font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground/80">
          {'★'.repeat(q.difficulty)}
          <span className="text-foreground/15">{'★'.repeat(3 - q.difficulty)}</span>
        </span>
      </div>

      <div className="my-2.5 h-px w-full bg-border/60" />

      <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
        QUESTION
      </p>
      <p className="mt-1.5 text-[15.5px] font-medium leading-[1.75] tracking-[0.01em] text-foreground">
        {q.prompt}
      </p>
    </div>
  );
}
