/**
 * スマホ触覚フィードバック
 * - iOS Safari は navigator.vibrate 非対応のため no-op
 * - PWA としてインストール時は振動可能
 */
export function haptic(pattern: 'light' | 'medium' | 'success' | 'error' = 'light') {
  if (typeof window === 'undefined') return;
  const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (!nav.vibrate) return;
  const map: Record<string, number | number[]> = {
    light: 8,
    medium: 14,
    success: [10, 40, 10],
    error: [20, 60, 20, 60],
  };
  try {
    nav.vibrate(map[pattern]);
  } catch {
    /* ignore */
  }
}
