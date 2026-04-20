'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { questionBankRepository } from '@/lib/repositories/question-bank.repository';
import { PAST_EXAM_SECTION_LABELS } from '@/lib/types/past-exam';

export default function PastExamYearIndexPage() {
  const router = useRouter();
  const years = useMemo(() => questionBankRepository.getPastExamYears(), []);

  return (
    <div className="space-y-6 pt-3 animate-fade-in-up">
      {/* ヘッダ */}
      <header className="flex items-center gap-3 pt-1">
        <button
          onClick={() => router.back()}
          aria-label="前の画面へ戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>
        <div>
          <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
            PAST EXAM
          </p>
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            過去問
          </h1>
        </div>
      </header>

      <p className="px-1 text-xs text-muted-foreground">
        本試験の雰囲気に慣れるための過去問演習モード。年度を選ぶと、
        旅行業法 / 約款 / 国内旅行実務の 3 科目に分かれて出題されます。
      </p>

      {years.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-border/60 bg-card p-8 text-center">
          <ScrollText className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            まだ過去問が登録されていません。
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/80">
            content/past-exams/ に年度ファイルを追加し
            npm run build:questions を実行してください。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map((y) => (
            <Link
              key={y.year}
              href={`/past/${y.year}`}
              className="group relative block overflow-hidden rounded-[24px] border border-border/60 bg-card p-5 shadow-soft tap-highlight"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="font-display text-sm font-bold">
                    {y.year}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-primary">
                    {y.year}
                  </p>
                  <p className="mt-0.5 font-display text-[16px] font-semibold tracking-tight">
                    {y.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    全 {y.total} 問 ｜ 法令 {y.counts.law} ・ 約款 {y.counts.terms} ・ 実務 {y.counts.practice}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-active:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 補足: 将来の年度追加予告 */}
      <div className="rounded-[20px] bg-muted/50 p-4">
        <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
          COMING SOON
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          R04 / R05 / R02 以前も順次追加予定です。
          {(['law', 'terms', 'practice'] as const).map((s, i) => (
            <span key={s}>
              {i > 0 && ' ・ '}
              <span className="font-medium text-foreground/80">{PAST_EXAM_SECTION_LABELS[s]}</span>
            </span>
          ))}
          の 3 科目構成で取り込みます。
        </p>
      </div>
    </div>
  );
}
