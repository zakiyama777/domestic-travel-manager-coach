/**
 * QuestionBank Repository
 * =========================
 * 大量問題投入後の配信ロジックを担う。
 *
 * 役割:
 *  - question-bank（build 済）または mock を読み出す
 *  - binary / quad で型を分ける
 *  - subject / topic / tag / year で絞れる
 *  - isActive: false は配信しない
 *  - 同一セッション内の重複を避ける（引数 `excludeIds`）
 *  - シャッフル可否・limit を指定できる
 *
 * 既存 UI の `questionRepository.getBinaryQuizSync` / `getQuadQuizSync` を
 * 止めずに置き換えるため、同期取得を保証する。
 */

import type { BinaryQuestion, QuadQuestion } from '@/lib/types/question';
import type { PastExamQuestion, ExamYearKey, PastExamYearMeta } from '@/lib/types/past-exam';
import type { SubjectId } from '@/lib/constants/subjects';
import { getBankBinary, getBankQuad, getBankPast, getBankMeta } from '@/lib/question-bank';

export interface PickParams {
  limit?: number;
  subject?: SubjectId;
  topic?: string;
  tag?: string;
  year?: number;
  excludeIds?: string[];
  /** true で Fisher-Yates シャッフル。既定 true */
  shuffle?: boolean;
  /** 0..3 を指定した場合にその難易度のみ */
  difficulty?: 1 | 2 | 3;
}

/* ---------- utilities ---------- */

function isActive<T extends { id: string } & Partial<{ isActive: boolean }>>(q: T): boolean {
  return q.isActive !== false;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  // Fisher-Yates. 決定論性は今は不要。
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function filterCommon<
  T extends BinaryQuestion | QuadQuestion,
>(items: T[], params: PickParams): T[] {
  let out = items.filter(isActive);
  if (params.subject) out = out.filter((q) => q.subject === params.subject);
  if (params.topic) out = out.filter((q) => q.topic === params.topic);
  if (params.difficulty) out = out.filter((q) => q.difficulty === params.difficulty);
  if (params.tag) {
    // BinaryQuestion / QuadQuestion に tags プロパティがあれば拾う（拡張互換）
    out = out.filter((q) => {
      const tags = (q as unknown as { tags?: string[] }).tags;
      return Array.isArray(tags) && tags.includes(params.tag!);
    });
  }
  if (params.year) {
    out = out.filter((q) => (q as unknown as { sourceYear?: number }).sourceYear === params.year);
  }
  if (params.excludeIds && params.excludeIds.length) {
    const ex = new Set(params.excludeIds);
    out = out.filter((q) => !ex.has(q.id));
  }
  return out;
}

/* ---------- main API ---------- */

export function pickBinary(params: PickParams = {}): BinaryQuestion[] {
  const pool = getBankBinary();
  let out = filterCommon(pool.slice(), params);
  if (params.shuffle !== false) out = shuffleInPlace(out);
  const limit = params.limit ?? 10;
  return out.slice(0, limit);
}

export function pickQuad(params: PickParams = {}): QuadQuestion[] {
  const pool = getBankQuad();
  let out = filterCommon(pool.slice(), params);
  if (params.shuffle !== false) out = shuffleInPlace(out);
  const limit = params.limit ?? 5;
  return out.slice(0, limit);
}

export function bankStats(): {
  source: 'bank' | 'mock-fallback';
  binaryCount: number;
  quadCount: number;
  subjects: Record<SubjectId, { binary: number; quad: number }>;
} {
  const meta = getBankMeta();
  const binary = getBankBinary();
  const quad = getBankQuad();
  const subjects: Record<SubjectId, { binary: number; quad: number }> = {
    law: { binary: 0, quad: 0 },
    terms: { binary: 0, quad: 0 },
    practice: { binary: 0, quad: 0 },
  };
  for (const q of binary) if (subjects[q.subject]) subjects[q.subject].binary++;
  for (const q of quad) if (subjects[q.subject]) subjects[q.subject].quad++;
  return {
    source: meta.source,
    binaryCount: binary.length,
    quadCount: quad.length,
    subjects,
  };
}

/* ---------- past-exam API ---------- */

export interface PastExamPickParams {
  year?: ExamYearKey;
  section?: SubjectId;
  limit?: number;
  excludeIds?: string[];
  /** true でシャッフル。既定は false（原問順を維持） */
  shuffle?: boolean;
  /** false なら isActive=false も含める。既定 true */
  activeOnly?: boolean;
}

function isPastActive(q: PastExamQuestion): boolean {
  return q.isActive !== false;
}

export function pickPastExam(params: PastExamPickParams = {}): PastExamQuestion[] {
  const pool = getBankPast().slice();
  const active = params.activeOnly === false ? pool : pool.filter(isPastActive);
  let out = active;
  if (params.year) out = out.filter((q) => q.year === params.year);
  if (params.section) out = out.filter((q) => q.section === params.section);
  if (params.excludeIds && params.excludeIds.length) {
    const ex = new Set(params.excludeIds);
    out = out.filter((q) => !ex.has(q.id));
  }
  if (params.shuffle) {
    // Fisher-Yates
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  } else {
    // 原問順: section (law->terms->practice) -> originalQuestionNumber
    const order: Record<SubjectId, number> = { law: 1, terms: 2, practice: 3 };
    out.sort((a, b) => {
      const sa = order[a.section] ?? 9;
      const sb = order[b.section] ?? 9;
      if (sa !== sb) return sa - sb;
      return a.originalQuestionNumber - b.originalQuestionNumber;
    });
  }
  if (params.limit !== undefined) out = out.slice(0, params.limit);
  return out;
}

export function getPastExamYears(): PastExamYearMeta[] {
  const pool = getBankPast().filter(isPastActive);
  const map: Record<string, PastExamYearMeta> = {};
  for (const q of pool) {
    if (!map[q.year]) {
      map[q.year] = {
        year: q.year,
        label: yearLabel(q.year),
        westernYear: yearToWestern(q.year),
        counts: { law: 0, terms: 0, practice: 0 },
        total: 0,
        examType: q.examType ?? 'official',
      };
    }
    map[q.year].counts[q.section]++;
    map[q.year].total++;
    // 年度内の examType が複数ある場合は最初に現れたものを採用
  }
  // 新しい年度 (R07, R06, R05, ...) を先頭に
  return Object.values(map).sort((a, b) => b.year.localeCompare(a.year));
}

function yearLabel(year: ExamYearKey): string {
  const w = yearToWestern(year);
  const m = year.match(/^R(\d+)$/);
  if (m) return `令和${parseInt(m[1], 10)}年度${w ? ` (${w})` : ''}`;
  const h = year.match(/^H(\d+)$/);
  if (h) return `平成${parseInt(h[1], 10)}年度${w ? ` (${w})` : ''}`;
  return year;
}
function yearToWestern(year: ExamYearKey): number | undefined {
  const r = year.match(/^R(\d+)$/);
  if (r) return 2018 + parseInt(r[1], 10);
  const h = year.match(/^H(\d+)$/);
  if (h) return 1988 + parseInt(h[1], 10);
  return undefined;
}

export function getPastExamById(id: string): PastExamQuestion | undefined {
  return getBankPast().find((q) => q.id === id);
}

export const questionBankRepository = {
  pickBinary,
  pickQuad,
  bankStats,
  pickPastExam,
  getPastExamYears,
  getPastExamById,
};

export type QuestionBankRepository = typeof questionBankRepository;
