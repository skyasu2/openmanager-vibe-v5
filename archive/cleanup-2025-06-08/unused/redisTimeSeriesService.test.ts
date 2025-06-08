import { describe, it, expect, vi } from 'vitest';
import { redisTimeSeriesService } from './redisTimeSeriesService';

const samplePoint = {
  timestamp: Date.now(),
  server_id: 'test-server',
  hostname: 'test-host',
  environment: 'test',
  role: 'web',
  metrics: {
    cpu_usage: 10,
    memory_usage: 20,
    disk_usage: 30,
    network_in: 40,
    network_out: 50,
    response_time: 60,
  },
  status: 'ok',
  alerts_count: 0
};

describe('redisTimeSeriesService.backupToSupabase', () => {
  it('Supabase 클라이언트 미초기화 시 경고 로그를 출력해야 함', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await (redisTimeSeriesService as any).backupToSupabase([samplePoint]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
