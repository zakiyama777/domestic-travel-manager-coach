'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { questionBankRepository } from '@/lib/repositories/question-bank.repository';
import { PAST_EXAM_SECTION_LABELS, EXAM_TYPE_LABELS } from '@/lib/types/past-exam';
import type { SubjectId } from '@/lib/constants/subjects';

export default function PastExamSectionIndexPage() {
  const router = useRouter();
  const params = useParams<{ year: string }>();
  const year = params?.year ?? '';

  const yearMeta = useMemo(
    () => questionBankRepository.getPastExamYears().find((y) => y.year === year),
    [year],
  );

  const sections: Array<{ id: SubjectId; count: number }> = [
    { id: 'law', count: yearMeta?.counts.law ?? 0 },
    { id: 'terms', count: yearMeta?.counts.terms ?? 0 },
    { id: 'practice', count: yearMeta?.counts.practice ?? 0 },
  ];

  return (
    <div className="space-y-6 pt-3 animate-fade-in-up">
      <header className="flex items-center gap-3 pt-1">
        <button
          onClick={() => router.back()}
          aria-label="前の画面へ戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
              PAST EXAM
            </p>
            {yearMeta?.examType && (
              <span
                className={
                  'inline-flex items-center rounded-full px-2 py-0.5 font-display text-[9.5px] font-bold tracking-[0.14em] ' +
                  (yearMeta.examType === 'sample'
                    ? 'bg-warning/15 text-warning'
                    : 'bg-primary/10 text-primary')
                }
              >
                {EXAM_TYPE_LABELS[yearMeta.examType]}
              </span>
            )}
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-tight">
            {yearMeta?.label ?? year}
          </h1>
        </div>
      </header>

      {!yearMeta ? (
        <div className="rounded-[24px] border border-dashed border-border/60 bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            年度 {year} の過去問が見つかりません。
          </p>
          <Link
            href="/past"
            className="mt-3 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            年度一覧へ戻る
          </Link>
        </div>
      ) : (
        <>
          <p className="px-1 text-xs text-muted-foreground">
            科目を選んで挑戦しましょう。全科目まとめて挑戦することもできます。
          </p>

          <div className="space-y-3">
            {/* 全科目 */}
            <Link
              href={`/past/${year}/all`}
              className="group relative block overflow-hidden rounded-[24px] border border-border/60 bg-card p-5 shadow-soft tap-highlight"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Layers className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-primary">
                    ALL SECTIONS
                  </p>
                  <p className="mt-0.5 font-display text-[16px] font-semibold tracking-tight">
                    全科目まとめて挑戦
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    原問順で {yearMeta.total} 問
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>

            {/* 科目別 */}
            {sections.map((s) => {
              const label = PAST_EXAM_SECTION_LABELS[s.id];
              const disabled = s.count === 0;
              return disabled ? (
                <div
                  key={s.id}
                  aria-disabled
                  className="relative block overflow-hidden rounded-[24px] border border-dashed border-border/60 bg-muted/30 p-5 opacity-70"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <span className="font-display text-xs font-bold">—</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[16px] font-semibold tracking-tight text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        この科目は未登録です
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={s.id}
                  href={`/past/${year}/${s.id}`}
                  className="group relative block overflow-hidden rounded-[24px] border border-border/60 bg-card p-5 shadow-soft tap-highlight"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <span className="font-display text-sm font-bold">
                        {s.count}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[16px] font-semibold tracking-tight">
                        {label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.count} 問
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-active:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
