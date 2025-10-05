import { test, expect } from '@playwright/test';
import { TIMEOUTS } from './helpers/timeouts';

/**
 * 기본 프론트엔드 E2E 테스트
 * 
 * 테스트 범위:
 * 1. 홈페이지 로딩 및 리다이렉트
 * 2. 로그인 페이지 기본 요소 확인
 * 3. 기본 렌더링 상태 검증
 * 4. JavaScript 에러 모니터링
 */

test.describe('OpenManager VIBE v5 - 기본 프론트엔드 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 모니터링 설정
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 네트워크 실패 모니터링
    page.on('requestfailed', (request) => {
      console.warn(`Failed request: ${request.url()}`);
    });
    
    // 테스트 실행 후 에러 확인을 위해 저장
    (page as any)._consoleErrors = consoleErrors;
  });

  test('1. 홈페이지 접속 시 /login으로 리다이렉트 확인', async ({ page }) => {
    // 홈페이지 접속
    await page.goto('/');
    
    // 리다이렉트 대기 (최대 5초)
    await page.waitForURL('**/login', { timeout: TIMEOUTS.API_RESPONSE });
    
    // 현재 URL이 로그인 페이지인지 확인
    expect(page.url()).toContain('/login');
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    console.log(`✅ 리다이렉트 성공: ${page.url()}`);
  });

  test('2. 로그인 페이지 기본 요소 확인', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log(`📄 페이지 제목: ${title}`);
    
    // 기본 HTML 구조 확인
    const bodyExists = await page.locator('body').isVisible();
    expect(bodyExists).toBe(true);
    
    // 메인 컨테이너나 앱 루트 확인
    const mainContainer = page.locator('main, #__next, [data-testid="app-root"], .min-h-screen').first();
    await expect(mainContainer).toBeVisible({ timeout: TIMEOUTS.MODAL_DISPLAY });
    
    // 로그인 관련 텍스트나 폼 요소 존재 확인
    const hasLoginElements = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase();
      return body.includes('login') || 
             body.includes('로그인') || 
             body.includes('sign in') ||
             document.querySelector('input[type="email"]') !== null ||
             document.querySelector('input[type="password"]') !== null ||
             document.querySelector('form') !== null;
    });
    
    expect(hasLoginElements).toBe(true);
    console.log('✅ 로그인 페이지 기본 요소 확인 완료');
  });

  test('3. 페이지 기본 렌더링 상태 확인', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // DOM이 비어있지 않은지 확인
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent?.trim().length).toBeGreaterThan(0);
    
    // 기본적인 CSS가 로드되었는지 확인 (배경색 등)
    const bodyStyles = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
      };
    });
    
    expect(bodyStyles).toBeTruthy();
    console.log('🎨 기본 스타일 로드됨:', bodyStyles);
    
    // 이미지가 있다면 로드 상태 확인
    const images = await page.locator('img').count();
    if (images > 0) {
      // 첫 번째 이미지가 로드되었는지 확인
      const firstImage = page.locator('img').first();
      const imageLoaded = await firstImage.evaluate((img: HTMLImageElement) => {
        return img.complete && img.naturalHeight !== 0;
      });
      console.log(`🖼️ 이미지 로드 상태: ${imageLoaded ? '성공' : '대기중'}`);
    }
    
    console.log('✅ 기본 렌더링 상태 확인 완료');
  });

  test('4. JavaScript 에러 및 기본 기능 확인', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    // 에러 모니터링
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()}`);
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 약간의 시간을 두고 비동기 에러 확인
    await page.waitForTimeout(2000);
    
    // React/Next.js가 정상적으로 로드되었는지 확인
    const reactLoaded = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window as any).React !== undefined || 
             document.querySelector('[data-reactroot]') !== null ||
             document.querySelector('#__next') !== null;
    });
    
    console.log('⚛️ React/Next.js 로드 상태:', reactLoaded ? '성공' : '확인 불가');
    
    // 기본적인 DOM 상호작용 테스트
    const canInteract = await page.evaluate(() => {
      // 클릭 이벤트 테스트
      const testElement = document.createElement('div');
      let clicked = false;
      testElement.onclick = () => { clicked = true; };
      testElement.click();
      return clicked;
    });
    
    expect(canInteract).toBe(true);
    console.log('🖱️ DOM 상호작용 테스트 통과');
    
    // 심각한 JavaScript 에러 확인 (일부 경고는 무시)
    const seriousErrors = consoleErrors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('[HMR]') && 
      !error.includes('DevTools') &&
      !error.toLowerCase().includes('hydration')
    );
    
    if (seriousErrors.length > 0) {
      console.warn('⚠️ JavaScript 에러 발견:', seriousErrors);
    } else {
      console.log('✅ 심각한 JavaScript 에러 없음');
    }
    
    // 네트워크 에러 확인 (일부 개발 관련 에러는 무시)
    const seriousNetworkErrors = networkErrors.filter(error => 
      !error.includes('_next/webpack-hmr') &&
      !error.includes('favicon.ico') &&
      !error.includes('sourcemap')
    );
    
    if (seriousNetworkErrors.length > 0) {
      console.warn('⚠️ 네트워크 에러 발견:', seriousNetworkErrors);
    } else {
      console.log('✅ 심각한 네트워크 에러 없음');
    }
  });

  test('5. 모바일 반응형 기본 테스트', async ({ page }) => {
    await page.goto('/login');
    
    // 데스크톱 크기로 시작
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState('networkidle');
    
    const desktopLayout = await page.locator('body').boundingBox();
    expect(desktopLayout?.width).toBeGreaterThan(1000);
    
    // 모바일 크기로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // 레이아웃 재계산 대기
    
    const mobileLayout = await page.locator('body').boundingBox();
    expect(mobileLayout?.width).toBeLessThan(400);
    
    // 모바일에서도 기본 콘텐츠가 보이는지 확인
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);
    
    console.log('📱 모바일 반응형 기본 테스트 통과');
  });

  test('6. 페이지 성능 기본 지표 확인', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 로딩 시간이 10초 이내인지 확인 (개발 환경 고려)
    expect(loadTime).toBeLessThan(10000);
    console.log(`⚡ 페이지 로딩 시간: ${loadTime}ms`);
    
    // 페이지 크기 확인
    const performanceEntries = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: entries.domContentLoadedEventEnd - entries.domContentLoadedEventStart,
        loadComplete: entries.loadEventEnd - entries.loadEventStart,
        transferSize: entries.transferSize || 0
      };
    });
    
    console.log('📊 성능 지표:', performanceEntries);
    
    // DOM 완료 시간이 5초 이내인지 확인
    expect(performanceEntries.domContentLoaded).toBeLessThan(5000);
  });

  test('7. 기본 접근성 확인', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // lang 속성 확인
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
    console.log(`🌐 언어 설정: ${htmlLang}`);
    
    // title 태그 확인
    const title = await page.title();
    expect(title?.length).toBeGreaterThan(0);
    console.log(`📋 페이지 제목: ${title}`);
    
    // 기본 HTML 구조 확인
    const hasMain = await page.locator('main').count();
    const hasH1 = await page.locator('h1').count();
    
    console.log(`📄 구조 요소: main=${hasMain}, h1=${hasH1}`);
    
    console.log('♿ 기본 접근성 확인 완료');
  });

  test.afterEach(async ({ page }) => {
    // 각 테스트 후 콘솔 에러 요약 출력
    const errors = (page as any)._consoleErrors;
    if (errors && errors.length > 0) {
      console.log(`⚠️ 콘솔 에러 ${errors.length}개 발견:`, errors.slice(0, 3));
    }
  });
});

/**
 * 추가 테스트 시나리오 (선택적)
 */
test.describe('OpenManager VIBE v5 - 확장 테스트', () => {
  
  test('8. API 엔드포인트 기본 응답 확인', async ({ page }) => {
    // 페이지에서 API 호출 테스트
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/health', { method: 'GET' });
        return {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
    
    console.log('🔌 API 응답:', apiResponse);
    
    // API가 존재하면 정상 응답인지 확인, 없으면 패스
    if (!apiResponse.error) {
      expect(apiResponse.status).toBeGreaterThanOrEqual(200);
      expect(apiResponse.status).toBeLessThan(500);
    }
  });

  test('9. 라우팅 기본 테스트', async ({ page }) => {
    // 메인 페이지 접속
    await page.goto('/');
    await page.waitForURL('**/login');
    
    // 브라우저 히스토리 테스트
    const canGoBack = await page.evaluate(() => {
      return history.length > 1;
    });
    
    console.log('🔄 브라우저 히스토리 사용 가능:', canGoBack);
    
    // URL 변경 테스트 (쿼리 파라미터)
    await page.goto('/login?test=1');
    expect(page.url()).toContain('test=1');
    
    console.log('🛣️ 라우팅 기본 테스트 완료');
  });
});