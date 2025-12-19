import { expect, test } from '@playwright/test';
import { getEnvironmentInfo } from './helpers/config';
import { guestLogin, openAiSidebar, resetGuestState } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

const env = getEnvironmentInfo();
const landingPath = process.env.GUEST_FLOW_LANDING_PATH || env.baseUrl;
const skipSystemStart = process.env.GUEST_FLOW_SKIP_SYSTEM_START === 'true';
const forceSystemStart = process.env.GUEST_FLOW_FORCE_SYSTEM_START === 'true';
const headlessMode =
  process.env.CI === 'true' || process.env.PLAYWRIGHT_HEADLESS === 'true';
const shouldClickSystemStart =
  forceSystemStart || (!skipSystemStart && env.isLocal);

test.describe('🧭 게스트 대시보드 핵심 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await resetGuestState(page);
  });

  test('시스템 시작 없이도 게스트가 대시보드에 접근할 수 있다', async ({
    page,
  }) => {
    await guestLogin(page, { landingPath });
    console.log('✅ 게스트 로그인 완료');

    const startButtonSelectors = [
      'button:has-text("🚀 시스템 시작")',
      'button:has-text("시스템 시작")',
      '[data-testid="start-system"]',
    ];

    if (shouldClickSystemStart) {
      let startButtonClicked = false;
      for (const selector of startButtonSelectors) {
        const button = page.locator(selector).first();
        const isVisible = await button
          .isVisible({ timeout: TIMEOUTS.MODAL_DISPLAY })
          .catch(() => false);
        if (isVisible) {
          await button.click();
          startButtonClicked = true;
          console.log(`✅ 시스템 시작 버튼 클릭: ${selector}`);
          break;
        }
      }

      if (!startButtonClicked) {
        if (forceSystemStart) {
          throw new Error(
            '시스템 시작 버튼을 강제로 클릭해야 하지만 찾지 못했습니다.'
          );
        }
        console.log('ℹ️ 시스템 시작 버튼이 없어 이미 가동 중으로 간주합니다.');
      }
    } else {
      console.log('ℹ️ 환경 설정에 따라 시스템 시작 단계는 건너뜁니다.');
      // 시스템이 이미 실행 중인 환경(프로덕션)에서는 직접 대시보드로 이동
      await page.goto('/dashboard');
    }

    await page.waitForURL(/\/(dashboard|main)/, {
      timeout: 45000, // 30초 → 45초 증가
    });
    // Dashboard container: look for dashboard-specific content (Resource Overview heading or DEMO MODE text)
    await expect(
      page.locator('h3:has-text("Resource Overview")').first()
    ).toBeVisible({
      timeout: TIMEOUTS.DASHBOARD_LOAD,
    });

    // Server cards don't have data-testid; use h3 headings with server names (APP-xx pattern)
    // 서버 카드는 비동기로 로드되므로 최소 1개가 나타날 때까지 대기
    const serverCardLocator = page.locator('h3:has-text("APP-")').first();
    await serverCardLocator.waitFor({
      state: 'visible',
      timeout: TIMEOUTS.NETWORK_REQUEST, // 30초 - API 응답 대기
    });

    const cardCount = await page.locator('h3:has-text("APP-")').count();
    console.log(`📊 대시보드 카드 수: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('프로필 드롭다운에는 관리자 관련 항목이 없어야 한다', async ({
    page,
  }) => {
    await guestLogin(page, { landingPath });

    const profileButton = page
      .locator('button[aria-label="프로필 메뉴"], button:has-text("게스트")')
      .first();
    await profileButton.waitFor({ state: 'visible' });
    await profileButton.click();

    const adminMenuItems = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /관리자 모드|관리자 페이지|Admin Mode/i });
    expect(await adminMenuItems.count()).toBe(0);

    const logoutMenu = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /게스트 세션 종료|로그아웃/i });
    await expect(logoutMenu.first()).toBeVisible();
  });

  test('AI 토글 버튼으로 사이드바를 열 수 있다', async ({ page }) => {
    await guestLogin(page, { landingPath });
    if (headlessMode) {
      console.log('ℹ️ Headless 환경에서 AI 토글 확인 중...');
    }
    const sidebar = await openAiSidebar(page, {
      waitTimeout: 15000, // 10초 → 15초 증가
    });
    await expect(sidebar).toBeVisible();
    console.log('✅ AI 사이드바 토글 및 렌더링 확인');
  });
});
