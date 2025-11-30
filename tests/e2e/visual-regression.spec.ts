import { expect, test } from '@playwright/test';
import { guestLogin, resetGuestState } from './helpers/guest';
import { ensureVercelBypassCookie } from './helpers/security';

test.describe('🖼️ 시각적 회귀 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await resetGuestState(page);
    await ensureVercelBypassCookie(page);
  });

  test.afterEach(async ({ page }) => {
    await resetGuestState(page);
  });

  test('메인 대시보드 스크린샷 비교', async ({ page }) => {
    await guestLogin(page);
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('dashboard-main.png', {
      fullPage: true,
      animations: 'disabled',
    });

    console.log('✅ 메인 대시보드 스크린샷 비교 완료');
  });

  test('서버 모니터링 카드 스크린샷', async ({ page }) => {
    await guestLogin(page);
    await page.waitForTimeout(2000);

    const serverSection = page
      .locator('[data-testid="servers-section"], .servers-grid, main')
      .first();
    if ((await serverSection.count()) > 0) {
      await expect(serverSection).toHaveScreenshot('server-cards.png', {
        animations: 'disabled',
      });
      console.log('✅ 서버 카드 스크린샷 비교 완료');
    }
  });

  test('AI 사이드바 스크린샷', async ({ page }) => {
    await guestLogin(page);

    const aiButton = page
      .locator('[data-testid="ai-assistant"], button:has-text("AI")')
      .first();
    if ((await aiButton.count()) > 0) {
      await aiButton.click();
      await page.waitForTimeout(1000);

      const sidebar = page
        .locator('[data-testid="ai-sidebar"], .ai-sidebar, aside')
        .first();
      if ((await sidebar.count()) > 0 && (await sidebar.isVisible())) {
        await expect(sidebar).toHaveScreenshot('ai-sidebar.png', {
          animations: 'disabled',
        });
        console.log('✅ AI 사이드바 스크린샷 비교 완료');
      }
    }
  });

  test('다크 모드 스크린샷 비교', async ({ page }) => {
    await guestLogin(page);

    const themeSelectors = [
      '[data-testid="theme-toggle"]',
      'button[aria-label*="테마"], button[aria-label*="theme"]',
      'button:has-text("다크"), button:has-text("Dark")',
      '.theme-toggle',
    ];

    let themeToggled = false;
    for (const selector of themeSelectors) {
      const themeButton = page.locator(selector).first();
      if ((await themeButton.count()) > 0 && (await themeButton.isVisible())) {
        await themeButton.click();
        await page.waitForTimeout(500);
        themeToggled = true;
        break;
      }
    }

    if (themeToggled) {
      await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
      });
      console.log('✅ 다크 모드 스크린샷 비교 완료');
    } else {
      console.log(
        'ℹ️ 테마 토글 버튼을 찾을 수 없어 다크 모드 테스트를 건너뜁니다.'
      );
    }
  });

  test('모바일 뷰 스크린샷', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await guestLogin(page);
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });

    console.log('✅ 모바일 뷰 스크린샷 비교 완료');
  });
});
