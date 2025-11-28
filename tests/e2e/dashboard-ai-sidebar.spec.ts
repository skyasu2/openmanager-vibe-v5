/**
 * 대시보드 AI 사이드바 전체 플로우 테스트
 *
 * 테스트 범위:
 * - AI 사이드바 열기/닫기
 * - AI 메시지 입력
 * - 채팅 히스토리 표시
 */

import { test, expect } from '@playwright/test';
import { guestLogin, openAiSidebar } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

test.describe('대시보드 AI 사이드바 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await guestLogin(page);

    // Fix: /main에서 "🚀 시스템 시작" 버튼 클릭하여 /dashboard로 이동
    await page.waitForLoadState('networkidle');

    const startButton = page
      .locator(
        'button:has-text("🚀 시스템 시작"), button:has-text("시스템 시작")'
      )
      .first();
    await startButton.waitFor({ state: 'visible', timeout: 10000 });
    await startButton.click();

    // 대시보드로 이동 대기
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('AI 사이드바 열기', async ({ page }) => {
    const sidebar = await openAiSidebar(page);
    await expect(sidebar).toBeVisible();
  });

  test('AI 메시지 입력 필드 확인', async ({ page }) => {
    await openAiSidebar(page);

    // Fix: input/textarea는 텍스트 노드가 없으므로 placeholder 사용
    const input = page
      .locator(
        'textarea[placeholder*="메시지"], textarea[placeholder*="질문"], input[type="text"][placeholder*="AI"]'
      )
      .first();
    await expect(input).toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });
  });

  test('AI 사이드바 닫기 (ESC)', async ({ page }) => {
    const sidebar = await openAiSidebar(page);

    await page.keyboard.press('Escape');
    await expect(sidebar).not.toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });
  });
});
