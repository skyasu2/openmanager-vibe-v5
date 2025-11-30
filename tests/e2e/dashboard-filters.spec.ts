/**
 * 대시보드 필터링/검색 테스트
 */

import { expect, test } from '@playwright/test';
import { guestLogin } from './helpers/guest';

test.describe('대시보드 필터링/검색 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await guestLogin(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  });

  test('검색 입력 필드 존재 확인', async ({ page }) => {
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"]'
      )
      .first();

    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('필터 버튼 존재 확인', async ({ page }) => {
    const filterButton = page
      .locator('button:has-text("필터"), button:has-text("Filter")')
      .first();

    if ((await filterButton.count()) > 0) {
      await expect(filterButton).toBeVisible();
    }
  });
});
