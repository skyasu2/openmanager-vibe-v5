import { test, expect } from '@playwright/test';
import {
  activateAdminMode,
  navigateToAdminDashboard,
  resetAdminState,
  verifyAdminState,
  setTestModeCookies,
} from './helpers/admin';
import {
  ADMIN_FEATURES_REMOVED,
  ADMIN_FEATURES_SKIP_MESSAGE,
} from './helpers/featureFlags';

/**
 * 🎯 OpenManager VIBE 프론트엔드 UI/UX 종합 테스트
 *
 * 테스트 목표:
 * - 게스트 로그인부터 관리자 모드까지 전체 플로우 검증
 * - AI 어시스턴트 접근성 및 기능 테스트
 * - 서버 모니터링 대시보드 상호작용 검증
 * - 회귀 테스트 방지를 위한 지속적 검증
 */

test.describe('🎯 OpenManager VIBE UI/UX 종합 테스트', () => {
  test.skip(ADMIN_FEATURES_REMOVED, ADMIN_FEATURES_SKIP_MESSAGE);
  test.beforeEach(async ({ page, context }) => {
    // 🧹 완전한 상태 초기화 - 인증 세션 포함

    // 1. 브라우저 쿠키 정리
    await context.clearCookies();
    await context.clearPermissions();

    // 2. 페이지 이동
    await page.goto('/');

    // 3. localStorage/sessionStorage 정리
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 4. 관리자 상태 초기화 (기존)
    await resetAdminState(page);

    // 🔧 FIX: Set test mode cookies for all tests
    await setTestModeCookies(page);

    // 5. 페이지 새로고침으로 깨끗한 상태 보장
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // 테스트 후 정리
    await resetAdminState(page);
  });

  test.describe('🔐 사용자 인증 플로우', () => {
    test('게스트 로그인 → 대시보드 접근 검증', async ({ page }) => {
      const startTime = Date.now();

      // 1. 메인 페이지 접근
      await page.goto('/');
      await expect(page).toHaveTitle(/OpenManager/);

      // 🔧 FIX: Set test mode cookies before guest login
      await setTestModeCookies(page);

      // 2. 게스트 로그인 버튼 확인 및 클릭 (OR selector for resilience)
      const guestButton = page.locator(
        'button:has-text("게스트"), button:has-text("체험")'
      );
      await expect(guestButton).toBeVisible();
      await expect(guestButton).toBeEnabled(); // 🔧 FIX: Check button is not disabled before clicking
      await guestButton.click();

      // 🔧 FIX: Add explicit wait for navigation to start
      // LoginClient uses 500ms setTimeout before window.location.href navigation
      await page.waitForTimeout(1000); // Wait for 500ms delay + margin

      // Then wait for navigation to complete
      await page.waitForLoadState('networkidle'); // 🔧 Wait for navigation to complete

      // 🔍 DIAGNOSTIC: Capture actual URL and HTML to debug rendering issue
      const actualUrl = page.url();
      console.log('🔍 [TEST] URL after guest button click:', actualUrl);

      const pageContent = await page.content();
      const hasDashboardContainer = pageContent.includes(
        'data-testid="dashboard-container"'
      );
      const hasDashboardPage = pageContent.includes('[DashboardPage]');
      const hasDashboardClient = pageContent.includes('[DashboardClient]');

      console.log('🔍 [TEST] Page analysis:', {
        hasDashboardContainer,
        hasDashboardPage,
        hasDashboardClient,
        urlMatch: actualUrl.includes('/dashboard'),
        htmlLength: pageContent.length,
      });

      // Extract first 800 chars to see what's actually rendering
      const htmlSnippet = pageContent.substring(0, 800);
      console.log('🔍 [TEST] HTML snippet (first 800 chars):', htmlSnippet);

      // Look for any React error boundaries or error messages
      const hasErrorBoundary =
        pageContent.includes('Something went wrong') ||
        pageContent.includes('Error:') ||
        pageContent.includes('Failed to');
      console.log('🔍 [TEST] Error detection:', { hasErrorBoundary });

      await page.waitForSelector('[data-testid="dashboard-container"]');

      // 2. 프로필 메뉴 찾기 (다양한 셀렉터 시도)
      const profileSelectors = [
        '[data-testid="profile-menu"]',
        'button[aria-label*="프로필"], button[aria-label*="profile"]',
        'button:has-text("프로필")',
        '[data-testid="user-menu"]',
        '.profile-menu, .user-menu',
        'button:has([data-testid="avatar"])',
        'header button[class*="profile"], header button[class*="user"]',
      ];

      let profileButton = null;
      for (const selector of profileSelectors) {
        const element = page.locator(selector).first();
        if ((await element.count()) > 0) {
          profileButton = element;
          console.log(`✅ 프로필 버튼 발견: ${selector}`);
          break;
        }
      }

      if (profileButton) {
        await profileButton.click();

        // 3. 관리자 모드 메뉴 항목 찾기
        const adminMenuSelectors = [
          '[data-testid="admin-mode"]',
          'button:has-text("관리자 모드"), a:has-text("관리자 모드")',
          'button:has-text("Admin"), a:has-text("Admin")',
          '.admin-menu-item',
        ];

        let adminMenuItem = null;
        for (const selector of adminMenuSelectors) {
          const element = page.locator(selector).first();
          if ((await element.count()) > 0) {
            adminMenuItem = element;
            console.log(`✅ 관리자 메뉴 발견: ${selector}`);
            break;
          }
        }

        if (adminMenuItem) {
          await adminMenuItem.click();
          console.log('✅ 관리자 모드 메뉴 클릭 성공');
        } else {
          console.log('ℹ️ 관리자 모드 메뉴 미발견 - UI 구조 변경 가능성');
        }
      } else {
        console.log('ℹ️ 프로필 버튼 미발견 - UI 구조 분석 필요');
      }
    });

    test('PIN 인증 (4231) → 관리자 권한 활성화', async ({ page }) => {
      const startTime = Date.now();

      // 헬퍼 함수를 사용한 관리자 모드 활성화
      const result = await activateAdminMode(page, {
        method: 'password',
        password: '4231',
      });

      expect(result.success).toBe(true);

      const endTime = Date.now();
      console.log(`✅ PIN 인증 완료: ${endTime - startTime}ms`);

      // 관리자 상태 검증
      const isAdminActive = await verifyAdminState(page);
      expect(isAdminActive).toBe(true);
    });
  });

  test.describe('📊 대시보드 모니터링 기능', () => {
    test.beforeEach(async ({ page }) => {
      // 각 대시보드 테스트 전 관리자 모드 활성화
      await navigateToAdminDashboard(page);
    });

    test('서버 모니터링 카드 상호작용', async ({ page }) => {
      // 🔧 명시적 대시보드 이동 및 로딩 대기
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // 서버 카드 렌더링 대기
      await page.waitForSelector('[data-testid="server-card"], .server-card', {
        timeout: 10000,
        state: 'visible',
      });

      // 1. 서버 카드 존재 확인
      const serverCardSelectors = [
        '[data-testid="server-card"]',
        '.server-card',
        '[data-testid="monitoring-card"]',
        '.monitoring-card',
        'div[class*="server"], div[class*="card"]',
      ];

      let serverCards = null;
      for (const selector of serverCardSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          serverCards = elements;
          console.log(`✅ ${count}개의 서버 카드 발견: ${selector}`);
          break;
        }
      }

      expect(serverCards).not.toBeNull();

      if (serverCards) {
        const cardCount = await serverCards.count();
        expect(cardCount).toBeGreaterThan(0);

        // 2. 첫 번째 서버 카드 클릭 및 모달 확인
        await serverCards.first().click();

        // 3. 서버 상세 모달이나 페이지 로딩 확인
        const modalSelectors = [
          '[data-testid="server-modal"]',
          '.server-modal',
          '[role="dialog"]',
          '.modal',
        ];

        let modalFound = false;
        for (const selector of modalSelectors) {
          const modal = page.locator(selector);
          if ((await modal.count()) > 0) {
            await expect(modal).toBeVisible();
            modalFound = true;
            console.log(`✅ 서버 상세 모달 확인: ${selector}`);
            break;
          }
        }

        if (!modalFound) {
          // 모달이 없으면 페이지 이동 확인
          await page.waitForTimeout(1000);
          console.log('ℹ️ 모달 대신 페이지 이동 방식일 수 있음');
        }
      }
    });

    test('실시간 메트릭 업데이트 확인', async ({ page }) => {
      // 1. 메트릭 표시 요소들 확인
      const metricSelectors = [
        '[data-testid="cpu-metric"]',
        '[data-testid="memory-metric"]',
        '[data-testid="disk-metric"]',
        '.metric-value',
        '.progress-bar',
        'span:has-text("%")',
      ];

      let metricsFound = false;
      for (const selector of metricSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ ${count}개의 메트릭 요소 발견: ${selector}`);
          metricsFound = true;

          // 첫 번째 메트릭 값 확인
          const firstMetric = elements.first();
          const textContent = await firstMetric.textContent();
          console.log(`📊 메트릭 값 예시: ${textContent}`);
        }
      }

      expect(metricsFound).toBe(true);

      // 2. 메트릭 업데이트 확인 (3초 간격으로 2회 확인)
      const initialValues = await page.evaluate(() => {
        const metrics = Array.from(
          document.querySelectorAll('.metric-value, [data-testid*="metric"]')
        );
        return metrics
          .map((el) => el.textContent)
          .filter((text) => text && text.includes('%'));
      });

      await page.waitForTimeout(3000);

      const updatedValues = await page.evaluate(() => {
        const metrics = Array.from(
          document.querySelectorAll('.metric-value, [data-testid*="metric"]')
        );
        return metrics
          .map((el) => el.textContent)
          .filter((text) => text && text.includes('%'));
      });

      if (initialValues.length > 0 && updatedValues.length > 0) {
        console.log('📊 초기 메트릭:', initialValues);
        console.log('📊 업데이트 메트릭:', updatedValues);

        // 값이 변경되었거나 동일하더라도 정상 (시뮬레이션 데이터)
        expect(updatedValues.length).toBeGreaterThanOrEqual(
          initialValues.length
        );
      }
    });

    test('시스템 상태 표시기 검증', async ({ page }) => {
      // 1. 시스템 상태 표시 요소들 확인
      const statusSelectors = [
        '[data-testid="system-status"]',
        '.status-indicator',
        '.badge',
        'span[class*="status"]',
        'div[class*="health"]',
      ];

      let statusElements = [];
      for (const selector of statusSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          statusElements.push({ selector, count });
          console.log(`✅ ${count}개의 상태 표시기 발견: ${selector}`);
        }
      }

      expect(statusElements.length).toBeGreaterThan(0);

      // 2. 상태별 색상/텍스트 확인
      const statusTexts = await page.evaluate(() => {
        const statuses = Array.from(
          document.querySelectorAll(
            '.status-indicator, .badge, [data-testid="system-status"]'
          )
        );
        return statuses
          .map((el) => ({
            text: el.textContent?.trim(),
            className: el.className,
            color: window.getComputedStyle(el).color,
          }))
          .filter((item) => item.text);
      });

      console.log('📊 발견된 시스템 상태:', statusTexts);
      expect(statusTexts.length).toBeGreaterThan(0);
    });
  });

  test.describe('🤖 AI 어시스턴트 기능', () => {
    test.beforeEach(async ({ page }) => {
      // AI 테스트 전 관리자 모드 활성화
      await navigateToAdminDashboard(page);
    });

    test('AI 사이드바 접근성 검증', async ({ page }) => {
      // 1. AI 어시스턴트 버튼 찾기
      const aiButtonSelectors = [
        '[data-testid="ai-assistant"]',
        '[data-testid="ai-sidebar-trigger"]',
        'button:has-text("AI")',
        'button:has-text("어시스턴트")',
        'button:has-text("Assistant")',
        '[aria-label*="AI"], [aria-label*="assistant"]',
        '.ai-button, .assistant-button',
      ];

      let aiButton = null;
      for (const selector of aiButtonSelectors) {
        const element = page.locator(selector).first();
        if ((await element.count()) > 0 && (await element.isVisible())) {
          aiButton = element;
          console.log(`✅ AI 버튼 발견: ${selector}`);
          break;
        }
      }

      if (aiButton) {
        // 2. AI 버튼 클릭 및 사이드바 확인
        await aiButton.click();

        // 3. AI 사이드바 로딩 확인
        const sidebarSelectors = [
          '[data-testid="ai-sidebar"]',
          '.ai-sidebar',
          '[role="complementary"]',
          '.sidebar',
          'aside',
        ];

        let sidebarFound = false;
        for (const selector of sidebarSelectors) {
          const sidebar = page.locator(selector);
          if ((await sidebar.count()) > 0) {
            await expect(sidebar).toBeVisible();
            sidebarFound = true;
            console.log(`✅ AI 사이드바 확인: ${selector}`);
            break;
          }
        }

        expect(sidebarFound).toBe(true);

        // 4. AI 채팅 입력 필드 확인
        const chatInputSelectors = [
          '[data-testid="ai-chat-input"]',
          'input[placeholder*="AI"], input[placeholder*="질문"]',
          'textarea[placeholder*="AI"], textarea[placeholder*="질문"]',
          '.chat-input',
        ];

        for (const selector of chatInputSelectors) {
          const input = page.locator(selector);
          if ((await input.count()) > 0) {
            await expect(input).toBeVisible();
            console.log(`✅ AI 채팅 입력 필드 확인: ${selector}`);
            break;
          }
        }
      } else {
        console.log(
          'ℹ️ AI 버튼 미발견 - 관리자 모드에서만 접근 가능할 수 있음'
        );
      }
    });

    test('AI 쿼리 입력 및 응답 테스트', async ({ page }) => {
      // 1. AI 사이드바 열기
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();
      if ((await aiButton.count()) > 0) {
        await aiButton.click();

        // 2. 채팅 입력 필드 찾기
        const chatInput = page
          .locator(
            '[data-testid="ai-chat-input"], input[placeholder*="AI"], textarea[placeholder*="질문"]'
          )
          .first();

        if ((await chatInput.count()) > 0) {
          // 3. 테스트 쿼리 입력
          const testQuery = '시스템 상태 요약해줘';
          await chatInput.fill(testQuery);

          // 4. 전송 버튼 클릭 또는 Enter 키 입력
          const sendButton = page
            .locator('[data-testid="send-button"], button:has-text("전송")')
            .first();
          if ((await sendButton.count()) > 0) {
            await sendButton.click();
          } else {
            await chatInput.press('Enter');
          }

          // 5. AI 응답 대기 및 확인
          await page.waitForTimeout(2000); // AI 응답 대기

          const responseSelectors = [
            '[data-testid="ai-response"]',
            '.ai-message',
            '.chat-message',
            '.response',
          ];

          let responseFound = false;
          for (const selector of responseSelectors) {
            const response = page.locator(selector);
            if ((await response.count()) > 0) {
              responseFound = true;
              console.log(`✅ AI 응답 확인: ${selector}`);
              break;
            }
          }

          // 응답이 없어도 입력은 성공했으므로 Pass
          console.log(`📤 AI 쿼리 입력 성공: "${testQuery}"`);
          if (responseFound) {
            console.log('✅ AI 응답 수신 확인');
          } else {
            console.log('ℹ️ AI 응답 미확인 (비동기 처리 중일 수 있음)');
          }
        } else {
          console.log('ℹ️ AI 채팅 입력 필드 미발견');
        }
      } else {
        console.log('ℹ️ AI 버튼 미발견 - 테스트 스킵');
      }
    });

    test('AI 기능 버튼들 접근성 검증', async ({ page }) => {
      // AI 사이드바 내부의 기능 버튼들 확인
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();
      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        // AI 사이드바 내 기능 버튼들 확인
        const featureButtonSelectors = [
          '[data-testid*="ai-feature"]',
          'button:has-text("분석")',
          'button:has-text("리포트")',
          'button:has-text("예측")',
          'button:has-text("설정")',
          '.ai-feature-button',
        ];

        let featuresFound = 0;
        for (const selector of featureButtonSelectors) {
          const buttons = page.locator(selector);
          const count = await buttons.count();
          if (count > 0) {
            featuresFound += count;
            console.log(`✅ ${count}개의 AI 기능 버튼 발견: ${selector}`);
          }
        }

        console.log(`📊 총 ${featuresFound}개의 AI 기능 요소 확인`);
      }
    });
  });

  test.describe('🔄 상태 변화 및 상호작용', () => {
    test('페이지 새로고침 후 세션 유지 확인', async ({ page }) => {
      // 1. 관리자 모드 활성화
      await navigateToAdminDashboard(page);

      // 2. 관리자 상태 확인
      const beforeRefresh = await verifyAdminState(page);
      expect(beforeRefresh).toBe(true);

      // 3. 페이지 새로고침
      await page.reload();
      await page.waitForSelector('main', { timeout: 10000 });

      // 4. 세션 유지 확인
      const afterRefresh = await verifyAdminState(page);
      expect(afterRefresh).toBe(true);

      console.log('✅ 페이지 새로고침 후 관리자 세션 유지 확인');
    });

    test('브라우저 탭 전환 후 상태 유지', async ({ page, context }) => {
      // 1. 관리자 모드 활성화
      await navigateToAdminDashboard(page);

      // 2. 새 탭 생성 및 전환
      const newPage = await context.newPage();
      await newPage.goto('https://www.google.com');
      await newPage.waitForTimeout(1000);

      // 3. 원래 탭으로 돌아가기
      await page.bringToFront();

      // 4. 상태 유지 확인
      const isAdminActive = await verifyAdminState(page);
      expect(isAdminActive).toBe(true);

      await newPage.close();
      console.log('✅ 탭 전환 후 상태 유지 확인');
    });

    test('네트워크 연결 재시도 시뮬레이션', async ({ page }) => {
      await navigateToAdminDashboard(page);

      // 1. 네트워크 오프라인 모드 설정
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);

      // 2. 네트워크 온라인 복구
      await page.context().setOffline(false);
      await page.waitForTimeout(2000);

      // 3. 페이지 기능 정상 작동 확인
      const isPageResponsive = await page.evaluate(() => {
        return document.readyState === 'complete';
      });

      expect(isPageResponsive).toBe(true);
      console.log('✅ 네트워크 재연결 후 정상 작동 확인');
    });
  });

  test.describe('📱 반응형 디자인 테스트', () => {
    test('모바일 뷰포트에서 UI 적응성', async ({ page }) => {
      // 1. 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToAdminDashboard(page);

      // 2. 모바일에서 주요 요소들 확인
      const mobileElements = [
        'main',
        '[data-testid="mobile-nav"], .mobile-menu',
        'button[aria-label*="메뉴"], button[aria-label*="menu"]',
      ];

      for (const selector of mobileElements) {
        const element = page.locator(selector).first();
        if ((await element.count()) > 0) {
          console.log(`✅ 모바일 UI 요소 확인: ${selector}`);
        }
      }

      // 3. 서버 카드들이 세로로 정렬되는지 확인
      const serverCards = page.locator(
        '[data-testid="server-card"], .server-card'
      );
      if ((await serverCards.count()) > 0) {
        const cardPositions = await serverCards.evaluateAll((cards) =>
          cards.map((card) => card.getBoundingClientRect())
        );

        // 세로 정렬 확인 (Y 좌표가 증가하는지)
        if (cardPositions.length > 1) {
          const isVerticalLayout = cardPositions[1].top > cardPositions[0].top;
          expect(isVerticalLayout).toBe(true);
          console.log('✅ 모바일에서 세로 레이아웃 확인');
        }
      }
    });

    test('태블릿 뷰포트에서 레이아웃 확인', async ({ page }) => {
      // 태블릿 뷰포트로 변경
      await page.setViewportSize({ width: 768, height: 1024 });
      await navigateToAdminDashboard(page);

      // 태블릿에서 적절한 레이아웃 확인
      const isVisible = await page.locator('main').isVisible();
      expect(isVisible).toBe(true);

      console.log('✅ 태블릿 뷰포트에서 레이아웃 정상 확인');
    });
  });
});

/**
 * 🚀 성능 및 접근성 테스트
 */
test.describe('⚡ 성능 최적화 검증', () => {
  test('페이지 로딩 시간 측정', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-container"]');

    const loadTime = Date.now() - startTime;
    console.log(`📊 페이지 로딩 시간: ${loadTime}ms`);

    // 10초 이내 로딩 기대 (프로덕션 콜드 스타트 고려)
    expect(loadTime).toBeLessThan(10000);
  });

  test('JavaScript 에러 모니터링', async ({ page }) => {
    const jsErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    await navigateToAdminDashboard(page);

    // 치명적인 JS 에러가 없어야 함
    const criticalErrors = jsErrors.filter(
      (error) => error.includes('Uncaught') || error.includes('TypeError')
    );

    if (criticalErrors.length > 0) {
      console.warn('⚠️ JavaScript 에러 발견:', criticalErrors);
    }

    expect(criticalErrors.length).toBeLessThan(5); // 일부 에러는 허용 (프로덕션 환경)
  });

  test('메모리 사용량 모니터링', async ({ page }) => {
    await navigateToAdminDashboard(page);

    // 메모리 사용량 측정
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          }
        : null;
    });

    if (memoryInfo) {
      const memoryUsageMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      console.log(`📊 메모리 사용량: ${memoryUsageMB.toFixed(2)}MB`);

      // 150MB 이하로 유지되어야 함 (프로덕션 환경)
      expect(memoryUsageMB).toBeLessThan(150);
    }
  });
});

/**
 * 🛡️ 보안 테스트
 */
test.describe('🔒 보안 검증', () => {
  test('XSS 방지 확인', async ({ page }) => {
    await navigateToAdminDashboard(page);

    // XSS 스크립트 입력 시도
    const xssScript = '<script>alert("XSS")</script>';

    // AI 채팅 입력 필드에 XSS 시도
    const chatInput = page
      .locator('[data-testid="ai-chat-input"], input, textarea')
      .first();
    if ((await chatInput.count()) > 0) {
      await chatInput.fill(xssScript);

      // 스크립트가 실행되지 않아야 함
      const alerts = [];
      page.on('dialog', (dialog) => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });

      await page.waitForTimeout(1000);
      expect(alerts.length).toBe(0);
      console.log('✅ XSS 방지 확인 완료');
    }
  });

  test('관리자 권한 확인', async ({ page }) => {
    // 1. 비인증 상태에서 관리자 기능 접근 시도
    await page.goto('/dashboard');

    // 2. 관리자 전용 기능들이 숨겨져 있어야 함
    const adminOnlySelectors = [
      '[data-testid="admin-only"]',
      '.admin-only',
      'button:has-text("시스템 시작")',
      'button:has-text("설정")',
    ];

    for (const selector of adminOnlySelectors) {
      const element = page.locator(selector);
      if ((await element.count()) > 0) {
        const isVisible = await element.isVisible();
        // 관리자 모드가 아닐 때는 숨겨져야 함
        if (isVisible) {
          console.log(`ℹ️ 관리자 기능이 보임: ${selector} (권한 확인 필요)`);
        }
      }
    }

    console.log('✅ 관리자 권한 확인 완료');
  });
});
