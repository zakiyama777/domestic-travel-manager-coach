'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Settings2 } from 'lucide-react';
import { HeroProgress } from '@/components/dashboard/hero-progress';
import { TodayActionCard } from '@/components/dashboard/today-action-card';
import { WeeklyChart } from '@/components/dashboard/weekly-chart';
import { WeaknessTop5 } from '@/components/dashboard/weakness-top5';
import { SubjectMastery } from '@/components/dashboard/subject-mastery';
import { useUser } from '@/features/user/user-provider';
import { statsRepository } from '@/lib/repositories';
import type { DashboardSummary } from '@/lib/types/stats';
import { examStatus, formatJPDate } from '@/lib/utils/date';

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    statsRepository.getDashboard().then(setData);
  }, []);

  if (!user || !data) {
    return <DashboardSkeleton />;
  }

  const status = examStatus(user.examDate);
  const name = user.displayName;

  return (
    <div className="space-y-6 pb-2 pt-4 animate-fade-in-up">
      {/* 0. パーソナライズドヘッダ */}
      <header className="pt-1">
        <div className="flex items-center justify-between">
          <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
            TABI · STUDY
          </p>
          <Link
            href="/settings"
            aria-label="プロフィールと設定"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white text-foreground/70 shadow-soft tap-highlight hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>

        <h1 className="mt-2 font-display text-[24px] font-semibold leading-tight tracking-tight text-foreground">
          {name}さん、おかえりなさい
        </h1>
        <ExamLine status={status} />
      </header>

      {/* 1. 視線集中CTA: 今日の1問目 */}
      <TodayActionCard action={data.recommendedAction} />

      {/* 2. 今日の進捗リング */}
      <SectionTitle label="今日の進捗" />
      <HeroProgress
        doneMinutes={data.todayDoneMinutes}
        goalMinutes={user.dailyGoalMinutes}
        doneQuestions={data.todayDoneQuestions}
        goalQuestions={user.dailyGoalQuestions}
        streakDays={data.streakDays}
      />

      {/* 3. 7日推移 */}
      <SectionTitle label="学習の推移" sub="直近 7 日" />
      <WeeklyChart data={data.last7Days} />

      {/* 4. 科目別理解度 */}
      <SectionTitle label="科目別の理解度" sub="3 科目バランスよく" />
      <SubjectMastery items={data.subjectMastery} />

      {/* 5. 弱点Top5 */}
      <SectionTitle
        label="弱点 Top 5"
        action={{ href: '/review', label: 'すべて見る' }}
      />
      <WeaknessTop5 items={data.weaknessTop5} />

      {/* 6. 弱点克服への再挑戦導線 */}
      <Link
        href="/review"
        className="group relative block overflow-hidden rounded-[24px] border border-border/60 bg-card p-5 shadow-soft tap-highlight"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <span className="font-display text-lg font-semibold">!</span>
          </div>
          <div className="flex-1">
            <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-warning">
              REVIEW
            </p>
            <p className="mt-0.5 font-display text-[16px] font-semibold tracking-tight">
              弱点だけを集めて、静かに潰す
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              正答率 60% 未満のトピックから優先して出題します。
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-active:translate-x-0.5" />
        </div>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 試験日メッセージ (未設定 / 当日 / 未来 / 過去 を出し分け)              */
/* ------------------------------------------------------------------ */
function ExamLine({ status }: { status: ReturnType<typeof examStatus> }) {
  if (status.kind === 'unset') {
    return (
      <p className="mt-1.5 text-[13.5px] leading-[1.7] text-muted-foreground">
        試験日が未設定です。
        <Link
          href="/settings"
          className="ml-1 font-semibold text-primary underline-offset-4 hover:underline"
        >
          日付を設定する
        </Link>
      </p>
    );
  }

  if (status.kind === 'today') {
    return (
      <p className="mt-1.5 text-[13.5px] leading-[1.7] text-foreground/80">
        <span className="font-semibold text-primary">いよいよ本日、試験当日です。</span>
        <span className="ml-1 text-muted-foreground tabular-nums">
          ({formatJPDate(status.date)})
        </span>
      </p>
    );
  }

  if (status.kind === 'past') {
    return (
      <p className="mt-1.5 text-[13.5px] leading-[1.7] text-muted-foreground">
        前回の試験日から
        <span className="mx-1 font-display font-semibold tabular-nums text-foreground/80">
          {status.daysAgo} 日
        </span>
        が経過しました。
        <Link
          href="/settings"
          className="ml-1 font-semibold text-primary underline-offset-4 hover:underline"
        >
          次の試験日を設定
        </Link>
      </p>
    );
  }

  // upcoming
  return (
    <p className="mt-1.5 text-[13.5px] leading-[1.7] text-foreground/75">
      試験まであと
      <span className="mx-1 font-display text-[16px] font-semibold tabular-nums text-primary">
        {status.days}
      </span>
      日です。
      <span className="ml-0.5 text-muted-foreground tabular-nums">
        ({formatJPDate(status.date)})
      </span>
    </p>
  );
}

function SectionTitle({
  label,
  sub,
  action,
}: {
  label: string;
  sub?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-baseline justify-between px-0.5 pt-1">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-[13px] font-semibold tracking-tight text-foreground/90">
          {label}
        </h2>
        {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-[12px] font-semibold text-primary tap-highlight"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 pt-6">
      <div className="h-6 w-32 animate-pulse-soft rounded-md bg-muted" />
      <div className="h-8 w-64 animate-pulse-soft rounded-md bg-muted" />
      <div className="h-40 animate-pulse-soft rounded-[28px] bg-muted" />
      <div className="h-40 animate-pulse-soft rounded-[28px] bg-muted" />
    </div>
  );
}
