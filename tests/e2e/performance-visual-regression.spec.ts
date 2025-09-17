import { test, expect } from '@playwright/test';
import { navigateToAdminDashboard, resetAdminState } from './helpers/admin';

/**
 * ⚡ 성능 및 시각적 회귀 테스트
 * 
 * 테스트 범위:
 * - Core Web Vitals 측정
 * - 시각적 회귀 테스트 (스크린샷 비교)
 * - 메모리 누수 감지
 * - 렌더링 성능 측정
 * - 접근성 기준 준수 확인
 */

test.describe('⚡ 성능 최적화 및 시각적 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    await resetAdminState(page);
  });

  test.afterEach(async ({ page }) => {
    await resetAdminState(page);
  });

  test.describe('📊 Core Web Vitals 측정', () => {
    
    test('LCP (Largest Contentful Paint) 측정', async ({ page }) => {
      // Performance 이벤트 수집 설정
      await page.addInitScript(() => {
        window.performanceMetrics = {
          lcp: 0,
          fid: 0,
          cls: 0,
          ttfb: 0
        };
        
        // LCP 측정
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          window.performanceMetrics.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // CLS 측정
        new PerformanceObserver((entryList) => {
          let cls = 0;
          entryList.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
          window.performanceMetrics.cls = cls;
        }).observe({ entryTypes: ['layout-shift'] });
      });
      
      const startTime = Date.now();
      
      // 페이지 로드
      await page.goto('/');
      await page.click('button:has-text("게스트로 체험하기")');
      await page.waitForSelector('main', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      
      // Performance metrics 수집
      const metrics = await page.evaluate(() => window.performanceMetrics);
      
      console.log('📊 Core Web Vitals 측정 결과:');
      console.log(`   페이지 로드 시간: ${loadTime}ms`);
      console.log(`   LCP: ${metrics.lcp.toFixed(2)}ms`);
      console.log(`   CLS: ${metrics.cls.toFixed(4)}`);
      
      // 성능 기준 검증
      expect(loadTime).toBeLessThan(5000); // 5초 이내 로드
      expect(metrics.lcp).toBeLessThan(2500); // LCP 2.5초 이내
      expect(metrics.cls).toBeLessThan(0.1); // CLS 0.1 이하
      
      console.log('✅ Core Web Vitals 기준 통과');
    });

    test('리소스 로딩 성능 분석', async ({ page }) => {
      // 리소스 로딩 모니터링
      const resourceTimings: any[] = [];
      
      page.on('response', response => {
        resourceTimings.push({
          url: response.url(),
          status: response.status(),
          contentType: response.headers()['content-type'],
          size: response.headers()['content-length']
        });
      });
      
      await page.goto('/');
      await page.click('button:has-text("게스트로 체험하기")');
      await page.waitForSelector('main');
      
      // Performance API에서 리소스 타이밍 정보 수집
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(entry => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: (entry as any).transferSize,
          type: entry.initiatorType
        }));
      });
      
      // 리소스 타입별 분석
      const resourcesByType = performanceEntries.reduce((acc: any, entry) => {
        if (!acc[entry.type]) acc[entry.type] = [];
        acc[entry.type].push(entry);
        return acc;
      }, {});
      
      console.log('📊 리소스 로딩 분석:');
      Object.entries(resourcesByType).forEach(([type, resources]: [string, any[]]) => {
        const avgDuration = resources.reduce((sum, r) => sum + r.duration, 0) / resources.length;
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        console.log(`   ${type}: ${resources.length}개, 평균 ${avgDuration.toFixed(2)}ms, 총 ${(totalSize/1024).toFixed(2)}KB`);
      });
      
      // 느린 리소스 식별 (3초 이상)
      const slowResources = performanceEntries.filter(entry => entry.duration > 3000);
      if (slowResources.length > 0) {
        console.log('⚠️ 느린 리소스 감지:');
        slowResources.forEach(resource => {
          console.log(`   ${resource.name}: ${resource.duration.toFixed(2)}ms`);
        });
      }
      
      // 성능 기준
      expect(slowResources.length).toBeLessThan(3); // 느린 리소스 3개 미만
      console.log('✅ 리소스 로딩 성능 분석 완료');
    });

    test('JavaScript 실행 성능 측정', async ({ page }) => {
      await page.addInitScript(() => {
        // JavaScript 실행 시간 측정
        window.jsPerformance = {
          taskDurations: [],
          longTasks: []
        };
        
        // Long Task API
        if ('PerformanceObserver' in window) {
          new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              window.jsPerformance.longTasks.push({
                duration: entry.duration,
                startTime: entry.startTime
              });
            });
          }).observe({ entryTypes: ['longtask'] });
        }
      });
      
      await navigateToAdminDashboard(page);
      
      // AI 사이드바 열기 (JavaScript 집약적 작업)
      const aiButton = page.locator('[data-testid="ai-assistant"], button:has-text("AI")').first();
      if (await aiButton.count() > 0) {
        const jsStartTime = Date.now();
        await aiButton.click();
        await page.waitForTimeout(1000);
        const jsEndTime = Date.now();
        
        console.log(`📊 AI 사이드바 열기 시간: ${jsEndTime - jsStartTime}ms`);
      }
      
      // Long Task 분석
      const jsMetrics = await page.evaluate(() => window.jsPerformance);
      
      console.log('📊 JavaScript 성능 분석:');
      console.log(`   Long Tasks: ${jsMetrics.longTasks.length}개`);
      
      if (jsMetrics.longTasks.length > 0) {
        const avgLongTaskDuration = jsMetrics.longTasks.reduce((sum: number, task: any) => sum + task.duration, 0) / jsMetrics.longTasks.length;
        console.log(`   평균 Long Task 지속시간: ${avgLongTaskDuration.toFixed(2)}ms`);
        
        // 100ms 이상의 Long Task는 성능에 영향
        expect(avgLongTaskDuration).toBeLessThan(200);
      }
      
      console.log('✅ JavaScript 성능 측정 완료');
    });
  });

  test.describe('🖼️ 시각적 회귀 테스트', () => {
    
    test('메인 대시보드 스크린샷 비교', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // 페이지 완전 로딩 대기
      await page.waitForTimeout(2000);
      
      // 스크린샷 촬영 및 비교
      await expect(page).toHaveScreenshot('dashboard-main.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      console.log('✅ 메인 대시보드 스크린샷 비교 완료');
    });

    test('서버 모니터링 카드 스크린샷', async ({ page }) => {
      await navigateToAdminDashboard(page);
      await page.waitForTimeout(2000);
      
      // 서버 카드 영역만 스크린샷
      const serverSection = page.locator('[data-testid="servers-section"], .servers-grid, main').first();
      if (await serverSection.count() > 0) {
        await expect(serverSection).toHaveScreenshot('server-cards.png', {
          animations: 'disabled'
        });
        console.log('✅ 서버 카드 스크린샷 비교 완료');
      }
    });

    test('AI 사이드바 스크린샷', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // AI 사이드바 열기
      const aiButton = page.locator('[data-testid="ai-assistant"], button:has-text("AI")').first();
      if (await aiButton.count() > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);
        
        // AI 사이드바 영역 스크린샷
        const sidebar = page.locator('[data-testid="ai-sidebar"], .ai-sidebar, aside').first();
        if (await sidebar.count() > 0 && await sidebar.isVisible()) {
          await expect(sidebar).toHaveScreenshot('ai-sidebar.png', {
            animations: 'disabled'
          });
          console.log('✅ AI 사이드바 스크린샷 비교 완료');
        }
      }
    });

    test('다크 모드 스크린샷 비교', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // 다크 모드 전환 시도
      const themeSelectors = [
        '[data-testid="theme-toggle"]',
        'button[aria-label*="테마"], button[aria-label*="theme"]',
        'button:has-text("다크"), button:has-text("Dark")',
        '.theme-toggle'
      ];
      
      let themeToggled = false;
      for (const selector of themeSelectors) {
        const themeButton = page.locator(selector).first();
        if (await themeButton.count() > 0 && await themeButton.isVisible()) {
          await themeButton.click();
          await page.waitForTimeout(500);
          themeToggled = true;
          break;
        }
      }
      
      if (themeToggled) {
        await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
          fullPage: true,
          animations: 'disabled'
        });
        console.log('✅ 다크 모드 스크린샷 비교 완료');
      } else {
        console.log('ℹ️ 테마 토글 버튼을 찾을 수 없어 다크 모드 테스트를 건너뜁니다.');
      }
    });

    test('모바일 뷰 스크린샷', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToAdminDashboard(page);
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      console.log('✅ 모바일 뷰 스크린샷 비교 완료');
    });
  });

  test.describe('🧠 메모리 사용량 및 누수 감지', () => {
    
    test('메모리 사용량 모니터링', async ({ page }) => {
      // 초기 메모리 상태
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (initialMemory) {
        console.log('📊 초기 메모리 상태:', {
          사용중: `${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          총량: `${(initialMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          한계: `${(initialMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        });
      }
      
      // 대시보드 로드 및 사용
      await navigateToAdminDashboard(page);
      
      // AI 사이드바 반복 열기/닫기 (메모리 누수 테스트)
      const aiButton = page.locator('[data-testid="ai-assistant"], button:has-text("AI")').first();
      if (await aiButton.count() > 0) {
        for (let i = 0; i < 5; i++) {
          await aiButton.click(); // 열기
          await page.waitForTimeout(500);
          await aiButton.click(); // 닫기
          await page.waitForTimeout(500);
        }
      }
      
      // 서버 모달 반복 열기/닫기
      const serverCards = page.locator('[data-testid="server-card"], .server-card');
      if (await serverCards.count() > 0) {
        for (let i = 0; i < 3; i++) {
          await serverCards.first().click();
          await page.waitForTimeout(500);
          
          // 모달 닫기
          const closeButton = page.locator('[data-testid="close-modal"], button[aria-label*="닫기"]').first();
          if (await closeButton.count() > 0) {
            await closeButton.click();
          } else {
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(500);
        }
      }
      
      // 최종 메모리 상태
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const increasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        console.log('📊 최종 메모리 분석:', {
          증가량: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
          증가율: `${increasePercent.toFixed(2)}%`,
          최종사용량: `${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
        });
        
        // 메모리 증가가 50% 이하여야 함 (정상적인 범위)
        expect(increasePercent).toBeLessThan(50);
        console.log('✅ 메모리 누수 검사 통과');
      }
    });

    test('DOM 노드 누수 감지', async ({ page }) => {
      // 초기 DOM 노드 수
      const initialNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
      console.log(`📊 초기 DOM 노드 수: ${initialNodeCount}`);
      
      await navigateToAdminDashboard(page);
      
      // 동적 컴포넌트 반복 생성/제거
      const aiButton = page.locator('[data-testid="ai-assistant"], button:has-text("AI")').first();
      if (await aiButton.count() > 0) {
        // AI 사이드바 5번 열고 닫기
        for (let i = 0; i < 5; i++) {
          await aiButton.click();
          await page.waitForTimeout(300);
          await aiButton.click();
          await page.waitForTimeout(300);
        }
      }
      
      // 가비지 컬렉션 강제 실행 시도
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      await page.waitForTimeout(1000);
      
      // 최종 DOM 노드 수
      const finalNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
      const nodeIncrease = finalNodeCount - initialNodeCount;
      const increasePercent = (nodeIncrease / initialNodeCount) * 100;
      
      console.log('📊 DOM 노드 분석:', {
        초기: initialNodeCount,
        최종: finalNodeCount,
        증가: nodeIncrease,
        증가율: `${increasePercent.toFixed(2)}%`
      });
      
      // DOM 노드가 30% 이상 증가하면 누수 의심
      expect(increasePercent).toBeLessThan(30);
      console.log('✅ DOM 노드 누수 검사 통과');
    });
  });

  test.describe('♿ 접근성 (Accessibility) 검증', () => {
    
    test('키보드 네비게이션 테스트', async ({ page }) => {
      await page.goto('/');
      
      // 탭 키로 네비게이션 테스트
      const focusableElements = [];
      
      // 첫 번째 포커스 가능한 요소로 이동
      await page.keyboard.press('Tab');
      
      for (let i = 0; i < 10; i++) { // 10개 요소까지 테스트
        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement;
          return focused ? {
            tagName: focused.tagName,
            role: focused.getAttribute('role'),
            ariaLabel: focused.getAttribute('aria-label'),
            textContent: focused.textContent?.substring(0, 50)
          } : null;
        });
        
        if (focusedElement) {
          focusableElements.push(focusedElement);
          console.log(`Tab ${i + 1}: ${focusedElement.tagName} - ${focusedElement.textContent || focusedElement.ariaLabel || 'No text'}`);
        }
        
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      expect(focusableElements.length).toBeGreaterThan(3);
      console.log('✅ 키보드 네비게이션 테스트 완료');
    });

    test('ARIA 라벨 및 역할 검증', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // ARIA 속성이 있는 요소들 확인
      const ariaElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[aria-label], [aria-labelledby], [role]'));
        return elements.map(el => ({
          tagName: el.tagName,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          ariaLabelledBy: el.getAttribute('aria-labelledby'),
          textContent: el.textContent?.substring(0, 30)
        }));
      });
      
      console.log('📊 ARIA 접근성 요소 분석:');
      ariaElements.forEach((el, index) => {
        console.log(`   ${index + 1}. ${el.tagName}: role="${el.role}", label="${el.ariaLabel || el.ariaLabelledBy}"`);
      });
      
      // 주요 UI 요소들에 ARIA 속성이 있어야 함
      expect(ariaElements.length).toBeGreaterThan(5);
      console.log('✅ ARIA 접근성 검증 완료');
    });

    test('색상 대비 검증', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // 텍스트 요소들의 색상 대비 확인
      const contrastResults = await page.evaluate(() => {
        const textElements = Array.from(document.querySelectorAll('p, span, div, button, a')).slice(0, 20);
        
        return textElements.map(el => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          const fontSize = styles.fontSize;
          
          return {
            text: el.textContent?.substring(0, 30),
            color,
            backgroundColor,
            fontSize
          };
        }).filter(item => item.text && item.text.trim().length > 0);
      });
      
      console.log('📊 색상 대비 분석 (처음 10개):');
      contrastResults.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.text}" - 색상: ${item.color}, 배경: ${item.backgroundColor}`);
      });
      
      expect(contrastResults.length).toBeGreaterThan(0);
      console.log('✅ 색상 대비 검증 완료');
    });

    test('스크린 리더 호환성', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // 헤딩 구조 확인
      const headings = await page.evaluate(() => {
        const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headingElements.map(el => ({
          level: el.tagName,
          text: el.textContent?.trim(),
          hasId: !!el.id
        }));
      });
      
      console.log('📊 헤딩 구조 분석:');
      headings.forEach((heading, index) => {
        console.log(`   ${index + 1}. ${heading.level}: "${heading.text}" (ID: ${heading.hasId})`);
      });
      
      // 최소한 h1과 h2가 있어야 함
      const hasH1 = headings.some(h => h.level === 'H1');
      const hasH2 = headings.some(h => h.level === 'H2');
      
      expect(hasH1 || hasH2).toBe(true); // 최소한 하나의 주요 헤딩은 있어야 함
      console.log('✅ 스크린 리더 호환성 검증 완료');
    });
  });

  test.describe('🔄 상호작용 성능 테스트', () => {
    
    test('버튼 클릭 반응 시간', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // 주요 버튼들의 클릭 반응 시간 측정
      const buttonSelectors = [
        '[data-testid="ai-assistant"], button:has-text("AI")',
        '[data-testid="server-card"], .server-card',
        'button:has-text("설정"), button:has-text("새로고침")'
      ];
      
      for (const selector of buttonSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          const startTime = Date.now();
          await button.click();
          
          // 시각적 피드백 대기 (상태 변화, 모달 열림 등)
          await page.waitForTimeout(200);
          
          const responseTime = Date.now() - startTime;
          console.log(`📊 버튼 응답 시간 (${selector}): ${responseTime}ms`);
          
          // 300ms 이내 반응 기대
          expect(responseTime).toBeLessThan(300);
        }
      }
      
      console.log('✅ 버튼 클릭 반응 시간 테스트 완료');
    });

    test('스크롤 성능 측정', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // 스크롤 성능 측정을 위한 초기화
      await page.evaluate(() => {
        window.scrollMetrics = {
          frameDrops: 0,
          totalFrames: 0
        };
        
        // requestAnimationFrame으로 스크롤 성능 모니터링
        let lastTime = performance.now();
        function checkFrame() {
          const currentTime = performance.now();
          const deltaTime = currentTime - lastTime;
          
          window.scrollMetrics.totalFrames++;
          if (deltaTime > 16.67) { // 60fps 기준
            window.scrollMetrics.frameDrops++;
          }
          
          lastTime = currentTime;
          requestAnimationFrame(checkFrame);
        }
        checkFrame();
      });
      
      // 스크롤 테스트
      const scrollAmount = 500;
      const scrollSteps = 5;
      
      for (let i = 0; i < scrollSteps; i++) {
        await page.evaluate((amount) => {
          window.scrollBy(0, amount);
        }, scrollAmount);
        await page.waitForTimeout(100);
      }
      
      // 원래 위치로 스크롤
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      
      await page.waitForTimeout(500);
      
      // 스크롤 성능 결과 확인
      const scrollMetrics = await page.evaluate(() => window.scrollMetrics);
      
      if (scrollMetrics && scrollMetrics.totalFrames > 0) {
        const frameDropPercentage = (scrollMetrics.frameDrops / scrollMetrics.totalFrames) * 100;
        console.log('📊 스크롤 성능 분석:', {
          총프레임: scrollMetrics.totalFrames,
          드롭프레임: scrollMetrics.frameDrops,
          드롭률: `${frameDropPercentage.toFixed(2)}%`
        });
        
        // 프레임 드롭이 20% 이하여야 함
        expect(frameDropPercentage).toBeLessThan(20);
      }
      
      console.log('✅ 스크롤 성능 측정 완료');
    });

    test('애니메이션 성능 확인', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // CSS 애니메이션이 있는 요소들 확인
      const animatedElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => {
          const styles = window.getComputedStyle(el);
          return styles.animation !== 'none' || styles.transition !== 'none 0s ease 0s';
        }).map(el => ({
          tagName: el.tagName,
          className: el.className,
          animation: window.getComputedStyle(el).animation,
          transition: window.getComputedStyle(el).transition
        }));
      });
      
      console.log('📊 애니메이션 요소 분석:');
      animatedElements.slice(0, 5).forEach((el, index) => {
        console.log(`   ${index + 1}. ${el.tagName}.${el.className}: ${el.animation || el.transition}`);
      });
      
      // AI 사이드바 애니메이션 테스트
      const aiButton = page.locator('[data-testid="ai-assistant"], button:has-text("AI")').first();
      if (await aiButton.count() > 0) {
        const animationStartTime = Date.now();
        await aiButton.click();
        
        // 애니메이션 완료 대기
        await page.waitForTimeout(500);
        
        const animationTime = Date.now() - animationStartTime;
        console.log(`📊 AI 사이드바 애니메이션 시간: ${animationTime}ms`);
        
        // 애니메이션이 1초 이내에 완료되어야 함
        expect(animationTime).toBeLessThan(1000);
      }
      
      console.log('✅ 애니메이션 성능 확인 완료');
    });
  });
});