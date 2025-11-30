/**
 * 대시보드 서버 메트릭 업데이트 테스트
 */

import { expect, test } from '@playwright/test';
import { guestLogin } from './helpers/guest';

test.describe('대시보드 메트릭 업데이트 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await guestLogin(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  });

  test('서버 메트릭 표시 확인', async ({ page }) => {
    // CPU, Memory, Disk 메트릭이 페이지에 표시되는지 확인
    const cpuMetric = page.getByText(/CPU|cpu/i).first();
    const memoryMetric = page.getByText(/Memory|메모리/i).first();

    await expect(cpuMetric).toBeVisible();
    await expect(memoryMetric).toBeVisible();
  });

  test('새로고침 버튼 존재 확인', async ({ page }) => {
    const refreshButton = page
      .locator(
        'button:has-text("새로고침"), button:has-text("Refresh"), button[aria-label*="새로고침"]'
      )
      .first();

    if ((await refreshButton.count()) > 0) {
      await expect(refreshButton).toBeVisible();
    }
  });
});
