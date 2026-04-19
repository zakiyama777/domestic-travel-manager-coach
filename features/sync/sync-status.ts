'use client';

/**
 * 軽量な同期ステータスストア (外部ライブラリ不使用)
 * ============================================================
 *  - repositories から `markSyncing()` / `markSynced()` / `markFailed()`
 *    を叩くと、サブスクライブしているコンポーネント (Settings 画面等) に
 *    最新状態が配信される。
 *  - 同期成否に UI 全体を巻き込みたくないので、純粋な state 配信のみ。
 * ============================================================
 */

import { useEffect, useState } from 'react';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'failed';

interface SyncSnapshot {
  state: SyncState;
  /** state が変わったタイミング (ms) */
  at: number;
  /** 直近の失敗メッセージ (任意) */
  lastError?: string;
}

type Listener = (s: SyncSnapshot) => void;

let current: SyncSnapshot = { state: 'idle', at: Date.now() };
const listeners: Set<Listener> = new Set();

function emit(next: SyncSnapshot) {
  current = next;
  listeners.forEach((l) => l(next));
}

export function markSyncing() {
  emit({ state: 'syncing', at: Date.now() });
}

export function markSynced() {
  emit({ state: 'synced', at: Date.now() });
}

export function markFailed(msg?: string) {
  emit({ state: 'failed', at: Date.now(), lastError: msg });
}

export function getSyncSnapshot(): SyncSnapshot {
  return current;
}

export function useSyncStatus(): SyncSnapshot {
  const [snap, setSnap] = useState<SyncSnapshot>(current);
  useEffect(() => {
    const l: Listener = (s) => setSnap(s);
    listeners.add(l);
    // 最新値を即反映
    setSnap(current);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
