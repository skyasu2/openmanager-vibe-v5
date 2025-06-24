import { describe, expect, it } from 'vitest';

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
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.FORCE_MOCK_REDIS).toBe('true');
  });
});
