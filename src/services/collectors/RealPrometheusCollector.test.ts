import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', async () => {
  const actual = await vi.importActual<any>('@/lib/redis');
  return {
    ...actual,
    smartRedis: {
      set: vi.fn().mockRejectedValue(new Error('fail')),
      get: vi.fn().mockResolvedValue(null),
    },
  };
});

import { RealPrometheusCollector } from './RealPrometheusCollector';
import { smartRedis } from '@/lib/redis';

describe('RealPrometheusCollector.initialize', () => {
  beforeEach(() => {
    (RealPrometheusCollector as any).instance = null;
  });

  it('Redis 연결 실패 시에도 수집을 시작해야 함', async () => {
    const { RealPrometheusCollector } = await import('./RealPrometheusCollector');
    const collector = RealPrometheusCollector.getInstance();
    const startSpy = vi.spyOn(collector, 'startAutoCollection').mockImplementation(() => {});

    await collector.initialize();

    expect(startSpy).toHaveBeenCalled();
    expect((collector as any).redis).toBe(smartRedis);
    startSpy.mockRestore();
  });
});

describe('RealPrometheusCollector.cacheMetrics', () => {
  beforeEach(() => {
    (RealPrometheusCollector as any).instance = null;
  });

  it('캐시 실패 시에도 메모리 캐시에 저장되어야 함', async () => {
    const { RealPrometheusCollector } = await import('./RealPrometheusCollector');
    const collector = RealPrometheusCollector.getInstance();
    (collector as any).redis = smartRedis;

    const metrics: any = {
      timestamp: 'now',
      server: { hostname: '', ip: '', platform: '', arch: '', uptime: 0 },
      cpu: { usage: 0, cores: 1, model: '' },
      memory: { total: 0, free: 0, used: 0, usage: 0 },
      disk: { total: 0, free: 0, used: 0, usage: 0 },
      network: { interfaces: [], totalRx: 0, totalTx: 0 },
      processes: [],
      services: [],
      logs: [],
    };

    await (collector as any).cacheMetrics('system', metrics);
    const cached = await (collector as any).getCachedMetrics();
    expect(cached).toEqual(metrics);
  });
});
