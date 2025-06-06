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

    expect((realServerDataGenerator as any).isGenerating).toBe(true);
    expect((realServerDataGenerator as any).generationInterval).not.toBeNull();

    vi.runOnlyPendingTimers();
  });
});
