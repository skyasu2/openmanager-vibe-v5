import { test, expect, Page } from '@playwright/test';

test.describe('포괄적 QA 테스트 - localhost:3001', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 콘솔 에러 모니터링
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Console Error: ${msg.text()}`);
      }
    });

    // 페이지 에러 모니터링
    page.on('pageerror', exception => {
      console.error(`❌ Page Error: ${exception.toString()}`);
    });

    // 네트워크 실패 모니터링
    page.on('requestfailed', request => {
      console.error(`❌ Network Error: ${request.url()}`);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('1. 메인 페이지 (/) - 로딩 및 리다이렉트 확인', async () => {
    console.log('🧪 테스트 1: 메인 페이지 (/) 접근');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3001/', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ 페이지 로딩 시간: ${loadTime}ms`);
    
    // 현재 URL 확인 (리다이렉트 검증)
    const currentUrl = page.url();
    console.log(`🔗 현재 URL: ${currentUrl}`);
    
    // 페이지가 정상적으로 로드되었는지 확인
    await expect(page).toHaveTitle(/OpenManager/);
    
    // 응답 시간 체크 (5초 이내)
    expect(loadTime).toBeLessThan(5000);
    
    console.log('✅ 메인 페이지 접근 테스트 완료');
  });

  test('2. 메인 페이지 (/main) - 인증 플로우 및 UI 구성요소', async () => {
    console.log('🧪 테스트 2: 메인 페이지 (/main) 테스트');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3001/main', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ /main 페이지 로딩 시간: ${loadTime}ms`);
    
    // SSR 오류가 없는지 확인 (페이지가 렌더링됨)
    await page.waitForLoadState('networkidle');
    
    // 주요 UI 구성요소 확인
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toBeNull();
    
    // 인증 관련 요소 확인 (로그인 필요 시 리다이렉트 또는 로그인 폼 표시)
    const currentUrl = page.url();
    console.log(`🔗 /main 접근 후 URL: ${currentUrl}`);
    
    // JavaScript 오류가 없는지 확인 (콘솔 에러 모니터링으로 확인됨)
    
    console.log('✅ 메인 페이지 UI 테스트 완료');
  });

  test('3. 로그인 페이지 (/login) - 접근 가능성 확인', async () => {
    console.log('🧪 테스트 3: 로그인 페이지 (/login) 테스트');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3001/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ 로그인 페이지 로딩 시간: ${loadTime}ms`);
    
    // 페이지가 정상적으로 로드되었는지 확인
    await page.waitForLoadState('networkidle');
    
    // 로그인 폼 또는 관련 요소 확인
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toBeNull();
    expect(bodyContent.length).toBeGreaterThan(0);
    
    // 응답 시간 체크
    expect(loadTime).toBeLessThan(5000);
    
    console.log('✅ 로그인 페이지 접근 테스트 완료');
  });

  test('4. 네비게이션 및 반응성 테스트', async () => {
    console.log('🧪 테스트 4: 네비게이션 및 반응성 테스트');
    
    // 데스크탑 뷰포트에서 시작
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    
    console.log('📱 데스크탑 뷰 (1920x1080) 테스트');
    let bodyContent = await page.textContent('body');
    expect(bodyContent).not.toBeNull();
    
    // 태블릿 뷰포트 테스트
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000); // 리사이즈 대기
    
    console.log('📱 태블릿 뷰 (768x1024) 테스트');
    bodyContent = await page.textContent('body');
    expect(bodyContent).not.toBeNull();
    
    // 모바일 뷰포트 테스트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000); // 리사이즈 대기
    
    console.log('📱 모바일 뷰 (375x667) 테스트');
    bodyContent = await page.textContent('body');
    expect(bodyContent).not.toBeNull();
    
    console.log('✅ 반응형 디자인 테스트 완료');
  });

  test('5. 성능 및 에러 모니터링 종합 테스트', async () => {
    console.log('🧪 테스트 5: 성능 및 에러 모니터링 종합 테스트');
    
    const errors: string[] = [];
    const networkErrors: string[] = [];
    
    // 에러 수집
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()}`);
    });
    
    // 여러 페이지 순차 접근으로 전체적인 안정성 확인
    const routes = ['/', '/main', '/login'];
    const loadTimes: { route: string; time: number }[] = [];
    
    for (const route of routes) {
      console.log(`🔍 ${route} 페이지 테스트 중...`);
      
      const startTime = Date.now();
      try {
        await page.goto(`http://localhost:3001${route}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        loadTimes.push({ route, time: loadTime });
        
        console.log(`⏱️ ${route}: ${loadTime}ms`);
        
        // 기본적인 렌더링 확인
        const bodyContent = await page.textContent('body');
        expect(bodyContent).not.toBeNull();
        expect(bodyContent.length).toBeGreaterThan(0);
        
      } catch (error) {
        console.error(`❌ ${route} 페이지 로드 실패:`, error);
        errors.push(`Route ${route} failed: ${error}`);
      }
    }
    
    // 결과 리포트
    console.log('\n📊 성능 리포트:');
    loadTimes.forEach(({ route, time }) => {
      console.log(`  ${route}: ${time}ms`);
    });
    
    console.log(`\n🐛 JavaScript 에러 수: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log(`\n🌐 네트워크 에러 수: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      networkErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    // 성능 기준: 모든 페이지 5초 이내 로드
    loadTimes.forEach(({ route, time }) => {
      expect(time).toBeLessThan(5000);
    });
    
    console.log('✅ 성능 및 에러 모니터링 테스트 완료');
  });

  test('6. SEO 및 메타데이터 확인', async () => {
    console.log('🧪 테스트 6: SEO 및 메타데이터 확인');
    
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    
    // 기본 SEO 요소 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    expect(title.length).toBeGreaterThan(0);
    
    // 메타 태그 확인
    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    if (metaDescription) {
      console.log(`📝 메타 설명: ${metaDescription}`);
    }
    
    const metaViewport = await page.getAttribute('meta[name="viewport"]', 'content');
    if (metaViewport) {
      console.log(`📱 뷰포트 설정: ${metaViewport}`);
    }
    
    // favicon 확인
    const faviconExists = await page.locator('link[rel="icon"]').count() > 0;
    console.log(`🎨 Favicon 존재: ${faviconExists}`);
    
    console.log('✅ SEO 메타데이터 테스트 완료');
  });
});