/**
 * 🎨 Visual Regression Testing 데모
 *
 * @description Playwright 스크린샷 기능을 사용한 시각적 회귀 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { test, expect } from '@playwright/test';

test.describe('📸 대시보드 시각적 회귀 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 대시보드 페이지로 이동
    await page.goto('/');
  });

  test('전체 페이지 스크린샷', async ({ page }) => {
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // 전체 페이지 스크린샷
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      animations: 'disabled', // 애니메이션 비활성화로 일관성 확보
    });
  });

  test('뷰포트 스크린샷', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 현재 뷰포트만 스크린샷
    await expect(page).toHaveScreenshot('dashboard-viewport.png', {
      fullPage: false,
    });
  });

  test('특정 요소 스크린샷', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 특정 컴포넌트만 스크린샷
    const header = page.locator('header').first();
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('dashboard-header.png');
    }
  });

  test('다크 모드 스크린샷', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 다크 모드 활성화 (실제 구현에 따라 다름)
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('모바일 뷰포트 스크린샷', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
    });
  });

  test('태블릿 뷰포트 스크린샷', async ({ page }) => {
    // 태블릿 뷰포트로 설정
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
    });
  });

  test('호버 상태 스크린샷', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 버튼에 호버
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.hover();

      await expect(button).toHaveScreenshot('button-hover.png');
    }
  });

  test('스크롤 후 스크린샷', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 페이지 중간으로 스크롤
    await page.evaluate(() => window.scrollTo(0, window.innerHeight / 2));

    await expect(page).toHaveScreenshot('dashboard-scrolled.png', {
      fullPage: false,
    });
  });
});

test.describe('🎯 컴포넌트별 시각적 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('네비게이션 바', async ({ page }) => {
    const nav = page.locator('nav').first();

    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot('component-nav.png', {
        animations: 'disabled',
      });
    }
  });

  test('사이드바', async ({ page }) => {
    const sidebar = page.locator('[role="complementary"]').first();

    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('component-sidebar.png');
    }
  });

  test('메인 콘텐츠 영역', async ({ page }) => {
    const main = page.locator('main').first();

    if (await main.isVisible()) {
      await expect(main).toHaveScreenshot('component-main.png');
    }
  });
});

test.describe('📱 반응형 디자인 테스트', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`${viewport.name} 뷰포트 (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(
        `dashboard-${viewport.name.toLowerCase()}-${viewport.width}x${viewport.height}.png`,
        {
          fullPage: true,
          animations: 'disabled',
        }
      );
    });
  }
});

test.describe('🔄 인터랙션 후 시각적 변화', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('버튼 클릭 후 상태 변화', async ({ page }) => {
    const button = page.locator('button').first();

    if (await button.isVisible()) {
      // 클릭 전 - 페이지 전체 스크린샷
      await expect(page).toHaveScreenshot('page-before-button-click.png', {
        fullPage: false,
      });

      // 클릭
      await button.click();
      await page.waitForTimeout(1000); // 애니메이션 및 상태 변화 대기

      // 클릭 후 - 페이지 전체 스크린샷
      await expect(page).toHaveScreenshot('page-after-button-click.png', {
        fullPage: false,
      });
    }
  });

  test('모달 열기', async ({ page }) => {
    // 모달 트리거 버튼 찾기 (실제 구현에 따라 다름)
    const modalButton = page.locator('button:has-text("열기")').first();

    if (await modalButton.isVisible()) {
      await modalButton.click();
      await page.waitForTimeout(300); // 모달 애니메이션 대기

      // 모달이 열린 전체 페이지 스크린샷
      await expect(page).toHaveScreenshot('modal-opened.png', {
        fullPage: true,
      });
    }
  });
});

test.describe('🎨 테마 변경 테스트', () => {
  test('라이트 테마', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('theme-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('다크 테마', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('theme-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
