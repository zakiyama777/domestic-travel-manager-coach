import { statsRepository } from '@/lib/repositories';
import type { DashboardSummary } from '@/lib/types/stats';

/**
 * Server Component から使う前提のローダー。
 * 将来 SWR / React Query に置き換えてもUI側は変わらない。
 */
export async function loadDashboard(): Promise<DashboardSummary> {
  return statsRepository.getDashboard();
}
