import { describe, it, expect, afterEach, vi } from 'vitest';
import { realServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

describe('getDashboardSummary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('서버가 없는 경우 NaN을 반환하지 않는다', () => {
    vi.spyOn(realServerDataGenerator, 'getAllServers').mockReturnValue([]);
    vi.spyOn(realServerDataGenerator, 'getAllClusters').mockReturnValue([]);
    vi.spyOn(realServerDataGenerator, 'getAllApplications').mockReturnValue([]);

    const summary = realServerDataGenerator.getDashboardSummary();

    expect(Number.isNaN(summary.health.averageScore)).toBe(false);
    expect(Number.isNaN(summary.performance.avgCpu)).toBe(false);
    expect(summary.health.averageScore).toBe(0);
    expect(summary.performance.avgCpu).toBe(0);
  });
});
