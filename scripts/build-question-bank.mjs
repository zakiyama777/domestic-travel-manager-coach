#!/usr/bin/env node
/**
 * build-question-bank.mjs
 * =====================================================
 * content/questions/**\/*.{csv,json} を読み取り、
 * バリデーション・正規化して
 *   - lib/question-bank/data.ts
 *   - lib/question-bank/summary.json
 * を出力する。
 *
 * 使い方:
 *   node scripts/build-question-bank.mjs
 *   npm run build:questions
 *
 * 失敗しても exit 0。ただし全件 0 件なら警告。
 * （Next build を止めない方針: mock fallback に任せる）
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_DIR = resolve(ROOT, 'content/questions');
const OUT_DIR = resolve(ROOT, 'lib/question-bank');
const OUT_TS = resolve(OUT_DIR, 'data.ts');
const OUT_SUMMARY = resolve(OUT_DIR, 'summary.json');

const SUBJECTS = new Set(['law', 'terms', 'practice']);

// ---------- util: walk files ----------
function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// ---------- util: CSV parser (RFC 4180-ish, quote aware) ----------
function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, '\n');
  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { cur.push(field); field = ''; i++; continue; }
    if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; i++; continue; }
    field += c; i++;
  }
  // last field/row
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  // drop fully-empty rows
  return rows.filter((r) => r.some((f) => f !== undefined && f !== ''));
}

function csvToObjects(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = (row[c] ?? '').trim();
    }
    out.push(obj);
  }
  return out;
}

// ---------- util: normalize correctAnswer ----------
function normalizeBinaryAnswer(v) {
  const s = String(v).trim().toLowerCase();
  if (['true', 't', '1', 'o', '○', '◯', 'yes', 'y'].includes(s)) return true;
  if (['false', 'f', '0', 'x', '×', 'no', 'n'].includes(s)) return false;
  return null;
}
function normalizeQuadIndex(v) {
  const s = String(v).trim().toUpperCase();
  const map = {
    '1': 0, '2': 1, '3': 2, '4': 3,
    'A': 0, 'B': 1, 'C': 2, 'D': 3,
    'ア': 0, 'イ': 1, 'ウ': 2, 'エ': 3,
  };
  if (Object.prototype.hasOwnProperty.call(map, s)) return map[s];
  return null;
}

// ---------- normalize + validate ----------
function normalizeRecord(raw, fileLabel) {
  const errs = [];
  const id = String(raw.id ?? '').trim();
  const type = String(raw.type ?? '').trim().toLowerCase();
  const subject = String(raw.subject ?? '').trim();
  const topic = String(raw.topic ?? '').trim();
  const question = String(raw.question ?? '').trim();
  const explanation = String(raw.explanation ?? '').trim();
  const difficultyRaw = raw.difficulty;
  const difficulty = (() => {
    const n = Number(difficultyRaw);
    return n === 1 || n === 2 || n === 3 ? n : 2;
  })();
  const sourceYearRaw = raw.sourceYear;
  const sourceYear = sourceYearRaw === undefined || sourceYearRaw === '' || sourceYearRaw === null
    ? undefined
    : Number(sourceYearRaw);
  const sourceLabel = raw.sourceLabel ? String(raw.sourceLabel).trim() : undefined;
  const tags = (() => {
    if (!raw.tags) return undefined;
    if (Array.isArray(raw.tags)) return raw.tags.map((t) => String(t).trim()).filter(Boolean);
    return String(raw.tags)
      .split('|')
      .map((t) => t.trim())
      .filter(Boolean);
  })();
  const isActive = (() => {
    if (raw.isActive === undefined || raw.isActive === '' || raw.isActive === null) return true;
    const s = String(raw.isActive).trim().toLowerCase();
    return !(['false', '0', 'no', 'n', 'off'].includes(s));
  })();

  if (!id) errs.push('id is required');
  if (!['binary', 'quad'].includes(type)) errs.push(`type must be binary|quad (got "${type}")`);
  if (!SUBJECTS.has(subject)) errs.push(`subject must be law|terms|practice (got "${subject}")`);
  if (!topic) errs.push('topic is required');
  if (!question) errs.push('question is required');
  if (!explanation) errs.push('explanation is required');

  if (errs.length) {
    return { ok: false, id: id || '(no-id)', errors: errs.map((e) => `[${fileLabel}] ${e}`) };
  }

  if (type === 'binary') {
    const ans = normalizeBinaryAnswer(raw.correctAnswer);
    if (ans === null) {
      return { ok: false, id, errors: [`[${fileLabel}] binary correctAnswer invalid: "${raw.correctAnswer}"`] };
    }
    const record = {
      id,
      format: 'binary',
      subject,
      topic,
      statement: question,
      answer: ans,
      explanation,
      difficulty,
      ...(sourceYear !== undefined ? { sourceYear } : {}),
      ...(sourceLabel ? { sourceLabel } : {}),
      ...(tags && tags.length ? { tags } : {}),
      ...(isActive === false ? { isActive: false } : {}),
    };
    return { ok: true, id, type: 'binary', record };
  }

  // quad
  let choices = [];
  if (Array.isArray(raw.choices)) {
    choices = raw.choices.map((c) => String(c ?? '').trim());
  } else {
    choices = [
      String(raw.choice1 ?? raw.choiceA ?? raw['choice_1'] ?? '').trim(),
      String(raw.choice2 ?? raw.choiceB ?? raw['choice_2'] ?? '').trim(),
      String(raw.choice3 ?? raw.choiceC ?? raw['choice_3'] ?? '').trim(),
      String(raw.choice4 ?? raw.choiceD ?? raw['choice_4'] ?? '').trim(),
    ];
  }
  if (choices.length !== 4 || choices.some((c) => !c)) {
    return {
      ok: false, id,
      errors: [`[${fileLabel}] quad needs exactly 4 non-empty choices (got ${JSON.stringify(choices)})`],
    };
  }
  const ansIdx = normalizeQuadIndex(raw.correctAnswer);
  if (ansIdx === null) {
    return {
      ok: false, id,
      errors: [`[${fileLabel}] quad correctAnswer invalid: "${raw.correctAnswer}" (use 1..4 / A..D / ア..エ)`],
    };
  }
  const record = {
    id,
    format: 'quad',
    subject,
    topic,
    prompt: question,
    choices,
    answerIndex: ansIdx,
    explanation,
    difficulty,
    ...(sourceYear !== undefined ? { sourceYear } : {}),
    ...(sourceLabel ? { sourceLabel } : {}),
    ...(tags && tags.length ? { tags } : {}),
    ...(isActive === false ? { isActive: false } : {}),
  };
  return { ok: true, id, type: 'quad', record };
}

// ---------- main ----------
function main() {
  console.log('[build-question-bank] scanning:', CONTENT_DIR);
  const files = walk(CONTENT_DIR).filter((p) => ['.csv', '.json'].includes(extname(p).toLowerCase()));
  if (files.length === 0) {
    console.warn('[build-question-bank] no input files in content/questions/. Falling back to mock at runtime.');
  }

  /** @type {Record<string, true>} */
  const seen = {};
  const binary = [];
  const quad = [];
  const errors = [];
  let totalInput = 0;
  let duplicates = 0;

  for (const f of files) {
    const rel = f.replace(ROOT + '/', '');
    let rows = [];
    try {
      const text = readFileSync(f, 'utf8');
      if (extname(f).toLowerCase() === '.csv') {
        rows = csvToObjects(text);
      } else {
        const data = JSON.parse(text);
        rows = Array.isArray(data) ? data : Array.isArray(data.questions) ? data.questions : [];
      }
    } catch (e) {
      errors.push({ id: '(parse)', reason: `[${rel}] ${String(e?.message ?? e)}` });
      continue;
    }
    for (const raw of rows) {
      totalInput++;
      const res = normalizeRecord(raw, rel);
      if (!res.ok) {
        errors.push(...res.errors.map((r) => ({ id: res.id, reason: r })));
        continue;
      }
      if (seen[res.id]) {
        duplicates++;
        errors.push({ id: res.id, reason: `[${rel}] duplicate id` });
        continue;
      }
      seen[res.id] = true;
      if (res.type === 'binary') binary.push(res.record);
      else quad.push(res.record);
    }
  }

  // stable sort by id for reproducible builds
  binary.sort((a, b) => a.id.localeCompare(b.id));
  quad.sort((a, b) => a.id.localeCompare(b.id));

  const summary = {
    totalInput,
    accepted: binary.length + quad.length,
    skipped: errors.length - duplicates,
    duplicates,
    byType: { binary: binary.length, quad: quad.length },
    bySubject: {
      law: { binary: 0, quad: 0 },
      terms: { binary: 0, quad: 0 },
      practice: { binary: 0, quad: 0 },
    },
    errors,
    generatedAt: new Date().toISOString(),
    sourceFiles: files.map((f) => f.replace(ROOT + '/', '')),
  };
  for (const q of binary) summary.bySubject[q.subject].binary++;
  for (const q of quad) summary.bySubject[q.subject].quad++;

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const hasAny = binary.length > 0 || quad.length > 0;
  if (hasAny) {
    const header = [
      '/* eslint-disable */',
      '// AUTO-GENERATED by scripts/build-question-bank.mjs. DO NOT EDIT BY HAND.',
      `// generatedAt: ${summary.generatedAt}`,
      "import type { BinaryQuestion, QuadQuestion } from '@/lib/types/question';",
      '',
    ].join('\n');
    const body =
      `export const BANK_BINARY: BinaryQuestion[] = ${JSON.stringify(binary, null, 2)};\n\n` +
      `export const BANK_QUAD: QuadQuestion[] = ${JSON.stringify(quad, null, 2)};\n\n` +
      `export const BANK_META = ${JSON.stringify({
        generatedAt: summary.generatedAt,
        counts: summary.byType,
        bySubject: summary.bySubject,
        sourceFiles: summary.sourceFiles,
      }, null, 2)} as const;\n`;
    writeFileSync(OUT_TS, header + body, 'utf8');
    console.log(`[build-question-bank] wrote ${OUT_TS}`);
  } else {
    // write a stub so the import path resolves even without data
    writeFileSync(
      OUT_TS,
      [
        '/* eslint-disable */',
        '// AUTO-GENERATED stub (no input found). Bank is empty; runtime falls back to mock.',
        "import type { BinaryQuestion, QuadQuestion } from '@/lib/types/question';",
        'export const BANK_BINARY: BinaryQuestion[] = [];',
        'export const BANK_QUAD: QuadQuestion[] = [];',
        "export const BANK_META = { generatedAt: '', counts: { binary: 0, quad: 0 }, bySubject: {}, sourceFiles: [] } as const;",
        '',
      ].join('\n'),
      'utf8',
    );
    console.log(`[build-question-bank] wrote empty stub to ${OUT_TS}`);
  }

  writeFileSync(OUT_SUMMARY, JSON.stringify(summary, null, 2), 'utf8');

  console.log('[build-question-bank] ✅ done');
  console.log(`  input files : ${files.length}`);
  console.log(`  total rows  : ${totalInput}`);
  console.log(`  accepted    : ${summary.accepted} (binary ${summary.byType.binary} / quad ${summary.byType.quad})`);
  console.log(`  duplicates  : ${duplicates}`);
  console.log(`  errors      : ${errors.length - duplicates}`);
  if (errors.length) {
    console.log('  --- issues (first 20) ---');
    for (const e of errors.slice(0, 20)) console.log(`   - ${e.id}: ${e.reason}`);
    if (errors.length > 20) console.log(`   ... and ${errors.length - 20} more (see summary.json)`);
  }
}

main();
