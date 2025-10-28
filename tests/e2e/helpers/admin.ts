import { Page, expect } from '@playwright/test';
import { getTestBaseUrl, isVercelProduction } from './config';
import { TIMEOUTS } from './timeouts';
import * as fs from 'fs/promises';

/**
 * Playwright 테스트용 관리자 모드 헬퍼 함수들
 *
 * 🎯 목적: 관리자 모드 테스트 자동화 및 효율성 극대화
 * ⚡ 효과: 기존 4단계 UI 흐름 → 1회 API 호출로 단축 (10-15초 → 2-3초)
 */

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  testMode?: 'guest' | 'admin' | 'full_access';
  accessToken?: string;
  sessionData?: {
    authType: string;
    adminMode: boolean;
    permissions: string[];
  };
  timestamp?: string;
  error?: string;
}

/**
 * ✅ 페이지가 올바른 오리진을 가지도록 보장
 * Playwright가 about:blank 상태일 때 localStorage 접근이 제한되어 SecurityError가 발생할 수 있어
 * 테스트 시작 전에 기본 로그인 페이지로 이동시켜 도메인을 고정한다.
 */
async function ensurePageContext(
  page: Page,
  fallbackPath: string = '/login'
): Promise<void> {
  const currentUrl = page.url();

  const needsNavigation =
    !currentUrl ||
    currentUrl === 'about:blank' ||
    currentUrl.startsWith('data:');

  if (!needsNavigation) {
    try {
      const parsed = new URL(currentUrl);
      const baseUrl = getTestBaseUrl();
      if (!parsed.origin || !baseUrl.startsWith(parsed.origin)) {
        await page.goto(fallbackPath, { waitUntil: 'domcontentloaded' });
      }
      return;
    } catch {
      await page.goto(fallbackPath, { waitUntil: 'domcontentloaded' });
      return;
    }
  }

  await page.goto(fallbackPath, { waitUntil: 'domcontentloaded' });
}

/**
 * 🔒 보안 강화된 관리자 모드 활성화
 *
 * @param page - Playwright Page 객체
 * @param options - 인증 옵션
 * @returns 관리자 인증 결과
 */
export async function activateAdminMode(
  page: Page,
  options: {
    method?: 'bypass' | 'password';
    password?: string;
    skipGuestLogin?: boolean;
    testToken?: string;
  } = {}
): Promise<AdminAuthResponse> {
  // 프로덕션 환경에서는 password 모드 강제 (config.ts 중앙 관리)
  const pageUrl = page.url();
  const baseUrl = getTestBaseUrl();
  const isProduction =
    isVercelProduction(pageUrl) || isVercelProduction(baseUrl);

  // 프로덕션(Vercel)에서는 항상 password, 로컬에서만 bypass 허용
  const defaultMethod = isProduction ? 'password' : 'bypass';

  const {
    method = defaultMethod,
    password = '4231',
    skipGuestLogin = false,
    testToken,
  } = options;

  try {
    console.log('🧪 [Admin Helper] 관리자 모드 활성화 시작:', {
      method,
      skipGuestLogin,
      pageUrl,
      baseUrl,
      isProduction,
    });

    // Vercel 환경에서는 about:blank 상태에서 localStorage 접근이 차단되므로 선행 페이지 로드
    await ensurePageContext(page);

    // 1단계: 게스트 로그인 (필요한 경우만)
    if (!skipGuestLogin) {
      await ensureGuestLogin(page);
    }

    // 2단계: 보안 토큰 생성 및 검증
    const secureToken = testToken || (await generateSecureTestToken(page));

    // Vercel 배포 보호 우회 (E2E 테스트용)
    const vercelBypassSecret =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';

    // 🔍 네트워크 요청 로깅: 바이패스 헤더 전송 검증
    await page.route('**/api/test/vercel-test-auth', (route) => {
      const request = route.request();
      const headers = request.headers();

      console.log(
        '🔍 [Network Inspector] ========================================'
      );
      console.log('🔍 [Network Inspector] Request URL:', request.url());
      console.log('🔍 [Network Inspector] Request Method:', request.method());
      console.log(
        '🔍 [Network Inspector] All Headers:',
        JSON.stringify(headers, null, 2)
      );
      console.log(
        '🔍 [Network Inspector] Has bypass header:',
        'x-vercel-protection-bypass' in headers
      );
      console.log(
        '🔍 [Network Inspector] Bypass header value:',
        headers['x-vercel-protection-bypass'] || 'NOT FOUND'
      );
      console.log(
        '🔍 [Network Inspector] Expected value:',
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      );
      console.log(
        '🔍 [Network Inspector] ========================================'
      );

      route.continue();
    });

    // 3단계: 보안 강화된 API 호출
    const authResponse = await page.evaluate(
      async (authData) => {
        const { method, password, secretKey, bypassSecret } = authData;

        const response = await fetch('/api/test/vercel-test-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Playwright Test Agent',
            'x-vercel-protection-bypass': bypassSecret,
          },
          body: JSON.stringify({
            secret: secretKey,
            mode: method === 'bypass' ? 'full_access' : 'admin',
            bypass: method === 'bypass',
            pin: password,
          }),
        });

        const result = await response.json();
        return { ...result, status: response.status };
      },
      {
        method,
        password,
        secretKey:
          process.env.TEST_SECRET_KEY || 'test-secret-key-please-change-in-env',
        bypassSecret: vercelBypassSecret,
      }
    );

    if (!authResponse.success) {
      throw new Error(`관리자 인증 실패: ${authResponse.message}`);
    }

    // 3단계: Zustand 스토어 업데이트 (API 성공 시)
    // 🔧 FIX: Zustand persist 미들웨어가 감지하는 auth-storage 키에 직접 저장
    // 이전: localStorage.setItem('admin_mode', 'true') - 레거시 키 직접 설정 (❌ Zustand와 동기화 안 됨)
    // 이후: auth-storage 키에 adminMode: true 설정 (✅ Zustand persist 미들웨어 자동 동기화)
    await page.evaluate(() => {
      // Zustand persist 미들웨어의 auth-storage 키에 adminMode: true 설정
      const existingAuth = localStorage.getItem('auth-storage');
      let authState: any = { state: {}, version: 0 };

      if (existingAuth) {
        try {
          authState = JSON.parse(existingAuth);
        } catch (e) {
          console.warn(
            '⚠️ [Admin Helper] 기존 auth-storage 파싱 실패, 새로 생성'
          );
        }
      }

      // adminMode를 true로 설정
      authState.state = {
        ...authState.state,
        adminMode: true,
        authType: authState.state?.authType || 'guest',
        sessionId:
          authState.state?.sessionId ||
          `guest_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`,
        user: authState.state?.user || {
          id: authState.state?.sessionId || `guest_${Date.now()}`,
          name: '게스트 사용자',
          email: `guest_${Date.now()}@example.com`,
        },
      };

      localStorage.setItem('auth-storage', JSON.stringify(authState));
      console.log('✅ [Admin Helper] Zustand auth-storage adminMode 설정 완료');
    });

    // 테스트 모드 쿠키 설정 (Middleware 우회용)
    // 🔧 FIX: domain 대신 url 사용으로 쿠키 전송 보장
    const currentUrl = page.url();
    const cookieOrigin = new URL(currentUrl).origin;

    await page.context().addCookies([
      {
        name: 'test_mode',
        value: 'enabled',
        url: cookieOrigin,
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'vercel_test_token',
        value: authResponse.accessToken || 'test-mode-active',
        url: cookieOrigin,
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);

    console.log('✅ [Admin Helper] 테스트 모드 쿠키 설정 완료');

    // 4단계: 테스트 모드 헤더 설정 (쿠키보다 확실한 방법)
    await page.setExtraHTTPHeaders({
      'X-Test-Mode': 'enabled',
      'X-Test-Token': authResponse.accessToken || 'test-mode-active',
      'User-Agent': 'Playwright Test Agent',
    });

    console.log('✅ [Admin Helper] 테스트 모드 헤더 설정 완료');

    // 5단계: 페이지 새로고침하여 헤더가 적용되도록 함 (React 하이드레이션 완료까지 대기)
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // React 하이드레이션 여유 시간 증가 (1초 → 2초)

    // 🔧 FIX: Zustand 스토어 상태 검증 (레거시 키 대신)
    const isAdminActive = await page.evaluate(() => {
      // Zustand persist 미들웨어가 저장한 auth-storage 키에서 adminMode 확인
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) return false;

      try {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.adminMode === true;
      } catch {
        return false;
      }
    });

    if (!isAdminActive) {
      throw new Error('Zustand auth-storage adminMode 설정 실패');
    }

    console.log(
      '✅ [Admin Helper] 관리자 모드 활성화 완료:',
      authResponse.mode
    );

    return authResponse;
  } catch (error) {
    console.error('❌ [Admin Helper] 관리자 모드 활성화 실패:', error);
    throw error;
  }
}

/**
 * 🎯 관리자 대시보드로 직접 이동
 *
 * @param page - Playwright Page 객체
 * @param autoActivate - 관리자 모드 자동 활성화 여부
 */
export async function navigateToAdminDashboard(
  page: Page,
  autoActivate: boolean = true
): Promise<void> {
  try {
    console.log('🎯 [Admin Helper] 관리자 대시보드 이동 시작');

    if (autoActivate) {
      await activateAdminMode(page);
    }

    // 🔍 요청 인터셉션: 쿠키 전송 확인
    let requestHeaders: Record<string, string> = {};
    await page.route('**/dashboard**', async (route) => {
      const request = route.request();
      requestHeaders = request.headers();

      console.log('🔍 [Request Intercept] /dashboard 요청 헤더:', {
        cookie: requestHeaders['cookie'] || '❌ Cookie 헤더 없음',
        'x-test-mode': requestHeaders['x-test-mode'],
        'user-agent': requestHeaders['user-agent'],
      });

      await route.continue();
    });

    // 대시보드로 이동
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // 디버깅: 실제 URL과 쿠키 확인
    const actualUrl = page.url();
    const cookies = await page.context().cookies();
    const testModeCookies = cookies.filter(
      (c) => c.name === 'test_mode' || c.name === 'vercel_test_token'
    );

    console.log('🔍 [Admin Helper] 대시보드 이동 후 상태:', {
      actualUrl,
      testModeCookies: testModeCookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
      })),
      requestCookieHeader:
        requestHeaders['cookie'] || '❌ 요청에 Cookie 헤더 없음',
    });

    // 대시보드 로딩 완료 대기 (React 하이드레이션 고려)
    await page.waitForSelector(
      '[data-testid="dashboard-container"], .dashboard, main',
      {
        timeout: TIMEOUTS.DASHBOARD_LOAD,
      }
    );
  } catch (error) {
    console.error('❌ [Admin Helper] 관리자 대시보드 이동 실패:', error);
    throw error;
  }
}

/**
 * 🧹 관리자 상태 초기화
 *
 * @param page - Playwright Page 객체
 */
export async function resetAdminState(page: Page): Promise<void> {
  try {
    console.log('🧹 [Admin Helper] 관리자 상태 초기화 시작');

    await ensurePageContext(page, '/');

    // 페이지가 로드되어 있지 않으면 먼저 로드
    try {
      const currentUrl = page.url();
      if (!currentUrl || currentUrl === 'about:blank') {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
      }
    } catch (error) {
      console.warn('⚠️ 페이지 로드 중 오류 (무시):', error);
      // 재시도: 페이지를 명시적으로 로드
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }

    await page.evaluate(() => {
      // localStorage 정리
      try {
        localStorage.removeItem('admin_mode');
        localStorage.removeItem('admin_failed_attempts');
        localStorage.removeItem('admin_lock_end_time');
        localStorage.removeItem('unified-admin-storage');
        localStorage.removeItem('test_mode_enabled');
        localStorage.removeItem('auth_type');
        localStorage.removeItem('auth_user');

        console.log('🧹 localStorage 정리 완료');
      } catch (error) {
        console.warn('localStorage 정리 중 오류:', error);
      }
    });

    // 테스트 모드 쿠키 정리
    await page.context().clearCookies();
    console.log('🧹 테스트 모드 쿠키 정리 완료');

    // HTTP 헤더 정리 (재설정)
    await page.setExtraHTTPHeaders({});
    console.log('🧹 테스트 모드 헤더 정리 완료');

    console.log('✅ [Admin Helper] 관리자 상태 초기화 완료');
  } catch (error) {
    console.error('❌ [Admin Helper] 관리자 상태 초기화 실패:', error);
    throw error;
  }
}

/**
 * 🎭 게스트 로그인 보장
 *
 * @param page - Playwright Page 객체
 */
export async function ensureGuestLogin(page: Page): Promise<void> {
  try {
    await ensurePageContext(page);

    // 현재 인증 상태 확인
    const authState = await page.evaluate(() => {
      try {
        return {
          authType: localStorage.getItem('auth_type'),
          authUser: localStorage.getItem('auth_user'),
          testModeEnabled: localStorage.getItem('test_mode_enabled'),
        };
      } catch (error) {
        console.warn('⚠️ localStorage 접근 실패 (무시 가능):', error);
        return {
          authType: null,
          authUser: null,
          testModeEnabled: null,
        };
      }
    });

    if (authState.testModeEnabled === 'true' && authState.authType) {
      console.log(
        '✅ [Admin Helper] 이미 테스트 모드 활성화됨:',
        authState.authType
      );
      return;
    }

    console.log('🎭 [Admin Helper] 게스트 로그인 시작 (API 직접 호출)');

    // 🔧 FIX: page.evaluate() 사용으로 browser context에서 fetch 실행
    // 이유: page.context().request는 Vercel deployment protection에서 403 반환
    //       browser context fetch는 same-origin이므로 정상 동작
    const testSecretKey =
      process.env.TEST_SECRET_KEY || 'test-secret-key-please-change-in-env';
    const vercelBypassSecret =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';

    // 🔍 네트워크 요청 로깅: 바이패스 헤더 전송 검증
    const capturedHeaders: Record<string, string> = {};
    page.on('request', (request) => {
      if (request.url().includes('/api/test/vercel-test-auth')) {
        const headers = request.headers();
        Object.assign(capturedHeaders, headers);
      }
    });

    const result = await page.evaluate(
      async (params) => {
        const { secretKey, bypassSecret } = params;

        try {
          const response = await fetch('/api/test/vercel-test-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Playwright Test Agent',
              'x-vercel-protection-bypass': bypassSecret,
            },
            body: JSON.stringify({
              secret: secretKey,
              mode: 'guest',
              bypass: false,
            }),
          });

          // Handle non-JSON responses (403 HTML from Vercel SSO Protection)
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            return {
              success: false,
              status: response.status,
              error: 'NON_JSON_RESPONSE',
              message: `Received ${contentType} instead of JSON (status ${response.status})`,
            };
          }

          const data = await response.json();
          return { ...data, status: response.status };
        } catch (error) {
          return {
            success: false,
            error: 'FETCH_ERROR',
            message: error.message,
            status: 0,
          };
        }
      },
      { secretKey: testSecretKey, bypassSecret: vercelBypassSecret }
    );

    // 🔍 File-based logging to replace console.log (Playwright doesn't capture console.log)
    const headerLogPath = `/tmp/network-headers-${Date.now()}.json`;
    await fs.writeFile(
      headerLogPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          capturedHeaders,
          expectedBypassSecret: vercelBypassSecret,
          diagnostics: {
            hasHeader: 'x-vercel-protection-bypass' in capturedHeaders,
            headerValue:
              capturedHeaders['x-vercel-protection-bypass'] || 'NOT FOUND',
            matchStatus:
              capturedHeaders['x-vercel-protection-bypass'] ===
              vercelBypassSecret,
          },
        },
        null,
        2
      )
    );
    console.log(`🔍 [Network Inspector] Headers logged to: ${headerLogPath}`);

    if (!result.success) {
      throw new Error(`게스트 로그인 API 실패: ${result.message}`);
    }

    // localStorage 및 쿠키 설정
    await page.evaluate((authData: any) => {
      if (authData.sessionData) {
        localStorage.setItem('auth_type', authData.sessionData.authType);
        localStorage.setItem('auth_user', 'guest');
        localStorage.setItem('test_mode_enabled', 'true');
      }
    }, result);

    // 테스트 모드 쿠키 설정 (Middleware 우회용)
    // 🔧 FIX: domain 대신 url 사용으로 쿠키 전송 보장
    const currentUrl = page.url();
    const cookieUrl = new URL(currentUrl).origin;

    await page.context().addCookies([
      {
        name: 'test_mode',
        value: 'enabled',
        url: cookieUrl,
        httpOnly: false,
        sameSite: 'Lax', // 같은 사이트 내 네비게이션에는 Lax가 적합
      },
      {
        name: 'vercel_test_token',
        value: result.accessToken || 'test-mode-active',
        url: cookieUrl,
        httpOnly: false, // middleware가 읽을 수 있도록 false로 변경
        sameSite: 'Lax', // 같은 사이트 내 네비게이션에는 Lax가 적합
      },
    ]);

    console.log('✅ [Admin Helper] 게스트 로그인 완료 (API 기반 + 쿠키 설정)');
  } catch (error) {
    console.error('❌ [Admin Helper] 게스트 로그인 실패:', error);
    throw error;
  }
}

/**
 * 📊 관리자 상태 검증
 *
 * @param page - Playwright Page 객체
 * @returns 관리자 모드 활성화 여부
 */
export async function verifyAdminState(page: Page): Promise<boolean> {
  try {
    const adminState = await page.evaluate(() => {
      const localStorage_admin = localStorage.getItem('admin_mode') === 'true';
      const zustand_storage = localStorage.getItem('unified-admin-storage');

      let zustand_admin = false;
      if (zustand_storage) {
        try {
          const parsed = JSON.parse(zustand_storage);
          zustand_admin = parsed.state?.adminMode?.isAuthenticated === true;
        } catch {
          zustand_admin = false;
        }
      }

      return {
        localStorage: localStorage_admin,
        zustand: zustand_admin,
        combined: localStorage_admin || zustand_admin,
      };
    });

    console.log('📊 [Admin Helper] 관리자 상태 검증:', adminState);

    return adminState.combined;
  } catch (error) {
    console.error('❌ [Admin Helper] 관리자 상태 검증 실패:', error);
    return false;
  }
}

/**
 * 🔒 보안 테스트 토큰 생성
 *
 * @param page - Playwright Page 객체
 * @returns 보안 테스트 토큰
 */
async function generateSecureTestToken(page: Page): Promise<string> {
  await ensurePageContext(page);
  // 환경 변수에서 토큰 확인 또는 동적 생성
  const envToken = await page.evaluate(() => {
    // 개발 환경에서만 사용 가능한 동적 토큰 생성
    return `test_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  });

  console.log('🔒 [Admin Helper] 보안 토큰 생성됨');
  return envToken;
}

/**
 * 🔍 보안 강화된 테스트 API 상태 확인
 *
 * @param page - Playwright Page 객체
 * @returns API 사용 가능 여부
 */
export async function checkTestApiAvailability(page: Page): Promise<boolean> {
  try {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/test/admin-auth', {
        headers: {
          'User-Agent': 'Playwright Test Agent',
        },
      });
      return {
        status: res.status,
        data: await res.json(),
      };
    });

    const isAvailable = response.status === 200 && response.data.available;
    console.log('🔍 [Admin Helper] 보안 강화된 테스트 API 상태:', {
      available: isAvailable,
      environment: response.data.environment,
    });

    return isAvailable;
  } catch (error) {
    console.warn('⚠️ [Admin Helper] 테스트 API 확인 실패:', error);
    return false;
  }
}

/**
 * 🛡️ 보안 검증 로그
 */
export function logSecurityCheck(action: string, result: boolean): void {
  const timestamp = new Date().toISOString();
  console.log(
    `🛡️ [Security] ${timestamp} - ${action}: ${result ? '✅ 통과' : '❌ 차단'}`
  );
}
