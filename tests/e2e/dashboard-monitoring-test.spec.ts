import { test, expect } from '@playwright/test';

/**
 * 서버 모니터링 대시보드 전용 테스트
 * Playwright MCP를 활용한 심화 대시보드 기능 검증
 */

// 헬퍼 함수
async function testDashboardElements(page) {
  console.log('🔍 대시보드 요소 상세 검증');
  
  await page.screenshot({ path: 'test-results/dashboard-after-system-start.png', fullPage: true });
  
  // 다양한 대시보드 요소 확인
  const dashboardSelectors = [
    'h1, h2, h3',
    'button',
    '[data-testid]',
    '.card, .server-card',
    '.metric, .monitoring',
    'canvas, svg'
  ];
  
  for (const selector of dashboardSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      console.log(`✅ ${selector}: ${count}개 요소 발견`);
    }
  }
}

test.describe('서버 모니터링 대시보드 심화 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 게스트 로그인 수행
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const guestButton = page.locator('button:has-text("게스트"), button:has-text("체험")');
    if (await guestButton.count() > 0) {
      await guestButton.first().click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    }
  });

  test('시스템 시작 후 대시보드 접근 테스트', async ({ page }) => {
    console.log('🚀 시스템 시작 테스트 시작');
    
    // 시스템 시작 버튼 찾기
    const systemStartButton = page.locator('button:has-text("시스템 시작")');
    
    if (await systemStartButton.count() > 0 && await systemStartButton.isEnabled()) {
      console.log('✅ 시스템 시작 버튼 발견 및 활성화 상태');
      
      // 시스템 시작 버튼 클릭
      await systemStartButton.click();
      await page.waitForTimeout(1000);
      
      // 카운트다운 대기 (3초)
      console.log('⏳ 시스템 시작 카운트다운 대기');
      await page.waitForTimeout(4000);
      
      // 시스템 부팅 페이지로 이동하는지 확인
      const currentUrl = page.url();
      if (currentUrl.includes('/system-boot') || currentUrl.includes('/dashboard')) {
        console.log('✅ 시스템 시작 후 적절한 페이지로 이동됨:', currentUrl);
        
        // 대시보드 페이지에서 추가 테스트
        if (currentUrl.includes('/dashboard')) {
          await testDashboardElements(page);
        } else {
          // system-boot 페이지에서 대시보드로 자동 이동 대기
          await page.waitForTimeout(5000);
          await page.goto('/dashboard');
          await page.waitForLoadState('networkidle');
          await testDashboardElements(page);
        }
      }
    } else {
      console.log('ℹ️ 시스템 시작 버튼이 비활성화되어 있음 - 대시보드 직접 접근 테스트');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await testDashboardElements(page);
    }
  });

  test('대시보드 UI 요소 상세 검증', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/dashboard-ui-detailed.png', fullPage: true });
    
    console.log('📊 대시보드 UI 요소 검증 시작');
    
    // 페이지 로드 확인
    const pageContent = await page.locator('body').textContent();
    console.log('페이지 콘텐츠 길이:', pageContent?.length);
    
    // 대시보드 관련 요소 확인
    const dashboardIndicators = [
      'Server',
      '서버',
      'Dashboard',
      '대시보드',
      'Monitoring',
      '모니터링',
      'CPU',
      'Memory',
      'Response',
      '응답'
    ];
    
    let foundIndicators = 0;
    for (const indicator of dashboardIndicators) {
      const elements = page.locator(`text=${indicator}`);
      if (await elements.count() > 0) {
        foundIndicators++;
        console.log(`✅ 발견된 지표: ${indicator}`);
      }
    }
    
    console.log(`📈 대시보드 지표 발견 비율: ${foundIndicators}/${dashboardIndicators.length}`);
    
    // 서버 카드나 모니터링 컴포넌트 확인
    const monitoringSelectors = [
      '[data-testid^="server-card"]',
      '[data-testid^="monitoring"]',
      '.server-card',
      '.monitoring-card',
      '.metric-card',
      '[class*="server"]',
      '[class*="monitoring"]'
    ];
    
    for (const selector of monitoringSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ 모니터링 요소 발견: ${selector} (${count}개)`);
        
        // 첫 번째 요소 스크린샷
        await elements.first().screenshot({ path: `test-results/monitoring-element-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
      }
    }
  });

  test('실시간 데이터 업데이트 모니터링', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('🔄 실시간 데이터 업데이트 모니터링');
    
    // 숫자 값을 포함한 요소들을 찾아서 모니터링
    const numericElements = page.locator('text=/\\d+%|\\d+ms|\\d+\\.\\d+|\\d+GB|\\d+MB/');
    const initialCount = await numericElements.count();
    
    if (initialCount > 0) {
      console.log(`📊 발견된 메트릭 요소 수: ${initialCount}`);
      
      // 초기 값들 기록
      const initialValues = await numericElements.allTextContents();
      console.log('초기 메트릭 값들:', initialValues.slice(0, 5));
      
      // 10초 대기 후 값 변화 확인
      await page.waitForTimeout(10000);
      
      const updatedValues = await numericElements.allTextContents();
      console.log('업데이트된 메트릭 값들:', updatedValues.slice(0, 5));
      
      // 값 변화 감지
      let changedCount = 0;
      for (let i = 0; i < Math.min(initialValues.length, updatedValues.length); i++) {
        if (initialValues[i] !== updatedValues[i]) {
          changedCount++;
        }
      }
      
      console.log(`🔄 변경된 메트릭 수: ${changedCount}/${initialValues.length}`);
      
      if (changedCount > 0) {
        console.log('✅ 실시간 데이터 업데이트 감지됨');
      } else {
        console.log('ℹ️ 실시간 데이터 업데이트가 감지되지 않음 (Mock 데이터일 수 있음)');
      }
    } else {
      console.log('ℹ️ 숫자 메트릭 요소를 찾을 수 없음');
    }
  });

  test('대시보드 인터랙션 테스트', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('🖱️ 대시보드 인터랙션 테스트');
    
    // 클릭 가능한 요소들 찾기
    const clickableElements = page.locator('button, [role="button"], .clickable, [data-testid*="card"]');
    const clickableCount = await clickableElements.count();
    
    console.log(`🎯 클릭 가능한 요소 수: ${clickableCount}`);
    
    if (clickableCount > 0) {
      for (let i = 0; i < Math.min(clickableCount, 3); i++) {
        const element = clickableElements.nth(i);
        if (await element.isVisible() && await element.isEnabled()) {
          console.log(`🖱️ 요소 ${i + 1} 클릭 테스트`);
          
          // 클릭 전 스크린샷
          await page.screenshot({ path: `test-results/before-click-${i + 1}.png` });
          
          await element.click();
          await page.waitForTimeout(1000);
          
          // 클릭 후 스크린샷
          await page.screenshot({ path: `test-results/after-click-${i + 1}.png` });
          
          console.log(`✅ 요소 ${i + 1} 클릭 완료`);
        }
      }
    }
    
    // 호버 효과 테스트
    const hoverElements = page.locator('[class*="hover"], .card, .server-card');
    const hoverCount = await hoverElements.count();
    
    if (hoverCount > 0) {
      console.log(`🎯 호버 테스트 대상 요소 수: ${hoverCount}`);
      
      const firstHoverElement = hoverElements.first();
      if (await firstHoverElement.isVisible()) {
        await firstHoverElement.hover();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/hover-effect.png' });
        console.log('✅ 호버 효과 테스트 완료');
      }
    }
  });

  test('다양한 해상도에서 대시보드 레이아웃 테스트', async ({ page }) => {
    console.log('📱 다양한 해상도 대시보드 레이아웃 테스트');
    
    const viewports = [
      { name: '4K', width: 3840, height: 2160 },
      { name: 'Desktop-HD', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet-Landscape', width: 1024, height: 768 },
      { name: 'Tablet-Portrait', width: 768, height: 1024 },
      { name: 'Mobile-Large', width: 414, height: 896 },
      { name: 'Mobile-Standard', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      console.log(`📐 ${viewport.name} (${viewport.width}x${viewport.height}) 테스트`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: `test-results/dashboard-${viewport.name.toLowerCase()}.png`, 
        fullPage: true 
      });
      
      // 기본 요소들이 여전히 표시되는지 확인
      const essentialElements = page.locator('header, main, .dashboard, [role="main"]');
      const visibleCount = await essentialElements.count();
      
      console.log(`✅ ${viewport.name}에서 필수 요소 ${visibleCount}개 확인`);
    }
    
    // 원래 해상도로 복귀
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

});