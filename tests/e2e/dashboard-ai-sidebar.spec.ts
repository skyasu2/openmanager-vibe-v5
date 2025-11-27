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
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  });

  test('AI 사이드바 열기', async ({ page }) => {
    const sidebar = await openAiSidebar(page);
    await expect(sidebar).toBeVisible();
  });

  test('AI 메시지 입력 필드 확인', async ({ page }) => {
    await openAiSidebar(page);

    const input = page.locator('textarea, input[type="text"]').filter({ hasText: /AI|메시지|질문/i }).first();
    await expect(input).toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });
  });

  test('AI 사이드바 닫기 (ESC)', async ({ page }) => {
    const sidebar = await openAiSidebar(page);

    await page.keyboard.press('Escape');
    await expect(sidebar).not.toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });
  });
});
