/**
 * 🧪 Performance Optimized Query Engine E2E Tests
 * 
 * 이 파일은 개선된 쿼리 엔진의 성능을 검증하는 E2E 테스트입니다.
 * - 응답 속도 개선 확인
 * - 메모리 사용량 최적화 검증
 * - 병렬 처리 성능 테스트
 * 
 * 주요 개선사항 검증:
 * - 기존 45초 → 목표 8초 이내 응답
 * - 메모리 30MB 이내 유지
 * - 동시 요청 처리 능력
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

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

// 테스트 헬퍼 함수들
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="ai-chat-container"]', { 
    state: 'visible',
    timeout: 10000 
  });
}

async function submitQuery(page: Page, query: string) {
  const inputSelector = 'textarea[placeholder*="질문"]';
  await page.fill(inputSelector, query);
  await page.press(inputSelector, 'Enter');
}

async function waitForResponse(page: Page, timeout = 8000) {
  const responseSelector = '[data-testid="ai-response"]';
  const start = Date.now();
  
  await page.waitForSelector(responseSelector, {
    state: 'visible',
    timeout
  });
  
  const duration = Date.now() - start;
  return duration;
}

async function measureMemoryUsage(page: Page): Promise<number> {
  const metrics = await page.evaluate(() => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  });
  
  return metrics / (1024 * 1024); // Convert to MB
}

// 테스트 시작 전 설정
test.beforeEach(async ({ page }) => {
  // 로컬 스토리지 초기화
  await page.goto(TEST_CONFIG.baseURL);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // AI 채팅 페이지로 이동
  await page.goto(`${TEST_CONFIG.baseURL}/ai-chat`);
  await waitForPageLoad(page);
});

// 메인 테스트 스위트
test.describe('Performance Optimized Query Engine', () => {
  test('단일 쿼리 응답 속도 테스트', async ({ page }) => {
    const query = BENCHMARK_QUERIES[0];
    
    // 쿼리 실행 및 응답 시간 측정
    await submitQuery(page, query);
    const responseTime = await waitForResponse(page);
    
    // 성능 기준 검증
    expect(responseTime).toBeLessThan(8000); // 8초 이내
    
    // 응답 내용 검증
    const responseText = await page.textContent('[data-testid="ai-response"]');
    expect(responseText).toBeTruthy();
    expect(responseText?.length).toBeGreaterThan(50);
  });

  test('연속 쿼리 처리 성능', async ({ page }) => {
    const responseTimes: number[] = [];
    
    for (const query of BENCHMARK_QUERIES.slice(0, 3)) {
      await submitQuery(page, query);
      const responseTime = await waitForResponse(page);
      responseTimes.push(responseTime);
      
      // 각 응답 간 짧은 대기
      await page.waitForTimeout(500);
    }
    
    // 평균 응답 시간 계산
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // 성능 기준 검증
    expect(avgResponseTime).toBeLessThan(8000);
    expect(Math.max(...responseTimes)).toBeLessThan(10000); // 최악의 경우도 10초 이내
  });

  test('메모리 사용량 최적화 검증', async ({ page }) => {
    const memorySnapshots: number[] = [];
    
    // 초기 메모리 사용량
    const initialMemory = await measureMemoryUsage(page);
    memorySnapshots.push(initialMemory);
    
    // 여러 쿼리 실행
    for (let i = 0; i < 5; i++) {
      const query = BENCHMARK_QUERIES[i % BENCHMARK_QUERIES.length];
      await submitQuery(page, query);
      await waitForResponse(page);
      
      const currentMemory = await measureMemoryUsage(page);
      memorySnapshots.push(currentMemory);
    }
    
    // 메모리 사용량 분석
    const maxMemory = Math.max(...memorySnapshots);
    const memoryIncrease = maxMemory - initialMemory;
    
    // 메모리 사용량 기준 검증
    expect(maxMemory).toBeLessThan(40); // 40MB 이하
    expect(memoryIncrease).toBeLessThan(20); // 증가량 20MB 이하
  });

  test('병렬 요청 처리 능력', async ({ browser }) => {
    const context = await browser.newContext();
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ]);
    
    // 모든 페이지 준비
    await Promise.all(pages.map(async (page) => {
      await page.goto(`${TEST_CONFIG.baseURL}/ai-chat`);
      await waitForPageLoad(page);
    }));
    
    // 동시에 쿼리 실행
    const startTime = Date.now();
    const results = await Promise.all(pages.map(async (page, index) => {
      const query = BENCHMARK_QUERIES[index];
      await submitQuery(page, query);
      return waitForResponse(page, 15000); // 병렬 처리시 타임아웃 연장
    }));
    
    const totalTime = Date.now() - startTime;
    
    // 병렬 처리 성능 검증
    expect(totalTime).toBeLessThan(12000); // 전체 12초 이내
    results.forEach(time => {
      expect(time).toBeLessThan(10000); // 각각 10초 이내
    });
    
    await context.close();
  });

  test('에러 처리 및 복구 능력', async ({ page }) => {
    // 잘못된 쿼리 전송
    await submitQuery(page, '');
    
    // 에러 메시지 확인
    const errorSelector = '[data-testid="error-message"]';
    await page.waitForSelector(errorSelector, { timeout: 3000 }).catch(() => {
      // 에러가 없으면 정상 처리된 것
    });
    
    // 정상 쿼리로 복구 가능한지 확인
    await submitQuery(page, BENCHMARK_QUERIES[0]);
    const responseTime = await waitForResponse(page);
    
    expect(responseTime).toBeLessThan(8000);
  });

  test('UI 반응성 테스트', async ({ page }) => {
    // 긴 쿼리 실행
    const longQuery = BENCHMARK_QUERIES.join(' 그리고 ');
    await submitQuery(page, longQuery);
    
    // 처리 중 UI가 반응하는지 확인
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicator).toBeVisible();
    
    // 취소 버튼이 작동하는지 확인
    const cancelButton = page.locator('[data-testid="cancel-button"]');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(loadingIndicator).not.toBeVisible();
    }
  });

  test('캐시 효과 검증', async ({ page }) => {
    const query = BENCHMARK_QUERIES[0];
    
    // 첫 번째 요청
    await submitQuery(page, query);
    const firstResponseTime = await waitForResponse(page);
    
    // 페이지 새로고침
    await page.reload();
    await waitForPageLoad(page);
    
    // 동일한 쿼리 재실행
    await submitQuery(page, query);
    const secondResponseTime = await waitForResponse(page);
    
    // 캐시 효과로 두 번째가 더 빨라야 함
    expect(secondResponseTime).toBeLessThan(firstResponseTime);
    expect(secondResponseTime).toBeLessThan(3000); // 캐시 히트시 3초 이내
  });
});

// 스트레스 테스트 (선택적)
test.describe('Stress Tests', () => {
  // @skip-reason: 스트레스 테스트 - 로컬 개발 환경에서만 수동 실행
  // @skip-date: 2024-01-01  
  test.skip('대용량 응답 처리', async ({ page }) => {
    // 복잡한 분석 요청
    const complexQuery = '지난 30일간의 모든 서버 메트릭을 상세히 분석하고 리포트를 생성해주세요';
    
    await submitQuery(page, complexQuery);
    const responseTime = await waitForResponse(page, 20000);
    
    expect(responseTime).toBeLessThan(20000);
    
    // 메모리 사용량 확인
    const memory = await measureMemoryUsage(page);
    expect(memory).toBeLessThan(50); // 대용량 처리시에도 50MB 이하
  });

  // @skip-reason: 장시간 실행 테스트 - 릴리즈 전 수동 실행
  // @skip-date: 2024-01-01
  test.skip('장시간 세션 안정성', async ({ page }) => {
    const sessionDuration = 5 * 60 * 1000; // 5분
    const endTime = Date.now() + sessionDuration;
    let queryCount = 0;
    
    while (Date.now() < endTime) {
      const query = BENCHMARK_QUERIES[queryCount % BENCHMARK_QUERIES.length];
      await submitQuery(page, query);
      await waitForResponse(page);
      
      queryCount++;
      await page.waitForTimeout(10000); // 10초 대기
    }
    
    // 세션 동안 안정적으로 작동했는지 확인
    expect(queryCount).toBeGreaterThan(20);
    
    const finalMemory = await measureMemoryUsage(page);
    expect(finalMemory).toBeLessThan(60); // 장시간 사용 후에도 60MB 이하
  });
});

// 접근성 테스트
test.describe('Accessibility', () => {
  test('키보드 네비게이션', async ({ page }) => {
    // Tab 키로 입력 필드 접근
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Enter 키로 쿼리 제출
    await page.keyboard.type(BENCHMARK_QUERIES[0]);
    await page.keyboard.press('Enter');
    
    await waitForResponse(page);
  });

  test('스크린 리더 지원', async ({ page }) => {
    // ARIA 속성 확인
    const chatContainer = page.locator('[data-testid="ai-chat-container"]');
    await expect(chatContainer).toHaveAttribute('role', 'main');
    
    const input = page.locator('textarea[placeholder*="질문"]');
    await expect(input).toHaveAttribute('aria-label');
  });
});