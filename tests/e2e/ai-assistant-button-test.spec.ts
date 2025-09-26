import { test, expect } from '@playwright/test';

test.describe('AI 어시스턴트 버튼 클릭 테스트', () => {
  test('AI 어시스턴트 버튼 클릭 시 사이드바 활성화 테스트', async ({ page }) => {
    console.log('\n=== AI 어시스턴트 버튼 클릭 테스트 ===');

    // 콘솔 에러 모니터링
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorMsg = `[콘솔 에러] ${msg.text()}`;
        consoleErrors.push(errorMsg);
        console.log(errorMsg);
      }
    });

    // 메인 페이지 접속 (대시보드가 404이므로)
    console.log('📍 메인 페이지 접속 중...');
    await page.goto('/', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // 초기 페이지 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/main-page-initial.png',
      fullPage: true 
    });

    // AI 어시스턴트 버튼 찾기
    console.log('🔍 AI 어시스턴트 버튼 탐지 중...');
    
    const aiButtonSelectors = [
      '[data-testid="ai-assistant"]',
      'button:has-text("AI 어시스턴트")',
      'button:has-text("AI Assistant")',
      '[class*="ai-assistant"]',
      '[aria-label*="AI"]',
      'button[title*="AI"]',
    ];

    let aiButton = null;
    for (const selector of aiButtonSelectors) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          const isVisible = await element.first().isVisible();
          if (isVisible) {
            aiButton = element.first();
            console.log(`✅ AI 버튼 발견: ${selector}`);
            break;
          }
        }
      } catch (error) {
        // 선택자 오류 무시하고 계속
      }
    }

    if (!aiButton) {
      console.log('❌ AI 어시스턴트 버튼을 찾을 수 없습니다. 모든 버튼을 검사합니다...');
      
      // 모든 버튼 텍스트 검사
      const allButtons = await page.locator('button').count();
      console.log(`🔘 전체 버튼 수: ${allButtons}개`);
      
      for (let i = 0; i < Math.min(allButtons, 15); i++) {
        const button = page.locator('button').nth(i);
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        
        console.log(`   버튼 ${i + 1}: "${text}" (가시성: ${isVisible})`);
        
        if (text && text.toLowerCase().includes('ai')) {
          console.log(`   ➡️ AI 관련 버튼 발견: "${text}"`);
          if (isVisible) {
            aiButton = button;
            break;
          }
        }
      }
    }

    if (aiButton) {
      console.log('✅ AI 어시스턴트 버튼을 클릭합니다...');
      
      // 클릭 전 스크린샷
      await page.screenshot({ 
        path: 'test-results/before-ai-button-click.png',
        fullPage: true 
      });

      // AI 버튼 클릭
      await aiButton.click();
      console.log('✅ AI 어시스턴트 버튼 클릭 완료');

      // 클릭 후 변화 대기
      await page.waitForTimeout(3000);

      // 클릭 후 스크린샷
      await page.screenshot({ 
        path: 'test-results/after-ai-button-click.png',
        fullPage: true 
      });

      // 사이드바나 모달 등이 나타났는지 확인
      console.log('🔍 AI 사이드바 또는 모달 확인 중...');
      
      const sidebarElements = await page.locator(
        'aside, [role="dialog"], [role="complementary"], ' +
        '[class*="sidebar"], [class*="modal"], [class*="drawer"], ' +
        '[data-testid*="sidebar"], [data-testid*="modal"]'
      ).count();
      
      if (sidebarElements > 0) {
        console.log(`✅ ${sidebarElements}개의 사이드바/모달 요소 발견`);
        
        // 각 요소의 가시성 확인
        for (let i = 0; i < sidebarElements; i++) {
          const element = page.locator(
            'aside, [role="dialog"], [role="complementary"], ' +
            '[class*="sidebar"], [class*="modal"], [class*="drawer"], ' +
            '[data-testid*="sidebar"], [data-testid*="modal"]'
          ).nth(i);
          
          const isVisible = await element.isVisible();
          const className = await element.getAttribute('class');
          
          console.log(`   요소 ${i + 1}: 가시성=${isVisible}, class="${className}"`);
        }
      } else {
        console.log('❌ 사이드바나 모달이 나타나지 않음');
      }

      // 입력 필드 확인
      const inputFields = await page.locator('input, textarea').count();
      console.log(`📝 입력 필드 수: ${inputFields}개 (클릭 후)`);

    } else {
      console.log('❌ AI 어시스턴트 버튼을 찾을 수 없습니다.');
    }

    // 콘솔 에러 요약
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️ 발견된 콘솔 에러 ${consoleErrors.length}개:`);
      consoleErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ 콘솔 에러 없음');
    }

    // 최종 진단
    console.log('\n📊 최종 진단:');
    if (aiButton) {
      console.log('✅ AI 어시스턴트 버튼 존재');
      console.log('🔧 버튼 클릭 기능 테스트 완료');
      
      if (sidebarElements > 0) {
        console.log('✅ AI 인터페이스 요소 활성화됨');
      } else {
        console.log('⚠️ AI 인터페이스가 시각적으로 나타나지 않음');
      }
    } else {
      console.log('❌ AI 어시스턴트 버튼 미발견');
      console.log('🔧 AI 어시스턴트 기능 구현 필요');
    }
  });

  test('인증 페이지에서 게스트 로그인 후 AI 테스트', async ({ page }) => {
    console.log('\n=== 게스트 로그인 후 AI 테스트 ===');

    // 루트 페이지 접속
    await page.goto('http://localhost:3000');
    
    // 게스트 로그인 버튼 찾기
    const guestButton = page.locator('button:has-text("게스트로 체험하기")');
    
    if (await guestButton.isVisible()) {
      console.log('✅ 게스트 로그인 버튼 발견');
      
      await page.screenshot({ 
        path: 'test-results/before-guest-login.png',
        fullPage: true 
      });

      await guestButton.click();
      console.log('✅ 게스트 로그인 클릭');
      
      // 페이지 전환 대기
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'test-results/after-guest-login.png',
        fullPage: true 
      });

      // 현재 URL 확인
      const currentUrl = page.url();
      console.log(`📍 현재 URL: ${currentUrl}`);
      
      // AI 어시스턴트 버튼 다시 찾기
      const aiButton = page.locator('button:has-text("AI 어시스턴트")');
      
      if (await aiButton.isVisible()) {
        console.log('✅ 로그인 후 AI 어시스턴트 버튼 발견');
        
        await aiButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: 'test-results/ai-after-guest-login.png',
          fullPage: true 
        });
      } else {
        console.log('❌ 로그인 후에도 AI 어시스턴트 버튼 미발견');
      }
    } else {
      console.log('❌ 게스트 로그인 버튼 미발견');
    }
  });
});