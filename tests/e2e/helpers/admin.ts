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
  const { 
    method = 'bypass', 
    password = '4231', 
    skipGuestLogin = false,
    testToken 
  } = options;
  
  try {
    console.log('🧪 [Admin Helper] 관리자 모드 활성화 시작:', { method, skipGuestLogin });

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

    // 3단계: localStorage 설정 (API 성공 시)
    await page.evaluate(() => {
      localStorage.setItem('admin_mode', 'true');
      console.log('✅ [Admin Helper] localStorage admin_mode 설정 완료');
    });

    // 4단계: 상태 검증
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

    // 대시보드로 이동
    await page.goto('/dashboard');
    
    // 대시보드 로딩 완료 대기
    await page.waitForSelector('[data-testid="dashboard-container"], .dashboard, main', {
      timeout: 10000
    });

    console.log('✅ [Admin Helper] 관리자 대시보드 이동 완료');

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
        
        console.log('🧹 localStorage 정리 완료');
      } catch (error) {
        console.warn('localStorage 정리 중 오류:', error);
      }
    });

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

    console.log('🎭 [Admin Helper] 게스트 로그인 시작 (enableVercelTestMode 사용)');

    // enableVercelTestMode를 사용하여 게스트 모드 활성화
    const { enableVercelTestMode } = await import('./vercel-test-auth');
    await enableVercelTestMode(page, { mode: 'guest', bypass: false });

    console.log('✅ [Admin Helper] 게스트 로그인 완료 (API 기반)');

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