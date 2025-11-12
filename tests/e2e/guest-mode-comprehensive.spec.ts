import { test, expect, Page } from '@playwright/test';
import { TIMEOUTS } from './helpers/timeouts';
import { ensureVercelBypassCookie } from './helpers/security';

async function resetGuestState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.context().clearPermissions();
  await page.goto('about:blank');
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  } catch {
    // ignore navigation issues
  }
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * 🎯 게스트 모드 종합 플로우 테스트 (관리자 모드 제거 버전)
 *
 * 검증 시나리오:
 * 1. 로그인 페이지 접속 후 "게스트로 체험하기" 버튼 클릭
 * 2. 메인 페이지 UI가 정상적으로 렌더링되는지 확인
 * 3. 별도 관리자 인증 없이 시스템 시작 버튼을 사용해 대시보드 진입
 */
test.describe('🎯 게스트 모드 종합 플로우 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await resetGuestState(page);
    await ensureVercelBypassCookie(page);
  });

  test.afterEach(async ({ page }) => {
    await resetGuestState(page);
  });

  test('게스트 로그인만으로 시스템 시작 및 대시보드 접근', async ({ page }) => {
    const metrics = {
      loginPage: 0,
      guestLogin: 0,
      mainPage: 0,
      systemControl: 0,
      dashboard: 0,
    };

    const startedAt = Date.now();

    // 1. 로그인 페이지 접속
    const loginStart = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveTitle(/OpenManager/i);
    metrics.loginPage = Date.now() - loginStart;

    // 2. 게스트 로그인 버튼 클릭
    const guestStart = Date.now();
    await page.locator('button:has-text("게스트로 체험하기")').click();
    await page.waitForURL(/\/main/, { timeout: TIMEOUTS.MODAL_DISPLAY });
    await page.waitForSelector('main, header, [data-testid="main-content"]', {
      timeout: TIMEOUTS.MODAL_DISPLAY,
    });
    metrics.guestLogin = Date.now() - guestStart;

    // 3. 메인 페이지 구성 요소 확인
    const mainStart = Date.now();
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toContainText(/AI|서버/i, {
      timeout: TIMEOUTS.CLICK_RESPONSE,
    });
    metrics.mainPage = Date.now() - mainStart;

    // 4. 시스템 시작 버튼을 찾아 클릭 (관리자 모드 없이)
    const controlStart = Date.now();
    const startButtonSelectors = [
      'button:has-text("🚀 시스템 시작")',
      'button:has-text("시스템 시작")',
      '[data-testid="start-system"]',
    ];

    let startButton = null;
    for (const selector of startButtonSelectors) {
      const candidate = page.locator(selector).first();
      if ((await candidate.count()) > 0) {
        await expect(candidate).toBeVisible();
        startButton = candidate;
        break;
      }
    }

    expect(
      startButton,
      '시스템 시작 버튼을 찾을 수 있어야 합니다'
    ).not.toBeNull();
    await expect(startButton!).toBeEnabled();
    await startButton!.click();
    metrics.systemControl = Date.now() - controlStart;

    // 5. 대시보드 페이지 접근 확인
    const dashboardStart = Date.now();
    await page.waitForURL('**/dashboard**', {
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });
    const dashboardHeading = page.locator(
      'h1:has-text("Dashboard"), h1:has-text("대시보드"), [data-testid="dashboard-container"]'
    );
    await expect(dashboardHeading.first()).toBeVisible({
      timeout: TIMEOUTS.MODAL_DISPLAY,
    });
    metrics.dashboard = Date.now() - dashboardStart;

    const totalTime = Date.now() - startedAt;
    console.log('\n📊 게스트 플로우 성능 리포트');
    console.log(`   1. 로그인 페이지 로딩: ${metrics.loginPage}ms`);
    console.log(`   2. 게스트 로그인: ${metrics.guestLogin}ms`);
    console.log(`   3. 메인 페이지 렌더링: ${metrics.mainPage}ms`);
    console.log(`   4. 시스템 제어: ${metrics.systemControl}ms`);
    console.log(`   5. 대시보드 진입: ${metrics.dashboard}ms`);
    console.log(`   📊 전체 소요 시간: ${totalTime}ms`);

    expect(totalTime).toBeLessThan(30000);
    expect(metrics.systemControl).toBeLessThan(10000);
  });
});
