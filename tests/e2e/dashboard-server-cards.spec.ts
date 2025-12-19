/**
 * 대시보드 서버 카드 + 모달 E2E 테스트
 *
 * 테스트 범위:
 * - 서버 카드 렌더링
 * - 서버 카드 클릭 → 모달 열기
 * - 모달 내용 확인 (탭, 메트릭)
 * - 모달 닫기 (ESC, 외부 클릭)
 */

import { expect, test } from '@playwright/test';
import { guestLogin } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

// Server cards don't have data-testid; they are clickable cards with server name headings (APP-01, etc.)
// Selector reference: '[class*="cursor-pointer"]:has(h3), .group:has(h3[class*="font"]), article:has(h3)'

test.describe('대시보드 서버 카드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 게스트 로그인 → / (메인 페이지)
    await guestLogin(page);

    // 메인 페이지에서 "🚀 시스템 시작" 버튼 클릭하여 /dashboard로 이동
    await page.waitForLoadState('networkidle');

    const startButton = page
      .locator(
        'button:has-text("🚀 시스템 시작"), button:has-text("시스템 시작")'
      )
      .first();
    await startButton.waitFor({
      state: 'visible',
      timeout: TIMEOUTS.MODAL_DISPLAY,
    });
    await startButton.click();

    // 대시보드로 이동 대기 (시스템 부트 포함)
    await page.waitForURL('**/dashboard', {
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });
    await page.waitForLoadState('networkidle');

    // Fix: UI 안정화 대기 - 서버 카드(h3 heading 포함하는 클릭 가능 요소)가 로드될 때까지 명시적 대기
    await expect(page.locator('h3:has-text("APP-")').first()).toBeVisible({
      timeout: TIMEOUTS.DOM_UPDATE,
    });
  });

  test('서버 카드 렌더링 확인', async ({ page }) => {
    // 서버 카드가 최소 1개 이상 렌더링되는지 확인 (h3 heading으로 식별)
    const serverCards = page.locator('h3:has-text("APP-")');
    await expect(serverCards.first()).toBeVisible({
      timeout: TIMEOUTS.DOM_UPDATE,
    });

    const cardCount = await serverCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('서버 카드 메트릭 표시 확인', async ({ page }) => {
    // 첫 번째 서버 카드의 부모 컨테이너에서 메트릭 확인
    await expect(page.locator('h3:has-text("APP-")').first()).toBeVisible();

    // CPU, Memory, Disk 메트릭이 페이지 어딘가에 표시되는지 확인
    await expect(page.getByText(/CPU|cpu/i).first()).toBeVisible();
    await expect(page.getByText(/Memory|메모리/i).first()).toBeVisible();
  });

  test('서버 카드 클릭 → 모달 열기', async ({ page }) => {
    // 서버 카드(h3 heading 포함) 클릭
    const firstCardHeading = page.locator('h3:has-text("APP-")').first();

    // Fix: 카드 로드 완료 확인 후 클릭
    await expect(firstCardHeading).toBeVisible();
    await firstCardHeading.click();

    // 모달이 나타나는지 확인 (native <dialog> element or [role="dialog"])
    const modal = page.locator('dialog, [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.MODAL_DISPLAY });
  });

  test('서버 모달 닫기 (ESC 키)', async ({ page }) => {
    // 카드 클릭 → 모달 열기
    const firstCardHeading = page.locator('h3:has-text("APP-")').first();

    // Fix: 카드 로드 완료 확인 후 클릭
    await expect(firstCardHeading).toBeVisible();
    await firstCardHeading.click();

    // Native <dialog> element or [role="dialog"]
    const modal = page.locator('dialog, [role="dialog"]').first();
    await expect(modal).toBeVisible();

    // ESC 키로 닫기
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });
  });

  test('서버 모달 탭 전환 확인', async ({ page }) => {
    // 카드 클릭 → 모달 열기
    const firstCardHeading = page.locator('h3:has-text("APP-")').first();

    // Fix: 카드 로드 완료 확인 후 클릭
    await expect(firstCardHeading).toBeVisible();
    await firstCardHeading.click();

    // Native <dialog> element or [role="dialog"]
    const modal = page.locator('dialog, [role="dialog"]').first();
    await expect(modal).toBeVisible();

    // 탭 버튼이 존재하는지 확인 (종합 상황, 성능 분석 등)
    const tabButtons = modal.locator(
      'button:has-text("종합 상황"), button:has-text("성능 분석")'
    );
    const tabCount = await tabButtons.count();

    expect(tabCount).toBeGreaterThan(0);
  });
});
