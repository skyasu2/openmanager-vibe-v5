import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { aiAgentEngine } from '@/modules/ai-agent/core/AIAgentEngine';
import { GET as hybridGet } from '@/app/api/ai/hybrid/route';
import { createMockNextRequest } from '@/testing/setup';

// Edge runtime 호환성 테스트

describe('Edge runtime compatibility', () => {
  let originalProcess: any;

  beforeAll(() => {
    // process 객체가 없는 환경을 시뮬레이션
    originalProcess = (globalThis as any).process;
    (globalThis as any).process = undefined;
  });

  afterAll(() => {
    // 원래 process 객체 복원
    (globalThis as any).process = originalProcess;
  });

  it('AIAgentEngine.getEngineStatus 호출 시 오류가 발생하지 않는다', () => {
    const status = aiAgentEngine.getEngineStatus();
    expect(status.uptime).toBe(0);
    expect(status.memory).toBeDefined();
  });

  it('Hybrid AI API GET 호출이 정상 동작한다', async () => {
    const req = createMockNextRequest('http://localhost/api/ai/hybrid');
    const res = await hybridGet(req as any);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.healthCheck.uptime).toBe(0);
  });
});
