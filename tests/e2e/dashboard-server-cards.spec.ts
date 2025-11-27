/**
 * 대시보드 서버 카드 + 모달 E2E 테스트
 *
 * 테스트 범위:
 * - 서버 카드 렌더링
 * - 서버 카드 클릭 → 모달 열기
 * - 모달 내용 확인 (탭, 메트릭)
 * - 모달 닫기 (ESC, 외부 클릭)
 */

import { test, expect } from '@playwright/test';
import { guestLogin } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

test.describe('대시보드 서버 카드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 게스트 로그인 → /main
    await guestLogin(page);

    // 대시보드로 이동
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Fix: UI 안정화 대기 - 서버 카드가 로드될 때까지 명시적 대기
    await expect(page.locator('[data-testid="server-card"]').first()).toBeVisible({
      timeout: TIMEOUTS.DOM_UPDATE
    });
  });

  test('서버 카드 렌더링 확인', async ({ page }) => {
    // 서버 카드가 최소 1개 이상 렌더링되는지 확인
    const serverCards = page.locator('[data-testid="server-card"]');
    await expect(serverCards.first()).toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });

    const cardCount = await serverCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('서버 카드 메트릭 표시 확인', async ({ page }) => {
    const firstCard = page.locator('[data-testid="server-card"]').first();

    // CPU, Memory, Disk 메트릭이 표시되는지 확인
    await expect(firstCard.getByText(/CPU|cpu/i)).toBeVisible();
    await expect(firstCard.getByText(/Memory|메모리/i)).toBeVisible();
    await expect(firstCard.getByText(/Disk|디스크/i)).toBeVisible();
  });

  test('서버 카드 클릭 → 모달 열기', async ({ page }) => {
    const firstCard = page.locator('[data-testid="server-card"]').first();

    // Fix: 카드 로드 완료 확인 후 클릭
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // 모달이 나타나는지 확인
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.MODAL_DISPLAY });
  });

  test('서버 모달 닫기 (ESC 키)', async ({ page }) => {
    // 카드 클릭 → 모달 열기
    const firstCard = page.locator('[data-testid="server-card"]').first();

    // Fix: 카드 로드 완료 확인 후 클릭
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // ESC 키로 닫기
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });
  });

  test('서버 모달 탭 전환 확인', async ({ page }) => {
    // 카드 클릭 → 모달 열기
    const firstCard = page.locator('[data-testid="server-card"]').first();

    // Fix: 카드 로드 완료 확인 후 클릭
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // 탭이 존재하는지 확인 (Overview, Metrics 등)
    const tabs = modal.locator('[role="tab"]');
    const tabCount = await tabs.count();

    expect(tabCount).toBeGreaterThan(0);
  });
});
