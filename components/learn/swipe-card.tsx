'use client';

import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SUBJECTS } from '@/lib/constants/subjects';
import type { BinaryQuestion } from '@/lib/types/question';

interface Props {
  question: BinaryQuestion;
  onAnswer: (ans: boolean) => void;
  /** 入力受付可否。false のときはドラッグ無効化 */
  canAnswer: boolean;
  /** 回答確定後、カードを飛ばす方向 */
  exitDirection?: 'left' | 'right' | null;
}

/** 指追従スワイプカード (状態機械の「idle / exiting」に応答) */
export function SwipeCard({ question, onAnswer, canAnswer, exitDirection }: Props) {
  const x = useMotionValue(0);

  /* ------------------------------------------------------------
   * 視覚的フィードバック: x に応じて角度・色・ラベル透明度を変化
   * ---------------------------------------------------------- */
  const rotate = useTransform(x, [-220, 0, 220], [-6, 0, 6]);
  const yesBadgeOpacity = useTransform(x, [30, 120], [0, 1]);
  const noBadgeOpacity = useTransform(x, [-120, -30], [1, 0]);
  // 背景のグロー (左 = warning, 右 = accent)
  const accentGlow = useTransform(x, [0, 160], [0, 0.18]);
  const warningGlow = useTransform(x, [-160, 0], [0.18, 0]);
  // ヒント帯の透明度 (指で動かすと消える)
  const hintOpacity = useTransform(x, [-30, 0, 30], [0, 1, 0]);

  /* ------------------------------------------------------------
   * exitDirection が指定されたら一気に外へ飛ばす
   * (「回答確定後に同じカードがexit」を保証)
   * ---------------------------------------------------------- */
  useEffect(() => {
    if (!exitDirection) return;
    const to = exitDirection === 'right' ? 520 : -520;
    animate(x, to, {
      type: 'spring',
      damping: 26,
      stiffness: 180,
      restDelta: 2,
    });
  }, [exitDirection, x]);

  /* ------------------------------------------------------------
   * ドラッグ終了ハンドラ
   *   - 一度発火したら onAnswer を呼び、以降は親の canAnswer=false で
   *     二重発火を防ぐ (state machine 側でも弾く)
   * ---------------------------------------------------------- */
  const THRESHOLD_PX = 130;
  const THRESHOLD_VEL = 600;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!canAnswer) return;
    const crossedRight = info.offset.x > THRESHOLD_PX || info.velocity.x > THRESHOLD_VEL;
    const crossedLeft = info.offset.x < -THRESHOLD_PX || info.velocity.x < -THRESHOLD_VEL;

    if (crossedRight) {
      onAnswer(true);
    } else if (crossedLeft) {
      onAnswer(false);
    } else {
      // 閾値未満 → 中央に戻す
      animate(x, 0, { type: 'spring', damping: 28, stiffness: 320 });
    }
  };

  const subj = SUBJECTS[question.subject];

  return (
    <motion.div
      drag={canAnswer ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileTap={canAnswer ? { scale: 0.995 } : undefined}
      style={{ x, rotate }}
      className="relative touch-pan-y select-none will-change-transform"
    >
      <motion.div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-5 shadow-premium">
        {/* accent側グロー */}
        <motion.div
          aria-hidden
          style={{ opacity: accentGlow }}
          className="pointer-events-none absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(270deg, hsl(var(--accent)/0.25) 0%, transparent 45%)',
            }}
          />
        </motion.div>
        {/* warning側グロー */}
        <motion.div
          aria-hidden
          style={{ opacity: warningGlow }}
          className="pointer-events-none absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, hsl(var(--warning)/0.25) 0%, transparent 45%)',
            }}
          />
        </motion.div>

        {/* 正解方向ラベル */}
        <motion.div
          aria-hidden
          style={{ opacity: yesBadgeOpacity }}
          className="pointer-events-none absolute right-4 top-4 rotate-6 rounded-lg border-[1.5px] border-accent bg-white/95 px-2.5 py-1 font-display text-[11px] font-bold tracking-[0.2em] text-accent shadow-soft"
        >
          正しい
        </motion.div>
        <motion.div
          aria-hidden
          style={{ opacity: noBadgeOpacity }}
          className="pointer-events-none absolute left-4 top-4 -rotate-6 rounded-lg border-[1.5px] border-warning bg-white/95 px-2.5 py-1 font-display text-[11px] font-bold tracking-[0.2em] text-warning shadow-soft"
        >
          誤り
        </motion.div>

        {/* --- コンテンツ --------------------------------------- */}
        <div className="relative z-10">
          {/* Topic (軽く, 1行) */}
          <div className="flex items-center gap-1.5">
            <Badge variant={question.subject}>{subj.shortName}</Badge>
            <span className="truncate text-[11.5px] font-medium text-muted-foreground">
              {question.topic}
            </span>
            <span className="ml-auto font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground/80">
              {'★'.repeat(question.difficulty)}
              <span className="text-foreground/15">
                {'★'.repeat(3 - question.difficulty)}
              </span>
            </span>
          </div>

          <div className="my-3 h-px w-full bg-border/60" />

          {/* 設問本文 — ファーストビュー内で完結させる */}
          <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
            QUESTION
          </p>
          <p className="mt-2 text-[16.5px] font-medium leading-[1.8] tracking-[0.01em] text-foreground">
            {question.statement}
          </p>
        </div>

        {/* 下部ヒント帯 (指で動かしたら薄れる) */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none relative z-10 mt-5 flex items-center justify-center gap-1.5 text-[10.5px] font-medium tracking-[0.16em] text-muted-foreground"
        >
          <span aria-hidden>←</span>
          <span>スワイプまたはボタンで回答</span>
          <span aria-hidden>→</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
