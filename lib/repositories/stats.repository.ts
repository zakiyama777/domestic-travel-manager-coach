import type { StatsRepository } from '@/lib/repositories/types';
import { buildMockDashboard } from '@/lib/mock/stats';

export const statsRepository: StatsRepository = {
  async getDashboard() {
    return buildMockDashboard();
  },
  async getWeaknessList() {
    return buildMockDashboard().weaknessTop5;
  },
};
