'use client';

import Link from 'next/link';
import { PlayCircle, X } from 'lucide-react';
import type { LearningSession } from '@/lib/types/session';

interface Props {
  session: LearningSession;
  onDismiss?: () => void;
}

const MODE_LABEL: Record<LearningSession['mode'], string> = {
  binary: '○ × 形式',
  quad: '4 択 形式',
};

const MODE_HREF: Record<LearningSession['mode'], string> = {
  binary: '/learn/binary',
  quad: '/learn/quad',
};

/**
 * 「続きから再開」カード
 * --------------------------------------------------------------
 *  - 途中で離脱した学習セッションが localStorage に残っていれば表示
 *  - タップで該当モードへ戻る (現状は常に最初からになるが、同じ導線に入る)
 *  - 右上 × で今回は無視
 * --------------------------------------------------------------
 */
export function ResumeCard({ session, onDismiss }: Props) {
  const total = session.questionIds.length;
  const remaining = Math.max(0, total - session.answeredCount);
  const pct = Math.round((session.answeredCount / Math.max(1, total)) * 100);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-primary/25 bg-white p-[18px] shadow-soft">
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="このお知らせを閉じる"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted tap-highlight"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}

      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
        <span className="font-display text-[10.5px] font-bold tracking-[0.22em] text-primary">
          CONTINUE
        </span>
      </div>

      <h3 className="mt-1.5 font-display text-[16px] font-semibold tracking-tight">
        {MODE_LABEL[session.mode]}の続きから
      </h3>
      <p className="mt-0.5 text-[12.5px] leading-[1.7] text-muted-foreground">
        残り{' '}
        <span className="font-display font-semibold tabular-nums text-foreground/85">
          {remaining}
        </span>{' '}
        問 · 正解{' '}
        <span className="font-display font-semibold tabular-nums text-foreground/85">
          {session.correctCount}
        </span>{' '}
        問
      </p>

      {/* 進捗バー */}
      <div
        className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={session.answeredCount}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500 ease-soft"
          style={{ width: `${pct}%` }}
        />
      </div>

      <Link
        href={MODE_HREF[session.mode]}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-display text-[13px] font-semibold text-white shadow-soft tap-highlight transition-transform active:scale-[0.98]"
      >
        <PlayCircle className="h-4 w-4" strokeWidth={2.4} />
        続きから
      </Link>
    </div>
  );
}
