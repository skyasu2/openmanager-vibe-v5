import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as stopSystem } from '@/app/api/system/stop/route';
import { GET as unifiedSystem } from '@/app/api/system/unified/route';
import { NextRequest } from 'next/server';
import { systemStateManager } from '@/core/system/SystemStateManager';

// 통합 테스트: 시스템 API 동작 확인

describe('System API operations', () => {
  beforeEach(async () => {
    // 테스트 시작 전 안정적인 상태 보장
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // 테스트 종료 후 정리
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('unified API가 시스템 상태를 정상적으로 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/system/unified', {
      method: 'GET',
    });

    const res = await unifiedSystem(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
  });

  it('stop API가 정상적으로 응답한다', async () => {
    const req = new NextRequest('http://localhost/api/system/stop', {
      method: 'POST',
    });

    const res = await stopSystem(req);

    // API가 정상적으로 응답하는지만 확인 (status와 상관없이)
    expect(res).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);

    const data = await res.json();
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  });
});
