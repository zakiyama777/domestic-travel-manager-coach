'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  progressRepository,
  questionRepository,
  sessionRepository,
} from '@/lib/repositories';
import { schedulePushProgress } from '@/lib/repositories/firebase/progress.firebase';
import { schedulePushSession } from '@/lib/repositories/firebase/session.firebase';
import type { BinaryQuestion } from '@/lib/types/question';
import { haptic } from '@/lib/utils/haptics';

/**
 * 2択クイズの状態機械:
 *
 *   idle         … ユーザーの回答待ち（スワイプ/ボタン受付）
 *   exiting      … 回答が確定し、カードが画面外へ飛んでいるアニメ中
 *                  (この間も含め他入力は一切受け付けない)
 *   feedback     … カードが飛んだあと、解説シートが表示されている状態
 *   advancing    … 「次へ」が押され、次カードへの遷移中(enterアニメ)
 *
 *   → advancing が終わると自動的に idle に戻る
 *
 * いずれの非idle状態でも answer() は早期return し、多重回答を防ぐ。
 */
export type QuizPhase = 'idle' | 'exiting' | 'feedback' | 'advancing';

interface State {
  questions: BinaryQuestion[];
  index: number;
  correctCount: number;
  phase: QuizPhase;
  /** 最新回答の結果 (feedback表示用) */
  lastResult: null | {
    questionId: string;
    correct: boolean;
    explanation: string;
    topic: string;
    /** 回答方向。カードをどちらに飛ばすかに使う */
    direction: 'left' | 'right';
  };
  done: boolean;
}

const EXIT_DURATION_MS = 360; // カードが飛ぶ演出の長さ
const ADVANCE_DURATION_MS = 320;

export function useBinaryQuiz() {
  const [state, setState] = useState<State>(() => {
    const questions = questionRepository.getBinaryQuizSync({ limit: 8 });
    return {
      questions,
      index: 0,
      correctCount: 0,
      phase: 'idle',
      lastResult: null,
      done: false,
    };
  });

  /** タイマーを抱えておき、unmount/restart時に確実にクリア */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // 初回マウント時にセッション開始 (localStorage)
  const sessionStarted = useRef(false);
  useEffect(() => {
    if (sessionStarted.current) return;
    if (state.questions.length === 0) return;
    sessionRepository.start({
      mode: 'binary',
      questionIds: state.questions.map((q) => q.id),
    });
    schedulePushSession();
    sessionStarted.current = true;
    return () => {
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = state.questions[state.index];

  /**
   * 回答を確定する (スワイプ/ボタン共通エントリ)。
   * - phase !== 'idle' なら多重発火を防ぐため無視
   */
  const answer = useCallback(
    (ans: boolean) => {
      if (state.phase !== 'idle' || !current) return;

      const correct = ans === current.answer;
      haptic(correct ? 'success' : 'error');

      // リポジトリへ記録 (mock submit + progress の永続化)
      void questionRepository.submitAnswer({
        questionId: current.id,
        correct,
        answeredAt: Date.now(),
        elapsedMs: 0,
      });
      progressRepository.recordAnswer({
        questionId: current.id,
        subject: current.subject,
        topic: current.topic,
        correct,
      });
      // Firestore へのバックグラウンド同期 (debounce)
      schedulePushProgress();

      // Step 1: exiting に遷移 (カード飛ぶアニメ)
      setState((s) => {
        const nextCorrect = s.correctCount + (correct ? 1 : 0);
        // セッション更新 (再開情報)
        sessionRepository.update({
          answeredCount: s.index + 1,
          correctCount: nextCorrect,
        });
        schedulePushSession();
        return {
          ...s,
          phase: 'exiting',
          correctCount: nextCorrect,
          lastResult: {
            questionId: current.id,
            correct,
            explanation: current.explanation,
            topic: current.topic,
            direction: ans ? 'right' : 'left',
          },
        };
      });

      // Step 2: exit完了後、feedback シート表示
      const t = setTimeout(() => {
        setState((s) => ({ ...s, phase: 'feedback' }));
      }, EXIT_DURATION_MS);
      timers.current.push(t);
    },
    [state.phase, current],
  );

  /**
   * 次の問題へ進む (feedback → advancing → idle)。
   * - phase === 'feedback' の時のみ有効
   */
  const next = useCallback(() => {
    if (state.phase !== 'feedback') return;

    setState((s) => {
      const nextIdx = s.index + 1;
      const done = nextIdx >= s.questions.length;
      if (done) {
        // セッション完了 → 再開情報はクリア
        sessionRepository.clear();
        schedulePushSession();
      }
      return {
        ...s,
        index: nextIdx,
        phase: done ? 'idle' : 'advancing',
        lastResult: null,
        done,
      };
    });

    const t = setTimeout(() => {
      setState((s) => (s.phase === 'advancing' ? { ...s, phase: 'idle' } : s));
    }, ADVANCE_DURATION_MS);
    timers.current.push(t);
  }, [state.phase]);

  const restart = useCallback(() => {
    clearTimers();
    const questions = questionRepository.getBinaryQuizSync({ limit: 8 });
    sessionRepository.start({
      mode: 'binary',
      questionIds: questions.map((q) => q.id),
    });
    schedulePushSession();
    setState({
      questions,
      index: 0,
      correctCount: 0,
      phase: 'idle',
      lastResult: null,
      done: false,
    });
  }, []);

  return {
    questions: state.questions,
    index: state.index,
    correctCount: state.correctCount,
    phase: state.phase,
    lastResult: state.lastResult,
    done: state.done,
    current,
    answer,
    next,
    restart,
    /** UI が入力を受け付けてよいか */
    canAnswer: state.phase === 'idle',
    /** フィードバックシートを開くべきか */
    showFeedback: state.phase === 'feedback',
  };
}
