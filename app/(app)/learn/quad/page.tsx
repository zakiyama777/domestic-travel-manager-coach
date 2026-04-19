'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/learn/progress-header';
import { QuadQuestionCard } from '@/components/learn/quad-question';
import { QuadChoice } from '@/components/learn/quad-choice';
import { FeedbackSheet } from '@/components/learn/feedback-sheet';
import { useQuadQuiz } from '@/features/learn/use-quad-quiz';

const LABELS = ['ア', 'イ', 'ウ', 'エ'] as const;

export default function QuadLearnPage() {
  const {
    current,
    index,
    questions,
    correctCount,
    selected,
    lastResult,
    select,
    confirm,
    next,
    done,
    restart,
  } = useQuadQuiz();

  if (done) {
    return (
      <CompletedView correct={correctCount} total={questions.length} onRestart={restart} />
    );
  }

  if (!current) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">出題できる問題がありません。</p>
        <Button variant="soft" className="mt-4" asChild>
          <Link href="/dashboard">ホームへ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-80px)] flex-col">
      <ProgressHeader
        current={index + 1}
        total={questions.length}
        correctCount={correctCount}
        subjectLabel="4 択 形式"
      />

      <div className="flex-1 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <QuadQuestionCard q={current} />

            <div className="space-y-2.5 pt-1">
              {current.choices.map((text, i) => {
                const isSelected = selected === i;
                const revealed = !!lastResult;
                const isAnswer = i === current.answerIndex;

                let state:
                  | 'idle'
                  | 'selected'
                  | 'correct'
                  | 'incorrect'
                  | 'revealed' = 'idle';
                if (revealed) {
                  if (isAnswer) state = 'correct';
                  else if (isSelected) state = 'incorrect';
                  else state = 'idle';
                } else if (isSelected) {
                  state = 'selected';
                }

                return (
                  <QuadChoice
                    key={i}
                    label={LABELS[i]}
                    text={text}
                    state={state}
                    onSelect={() => select(i)}
                    disabled={revealed}
                  />
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 親指ゾーン回答確定 */}
      <div
        className="sticky -mx-5 mt-6 border-t border-border/50 bg-background/85 px-5 pt-4 backdrop-blur-xl"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
          paddingBottom: '14px',
        }}
      >
        <Button
          size="lg"
          className="h-[60px] w-full text-[16px]"
          disabled={selected == null || !!lastResult}
          onClick={confirm}
        >
          {selected == null ? (
            '選択肢を選んでください'
          ) : (
            <>
              <Check className="h-5 w-5" strokeWidth={2.6} />
              回答する
            </>
          )}
        </Button>
      </div>

      <FeedbackSheet
        open={!!lastResult}
        correct={lastResult?.correct ?? false}
        explanation={lastResult?.explanation ?? ''}
        correctText={lastResult?.correctText}
        topic={lastResult?.topic}
        onNext={next}
      />
    </div>
  );
}

function CompletedView({
  correct,
  total,
  onRestart,
}: {
  correct: number;
  total: number;
  onRestart: () => void;
}) {
  const pct = Math.round((correct / Math.max(1, total)) * 100);
  return (
    <div className="flex min-h-[72vh] flex-col items-center justify-center text-center animate-scale-in">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-float">
        <Sparkles className="h-8 w-8" strokeWidth={1.8} />
      </div>
      <p className="text-[11px] font-bold tracking-[0.22em] text-muted-foreground">COMPLETED</p>
      <h1 className="mt-2 font-display text-[24px] font-semibold tracking-tight">
        セッション終了
      </h1>
      <p className="mt-6 font-display text-6xl font-semibold tabular-nums text-gradient-primary">
        {pct}%
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="tabular-nums">{correct}</span> / <span className="tabular-nums">{total}</span> 問 正解
      </p>

      <div className="mt-10 w-full max-w-[320px] space-y-3">
        <Button size="lg" className="w-full" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" /> もう一度解く
        </Button>
        <Button size="lg" variant="soft" className="w-full" asChild>
          <Link href="/review">弱点を確認する</Link>
        </Button>
        <Button size="lg" variant="ghost" className="w-full" asChild>
          <Link href="/dashboard">ホームへ戻る</Link>
        </Button>
      </div>
    </div>
  );
}
