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

    // servers 객체 검증
    expect(summary.servers.avgCpu).toBe(0);
    expect(summary.servers.avgMemory).toBe(0);
    expect(summary.servers.total).toBe(0);
    expect(summary.servers.online).toBe(0);

    // applications 객체 검증
    expect(summary.applications.avgResponseTime).toBe(0);
    expect(summary.applications.total).toBe(0);

    // clusters 객체 검증
    expect(summary.clusters.total).toBe(0);
  });
});
