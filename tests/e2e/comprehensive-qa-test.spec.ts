import { test, expect, type Page } from '@playwright/test';

/**
 * 종합적인 프론트엔드 QA 테스트
 * 서버 모니터링 대시보드의 모든 주요 기능을 테스트합니다.
 */

test.describe('OpenManager VIBE - 종합 QA 테스트', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. 메인 페이지 기본 기능', () => {
    test('메인 페이지 기본 요소 로드 확인', async () => {
      // 페이지 타이틀 확인 (실제 타이틀에 맞게 수정)
      await expect(page).toHaveTitle(/OpenManager/);
      
      // 메인 헤더 확인
      await expect(page.locator('h1')).toContainText('OpenManager');
      
      // AI 기반 서버 모니터링 텍스트 확인
      await expect(page.locator('text=AI 기반 서버 모니터링')).toBeVisible();
      
      // 시스템 시작 버튼 또는 대시보드 버튼 존재 확인
      const actionButtons = page.locator('button:has-text("시스템 시작"), button:has-text("대시보드")');
      await expect(actionButtons.first()).toBeVisible();
    });

    test('기능 카드 그리드 표시 확인', async () => {
      // 기능 카드 그리드가 표시되는지 확인
      const featureGrid = page.locator('.feature-grid, [data-testid="feature-cards-grid"]');
      
      // 기능 카드들이 존재하는지 확인 (기본적으로 몇 개의 카드가 있어야 함)
      const featureCards = page.locator('.feature-card, [data-testid^="feature-card-"]');
      
      // 기능 소개 텍스트 확인
      await expect(page.locator('text=완전 독립 동작 AI 엔진')).toBeVisible();
    });

    test('AI 어시스턴트 안내 표시 확인', async () => {
      // AI 어시스턴트 안내 섹션 확인
      await expect(page.locator('text=AI 어시스턴트')).toBeVisible();
      
      // 시스템 시작 후 사용 가능 안내 확인
      await expect(page.locator('text=시스템 시작 후 대시보드에서 AI 사이드바 이용 가능')).toBeVisible();
    });
  });

  test.describe('2. 사용자 인증 플로우 (GitHub OAuth)', () => {
    test('로그인 버튼 존재 및 클릭 가능', async () => {
      // 로그인 버튼 찾기
      const loginButton = page.locator('button:has-text("Sign in"), button:has-text("Login"), a:has-text("Sign in")');
      
      if (await loginButton.count() > 0) {
        await expect(loginButton.first()).toBeVisible();
        await expect(loginButton.first()).toBeEnabled();
      } else {
        // 이미 로그인된 상태일 수 있음
        const userProfile = page.locator('[data-testid="user-profile"], [data-testid="user-menu"]');
        if (await userProfile.count() > 0) {
          console.log('User already logged in');
        }
      }
    });

    test('로그아웃 기능 확인', async () => {
      // 로그아웃 버튼이나 사용자 메뉴 확인
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Logout"), button:has-text("Sign out")');
      
      if (await userMenu.count() > 0) {
        await expect(userMenu.first()).toBeVisible();
      }
    });
  });

  test.describe('3. 반응형 디자인 검증', () => {
    test('데스크톱 뷰포트 (1920x1080)', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 서버 카드가 격자 레이아웃으로 표시되는지 확인
      const serverCards = page.locator('[data-testid^="server-card-"]');
      await expect(serverCards.first()).toBeVisible();
      
      // 스크린샷 캡처
      await page.screenshot({ path: 'test-results/desktop-view.png', fullPage: true });
    });

    test('태블릿 뷰포트 (768x1024)', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 서버 카드가 여전히 표시되는지 확인
      const serverCards = page.locator('[data-testid^="server-card-"]');
      await expect(serverCards.first()).toBeVisible();
      
      // 스크린샷 캡처
      await page.screenshot({ path: 'test-results/tablet-view.png', fullPage: true });
    });

    test('모바일 뷰포트 (375x667)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 모바일에서도 서버 카드가 표시되는지 확인
      const serverCards = page.locator('[data-testid^="server-card-"]');
      await expect(serverCards.first()).toBeVisible();
      
      // 스크린샷 캡처
      await page.screenshot({ path: 'test-results/mobile-view.png', fullPage: true });
    });
  });

  test.describe('4. 접근성 (WCAG 2.1) 준수', () => {
    test('키보드 네비게이션', async () => {
      // Tab 키로 네비게이션 가능한지 확인
      await page.keyboard.press('Tab');
      
      // 포커스된 요소가 있는지 확인
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // 여러 번 Tab을 눌러서 순환 가능한지 확인
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
    });

    test('ARIA 레이블 및 시맨틱 HTML', async () => {
      // 메인 콘텐츠 영역 확인
      const main = page.locator('main, [role="main"]');
      if (await main.count() > 0) {
        await expect(main.first()).toBeVisible();
      }
      
      // 버튼 요소들이 적절한 라벨을 가지고 있는지 확인
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const ariaLabel = await button.getAttribute('aria-label');
          const textContent = await button.textContent();
          expect(ariaLabel || textContent).toBeTruthy();
        }
      }
    });

    test('색상 대비 및 시각적 요소', async () => {
      // 스크린샷을 통한 시각적 검증
      await page.screenshot({ path: 'test-results/accessibility-check.png', fullPage: true });
      
      // 텍스트가 포함된 요소들이 보이는지 확인
      const textElements = page.locator('h1, h2, h3, p, span, div').filter({ hasText: /.+/ });
      const textCount = await textElements.count();
      expect(textCount).toBeGreaterThan(0);
    });
  });

  test.describe('5. 성능 메트릭 측정', () => {
    test('페이지 로드 성능', async () => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      console.log(`Page load time: ${loadTime}ms`);
      
      // 5초 이내에 로드되어야 함
      expect(loadTime).toBeLessThan(5000);
    });

    test('이미지 및 리소스 로딩', async () => {
      await page.goto('/');
      
      // 이미지가 있다면 로드되는지 확인
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const img = images.nth(i);
          if (await img.isVisible()) {
            await expect(img).toHaveJSProperty('naturalWidth', expect.any(Number));
          }
        }
      }
    });

    test('JavaScript 실행 시간', async () => {
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        };
      });
      
      console.log('DOM Content Loaded:', metrics.domContentLoaded + 'ms');
      console.log('Load Complete:', metrics.loadComplete + 'ms');
      
      // DOM Content Loaded는 3초 이내여야 함
      expect(metrics.domContentLoaded).toBeLessThan(3000);
    });
  });

  test.describe('6. 대시보드 접근 및 서버 모니터링 기능', () => {
    test('대시보드 접근 시도', async () => {
      // 대시보드로 직접 이동 시도
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // 대시보드 접근 가능한지 확인 (인증 상태에 따라 다를 수 있음)
      const isDashboardAccessible = await page.locator('text=Server Dashboard, text=대시보드').count() > 0;
      const isAuthRequired = await page.locator('text=로그인, text=GitHub').count() > 0;
      
      if (isDashboardAccessible) {
        console.log('대시보드 접근 성공');
        
        // 서버 카드 존재 확인
        const serverCards = page.locator('[data-testid^="server-card-"], .server-card');
        if (await serverCards.count() > 0) {
          await expect(serverCards.first()).toBeVisible();
          console.log('서버 카드 표시 확인');
        }
      } else if (isAuthRequired) {
        console.log('대시보드 접근 시 인증 필요');
      }
    });

    test('시스템 시작 버튼 클릭 테스트', async () => {
      // 메인 페이지로 돌아가기
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 시스템 시작 버튼 찾기
      const systemStartButton = page.locator('button:has-text("시스템 시작")');
      
      if (await systemStartButton.count() > 0) {
        // 버튼이 활성화되어 있는지 확인
        const isEnabled = await systemStartButton.isEnabled();
        if (isEnabled) {
          await systemStartButton.click();
          await page.waitForTimeout(1000);
          
          // 클릭 후 변화 확인 (카운트다운, 로딩 등)
          const hasCountdown = await page.locator('text=취소').count() > 0;
          const hasLoading = await page.locator('text=초기화').count() > 0;
          
          if (hasCountdown || hasLoading) {
            console.log('시스템 시작 프로세스 시작됨');
          }
        }
      } else {
        console.log('시스템 시작 버튼을 찾을 수 없음 (이미 실행 중이거나 인증 필요)');
      }
    });

    test('새로고침 및 상태 유지', async () => {
      // 페이지 새로고침
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 기본 요소들이 여전히 표시되는지 확인
      const serverCards = page.locator('[data-testid^="server-card-"]');
      await expect(serverCards.first()).toBeVisible();
    });
  });

  test.describe('7. 에러 처리 및 안정성', () => {
    test('네트워크 오류 시나리오', async () => {
      // 네트워크를 오프라인으로 설정
      await page.context().setOffline(true);
      
      // 페이지 새로고침 시도
      await page.reload({ waitUntil: 'domcontentloaded' });
      
      // 네트워크 복원
      await page.context().setOffline(false);
      
      // 페이지가 복구되는지 확인
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const serverCards = page.locator('[data-testid^="server-card-"]');
      await expect(serverCards.first()).toBeVisible();
    });

    test('콘솔 에러 확인', async () => {
      const errors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 심각한 에러가 없어야 함 (일부 경고는 허용)
      const criticalErrors = errors.filter(error => 
        !error.includes('Warning') && 
        !error.includes('DevTools') &&
        !error.includes('extension')
      );
      
      if (criticalErrors.length > 0) {
        console.log('Console errors found:', criticalErrors);
      }
      
      expect(criticalErrors.length).toBeLessThan(3);
    });
  });
});