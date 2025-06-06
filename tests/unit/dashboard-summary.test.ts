import { describe, it, expect, vi } from 'vitest';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

// 서버나 애플리케이션이 없을 때 평균값이 0으로 처리되는지 확인

describe('RealServerDataGenerator.getDashboardSummary', () => {
  it('서버가 없을 경우 NaN이 아닌 0을 반환한다', () => {
    const generator = RealServerDataGenerator.getInstance();

    // 서버와 애플리케이션 리스트를 빈 배열로 모킹
    vi.spyOn(generator, 'getAllServers').mockReturnValue([]);
    vi.spyOn(generator, 'getAllClusters').mockReturnValue([]);
    vi.spyOn(generator, 'getAllApplications').mockReturnValue([]);

    const summary = generator.getDashboardSummary();

    expect(summary.health.averageScore).toBe(0);
    expect(summary.health.availability).toBe(0);
    expect(summary.performance.avgCpu).toBe(0);
    expect(summary.performance.avgMemory).toBe(0);
    expect(summary.performance.avgDisk).toBe(0);
  });
});
