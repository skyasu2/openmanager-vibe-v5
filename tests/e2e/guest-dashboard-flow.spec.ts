import { test, expect } from '@playwright/test';
import { guestLogin, resetGuestState } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

test.describe('🧭 게스트 대시보드 핵심 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await resetGuestState(page);
  });

  test('시스템 시작 없이도 게스트가 대시보드에 접근할 수 있다', async ({
    page,
  }) => {
    await guestLogin(page);
    console.log('✅ 게스트 로그인 완료');

    const startButtonSelectors = [
      'button:has-text("🚀 시스템 시작")',
      'button:has-text("시스템 시작")',
      '[data-testid="start-system"]',
    ];

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
      console.log('ℹ️ 시스템 시작 버튼이 없어 이미 가동 중으로 간주합니다.');
    }

    await page.waitForURL('**/dashboard**', {
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });
    await expect(
      page.locator(
        '[data-testid="dashboard-container"], main:has-text("Dashboard")'
      )
    ).toBeVisible({
      timeout: TIMEOUTS.DASHBOARD_LOAD,
    });

    const cardCount = await page.locator('[data-testid="server-card"]').count();
    console.log(`📊 대시보드 카드 수: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('프로필 드롭다운에는 관리자 관련 항목이 없어야 한다', async ({
    page,
  }) => {
    await guestLogin(page);

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
});
