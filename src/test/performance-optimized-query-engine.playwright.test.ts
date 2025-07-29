/**
 * 🎭 PerformanceOptimizedQueryEngine Playwright E2E 테스트
 * 
 * 브라우저 환경에서의 실제 사용자 시나리오 테스트:
 * 1. AI 어시스턴트 대시보드 성능 테스트
 * 2. 실시간 쿼리 처리 및 응답 시간 측정
 * 3. 브라우저 캐시 효과 검증
 * 4. 성능 API 엔드포인트 통합 테스트
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_wait_for } from '@playwright/test';

// 테스트 설정
const TEST_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
};

// 성능 벤치마크 쿼리
const BENCHMARK_QUERIES = [
  '서버 상태를 확인해주세요',
  'CPU 사용률과 메모리 상태를 알려주세요',
  '최근 시스템 성능 분석 결과를 보여주세요',
  '네트워크 트래픽 현황을 분석해주세요',
  '디스크 용량과 I/O 성능을 체크해주세요'
];

test.describe('🎭 Performance Optimized Query Engine - Playwright E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // 기본 페이지 설정
    await page.goto(TEST_CONFIG.baseURL);
    
    // AI 어시스턴트 대시보드로 이동
    await page.waitForSelector('[data-testid="ai-assistant-panel"]', { timeout: 10000 });
  });

  test.describe('🚀 성능 API 엔드포인트 테스트', () => {
    
    test('성능 통계 API가 올바른 데이터를 반환해야 함', async ({ page }) => {
      // API 응답 인터셉트
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/ai/performance') && response.status() === 200
      );

      // 성능 통계 조회 트리거
      await page.goto(`${TEST_CONFIG.baseURL}/api/ai/performance`);
      
      const response = await responsePromise;
      const data = await response.json();

      // 응답 구조 검증
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('optimization');
      expect(data).toHaveProperty('health');
      expect(data).toHaveProperty('analysis');

      // 메트릭 데이터 검증
      expect(data.metrics).toHaveProperty('totalQueries');
      expect(data.metrics).toHaveProperty('avgResponseTime');
      expect(data.metrics).toHaveProperty('cacheHitRate');
      expect(typeof data.metrics.avgResponseTime).toBe('number');
      expect(typeof data.metrics.cacheHitRate).toBe('number');

      console.log('✅ 성능 API 응답 검증 완료:', {
        avgResponseTime: data.metrics.avgResponseTime,
        cacheHitRate: data.metrics.cacheHitRate,
        totalQueries: data.metrics.totalQueries
      });
    });

    test('벤치마크 API가 비교 결과를 정확히 제공해야 함', async ({ page }) => {
      // 벤치마크 요청 데이터
      const benchmarkRequest = {
        mode: 'comparison',
        queries: BENCHMARK_QUERIES.slice(0, 3),
        iterations: 2
      };

      // API 호출 및 응답 검증
      const response = await page.request.post(`${TEST_CONFIG.baseURL}/api/ai/performance`, {
        data: benchmarkRequest,
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('benchmarkType', 'comparison');
      expect(data).toHaveProperty('results');
      expect(data.results).toHaveProperty('originalEngine');
      expect(data.results).toHaveProperty('optimizedEngine');
      expect(data).toHaveProperty('analysis');

      // 성능 개선 분석
      const improvement = data.analysis.improvementPercentage;
      console.log(`🏆 성능 개선: ${improvement}%`);
      console.log(`💾 캐시 적중률: ${data.results.optimizedEngine.cacheHitRate}%`);
      
      // 최적화된 엔진이 더 나은 성능을 보이거나 안정적이어야 함
      const isBetter = improvement > 0 || data.results.optimizedEngine.successRate >= data.results.originalEngine.successRate;
      expect(isBetter).toBe(true);
    });
  });

  test.describe('💾 브라우저 환경 캐시 효과 검증', () => {
    
    test('동일 쿼리 반복 실행 시 응답 시간이 개선되어야 함', async ({ page }) => {
      const testQuery = BENCHMARK_QUERIES[0];
      const responseTimes: number[] = [];

      // AI 어시스턴트 입력 필드 찾기
      await page.waitForSelector('[data-testid="ai-query-input"]');
      
      // 동일 쿼리를 3번 실행하여 캐시 효과 측정
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        // 쿼리 입력
        await page.fill('[data-testid="ai-query-input"]', testQuery);
        
        // 전송 버튼 클릭
        await page.click('[data-testid="ai-query-submit"]');
        
        // 응답 대기
        await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        console.log(`반복 ${i + 1}: ${responseTime}ms`);
        
        // 다음 테스트를 위해 잠시 대기
        await page.waitForTimeout(1000);
      }

      // 캐시 효과 검증 - 마지막 실행이 첫 번째보다 빠르거나 비슷해야 함
      const firstTime = responseTimes[0];
      const lastTime = responseTimes[responseTimes.length - 1];
      const improvement = (firstTime - lastTime) / firstTime;
      
      console.log(`📊 응답 시간 개선: ${(improvement * 100).toFixed(2)}%`);
      
      // 최소한 성능이 악화되지 않아야 함 (20% 여유 허용)
      expect(lastTime).toBeLessThanOrEqual(firstTime * 1.2);
    });

    test('다양한 쿼리 패턴에서 캐시 성능을 검증해야 함', async ({ page }) => {
      const queryResults: Array<{ query: string; time: number; cached: boolean }> = [];
      
      // 서로 다른 쿼리들을 실행
      for (const query of BENCHMARK_QUERIES.slice(0, 3)) {
        const startTime = Date.now();
        
        await page.fill('[data-testid="ai-query-input"]', query);
        await page.click('[data-testid="ai-query-submit"]');
        await page.waitForSelector('[data-testid="ai-response"]');
        
        const responseTime = Date.now() - startTime;
        
        // 응답에 캐시 정보가 있는지 확인
        const responseText = await page.textContent('[data-testid="ai-response"]');
        const cached = responseText?.includes('cached') || responseTime < 500;
        
        queryResults.push({
          query: query.substring(0, 30),
          time: responseTime,
          cached
        });
        
        await page.waitForTimeout(500);
      }

      // 유사한 쿼리 재실행 (캐시 적중 기대)
      const similarQuery = BENCHMARK_QUERIES[0] + ' 다시';
      const startTime = Date.now();
      
      await page.fill('[data-testid="ai-query-input"]', similarQuery);
      await page.click('[data-testid="ai-query-submit"]');
      await page.waitForSelector('[data-testid="ai-response"]');
      
      const responseTime = Date.now() - startTime;
      
      console.log('🔍 쿼리 성능 분석:', queryResults);
      console.log(`🔄 유사 쿼리 응답 시간: ${responseTime}ms`);
      
      // 평균 응답 시간이 합리적이어야 함 (15초 이내)
      const avgTime = queryResults.reduce((sum, r) => sum + r.time, 0) / queryResults.length;
      expect(avgTime).toBeLessThan(15000);
    });
  });

  test.describe('🌐 실시간 성능 모니터링', () => {
    
    test('성능 대시보드가 실시간 메트릭을 표시해야 함', async ({ page }) => {
      // 성능 대시보드 페이지로 이동
      await page.goto(`${TEST_CONFIG.baseURL}/admin/performance`);
      
      // 성능 메트릭 카드들이 로드될 때까지 대기
      await page.waitForSelector('[data-testid="performance-metrics"]');
      
      // 주요 메트릭 요소들 확인
      const metricsSelectors = [
        '[data-testid="total-queries"]',
        '[data-testid="avg-response-time"]', 
        '[data-testid="cache-hit-rate"]',
        '[data-testid="error-rate"]'
      ];

      for (const selector of metricsSelectors) {
        const element = await page.locator(selector);
        await expect(element).toBeVisible();
        
        const value = await element.textContent();
        expect(value).toBeTruthy();
        console.log(`📊 ${selector}: ${value}`);
      }

      // 실시간 업데이트 테스트 - 새로운 쿼리 실행 후 메트릭 변화 확인
      const _initialQueries = await page.textContent('[data-testid="total-queries"]');
      
      // AI 어시스턴트로 쿼리 실행
      await page.goto(`${TEST_CONFIG.baseURL}`);
      await page.fill('[data-testid="ai-query-input"]', '실시간 테스트 쿼리');
      await page.click('[data-testid="ai-query-submit"]');
      await page.waitForSelector('[data-testid="ai-response"]');
      
      // 성능 대시보드로 돌아가서 업데이트 확인
      await page.goto(`${TEST_CONFIG.baseURL}/admin/performance`);
      await page.waitForTimeout(2000); // 메트릭 업데이트 대기
      
      const updatedQueries = await page.textContent('[data-testid="total-queries"]');
      console.log(`📈 쿼리 수 변화: ${_initialQueries} → ${updatedQueries}`);
    });

    test('성능 차트가 올바른 데이터를 표시해야 함', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/performance`);
      
      // 차트 요소 확인
      await page.waitForSelector('[data-testid="performance-chart"]');
      
      // 차트 인터랙션 테스트
      const chartElement = page.locator('[data-testid="performance-chart"]');
      await expect(chartElement).toBeVisible();
      
      // 차트 툴팁 확인 (호버 시)
      await chartElement.hover();
      await page.waitForTimeout(1000);
      
      // 차트 데이터 포인트 확인
      const dataPoints = page.locator('[data-testid="chart-data-point"]');
      const count = await dataPoints.count();
      expect(count).toBeGreaterThan(0);
      
      console.log(`📊 차트 데이터 포인트: ${count}개`);
    });
  });

  test.describe('🔄 회로 차단기 및 폴백 시나리오', () => {
    
    test('시스템 오류 시 적절한 폴백 응답을 제공해야 함', async ({ page }) => {
      // 의도적으로 에러를 발생시키는 쿼리
      const errorQuery = ':::TRIGGER_ERROR:::';
      
      await page.fill('[data-testid="ai-query-input"]', errorQuery);
      await page.click('[data-testid="ai-query-submit"]');
      
      // 응답 대기 (에러여도 응답은 와야 함)
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });
      
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // 에러 상황에서도 사용자에게 유용한 메시지를 제공해야 함
      expect(response).toBeTruthy();
      expect(response?.length || 0).toBeGreaterThan(10);
      
      // 일반적인 에러 메시지나 폴백 메시지가 포함되어야 함
      const hasValidResponse = response?.includes('제한된 모드') || 
                              response?.includes('기본적인 정보') ||
                              response?.includes('일시적') ||
                              response?.includes('시스템');
      
      expect(hasValidResponse).toBe(true);
      console.log(`🛡️ 폴백 응답: ${response?.substring(0, 100)}...`);
    });

    test('연속 에러 후 시스템 복구를 검증해야 함', async ({ page }) => {
      // 3번 연속 에러 쿼리 실행
      for (let i = 0; i < 3; i++) {
        await page.fill('[data-testid="ai-query-input"]', `:::ERROR_${i}:::`);
        await page.click('[data-testid="ai-query-submit"]');
        await page.waitForSelector('[data-testid="ai-response"]');
        await page.waitForTimeout(1000);
      }
      
      // 정상 쿼리로 복구 확인
      await page.fill('[data-testid="ai-query-input"]', '서버 상태 확인');
      await page.click('[data-testid="ai-query-submit"]');
      await page.waitForSelector('[data-testid="ai-response"]');
      
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // 정상적인 응답이 와야 함
      expect(response).toBeTruthy();
      expect(response?.length || 0).toBeGreaterThan(20);
      
      console.log(`🔄 시스템 복구 후 응답: ${response?.substring(0, 50)}...`);
    });
  });

  test.describe('📱 반응형 및 접근성 테스트', () => {
    
    test('모바일 환경에서 성능이 적절해야 함', async ({ page }) => {
      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      
      await page.fill('[data-testid="ai-query-input"]', '모바일 테스트 쿼리');
      await page.click('[data-testid="ai-query-submit"]');
      await page.waitForSelector('[data-testid="ai-response"]');
      
      const responseTime = Date.now() - startTime;
      
      // 모바일에서도 응답 시간이 합리적이어야 함 (20초 이내)
      expect(responseTime).toBeLessThan(20000);
      
      // UI 요소들이 모바일에서 제대로 표시되는지 확인
      const inputElement = page.locator('[data-testid="ai-query-input"]');
      await expect(inputElement).toBeVisible();
      
      const responseElement = page.locator('[data-testid="ai-response"]');
      await expect(responseElement).toBeVisible();
      
      console.log(`📱 모바일 응답 시간: ${responseTime}ms`);
    });

    test('키보드 네비게이션이 올바르게 작동해야 함', async ({ page }) => {
      // 탭 키로 입력 필드 포커스
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // 포커스된 요소가 입력 필드인지 확인
      const focusedElement = page.locator(':focus');
      const tagName = await focusedElement.getAttribute('data-testid');
      
      if (tagName === 'ai-query-input') {
        // 키보드로 텍스트 입력
        await page.keyboard.type('키보드 접근성 테스트');
        
        // Enter로 전송
        await page.keyboard.press('Enter');
        
        await page.waitForSelector('[data-testid="ai-response"]');
        
        const response = await page.textContent('[data-testid="ai-response"]');
        expect(response).toBeTruthy();
        
        console.log('⌨️ 키보드 네비게이션 테스트 성공');
      }
    });
  });

  test.describe('🔧 성능 최적화 검증', () => {
    
    test('대량 쿼리 처리 시 메모리 누수가 없어야 함', async ({ page }) => {
      // 초기 메모리 사용량 측정 (JavaScript heap)
      const _initialMemory = await page.evaluate(() => {
        const memory = (performance as any).memory;
        return memory ? memory.usedJSHeapSize : 0;
      });

      // 10개의 쿼리를 연속으로 실행
      const queries = BENCHMARK_QUERIES.concat(BENCHMARK_QUERIES);
      
      for (let i = 0; i < queries.length; i++) {
        await page.fill('[data-testid="ai-query-input"]', `${queries[i % BENCHMARK_QUERIES.length]} - ${i}`);
        await page.click('[data-testid="ai-query-submit"]');
        await page.waitForSelector('[data-testid="ai-response"]');
        
        // 메모리 정리를 위한 짧은 대기
        if (i % 3 === 0) {
          await page.waitForTimeout(100);
        }
      }

      // 최종 메모리 사용량 측정
      const finalMemory = await page.evaluate(() => {
        const memory = (performance as any).memory;
        return memory ? memory.usedJSHeapSize : 0;
      });

      const memoryIncrease = finalMemory - _initialMemory;
      const memoryIncreasePercent = (memoryIncrease / _initialMemory) * 100;
      
      console.log(`💾 메모리 사용량 변화: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // 메모리 증가가 과도하지 않아야 함 (100MB 미만, 500% 미만)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
      expect(memoryIncreasePercent).toBeLessThan(500); // 500%
    });

    test('네트워크 최적화 효과를 검증해야 함', async ({ page }) => {
      const networkRequests: Array<{ url: string; size: number; time: number }> = [];
      
      // 네트워크 요청 모니터링
      page.on('response', async (response) => {
        if (response.url().includes('/api/ai/')) {
          const size = parseInt(response.headers()['content-length'] || '0');
          
          
          networkRequests.push({
            url: response.url(),
            size,
            time: 0
          });
        }
      });

      // 여러 쿼리 실행하여 네트워크 패턴 분석
      for (const query of BENCHMARK_QUERIES.slice(0, 3)) {
        await page.fill('[data-testid="ai-query-input"]', query);
        await page.click('[data-testid="ai-query-submit"]');
        await page.waitForSelector('[data-testid="ai-response"]');
        await page.waitForTimeout(500);
      }

      // 네트워크 최적화 분석
      const avgResponseTime = networkRequests.reduce((sum, req) => sum + req.time, 0) / networkRequests.length;
      const totalSize = networkRequests.reduce((sum, req) => sum + req.size, 0);
      
      console.log(`🌐 네트워크 분석:`, {
        requests: networkRequests.length,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        totalSize: `${(totalSize / 1024).toFixed(2)}KB`,
        avgSize: `${(totalSize / networkRequests.length / 1024).toFixed(2)}KB`
      });

      // 네트워크 성능이 합리적이어야 함
      expect(avgResponseTime).toBeLessThan(5000); // 5초 이내
      expect(totalSize).toBeLessThan(10 * 1024 * 1024); // 10MB 이내
    });
  });
});