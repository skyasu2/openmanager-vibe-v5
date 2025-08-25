import { test, expect, type Page } from '@playwright/test';

test.describe('AI 사이드바 V3 대시보드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 및 네트워크 요청 모니터링 설정
    const consoleErrors: string[] = [];
    const apiErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorMsg = `[브라우저 콘솔 에러] ${msg.text()}`;
        consoleErrors.push(errorMsg);
        console.log(errorMsg);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/') && !response.ok()) {
        const errorMsg = `[API 에러] ${response.url()}: ${response.status()}`;
        apiErrors.push(errorMsg);
        console.log(errorMsg);
      }
    });

    // 대시보드 페이지로 직접 접속 (인증 무시)
    console.log('📍 대시보드 페이지 접속 중...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 페이지 로드 완료 대기
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
  });

  test('대시보드 페이지 AI 사이드바 렌더링 테스트', async ({ page }) => {
    console.log('\n=== 대시보드 AI 사이드바 렌더링 테스트 ===');

    // 1. 페이지 초기 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/dashboard-initial.png',
      fullPage: true 
    });

    // 2. 다양한 방법으로 AI 사이드바 찾기
    await test.step('AI 사이드바 탐지', async () => {
      // 방법 1: 일반적인 선택자들
      const sidebarSelectors = [
        '[data-testid="ai-sidebar"]',
        '[data-testid*="ai"]',
        '.ai-sidebar',
        '[class*="ai-sidebar"]',
        '[class*="sidebar"]',
        '[id*="ai"]',
        'aside',
        '[role="complementary"]',
        '.chatbot',
        '.chat-widget',
        '.ai-assistant'
      ];

      let foundSidebar = false;
      for (const selector of sidebarSelectors) {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✅ ${selector}: ${elements}개 발견`);
          foundSidebar = true;
          
          // 첫 번째로 발견된 사이드바 상세 정보
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible();
          const textContent = await element.textContent();
          
          console.log(`   - 가시성: ${isVisible ? '보임' : '숨김'}`);
          console.log(`   - 텍스트: ${textContent?.slice(0, 100)}...`);
          
          if (isVisible) {
            await page.screenshot({ 
              path: `test-results/sidebar-found-${selector.replace(/[[\]"'*:]/g, '-')}.png`,
              fullPage: true 
            });
          }
        } else {
          console.log(`❌ ${selector}: 없음`);
        }
      }

      if (!foundSidebar) {
        console.log('⚠️ AI 사이드바를 찾을 수 없습니다. 전체 DOM 구조를 분석합니다...');
        
        // DOM 구조 분석
        const bodyStructure = await page.evaluate(() => {
          const getAllElements = (element: Element, depth = 0): string => {
            if (depth > 3) return '';
            
            let result = `${'  '.repeat(depth)}<${element.tagName.toLowerCase()}`;
            if (element.id) result += ` id="${element.id}"`;
            if (element.className) result += ` class="${element.className}"`;
            result += '>\n';
            
            for (let i = 0; i < Math.min(element.children.length, 5); i++) {
              result += getAllElements(element.children[i], depth + 1);
            }
            
            return result;
          };
          
          return getAllElements(document.body);
        });
        
        console.log('📋 DOM 구조:');
        console.log(bodyStructure);
      }
    });

    // 3. 모든 버튼 찾기 (AI 관련 버튼 탐지)
    await test.step('AI 관련 버튼 탐지', async () => {
      const allButtons = await page.locator('button').count();
      console.log(`🔘 전체 버튼 수: ${allButtons}개`);

      for (let i = 0; i < Math.min(allButtons, 10); i++) {
        const button = page.locator('button').nth(i);
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        
        if (text && (text.toLowerCase().includes('ai') || 
                     text.toLowerCase().includes('chat') || 
                     text.toLowerCase().includes('assistant'))) {
          console.log(`✅ AI 관련 버튼 발견: "${text}" (가시성: ${isVisible})`);
        }
      }
    });

    // 4. 입력 필드들 찾기
    await test.step('입력 필드 탐지', async () => {
      const inputs = await page.locator('input, textarea').count();
      console.log(`📝 입력 필드 수: ${inputs}개`);

      if (inputs > 0) {
        for (let i = 0; i < Math.min(inputs, 5); i++) {
          const input = page.locator('input, textarea').nth(i);
          const placeholder = await input.getAttribute('placeholder');
          const type = await input.getAttribute('type');
          const isVisible = await input.isVisible();
          
          console.log(`   입력 ${i + 1}: type="${type}", placeholder="${placeholder}", 가시성: ${isVisible}`);
        }
      }
    });
  });

  test('AI 기능 실제 존재 여부 테스트', async ({ page }) => {
    console.log('\n=== AI 기능 실제 존재 여부 테스트 ===');

    // 1. AI 관련 API 엔드포인트 테스트
    await test.step('AI API 엔드포인트 확인', async () => {
      const aiEndpoints = [
        '/api/ai/chat',
        '/api/ai/query',
        '/api/ai/assistant',
        '/api/chat',
        '/api/openai',
        '/api/google-ai'
      ];

      for (const endpoint of aiEndpoints) {
        try {
          const response = await page.request.get(`http://localhost:3000${endpoint}`);
          console.log(`🔗 ${endpoint}: ${response.status()}`);
          
          if (response.status() !== 404) {
            const responseText = await response.text();
            console.log(`   응답: ${responseText.slice(0, 100)}...`);
          }
        } catch (error) {
          console.log(`❌ ${endpoint}: 에러 - ${error}`);
        }
      }
    });

    // 2. JavaScript에서 AI 관련 전역 변수/함수 확인
    await test.step('브라우저 내 AI 관련 객체 확인', async () => {
      const aiObjects = await page.evaluate(() => {
        const globalKeys = Object.keys(window as any);
        const aiRelated = globalKeys.filter(key => 
          key.toLowerCase().includes('ai') || 
          key.toLowerCase().includes('chat') ||
          key.toLowerCase().includes('openai') ||
          key.toLowerCase().includes('google')
        );
        
        return aiRelated.map(key => ({
          name: key,
          type: typeof (window as any)[key],
          value: String((window as any)[key]).slice(0, 100)
        }));
      });

      if (aiObjects.length > 0) {
        console.log('🧠 브라우저 내 AI 관련 객체들:');
        aiObjects.forEach(obj => {
          console.log(`   ${obj.name}: ${obj.type} - ${obj.value}`);
        });
      } else {
        console.log('❌ AI 관련 전역 객체 없음');
      }
    });

    // 3. React 컴포넌트 트리에서 AI 컴포넌트 찾기
    await test.step('React AI 컴포넌트 탐지', async () => {
      const reactElements = await page.evaluate(() => {
        const findReactElements = (element: Element): string[] => {
          const results: string[] = [];
          
          // React fiber 탐지 시도
          const fiber = (element as any)._reactInternalFiber || 
                       (element as any).__reactInternalInstance;
          
          if (fiber) {
            const componentName = fiber.elementType?.name || 
                                fiber.type?.name || 
                                'Unknown';
            
            if (componentName.toLowerCase().includes('ai') ||
                componentName.toLowerCase().includes('chat') ||
                componentName.toLowerCase().includes('sidebar')) {
              results.push(componentName);
            }
          }
          
          // 자식 요소들도 검사
          for (const child of element.children) {
            results.push(...findReactElements(child));
          }
          
          return results;
        };
        
        return findReactElements(document.body);
      });

      if (reactElements.length > 0) {
        console.log('⚛️ AI 관련 React 컴포넌트들:');
        [...new Set(reactElements)].forEach(component => {
          console.log(`   - ${component}`);
        });
      } else {
        console.log('❌ AI 관련 React 컴포넌트 미발견');
      }
    });
  });

  test('실제 사용자 시나리오: 서버 상태 질문', async ({ page }) => {
    console.log('\n=== 실제 사용자 시나리오: 서버 상태 질문 ===');

    // 먼저 사용 가능한 모든 입력 방법 시도
    await test.step('사용 가능한 입력 방법 탐지', async () => {
      // 방법 1: 텍스트 입력 필드 찾기
      const textInputs = await page.locator('input[type="text"], textarea').count();
      console.log(`📝 텍스트 입력 필드: ${textInputs}개`);

      // 방법 2: 채팅 관련 입력 필드 찾기
      const chatInputs = await page.locator(
        'input[placeholder*="chat" i], input[placeholder*="message" i], ' +
        'textarea[placeholder*="chat" i], textarea[placeholder*="message" i], ' +
        'input[placeholder*="질문" i], textarea[placeholder*="질문" i]'
      ).count();
      console.log(`💬 채팅 관련 입력 필드: ${chatInputs}개`);

      // 방법 3: 검색 입력 필드 확인 (AI 검색 가능성)
      const searchInputs = await page.locator(
        'input[type="search"], input[placeholder*="search" i], ' +
        'input[placeholder*="검색" i]'
      ).count();
      console.log(`🔍 검색 입력 필드: ${searchInputs}개`);

      // 사용 가능한 입력 필드가 있으면 테스트 진행
      if (textInputs > 0 || chatInputs > 0 || searchInputs > 0) {
        const inputField = page.locator('input, textarea').first();
        const placeholder = await inputField.getAttribute('placeholder');
        const isVisible = await inputField.isVisible();
        
        console.log(`✅ 입력 필드 발견: placeholder="${placeholder}", 가시성: ${isVisible}`);
        
        if (isVisible) {
          // 실제 질문 입력 시도
          const testQuestion = "서버 상태 알려줘";
          await inputField.fill(testQuestion);
          console.log(`✅ 질문 입력: "${testQuestion}"`);
          
          // 전송 버튼 찾기
          const sendButtons = await page.locator(
            'button:has-text("전송"), button:has-text("Send"), ' +
            'button:has-text("보내기"), button[type="submit"]'
          ).count();
          
          if (sendButtons > 0) {
            await page.locator(
              'button:has-text("전송"), button:has-text("Send"), ' +
              'button:has-text("보내기"), button[type="submit"]'
            ).first().click();
            
            console.log('✅ 전송 버튼 클릭');
            
            // 응답 대기
            await page.waitForTimeout(5000);
            
            await page.screenshot({ 
              path: 'test-results/after-question.png',
              fullPage: true 
            });
          } else {
            // Enter 키로 전송 시도
            await inputField.press('Enter');
            console.log('✅ Enter 키로 전송 시도');
            
            await page.waitForTimeout(3000);
            await page.screenshot({ 
              path: 'test-results/after-enter.png',
              fullPage: true 
            });
          }
        }
      } else {
        console.log('❌ 사용 가능한 입력 필드 없음');
      }
    });
  });

  test('종합 진단 및 서비스 가능성 평가', async ({ page }) => {
    console.log('\n=== 종합 진단 및 서비스 가능성 평가 ===');

    // 최종 페이지 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/dashboard-final.png',
      fullPage: true 
    });

    // 성능 메트릭 수집
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        networkRequests: performance.getEntriesByType('resource').length,
      };
    });

    console.log('📊 성능 메트릭:');
    console.log(`   페이지 로드 시간: ${performanceMetrics.loadTime.toFixed(2)}ms`);
    console.log(`   DOM 로드 시간: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
    console.log(`   네트워크 요청 수: ${performanceMetrics.networkRequests}개`);

    // UI 요소 최종 집계
    const finalUICount = await page.evaluate(() => ({
      totalElements: document.querySelectorAll('*').length,
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input, textarea').length,
      forms: document.querySelectorAll('form').length,
      divs: document.querySelectorAll('div').length,
      images: document.querySelectorAll('img').length,
    }));

    console.log('📊 UI 요소 최종 집계:');
    Object.entries(finalUICount).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}개`);
    });

    // AI 사이드바 존재 여부 최종 판정
    const hasSidebar = await page.locator('aside, [class*="sidebar"], [data-testid*="sidebar"]').count() > 0;
    const hasAIElements = await page.locator('[class*="ai"], [data-testid*="ai"], [id*="ai"]').count() > 0;
    const hasChatElements = await page.locator('[class*="chat"], [data-testid*="chat"], [placeholder*="chat" i]').count() > 0;

    console.log('\n🎯 최종 진단 결과:');
    console.log(`   사이드바 존재: ${hasSidebar ? '✅' : '❌'}`);
    console.log(`   AI 요소 존재: ${hasAIElements ? '✅' : '❌'}`);
    console.log(`   채팅 요소 존재: ${hasChatElements ? '✅' : '❌'}`);

    // 서비스 가능성 평가
    if (hasSidebar && (hasAIElements || hasChatElements)) {
      console.log('\n🎉 결론: AI 사이드바 V3가 부분적으로 구현되어 있음');
      console.log('   ✅ 기본 UI 구조 존재');
      console.log('   🔧 추가 기능 구현 필요');
    } else if (finalUICount.inputs > 0 && finalUICount.buttons > 0) {
      console.log('\n⚠️ 결론: AI 사이드바는 없지만 기본 인터페이스 존재');
      console.log('   ✅ 입력/출력 인터페이스 가능');
      console.log('   🚧 AI 사이드바 구현 필요');
    } else {
      console.log('\n❌ 결론: AI 사이드바 V3 미구현');
      console.log('   🔧 전면적인 구현 필요');
      console.log('   📋 사용자 인터페이스 설계부터 필요');
    }

    // 개선 권장사항
    console.log('\n📋 개선 권장사항:');
    if (!hasSidebar) {
      console.log('   1. AI 사이드바 컴포넌트 구현');
    }
    if (!hasAIElements) {
      console.log('   2. AI 관련 UI 요소 추가');
    }
    if (!hasChatElements) {
      console.log('   3. 채팅 인터페이스 구현');
    }
    if (performanceMetrics.loadTime > 3000) {
      console.log('   4. 페이지 로딩 성능 최적화');
    }
  });
});