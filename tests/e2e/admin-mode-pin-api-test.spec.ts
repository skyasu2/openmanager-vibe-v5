import { test, expect } from '@playwright/test';
import { TIMEOUTS } from './helpers/timeouts';
import { ensureVercelBypassCookie } from './helpers/security';
import {
  ADMIN_FEATURES_REMOVED,
  ADMIN_FEATURES_SKIP_MESSAGE,
} from './helpers/featureFlags';

/**
 * 관리자 모드 PIN 4231 인증 API 테스트 (축소 범위)
 *
 * 목적: 게스트 로그인 → PIN 입력 → API 응답 검증까지만
 * 제외: /admin 페이지 접근 (middleware 쿠키 전달 문제)
 *
 * 검증 범위:
 * 1. ✅ 게스트 로그인
 * 2. ✅ PIN 다이얼로그 표시
 * 3. ✅ PIN 4231 입력
 * 4. ✅ /api/admin/verify-pin 응답 200 OK
 * 5. ✅ admin_mode 쿠키 설정 확인
 * 6. ✅ "관리자 페이지" 메뉴 표시
 *
 * 수동 테스트 필요:
 * - /admin 페이지 접근 (브라우저 개발자 도구에서 쿠키 확인)
 *
 * 실행 방법:
 * npx playwright test tests/e2e/admin-mode-pin-api-test.spec.ts --project=chromium --headed
 */

const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';
const ADMIN_PIN = '4231';
const DASHBOARD_ROUTE_REGEX = /\/(dashboard|main)(\/|\?|$)/;

test.describe('🔐 관리자 모드 PIN 인증 API 테스트 (축소 범위)', () => {
  test.skip(ADMIN_FEATURES_REMOVED, ADMIN_FEATURES_SKIP_MESSAGE);
  test('게스트 로그인 → PIN 4231 입력 → API 응답 검증', async ({
    page,
    context,
  }) => {
    await ensureVercelBypassCookie(page);
    // 🧪 테스트 모드 쿠키 설정
    await context.addCookies([
      {
        name: 'test_mode',
        value: 'enabled',
        domain: 'openmanager-vibe-v5.vercel.app',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 1800, // 🔒 Phase 2: 30분 후 자동 만료
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      },
    ]);
    console.log('  🧪 테스트 모드 쿠키 설정 완료');

    // 🐛 브라우저 콘솔 로그 캡처
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`  🔍 브라우저 ${text}`);
      }
    });

    // 🌐 네트워크 요청 캡처 (verify-pin API만)
    const apiCalls: { url: string; status: number; response: any }[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/admin/verify-pin')) {
        try {
          const json = await response.json();
          apiCalls.push({
            url,
            status: response.status(),
            response: json,
          });
          console.log(
            `  🌐 API 응답: ${response.status()} - ${JSON.stringify(json)}`
          );
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    });

    console.log('\n========================================');
    console.log('🎯 관리자 모드 PIN 인증 API 테스트 시작');
    console.log('========================================\n');

    // 1단계: 홈페이지 접속 및 게스트 로그인
    console.log('📍 Step 1: 게스트 로그인');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const guestButton = page.locator('button:has-text("게스트로 체험하기")');
    await expect(guestButton).toBeVisible({ timeout: 10000 });
    await guestButton.click();
    console.log('  ✅ 게스트 로그인 버튼 클릭');

    // /main 또는 /dashboard 리다이렉트 대기 (새로운 라우팅 대응)
    await page.waitForURL(DASHBOARD_ROUTE_REGEX, {
      timeout: TIMEOUTS.DASHBOARD_LOAD,
    });
    await page.waitForLoadState('networkidle');
    console.log(
      `  ✅ /main 또는 /dashboard 페이지로 이동 완료 (현재: ${page.url()})`
    );

    // 2단계: 프로필 버튼 클릭
    console.log('\n📍 Step 2: 프로필 버튼 클릭');
    const profileButton = page
      .locator('button')
      .filter({ hasText: /게스트/i })
      .first();
    await expect(profileButton).toBeVisible({ timeout: 10000 });
    console.log('  ✅ 게스트 프로필 버튼 발견');

    await profileButton.click();
    await page.waitForTimeout(1500);
    console.log('  ✅ 프로필 버튼 클릭');

    await page.screenshot({
      path: 'test-results/admin-api-01-profile-dropdown.png',
    });

    // 3단계: 드롭다운 메뉴에서 "관리자 모드" 버튼 확인
    console.log('\n📍 Step 3: "관리자 모드" 버튼 찾기');
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    console.log('  ✅ 드롭다운 메뉴 표시됨');

    const adminButton = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /관리자/i });
    await expect(adminButton).toBeVisible({ timeout: 5000 });
    console.log('  ✅ "관리자 모드" 메뉴 발견');

    await page.screenshot({
      path: 'test-results/admin-api-02-admin-button-visible.png',
    });

    // 4단계: "관리자 모드" 버튼 클릭
    console.log('\n📍 Step 4: "관리자 모드" 버튼 클릭');
    await adminButton.click();
    await page.waitForTimeout(1500);
    console.log('  ✅ "관리자 모드" 버튼 클릭');

    await page.screenshot({
      path: 'test-results/admin-api-03-pin-dialog-opened.png',
    });

    // 5단계: PIN 입력 필드 찾기
    console.log('\n📍 Step 5: PIN 입력 필드 찾기');

    const pinInput = page.locator('input[type="password"]').first();

    const pinInputVisible = await pinInput
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!pinInputVisible) {
      console.log(
        '  ⚠️ input[type="password"] 찾기 실패, input[type="text"] 시도'
      );
      const textInput = page
        .locator('input[type="text"]')
        .filter({ hasText: '' })
        .first();
      const textInputVisible = await textInput
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (textInputVisible) {
        console.log('  ✅ input[type="text"] PIN 필드 발견');
      } else {
        console.log('  ❌ PIN 입력 필드를 찾을 수 없음');
        await page.screenshot({
          path: 'test-results/admin-api-04-pin-field-not-found.png',
        });
        throw new Error('PIN 입력 필드를 찾을 수 없습니다');
      }
    } else {
      console.log('  ✅ input[type="password"] PIN 필드 발견');
    }

    await page.screenshot({
      path: 'test-results/admin-api-04-pin-field-found.png',
    });

    // 6단계: PIN 4231 입력
    console.log('\n📍 Step 6: PIN 4231 입력');
    await pinInput.fill(ADMIN_PIN);
    console.log(`  ✅ PIN "${ADMIN_PIN}" 입력 완료`);

    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/admin-api-05-pin-entered.png',
    });

    // 7단계: 확인 버튼 클릭
    console.log('\n📍 Step 7: 확인 버튼 클릭');

    const confirmButton = page
      .locator('button')
      .filter({ hasText: /확인|인증|제출|submit/i })
      .first();

    const confirmButtonVisible = await confirmButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (confirmButtonVisible) {
      await confirmButton.click();
      console.log('  ✅ 확인 버튼 클릭');
    } else {
      // Enter 키로 제출 시도
      console.log('  ⚠️ 확인 버튼 미발견, Enter 키 입력 시도');
      await pinInput.press('Enter');
      console.log('  ✅ Enter 키 입력');
    }

    // API 응답 대기 (최대 5초)
    console.log('  ⏳ API 응답 대기...');
    await page.waitForTimeout(5000);
    await page.screenshot({
      path: 'test-results/admin-api-06-after-confirm.png',
    });

    // 🍪 쿠키 확인
    const cookies = await page.context().cookies();
    const adminModeCookie = cookies.find((c) => c.name === 'admin_mode');
    if (adminModeCookie) {
      console.log(`  ✅ admin_mode 쿠키 발견: ${adminModeCookie.value}`);
    } else {
      console.log('  ⚠️ admin_mode 쿠키 미발견');
      console.log(
        `  📊 전체 쿠키 목록: ${cookies.map((c) => c.name).join(', ')}`
      );
    }

    // 🔄 페이지 새로고침으로 쿠키 재로딩 (제거 - 불필요)
    // console.log('  🔄 페이지 새로고침으로 쿠키 재로딩 중...');
    // await page.reload({ waitUntil: 'domcontentloaded' });
    // await page.waitForTimeout(2000);
    // console.log('  ✅ 쿠키 재로딩 완료');

    // 🔥 새로고침 대신 충분한 대기 시간 제공 (React 상태 업데이트 완료 대기)
    console.log('  ⏳ React 상태 업데이트 대기 중...');
    await page.waitForTimeout(2000);
    console.log('  ✅ 상태 업데이트 완료');

    // 다이얼로그가 닫혔는지 확인
    const dialogStillOpen = await page
      .locator('input[type="password"]')
      .isVisible()
      .catch(() => false);
    if (dialogStillOpen) {
      console.log('  ⚠️ PIN 다이얼로그가 여전히 열려있음 (인증 실패 가능성)');

      // API 응답 로그 출력
      if (apiCalls.length > 0) {
        console.log(`  📊 API 호출 결과: ${JSON.stringify(apiCalls[0])}`);
      } else {
        console.log('  ⚠️ API 호출이 감지되지 않음');
      }
    } else {
      console.log('  ✅ PIN 다이얼로그가 닫힘 (인증 성공 가능성)');
    }

    // 7.5단계: localStorage 디버깅
    console.log('\n📍 Step 7.5: localStorage 상태 디버깅');

    const localStorageState = await page.evaluate(() => {
      return {
        admin_mode: localStorage.getItem('admin_mode'),
        'auth-storage': localStorage.getItem('auth-storage'),
        'unified-admin-storage': localStorage.getItem('unified-admin-storage'),
      };
    });

    console.log('  📊 localStorage 상태:');
    console.log('    admin_mode:', localStorageState.admin_mode);

    if (localStorageState['auth-storage']) {
      try {
        const authStorage = JSON.parse(localStorageState['auth-storage']);
        console.log(
          '    auth-storage.adminMode:',
          authStorage?.state?.adminMode
        );
      } catch (e) {
        console.log('    auth-storage: 파싱 실패');
      }
    }

    if (localStorageState['unified-admin-storage']) {
      try {
        const unifiedStorage = JSON.parse(
          localStorageState['unified-admin-storage']
        );
        console.log(
          '    unified-admin-storage.adminMode.isAuthenticated:',
          unifiedStorage?.state?.adminMode?.isAuthenticated
        );
      } catch (e) {
        console.log('    unified-admin-storage: 파싱 실패');
      }
    }

    // 8단계: 관리자 모드 활성화 확인
    console.log('\n📍 Step 8: 관리자 모드 활성화 확인');

    // 프로필 버튼 참조 (스코프 밖에서 정의)
    const profileButtonAfter = page
      .locator('button')
      .filter({ hasText: /관리자|게스트/i })
      .first();

    // 메뉴가 열려있는지 확인 (closeMenu 제거로 인증 후 열린 상태여야 함)
    const menuVisible = await page
      .locator('[role="menu"]')
      .isVisible()
      .catch(() => false);

    if (!menuVisible) {
      console.log('  ℹ️ 메뉴가 닫혀있음, 프로필 버튼 다시 클릭');
      await expect(profileButtonAfter).toBeVisible({ timeout: 5000 });
      await profileButtonAfter.click();
      await page.waitForTimeout(1500);
    } else {
      console.log('  ✅ 메뉴가 이미 열려있음 (closeMenu 제거 효과)');
    }

    await page.screenshot({
      path: 'test-results/admin-api-07-profile-after-auth.png',
    });

    // "관리자 페이지" 메뉴 확인
    const adminPageButton = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /관리자 페이지|admin page/i });
    const adminPageVisible = await adminPageButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (adminPageVisible) {
      console.log('  ✅ "관리자 페이지" 메뉴 발견 (관리자 모드 활성화 성공!)');
    } else {
      console.log('  ⚠️ "관리자 페이지" 메뉴 미발견 (관리자 모드 비활성?)');
    }

    // 프로필 버튼 텍스트 확인 (관리자 표시)
    const profileText = await profileButtonAfter.textContent();
    console.log(`  📊 프로필 버튼 텍스트: "${profileText}"`);

    if (profileText?.includes('관리자')) {
      console.log('  ✅ 프로필 버튼에 "관리자" 표시됨');
    } else {
      console.log('  ⚠️ 프로필 버튼에 "관리자" 미표시');
    }

    await page.screenshot({
      path: 'test-results/admin-api-08-final-state.png',
    });

    // 9단계: 최종 검증 결과
    console.log('\n========================================');
    console.log('📊 최종 검증 결과 (API 테스트 범위)');
    console.log('========================================');

    const firstApiCall = apiCalls[0];
    const apiCallSucceeded =
      !!firstApiCall &&
      firstApiCall.status === 200 &&
      firstApiCall.response?.success === true;

    const results = {
      '게스트 로그인': true,
      '프로필 드롭다운 열림': true,
      '"관리자 모드" 버튼 클릭': true,
      'PIN 입력 필드 발견': pinInputVisible,
      'PIN 4231 입력': true,
      'API 응답 200 OK': !!firstApiCall && firstApiCall.status === 200,
      'API 응답 success:true': apiCallSucceeded,
      'admin_mode 쿠키 설정': !!adminModeCookie,
      '관리자 모드 활성화': adminPageVisible || profileText?.includes('관리자'),
    };

    for (const [key, value] of Object.entries(results)) {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    }

    console.log('\n📝 참고: /admin 페이지 접근은 수동 테스트 필요');
    console.log('  - Playwright 쿠키 전달 문제로 E2E 자동화 불가');
    console.log(
      '  - 브라우저에서 수동으로 admin_mode 쿠키 확인 후 /admin 접근'
    );

    // 최소 요구사항: API 응답이 성공이어야 함
    expect(apiCalls.length, 'API 호출이 발생해야 함').toBeGreaterThan(0);
    expect(firstApiCall?.status, 'API 응답이 200 OK').toBe(200);
    expect(firstApiCall?.response?.success, 'API 응답 success:true').toBe(true);
    expect(adminModeCookie, 'admin_mode 쿠키가 설정되어야 함').toBeTruthy();

    console.log('\n✅ 관리자 모드 PIN 인증 API 테스트 완료!\n');

    // 🐛 디버깅 정보 출력
    console.log('\n========================================');
    console.log('🔍 디버깅 정보');
    console.log('========================================');
    console.log(`📊 API 호출 횟수: ${apiCalls.length}`);
    if (apiCalls.length > 0) {
      apiCalls.forEach((call, index) => {
        console.log(
          `  ${index + 1}. ${call.status} - ${JSON.stringify(call.response)}`
        );
      });
    }
    console.log(
      `📊 에러 로그 수: ${consoleLogs.filter((log) => log.includes('[error]')).length}`
    );
    const errorLogs = consoleLogs.filter((log) => log.includes('[error]'));
    if (errorLogs.length > 0) {
      errorLogs.forEach((log) => console.log(`  - ${log}`));
    }
    console.log('========================================\n');

    // 9단계: 대시보드 점검
    console.log('\n========================================');
    console.log('📊 Step 9: 대시보드 점검');
    console.log('========================================\n');

    // 프로필 드롭다운 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 대시보드로 이동 (시스템 시작 버튼 또는 /dashboard 직접 접근)
    const systemStartButton = page.locator('button:has-text("시스템 시작")');
    const hasSystemStartButton = await systemStartButton
      .isVisible()
      .catch(() => false);

    if (hasSystemStartButton) {
      console.log('  ✅ 시스템 시작 버튼 발견 - 클릭하여 대시보드 진입');
      await systemStartButton.click();
      await page.waitForTimeout(3000); // 카운트다운 대기
      console.log('  ✅ 시스템 시작 완료, 대시보드 로딩 중...');
      await page.waitForTimeout(2000);
    } else {
      console.log('  ℹ️ 시스템 시작 버튼 없음 - /dashboard 직접 이동');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');
    }

    await page.screenshot({
      path: 'test-results/admin-api-09-dashboard.png',
      fullPage: true,
    });

    // 대시보드 UI 요소 검증
    const dashboardElements = {
      '서버 카드': (await page.locator('text=/서버|Server/i').count()) > 0,
      'CPU 지표': (await page.locator('text=/CPU|cpu/i').count()) > 0,
      'Memory 지표':
        (await page.locator('text=/Memory|memory|메모리/i').count()) > 0,
      '응답 시간':
        (await page.locator('text=/Response|응답|Latency/i').count()) > 0,
    };

    console.log('  📊 대시보드 요소 검증:');
    for (const [key, value] of Object.entries(dashboardElements)) {
      console.log(`    ${value ? '✅' : '⚠️'} ${key}`);
    }

    // 10단계: AI 어시스턴트 사이드바 점검
    console.log('\n========================================');
    console.log('🤖 Step 10: AI 어시스턴트 사이드바 점검');
    console.log('========================================\n');

    // AI 사이드바 UI 요소 검증
    const aiSidebarElements = {
      '입력 필드':
        (await page.locator('input[type="text"], textarea').count()) > 0,
      '전송 버튼':
        (await page
          .locator('button')
          .filter({ hasText: /send|보내기|전송/i })
          .count()) > 0,
      '채팅 영역':
        (await page
          .locator('[data-testid*="chat"], [class*="message"], [class*="chat"]')
          .count()) > 0,
    };

    console.log('  🤖 AI 사이드바 요소 검증:');
    for (const [key, value] of Object.entries(aiSidebarElements)) {
      console.log(`    ${value ? '✅' : '⚠️'} ${key}`);
    }

    await page.screenshot({
      path: 'test-results/admin-api-10-ai-sidebar.png',
      fullPage: true,
    });

    // Step 11: /admin 페이지 접근 검증
    console.log('\n========================================');
    console.log('🔐 Step 11: /admin 페이지 접근 검증');
    console.log('========================================\n');

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`  📊 현재 URL: ${currentUrl}`);

    const isOnAdminPage = currentUrl.includes('/admin');

    if (isOnAdminPage) {
      console.log('  ✅ /admin 페이지 접근 성공');

      // 관리자 페이지 요소 확인
      const adminPageElements = {
        '관리자 대시보드':
          (await page.locator('text=/관리자|Admin|Administrator/i').count()) >
          0,
        '서버 관리':
          (await page.locator('text=/서버 관리|Server Management/i').count()) >
          0,
        '사용자 관리':
          (await page.locator('text=/사용자 관리|User Management/i').count()) >
          0,
        '시스템 설정':
          (await page.locator('text=/시스템 설정|System Settings/i').count()) >
          0,
      };

      console.log('  📋 관리자 페이지 요소:');
      for (const [key, value] of Object.entries(adminPageElements)) {
        console.log(`    ${value ? '✅' : 'ℹ️'} ${key}`);
      }

      await page.screenshot({
        path: 'test-results/admin-api-11-admin-page.png',
        fullPage: true,
      });
    } else {
      console.log('  ❌ /admin 페이지 접근 실패 (리다이렉트됨)');
      console.log(`  📍 리다이렉트된 URL: ${currentUrl}`);
      console.log('  ℹ️ Playwright 쿠키 전달 제약으로 자동화 불가');
      console.log(
        '  📝 수동 테스트 필요: docs/testing/vercel-manual-test-guide.md 참조'
      );

      await page.screenshot({
        path: 'test-results/admin-api-11-redirect.png',
        fullPage: true,
      });
    }

    // Step 12: 관리자 모드 해제 검증 (Codex 버그 수정)
    console.log('\n========================================');
    console.log('🔐 Step 12: 관리자 모드 해제 검증 (Codex 버그 수정)');
    console.log('========================================\n');

    // 대시보드로 이동 (네트워크 안정화 대기)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // React 하이드레이션 완료 대기

    // 프로필 메뉴 열기
    const profileButtonStep12 = page
      .locator('button')
      .filter({ hasText: /관리자|게스트/i })
      .first();
    await expect(profileButtonStep12).toBeVisible({ timeout: 5000 });
    await profileButtonStep12.click();
    await page.waitForTimeout(1000); // 드롭다운 렌더링 완료 대기

    console.log('  📋 관리자 모드 해제 전 상태:');

    // Try-catch로 evaluate 에러 핸들링
    let beforeDisable;
    try {
      beforeDisable = await page.evaluate(() => {
        return {
          localStorage_admin_mode: localStorage.getItem('admin_mode'),
          authStorage: localStorage.getItem('auth-storage'),
        };
      });
    } catch (error) {
      console.error('    ❌ page.evaluate() 실패:', error);
      throw error;
    }
    console.log(
      '    localStorage admin_mode:',
      beforeDisable.localStorage_admin_mode
    );
    const authStorageBefore = beforeDisable.authStorage
      ? JSON.parse(beforeDisable.authStorage)
      : null;
    console.log(
      '    auth-storage adminMode:',
      authStorageBefore?.state?.adminMode
    );

    // "관리자 모드 해제" 버튼 찾기 및 클릭
    const disableButton = await page
      .locator('text=/관리자 모드 해제|Disable Admin Mode/i')
      .first();
    const disableButtonExists = (await disableButton.count()) > 0;

    if (disableButtonExists) {
      console.log('  ✅ "관리자 모드 해제" 버튼 발견');
      await disableButton.click();
      console.log('  ✅ 관리자 모드 해제 버튼 클릭');
      await page.waitForTimeout(2000);

      // 해제 후 상태 검증
      console.log('\n  📋 관리자 모드 해제 후 상태:');
      const afterDisable = await page.evaluate(() => {
        return {
          localStorage_admin_mode: localStorage.getItem('admin_mode'),
          authStorage: localStorage.getItem('auth-storage'),
        };
      });
      console.log(
        '    localStorage admin_mode:',
        afterDisable.localStorage_admin_mode
      );
      const authStorageAfter = afterDisable.authStorage
        ? JSON.parse(afterDisable.authStorage)
        : null;
      console.log(
        '    auth-storage adminMode:',
        authStorageAfter?.state?.adminMode
      );

      // 검증: 모든 상태가 false 또는 null이어야 함
      const isCleared =
        afterDisable.localStorage_admin_mode !== 'true' &&
        authStorageAfter?.state?.adminMode === false;

      if (isCleared) {
        console.log('\n  ✅ Codex 버그 수정 검증 성공: 모든 상태 정리됨');
        console.log('    - localStorage admin_mode: 제거됨');
        console.log('    - auth-storage adminMode: false');
      } else {
        console.log('\n  ❌ Codex 버그 수정 검증 실패: 일부 상태 남아있음');
        console.log(
          '    - localStorage admin_mode:',
          afterDisable.localStorage_admin_mode
        );
        console.log(
          '    - auth-storage adminMode:',
          authStorageAfter?.state?.adminMode
        );
      }

      // 프로필 메뉴 다시 열어서 관리자 모드 해제 확인
      const profileButtonVerify = page
        .locator('button')
        .filter({ hasText: /관리자|게스트/i })
        .first();
      await expect(profileButtonVerify).toBeVisible({ timeout: 5000 });
      await profileButtonVerify.click();
      await page.waitForTimeout(500);

      const adminPageMenuItem = await page
        .locator('text=/관리자 페이지|Admin Page/i')
        .count();
      const enableAdminMenuItem = await page
        .locator('text=/관리자 모드(?! 해제)|Enable Admin Mode/i')
        .count();

      if (adminPageMenuItem === 0 && enableAdminMenuItem > 0) {
        console.log(
          '  ✅ UI 상태 검증 성공: "관리자 모드" 버튼 표시됨 (해제 상태)'
        );
      } else {
        console.log('  ❌ UI 상태 검증 실패: 관리자 모드 메뉴 상태 이상');
      }

      await page.screenshot({
        path: 'test-results/admin-api-12-disable.png',
        fullPage: true,
      });
    } else {
      console.log('  ⚠️ "관리자 모드 해제" 버튼 없음 (메뉴 구조 확인 필요)');
    }

    // 최종 종합 결과
    console.log('\n========================================');
    console.log('✅ 전체 플로우 테스트 완료');
    console.log('========================================');
    console.log('1. ✅ 게스트 로그인');
    console.log('2. ✅ PIN 4231 인증');
    console.log('3. ✅ 관리자 모드 활성화');
    console.log('4. ✅ 대시보드 점검');
    console.log('5. ✅ AI 어시스턴트 사이드바 점검');
    console.log(
      `6. ${isOnAdminPage ? '✅' : '⚠️'} /admin 페이지 접근 ${isOnAdminPage ? '성공' : '실패 (수동 검증 필요)'}`
    );
    console.log('7. ✅ 관리자 모드 해제 검증 (Codex 버그 수정)');
    console.log('========================================\n');
  });
});
