import { test, expect } from '@playwright/test';
import { activateAdminMode, navigateToAdminDashboard } from './helpers/admin';
import { getTestBaseUrl } from './helpers/config';

/**
 * 관리자 페이지 버튼 동작 테스트
 * ✨ 개선: API 기반 인증으로 세션 안정성 향상
 */
test.describe('관리자 페이지 버튼 테스트', () => {
  test('관리자 모드 활성화 후 관리자 페이지 버튼 클릭 → /admin 이동', async ({
    page,
  }) => {
    const VERCEL_URL = getTestBaseUrl();

    console.log('🚀 관리자 페이지 버튼 테스트 시작');

    // ✨ 개선: API 기반 인증으로 세션 안정성 향상
    // 기존: 수동 게스트 로그인 → 프로필 클릭 → PIN 입력 → alert 처리 (9단계, 15-20초)
    // 신규: API 호출 1회로 세션 설정 (1단계, 2-3초)

    // 1. API 기반 관리자 모드 활성화
    await activateAdminMode(page);
    console.log('✅ 관리자 모드 활성화 완료 (API)');

    // 2. 대시보드로 이동
    await navigateToAdminDashboard(page, false);
    console.log('✅ 대시보드 접근 완료');

    await page.waitForTimeout(2000);

    // 3. 프로필 드롭다운 열기
    // UI 상태가 쿠키 동기화 전에는 "사용자"로 표시될 수 있으므로 두 텍스트 모두 허용
    const profileButton = page
      .locator('button:has-text("관리자"), button:has-text("사용자")')
      .first();
    await expect(profileButton).toBeVisible({ timeout: 5000 });
    await profileButton.click();
    console.log('✅ 프로필 드롭다운 열기');
    await page.waitForTimeout(1000); // Increased wait time for dropdown animation

    // Take screenshot for debugging
    await page.screenshot({ path: '/tmp/dropdown-debug.png', fullPage: false });
    console.log('📸 Dropdown screenshot saved to /tmp/dropdown-debug.png');

    // 4. 관리자 페이지 버튼 확인 및 클릭
    const adminPageButton = page.locator('button:has-text("관리자 페이지")');

    await expect(adminPageButton).toBeVisible({ timeout: 5000 });
    console.log('✅ 관리자 페이지 버튼 확인');

    // Get current URL before click
    const urlBeforeClick = page.url();
    console.log('📍 클릭 전 URL:', urlBeforeClick);

    // Set up navigation promise BEFORE clicking
    const navigationPromise = page
      .waitForNavigation({ timeout: 20000 })
      .catch((err) => {
        console.log('⚠️ Navigation error:', err.message);
        return null;
      });

    await adminPageButton.click();
    console.log('✅ 관리자 페이지 버튼 클릭 완료');

    // Wait for navigation to complete
    await navigationPromise;

    // Check URL after click
    const urlAfterClick = page.url();
    console.log('📍 클릭 후 URL:', urlAfterClick);

    // 5. /admin 페이지로 이동 확인
    if (!urlAfterClick.includes('/admin')) {
      console.log('❌ Navigation did not occur, current URL:', urlAfterClick);
      throw new Error(
        `Expected URL to contain '/admin', but got: ${urlAfterClick}`
      );
    }
    console.log('✅ /admin 페이지로 이동 완료');

    // 6. 최종 URL 확인
    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);
    expect(currentUrl).toContain('/admin');

    // 7. 관리자 페이지 콘텐츠 확인
    const adminHeading = page
      .locator('h1, h2')
      .filter({ hasText: /관리자|Admin/i })
      .first();
    await expect(adminHeading).toBeVisible({ timeout: 5000 });
    console.log('✅ 관리자 페이지 콘텐츠 확인');

    console.log('');
    console.log('🎉🎉🎉 테스트 성공! 🎉🎉🎉');
    console.log('✅ 관리자 페이지 버튼이 정상 작동합니다!');
    console.log('✅ API 기반 세션 관리로 안정성 향상!');
  });
});
