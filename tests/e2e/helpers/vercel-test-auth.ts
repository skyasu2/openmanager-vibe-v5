import type { BrowserContext, Page } from '@playwright/test';
import { getTestBaseUrl } from './config';

/**
 * 🚀 베르셀 친화적 AI 테스트 헬퍼
 *
 * 🎯 목적: 프로덕션 포함 모든 베르셀 환경에서 AI가 쉽게 테스트
 * 🤖 AI 친화: 한 줄 코드로 전체 접근 권한 획득
 *
 * 사용 예시:
 * ```typescript
 * await enableVercelTestMode(page);  // 한 번만!
 * await page.goto('/dashboard');     // 인증 없이 접근
 * await page.goto('/admin');         // 모든 페이지 자유롭게
 * ```
 */

// 🔐 환경변수에서 시크릿 키 가져오기 (기본값 제거 - 보안 강화)
const TEST_SECRET_KEY = process.env.TEST_SECRET_KEY;

// 🚨 환경변수 필수 검증 (테스트 실행 전 조기 실패)
if (!TEST_SECRET_KEY) {
  console.error('❌ [Security] TEST_SECRET_KEY 환경변수가 설정되지 않았습니다.');
  console.error('   설정 방법: .env.e2e 파일에 TEST_SECRET_KEY="your-secret" 추가');
  throw new Error(
    'TEST_SECRET_KEY 환경변수 필수: .env.e2e 또는 CI/CD 환경에서 설정하세요.'
  );
}

export type TestMode = 'guest' | 'admin' | 'full_access';

export interface VercelTestAuthOptions {
  mode?: TestMode;
  pin?: string;
  bypass?: boolean;
  baseUrl?: string;
}

export interface VercelTestAuthResult {
  success: boolean;
  message: string;
  testMode?: TestMode;
  accessToken?: string;
  sessionData?: {
    authType: string;
    adminMode: boolean;
    permissions: string[];
  };
}

/**
 * 🚀 베르셀 테스트 모드 활성화 (AI 친화적)
 *
 * 이 함수 한 번 호출하면:
 * - ✅ 모든 페이지 인증 없이 접근
 * - ✅ 관리자 권한 자동 부여
 * - ✅ localStorage/Cookie 자동 설정
 *
 * @param page - Playwright Page 또는 BrowserContext
 * @param options - 테스트 모드 옵션
 * @returns 인증 결과
 *
 * @example
 * ```typescript
 * // 🤖 AI가 가장 쉽게 사용하는 방법
 * await enableVercelTestMode(page);
 * await page.goto('/dashboard');  // ✅ 바로 접근 가능!
 * ```
 */
export async function enableVercelTestMode(
  page: Page | BrowserContext,
  options: VercelTestAuthOptions = {}
): Promise<VercelTestAuthResult> {
  const {
    mode = 'full_access',
    pin = '4231',
    bypass = true,
    baseUrl,
  } = options;

  console.log('🚀 [Vercel Test] 테스트 모드 활성화 시작:', { mode });

  try {
    // 1️⃣ 베이스 URL 결정 (config.ts 중앙 관리)
    const targetUrl = baseUrl || getTestBaseUrl();
    console.log(`🌐 [Vercel Test] 대상 URL: ${targetUrl}`);

    // 2️⃣ 페이지 객체 가져오기
    let targetPage: Page;
    if ('goto' in page) {
      targetPage = page;
    } else {
      // BrowserContext인 경우 새 페이지 생성
      const pages = page.pages();
      targetPage = pages[0] || (await page.newPage());
    }

    // 3️⃣ API 호출하여 인증 (Playwright request API 사용)
    const context = 'context' in targetPage ? targetPage.context() : targetPage;
    const response = await context.request.post(
      `${targetUrl}/api/test/vercel-test-auth`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Playwright Test Agent',
        },
        data: {
          secret: TEST_SECRET_KEY,
          mode,
          pin,
          bypass,
        },
      }
    );

    if (!response.ok()) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || response.statusText();
      } catch {
        errorMessage = errorText || response.statusText();
      }
      throw new Error(`인증 실패 (${response.status()}): ${errorMessage}`);
    }

    const authResult = await response.json();

    if (!authResult.success) {
      throw new Error(`인증 실패: ${authResult.message}`);
    }

    console.log('✅ [Vercel Test] API 인증 성공:', authResult.testMode);

    // 4️⃣ 쿠키 설정 (localStorage 대신 쿠키만 사용 - Vercel 프로덕션 보안 정책 호환)
    await context.addCookies([
      {
        name: 'test_mode',
        value: 'enabled',
        url: targetUrl,
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'test_auth_type',
        value: authResult.sessionData?.authType || 'test',
        url: targetUrl,
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'admin_mode',
        value: authResult.sessionData?.adminMode ? 'true' : 'false',
        url: targetUrl,
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'test_permissions',
        value: JSON.stringify(authResult.sessionData?.permissions || []),
        url: targetUrl,
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'test_bypass_active',
        value: 'true',
        url: targetUrl,
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'vercel_test_token',
        value: authResult.accessToken || '',
        url: targetUrl,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    console.log('✅ [Vercel Test] 쿠키 설정 완료 (localStorage 우회)');

    // 6️⃣ 테스트 헤더 추가 (모든 요청에 자동 적용)
    await context.route('**/*', async (route) => {
      const headers = {
        ...route.request().headers(),
        'X-Test-Mode': 'enabled',
        'X-Test-Auth-Type': authResult.sessionData?.authType || 'test',
        'X-Test-Token': authResult.accessToken || '',
      };

      await route.continue({ headers });
    });

    console.log('✅ [Vercel Test] 테스트 헤더 자동 추가 설정 완료');

    // 7️⃣ 최종 결과
    console.log('🎉 [Vercel Test] 테스트 모드 완전 활성화!');
    console.log('   - 모든 페이지 인증 없이 접근 가능');
    console.log('   - 관리자 권한 활성화됨');
    console.log(`   - 권한: ${authResult.sessionData?.permissions.join(', ')}`);

    return authResult;
  } catch (error) {
    console.error('❌ [Vercel Test] 테스트 모드 활성화 실패:', error);
    throw error;
  }
}

/**
 * 🤖 AI 친화적 페이지 이동
 *
 * 테스트 모드가 자동으로 설정되고, 원하는 페이지로 이동
 *
 * @param page - Playwright Page
 * @param url - 이동할 URL (상대 경로 또는 절대 경로)
 * @param autoSetup - 자동으로 테스트 모드 설정 (기본: true)
 *
 * @example
 * ```typescript
 * // 🤖 AI가 사용하는 가장 간단한 방법
 * await aiNavigate(page, '/dashboard');
 * await aiNavigate(page, '/admin');
 * await aiNavigate(page, '/ai-assistant');
 * ```
 */
export async function aiNavigate(
  page: Page,
  url: string,
  autoSetup: boolean = true
): Promise<void> {
  console.log(`🤖 [AI Navigate] 이동 요청: ${url}`);

  try {
    // 1️⃣ 테스트 모드 확인 (쿠키 기반)
    const cookies = await page.context().cookies();
    const testModeCookie = cookies.find((c) => c.name === 'test_mode');
    const isTestModeActive = testModeCookie?.value === 'enabled';

    // 2️⃣ 테스트 모드가 없으면 자동 설정
    if (!isTestModeActive && autoSetup) {
      console.log('🔄 [AI Navigate] 테스트 모드 자동 설정 중...');
      await enableVercelTestMode(page);
    }

    // 3️⃣ 페이지 이동
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    console.log(`✅ [AI Navigate] ${url} 접근 완료`);
  } catch (error) {
    console.error(`❌ [AI Navigate] ${url} 이동 실패:`, error);
    throw error;
  }
}

/**
 * 🧹 테스트 모드 정리
 *
 * @param page - Playwright Page
 */
export async function cleanupVercelTestMode(page: Page): Promise<void> {
  console.log('🧹 [Vercel Test] 테스트 모드 정리 시작');

  try {
    // 쿠키 정리만 수행 (localStorage는 사용하지 않음 - Vercel 프로덕션 호환)
    const context = page.context();
    await context.clearCookies();

    console.log('✅ [Vercel Test] 테스트 모드 정리 완료');
  } catch (error) {
    console.error('❌ [Vercel Test] 정리 중 오류:', error);
  }
}

/**
 * 📊 현재 테스트 상태 확인
 *
 * @param page - Playwright Page
 * @returns 테스트 상태 정보
 */
export async function getVercelTestStatus(page: Page): Promise<{
  isActive: boolean;
  authType: string | null;
  adminMode: boolean;
  permissions: string[];
}> {
  // 쿠키 기반으로 테스트 상태 확인 (localStorage는 Vercel 프로덕션에서 차단됨)
  const cookies = await page.context().cookies();

  const testModeCookie = cookies.find((c) => c.name === 'test_mode');
  const isActive = testModeCookie?.value === 'enabled';

  const authTypeCookie = cookies.find((c) => c.name === 'test_auth_type');
  const authType = authTypeCookie?.value || null;

  const adminModeCookie = cookies.find((c) => c.name === 'admin_mode');
  const adminMode = adminModeCookie?.value === 'true';

  const permissionsCookie = cookies.find((c) => c.name === 'test_permissions');
  const permissions = permissionsCookie?.value
    ? JSON.parse(permissionsCookie.value)
    : [];

  return { isActive, authType, adminMode, permissions };
}

/**
 * 🔒 베르셀 테스트 API 상태 확인
 *
 * API가 사용 가능한지 확인
 *
 * @param baseUrl - 베이스 URL
 * @returns API 사용 가능 여부
 */
export async function checkVercelTestApi(baseUrl?: string): Promise<boolean> {
  const targetUrl = baseUrl || getTestBaseUrl();

  try {
    const response = await fetch(
      `${targetUrl}/api/test/vercel-test-auth?secret=${TEST_SECRET_KEY}`
    );
    const data = await response.json();

    console.log('🔍 [Vercel Test] API 상태:', {
      available: data.available,
      environment: data.environment,
    });

    return data.available === true;
  } catch (error) {
    console.warn('⚠️ [Vercel Test] API 확인 실패:', error);
    return false;
  }
}
