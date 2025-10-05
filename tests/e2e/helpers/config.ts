/**
 * 🌐 E2E 테스트 환경 설정 중앙 관리
 *
 * 🎯 목적: 환경 감지 로직 중앙화 및 일관성 보장
 * 📊 효과: 8개 파일의 중복 코드 제거, 유지보수성 향상
 *
 * 사용 예시:
 * ```typescript
 * import { getTestBaseUrl } from './helpers/config';
 *
 * const baseUrl = getTestBaseUrl();  // 자동 환경 감지
 * await page.goto(baseUrl + '/dashboard');
 * ```
 */

/**
 * 테스트 환경 자동 감지 및 Base URL 반환
 *
 * 우선순위:
 * 1. PLAYWRIGHT_BASE_URL (Playwright 설정)
 * 2. VERCEL_PRODUCTION_URL (Vercel 프로덕션 환경)
 * 3. http://localhost:3000 (로컬 개발)
 *
 * @returns 테스트 Base URL
 */
export function getTestBaseUrl(): string {
  return (
    process.env.PLAYWRIGHT_BASE_URL ||
    process.env.VERCEL_PRODUCTION_URL ||
    'http://localhost:3000'
  );
}

/**
 * Vercel 프로덕션 환경 여부 확인
 *
 * @param url - 확인할 URL (선택적, 미제공 시 getTestBaseUrl() 사용)
 * @returns Vercel 프로덕션 환경이면 true
 */
export function isVercelProduction(url?: string): boolean {
  const targetUrl = url || getTestBaseUrl();
  return targetUrl.includes('vercel.app');
}

/**
 * 로컬 개발 환경 여부 확인
 *
 * @param url - 확인할 URL (선택적, 미제공 시 getTestBaseUrl() 사용)
 * @returns 로컬 환경이면 true
 */
export function isLocalEnvironment(url?: string): boolean {
  const targetUrl = url || getTestBaseUrl();
  return targetUrl.includes('localhost');
}

/**
 * 환경 정보 객체 반환
 *
 * @returns 환경 정보 (baseUrl, isProduction, isLocal)
 */
export interface EnvironmentInfo {
  baseUrl: string;
  isProduction: boolean;
  isLocal: boolean;
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const baseUrl = getTestBaseUrl();
  return {
    baseUrl,
    isProduction: isVercelProduction(baseUrl),
    isLocal: isLocalEnvironment(baseUrl),
  };
}
