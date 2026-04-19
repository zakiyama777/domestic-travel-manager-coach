'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type State = 'idle' | 'selected' | 'correct' | 'incorrect' | 'revealed';

interface Props {
  label: string; // ア/イ/ウ/エ
  text: string;
  state: State;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * 4択の1選択肢。
 * - 高さは十分なタップ領域を確保しつつ、画面にちょうど4択が収まる密度に
 * - 選択時は border + ring の2重表現で仮状態を強調
 */
export function QuadChoice({ label, text, state, onSelect, disabled }: Props) {
  const base =
    'group relative w-full rounded-[18px] border bg-white px-3.5 py-3 text-left tap-highlight transition-all duration-200';

  const style: Record<State, string> = {
    idle:
      'border-border/70 shadow-soft hover:border-primary/40 active:scale-[0.995]',
    selected:
      'border-primary border-[1.5px] bg-primary/[0.04] shadow-soft ring-2 ring-primary/15',
    correct: 'border-accent border-[1.5px] bg-accent/[0.07] shadow-soft',
    incorrect: 'border-warning border-[1.5px] bg-warning/[0.07] shadow-soft',
    revealed: 'border-accent/40 bg-accent/[0.03] shadow-soft',
  };

  const labelStyle: Record<State, string> = {
    idle: 'bg-muted text-foreground/70',
    selected: 'bg-primary text-white shadow-soft',
    correct: 'bg-accent text-white shadow-soft',
    incorrect: 'bg-warning text-white shadow-soft',
    revealed: 'bg-accent/80 text-white',
  };

  return (
    <button
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={state !== 'idle' && state !== 'revealed'}
      className={cn(base, style[state], disabled && 'cursor-default')}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[12.5px] font-semibold transition-colors',
            labelStyle[state],
          )}
        >
          {label}
        </span>
        <span className="flex-1 text-[14px] leading-[1.65] tracking-[0.01em] text-foreground">
          {text}
        </span>
        {(state === 'correct' || state === 'revealed') && (
          <Check className="h-4.5 w-4.5 shrink-0 text-accent" strokeWidth={2.6} />
        )}
        {state === 'incorrect' && (
          <X className="h-4.5 w-4.5 shrink-0 text-warning" strokeWidth={2.6} />
        )}
      </div>
    </button>
  );
}
