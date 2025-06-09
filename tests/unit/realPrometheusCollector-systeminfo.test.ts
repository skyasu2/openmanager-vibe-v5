import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealPrometheusCollector } from '@/services/collectors/RealPrometheusCollector';
import si from 'systeminformation';

describe('RealPrometheusCollector systeminformation', () => {
  beforeEach(() => {
    (RealPrometheusCollector as any).instance = null;
  });

  it('getDiskInfo는 systeminformation을 활용한다', async () => {
    vi.spyOn(si, 'fsSize').mockResolvedValue([
      { size: 1000, used: 500, available: 500 } as any,
    ]);

    const collector = RealPrometheusCollector.getInstance();
    const disk = await (collector as any).getDiskInfo();

    expect(disk.total).toBe(1000);
    expect(disk.used).toBe(500);
    expect(disk.free).toBe(500);
    expect(disk.usage).toBe(50);
  });
});
