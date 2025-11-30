/**
 * GCP Functions 설정 관리
 */

import type {
  GCPFunctionsClientConfig,
  RateLimitConfig,
} from './gcp-functions.types';

// 기본 설정
export const GCP_FUNCTIONS_CONFIG: GCPFunctionsClientConfig = {
  baseUrl:
    process.env.NEXT_PUBLIC_GCP_FUNCTIONS_URL ||
    'https://asia-northeast3-openmanager-free-tier.cloudfunctions.net',
  timeout: 5000, // 5초 (실측 230ms의 20배 여유)
  maxRetries: 1, // 1회 재시도만
  retryDelay: 1000, // 1초 후 재시도
  apiVersion: '1.0.0',
  clientId: 'openmanager-vibe-v5',
};

// Rate limiting 설정 (기본적인 클라이언트 사이드 제한)
export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 60, // 분당 60회
  windowMs: 60000, // 1분 윈도우
};

// 환경별 설정
export function getEnvironmentConfig(): Partial<GCPFunctionsClientConfig> {
  const env = process.env.NODE_ENV;

  switch (env) {
    case 'development':
      return {
        timeout: 10000, // 개발 환경에서 더 긴 타임아웃
        maxRetries: 2, // 개발 환경에서 더 많은 재시도
      };

    case 'test':
      return {
        timeout: 2000, // 테스트에서 빠른 타임아웃
        maxRetries: 0, // 테스트에서 재시도 없음
      };
    default:
      return {}; // 기본 설정 사용
  }
}

// 설정 검증
export function validateConfig(config: GCPFunctionsClientConfig): boolean {
  // Base URL 검증
  if (!config.baseUrl || !config.baseUrl.startsWith('https://')) {
    console.error('❌ Invalid base URL in GCP Functions config');
    return false;
  }

  // 타임아웃 검증 (최소 1초, 최대 30초)
  if (config.timeout < 1000 || config.timeout > 30000) {
    console.error(
      '❌ Invalid timeout in GCP Functions config (must be 1-30 seconds)'
    );
    return false;
  }

  // 재시도 횟수 검증 (최대 3회)
  if (config.maxRetries < 0 || config.maxRetries > 3) {
    console.error(
      '❌ Invalid retry count in GCP Functions config (must be 0-3)'
    );
    return false;
  }

  return true;
}

// 완전한 설정 생성
export function createConfig(): GCPFunctionsClientConfig {
  const baseConfig = { ...GCP_FUNCTIONS_CONFIG };
  const envConfig = getEnvironmentConfig();
  const finalConfig = { ...baseConfig, ...envConfig };

  if (!validateConfig(finalConfig)) {
    throw new Error('Invalid GCP Functions configuration');
  }

  return finalConfig;
}

// 디버그 정보 출력
export function logConfiguration(): void {
  if (process.env.NODE_ENV === 'development') {
    const config = createConfig();
    console.log('🔧 GCP Functions 설정:');
    console.log(`  - Base URL: ${config.baseUrl}`);
    console.log(`  - Timeout: ${config.timeout}ms`);
    console.log(`  - Max Retries: ${config.maxRetries}`);
    console.log(`  - Retry Delay: ${config.retryDelay}ms`);
    console.log(`  - API Version: ${config.apiVersion}`);
    console.log(`  - Client ID: ${config.clientId}`);
  }
}
