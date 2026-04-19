'use client';

import { SUBJECTS, SUBJECT_IDS } from '@/lib/constants/subjects';
import type { ReviewTopic } from '@/lib/mock/review';
import { accuracyTier } from '@/lib/mock/review';
import { cn } from '@/lib/utils/cn';

interface Props {
  topics: ReviewTopic[];
  onPick?: (t: ReviewTopic) => void;
}

/**
 * 3x縦リストのヒートマップ風グリッド。
 * 赤=緊急 / 黄=注意 / 緑=定着
 */
export function HeatmapGrid({ topics, onPick }: Props) {
  return (
    <div className="space-y-5">
      {SUBJECT_IDS.map((sid) => {
        const list = topics.filter((t) => t.subject === sid);
        if (list.length === 0) return null;
        const s = SUBJECTS[sid];
        return (
          <div key={sid}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: `hsl(var(--${s.colorVar}))` }}
              />
              <h3 className="text-[13px] font-semibold tracking-tight text-foreground/90">
                {s.name}
              </h3>
              <span className="text-[11px] text-muted-foreground">{list.length}トピック</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {list.map((t) => {
                const tier = accuracyTier(t.accuracy);
                return (
                  <button
                    key={t.id}
                    onClick={() => onPick?.(t)}
                    title={`${t.topic} — 正答率${Math.round(t.accuracy * 100)}%`}
                    className={cn(
                      'aspect-square rounded-lg border transition-transform tap-highlight',
                      tier === 'red' && 'bg-warning/70 border-warning/40',
                      tier === 'yellow' && 'bg-[#FFD666] border-[#FFD666]/50',
                      tier === 'green' && 'bg-accent/70 border-accent/40',
                    )}
                    style={{
                      opacity: 0.4 + t.accuracy * 0.6, // より低正答率ほど濃い色
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 rounded-xl bg-muted/60 py-2.5 text-[11px] text-muted-foreground">
        <LegendDot color="warning" label="要復習 (<50%)" />
        <LegendDot color="#FFD666" label="注意 (50-70%)" />
        <LegendDot color="accent" label="定着 (≧70%)" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const bg =
    color === 'warning'
      ? 'hsl(var(--warning))'
      : color === 'accent'
        ? 'hsl(var(--accent))'
        : color;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: bg }} />
      {label}
    </span>
  );
}
