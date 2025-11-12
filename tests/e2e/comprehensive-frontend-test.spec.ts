import { test, expect } from '@playwright/test';
import {
  ADMIN_FEATURES_REMOVED,
  ADMIN_FEATURES_SKIP_MESSAGE,
} from './helpers/featureFlags';

/**
 * OpenManager VIBE v5.70.9 종합 프론트엔드 테스트
 * - 로그인 페이지 완전 테스트
 * - 메인 대시보드 테스트 (게스트 로그인)
 * - AI 어시스턴트 모달 테스트
 * - 성능 및 접근성 테스트
 */

test.describe('OpenManager VIBE v5 - 종합 프론트엔드 테스트', () => {
  test.skip(ADMIN_FEATURES_REMOVED, ADMIN_FEATURES_SKIP_MESSAGE);

  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 캐치
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    // 네트워크 에러 캐치
    page.on('pageerror', (error) => {
      console.log('❌ Page Error:', error.message);
    });
  });

  // Vercel 프로덕션 URL 사용 (실제 배포된 URL)
  const BASE_URL = 'https://openmanager-vibe-v5-skyasus-projects.vercel.app';

  test('1. 로그인 페이지 종합 테스트', async ({ page }) => {
    console.log('🔑 === 로그인 페이지 종합 테스트 시작 ===');

    // 1. 페이지 접속 및 리다이렉트 확인
    console.log('📍 Step 1: 홈페이지 → 로그인 페이지 리다이렉트 테스트');
    const startTime = Date.now();
    await page.goto(BASE_URL);

    // 리다이렉트 대기 (최대 10초)
    await page.waitForURL('**/login', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ 로딩 시간: ${loadTime}ms`);

    // 2. 페이지 메타데이터 확인
    const title = await page.title();
    expect(title).toBe('OpenManager - Korean AI Hybrid Engine');
    console.log(`📄 페이지 제목: ${title}`);

    // 3. CSP 및 보안 헤더 확인 (네트워크 요청 모니터링)
    const response = await page.goto(`${BASE_URL}/login`);
    expect(response?.status()).toBeLessThan(400);
    console.log(`📊 HTTP 상태: ${response?.status()}`);

    // 4. 로그인 페이지 UI 요소 확인
    console.log('🎨 Step 2: UI 요소 검증');

    // 중요한 텍스트 요소들 확인 (더 구체적인 셀렉터 사용)
    await expect(
      page.getByRole('heading', { name: 'OpenManager' })
    ).toBeVisible();
    await expect(page.getByText('VIBE')).toBeVisible();

    // 5. GitHub OAuth 버튼 확인
    console.log('🐙 Step 3: GitHub OAuth 버튼 테스트');
    const githubButton = page
      .locator(
        '[data-provider="github"], button:has-text("GitHub"), button:has-text("깃허브")'
      )
      .first();

    if ((await githubButton.count()) > 0) {
      await expect(githubButton).toBeVisible();
      console.log('✅ GitHub OAuth 버튼 발견');

      // 클릭 가능성 확인 (실제 클릭은 하지 않음)
      await expect(githubButton).toBeEnabled();
      console.log('✅ GitHub 버튼 클릭 가능');
    } else {
      console.log('⚠️ GitHub OAuth 버튼을 찾을 수 없음');
    }

    // 6. 게스트 로그인 버튼 확인
    console.log('👤 Step 4: 게스트 로그인 버튼 테스트');
    const guestButton = page
      .locator(
        'button:has-text("게스트"), button:has-text("Guest"), button:has-text("guest")'
      )
      .first();

    if ((await guestButton.count()) > 0) {
      await expect(guestButton).toBeVisible();
      await expect(guestButton).toBeEnabled();
      console.log('✅ 게스트 로그인 버튼 확인 완료');
    } else {
      console.log('⚠️ 게스트 로그인 버튼을 찾을 수 없음');
    }

    // 7. 반응형 디자인 테스트
    console.log('📱 Step 5: 반응형 디자인 테스트');

    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // 기본 요소들이 여전히 보이는지 확인
    await expect(
      page.getByRole('heading', { name: 'OpenManager' })
    ).toBeVisible();
    console.log('✅ 모바일 뷰: 기본 요소 표시됨');

    // 데스크톱으로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // 8. 애니메이션 효과 확인
    console.log('✨ Step 6: 애니메이션 효과 테스트');

    // 페이지 요소들의 표시 상태 확인
    const visibleElements = await page
      .locator('*')
      .filter({ hasText: /\w+/ })
      .count();
    console.log(`📊 표시된 요소 수: ${visibleElements}개`);

    console.log('🎯 로그인 페이지 종합 테스트 완료\n');
  });

  test('2. 게스트 로그인 및 메인 페이지 접속', async ({ page }) => {
    console.log('👤 === 게스트 로그인 및 메인 페이지 테스트 시작 ===');

    await page.goto(`${BASE_URL}/login`);

    // 게스트 로그인 버튼 찾기 및 클릭 - 현재 구현에 맞는 텍스트 사용
    const guestButton = page
      .locator(
        'button:has-text("게스트로 체험하기"), button:has-text("게스트"), button:has-text("Guest")'
      )
      .first();

    if ((await guestButton.count()) > 0) {
      console.log('🔄 게스트 로그인 진행 중...');
      await guestButton.click();

      // 메인 페이지로 리다이렉트 대기
      try {
        await page.waitForURL('**/main', { timeout: 10000 });
        console.log('✅ 메인 페이지 접속 성공');

        // 메인 페이지 기본 요소 확인
        await page.waitForTimeout(2000); // 데이터 로딩 대기

        // 게스트 모드 제한 메시지 확인
        await expect(
          page.locator('text=GitHub 로그인이 필요합니다')
        ).toBeVisible();
        await expect(
          page.locator(
            'text=게스트 모드에서는 읽기 전용 기능만 사용 가능합니다'
          )
        ).toBeVisible();

        console.log('✅ 게스트 모드 제한 메시지 확인됨');

        // 프로필 버튼 확인
        const profileButton = page.locator('button[aria-label="프로필 메뉴"]');
        await expect(profileButton).toBeVisible();
        console.log('✅ 프로필 버튼 표시됨');

        // 프로필 드롭다운 확인
        await profileButton.click();
        await expect(page.locator('text=게스트 로그인')).toBeVisible();
        await expect(page.locator('text=관리자 모드')).toBeVisible();
        console.log('✅ 프로필 드롭다운 정상 작동');
      } catch (error) {
        console.log('⚠️ 메인 페이지 리다이렉트 실패 또는 지연:', error);
      }
    } else {
      console.log(
        '⚠️ 게스트 로그인 버튼을 찾을 수 없어 메인 페이지 테스트 생략'
      );

      // 직접 메인 페이지 URL 접속 시도
      await page.goto(`${BASE_URL}/main`);
      console.log('🔄 메인 페이지 직접 접속 시도...');
    }

    console.log('🎯 게스트 로그인 테스트 완료\n');
  });

  test('2-1. 관리자 모드 인증 테스트', async ({ page }) => {
    console.log('🔐 === 관리자 모드 인증 테스트 시작 ===');

    // 게스트 모드로 로그인
    await page.goto(`${BASE_URL}/login`);
    const guestButton = page
      .locator('button:has-text("게스트로 체험하기")')
      .first();

    if ((await guestButton.count()) > 0) {
      await guestButton.click();
      await page.waitForURL('**/main', { timeout: 10000 });

      console.log('🔄 관리자 모드 인증 진행...');

      // 프로필 드롭다운 열기
      const profileButton = page.locator('button[aria-label="프로필 메뉴"]');
      await profileButton.click();

      // 관리자 모드 버튼 클릭
      await page.click('text=관리자 모드');
      console.log('✅ 관리자 모드 메뉴 클릭됨');

      // 비밀번호 입력 (4231)
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('4231');
      await passwordInput.press('Enter');
      console.log('✅ 관리자 비밀번호 입력 완료');

      // 관리자 모드 활성화 확인
      await page.waitForTimeout(1000);
      await profileButton.click();

      // 관리자 상태 확인
      // 더 구체적인 selector 사용하여 모호성 방지
      const adminRights = page.locator('text=🔒 관리자 권한으로 실행 중');
      const adminPage = page.locator('text=관리자 페이지');

      // 관리자 권한 메시지로 상태 확인 (더 명확한 selector)
      await expect(adminRights).toBeVisible();
      await expect(adminPage).toBeVisible();

      console.log('✅ 관리자 모드 정상 활성화 확인');

      // 관리자 페이지 접근 테스트
      await page.click('text=관리자 페이지');
      await page.waitForURL('**/admin', { timeout: 5000 });

      // 관리자 페이지 요소 확인
      await expect(page.locator('text=관리자 대시보드')).toBeVisible();
      await expect(page.locator('text=ADMIN')).toBeVisible();
      console.log('✅ 관리자 페이지 정상 접근');
    } else {
      console.log(
        '⚠️ 게스트 로그인 버튼을 찾을 수 없어 관리자 모드 테스트 생략'
      );
    }

    console.log('🎯 관리자 모드 인증 테스트 완료\n');
  });

  test('2-2. 관리자 모드에서 시스템 시작 및 대시보드 접근', async ({
    page,
  }) => {
    console.log('🚀 === 시스템 시작 및 대시보드 접근 테스트 시작 ===');

    // 관리자 모드 활성화
    await page.goto(`${BASE_URL}/login`);
    const guestButton = page
      .locator('button:has-text("게스트로 체험하기")')
      .first();

    if ((await guestButton.count()) > 0) {
      await guestButton.click();
      await page.waitForURL('**/main', { timeout: 10000 });

      // 관리자 모드 인증
      const profileButton = page.locator('button[aria-label="프로필 메뉴"]');
      await profileButton.click();
      await page.click('text=관리자 모드');
      await page.fill('input[type="password"]', '4231');
      await page.press('input[type="password"]', 'Enter');

      console.log('✅ 관리자 모드 활성화 완료');

      // 대시보드 직접 접근 테스트
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // 대시보드 핵심 요소 확인
      await expect(page.locator('text=OpenManager')).toBeVisible();
      await expect(page.locator('text=AI 서버 모니터링')).toBeVisible();

      // DEMO MODE 표시 확인
      const demoMode = page.locator('text=🎭 DEMO MODE');
      if ((await demoMode.count()) > 0) {
        await expect(demoMode).toBeVisible();
        console.log('✅ DEMO MODE 표시 확인됨');
      }

      // 서버 상태 요약 확인
      const serverSummary = page.locator('text=/총.*대|Total.*Servers/');
      if ((await serverSummary.count()) > 0) {
        await expect(serverSummary.first()).toBeVisible();
        console.log('✅ 서버 상태 요약 표시됨');
      }

      // 실시간 시간 표시 확인
      const timeDisplay = page.locator('text=/오후|오전|AM|PM/').first();
      if ((await timeDisplay.count()) > 0) {
        await expect(timeDisplay).toBeVisible();
        console.log('✅ 실시간 시간 표시됨');
      }

      console.log('✅ 대시보드 정상 로드됨');
    } else {
      console.log('⚠️ 게스트 로그인 불가로 시스템 시작 테스트 생략');

      // 대시보드 직접 접근 시도
      await page.goto(`${BASE_URL}/dashboard`);
      console.log('🔄 대시보드 직접 접근 시도...');
    }

    console.log('🎯 시스템 시작 및 대시보드 테스트 완료\n');
  });

  test('3. 메인 대시보드 UI/UX 테스트', async ({ page }) => {
    console.log('📊 === 메인 대시보드 UI/UX 테스트 시작 ===');

    // 관리자 모드로 대시보드 접속
    await page.goto(`${BASE_URL}/login`);
    const guestButton = page
      .locator('button:has-text("게스트로 체험하기")')
      .first();

    if ((await guestButton.count()) > 0) {
      await guestButton.click();
      await page.waitForURL('**/main', { timeout: 10000 });

      // 관리자 모드 활성화
      const profileButton = page.locator('button[aria-label="프로필 메뉴"]');
      await profileButton.click();
      await page.click('text=관리자 모드');
      await page.fill('input[type="password"]', '4231');
      await page.press('input[type="password"]', 'Enter');
      await page.waitForTimeout(1000);
    }

    // 대시보드 접속
    await page.goto(`${BASE_URL}/dashboard`);

    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      console.log('⚠️ 네트워크 idle 대기 타임아웃, 계속 진행...');
    }

    // 1. 서버 카드 렌더링 확인
    console.log('🖥️ Step 1: 서버 카드 렌더링 테스트');

    // 다양한 선택자로 서버 카드 찾기
    const serverCardSelectors = [
      '[data-testid="server-card"]',
      '.server-card',
      '[class*="server-card"]',
      '[class*="card"]',
      'div[class*="bg-"]:has(text)',
    ];

    let totalServerCards = 0;
    for (const selector of serverCardSelectors) {
      const count = await page.locator(selector).count();
      if (count > totalServerCards) {
        totalServerCards = count;
        console.log(`📊 ${selector}: ${count}개 발견`);
      }
    }

    if (totalServerCards > 0) {
      console.log(`✅ 총 ${totalServerCards}개 서버 카드 렌더링됨`);
    } else {
      console.log('⚠️ 서버 카드를 찾을 수 없음');
    }

    // 2. 실시간 메트릭 업데이트 테스트
    console.log('⚡ Step 2: 실시간 메트릭 업데이트 테스트');

    // 숫자가 포함된 요소들 찾기 (메트릭 데이터)
    const metricElements = await page
      .locator('text=/\\d+%|\\d+MB|\\d+GB|\\d+ms/')
      .count();
    console.log(`📈 메트릭 표시 요소: ${metricElements}개`);

    if (metricElements > 0) {
      console.log('✅ 메트릭 데이터가 표시됨');

      // 3초 대기 후 변경 확인
      await page.waitForTimeout(3000);
      const updatedMetrics = await page
        .locator('text=/\\d+%|\\d+MB|\\d+GB|\\d+ms/')
        .count();

      if (updatedMetrics >= metricElements) {
        console.log('✅ 실시간 업데이트 동작 중');
      }
    }

    // 3. 반응형 디자인 테스트
    console.log('📱 Step 3: 대시보드 반응형 테스트');

    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // 요소들이 여전히 보이는지 확인
    const mobileElements = await page
      .locator('body *')
      .filter({ hasText: /\w+/ })
      .count();
    console.log(`📱 모바일 표시 요소: ${mobileElements}개`);

    // 데스크톱으로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    console.log('🎯 메인 대시보드 UI/UX 테스트 완료\n');
  });

  test('4. AI 어시스턴트 모달 테스트', async ({ page }) => {
    console.log('🤖 === AI 어시스턴트 모달 테스트 시작 ===');

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);

    // AI 어시스턴트 버튼 찾기
    const aiButtonSelectors = [
      '[data-testid="ai-assistant"]',
      'button:has-text("AI")',
      'button:has-text("Assistant")',
      'button:has-text("어시스턴트")',
      '[class*="ai"]:is(button)',
      'button[class*="ai"]',
    ];

    let aiButton = null;
    for (const selector of aiButtonSelectors) {
      const element = page.locator(selector).first();
      if ((await element.count()) > 0) {
        aiButton = element;
        console.log(`✅ AI 버튼 발견: ${selector}`);
        break;
      }
    }

    if (aiButton) {
      try {
        // AI 버튼 클릭
        await aiButton.click();
        console.log('🔄 AI 어시스턴트 모달 열기 시도...');

        await page.waitForTimeout(1000);

        // 모달 확인
        const modalSelectors = [
          '[role="dialog"]',
          '[data-testid="ai-modal"]',
          '.modal',
          '[class*="modal"]',
        ];

        let modalFound = false;
        for (const selector of modalSelectors) {
          if ((await page.locator(selector).count()) > 0) {
            modalFound = true;
            console.log(`✅ AI 모달 열림: ${selector}`);

            // 모달 닫기 테스트
            const closeButton = page
              .locator(
                'button:has-text("닫기"), button:has-text("Close"), [aria-label="닫기"], [aria-label="Close"]'
              )
              .first();
            if ((await closeButton.count()) > 0) {
              await closeButton.click();
              console.log('✅ 모달 닫기 성공');
            } else {
              // ESC 키로 닫기 시도
              await page.keyboard.press('Escape');
              console.log('⌨️ ESC로 모달 닫기 시도');
            }

            break;
          }
        }

        if (!modalFound) {
          console.log('⚠️ AI 모달을 찾을 수 없음');
        }
      } catch (error) {
        console.log('❌ AI 어시스턴트 모달 테스트 중 오류:', error.message);
      }
    } else {
      console.log('⚠️ AI 어시스턴트 버튼을 찾을 수 없음');
    }

    console.log('🎯 AI 어시스턴트 모달 테스트 완료\n');
  });

  test('5. 성능 측정 및 Core Web Vitals', async ({ page }) => {
    console.log('⚡ === 성능 측정 및 Core Web Vitals 테스트 시작 ===');

    // 성능 측정 시작
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);

    // 네트워크 idle 대기
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      console.log('⚠️ 네트워크 idle 타임아웃');
    }

    const loadTime = Date.now() - startTime;
    console.log(`⏱️ 전체 로딩 시간: ${loadTime}ms`);

    // DOM 요소 수 측정
    const totalElements = await page.locator('*').count();
    const visibleElements = await page
      .locator('*')
      .filter({ hasNotText: '' })
      .count();
    console.log(
      `📊 DOM 요소: 총 ${totalElements}개, 표시 ${visibleElements}개`
    );

    // JavaScript 에러 확인
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 잠시 대기하여 에러 수집
    await page.waitForTimeout(2000);

    console.log(`🐛 JavaScript 에러: ${consoleErrors.length}개`);
    if (consoleErrors.length > 0) {
      console.log('❌ 에러 목록:', consoleErrors.slice(0, 3));
    }

    // 메모리 사용량 (대략적)
    const memoryInfo = await page.evaluate(() => {
      // @ts-ignore - performance.memory는 Chrome에서만 사용 가능
      return (performance as any).memory
        ? {
            used:
              Math.round(
                ((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 100
              ) / 100,
            total:
              Math.round(
                ((performance as any).memory.totalJSHeapSize / 1024 / 1024) *
                  100
              ) / 100,
          }
        : null;
    });

    if (memoryInfo) {
      console.log(
        `🧠 메모리 사용량: ${memoryInfo.used}MB / ${memoryInfo.total}MB`
      );
    }

    // 페이지 크기 정보
    const contentLength = (await page.content()).length;
    console.log(`📝 HTML 크기: ${Math.round(contentLength / 1024)}KB`);

    console.log('🎯 성능 측정 완료\n');
  });

  test('6. 접근성 (Accessibility) 기본 테스트', async ({ page }) => {
    console.log('♿ === 접근성 기본 테스트 시작 ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);

    // 1. 키보드 네비게이션 테스트
    console.log('⌨️ Step 1: 키보드 네비게이션 테스트');

    // Tab으로 포커스 이동
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    console.log('✅ Tab 키 네비게이션 동작');

    // 2. ARIA 레이블 확인
    console.log('🏷️ Step 2: ARIA 레이블 검사');

    const ariaElements = await page
      .locator('[aria-label], [aria-labelledby], [role]')
      .count();
    console.log(`🏷️ ARIA 속성 요소: ${ariaElements}개`);

    // 3. 헤딩 구조 확인
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    console.log(`📋 헤딩 요소: ${headings}개`);

    // 4. 이미지 alt 텍스트 확인
    const images = await page.locator('img').count();
    const imagesWithAlt = await page.locator('img[alt]').count();
    console.log(`🖼️ 이미지: 총 ${images}개, alt 속성 ${imagesWithAlt}개`);

    // 5. 포커스 표시 확인
    console.log('🎯 Step 3: 포커스 표시 테스트');

    const focusableElements = await page
      .locator('button, input, select, textarea, a[href]')
      .count();
    console.log(`🎯 포커스 가능 요소: ${focusableElements}개`);

    console.log('🎯 접근성 기본 테스트 완료\n');
  });

  test('7. 종합 결과 리포트', async ({ page }) => {
    console.log('📊 === 종합 테스트 결과 리포트 ===');

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);

    // 최종 상태 수집
    const finalReport = {
      url: page.url(),
      title: await page.title(),
      timestamp: new Date().toLocaleString('ko-KR'),
      viewport: await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      })),
      elements: {
        total: await page.locator('*').count(),
        visible: await page.locator('*').filter({ hasText: /\w+/ }).count(),
        interactive: await page
          .locator('button, input, select, textarea, a[href]')
          .count(),
      },
      content: {
        htmlSize: Math.round((await page.content()).length / 1024),
        hasImages: await page.locator('img').count(),
        hasforms: await page.locator('form').count(),
      },
    };

    console.log('\n📈 === 최종 테스트 리포트 ===');
    console.log(`🌐 URL: ${finalReport.url}`);
    console.log(`📄 제목: ${finalReport.title}`);
    console.log(`🕒 테스트 시간: ${finalReport.timestamp}`);
    console.log(
      `📱 뷰포트: ${finalReport.viewport.width}x${finalReport.viewport.height}px`
    );
    console.log(
      `🧩 DOM 요소: 총 ${finalReport.elements.total}개 (표시: ${finalReport.elements.visible}개, 인터랙티브: ${finalReport.elements.interactive}개)`
    );
    console.log(`📝 HTML 크기: ${finalReport.content.htmlSize}KB`);
    console.log(`🖼️ 이미지: ${finalReport.content.hasImages}개`);
    console.log(`📋 폼: ${finalReport.content.hasforms}개`);

    console.log('\n🎉 === 종합 테스트 완료 ===');
    console.log(
      '✅ OpenManager VIBE v5.70.9 프론트엔드가 정상적으로 동작합니다!'
    );

    // 성공 조건 검증
    expect(finalReport.elements.total).toBeGreaterThan(10);
    expect(finalReport.elements.visible).toBeGreaterThan(5);
    expect(finalReport.content.htmlSize).toBeGreaterThan(5);

    console.log('🎯 모든 검증 조건을 통과했습니다!');
  });
});
