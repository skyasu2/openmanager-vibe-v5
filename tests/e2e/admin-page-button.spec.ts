import { test, expect } from '@playwright/test';

/**
 * Vercel 프로덕션 환경 - 관리자 페이지 버튼 동작 테스트
 * 수정 사항: router.push → window.location.href
 */
test.describe('Vercel 프로덕션 - 관리자 페이지 버튼 테스트', () => {
  test('PIN 인증 후 프로필 드롭다운에서 관리자 페이지 버튼 클릭 → /admin 이동', async ({ page }) => {
    const VERCEL_URL = 'https://openmanager-vibe-v5.vercel.app';

    // 1. Vercel 프로덕션으로 이동
    console.log('🌐 Vercel 프로덕션 접속:', VERCEL_URL);
    await page.goto(VERCEL_URL);

    // 2. 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    console.log('✅ 로그인 페이지로 리다이렉트 확인');

    // 3. 게스트 로그인
    const guestButton = page.locator('button:has-text("게스트로 시작")');
    await expect(guestButton).toBeVisible({ timeout: 5000 });
    await guestButton.click();
    console.log('✅ 게스트 로그인 버튼 클릭');

    // 4. 메인 페이지로 이동 확인
    await expect(page).toHaveURL(/.*main/, { timeout: 10000 });
    console.log('✅ 메인 페이지 이동 확인');
    await page.waitForTimeout(1000);

    // 5. 프로필 드롭다운 열기
    const profileButton = page.locator('button:has-text("게스트")').first();
    await expect(profileButton).toBeVisible({ timeout: 5000 });
    await profileButton.click();
    console.log('✅ 프로필 드롭다운 열기');
    await page.waitForTimeout(500);

    // 6. PIN 인증 버튼 클릭
    const pinAuthButton = page.locator('button:has-text("관리자 인증")');
    await expect(pinAuthButton).toBeVisible({ timeout: 3000 });
    await pinAuthButton.click();
    console.log('✅ PIN 인증 버튼 클릭');
    await page.waitForTimeout(500);

    // 7. PIN 입력 (4231)
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill('4231');
    console.log('✅ PIN 입력 (4231)');
    await page.waitForTimeout(300);

    // 8. 확인 버튼 클릭
    const confirmButton = page.locator('button:has-text("확인")');
    await confirmButton.click();
    console.log('✅ 확인 버튼 클릭');

    // 9. alert 처리 (관리자 모드 활성화 알림)
    page.once('dialog', async (dialog) => {
      console.log('🔔 Alert 확인:', dialog.message());
      await dialog.accept();
    });

    await page.waitForTimeout(1000);

    // 10. 프로필 드롭다운 다시 열기
    await profileButton.click();
    console.log('✅ 프로필 드롭다운 재오픈');
    await page.waitForTimeout(500);

    // 11. "관리자 페이지" 버튼 확인 및 클릭
    const adminPageButton = page.locator('button:has-text("관리자 페이지")');
    await expect(adminPageButton).toBeVisible({ timeout: 3000 });
    console.log('🎯 관리자 페이지 버튼 발견!');

    console.log('🚀 관리자 페이지 버튼 클릭...');
    await adminPageButton.click();

    // 12. /admin 페이지로 이동 확인 (최대 10초 대기)
    await page.waitForURL(/.*admin/, { timeout: 10000 });
    console.log('✅ /admin 페이지로 이동 완료');

    // 13. 최종 URL 확인
    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);
    expect(currentUrl).toContain('/admin');

    // 14. 관리자 페이지 콘텐츠 확인
    const adminHeading = page.locator('h1, h2, text=/관리자|Admin/i').first();
    await expect(adminHeading).toBeVisible({ timeout: 5000 });
    console.log('✅ 관리자 페이지 콘텐츠 확인');

    console.log('');
    console.log('🎉🎉🎉 테스트 성공! 🎉🎉🎉');
    console.log('✅ 관리자 페이지 버튼이 정상 작동합니다!');
    console.log('✅ window.location.href 수정이 올바르게 적용되었습니다!');
  });
});
