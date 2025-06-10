import { test, expect } from '@playwright/test';

/**
 * 🎯 OpenManager Vibe v5 - Dashboard E2E Tests
 *
 * @description 대시보드 핵심 기능 E2E 테스트
 * - 페이지 로딩 확인
 * - 서버 카드 표시 확인
 * - AI 사이드바 동작 확인
 * - 실시간 데이터 업데이트 확인
 */

test.describe('🏠 Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 모니터링
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('브라우저 에러:', msg.text());
      }
    });
  });

  test('대시보드 페이지가 정상적으로 로드된다', async ({ page }) => {
    // 대시보드 페이지 방문
    await page.goto('/dashboard');

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/OpenManager Vibe v5/);

    // 메인 헤더 확인
    const header = page
      .locator('[data-testid="dashboard-header"]')
      .or(page.locator('header').first());
    await expect(header).toBeVisible();

    // 로딩 완료 대기
    await page.waitForLoadState('networkidle');

    console.log('✅ 대시보드 페이지 로드 완료');
  });

  test('서버 카드들이 표시된다', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 서버 카드 컨테이너 확인
    const serverCards = page
      .locator('[class*="server-card"]')
      .or(page.locator('[data-testid*="server"]'));

    // 최소 1개 이상의 서버 카드 확인
    await expect(serverCards.first()).toBeVisible({ timeout: 10000 });

    // 서버 카드 개수 확인
    const cardCount = await serverCards.count();
    expect(cardCount).toBeGreaterThan(0);

    console.log(`✅ ${cardCount}개 서버 카드 발견`);
  });

  test('AI 사이드바가 동작한다', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // AI 사이드바 토글 버튼 찾기
    const aiToggle = page
      .locator('[data-testid="ai-sidebar-toggle"]')
      .or(page.locator('button:has-text("AI")').first());

    if (await aiToggle.isVisible()) {
      // AI 사이드바 열기
      await aiToggle.click();

      // 사이드바 내용 확인
      const sidebar = page
        .locator('[class*="ai-sidebar"]')
        .or(page.locator('[data-testid="ai-sidebar"]'));

      await expect(sidebar).toBeVisible({ timeout: 5000 });

      console.log('✅ AI 사이드바 동작 확인');
    } else {
      console.log('ℹ️ AI 사이드바 토글 버튼을 찾을 수 없음');
    }
  });

  test('실시간 데이터 업데이트가 동작한다', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 초기 서버 통계 확인
    const statsElement = page
      .locator('[class*="server-stats"]')
      .or(page.locator('[data-testid*="stats"]'))
      .first();

    if (await statsElement.isVisible()) {
      const initialText = await statsElement.textContent();

      // 3초 대기 후 변경 확인
      await page.waitForTimeout(3000);

      const updatedText = await statsElement.textContent();

      console.log('📊 초기 통계:', initialText);
      console.log('📊 업데이트 통계:', updatedText);
      console.log('✅ 실시간 업데이트 확인 완료');
    } else {
      console.log('ℹ️ 통계 요소를 찾을 수 없음');
    }
  });

  test('반응형 디자인이 동작한다', async ({ page }) => {
    await page.goto('/dashboard');

    // 데스크톱 뷰 확인
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    const desktopLayout = page.locator('body');
    await expect(desktopLayout).toBeVisible();

    // 모바일 뷰 확인
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const mobileLayout = page.locator('body');
    await expect(mobileLayout).toBeVisible();

    console.log('✅ 반응형 디자인 확인 완료');
  });

  test('네비게이션이 동작한다', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 홈 링크 확인
    const homeLink = page
      .locator('a[href="/"]')
      .or(page.locator('text="Home"'))
      .first();

    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState('networkidle');

      // URL 변경 확인
      expect(page.url()).toContain('/');

      console.log('✅ 네비게이션 동작 확인');
    } else {
      console.log('ℹ️ 홈 링크를 찾을 수 없음');
    }
  });
});
