'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/learn/progress-header';
import { SwipeCard } from '@/components/learn/swipe-card';
import { BinaryChoiceBar } from '@/components/learn/binary-choice-bar';
import { FeedbackSheet } from '@/components/learn/feedback-sheet';
import { useBinaryQuiz } from '@/features/learn/use-binary-quiz';

/**
 * 2択学習画面
 * ------------------------------------------------------------------
 *  <AnimatePresence mode="popLayout"> で「現在のカード」1枚だけを描画する。
 *  現在カードは key={current.id} で一意に管理しているため、next() で
 *  index が増えた瞬間に新しいカードが必ず再マウントされる。
 *  exit 中のカードが残り続けたり、次カードが表示されないバグを防ぐ。
 * ------------------------------------------------------------------
 */
export default function BinaryLearnPage() {
  const {
    current,
    index,
    questions,
    correctCount,
    phase,
    lastResult,
    answer,
    next,
    done,
    restart,
    canAnswer,
    showFeedback,
  } = useBinaryQuiz();

  if (done) {
    return <CompletedView correct={correctCount} total={questions.length} onRestart={restart} />;
  }

  if (!current) return <EmptyView />;

  return (
    <div className="relative flex min-h-[calc(100dvh-80px)] flex-col">
      <ProgressHeader
        current={index + 1}
        total={questions.length}
        correctCount={correctCount}
        subjectLabel="○ × 形式"
      />

      {/* カードエリア */}
      <div className="relative flex-1 pt-4">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{
              duration: 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <SwipeCard
              question={current}
              onAnswer={answer}
              canAnswer={canAnswer}
              exitDirection={
                phase === 'exiting' && lastResult?.questionId === current.id
                  ? lastResult.direction
                  : null
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 親指ゾーン固定CTA */}
      <div
        className="sticky -mx-5 mt-5 border-t border-border/40 bg-background/90 px-5 pt-4 backdrop-blur-xl"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
          paddingBottom: '14px',
        }}
      >
        <BinaryChoiceBar onPick={answer} disabled={!canAnswer} />
      </div>

      <FeedbackSheet
        open={showFeedback}
        correct={lastResult?.correct ?? false}
        explanation={lastResult?.explanation ?? ''}
        topic={lastResult?.topic}
        onNext={next}
      />
    </div>
  );
}

function EmptyView() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-sm text-muted-foreground">出題できる問題がありません。</p>
      <Button variant="soft" className="mt-4" asChild>
        <Link href="/dashboard">ホームへ</Link>
      </Button>
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
    <div className="flex min-h-[72vh] flex-col items-center justify-center px-4 text-center animate-scale-in">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-float">
        <Sparkles className="h-8 w-8" strokeWidth={1.8} />
      </div>
      <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
        COMPLETED
      </p>
      <h1 className="mt-2 font-display text-[24px] font-semibold tracking-tight">
        お疲れさまでした
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
