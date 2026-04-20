/**
 * Compiled Question Bank — Entry Point
 * =========================================
 * build script (`npm run build:questions`) が
 * `content/questions/**` 以下の CSV / JSON を読み取り、
 * 下の `data.ts` を再生成します。
 *
 * `data.ts` は常にビルド工程の前段で生成されるため、
 * 静的 import で問題なし（空の場合はスタブが吐かれる）。
 *
 * 空の場合は mock にフォールバックします。
 * -> これにより loading forever を再発させません。
 */

import type { BinaryQuestion, QuadQuestion } from '@/lib/types/question';
import type { PastExamQuestion } from '@/lib/types/past-exam';
import { MOCK_BINARY_QUESTIONS, MOCK_QUAD_QUESTIONS } from '@/lib/mock/questions';
import { BANK_BINARY, BANK_QUAD, BANK_META } from './data';
import { BANK_PAST, BANK_PAST_META } from './past';

export function getBankBinary(): BinaryQuestion[] {
  if (BANK_BINARY && BANK_BINARY.length > 0) return BANK_BINARY;
  return MOCK_BINARY_QUESTIONS;
}

export function getBankQuad(): QuadQuestion[] {
  if (BANK_QUAD && BANK_QUAD.length > 0) return BANK_QUAD;
  return MOCK_QUAD_QUESTIONS;
}

export function getBankPast(): PastExamQuestion[] {
  return BANK_PAST ?? [];
}

export function getBankMeta(): {
  source: 'bank' | 'mock-fallback';
  binaryCount: number;
  quadCount: number;
  pastCount: number;
  meta: typeof BANK_META | null;
  pastMeta: typeof BANK_PAST_META | null;
} {
  const hasBank = (BANK_BINARY && BANK_BINARY.length > 0) || (BANK_QUAD && BANK_QUAD.length > 0);
  return {
    source: hasBank ? 'bank' : 'mock-fallback',
    binaryCount: getBankBinary().length,
    quadCount: getBankQuad().length,
    pastCount: getBankPast().length,
    meta: hasBank ? BANK_META : null,
    pastMeta: BANK_PAST && BANK_PAST.length > 0 ? BANK_PAST_META : null,
  };
}
