import { test, expect } from '@playwright/test';
import { guestLogin, resetGuestState } from './helpers/guest';

/**
 * 게스트 세션 유지 검증 테스트
 *
 * 목적: 게스트 로그인 후 쿠키가 제대로 설정되고 유지되는지 확인
 *
 * 실행 방법:
 * npx playwright test tests/e2e/guest-session-verification.spec.ts --project=chromium --headed
 */

const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';

test.beforeEach(async ({ page }) => {
  await resetGuestState(page);
});

test.describe('🔐 게스트 세션 유지 검증', () => {
  test('게스트 로그인 → 쿠키 설정 → 프로필 접근 전체 플로우', async ({
    page,
  }) => {
    console.log('\n========================================');
    console.log('🎯 게스트 세션 유지 검증 테스트 시작');
    console.log('========================================\n');

    // 1-3단계: 게스트 로그인 플로우
    console.log('📍 Step 1-3: 게스트 로그인 플로우 실행');
    await guestLogin(page, { landingPath: BASE_URL });
    console.log('  ✅ 게스트 로그인 완료 및 /main 도달');

    // 4단계: 쿠키 확인
    console.log('\n📍 Step 4: 게스트 세션 쿠키 확인');
    const cookies = await page.context().cookies();

    const guestSessionCookie = cookies.find(
      (c) => c.name === 'guest_session_id'
    );
    const authTypeCookie = cookies.find((c) => c.name === 'auth_type');

    console.log('\n  📊 쿠키 상태:');
    console.log(
      `    - guest_session_id: ${guestSessionCookie ? '✅ 존재' : '❌ 없음'}`
    );
    if (guestSessionCookie) {
      console.log(`      값: ${guestSessionCookie.value.substring(0, 20)}...`);
      console.log(
        `      만료: ${new Date(guestSessionCookie.expires * 1000).toLocaleString()}`
      );
    }

    console.log(`    - auth_type: ${authTypeCookie ? '✅ 존재' : '❌ 없음'}`);
    if (authTypeCookie) {
      console.log(`      값: ${authTypeCookie.value}`);
    }

    // 5단계: localStorage 확인
    console.log('\n📍 Step 5: localStorage 확인');
    const localStorage = await page.evaluate(() => {
      return {
        auth_session_id: window.localStorage.getItem('auth_session_id'),
        auth_type: window.localStorage.getItem('auth_type'),
        auth_user: window.localStorage.getItem('auth_user'),
      };
    });

    console.log('  📊 localStorage 상태:');
    console.log(
      `    - auth_session_id: ${localStorage.auth_session_id ? '✅ 존재' : '❌ 없음'}`
    );
    console.log(`    - auth_type: ${localStorage.auth_type || '❌ 없음'}`);
    console.log(
      `    - auth_user: ${localStorage.auth_user ? '✅ 존재' : '❌ 없음'}`
    );

    if (localStorage.auth_user) {
      try {
        const user = JSON.parse(localStorage.auth_user);
        console.log(`      이름: ${user.name || '없음'}`);
        console.log(`      이메일: ${user.email || '없음'}`);
      } catch (e) {
        console.log('      파싱 실패');
      }
    }

    // 6단계: 프로필 버튼 찾기 (게스트 사용자 표시 확인)
    console.log('\n📍 Step 6: 프로필 버튼 확인');
    const profileButton = page
      .locator('button')
      .filter({ hasText: /게스트/i })
      .first();

    const isProfileVisible = await profileButton
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (isProfileVisible) {
      console.log('  ✅ 게스트 프로필 버튼 표시됨');
      await page.screenshot({ path: 'test-results/guest-profile-visible.png' });
    } else {
      console.log('  ❌ 프로필 버튼이 보이지 않음 (세션 소실?)');
      await page.screenshot({ path: 'test-results/guest-profile-missing.png' });
    }

    // 7단계: 프로필 버튼 클릭 (드롭다운 테스트)
    console.log('\n📍 Step 7: 프로필 버튼 클릭 (드롭다운 테스트)');

    if (isProfileVisible) {
      await profileButton.click();
      await page.waitForTimeout(1500);

      // 드롭다운 메뉴 확인
      const dropdown = page.locator('[role="menu"]');
      const dropdownVisible = await dropdown
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (dropdownVisible) {
        console.log('  ✅ 프로필 드롭다운 메뉴 표시됨');

        // 관리자 모드 버튼이 더 이상 노출되지 않는지 확인
        const adminMenuItems = page
          .locator('[role="menuitem"]')
          .filter({ hasText: /관리자 모드|admin mode/i });
        const adminItemCount = await adminMenuItems.count();

        if (adminItemCount > 0) {
          console.log('  ❌ "관리자 모드" 메뉴가 여전히 노출되고 있습니다.');
        } else {
          console.log('  ✅ "관리자 모드" 메뉴가 제거된 상태를 확인했습니다.');
        }
        expect(adminItemCount).toBe(0);

        await page.screenshot({
          path: 'test-results/guest-dropdown-opened.png',
        });
      } else {
        console.log('  ❌ 프로필 드롭다운이 열리지 않음');
        await page.screenshot({
          path: 'test-results/guest-dropdown-failed.png',
        });
      }
    }

    // 8단계: 최종 결과 요약
    console.log('\n========================================');
    console.log('📊 최종 검증 결과');
    console.log('========================================');

    const results = {
      '쿠키 설정': guestSessionCookie && authTypeCookie,
      'localStorage 설정':
        localStorage.auth_session_id && localStorage.auth_type,
      '프로필 표시': isProfileVisible,
    };

    for (const [key, value] of Object.entries(results)) {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    }

    // 최소 요구사항: 쿠키와 localStorage가 설정되어야 함
    expect(guestSessionCookie, '게스트 세션 쿠키가 설정되어야 함').toBeTruthy();
    expect(authTypeCookie?.value, 'auth_type 쿠키가 "guest"여야 함').toBe(
      'guest'
    );
    expect(
      localStorage.auth_type,
      'localStorage auth_type이 "guest"여야 함'
    ).toBe('guest');

    console.log('\n✅ 게스트 세션 유지 검증 완료!\n');
  });
});
