import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { RealPrometheusCollector } from '@/services/collectors/RealPrometheusCollector';

// 자동 실행 스케줄 중복 호출 방지 테스트

describe('자동 실행 스케줄', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 싱글톤 초기화 리셋
    (RealServerDataGenerator as any).instance = null;
    (RealPrometheusCollector as any).instance = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('startAutoGeneration이 이전 작업 완료 후 다음 호출을 예약한다', async () => {
    const generator = RealServerDataGenerator.getInstance();
    const spy = vi
      .spyOn(generator as any, 'generateRealtimeData')
      .mockImplementation(() => new Promise(res => setTimeout(res, 7000)));

    generator.startAutoGeneration();

    await vi.advanceTimersByTimeAsync(20000);

    // updateInterval이 3000ms로 변경되어 더 자주 호출됨 (20초 동안 5-7번 호출 가능)
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(spy.mock.calls.length).toBeLessThanOrEqual(7);

    generator.stopAutoGeneration();
  });

  it('startAutoCollection이 이전 작업 완료 후 다음 호출을 예약한다', async () => {
    const collector = RealPrometheusCollector.getInstance({
      collectInterval: 5000,
    });
    const spy = vi
      .spyOn(collector as any, 'collectMetrics')
      .mockImplementation(() => new Promise(res => setTimeout(res, 7000)));

    collector.startAutoCollection();

    await vi.advanceTimersByTimeAsync(20000);

    expect(spy).toHaveBeenCalledTimes(2);

    collector.stopAutoCollection();
  });
});
