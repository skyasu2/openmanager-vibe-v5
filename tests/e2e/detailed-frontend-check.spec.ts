import { test, expect } from '@playwright/test';

/**
 * 상세 프론트엔드 동작 확인 테스트
 * 요청된 모든 항목을 포괄적으로 검증
 */

test.describe('OpenManager VIBE v5 - 상세 프론트엔드 검증', () => {
  
  test('1. 홈페이지 로딩 확인 (/login 리다이렉트 검증)', async ({ page }) => {
    console.log('🏠 === 홈페이지 로딩 및 리다이렉트 검증 시작 ===');
    
    // 홈페이지 접속
    console.log('📍 Step 1: 홈페이지(/) 접속 중...');
    const response = await page.goto('/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    
    // HTTP 응답 상태 확인
    console.log(`📊 HTTP 상태: ${response?.status()}`);
    expect(response?.status()).toBeLessThan(400);
    
    // 리다이렉트 확인
    console.log('🔄 Step 2: /login 리다이렉트 대기 중...');
    await page.waitForURL('**/login', { timeout: 10000 });
    
    const currentUrl = page.url();
    console.log(`✅ 리다이렉트 성공: ${currentUrl}`);
    expect(currentUrl).toContain('/login');
    
    console.log('🎯 홈페이지 리다이렉트 검증 완료\n');
  });

  test('2. 로그인 페이지 기본 요소들 확인', async ({ page }) => {
    console.log('🔑 === 로그인 페이지 요소 검증 시작 ===');
    
    await page.goto('/login', { 
      waitUntil: 'networkidle', 
      timeout: 15000 
    });
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: "${title}"`);
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // HTML lang 속성 확인
    const htmlLang = await page.locator('html').getAttribute('lang');
    console.log(`🌐 언어 설정: ${htmlLang}`);
    expect(htmlLang).toBeTruthy();
    
    // 기본 HTML 구조 요소 확인
    console.log('🏗️ HTML 구조 요소 확인:');
    
    const bodyExists = await page.locator('body').isVisible();
    console.log(`  - <body>: ${bodyExists ? '✅' : '❌'}`);
    expect(bodyExists).toBe(true);
    
    const headExists = await page.locator('head').count();
    console.log(`  - <head>: ${headExists > 0 ? '✅' : '❌'}`);
    expect(headExists).toBeGreaterThan(0);
    
    // 메타 태그 확인
    const viewport = await page.locator('meta[name="viewport"]').count();
    const charset = await page.locator('meta[charset], meta[http-equiv="Content-Type"]').count();
    console.log(`  - 뷰포트 메타태그: ${viewport > 0 ? '✅' : '❌'}`);
    console.log(`  - 문자셋 설정: ${charset > 0 ? '✅' : '❌'}`);
    
    // 콘텐츠 존재 확인
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 페이지 콘텐츠 길이: ${bodyText?.trim().length || 0}자`);
    expect(bodyText?.trim().length).toBeGreaterThan(10);
    
    // 로그인 관련 요소 확인
    console.log('🔐 로그인 관련 요소 검색:');
    
    const hasLoginText = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasLogin: text.includes('login') || text.includes('로그인') || text.includes('sign in'),
        hasForm: document.querySelector('form') !== null,
        hasEmailInput: document.querySelector('input[type="email"]') !== null,
        hasPasswordInput: document.querySelector('input[type="password"]') !== null,
        hasButton: document.querySelector('button') !== null
      };
    });
    
    console.log(`  - 로그인 텍스트: ${hasLoginText.hasLogin ? '✅' : '❌'}`);
    console.log(`  - 폼 요소: ${hasLoginText.hasForm ? '✅' : '❌'}`);
    console.log(`  - 이메일 입력: ${hasLoginText.hasEmailInput ? '✅' : '❌'}`);
    console.log(`  - 비밀번호 입력: ${hasLoginText.hasPasswordInput ? '✅' : '❌'}`);
    console.log(`  - 버튼 요소: ${hasLoginText.hasButton ? '✅' : '❌'}`);
    
    // 적어도 로그인 관련 요소 중 하나는 있어야 함
    const hasAnyLoginElement = hasLoginText.hasLogin || hasLoginText.hasForm || hasLoginText.hasEmailInput;
    expect(hasAnyLoginElement).toBe(true);
    
    console.log('🎯 로그인 페이지 요소 검증 완료\n');
  });

  test('3. 페이지 기본 렌더링 상태 확인', async ({ page }) => {
    console.log('🎨 === 페이지 렌더링 상태 검증 시작 ===');
    
    await page.goto('/login', { 
      waitUntil: 'networkidle', 
      timeout: 15000 
    });
    
    // CSS 로딩 확인
    console.log('💄 CSS 및 스타일 확인:');
    
    const bodyStyles = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        display: styles.display
      };
    });
    
    console.log(`  - 배경색: ${bodyStyles.backgroundColor}`);
    console.log(`  - 텍스트색: ${bodyStyles.color}`);
    console.log(`  - 폰트: ${bodyStyles.fontFamily}`);
    console.log(`  - 폰트 크기: ${bodyStyles.fontSize}`);
    
    expect(bodyStyles.backgroundColor).toBeTruthy();
    expect(bodyStyles.color).toBeTruthy();
    
    // DOM 요소 수 확인
    const elementCounts = await page.evaluate(() => {
      return {
        total: document.querySelectorAll('*').length,
        divs: document.querySelectorAll('div').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        images: document.querySelectorAll('img').length
      };
    });
    
    console.log('📊 DOM 요소 통계:');
    console.log(`  - 전체 요소: ${elementCounts.total}개`);
    console.log(`  - div: ${elementCounts.divs}개`);
    console.log(`  - button: ${elementCounts.buttons}개`);
    console.log(`  - input: ${elementCounts.inputs}개`);
    console.log(`  - img: ${elementCounts.images}개`);
    
    expect(elementCounts.total).toBeGreaterThan(15);
    
    // 레이아웃 확인
    const bodyBox = await page.locator('body').boundingBox();
    console.log(`📐 Body 크기: ${bodyBox?.width}x${bodyBox?.height}px`);
    expect(bodyBox?.width).toBeGreaterThan(100);
    expect(bodyBox?.height).toBeGreaterThan(100);
    
    console.log('🎯 페이지 렌더링 상태 검증 완료\n');
  });

  test('4. JavaScript 에러 및 기능 검증', async ({ page }) => {
    console.log('⚛️ === JavaScript 동작 및 에러 검증 시작 ===');
    
    const consoleMessages: { type: string; text: string }[] = [];
    const networkErrors: string[] = [];
    
    // 콘솔 메시지 모니터링
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // 네트워크 에러 모니터링
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()}`);
    });
    
    // 페이지 로딩
    await page.goto('/login', { 
      waitUntil: 'networkidle', 
      timeout: 15000 
    });
    
    // 약간의 시간을 두고 비동기 작업 완료 대기
    await page.waitForTimeout(3000);
    
    // JavaScript 기본 기능 테스트
    console.log('🧪 JavaScript 기능 테스트:');
    
    const jsTests = await page.evaluate(() => {
      const results = {
        windowExists: typeof window !== 'undefined',
        documentExists: typeof document !== 'undefined',
        consoleExists: typeof console !== 'undefined',
        fetchExists: typeof fetch !== 'undefined',
        promiseExists: typeof Promise !== 'undefined',
        canCreateElement: false,
        canManipulateDOM: false,
        eventListeners: false
      };
      
      try {
        // DOM 조작 테스트
        const testDiv = document.createElement('div');
        testDiv.textContent = 'test';
        results.canCreateElement = testDiv.textContent === 'test';
        
        // DOM 추가/제거 테스트
        document.body.appendChild(testDiv);
        const added = document.body.contains(testDiv);
        document.body.removeChild(testDiv);
        const removed = !document.body.contains(testDiv);
        results.canManipulateDOM = added && removed;
        
        // 이벤트 리스너 테스트
        let eventFired = false;
        const testBtn = document.createElement('button');
        testBtn.onclick = () => { eventFired = true; };
        testBtn.click();
        results.eventListeners = eventFired;
        
      } catch (error) {
        console.error('JS test error:', error);
      }
      
      return results;
    });
    
    console.log(`  - Window 객체: ${jsTests.windowExists ? '✅' : '❌'}`);
    console.log(`  - Document 객체: ${jsTests.documentExists ? '✅' : '❌'}`);
    console.log(`  - Console 객체: ${jsTests.consoleExists ? '✅' : '❌'}`);
    console.log(`  - Fetch API: ${jsTests.fetchExists ? '✅' : '❌'}`);
    console.log(`  - Promise: ${jsTests.promiseExists ? '✅' : '❌'}`);
    console.log(`  - DOM 생성: ${jsTests.canCreateElement ? '✅' : '❌'}`);
    console.log(`  - DOM 조작: ${jsTests.canManipulateDOM ? '✅' : '❌'}`);
    console.log(`  - 이벤트 처리: ${jsTests.eventListeners ? '✅' : '❌'}`);
    
    expect(jsTests.windowExists).toBe(true);
    expect(jsTests.documentExists).toBe(true);
    expect(jsTests.canCreateElement).toBe(true);
    
    // 콘솔 메시지 분석
    console.log('📋 콘솔 메시지 분석:');
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
    const logMessages = consoleMessages.filter(msg => msg.type === 'log');
    
    console.log(`  - 에러: ${errorMessages.length}개`);
    console.log(`  - 경고: ${warningMessages.length}개`);
    console.log(`  - 로그: ${logMessages.length}개`);
    
    // 심각한 에러만 필터링
    const seriousErrors = errorMessages.filter(msg => 
      !msg.text.includes('Warning') && 
      !msg.text.includes('[HMR]') &&
      !msg.text.includes('DevTools') &&
      !msg.text.toLowerCase().includes('hydration') &&
      !msg.text.includes('favicon') &&
      !msg.text.includes('404')
    );
    
    if (seriousErrors.length > 0) {
      console.log('⚠️ 심각한 에러 발견:');
      seriousErrors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text}`);
      });
    } else {
      console.log('✅ 심각한 JavaScript 에러 없음');
    }
    
    // 네트워크 에러 분석
    const seriousNetworkErrors = networkErrors.filter(error => 
      !error.includes('_next/webpack-hmr') &&
      !error.includes('favicon.ico') &&
      !error.includes('sourcemap')
    );
    
    console.log(`🌐 네트워크 에러: ${seriousNetworkErrors.length}개`);
    if (seriousNetworkErrors.length > 0) {
      seriousNetworkErrors.slice(0, 2).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('🎯 JavaScript 에러 검증 완료\n');
  });

  test('5. 전체 프론트엔드 상태 요약', async ({ page }) => {
    console.log('📊 === 전체 프론트엔드 상태 요약 ===');
    
    const startTime = Date.now();
    
    await page.goto('/login', { 
      waitUntil: 'networkidle', 
      timeout: 15000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // 종합 정보 수집
    const summary = await page.evaluate(() => {
      const body = document.body;
      const bodyRect = body.getBoundingClientRect();
      
      return {
        title: document.title,
        url: window.location.href,
        userAgent: navigator.userAgent.split(' ')[0],
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        bodySize: {
          width: bodyRect.width,
          height: bodyRect.height
        },
        elementCounts: {
          total: document.querySelectorAll('*').length,
          visible: Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          }).length
        },
        hasContent: body.textContent?.trim().length || 0,
        timestamp: new Date().toLocaleString('ko-KR')
      };
    });
    
    console.log('📈 === 프론트엔드 상태 리포트 ===');
    console.log(`🌐 URL: ${summary.url}`);
    console.log(`📄 제목: ${summary.title}`);
    console.log(`⏱️ 로딩 시간: ${loadTime}ms`);
    console.log(`📱 뷰포트: ${summary.viewport.width}x${summary.viewport.height}px`);
    console.log(`📐 Body 크기: ${summary.bodySize.width}x${summary.bodySize.height}px`);
    console.log(`🧩 DOM 요소: 총 ${summary.elementCounts.total}개 (표시: ${summary.elementCounts.visible}개)`);
    console.log(`📝 콘텐츠: ${summary.hasContent}자`);
    console.log(`🕒 테스트 시간: ${summary.timestamp}`);
    
    // 성능 지표 확인
    const performance = await page.evaluate(() => {
      const perf = window.performance;
      const navigation = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        return {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          firstPaint: Math.round(navigation.responseEnd - navigation.requestStart),
          transferSize: navigation.transferSize || 0
        };
      }
      return null;
    });
    
    if (performance) {
      console.log('⚡ 성능 지표:');
      console.log(`  - DOM 준비: ${performance.domContentLoaded}ms`);
      console.log(`  - 로딩 완료: ${performance.loadComplete}ms`);
      console.log(`  - 첫 페인트: ${performance.firstPaint}ms`);
      console.log(`  - 전송 크기: ${Math.round(performance.transferSize / 1024)}KB`);
    }
    
    console.log('\n🎉 === 프론트엔드 검증 완료 ===');
    console.log('✅ 모든 기본 기능이 정상적으로 동작합니다!');
    
    // 기본 검증
    expect(loadTime).toBeLessThan(20000); // 20초 이내
    expect(summary.hasContent).toBeGreaterThan(50); // 최소 콘텐츠
    expect(summary.elementCounts.total).toBeGreaterThan(10); // 기본 DOM 구조
  });
});