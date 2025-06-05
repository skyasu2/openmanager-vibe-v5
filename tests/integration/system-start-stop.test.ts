import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as startSystem } from '@/app/api/system/start/route';
import { POST as stopSystem } from '@/app/api/system/stop/route';
import { NextRequest } from 'next/server';
import { systemStateManager } from '@/core/system/SystemStateManager';

// 통합 테스트: 시스템 시작 및 중지 API

describe('System start/stop API', () => {
  beforeEach(async () => {
    // 테스트 시작 전 엔진을 중지하여 초기 상태 보장
    await systemStateManager.stopSimulation();
  });

  afterEach(async () => {
    // 테스트 종료 후 엔진 중지
    await systemStateManager.stopSimulation();
  });

  it('startSystem 호출 후 엔진이 실행되고 stopSystem 호출 후 중지된다', async () => {
    const startReq = new NextRequest('http://localhost/api/system/start', {
      method: 'POST',
      body: JSON.stringify({ mode: 'fast' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const startRes = await startSystem(startReq);
    const startData = await startRes.json();
    expect(startData.success).toBe(true);
    expect(systemStateManager.getSystemStatus().simulation.isRunning).toBe(true);

    const stopReq = new NextRequest('http://localhost/api/system/stop', {
      method: 'POST',
    });
    const stopRes = await stopSystem(stopReq);
    const stopData = await stopRes.json();
    expect(stopData.success).toBe(true);
    expect(systemStateManager.getSystemStatus().simulation.isRunning).toBe(false);
  });
});
