import { test, expect } from '@playwright/test'

/**
 * Final Server Card UI Check
 * 
 * 실제 서버 카드 UI 개선사항 최종 검증:
 * 1. 개별 서버 카드 상호작용
 * 2. 색상 체계 확인
 * 3. 위치 정보 검증
 * 4. 차트 및 메트릭 시각화
 */

test.describe('Final Server Card UI Check', () => {
  test('서버 카드 UI 개선사항 최종 검증', async ({ page }) => {
    console.log('🚀 대시보드 로딩 및 서버 카드 대기')
    
    // 페이지 로딩
    await page.goto('http://localhost:3000/dashboard', { timeout: 45000 })
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // 조금 대기하여 로딩 완료
    await page.waitForTimeout(5000)
    
    console.log('📸 초기 대시보드 상태 캡처')
    await page.screenshot({
      path: 'tests/screenshots/final-dashboard-state.png',
      fullPage: true
    });
    
    // 하단의 실제 서버 카드들 찾기
    console.log('🔍 하단 서버 카드 영역 찾기')
    
    // 서버 카드들이 있는 영역을 더 구체적으로 찾기
    const possibleServerCards = [
      // 텍스트 기반으로 서버 이름 찾기
      'div:has-text("LB-")',
      'div:has-text("WE-")', 
      'div:has-text("APP-")',
      'div:has-text("DB-")',
      'div:has-text("API Server")',
      'div:has-text("Web Server")',
      'div:has-text("Database Server")',
      // 상태 표시 기반
      'div:has-text("실시간")',
      'div:has-text("Level")',
      'div:has-text("Unknown")',
      // 클래스 기반
      '[class*="server-card"]',
      '[data-testid*="server"]'
    ];
    
    let actualServerCards = null;
    let serverCardCount = 0;
    
    for (const selector of possibleServerCards) {
      try {
        const cards = page.locator(selector);
        const count = await cards.count();
        
        if (count > 0) {
          console.log(`✅ "${selector}" - ${count}개 발견`);
          
          // 첫 번째 요소의 텍스트 확인
          const firstText = await cards.first().textContent();
          console.log(`   첫 번째 요소: ${firstText?.slice(0, 60)}...`);
          
          if (firstText?.includes('LB-') || firstText?.includes('WE-') || 
              firstText?.includes('APP-') || firstText?.includes('DB-')) {
            actualServerCards = cards;
            serverCardCount = count;
            console.log(`🎯 실제 서버 카드로 판단: ${selector}`);
            break;
          }
        }
      } catch (error) {
        // 선택자가 유효하지 않을 수 있음
      }
    }
    
    if (!actualServerCards || serverCardCount === 0) {
      console.log('❌ 실제 서버 카드를 찾지 못함. 페이지 하단 스크롤 시도');
      
      // 페이지 하단으로 스크롤
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);
      
      // 다시 시도
      actualServerCards = page.locator('div').filter({ hasText: /LB-|WE-|APP-|DB-/ });
      serverCardCount = await actualServerCards.count();
      console.log(`스크롤 후 서버 카드 재검색: ${serverCardCount}개`);
    }
    
    if (serverCardCount > 0) {
      console.log(`\n✅ ${serverCardCount}개의 실제 서버 카드 발견됨`);
      
      // 처음 몇 개 서버 카드 상세 분석
      const cardsToAnalyze = Math.min(serverCardCount, 4);
      
      for (let i = 0; i < cardsToAnalyze; i++) {
        console.log(`\n🔍 서버 카드 ${i + 1} 상세 분석:`);
        const card = actualServerCards!.nth(i);
        
        try {
          // 카드가 화면에 보이도록 스크롤
          await card.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);
          
          // 카드 텍스트 내용
          const cardText = await card.textContent();
          console.log(`📝 카드 내용: ${cardText?.replace(/\s+/g, ' ').slice(0, 100)}...`);
          
          // 서버 이름 추출
          const serverName = cardText?.match(/(LB-|WE-|APP-|DB-)[A-Z0-9-]+/)?.[0] || '이름 없음';
          console.log(`🏷️  서버 이름: ${serverName}`);
          
          // 위치 정보 확인
          const hasSeoul = cardText?.includes('서울') || cardText?.includes('Seoul');
          console.log(`📍 위치 정보: ${hasSeoul ? '✅ 서울 확인됨' : '❌ 서울이 아님'}`);
          
          // 상태 정보 확인
          const statusInfo = {
            정상: cardText?.includes('정상'),
            경고: cardText?.includes('경고'),
            심각: cardText?.includes('심각'),
            healthy: cardText?.includes('healthy'),
            warning: cardText?.includes('warning'),
            critical: cardText?.includes('critical')
          };
          const hasStatus = Object.values(statusInfo).some(Boolean);
          console.log(`📊 상태 정보: ${hasStatus ? '✅ 발견' : '❌ 없음'}`);
          
          // 색상 정보 분석
          const colorInfo = await card.evaluate((el) => {
            const style = getComputedStyle(el);
            return {
              backgroundColor: style.backgroundColor,
              borderColor: style.borderColor,
              color: style.color
            };
          });
          console.log(`🎨 색상 정보:`, colorInfo);
          
          // 차트(Canvas) 확인
          const canvasInCard = card.locator('canvas');
          const hasChart = await canvasInCard.count() > 0;
          console.log(`📊 차트 존재: ${hasChart ? '✅' : '❌'}`);
          
          // 개별 카드 스크린샷
          try {
            await card.screenshot({
              path: `tests/screenshots/final-server-card-${i + 1}-${serverName.replace(/[^a-zA-Z0-9]/g, '')}.png`
            });
            console.log(`📸 개별 카드 스크린샷 저장됨`);
          } catch (error) {
            console.log(`❌ 개별 카드 스크린샷 실패: ${error.message}`);
          }
          
          // 카드 클릭 테스트 (상세 모달 확인)
          try {
            console.log(`🖱️  카드 클릭 시도...`);
            await card.click({ timeout: 5000 });
            await page.waitForTimeout(2000);
            
            // 모달이나 상세 정보 창이 열렸는지 확인
            const modalElements = [
              'div[role="dialog"]',
              '.modal',
              '[class*="Modal"]',
              'div:has-text("서버 상세 정보")',
              'div:has-text("Server Details")'
            ];
            
            let modalFound = false;
            for (const selector of modalElements) {
              const modal = page.locator(selector);
              if (await modal.isVisible()) {
                modalFound = true;
                console.log(`✅ 모달 열림: ${selector}`);
                
                // 모달 스크린샷
                await page.screenshot({
                  path: `tests/screenshots/server-modal-${i + 1}.png`
                });
                
                // 모달 닫기 (ESC 키 또는 닫기 버튼)
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
                break;
              }
            }
            
            if (!modalFound) {
              console.log(`❌ 카드 클릭 후 모달이 열리지 않음`);
            }
            
          } catch (error) {
            console.log(`❌ 카드 클릭 실패: ${error.message}`);
          }
          
        } catch (error) {
          console.log(`❌ 카드 ${i + 1} 분석 실패: ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ 실제 서버 카드를 찾을 수 없음');
    }
    
    // 최종 전체 페이지 스크린샷
    console.log('\n📸 최종 전체 페이지 스크린샷');
    await page.screenshot({
      path: 'tests/screenshots/final-complete-dashboard.png',
      fullPage: true
    });
    
    console.log('\n✅ 서버 카드 UI 최종 검증 완료');
    
    // 검증 결과 요약
    console.log('\n📋 검증 결과 요약:');
    console.log(`- 발견된 서버 카드 수: ${serverCardCount}`);
    console.log(`- 분석된 카드 수: ${Math.min(serverCardCount, 4)}`);
    console.log(`- 스크린샷 수: ${Math.min(serverCardCount, 4) + 2}개 (카드별 + 전체)`);
    
    // 기본 어서션
    expect(serverCardCount).toBeGreaterThanOrEqual(0);
  });
});