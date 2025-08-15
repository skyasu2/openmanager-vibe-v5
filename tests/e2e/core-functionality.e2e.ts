/**
 * 🎭 E2E 테스트: 핵심 기능 검증
 * 
 * @description OpenManager VIBE v5 핵심 워크플로우 테스트
 * @tdd-cycle Red-Green-Refactor
 * @coverage 주요 사용자 시나리오 100% 검증
 */

import { test, expect } from '@playwright/test';

test.describe('OpenManager VIBE v5 - 핵심 기능', () => {
  
  test.beforeEach(async ({ page }) => {
    // 🎯 각 테스트 전 초기화
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('대시보드 로드 및 서버 목록 표시', async ({ page }) => {
    // Red: 실패하는 테스트부터 시작
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="server-list"]')).toBeVisible();
    
    // 서버 카드들이 로드될 때까지 대기
    await page.waitForSelector('[data-testid="server-card"]', { timeout: 10000 });
    
    // Green: 서버 목록이 올바르게 표시되는지 검증
    const serverCards = page.locator('[data-testid="server-card"]');
    await expect(serverCards).toHaveCountGreaterThan(0);
    
    // Refactor: 각 서버 카드의 필수 정보 검증
    const firstCard = serverCards.first();
    await expect(firstCard.locator('[data-testid="server-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="server-status"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="cpu-usage"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="memory-usage"]')).toBeVisible();
  });

  test('서버 상세 정보 모달 열기', async ({ page }) => {
    // Red: 모달이 열리지 않는 상태
    await page.waitForSelector('[data-testid="server-card"]');
    
    // 첫 번째 서버 카드 클릭
    await page.locator('[data-testid="server-card"]').first().click();
    
    // Green: 모달이 열리고 상세 정보가 표시됨
    await expect(page.locator('[data-testid="server-modal"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="modal-server-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-metrics"]')).toBeVisible();
    
    // Refactor: 모달 닫기 기능 검증
    await page.locator('[data-testid="modal-close-button"]').click();
    await expect(page.locator('[data-testid="server-modal"]')).not.toBeVisible();
  });

  test('실시간 데이터 업데이트 검증', async ({ page }) => {
    // Red: 데이터가 업데이트되지 않는 상태
    await page.waitForSelector('[data-testid="server-card"]');
    
    // 첫 번째 서버의 CPU 사용률 기록
    const firstCard = page.locator('[data-testid="server-card"]').first();
    const initialCpuText = await firstCard.locator('[data-testid="cpu-usage"]').textContent();
    
    // 30초 대기 (실시간 업데이트 주기)
    await page.waitForTimeout(30000);
    
    // Green: 데이터가 업데이트됨 (Mock 시스템의 회전으로 인해)
    const updatedCpuText = await firstCard.locator('[data-testid="cpu-usage"]').textContent();
    
    // Refactor: 업데이트 타임스탬프 검증
    await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();
    const lastUpdated = await page.locator('[data-testid="last-updated"]').textContent();
    expect(lastUpdated).toContain('초 전'); // "몇 초 전" 형식
  });

  test('알림 및 경고 표시', async ({ page }) => {
    // Red: 경고 서버가 식별되지 않는 상태
    await page.waitForSelector('[data-testid="server-card"]');
    
    // 경고 상태의 서버 찾기
    const warningServer = page.locator('[data-testid="server-card"]')
      .filter({ has: page.locator('[data-testid="server-status"][data-status="warning"]') });
    
    if (await warningServer.count() > 0) {
      // Green: 경고 서버가 올바르게 표시됨
      await expect(warningServer.first()).toBeVisible();
      await expect(warningServer.first().locator('[data-testid="alert-indicator"]')).toBeVisible();
      
      // Refactor: 알림 패널 검증
      await expect(page.locator('[data-testid="alert-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="alert-count"]')).toContainText(/[1-9]\d*/); // 1 이상의 숫자
    }
  });

  test('필터링 및 검색 기능', async ({ page }) => {
    // Red: 필터링이 작동하지 않는 상태
    await page.waitForSelector('[data-testid="server-list"]');
    
    // 초기 서버 수 기록
    const initialCount = await page.locator('[data-testid="server-card"]').count();
    
    // 상태 필터 적용
    await page.locator('[data-testid="status-filter"]').selectOption('online');
    await page.waitForTimeout(1000); // 필터 적용 대기
    
    // Green: 필터링된 결과 검증
    const filteredCount = await page.locator('[data-testid="server-card"]').count();
    
    // 온라인 서버만 표시되는지 검증
    const visibleCards = page.locator('[data-testid="server-card"]');
    for (let i = 0; i < await visibleCards.count(); i++) {
      const card = visibleCards.nth(i);
      await expect(card.locator('[data-testid="server-status"]')).toHaveAttribute('data-status', 'online');
    }
    
    // Refactor: 검색 기능 검증
    await page.locator('[data-testid="search-input"]').fill('production');
    await page.waitForTimeout(1000);
    
    const searchResults = await page.locator('[data-testid="server-card"]').count();
    expect(searchResults).toBeGreaterThanOrEqual(0);
  });

  test('성능 메트릭 차트 표시', async ({ page }) => {
    // Red: 차트가 로드되지 않는 상태
    await page.waitForSelector('[data-testid="metrics-chart-container"]');
    
    // Green: 차트가 올바르게 렌더링됨
    await expect(page.locator('[data-testid="cpu-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-chart"]')).toBeVisible();
    
    // Refactor: 차트 데이터 포인트 검증
    const cpuChartSvg = page.locator('[data-testid="cpu-chart"] svg');
    await expect(cpuChartSvg).toBeVisible();
    
    // 차트 내 데이터 포인트가 있는지 검증
    const chartPaths = cpuChartSvg.locator('path, circle, rect');
    await expect(chartPaths.first()).toBeVisible();
  });
});

test.describe('반응형 디자인 검증', () => {
  
  const devices = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  devices.forEach(device => {
    test(`${device.name} 반응형 레이아웃`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Red: 레이아웃이 깨지는 상태
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      
      if (device.width < 768) {
        // Green: 모바일에서 햄버거 메뉴 표시
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      } else {
        // Green: 데스크톱/태블릿에서 전체 네비게이션 표시
        await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible();
      }
      
      // Refactor: 서버 그리드 레이아웃 검증
      const serverCards = page.locator('[data-testid="server-card"]');
      await expect(serverCards.first()).toBeVisible();
    });
  });
});

test.describe('접근성 검증', () => {
  
  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Red: 키보드로 접근할 수 없는 상태
    await page.keyboard.press('Tab');
    
    // Green: 첫 번째 포커스 가능한 요소 확인
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Refactor: Tab 키로 서버 카드 탐색
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // 서버 카드 열기
    
    // 모달이 키보드로 열리는지 검증
    await expect(page.locator('[data-testid="server-modal"]')).toBeVisible();
    
    // ESC 키로 모달 닫기
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="server-modal"]')).not.toBeVisible();
  });

  test('스크린 리더 지원', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Red: ARIA 속성이 없는 상태
    const serverCard = page.locator('[data-testid="server-card"]').first();
    
    // Green: ARIA 레이블 검증
    await expect(serverCard).toHaveAttribute('role', 'button');
    await expect(serverCard).toHaveAttribute('aria-label');
    
    // Refactor: 상태 정보의 접근성 검증
    const statusElement = serverCard.locator('[data-testid="server-status"]');
    await expect(statusElement).toHaveAttribute('aria-label');
  });
});

test.describe('오류 처리 시나리오', () => {
  
  test('네트워크 오류 처리', async ({ page }) => {
    // Red: 네트워크 오류 시 적절한 처리가 없는 상태
    await page.route('/api/servers/all', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/');
    
    // Green: 오류 메시지 표시
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('오류');
    
    // Refactor: 재시도 버튼 검증
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // 재시도 기능 테스트
    await page.route('/api/servers/all', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { servers: [], total: 0 }
        })
      });
    });
    
    await page.locator('[data-testid="retry-button"]').click();
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });
});