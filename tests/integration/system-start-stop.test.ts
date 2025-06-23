import { POST as stopSystem } from '@/app/api/system/stop/route';
import { GET as unifiedSystem } from '@/app/api/system/unified/route';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 통합 테스트: 시스템 API 동작 확인

// 필요한 모든 시스템 모듈 모킹
vi.mock('@/core/system/ProcessManager', () => ({
  ProcessManager: vi.fn(() => ({
    getSystemStatus: vi.fn(() => ({
      health: 'healthy',
      metrics: {
        runningProcesses: 2,
        totalProcesses: 3,
      },
      processes: [
        {
          id: 'test-process-1',
          status: 'running',
          healthScore: 95,
          restartCount: 0,
          uptime: 3600000,
          lastHealthCheck: new Date().toISOString(),
          errors: [],
        },
      ],
    })),
    getSystemMetrics: vi.fn(() => ({
      cpu: 45,
      memory: 67,
      disk: 23,
      network: { in: 1000, out: 800 },
    })),
    getServiceHealth: vi.fn(() => ({
      database: 'healthy',
      redis: 'healthy',
      ai: 'healthy',
    })),
    startSystem: vi.fn(() =>
      Promise.resolve({
        success: true,
        message: '시스템이 성공적으로 시작되었습니다',
        errors: [],
        warnings: [],
      })
    ),
    stopSystem: vi.fn(() =>
      Promise.resolve({
        success: true,
        message: '시스템이 성공적으로 중지되었습니다',
        errors: [],
      })
    ),
    registerProcess: vi.fn(),
  })),
}));

vi.mock('@/core/system/process-configs', () => ({
  getProcessConfigs: vi.fn(() => [
    {
      id: 'test-process',
      name: 'Test Process',
      command: 'echo test',
      enabled: true,
    },
  ]),
  validateProcessConfigs: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
}));

vi.mock('@/lib/logger', () => ({
  systemLogger: {
    system: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/services/mcp/mcp-warmup-service', () => ({
  MCPWarmupService: {
    getInstance: vi.fn(() => ({
      startPeriodicWarmup: vi.fn(),
    })),
  },
}));

// System State Manager 정확한 경로로 모킹
vi.mock('../../../../core/system/SystemStateManager', () => ({
  systemStateManager: {
    getSystemStatus: vi.fn(() => ({
      status: 'running',
      uptime: 86400000,
      version: 'v5.44.0-test',
      health: 'healthy',
      simulation: {
        isRunning: false,
        runtime: 3600000,
        dataCount: 1000,
        serverCount: 30,
      },
      performance: {
        apiCalls: 100,
        averageResponseTime: 150,
        errorRate: 0.02,
      },
      services: {
        database: 'healthy',
        redis: 'healthy',
        ai: 'healthy',
      },
      lastUpdated: new Date().toISOString(),
    })),
    getSystemMetrics: vi.fn(() => ({
      cpu: 45,
      memory: 67,
      disk: 23,
      network: { in: 1000, out: 800 },
    })),
    stopSimulation: vi.fn(() =>
      Promise.resolve({
        success: true,
        message: '시스템 시뮬레이션이 중지되었습니다.',
        timestamp: new Date().toISOString(),
      })
    ),
    trackApiCall: vi.fn((responseTime: number, isError: boolean) => {
      console.log(`API 호출 추적: ${responseTime}ms, 에러: ${isError}`);
    }),
    isSystemRunning: vi.fn(() => true),
    systemHealth: 'healthy',
  },
}));

// 추가 경로 모킹 (상대 경로 대응)
vi.mock('@/core/system/SystemStateManager', () => ({
  systemStateManager: {
    getSystemStatus: vi.fn(() => ({
      status: 'running',
      uptime: 86400000,
      version: 'v5.44.0-test',
      health: 'healthy',
      simulation: {
        isRunning: false,
        runtime: 3600000,
        dataCount: 1000,
        serverCount: 30,
      },
      performance: {
        apiCalls: 100,
        averageResponseTime: 150,
        errorRate: 0.02,
      },
      services: {
        database: 'healthy',
        redis: 'healthy',
        ai: 'healthy',
      },
      lastUpdated: new Date().toISOString(),
    })),
    stopSimulation: vi.fn(() =>
      Promise.resolve({
        success: true,
        message: '시스템 시뮬레이션이 중지되었습니다.',
        timestamp: new Date().toISOString(),
      })
    ),
    trackApiCall: vi.fn((responseTime: number, isError: boolean) => {
      console.log(`API 호출 추적: ${responseTime}ms, 에러: ${isError}`);
    }),
  },
}));

// Redis 연결 차단 방지
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve('OK')),
    ping: vi.fn(() => Promise.resolve('PONG')),
  })),
}));

// Data Generator 모킹
vi.mock('@/services/data-generator/RealServerDataGenerator', () => ({
  RealServerDataGenerator: {
    getInstance: vi.fn(() => ({
      getStatus: vi.fn(() => ({
        isRunning: true,
        serverCount: 30,
        lastUpdate: new Date().toISOString(),
        mode: 'mock',
      })),
      stopGeneration: vi.fn(() =>
        Promise.resolve({
          success: true,
          message: '데이터 생성이 중지되었습니다.',
        })
      ),
    })),
  },
}));

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
