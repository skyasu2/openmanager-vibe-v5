/**
 * 🧪 Node 환경 테스트 설정
 * DOM이 필요 없는 순수 Node 환경 테스트용
 */

import { vi } from 'vitest';
import { setupTestEnvironment } from './env.config';
import './mocks/index-node'; // Node 전용 Mock

// ===============================
// 🔧 환경변수 통합 설정
// ===============================
setupTestEnvironment();

// ===============================
// 📡 Node API Mock만 포함
// ===============================
global.fetch = vi.fn();

// ===============================
// ⚡ 성능 최적화 설정
// ===============================

// 콘솔 출력 최적화 (에러만 표시)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error, // 에러는 실제 출력
};

// ===============================
// 🧹 테스트 정리
// ===============================
afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ===============================
// 🔍 테스트 유틸리티
// ===============================
export const testUtils = {
  // 비동기 테스트 헬퍼
  waitFor: (ms: number = 0) =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  // Mock 함수 생성
  createMockFn: <T extends (...args: never[]) => unknown>(implementation?: T) =>
    vi.fn(implementation),

  // 환경변수 임시 설정 (vi.stubEnv 사용)
  withEnv: <T>(envVars: Record<string, string>, fn: () => T): T => {
    // 기존 환경변수 백업
    const originalEnv: Record<string, string | undefined> = {};
    Object.keys(envVars).forEach((key) => {
      originalEnv[key] = process.env[key];
    });

    // vi.stubEnv로 환경변수 설정
    Object.entries(envVars).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });

    try {
      return fn();
    } finally {
      // 원래 값으로 복원
      Object.entries(originalEnv).forEach(([key, value]) => {
        if (value === undefined) {
          vi.unstubAllEnvs();
        } else {
          vi.stubEnv(key, value);
        }
      });
    }
  },

  // Mock 데이터 생성
  createMockServer: () => ({
    id: 'test-server-1',
    hostname: 'test-server',
    status: 'healthy' as const,
    role: 'web' as const,
    environment: 'test' as const,
    cpu_usage: 45,
    memory_usage: 60,
    disk_usage: 30,
    network_in: 100,
    network_out: 150,
    uptime: 86400,
    response_time: 120,
    last_updated: new Date().toISOString(),
  }),
};
