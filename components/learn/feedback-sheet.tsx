'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Props {
  open: boolean;
  correct: boolean;
  explanation: string;
  correctText?: string; // 4択用: 正解選択肢の本文
  onNext: () => void;
}

/**
 * 画面下から滑り出るフィードバックシート。
 * - 正解: accent系 / 不正解: warning系
 * - 解説は カード化して「読んで理解する」動線を美しく
 * - CTA(次へ)は親指ゾーンに固定
 */
export function FeedbackSheet({ open, correct, explanation, correctText, onNext }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]"
            onClick={onNext}
          />
          <motion.div
            initial={{ y: '102%' }}
            animate={{ y: 0 }}
            exit={{ y: '102%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px]',
              'rounded-t-[28px] border-t border-border/60 bg-white shadow-premium',
              'px-5 pt-4',
            )}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
          >
            {/* グラブハンドル */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />

            <div className="flex items-start gap-3">
              {correct ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 18,
                    delay: 0.05,
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10"
                >
                  <CheckCircle2 className="h-6 w-6 text-accent" strokeWidth={2.4} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 18,
                    delay: 0.05,
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10"
                >
                  <XCircle className="h-6 w-6 text-warning" strokeWidth={2.4} />
                </motion.div>
              )}
              <div className="flex-1 pt-0.5">
                <p
                  className={cn(
                    'font-display text-[10.5px] font-bold uppercase tracking-[0.22em]',
                    correct ? 'text-accent' : 'text-warning',
                  )}
                >
                  {correct ? 'CORRECT' : 'INCORRECT'}
                </p>
                <h4 className="mt-0.5 text-[18px] font-semibold tracking-tight text-foreground">
                  {correct ? '正解です。' : 'もう一歩。見直しましょう。'}
                </h4>
              </div>
            </div>

            {correctText && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-3.5"
              >
                <p className="font-display text-[10px] font-bold tracking-[0.2em] text-accent">
                  ANSWER
                </p>
                <p className="mt-1 text-[14px] font-medium leading-[1.75] text-foreground">
                  {correctText}
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-3 rounded-2xl border border-border/60 bg-muted/40 p-4"
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-foreground/60" strokeWidth={2} />
                <p className="font-display text-[10px] font-bold tracking-[0.2em] text-foreground/60">
                  EXPLANATION
                </p>
              </div>
              <p className="text-[13.5px] leading-[1.8] text-foreground/85">{explanation}</p>
            </motion.div>

            <Button
              size="lg"
              variant={correct ? 'accent' : 'primary'}
              className="mt-5 w-full"
              onClick={onNext}
              autoFocus
            >
              次の問題へ <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
