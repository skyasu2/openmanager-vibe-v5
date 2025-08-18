/**
 * 환경별 설정 관리 유틸리티
 *
 * Vercel 배포, 테스트 서버, 로컬 개발 환경을 구분하여 적절한 URL 반환
 */

export type Environment = 'development' | 'test' | 'production';

interface EnvConfig {
  environment: Environment;
  siteUrl: string;
  apiUrl: string;
  vmApiUrl: string;
  isVercel: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

/**
 * 현재 환경 감지
 */
function detectEnvironment(): Environment {
  // Vercel 환경 변수 체크
  if (process.env.VERCEL_ENV === 'production') {
    return 'production';
  }

  if (process.env.VERCEL_ENV === 'preview') {
    return 'test';
  }

  // NODE_ENV 체크
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }

  return 'development';
}

/**
 * 환경에 따른 사이트 URL 반환
 */
function getSiteUrl(env: Environment): string {
  // Vercel에서 제공하는 URL 우선 사용
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  switch (env) {
    case 'production':
      return (
        process.env.NEXT_PUBLIC_PROD_URL ||
        'https://openmanager-vibe-v5.vercel.app'
      );

    case 'test':
      return (
        process.env.NEXT_PUBLIC_TEST_URL ||
        'https://openmanager-test.vercel.app'
      );

    case 'development':
    default:
      return process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000';
  }
}

/**
 * 환경에 따른 API URL 반환
 */
function getApiUrl(env: Environment): string {
  const siteUrl = getSiteUrl(env);
  return `${siteUrl}/api`;
}

/**
 * VM API URL 반환 (모든 환경에서 동일)
 */
function getVmApiUrl(): string {
  return process.env.VM_API_URL || 'http://104.154.205.25:10000';
}

/**
 * 환경 설정 객체 생성
 */
export function getEnvConfig(): EnvConfig {
  const environment = detectEnvironment();

  return {
    environment,
    siteUrl: getSiteUrl(environment),
    apiUrl: getApiUrl(environment),
    vmApiUrl: getVmApiUrl(),
    isVercel: !!process.env.VERCEL,
    isProduction: environment === 'production',
    isDevelopment: environment === 'development',
    isTest: environment === 'test',
  };
}

/**
 * 클라이언트 사이드에서 사용할 환경 설정
 */
export function getPublicEnvConfig() {
  const environment = detectEnvironment();

  return {
    environment,
    siteUrl: getSiteUrl(environment),
    apiUrl: getApiUrl(environment),
    isProduction: environment === 'production',
    isDevelopment: environment === 'development',
    isTest: environment === 'test',
  };
}

/**
 * 환경별 기능 플래그
 */
export const featureFlags = {
  // 개발 환경에서만 활성화
  debugMode: process.env.NODE_ENV === 'development',
  mockMode:
    process.env.NODE_ENV === 'development' && process.env.MOCK_MODE === 'true',

  // 프로덕션에서만 활성화
  analytics: process.env.NODE_ENV === 'production',
  errorReporting: process.env.NODE_ENV === 'production',

  // 테스트 환경에서 활성화
  testFeatures: process.env.NODE_ENV === 'test',
};

/**
 * 환경 정보 로깅 (개발 환경에서만)
 */
export function logEnvironment() {
  if (process.env.NODE_ENV === 'development') {
    const config = getEnvConfig();
    console.log('🌍 Environment Configuration:', {
      environment: config.environment,
      siteUrl: config.siteUrl,
      apiUrl: config.apiUrl,
      vmApiUrl: config.vmApiUrl,
      isVercel: config.isVercel,
    });
  }
}

// 기본 export
export default getEnvConfig;
