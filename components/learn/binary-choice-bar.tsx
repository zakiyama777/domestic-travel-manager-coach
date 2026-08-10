'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  onPick: (ans: boolean) => void;
  disabled?: boolean;
}

/**
 * 親指で押せる大型○×ボタン。画面下部固定想定 (高さ72px)。
 * - タップ領域を大きく
 * - ボタン間隔も広めに取り、誤タップを抑制
 */
export function BinaryChoiceBar({ onPick, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        disabled={disabled}
        onClick={() => onPick(false)}
        aria-label="誤り"
        className={cn(
          'group relative flex h-[68px] items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-warning/30 bg-white text-warning shadow-soft tap-highlight transition-all',
          'hover:border-warning/60 hover:bg-warning/5 active:scale-[0.985] disabled:opacity-40',
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10">
          <X className="h-5 w-5" strokeWidth={2.6} />
        </span>
        <span className="font-display text-[17px] font-semibold tracking-wide">誤り</span>
      </button>
      <button
        disabled={disabled}
        onClick={() => onPick(true)}
        aria-label="正しい"
        className={cn(
          'group relative flex h-[68px] items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-accent/30 bg-white text-accent shadow-soft tap-highlight transition-all',
          'hover:border-accent/60 hover:bg-accent/5 active:scale-[0.985] disabled:opacity-40',
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
          <Check className="h-5 w-5" strokeWidth={2.6} />
        </span>
        <span className="font-display text-[17px] font-semibold tracking-wide">正しい</span>
      </button>
    </div>
  );
}
