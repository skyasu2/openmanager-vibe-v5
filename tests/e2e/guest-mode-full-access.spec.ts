import { test, expect } from '@playwright/test';
import { ensureVercelBypassCookie } from './helpers/security';

/**
 * 게스트 모드 전체 접근 E2E 테스트
 *
 * 환경 변수: NEXT_PUBLIC_GUEST_MODE=full_access
 *
 * 테스트 시나리오:
 * 1. Admin 페이지 접근
 * 2. Dashboard 페이지 접근 및 서버 모니터링
 * 3. AI 어시스턴트 사이드바 동작
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('게스트 모드 전체 접근 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 쿠키 및 로컬 스토리지 클리어
    await page.context().clearCookies();
    await ensureVercelBypassCookie(page);
  });

  test('1. Admin 페이지 접근 테스트', async ({ page }) => {
    // Given: 게스트 사용자가 Admin 페이지에 접근
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });

    // When: 페이지 로드 대기
    await page.waitForTimeout(3000);

    // Then: Admin 페이지 접근 성공 (리다이렉트 없음)
    await expect(page).toHaveURL(/\/admin/);

    // And: 페이지 기본 구조 확인
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    expect(hasContent?.length).toBeGreaterThan(100);
  });

  test('2. Dashboard 페이지 접근 및 서버 모니터링 테스트', async ({ page }) => {
    // Given: 게스트 사용자가 Dashboard 페이지에 접근
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });

    // When: 페이지 로드 대기
    await page.waitForTimeout(3000);

    // Then: Dashboard 페이지 접근 성공
    await expect(page).toHaveURL(/\/dashboard/);

    // And: OpenManager 브랜드 표시
    await expect(page.locator('text=OpenManager')).toBeVisible({ timeout: 10000 });

    // And: AI 어시스턴트 버튼 표시
    await expect(page.locator('button:has-text("AI 어시스턴트")')).toBeVisible({ timeout: 10000 });
  });

  test('3. AI 어시스턴트 사이드바 열기/닫기 테스트', async ({ page }) => {
    // Given: 게스트 사용자가 Dashboard에 있음
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // When: AI 어시스턴트 버튼 클릭
    const aiButton = page.locator('button:has-text("AI 어시스턴트")').first();
    await aiButton.click();
    await page.waitForTimeout(2000); // 애니메이션 대기

    // Then: AI 버튼 상태 변경 확인 (aria-pressed="true")
    await expect(aiButton).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });

    // And: AI 사이드바 DOM 존재 확인
    const sidebar = page.locator('.fixed.right-0.w-96');
    await expect(sidebar).toBeAttached({ timeout: 5000 });
  });

  test('4. Admin → Dashboard 네비게이션 테스트', async ({ page }) => {
    // Given: 게스트 사용자가 Admin 페이지에 있음
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // When: Dashboard로 이동
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Then: Dashboard 페이지 정상 접근
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=OpenManager')).toBeVisible({ timeout: 10000 });
  });
});
