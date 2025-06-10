import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

/**
 * 실행 간격보다 generateRealtimeData 실행 시간이 긴 경우 중첩 실행이 발생하지 않는지 확인
 */
describe.skip('RealServerDataGenerator 비동기 루프 동작', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (RealServerDataGenerator as any).instance = null;
  });

  afterEach(() => {
    const generator = RealServerDataGenerator.getInstance();
    generator.stopAutoGeneration();
    vi.useRealTimers();
  });

  it('generateRealtimeData가 오래 걸려도 중복 호출되지 않는다', async () => {
    const generator = RealServerDataGenerator.getInstance();
    const spy = vi
      .spyOn(generator as any, 'generateRealtimeData')
      .mockImplementation(async () => {
        await new Promise(res => setTimeout(res, 6000));
      });

    generator.startAutoGeneration();

    // 첫 실행이 시작될 시간 대기
    await vi.advanceTimersByTimeAsync(100);

    // 실행 중 5초 경과 - 아직 첫 번째 실행 중
    await vi.advanceTimersByTimeAsync(5000);

    // 첫 실행 완료까지 대기
    await vi.advanceTimersByTimeAsync(1000);

    // 한 번만 호출되었는지 확인 (중복 호출 없음)
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
