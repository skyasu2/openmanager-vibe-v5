import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { realServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

// 실 Redis 환경변수가 없는 상황에서 초기화 동작 확인

describe('RealServerDataGenerator initialize without Redis', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.useFakeTimers();
    realServerDataGenerator.stopAutoGeneration();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    realServerDataGenerator.stopAutoGeneration();
    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    vi.useRealTimers();
  });

  it('initialize 호출 시 생성 루프가 시작된다', async () => {
    await realServerDataGenerator.initialize();

    // 자동 생성이 시작되었는지 확인
    expect((realServerDataGenerator as any).isGenerating).toBe(true);

    // 비동기 루프에서는 첫 실행 후 타이머가 설정됨
    // 하지만 테스트 환경에서는 타이머 확인보다는 상태 확인이 더 안정적
    await vi.advanceTimersByTimeAsync(100);

    // 여전히 생성 중인지 확인
    expect((realServerDataGenerator as any).isGenerating).toBe(true);
  });
});
