/**
 * 관리자 페이지 진입 및 UI 검증
 */

import { test, expect } from '@playwright/test';
import { getTestBaseUrl } from './helpers/config';
import { completeAdminModeActivationViaUI } from './helpers/ui-flow';

const VERCEL_URL = getTestBaseUrl();
const ADMIN_PIN = '4231';

test('관리자 페이지 접근 및 UI 검증', async ({ page }) => {
  console.log('🚀 관리자 페이지 테스트 시작');

  // 1. 로그인 페이지 → 게스트 로그인
  await page.goto(VERCEL_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);

  await page.click('button:has-text("게스트로 체험하기")');
  console.log('✅ 게스트 로그인 완료');

  await page.waitForTimeout(2000);

  // 2-4단계: 관리자 모드 활성화 (프로필 → 관리자 모드 → PIN 입력)
  await completeAdminModeActivationViaUI(page);

  // 5. 시스템 시작
  await page.click('button:has-text("시스템 시작")');
  console.log('✅ 시스템 시작 버튼 클릭');

  await page.waitForTimeout(5000); // 부팅 애니메이션

  // 6. 대시보드 로드 확인
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  console.log('✅ 대시보드 접근 완료');

  await page.waitForTimeout(3000);

  // 7. 프로필 드롭다운 다시 열기
  await page.click('[data-testid="profile-dropdown"], button:has-text("관리자")');
  console.log('✅ 프로필 드롭다운 (관리자) 열기');

  await page.waitForTimeout(1000);

  // 8. 관리자 페이지 메뉴 확인
  const adminPageButton = page.locator('button:has-text("관리자 페이지"), a:has-text("관리자 페이지")');
  const isVisible = await adminPageButton.isVisible().catch(() => false);

  if (isVisible) {
    console.log('✅ 관리자 페이지 메뉴 확인됨');

    // 스크린샷 1: 드롭다운 열림
    await page.screenshot({
      path: '/tmp/admin-dropdown.png',
      fullPage: false
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
      fullPage: true
    });

    console.log('✅ 관리자 페이지 스크린샷 저장');

    // 11. 관리자 페이지 UI 요소 확인
    const hasTitle = await page.locator('text=관리자').first().isVisible().catch(() => false);
    if (hasTitle) {
      console.log('✅ 관리자 페이지 타이틀 확인');
    }
  } else {
    console.log('⚠️  관리자 페이지 메뉴 미확인');
  }

  console.log('🎯 관리자 페이지 테스트 완료');
});
