import { test, expect, Page } from '@playwright/test';
import { activateAdminMode, resetAdminState, verifyAdminState } from './helpers/admin';
import { TIMEOUTS } from './helpers/timeouts';
import { ensureVercelBypassCookie } from './helpers/security';

/**
 * Vercel 프로덕션: 게스트 + 관리자 모드 종합 점검
 *
 * 시나리오:
 * 1. 게스트 로그인
 * 2. PIN 4231 인증
 * 3. 대시보드 점검 (서버 모니터링)
 * 4. AI 어시스턴트 사이드바 점검
 *
 * 실행 방법:
 * ```bash
 * BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check
 * ```
 *
 * 주의사항:
 * - 프로덕션 환경에서 실행 시 타임아웃 1.5배 적용
 * - 네트워크 레이턴시 고려 (networkidle 대기 필수)
 * - Playwright 쿠키 전달 제약으로 /admin 직접 접근 불가 (수동 테스트 필요)
 */

// 환경 설정
const BASE_URL = process.env.BASE_URL || 'https://openmanager-vibe-v5.vercel.app';
const IS_VERCEL = BASE_URL.includes('vercel.app');

test.beforeEach(async ({ page }) => {
  await ensureVercelBypassCookie(page);
});

/**
 * 헬퍼: 대시보드 요소 검증
 */
async function verifyDashboard(page: Page): Promise<void> {
  console.log('📊 대시보드 요소 검증 시작');

  // 대시보드 페이지 로드 확인
  await page.waitForSelector('main, [data-testid="main-content"], .dashboard', {
    timeout: TIMEOUTS.DASHBOARD_LOAD * (IS_VERCEL ? 1.5 : 1)
  });

  // 스크린샷 캡처
  await page.screenshot({
    path: 'test-results/vercel-dashboard-loaded.png',
    fullPage: true
  });

  // 1. 서버 카드 렌더링 확인
  const serverCardSelectors = [
    '[data-testid^="server-card"]',
    '.server-card',
    '[class*="server"]'
  ];

  let serverCardFound = false;
  for (const selector of serverCardSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      console.log(`  ✅ 서버 카드 발견: ${selector} (${count}개)`);
      serverCardFound = true;
      break;
    }
  }

  if (!serverCardFound) {
    console.log('  ⚠️ 서버 카드 셀렉터로 찾지 못함, 텍스트 기반 검증 시도');
  }

  // 2. 모니터링 지표 확인 (텍스트 기반)
  const dashboardIndicators = [
    'Server', '서버',
    'CPU', 'Memory', 'Response',
    'Dashboard', '대시보드'
  ];

  let foundIndicators = 0;
  for (const indicator of dashboardIndicators) {
    const elements = page.locator(`text=${indicator}`);
    if (await elements.count() > 0) {
      foundIndicators++;
      console.log(`  ✅ 모니터링 지표 발견: ${indicator}`);
    }
  }

  console.log(`  📈 대시보드 지표 발견 비율: ${foundIndicators}/${dashboardIndicators.length}`);

  // 3. 최소 요구사항 검증
  expect(foundIndicators).toBeGreaterThan(0); // 최소 1개 이상 발견

  console.log('✅ 대시보드 요소 검증 완료');
}

/**
 * 헬퍼: AI 어시스턴트 사이드바 검증
 */
async function verifyAISidebar(page: Page): Promise<void> {
  console.log('🤖 AI 어시스턴트 사이드바 검증 시작');

  // 1. AI 사이드바 렌더링 확인
  const sidebarSelectors = [
    '[data-testid="ai-sidebar"]',
    '.ai-sidebar',
    '[class*="sidebar"]',
    '[id*="ai"]'
  ];

  let sidebarFound = false;
  for (const selector of sidebarSelectors) {
    const elements = page.locator(selector);
    if (await elements.count() > 0) {
      console.log(`  ✅ AI 사이드바 발견: ${selector}`);
      sidebarFound = true;

      // 스크린샷 캡처
      await page.screenshot({
        path: 'test-results/vercel-ai-sidebar-rendered.png',
        fullPage: true
      });
      break;
    }
  }

  if (!sidebarFound) {
    console.log('  ⚠️ AI 사이드바 셀렉터로 찾지 못함');
  }

  // 2. 입력 필드 확인
  const inputField = page.locator('input[type="text"], textarea').first();
  const inputVisible = await inputField.isVisible().catch(() => false);

  if (inputVisible) {
    console.log('  ✅ AI 입력 필드 발견');
  } else {
    console.log('  ⚠️ AI 입력 필드 미발견');
  }

  // 3. 전송 버튼 확인
  const sendButton = page.locator('button').filter({ hasText: /send|보내기|전송/i });
  const sendButtonCount = await sendButton.count();

  if (sendButtonCount > 0) {
    console.log(`  ✅ AI 전송 버튼 발견 (${sendButtonCount}개)`);
  } else {
    console.log('  ⚠️ AI 전송 버튼 미발견');
  }

  // 4. 최소 요구사항 검증
  expect(sidebarFound || inputVisible || sendButtonCount > 0).toBe(true);

  console.log('✅ AI 어시스턴트 사이드바 검증 완료');
}

/**
 * 헬퍼: AI 질의 기능 테스트 (선택적)
 */
async function testAIQuery(page: Page): Promise<void> {
  console.log('🔍 AI 질의 기능 테스트 시작');

  const inputField = page.locator('input[type="text"], textarea').first();
  const sendButton = page.locator('button').filter({ hasText: /send|보내기|전송/i }).first();

  if (!(await inputField.isVisible()) || !(await sendButton.isVisible())) {
    console.log('  ⚠️ AI 입력 UI 요소 미발견, 질의 테스트 스킵');
    return;
  }

  // 간단한 질의 전송
  const testMessage = "서버 상태 알려줘";
  await inputField.fill(testMessage);
  console.log(`  ✅ 메시지 입력: "${testMessage}"`);

  await page.screenshot({
    path: 'test-results/vercel-ai-before-send.png',
    fullPage: true
  });

  const startTime = Date.now();
  await sendButton.click();
  console.log('  ✅ 메시지 전송');

  // 응답 대기 (최대 30초)
  try {
    await page.waitForSelector('.message, [data-testid*="message"], [class*="response"]', {
      timeout: TIMEOUTS.NETWORK_REQUEST
    });
    const responseTime = Date.now() - startTime;
    console.log(`  ✅ AI 응답 수신 (${responseTime}ms)`);

    await page.screenshot({
      path: 'test-results/vercel-ai-after-response.png',
      fullPage: true
    });
  } catch (error) {
    console.log('  ⚠️ AI 응답 타임아웃 또는 미수신');
    await page.screenshot({
      path: 'test-results/vercel-ai-response-timeout.png',
      fullPage: true
    });
  }

  console.log('✅ AI 질의 기능 테스트 완료');
}

test.describe('🎯 Vercel 프로덕션: 게스트 + 관리자 모드 종합 점검', () => {

  test.beforeEach(async ({ page }) => {
    console.log('🧹 테스트 환경 초기화');
    await resetAdminState(page);
  });

  test.afterEach(async ({ page }) => {
    console.log('🧹 테스트 후 정리');
    await resetAdminState(page);
  });

  test('전체 시나리오: 게스트 로그인 → PIN 인증 → 대시보드 → AI 사이드바', async ({ page, context }) => {
    const testStartTime = Date.now();
    console.log('\n========================================');
    console.log('🎯 Vercel 프로덕션 종합 점검 시작');
    console.log(`📍 BASE_URL: ${BASE_URL}`);
    console.log(`📍 IS_VERCEL: ${IS_VERCEL}`);
    console.log('========================================\n');

    // 성능 메트릭
    const metrics = {
      guestLogin: 0,
      pinAuth: 0,
      dashboard: 0,
      aiSidebar: 0
    };

    // ========================================
    // Phase 1: 게스트 로그인
    // ========================================
    console.log('📍 Phase 1: 게스트 로그인');
    const step1Start = Date.now();

    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    const guestButton = page.locator('button:has-text("게스트로 체험하기"), button:has-text("체험")');
    await expect(guestButton.first()).toBeVisible({ timeout: TIMEOUTS.MODAL_DISPLAY });

    await guestButton.first().click();
    console.log('  ✅ 게스트 로그인 버튼 클릭');

    // /main 리다이렉트 대기
    await page.waitForURL(/\/main/, { timeout: TIMEOUTS.MODAL_DISPLAY * (IS_VERCEL ? 1.5 : 1) });
    await page.waitForLoadState('networkidle');

    // 게스트 로그인 상태 확인
    const authState = await page.evaluate(() => ({
      authType: localStorage.getItem('auth_type'),
      authUser: localStorage.getItem('auth_user')
    }));

    expect(authState.authType).toBe('guest');
    console.log('  ✅ 게스트 로그인 상태 확인');

    metrics.guestLogin = Date.now() - step1Start;
    console.log(`  ⏱️ Phase 1 소요 시간: ${metrics.guestLogin}ms\n`);

    // ========================================
    // Phase 2: PIN 4231 인증
    // ========================================
    console.log('📍 Phase 2: PIN 4231 인증');
    const step2Start = Date.now();

    try {
      // API 기반 관리자 모드 활성화
      const result = await activateAdminMode(page, {
        method: 'password',
        password: '4231',
        skipGuestLogin: true
      });

      expect(result.success).toBe(true);
      console.log('  ✅ PIN 인증 성공 (API)');

      // 관리자 상태 검증
      const isAdminActive = await verifyAdminState(page);
      expect(isAdminActive).toBe(true);
      console.log('  ✅ 관리자 모드 활성화 확인');

    } catch (error) {
      console.log('  ❌ PIN 인증 실패:', error.message);
      throw error;
    }

    metrics.pinAuth = Date.now() - step2Start;
    console.log(`  ⏱️ Phase 2 소요 시간: ${metrics.pinAuth}ms\n`);

    // ========================================
    // Phase 3: 대시보드 점검
    // ========================================
    console.log('📍 Phase 3: 대시보드 점검');
    const step3Start = Date.now();

    // 대시보드로 이동 (시스템 시작 버튼 또는 직접 접근)
    const systemStartButton = page.locator('button:has-text("시스템 시작"), button:has-text("Start System")');
    const buttonVisible = await systemStartButton.isVisible().catch(() => false);

    if (buttonVisible && await systemStartButton.isEnabled()) {
      console.log('  ✅ 시스템 시작 버튼 발견 및 활성화');
      await systemStartButton.click();
      await page.waitForTimeout(4000); // 카운트다운 대기
      console.log('  ✅ 시스템 시작 버튼 클릭');

      // system-boot 또는 dashboard로 이동 대기
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      if (currentUrl.includes('/system-boot')) {
        console.log('  ℹ️ system-boot 페이지 대기');
        await page.waitForTimeout(5000);
      }

      // 대시보드로 명시적 이동 (필요 시)
      if (!currentUrl.includes('/dashboard')) {
        console.log('  ℹ️ 대시보드로 직접 이동');
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle');
      }

    } else {
      console.log('  ℹ️ 시스템 시작 버튼 미발견, 대시보드 직접 접근');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
    }

    // 대시보드 요소 검증
    await verifyDashboard(page);

    metrics.dashboard = Date.now() - step3Start;
    console.log(`  ⏱️ Phase 3 소요 시간: ${metrics.dashboard}ms\n`);

    // ========================================
    // Phase 4: AI 어시스턴트 사이드바 점검
    // ========================================
    console.log('📍 Phase 4: AI 어시스턴트 사이드바 점검');
    const step4Start = Date.now();

    // AI 사이드바 검증
    await verifyAISidebar(page);

    // AI 질의 기능 테스트 (선택적)
    if (process.env.TEST_AI_QUERY === 'true') {
      await testAIQuery(page);
    } else {
      console.log('  ℹ️ AI 질의 테스트 스킵 (TEST_AI_QUERY=true로 활성화 가능)');
    }

    metrics.aiSidebar = Date.now() - step4Start;
    console.log(`  ⏱️ Phase 4 소요 시간: ${metrics.aiSidebar}ms\n`);

    // ========================================
    // 최종 리포트
    // ========================================
    const totalTime = Date.now() - testStartTime;

    console.log('\n========================================');
    console.log('📊 Vercel 프로덕션 종합 점검 완료');
    console.log('========================================');
    console.log(`  1. 게스트 로그인: ${metrics.guestLogin}ms`);
    console.log(`  2. PIN 인증: ${metrics.pinAuth}ms`);
    console.log(`  3. 대시보드 점검: ${metrics.dashboard}ms`);
    console.log(`  4. AI 사이드바 점검: ${metrics.aiSidebar}ms`);
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  📊 총 소요 시간: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}초)`);
    console.log('========================================\n');

    // 성능 기준 검증
    expect(totalTime).toBeLessThan(TIMEOUTS.FULL_USER_FLOW); // 2분 이내
    expect(metrics.guestLogin).toBeLessThan(TIMEOUTS.MODAL_DISPLAY * 2); // 20초 이내
    expect(metrics.pinAuth).toBeLessThan(TIMEOUTS.FORM_SUBMIT * 2); // 30초 이내

    console.log('🎉 Vercel 프로덕션 종합 점검 성공!');
  });

  test('대시보드 전용 점검 (빠른 검증)', async ({ page }) => {
    console.log('\n🚀 대시보드 전용 빠른 점검');

    // 게스트 + 관리자 모드
    await activateAdminMode(page, { method: 'password', password: '4231' });

    // 대시보드 직접 접근
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // 대시보드 검증
    await verifyDashboard(page);

    console.log('✅ 대시보드 전용 점검 완료');
  });

  test('AI 사이드바 전용 점검 (빠른 검증)', async ({ page }) => {
    console.log('\n🤖 AI 사이드바 전용 빠른 점검');

    // 게스트 + 관리자 모드
    await activateAdminMode(page, { method: 'password', password: '4231' });

    // 메인 또는 대시보드 접근
    await page.goto(`${BASE_URL}/main`);
    await page.waitForLoadState('networkidle');

    // AI 사이드바 검증
    await verifyAISidebar(page);

    console.log('✅ AI 사이드바 전용 점검 완료');
  });
});

/**
 * 추가 시나리오: 네트워크 지연 시뮬레이션
 */
test.describe('🌐 네트워크 지연 시뮬레이션 (프로덕션)', () => {

  test('네트워크 지연 환경에서 종합 플로우', async ({ page }) => {
    console.log('\n🌐 네트워크 지연 시뮬레이션 테스트');

    // 300ms 지연 추가
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.continue();
    });

    const startTime = Date.now();

    // 게스트 + 관리자 모드
    await activateAdminMode(page, { method: 'password', password: '4231' });

    // 대시보드 접근
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // 대시보드 검증
    await verifyDashboard(page);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`  ⏱️ 네트워크 지연 환경 소요 시간: ${duration}ms`);
    expect(duration).toBeLessThan(TIMEOUTS.FULL_USER_FLOW); // 2분 이내

    // 네트워크 지연 해제
    await page.unroute('**/*');

    console.log('✅ 네트워크 지연 환경 테스트 완료');
  });
});
