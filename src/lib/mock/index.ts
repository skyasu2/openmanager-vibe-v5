/**
 * 🎭 Mock 시스템 통합 Export
 *
 * Claude Code 최적화 Mock 시스템의 중앙 진입점
 *
 * ## v5.84.0: Removed Google AI Mock (migrated to Mistral)
 * - GCP Functions Mock 제거됨 (2025-12-14) - Cloud Run으로 대체
 * - Google AI Mock 제거됨 (2025-12-31) - Mistral로 대체
 */

import { SupabaseMock } from './providers/SupabaseMock';

// Mock 인스턴스 캐시
let supabaseMock: SupabaseMock | null = null;

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
export function shouldUseMock(_serviceName?: string): boolean {
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
    default:
      return false;
  }
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
 * 모든 Mock 통계 조회
 */
export function getAllMockStats(): Record<string, unknown> {
  return {
    mode: getMockMode(),
    supabase: supabaseMock?.getStats() || null,
  };
}

/**
 * 모든 Mock 리셋
 */
export function resetAllMocks(): void {
  supabaseMock?.reset();

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
    version: '3.0.0', // Google AI Mock 제거됨
    mode,
    active,
    services: active ? ['supabase'] : [],
  };
}

// 개발 환경에서 전역 객체에 Mock 노출 (디버깅용)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (
    window as Window & { __MOCK_SYSTEM__?: Record<string, unknown> }
  ).__MOCK_SYSTEM__ = {
    getSupabaseMock,
    getAllMockStats,
    resetAllMocks,
    getMockSystemInfo,
  };
}
