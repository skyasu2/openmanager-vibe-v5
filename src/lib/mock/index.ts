/**
 * 🎭 Mock 시스템 통합 Export
 *
 * Claude Code 최적화 Mock 시스템의 중앙 진입점
 */

import { GoogleAIMock } from './providers/GoogleAIMock';
import { SupabaseMock } from './providers/SupabaseMock';
import { GCPMock } from './providers/GCPMock';

// Mock 인스턴스 캐시
let googleAIMock: GoogleAIMock | null = null;
let supabaseMock: SupabaseMock | null = null;
let gcpMock: GCPMock | null = null;

/**
 * Mock 모드 확인
 */
export function getMockMode(): 'off' | 'dev' | 'test' | 'force' {
  const mode = process.env.MOCK_MODE;
  if (mode && ['off', 'dev', 'test', 'force'].includes(mode)) {
    return mode as 'off' | 'dev' | 'test' | 'force';
  }

  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'development') return 'dev';
  return 'off';
}

/**
 * Mock 사용 여부 결정
 */
export function shouldUseMock(serviceName?: string): boolean {
  const mode = getMockMode();

  switch (mode) {
    case 'force':
      return true;
    case 'test':
      return process.env.NODE_ENV === 'test';
    case 'dev':
      return (
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test'
      );
    case 'off':
    default:
      return false;
  }
}

/**
 * Google AI Mock 가져오기
 */
export function getGoogleAIMock(): GoogleAIMock {
  if (!googleAIMock) {
    googleAIMock = new GoogleAIMock();
  }
  return googleAIMock;
}

/**
 * Supabase Mock 가져오기
 */
export function getSupabaseMock(): SupabaseMock {
  if (!supabaseMock) {
    supabaseMock = new SupabaseMock();
  }
  return supabaseMock;
}

/**
 * GCP Functions Mock 가져오기
 */
export function getGCPMock(): GCPMock {
  if (!gcpMock) {
    gcpMock = new GCPMock();
  }
  return gcpMock;
}

/**
 * 모든 Mock 통계 조회
 */
export function getAllMockStats(): Record<string, any> {
  return {
    mode: getMockMode(),
    googleAI: googleAIMock?.getStats() || null,
    supabase: supabaseMock?.getStats() || null,
    gcp: gcpMock?.getStats() || null,
  };
}

/**
 * 모든 Mock 리셋
 */
export function resetAllMocks(): void {
  googleAIMock?.reset();
  supabaseMock?.reset();
  gcpMock?.reset();

  console.log('🎭 모든 Mock이 리셋되었습니다');
}

/**
 * Mock 시스템 정보
 */
export function getMockSystemInfo(): {
  version: string;
  mode: string;
  active: boolean;
  services: string[];
} {
  const mode = getMockMode();
  const active = shouldUseMock();

  return {
    version: '2.0.0',
    mode,
    active,
    services: active ? ['googleAI', 'supabase', 'gcp'] : [],
  };
}

// 개발 환경에서 전역 객체에 Mock 노출 (디버깅용)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__MOCK_SYSTEM__ = {
    getGoogleAIMock,
    getSupabaseMock,
    getGCPMock,
    getAllMockStats,
    resetAllMocks,
    getMockSystemInfo,
  };
}
