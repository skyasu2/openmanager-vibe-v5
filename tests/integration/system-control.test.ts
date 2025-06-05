import { describe, it, expect, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as startPOST } from '../../src/app/api/system/start/route';
import { POST as stopPOST } from '../../src/app/api/system/stop/route';
import { systemStateManager } from '../../src/core/system/SystemStateManager';
import { timerManager } from '../../src/utils/TimerManager';

describe('System start/stop API', () => {
  afterAll(() => {
    systemStateManager.destroy();
    timerManager.cleanup();
  });

  it('시뮬레이션을 시작하고 중지한다', async () => {
    const startReq = new NextRequest('http://localhost/api/system/start', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const startRes = await startPOST(startReq);
    const startData = await startRes.json();

    expect(startData.success).toBe(true);
    expect(systemStateManager.getSystemStatus().simulation.isRunning).toBe(true);

    const stopReq = new NextRequest('http://localhost/api/system/stop', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const stopRes = await stopPOST(stopReq);
    const stopData = await stopRes.json();

    expect(stopData.success).toBe(true);
    expect(systemStateManager.getSystemStatus().simulation.isRunning).toBe(false);
  });
});
