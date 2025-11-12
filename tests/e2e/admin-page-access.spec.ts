/**
 * 관리자 페이지 진입 및 UI 검증
 */

import { test, expect } from '@playwright/test';
import { getTestBaseUrl } from './helpers/config';
import {
  completeAdminModeActivationViaUI,
  openProfileDropdown,
} from './helpers/ui-flow';
import { TIMEOUTS } from './helpers/timeouts';
import { activateAdminMode } from './helpers/admin';
import { interceptAdminApis } from './helpers/admin-api-intercept';

const VERCEL_URL = getTestBaseUrl();

test('관리자 페이지 접근 및 UI 검증', async ({ page }) => {
  console.log('🚀 관리자 페이지 테스트 시작');
  page.on('response', (response) => {
    if (response.status() === 404) {
      console.warn(`⚠️ [404] ${response.url()}`);
    }
  });
  page.on('pageerror', (error) => {
    console.error('⚠️ [PageError]', error);
  });
  await interceptAdminApis(page);

  // 1. 로그인 페이지 → 게스트 로그인
  await page.goto(VERCEL_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);

  await page.click('button:has-text("게스트로 체험하기")');
  console.log('✅ 게스트 로그인 완료');

  await page.waitForTimeout(2000);

  // 2-4단계: 관리자 모드 활성화 (프로필 → 관리자 모드 → PIN 입력)
  await completeAdminModeActivationViaUI(page);

  // 5. 시스템 시작 (베르셀 환경에서는 이미 실행 중일 수 있음)
  const systemStartButton = page.locator('button:has-text("시스템 시작")');
  const shouldClickSystemStart = await systemStartButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (shouldClickSystemStart) {
    await systemStartButton.click();
    console.log('✅ 시스템 시작 버튼 클릭');
    await page.waitForTimeout(5000); // 부팅 애니메이션
  } else {
    console.log('ℹ️ 시스템 시작 버튼 미표시 (이미 대시보드 활성 상태)');
  }

  // 6. 대시보드 로드 확인
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  console.log('✅ 대시보드 접근 완료');

  await page.waitForTimeout(3000);

  // 7. 프로필 드롭다운 다시 열기
  await openProfileDropdown(page);
  console.log('✅ 프로필 드롭다운 (관리자) 재오픈');

  // 8. 관리자 페이지 메뉴 확인
  const adminPageButton = page
    .locator(
      '[data-testid="admin-page"], button:has-text("관리자 페이지"), a:has-text("관리자 페이지")'
    )
    .first();

  let adminMenuVisible = await adminPageButton
    .isVisible({ timeout: TIMEOUTS.MODAL_DISPLAY })
    .catch(() => false);

  if (!adminMenuVisible) {
    console.log('⚠️ 관리자 페이지 메뉴 미표시 → 보조 관리자 헬퍼로 재동기화');
    await activateAdminMode(page, { skipGuestLogin: true, method: 'password' });
    await openProfileDropdown(page);
    adminMenuVisible = await adminPageButton
      .isVisible({ timeout: TIMEOUTS.MODAL_DISPLAY })
      .catch(() => false);
  }

  await expect(adminPageButton).toBeVisible({
    timeout: TIMEOUTS.MODAL_DISPLAY,
  });
  console.log('✅ 관리자 페이지 메뉴 확인됨');

  // 스크린샷 1: 드롭다운 열림
  await page.screenshot({
    path: '/tmp/admin-dropdown.png',
    fullPage: false,
  });

  // 9. 관리자 페이지 클릭
  await adminPageButton.click();
  console.log('✅ 관리자 페이지 메뉴 클릭');

  await page.waitForTimeout(3000);

  // 10. 관리자 페이지 URL 확인
  const currentURL = page.url();
  console.log(`📍 현재 URL: ${currentURL}`);

  // 스크린샷 2: 관리자 페이지
  await page.screenshot({
    path: '/tmp/admin-page.png',
    fullPage: true,
  });

  console.log('✅ 관리자 페이지 스크린샷 저장');

  // 11. 관리자 페이지 UI 요소 확인
  await expect(page.locator('text=관리자').first()).toBeVisible({
    timeout: TIMEOUTS.MODAL_DISPLAY,
  });
  console.log('✅ 관리자 페이지 타이틀 확인');

  console.log('🎯 관리자 페이지 테스트 완료');
});
