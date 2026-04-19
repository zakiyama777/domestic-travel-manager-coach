/**
 * localStorage の薄い抽象層。
 * ================================================================
 * 目的:
 *   - SSR safe (window チェック)
 *   - JSON の parse/stringify + 例外握り潰し
 *   - version 付きキーで破壊的変更時に安全に破棄できる
 *   - 将来 Firestore に置き換える際、interface は同じまま Repository を差し替える
 *
 * 使い方:
 *   const store = createLocalStore<MyShape>('tabi-study:progress', 'v1', initial);
 *   const v = store.read();
 *   store.write(nextValue);
 *   store.clear();
 *
 * 注意:
 *   - ここでは単一キーごとの CRUD のみ扱う
 *   - 複数エンティティの集約は Repository 側の責務
 * ================================================================
 */

export interface LocalStore<T> {
  key: string;
  read(): T | null;
  /** 読取 + 存在しなければ initial を書き込んで返す */
  readOrInit(): T;
  write(value: T): void;
  update(fn: (prev: T) => T): T;
  clear(): void;
}

export function createLocalStore<T>(
  namespace: string,
  version: string,
  initial: T,
): LocalStore<T> {
  const key = `${namespace}:${version}`;

  function safeGet(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSet(raw: string) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, raw);
    } catch {
      /* quota/private mode等: ignore */
    }
  }

  function safeDel() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  function read(): T | null {
    const raw = safeGet();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // 壊れた値は破棄しておく
      safeDel();
      return null;
    }
  }

  function readOrInit(): T {
    const v = read();
    if (v !== null) return v;
    write(initial);
    return initial;
  }

  function write(value: T): void {
    safeSet(JSON.stringify(value));
  }

  function update(fn: (prev: T) => T): T {
    const prev = read() ?? initial;
    const next = fn(prev);
    write(next);
    return next;
  }

  function clear(): void {
    safeDel();
  }

  return { key, read, readOrInit, write, update, clear };
}

/**
 * 日付を yyyy-mm-dd (ローカル TZ) に丸める。
 * 進捗の「日」単位集計に使用。
 */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 日付キー差(日数)を返す。正なら a が b より後。 */
export function dayDiff(a: string, b: string): number {
  const pa = new Date(a + 'T00:00:00').getTime();
  const pb = new Date(b + 'T00:00:00').getTime();
  return Math.round((pa - pb) / 86_400_000);
}
