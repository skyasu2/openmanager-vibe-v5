import { test, expect, type Page } from '@playwright/test';

test.describe('AI 사이드바 V3 종합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 및 네트워크 요청 모니터링 설정
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`[브라우저 콘솔 에러] ${msg.text()}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/') && !response.ok()) {
        console.log(`[API 에러] ${response.url()}: ${response.status()}`);
      }
    });

    // 개발 서버 접속
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // AI 사이드바 로드 대기
  });

  test('Phase 1: UI 기본 렌더링 테스트', async ({ page }) => {
    console.log('\n=== Phase 1: UI 기본 렌더링 테스트 ===');

    // 1. AI 사이드바 존재 여부 확인
    await test.step('AI 사이드바 존재 여부 확인', async () => {
      const sidebar = page.locator('[data-testid="ai-sidebar"], .ai-sidebar, [id*="ai"], [class*="sidebar"]');
      await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'test-results/ai-sidebar-rendered.png',
        fullPage: true 
      });
      console.log('✅ AI 사이드바 렌더링 확인');
    });

    // 2. V3 UI 구성요소 렌더링 상태 점검
    await test.step('V3 UI 구성요소 확인', async () => {
      // 입력 필드 확인
      const inputField = page.locator('input[type="text"], textarea').first();
      if (await inputField.isVisible()) {
        console.log('✅ 입력 필드 존재');
      } else {
        console.log('❌ 입력 필드 미발견');
      }

      // 버튼 확인
      const sendButton = page.locator('button').filter({ hasText: /send|보내기|전송/i });
      if (await sendButton.count() > 0) {
        console.log('✅ 전송 버튼 존재');
      } else {
        console.log('❌ 전송 버튼 미발견');
      }

      // AI 모드 선택기 확인
      const modeSelector = page.locator('select, .dropdown, [data-testid*="mode"], [class*="selector"]');
      if (await modeSelector.count() > 0) {
        console.log('✅ AI 모드 선택기 존재');
      } else {
        console.log('❌ AI 모드 선택기 미발견');
      }
    });

    // 3. 채팅 메시지 영역 확인
    await test.step('채팅 메시지 영역 확인', async () => {
      const chatArea = page.locator('[data-testid*="chat"], [class*="message"], [class*="chat"]');
      if (await chatArea.count() > 0) {
        console.log('✅ 채팅 메시지 영역 존재');
      } else {
        console.log('❌ 채팅 메시지 영역 미발견');
      }
    });
  });

  test('Phase 2: AI 질의 기능 테스트', async ({ page }) => {
    console.log('\n=== Phase 2: AI 질의 기능 테스트 ===');

    // 입력 필드와 전송 버튼 찾기
    const inputField = page.locator('input[type="text"], textarea').first();
    const sendButton = page.locator('button').filter({ hasText: /send|보내기|전송|submit/i }).first();

    if (!(await inputField.isVisible()) || !(await sendButton.isVisible())) {
      console.log('❌ 입력 UI 요소를 찾을 수 없어 질의 테스트 스킵');
      return;
    }

    // 1. 간단한 질문 입력 테스트
    await test.step('간단한 질문 입력', async () => {
      const testMessage = "서버 상태 알려줘";
      
      await inputField.fill(testMessage);
      console.log(`✅ 메시지 입력: "${testMessage}"`);
      
      // 전송 전 스크린샷
      await page.screenshot({ 
        path: 'test-results/before-send-message.png',
        fullPage: true 
      });

      const startTime = Date.now();
      await sendButton.click();
      console.log('✅ 메시지 전송');

      // 응답 대기 (최대 30초)
      try {
        await page.waitForSelector('.message, [data-testid*="message"], [class*="response"]', { 
          timeout: 30000 
        });
        const responseTime = Date.now() - startTime;
        console.log(`✅ 응답 수신 (${responseTime}ms)`);
        
        // 응답 후 스크린샷
        await page.screenshot({ 
          path: 'test-results/after-response.png',
          fullPage: true 
        });
      } catch (error) {
        console.log('❌ 응답 타임아웃 또는 응답 없음');
        await page.screenshot({ 
          path: 'test-results/response-timeout.png',
          fullPage: true 
        });
      }
    });

    // 2. 에러 메시지 처리 상태 확인
    await test.step('에러 메시지 처리 확인', async () => {
      const errorElements = page.locator('.error, [class*="error"], [data-testid*="error"]');
      const errorCount = await errorElements.count();
      
      if (errorCount > 0) {
        console.log(`⚠️ ${errorCount}개의 에러 메시지 발견`);
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorElements.nth(i).textContent();
          console.log(`   에러 ${i + 1}: ${errorText}`);
        }
      } else {
        console.log('✅ 에러 메시지 없음');
      }
    });
  });

  test('Phase 3: V3 신규 기능 테스트', async ({ page }) => {
    console.log('\n=== Phase 3: V3 신규 기능 테스트 ===');

    // 1. ThinkingProcessVisualizer 확인
    await test.step('ThinkingProcessVisualizer 표시 여부', async () => {
      const thinkingElements = page.locator('[data-testid*="thinking"], [class*="thinking"], [class*="process"]');
      const thinkingCount = await thinkingElements.count();
      
      if (thinkingCount > 0) {
        console.log('✅ Thinking Process Visualizer 발견');
        await page.screenshot({ 
          path: 'test-results/thinking-visualizer.png',
          fullPage: true 
        });
      } else {
        console.log('❌ Thinking Process Visualizer 미발견');
      }
    });

    // 2. EnhancedChatMessage 렌더링 확인
    await test.step('EnhancedChatMessage 렌더링 확인', async () => {
      const enhancedMessages = page.locator('[data-testid*="enhanced"], [class*="enhanced-message"]');
      const enhancedCount = await enhancedMessages.count();
      
      if (enhancedCount > 0) {
        console.log('✅ Enhanced Chat Message 발견');
      } else {
        console.log('❌ Enhanced Chat Message 미발견');
      }
    });

    // 3. 메시지 히스토리 관리 확인
    await test.step('메시지 히스토리 관리 확인', async () => {
      const allMessages = page.locator('[class*="message"], [data-testid*="message"]');
      const messageCount = await allMessages.count();
      
      console.log(`📊 현재 메시지 수: ${messageCount}`);
      if (messageCount > 50) {
        console.log('⚠️ 메시지 수가 MAX_MESSAGES(50)을 초과');
      } else {
        console.log('✅ 메시지 수 제한 정상');
      }
    });
  });

  test('Phase 4: 에러 처리 및 사용자 경험', async ({ page }) => {
    console.log('\n=== Phase 4: 에러 처리 및 사용자 경험 ===');

    // 1. 네트워크 에러 시뮬레이션
    await test.step('네트워크 에러 처리 테스트', async () => {
      // API 요청을 가로채서 에러 반환
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      const inputField = page.locator('input[type="text"], textarea').first();
      const sendButton = page.locator('button').filter({ hasText: /send|보내기|전송/i }).first();

      if (await inputField.isVisible() && await sendButton.isVisible()) {
        await inputField.fill("네트워크 에러 테스트");
        await sendButton.click();

        // 에러 메시지 표시 확인
        try {
          await page.waitForSelector('.error, [class*="error"]', { timeout: 10000 });
          console.log('✅ 네트워크 에러 처리 정상');
          
          await page.screenshot({ 
            path: 'test-results/network-error-handling.png',
            fullPage: true 
          });
        } catch {
          console.log('❌ 네트워크 에러 처리 미흡');
        }
      }

      // 네트워크 가로채기 해제
      await page.unroute('**/api/**');
    });

    // 2. 로딩 상태 확인
    await test.step('로딩 상태 표시 확인', async () => {
      const loadingElements = page.locator('[class*="loading"], [data-testid*="loading"], .spinner');
      const loadingCount = await loadingElements.count();
      
      if (loadingCount > 0) {
        console.log('✅ 로딩 상태 표시 존재');
      } else {
        console.log('❌ 로딩 상태 표시 미발견');
      }
    });

    // 3. 사용자 피드백 메커니즘 확인
    await test.step('사용자 피드백 메커니즘', async () => {
      const feedbackElements = page.locator('[class*="feedback"], [data-testid*="feedback"], button[title*="피드백"]');
      const feedbackCount = await feedbackElements.count();
      
      if (feedbackCount > 0) {
        console.log('✅ 사용자 피드백 메커니즘 존재');
      } else {
        console.log('❌ 사용자 피드백 메커니즘 미발견');
      }
    });
  });

  test('종합 평가 및 실제 서비스 가능성 진단', async ({ page }) => {
    console.log('\n=== 종합 평가 및 실제 서비스 가능성 진단 ===');

    // 최종 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/final-state.png',
      fullPage: true 
    });

    // 성능 메트릭 수집
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    console.log('📊 성능 메트릭:');
    console.log(`   페이지 로드 시간: ${performanceMetrics.loadTime.toFixed(2)}ms`);
    console.log(`   DOM 로드 시간: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);

    // 전체 UI 요소 존재 여부 최종 체크
    const uiElements = {
      sidebar: await page.locator('[data-testid="ai-sidebar"], .ai-sidebar, [class*="sidebar"]').count(),
      input: await page.locator('input, textarea').count(),
      buttons: await page.locator('button').count(),
      messages: await page.locator('[class*="message"]').count(),
    };

    console.log('📊 UI 요소 수량:');
    console.log(`   사이드바: ${uiElements.sidebar}개`);
    console.log(`   입력 필드: ${uiElements.input}개`);
    console.log(`   버튼: ${uiElements.buttons}개`);
    console.log(`   메시지: ${uiElements.messages}개`);

    // 실제 서비스 가능성 평가
    const criticalIssues = [];
    if (uiElements.sidebar === 0) criticalIssues.push('AI 사이드바 미렌더링');
    if (uiElements.input === 0) criticalIssues.push('입력 필드 없음');
    if (performanceMetrics.loadTime > 3000) criticalIssues.push('로딩 시간 과다');

    if (criticalIssues.length === 0) {
      console.log('🎉 실제 서비스 가능: 기본 UI가 정상 작동');
    } else {
      console.log('⚠️ 서비스 개선 필요:');
      criticalIssues.forEach(issue => console.log(`   - ${issue}`));
    }
  });
});