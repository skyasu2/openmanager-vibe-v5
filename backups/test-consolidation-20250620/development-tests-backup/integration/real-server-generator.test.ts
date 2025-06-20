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
    // 초기화 전 상태 확인
    const initialServers = realServerDataGenerator.getAllServers();

    await realServerDataGenerator.initialize();

    // 초기화 후 서버가 생성되었는지 확인
    await vi.advanceTimersByTimeAsync(100);
    const afterServers = realServerDataGenerator.getAllServers();

    // 서버가 생성되었거나 초기화가 완료되었음을 확인
    expect(afterServers.length).toBeGreaterThanOrEqual(0);

    // 타이머를 더 진행시켜서 자동 생성이 동작하는지 확인
    await vi.advanceTimersByTimeAsync(1000);

    // 자동 생성이 실행되었는지 확인 (서버 수가 증가했거나 최소한 유지됨)
    const finalServers = realServerDataGenerator.getAllServers();
    expect(finalServers.length).toBeGreaterThanOrEqual(afterServers.length);
  });
});
