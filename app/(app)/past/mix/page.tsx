'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, BookOpen, Home, RotateCcw, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { questionBankRepository } from '@/lib/repositories/question-bank.repository';
import { PAST_EXAM_SECTION_LABELS, EXAM_TYPE_LABELS } from '@/lib/types/past-exam';
import type { PastExamQuestion } from '@/lib/types/past-exam';
import { progressRepository } from '@/lib/repositories';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const LETTERS = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ'];
const DEFAULT_LIMIT = 10;

function isCorrect(q: PastExamQuestion, picked: number): boolean {
  if (Array.isArray(q.correctAnswer)) return q.correctAnswer.includes(picked);
  return q.correctAnswer === picked;
}
function correctIndices(q: PastExamQuestion): number[] {
  return Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
}

export default function PastExamMixPage() {
  const router = useRouter();
  // 年度横断・シャッフル・10問
  const questions = useMemo<PastExamQuestion[]>(
    () =>
      questionBankRepository.pickPastExam({
        shuffle: true,
        limit: DEFAULT_LIMIT,
      }),
    [],
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'feedback' | 'done'>('idle');
  const [correctCount, setCorrectCount] = useState(0);

  const total = questions.length;
  const current = questions[index];

  useEffect(() => {
    if (total > 0 && index >= total) setPhase('done');
  }, [index, total]);

  if (total === 0) {
    return (
      <div className="space-y-6 pt-3 animate-fade-in-up">
        <header className="flex items-center gap-3 pt-1">
          <Link
            href="/past"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
          >
            <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
          </Link>
          <div>
            <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
              MIX
            </p>
            <h1 className="font-display text-[22px] font-semibold tracking-tight">
              過去問がまだ登録されていません
            </h1>
          </div>
        </header>
        <p className="px-1 text-sm text-muted-foreground">
          content/past-exams/ に年度ファイルを追加して npm run build:questions を実行してください。
        </p>
      </div>
    );
  }

  if (phase === 'done') {
    const pct = Math.round((correctCount / total) * 100);
    return (
      <div className="space-y-6 pt-3 animate-fade-in-up">
        <header className="flex items-center gap-3 pt-1">
          <Link
            href="/past"
            aria-label="年度一覧に戻る"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
          >
            <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
          </Link>
          <div>
            <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
              RESULT
            </p>
            <h1 className="font-display text-[22px] font-semibold tracking-tight">
              年度横断演習
            </h1>
          </div>
        </header>

        <div className="rounded-[24px] border border-border/60 bg-card p-8 text-center shadow-soft">
          <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-primary">
            SCORE
          </p>
          <p className="mt-2 font-display text-[54px] font-semibold leading-none tracking-tight">
            {pct}
            <span className="ml-1 text-[22px] text-muted-foreground">%</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {correctCount} / {total} 問 正解
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.refresh()}
            className="w-full gap-2"
          >
            <RotateCcw className="h-4 w-4" /> 新しい 10 問で挑戦
          </Button>
          <Link
            href="/past"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-muted py-3 text-sm font-medium text-foreground/80 tap-highlight"
          >
            年度一覧へ戻る
          </Link>
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-xs text-muted-foreground tap-highlight"
          >
            <Home className="h-3.5 w-3.5" /> ダッシュボードへ
          </Link>
        </div>
      </div>
    );
  }

  const selectOption = (i: number) => {
    if (phase !== 'idle') return;
    haptic('light');
    setPicked(i);
  };
  const confirm = () => {
    if (phase !== 'idle' || picked === null || !current) return;
    const ok = isCorrect(current, picked);
    if (ok) {
      haptic('success');
      setCorrectCount((n) => n + 1);
    } else {
      haptic('error');
    }
    try {
      progressRepository.recordAnswer({
        questionId: current.id,
        subject: current.section,
        topic:
          current.topic ??
          `${current.year} ${PAST_EXAM_SECTION_LABELS[current.section]} 問${current.originalQuestionNumber}`,
        correct: ok,
      });
    } catch {
      /* ignore */
    }
    setPhase('feedback');
  };
  const goNext = () => {
    setPicked(null);
    setPhase('idle');
    setIndex((i) => i + 1);
  };

  const correctSet = current ? new Set(correctIndices(current)) : new Set<number>();

  return (
    <div className="space-y-5 pt-3 animate-fade-in-up">
      <header className="flex items-center gap-3 pt-1">
        <Link
          href="/past"
          aria-label="年度一覧に戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
              MIX
            </p>
            <Shuffle className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="truncate font-display text-[15px] font-semibold tracking-tight">
            年度横断演習
          </p>
        </div>
        <p className="shrink-0 font-display text-[12px] font-medium text-muted-foreground">
          {index + 1} / {total}
        </p>
      </header>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((index + (phase === 'feedback' ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      {current && (
        <>
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-display text-[10px] font-bold tracking-[0.14em] text-primary">
              {current.year}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-[9.5px] font-bold tracking-[0.14em]',
                current.examType === 'sample'
                  ? 'bg-warning/15 text-warning'
                  : 'bg-muted text-foreground/70',
              )}
            >
              {EXAM_TYPE_LABELS[current.examType ?? 'official']}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
              {PAST_EXAM_SECTION_LABELS[current.section]}
            </span>
            <span className="text-[11px] text-muted-foreground">
              原問 問{current.originalQuestionNumber}
            </span>
          </div>

          <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-soft">
            <p className="font-display text-[15px] font-semibold leading-relaxed tracking-tight">
              {current.question}
            </p>
          </div>

          <div className="space-y-2.5">
            {current.choices.map((c, i) => {
              const isPicked = picked === i;
              const isAnswer = correctSet.has(i);
              const showResult = phase === 'feedback';
              const state: 'idle' | 'picked' | 'correct' | 'wrong' | 'reveal' = showResult
                ? isAnswer
                  ? 'correct'
                  : isPicked
                    ? 'wrong'
                    : 'reveal'
                : isPicked
                  ? 'picked'
                  : 'idle';
              return (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  disabled={phase !== 'idle'}
                  className={cn(
                    'group w-full rounded-2xl border p-4 text-left tap-highlight transition',
                    state === 'idle' && 'border-border/60 bg-card hover:border-primary/40',
                    state === 'picked' && 'border-primary bg-primary/5',
                    state === 'correct' && 'border-accent bg-accent/10',
                    state === 'wrong' && 'border-warning bg-warning/10',
                    state === 'reveal' && 'border-border/40 bg-muted/30 opacity-80',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold',
                        state === 'correct' && 'bg-accent text-accent-foreground',
                        state === 'wrong' && 'bg-warning text-warning-foreground',
                        state === 'picked' && 'bg-primary text-primary-foreground',
                        (state === 'idle' || state === 'reveal') && 'bg-muted text-foreground/70',
                      )}
                    >
                      {state === 'correct' ? (
                        <Check className="h-4 w-4" strokeWidth={2.8} />
                      ) : state === 'wrong' ? (
                        <X className="h-4 w-4" strokeWidth={2.8} />
                      ) : (
                        LETTERS[i] ?? String(i + 1)
                      )}
                    </span>
                    <p className="mt-0.5 text-[14px] leading-relaxed">{c}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {phase === 'feedback' && (
            <div
              className={cn(
                'rounded-[20px] border p-4 animate-fade-in-up',
                picked !== null && isCorrect(current, picked)
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-warning/40 bg-warning/5',
              )}
            >
              <p
                className={cn(
                  'font-display text-[10.5px] font-bold tracking-[0.22em]',
                  picked !== null && isCorrect(current, picked) ? 'text-accent' : 'text-warning',
                )}
              >
                {picked !== null && isCorrect(current, picked) ? 'CORRECT' : 'INCORRECT'}
              </p>
              <div className="mt-2 flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="text-[13px] leading-relaxed text-foreground/90">
                  {current.explanation}
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {current.sourceLabel}
              </p>
            </div>
          )}

          <div className="sticky bottom-24 pt-2">
            {phase === 'idle' ? (
              <Button
                onClick={confirm}
                disabled={picked === null}
                className="w-full gap-2"
                size="lg"
              >
                回答する
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={goNext} className="w-full gap-2" size="lg">
                {index + 1 < total ? '次の問題へ' : '結果を見る'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
