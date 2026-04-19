'use client';

import { useCallback, useRef, useState } from 'react';
import { questionRepository } from '@/lib/repositories';
import type { QuadQuestion } from '@/lib/types/question';
import { haptic } from '@/lib/utils/haptics';

/** 4択の phase。2択とほぼ同じだが、selected 状態が追加される */
export type QuadPhase = 'idle' | 'feedback' | 'advancing';

interface State {
  questions: QuadQuestion[];
  index: number;
  correctCount: number;
  selected: number | null;
  phase: QuadPhase;
  lastResult: null | {
    questionId: string;
    correct: boolean;
    explanation: string;
    correctText: string;
  };
  done: boolean;
}

const ADVANCE_DURATION_MS = 320;

export function useQuadQuiz() {
  const [state, setState] = useState<State>(() => ({
    questions: questionRepository.getQuadQuizSync({ limit: 5 }),
    index: 0,
    correctCount: 0,
    selected: null,
    phase: 'idle',
    lastResult: null,
    done: false,
  }));

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const current = state.questions[state.index];

  /** 選択肢タップ (未確定) */
  const select = useCallback(
    (idx: number) => {
      if (state.phase !== 'idle' || !current) return;
      haptic('light');
      setState((s) => ({ ...s, selected: idx }));
    },
    [state.phase, current],
  );

  /** 選択を確定する */
  const confirm = useCallback(() => {
    if (state.phase !== 'idle' || state.selected == null || !current) return;
    const correct = state.selected === current.answerIndex;
    haptic(correct ? 'success' : 'error');

    void questionRepository.submitAnswer({
      questionId: current.id,
      correct,
      answeredAt: Date.now(),
      elapsedMs: 0,
    });

    setState((s) => ({
      ...s,
      correctCount: s.correctCount + (correct ? 1 : 0),
      phase: 'feedback',
      lastResult: {
        questionId: current.id,
        correct,
        explanation: current.explanation,
        correctText: current.choices[current.answerIndex],
      },
    }));
  }, [state.phase, state.selected, current]);

  /** 次の問題へ */
  const next = useCallback(() => {
    if (state.phase !== 'feedback') return;
    setState((s) => {
      const nextIdx = s.index + 1;
      const done = nextIdx >= s.questions.length;
      return {
        ...s,
        index: nextIdx,
        selected: null,
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
    setState({
      questions: questionRepository.getQuadQuizSync({ limit: 5 }),
      index: 0,
      correctCount: 0,
      selected: null,
      phase: 'idle',
      lastResult: null,
      done: false,
    });
  }, []);

  return {
    questions: state.questions,
    index: state.index,
    correctCount: state.correctCount,
    selected: state.selected,
    phase: state.phase,
    lastResult: state.lastResult,
    done: state.done,
    current,
    select,
    confirm,
    next,
    restart,
    canSelect: state.phase === 'idle',
    showFeedback: state.phase === 'feedback',
  };
}
