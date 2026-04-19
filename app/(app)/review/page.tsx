'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Flame, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HeatmapGrid } from '@/components/review/heatmap-grid';
import { PriorityList } from '@/components/review/priority-list';
import { MOCK_REVIEW_TOPICS, accuracyTier } from '@/lib/mock/review';
import { SUBJECT_IDS, SUBJECTS } from '@/lib/constants/subjects';

export default function ReviewPage() {
  const [filter, setFilter] = useState<'all' | (typeof SUBJECT_IDS)[number]>('all');
  const topics = useMemo(
    () =>
      filter === 'all'
        ? MOCK_REVIEW_TOPICS
        : MOCK_REVIEW_TOPICS.filter((t) => t.subject === filter),
    [filter],
  );

  const counts = useMemo(() => {
    const base = { red: 0, yellow: 0, green: 0 };
    for (const t of MOCK_REVIEW_TOPICS) base[accuracyTier(t.accuracy)]++;
    return base;
  }, []);

  const total = MOCK_REVIEW_TOPICS.length;
  const weakRatio = Math.round((counts.red / total) * 100);

  return (
    <div className="space-y-6 pb-2 pt-4 animate-fade-in-up">
      {/* ヘッダ */}
      <header>
        <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
          REVIEW
        </p>
        <h1 className="mt-0.5 font-display text-[22px] font-semibold leading-tight tracking-tight">
          あなたの弱点マップ
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          色が濃いトピックほど、優先して復習すべきサインです。
        </p>
      </header>

      {/* サマリカード */}
      <div className="grid grid-cols-3 gap-2.5">
        <SummaryCell
          label="要復習"
          value={counts.red}
          accent="text-warning"
          bg="bg-warning/8"
          dot="bg-warning"
        />
        <SummaryCell
          label="注意"
          value={counts.yellow}
          accent="text-[#B8860B]"
          bg="bg-[#FFD666]/20"
          dot="bg-[#F5B400]"
        />
        <SummaryCell
          label="定着"
          value={counts.green}
          accent="text-accent"
          bg="bg-accent/8"
          dot="bg-accent"
        />
      </div>

      {/* “次に何をやるか”CTA */}
      <Link
        href="/learn/quad"
        className="group relative block overflow-hidden rounded-[24px] p-[18px] tap-highlight shadow-premium"
        style={{
          background:
            'linear-gradient(135deg, hsl(11 78% 48%) 0%, hsl(16 78% 42%) 55%, hsl(8 68% 36%) 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(380px 120px at 20% -10%, rgba(255,255,255,0.2), transparent 55%)',
          }}
        />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18 text-white backdrop-blur">
            <Flame className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-white/85">
              NEXT UP
            </p>
            <p className="mt-0.5 font-display text-[17px] font-semibold leading-tight text-white">
              要復習の {counts.red} トピックから始める
            </p>
            <p className="mt-0.5 text-[11.5px] text-white/80 tabular-nums">
              正答率の低い順に出題します · 約 {Math.max(3, counts.red * 2)} 分
            </p>
          </div>
          <Target className="h-5 w-5 text-white/75" />
        </div>
      </Link>

      {/* 科目フィルタ */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          すべて
        </FilterChip>
        {SUBJECT_IDS.map((sid) => (
          <FilterChip
            key={sid}
            active={filter === sid}
            onClick={() => setFilter(sid)}
            colorVar={SUBJECTS[sid].colorVar}
          >
            {SUBJECTS[sid].shortName}
          </FilterChip>
        ))}
      </div>

      {/* 切替タブ */}
      <Tabs defaultValue="priority">
        <TabsList>
          <TabsTrigger value="priority">優先度</TabsTrigger>
          <TabsTrigger value="heatmap">マップ</TabsTrigger>
        </TabsList>

        <TabsContent value="priority">
          <div className="flex items-center justify-between pb-2">
            <p className="text-[13px] font-semibold">復習優先度順</p>
            <p className="text-[11px] text-muted-foreground">
              弱点率 {weakRatio}%
            </p>
          </div>
          <PriorityList topics={topics} />
        </TabsContent>

        <TabsContent value="heatmap">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <HeatmapGrid topics={topics} />
          </div>
        </TabsContent>
      </Tabs>

      <Button size="lg" className="mt-2 w-full" asChild>
        <Link href="/learn/binary">弱点だけ2択で特訓</Link>
      </Button>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  accent,
  bg,
  dot,
}: {
  label: string;
  value: number;
  accent: string;
  bg: string;
  dot: string;
}) {
  return (
    <div className={`rounded-2xl ${bg} p-3.5 border border-white/60 shadow-soft`}>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-[11px] font-semibold text-foreground/70">{label}</span>
      </div>
      <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${accent}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">トピック</p>
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
  colorVar,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  colorVar?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold tap-highlight transition-colors ${
        active
          ? colorVar
            ? `border-transparent text-white shadow-soft`
            : 'border-primary bg-primary text-white shadow-soft'
          : 'border-border/60 bg-white text-muted-foreground'
      }`}
      style={
        active && colorVar
          ? { background: `hsl(var(--${colorVar}))` }
          : undefined
      }
    >
      {children}
    </button>
  );
}
