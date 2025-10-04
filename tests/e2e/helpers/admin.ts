import { Page, expect } from '@playwright/test';

/**
 * Playwright 테스트용 관리자 모드 헬퍼 함수들
 * 
 * 🎯 목적: 관리자 모드 테스트 자동화 및 효율성 극대화
 * ⚡ 효과: 기존 4단계 UI 흐름 → 1회 API 호출로 단축 (10-15초 → 2-3초)
 */

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  mode?: 'test_bypass' | 'password_auth';
  adminMode?: boolean;
  timestamp?: string;
  error?: string;
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
  // 프로덕션 환경에서는 password 모드 강제
  const pageUrl = page.url();
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || process.env.VERCEL_PRODUCTION_URL || 'http://localhost:3000';
  const isProduction = pageUrl.includes('vercel.app') || baseUrl.includes('vercel.app');

  // 프로덕션(Vercel)에서는 항상 password, 로컬에서만 bypass 허용
  const defaultMethod = isProduction ? 'password' : 'bypass';

  const {
    method = defaultMethod,
    password = '4231',
    skipGuestLogin = false,
    testToken
  } = options;

  try {
    console.log('🧪 [Admin Helper] 관리자 모드 활성화 시작:', {
      method,
      skipGuestLogin,
      pageUrl,
      baseUrl,
      isProduction
    });

    // 1단계: 게스트 로그인 (필요한 경우만)
    if (!skipGuestLogin) {
      await ensureGuestLogin(page);
    }

    // 2단계: 보안 토큰 생성 및 검증
    const secureToken = testToken || await generateSecureTestToken(page);
    
    // 3단계: 보안 강화된 API 호출
    const authResponse = await page.evaluate(async (authData) => {
      const { method, password, token } = authData;
      
      const response = await fetch('/api/test/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Playwright Test Agent'
        },
        body: JSON.stringify(
          method === 'bypass' 
            ? { bypass: true, token }
            : { password, token }
        )
      });
      
      const result = await response.json();
      return { ...result, status: response.status };
    }, { method, password, token: secureToken });

    if (!authResponse.success) {
      throw new Error(`관리자 인증 실패: ${authResponse.message}`);
    }

    // 3단계: localStorage 및 쿠키 설정 (API 성공 시)
    await page.evaluate(() => {
      localStorage.setItem('admin_mode', 'true');
      console.log('✅ [Admin Helper] localStorage admin_mode 설정 완료');
    });

    // 테스트 모드 쿠키 설정 (Middleware 우회용)
    // 실제 페이지 URL의 origin 사용 (도메인 불일치 방지)
    const currentUrl = new URL(page.url());
    const isSecure = currentUrl.protocol === 'https:';

    await page.context().addCookies([
      {
        name: 'test_mode',
        value: 'enabled',
        domain: currentUrl.hostname,
        path: '/',
        httpOnly: false,
        secure: isSecure,
        sameSite: 'Lax'  // 같은 사이트 내 네비게이션에는 Lax가 적합
      },
      {
        name: 'vercel_test_token',
        value: authResponse.accessToken || 'test-mode-active',
        domain: currentUrl.hostname,
        path: '/',
        httpOnly: false,  // middleware가 읽을 수 있도록 false로 변경
        secure: isSecure,
        sameSite: 'Lax'  // 같은 사이트 내 네비게이션에는 Lax가 적합
      }
    ]);

    console.log('✅ [Admin Helper] 테스트 모드 쿠키 설정 완료');

    // 4단계: 테스트 모드 헤더 설정 (쿠키보다 확실한 방법)
    await page.setExtraHTTPHeaders({
      'X-Test-Mode': 'enabled',
      'X-Test-Token': authResponse.accessToken || 'test-mode-active',
      'User-Agent': 'Playwright Test Agent'
    });

    console.log('✅ [Admin Helper] 테스트 모드 헤더 설정 완료');

    // 5단계: 페이지 새로고침하여 헤더가 적용되도록 함
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500); // 상태 동기화 대기
    
    const isAdminActive = await page.evaluate(() => {
      return localStorage.getItem('admin_mode') === 'true';
    });

    if (!isAdminActive) {
      throw new Error('localStorage admin_mode 설정 실패');
    }

    console.log('✅ [Admin Helper] 관리자 모드 활성화 완료:', authResponse.mode);
    
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
        'user-agent': requestHeaders['user-agent']
      });
      
      await route.continue();
    });

    // 대시보드로 이동
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // 디버깅: 실제 URL과 쿠키 확인
    const actualUrl = page.url();
    const cookies = await page.context().cookies();
    const testModeCookies = cookies.filter(c => c.name === 'test_mode' || c.name === 'vercel_test_token');

    console.log('🔍 [Admin Helper] 대시보드 이동 후 상태:', {
      actualUrl,
      testModeCookies: testModeCookies.map(c => ({ name: c.name, value: c.value, domain: c.domain })),
      requestCookieHeader: requestHeaders['cookie'] || '❌ 요청에 Cookie 헤더 없음'
    });

    // 대시보드 로딩 완료 대기
    await page.waitForSelector('[data-testid="dashboard-container"], .dashboard, main', {
      timeout: 10000
    });

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

    // 페이지가 로드되어 있지 않으면 먼저 로드
    try {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    } catch {
      // 이미 페이지가 로드되어 있는 경우 무시
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
    // 현재 인증 상태 확인
    const authState = await page.evaluate(() => ({
      authType: localStorage.getItem('auth_type'),
      authUser: localStorage.getItem('auth_user'),
      testModeEnabled: localStorage.getItem('test_mode_enabled')
    }));

    if (authState.testModeEnabled === 'true' && authState.authType) {
      console.log('✅ [Admin Helper] 이미 테스트 모드 활성화됨:', authState.authType);
      return;
    }

    console.log('🎭 [Admin Helper] 게스트 로그인 시작 (API 직접 호출)');

    // 테스트 모드 API 직접 호출 - 실제 페이지 URL의 origin 사용 (도메인 일치)
    const currentUrl = new URL(page.url());
    const cookieUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    const testSecretKey = process.env.TEST_SECRET_KEY || 'test-secret-key-please-change-in-env';

    const response = await page.context().request.post(`${cookieUrl}/api/test/vercel-test-auth`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Playwright Test Agent'
      },
      data: {
        secret: testSecretKey,
        mode: 'guest',
        bypass: false
      }
    });

    const result = await response.json();

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
    // domain, path 명시적 설정으로 쿠키 전달 보장
    const isSecure = currentUrl.protocol === 'https:';

    await page.context().addCookies([
      {
        name: 'test_mode',
        value: 'enabled',
        domain: currentUrl.hostname,
        path: '/',
        httpOnly: false,
        secure: isSecure,
        sameSite: 'Lax'  // 같은 사이트 내 네비게이션에는 Lax가 적합
      },
      {
        name: 'vercel_test_token',
        value: result.accessToken || 'test-mode-active',
        domain: currentUrl.hostname,
        path: '/',
        httpOnly: false,  // middleware가 읽을 수 있도록 false로 변경
        secure: isSecure,
        sameSite: 'Lax'  // 같은 사이트 내 네비게이션에는 Lax가 적합
      }
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
        combined: localStorage_admin || zustand_admin
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
          'User-Agent': 'Playwright Test Agent'
        }
      });
      return {
        status: res.status,
        data: await res.json()
      };
    });

    const isAvailable = response.status === 200 && response.data.available;
    console.log('🔍 [Admin Helper] 보안 강화된 테스트 API 상태:', { 
      available: isAvailable, 
      environment: response.data.environment 
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
  console.log(`🛡️ [Security] ${timestamp} - ${action}: ${result ? '✅ 통과' : '❌ 차단'}`);
}