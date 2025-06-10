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

    // servers 객체 검증 - NaN 체크
    expect(Number.isNaN(summary.servers.avgCpu)).toBe(false);
    expect(Number.isNaN(summary.servers.avgMemory)).toBe(false);
    expect(summary.servers.avgCpu).toBe(0);
    expect(summary.servers.avgMemory).toBe(0);

    // applications 객체 검증 - NaN 체크
    expect(Number.isNaN(summary.applications.avgResponseTime)).toBe(false);
    expect(summary.applications.avgResponseTime).toBe(0);
  });
});
