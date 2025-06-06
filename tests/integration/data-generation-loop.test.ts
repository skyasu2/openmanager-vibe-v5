import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

/**
 * 실행 간격보다 generateRealtimeData 실행 시간이 긴 경우 중첩 실행이 발생하지 않는지 확인
 */
describe('RealServerDataGenerator 비동기 루프 동작', () => {
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

    // 첫 실행 중 5초 경과 - 중첩 호출 없어야 함
    await vi.advanceTimersByTimeAsync(5000);
    expect(spy).toHaveBeenCalledTimes(1);

    // 첫 실행 종료 시점까지 진행
    await vi.advanceTimersByTimeAsync(2000);
    expect(spy).toHaveBeenCalledTimes(1);

    // 이후 5초 대기 후 두 번째 실행
    await vi.advanceTimersByTimeAsync(5000);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
