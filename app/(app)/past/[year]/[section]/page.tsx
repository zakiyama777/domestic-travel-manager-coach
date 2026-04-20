'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, BookOpen, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { questionBankRepository } from '@/lib/repositories/question-bank.repository';
import { PAST_EXAM_SECTION_LABELS } from '@/lib/types/past-exam';
import type { PastExamQuestion } from '@/lib/types/past-exam';
import type { SubjectId } from '@/lib/constants/subjects';
import { progressRepository } from '@/lib/repositories';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const LETTERS = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ'];

type Section = SubjectId | 'all';

function parseSection(raw: string): Section | null {
  if (raw === 'all') return 'all';
  if (raw === 'law' || raw === 'terms' || raw === 'practice') return raw;
  return null;
}

function isCorrect(q: PastExamQuestion, picked: number): boolean {
  if (Array.isArray(q.correctAnswer)) return q.correctAnswer.includes(picked);
  return q.correctAnswer === picked;
}

function correctIndices(q: PastExamQuestion): number[] {
  return Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
}

export default function PastExamQuizPage() {
  const router = useRouter();
  const params = useParams<{ year: string; section: string }>();
  const year = params?.year ?? '';
  const sectionRaw = params?.section ?? '';
  const section = parseSection(sectionRaw);

  const questions = useMemo<PastExamQuestion[]>(() => {
    if (!section) return [];
    return questionBankRepository.pickPastExam({
      year,
      section: section === 'all' ? undefined : section,
      shuffle: false,
    });
  }, [year, section]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'feedback' | 'done'>('idle');
  const [correctCount, setCorrectCount] = useState(0);

  const total = questions.length;
  const current = questions[index];

  // 完了判定
  useEffect(() => {
    if (total > 0 && index >= total) setPhase('done');
  }, [index, total]);

  const headerTitle = section === 'all'
    ? `${year} ・ 全科目`
    : section
      ? `${year} ・ ${PAST_EXAM_SECTION_LABELS[section]}`
      : year;

  // 早期 return: セクション不正 / 問題0
  if (!section) {
    return (
      <EmptyView
        title="該当するセクションがありません"
        description="URL を確認してください。"
        backYear={year}
      />
    );
  }
  if (total === 0) {
    return (
      <EmptyView
        title="この区分には問題が登録されていません"
        description="content/past-exams/ に追加して npm run build:questions を実行してください。"
        backYear={year}
      />
    );
  }

  // 完了表示
  if (phase === 'done') {
    const pct = Math.round((correctCount / total) * 100);
    return (
      <div className="space-y-6 pt-3 animate-fade-in-up">
        <header className="flex items-center gap-3 pt-1">
          <Link
            href={`/past/${year}`}
            aria-label="科目選択に戻る"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
          >
            <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
          </Link>
          <div>
            <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
              RESULT
            </p>
            <h1 className="font-display text-[22px] font-semibold tracking-tight">
              {headerTitle}
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
            onClick={() => {
              setIndex(0);
              setPicked(null);
              setPhase('idle');
              setCorrectCount(0);
            }}
            className="w-full gap-2"
          >
            <RotateCcw className="h-4 w-4" /> もう一度挑戦する
          </Button>
          <Link
            href={`/past/${year}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-muted py-3 text-sm font-medium text-foreground/80 tap-highlight"
          >
            科目選択へ戻る
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
    // 進捗に記録（既存のローカル progressRepository + Firebase mirror を活用）
    try {
      progressRepository.recordAnswer({
        questionId: current.id,
        subject: current.section,
        topic: current.topic ?? `${current.year} ${PAST_EXAM_SECTION_LABELS[current.section]} 問${current.originalQuestionNumber}`,
        correct: ok,
      });
    } catch {
      // 記録失敗は無視（UIを止めない）
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
      {/* ヘッダ */}
      <header className="flex items-center gap-3 pt-1">
        <Link
          href={`/past/${year}`}
          aria-label="科目選択に戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
            PAST EXAM
          </p>
          <p className="truncate font-display text-[15px] font-semibold tracking-tight">
            {headerTitle}
          </p>
        </div>
        <p className="shrink-0 font-display text-[12px] font-medium text-muted-foreground">
          {index + 1} / {total}
        </p>
      </header>

      {/* プログレスバー */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((index + (phase === 'feedback' ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      {current && (
        <>
          {/* 問題メタ */}
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-display text-[10px] font-bold tracking-[0.14em] text-primary">
              {current.year}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
              {PAST_EXAM_SECTION_LABELS[current.section]}
            </span>
            <span className="text-[11px] text-muted-foreground">
              原問 問{current.originalQuestionNumber}
            </span>
          </div>

          {/* 問題文 */}
          <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-soft">
            <p className="font-display text-[15px] font-semibold leading-relaxed tracking-tight">
              {current.question}
            </p>
          </div>

          {/* 選択肢 */}
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

          {/* フィードバック */}
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

          {/* アクションボタン */}
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

function EmptyView({
  title,
  description,
  backYear,
}: {
  title: string;
  description: string;
  backYear: string;
}) {
  return (
    <div className="space-y-6 pt-3 animate-fade-in-up">
      <header className="flex items-center gap-3 pt-1">
        <Link
          href={backYear ? `/past/${backYear}` : '/past'}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
        </Link>
        <div>
          <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
            PAST EXAM
          </p>
          <h1 className="font-display text-[22px] font-semibold tracking-tight">{title}</h1>
        </div>
      </header>
      <p className="px-1 text-sm text-muted-foreground">{description}</p>
      <Link
        href="/past"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> 年度一覧へ戻る
      </Link>
    </div>
  );
}
