import { describe, expect, it, vi } from 'vitest';

// Process 호환성 테스트 (Edge Runtime 대신)
describe('Process compatibility', () => {
  it('process.memoryUsage 함수가 정상 작동한다', () => {
    const memory = process.memoryUsage();
    expect(memory).toBeDefined();
    expect(typeof memory.rss).toBe('number');
    expect(typeof memory.heapTotal).toBe('number');
    expect(typeof memory.heapUsed).toBe('number');
    expect(typeof memory.external).toBe('number');
  });

  it('process.env가 정상 작동한다', () => {
    expect(process.env).toBeDefined();
    // vi.stubEnv로 설정된 환경변수는 import.meta.env로 접근
    expect(import.meta.env.NODE_ENV || process.env.NODE_ENV).toBe('test');
    // FORCE_MOCK_REDIS는 설정되지 않았을 수 있으므로 존재 여부만 확인
    const forceMockRedis = import.meta.env.FORCE_MOCK_REDIS || process.env.FORCE_MOCK_REDIS;
    expect(forceMockRedis === 'true' || forceMockRedis === undefined).toBe(true);
  });
});
