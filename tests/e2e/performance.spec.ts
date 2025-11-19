
import { test, expect, Page } from '@playwright/test';
import { resetGuestState, guestLogin } from './helpers/guest';
import { ensureVercelBypassCookie } from './helpers/security';

test.describe('🚀 성능 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    await resetGuestState(page);
    await ensureVercelBypassCookie(page);
  });

  test.afterEach(async ({ page }) => {
    await resetGuestState(page);
  });

  test.describe('📊 Core Web Vitals 측정', () => {
    
    test('LCP (Largest Contentful Paint) 측정', async ({ page }) => {
      // Performance 이벤트 수집 설정
      await page.addInitScript(() => {
        window.performanceMetrics = {
          lcp: 0,
          cls: 0,
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
      
      await guestLogin(page);
      
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
      await guestLogin(page);
      
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(entry => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: (entry as any).transferSize,
          type: entry.initiatorType
        }));
      });
      
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
      
      const slowResources = performanceEntries.filter(entry => entry.duration > 3000);
      if (slowResources.length > 0) {
        console.log('⚠️ 느린 리소스 감지:');
        slowResources.forEach(resource => {
          console.log(`   ${resource.name}: ${resource.duration.toFixed(2)}ms`);
        });
      }
      
      expect(slowResources.length).toBeLessThan(3);
      console.log('✅ 리소스 로딩 성능 분석 완료');
    });

    test('JavaScript 실행 성능 측정', async ({ page }) => {
      await page.addInitScript(() => {
        window.jsPerformance = { longTasks: [] };
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            window.jsPerformance.longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime
            });
          });
        }).observe({ entryTypes: ['longtask'] });
      });
      
      await guestLogin(page);
      
      const aiButton = page.locator('[data-testid="ai-assistant"], button:has-text("AI")').first();
      if (await aiButton.count() > 0) {
        const jsStartTime = Date.now();
        await aiButton.click();
        await page.waitForTimeout(1000);
        const jsEndTime = Date.now();
        console.log(`📊 AI 사이드바 열기 시간: ${jsEndTime - jsStartTime}ms`);
      }
      
      const jsMetrics = await page.evaluate(() => window.jsPerformance);
      console.log('📊 JavaScript 성능 분석:');
      console.log(`   Long Tasks: ${jsMetrics.longTasks.length}개`);
      
      if (jsMetrics.longTasks.length > 0) {
        const avgLongTaskDuration = jsMetrics.longTasks.reduce((sum: number, task: any) => sum + task.duration, 0) / jsMetrics.longTasks.length;
        console.log(`   평균 Long Task 지속시간: ${avgLongTaskDuration.toFixed(2)}ms`);
        expect(avgLongTaskDuration).toBeLessThan(200);
      }
      
      console.log('✅ JavaScript 성능 측정 완료');
    });
  });

  test.describe('🔄 상호작용 성능 테스트', () => {
    
    test('버튼 클릭 반응 시간', async ({ page }) => {
      await guestLogin(page);
      
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
          await page.waitForTimeout(200);
          const responseTime = Date.now() - startTime;
          console.log(`📊 버튼 응답 시간 (${selector}): ${responseTime}ms`);
          expect(responseTime).toBeLessThan(300);
        }
      }
      
      console.log('✅ 버튼 클릭 반응 시간 테스트 완료');
    });

    test('스크롤 성능 측정', async ({ page }) => {
      await guestLogin(page);
      
      await page.evaluate(() => {
        window.scrollMetrics = { frameDrops: 0, totalFrames: 0 };
        let lastTime = performance.now();
        function checkFrame() {
          const currentTime = performance.now();
          const deltaTime = currentTime - lastTime;
          window.scrollMetrics.totalFrames++;
          if (deltaTime > 16.67) { // 60fps
            window.scrollMetrics.frameDrops++;
          }
          lastTime = currentTime;
          requestAnimationFrame(checkFrame);
        }
        checkFrame();
      });
      
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(100);
      }
      
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      const scrollMetrics = await page.evaluate(() => window.scrollMetrics);
      
      if (scrollMetrics && scrollMetrics.totalFrames > 0) {
        const frameDropPercentage = (scrollMetrics.frameDrops / scrollMetrics.totalFrames) * 100;
        console.log('📊 스크롤 성능 분석:', {
          총프레임: scrollMetrics.totalFrames,
          드롭프레임: scrollMetrics.frameDrops,
          드롭률: `${frameDropPercentage.toFixed(2)}%`
        });
        expect(frameDropPercentage).toBeLessThan(20);
      }
      
      console.log('✅ 스크롤 성능 측정 완료');
    });
  });
});
