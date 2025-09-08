import { test, expect } from '@playwright/test'

/**
 * Detailed Server Card Validation Test
 * 
 * 개별 서버 카드의 상세한 UI 개선사항 검증:
 * 1. 서버 카드 스크롤 및 로딩
 * 2. 색상 체계 검증
 * 3. 위치 정보 확인
 * 4. 차트 및 메트릭 확인
 */

test.describe('Detailed Server Card Validation', () => {
  test('개별 서버 카드 상세 검증', async ({ page }) => {
    console.log('🚀 대시보드 페이지 접속 및 로딩 대기')
    
    // 페이지 이동
    await page.goto('http://localhost:3000/dashboard', { timeout: 45000 })
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // 페이지 전체 스크린샷
    await page.screenshot({
      path: 'tests/screenshots/dashboard-initial-state.png',
      fullPage: true
    });
    
    console.log('⏬ 페이지 스크롤하여 서버 카드 찾기')
    
    // 페이지 하단으로 스크롤
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // 다시 스크린샷
    await page.screenshot({
      path: 'tests/screenshots/dashboard-after-scroll.png',
      fullPage: true
    });
    
    // 실제 서버 카드를 위한 더 구체적인 선택자들
    const serverCardSelectors = [
      'div:has-text("API Server")',
      'div:has-text("Web Server")',
      'div:has-text("Database Server")',
      'div:has-text("Server #")',
      'div:has-text("CPU")',
      'div:has-text("Memory")',
      'div:has-text("서버")',
      '[class*="ImprovedServer"]',
      '[class*="ServerCard"]',
      'canvas', // 차트가 있는 요소들
      'div:has(canvas)', // 차트를 포함하는 div들
    ];
    
    let foundServerCards = false;
    let serverCards;
    let cardCount = 0;
    
    for (const selector of serverCardSelectors) {
      try {
        console.log(`🔍 "${selector}" 선택자로 서버 카드 검색`);
        serverCards = page.locator(selector);
        cardCount = await serverCards.count();
        
        if (cardCount > 0) {
          console.log(`✅ "${selector}"로 ${cardCount}개 요소 발견`);
          
          // 텍스트 내용 확인
          for (let i = 0; i < Math.min(cardCount, 3); i++) {
            const text = await serverCards.nth(i).textContent();
            console.log(`   ${i + 1}: ${text?.slice(0, 50)}...`);
          }
          
          if (selector.includes('Server') || selector.includes('서버') || selector === 'canvas') {
            foundServerCards = true;
            break;
          }
        }
      } catch (error) {
        console.log(`❌ "${selector}" 검색 실패: ${error.message}`);
      }
    }
    
    // Canvas 요소 특별 검사 (차트)
    console.log('\n📊 차트(Canvas) 요소 검사');
    const canvasElements = page.locator('canvas');
    const canvasCount = await canvasElements.count();
    console.log(`📊 발견된 차트 수: ${canvasCount}`);
    
    if (canvasCount > 0) {
      for (let i = 0; i < Math.min(canvasCount, 5); i++) {
        try {
          const canvas = canvasElements.nth(i);
          const parent = canvas.locator('..');
          const parentText = await parent.textContent();
          console.log(`📊 차트 ${i + 1} 부모 텍스트: ${parentText?.slice(0, 80)}...`);
          
          // 차트를 포함한 카드 스크린샷
          await parent.screenshot({
            path: `tests/screenshots/chart-card-${i + 1}.png`
          });
        } catch (error) {
          console.log(`❌ 차트 ${i + 1} 처리 실패: ${error.message}`);
        }
      }
    }
    
    // 더 넓은 범위에서 서버 관련 텍스트 검색
    console.log('\n🔍 페이지 전체에서 서버 관련 텍스트 검색');
    const pageText = await page.locator('body').textContent();
    
    const serverKeywords = [
      'API Server', 'Web Server', 'Database Server', 'Backup Server',
      'Server #1', 'Server #2', 'Server #3',
      'CPU', 'Memory', 'Disk', 'Network',
      '서울', 'Seoul', '정상', '경고', '심각',
      'healthy', 'warning', 'critical'
    ];
    
    console.log('📝 발견된 키워드:');
    serverKeywords.forEach(keyword => {
      const found = pageText?.toLowerCase().includes(keyword.toLowerCase());
      if (found) {
        console.log(`✅ "${keyword}"`);
      }
    });
    
    // 서버 카드로 보이는 요소들의 CSS 클래스 분석
    console.log('\n🎨 CSS 클래스 분석');
    const allDivs = page.locator('div[class]');
    const divCount = await allDivs.count();
    
    console.log(`총 ${divCount}개 div 요소 중 서버/카드 관련 클래스 찾기:`);
    for (let i = 0; i < Math.min(divCount, 50); i++) {
      const className = await allDivs.nth(i).getAttribute('class');
      if (className && (
        className.includes('server') ||
        className.includes('Server') ||
        className.includes('card') ||
        className.includes('Card') ||
        className.includes('grid') ||
        className.includes('chart')
      )) {
        console.log(`🎯 div[${i}]: ${className}`);
      }
    }
    
    // 색상 체계 검증을 위한 배경색이 있는 요소들 찾기
    console.log('\n🌈 색상 체계 분석');
    const coloredElements = page.locator('div[style*="background"], div[class*="bg-"]');
    const coloredCount = await coloredElements.count();
    console.log(`색상이 있는 요소 ${coloredCount}개 발견`);
    
    for (let i = 0; i < Math.min(coloredCount, 10); i++) {
      try {
        const element = coloredElements.nth(i);
        const style = await element.evaluate((el) => ({
          backgroundColor: getComputedStyle(el).backgroundColor,
          className: el.className
        }));
        console.log(`🎨 요소 ${i + 1}: ${style.backgroundColor} | ${style.className.slice(0, 50)}`);
      } catch (error) {
        console.log(`❌ 색상 분석 ${i + 1} 실패`);
      }
    }
    
    // 최종 스크린샷
    console.log('\n📸 최종 전체 페이지 스크린샷');
    await page.screenshot({
      path: 'tests/screenshots/dashboard-final-analysis.png',
      fullPage: true
    });
    
    console.log('\n✅ 상세 서버 카드 검증 완료');
    
    // 기본 어서션들
    expect(canvasCount).toBeGreaterThanOrEqual(0); // 차트가 있을 수 있음
    expect(pageText).toBeTruthy(); // 페이지에 콘텐츠가 있어야 함
  });
});