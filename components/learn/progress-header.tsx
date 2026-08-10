'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  current: number; // 1-based
  total: number;
  correctCount: number;
  subjectLabel?: string;
  onClose?: () => void;
}

/**
 * 学習画面の上部ヘッダ。
 * 行1:  [×終了]  [—————— プログレスバー ——————]  [正解 3/5]
 * 行2:  モード名 (小さく·右寄せ)                [問題番号 3 of 5]
 *
 * 数字には必ず意味ラベル (「正解」「問題」) を添え、
 * 初見でも何を表しているか分かるように整える。
 */
export function ProgressHeader({
  current,
  total,
  correctCount,
  subjectLabel,
  onClose,
}: Props) {
  const router = useRouter();
  const answered = Math.max(0, current - 1); // 今までに答えた問題数
  const pct = Math.min(100, (answered / Math.max(1, total)) * 100);
  const displayCurrent = Math.min(current, total);

  return (
    <header className="sticky top-0 z-20 -mx-5 glass border-b border-border/40 px-5 pb-3 pt-3">
      {/* 行1: 終了 / 進捗バー / 正解ラベル */}
      <div className="flex items-center gap-3">
        <button
          aria-label="学習を終了してホームへ戻る"
          onClick={() => (onClose ? onClose() : router.push('/dashboard'))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight hover:bg-muted/80"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>

        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answered}
          aria-label={`${total}問中${answered}問を回答済み`}
        >
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500 ease-soft',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* 正解カウント: 必ずラベル "正解" を添える */}
        <div
          className="flex items-baseline gap-1 whitespace-nowrap"
          aria-label={`正解数 ${correctCount}問 / ${answered}問中`}
        >
          <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground">
            正解
          </span>
          <span className="font-display text-[13px] font-semibold tabular-nums tracking-tight text-foreground">
            {correctCount}
          </span>
          <span className="text-[10.5px] font-medium tabular-nums text-muted-foreground/80">
            / {answered}
          </span>
        </div>
      </div>

      {/* 行2: モード名 / 問題番号 (両方にラベル) */}
      <div className="mt-2 flex items-center justify-between text-[10.5px] font-medium">
        <span className="tracking-[0.16em] text-muted-foreground">
          {subjectLabel ?? '出題'}
        </span>
        <span className="flex items-baseline gap-1 text-muted-foreground">
          <span className="tracking-[0.18em]">問題</span>
          <span className="font-display font-semibold tabular-nums text-foreground/85">
            {displayCurrent}
          </span>
          <span className="text-muted-foreground/70">/ {total}</span>
        </span>
      </div>
    </header>
  );
}
