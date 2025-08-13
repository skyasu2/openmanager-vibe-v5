import { test, expect } from '@playwright/test';

test.describe('OpenManager VIBE v5 - Basic E2E Flow', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 수집
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });

    // 네트워크 에러 수집
    page.on('response', (response) => {
      if (!response.ok() && response.status() >= 400) {
        console.log(`Network error: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('메인 페이지 로드 및 기본 네비게이션', async ({ page }) => {
    // 메인 페이지 접속
    await page.goto(baseUrl);
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/OpenManager VIBE v5/);
    
    // 메인 헤더 요소 확인
    await expect(page.locator('h1')).toContainText('OpenManager');
    
    // 로딩 상태 확인 (로딩이 완료될 때까지 대기)
    await page.waitForLoadState('networkidle');
    
    // 중요한 UI 요소들이 렌더링되었는지 확인
    await expect(page.locator('[data-testid="main-dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('대시보드 서버 목록 표시', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // 서버 목록 섹션 확인
    const serverList = page.locator('[data-testid="server-list"]');
    await expect(serverList).toBeVisible({ timeout: 15000 });
    
    // 서버 카드들이 로드되었는지 확인
    const serverCards = page.locator('[data-testid^="server-card"]');
    await expect(serverCards.first()).toBeVisible({ timeout: 10000 });
    
    // 서버 상태 정보 확인
    await expect(page.locator('.server-status')).toBeVisible();
  });

  test('AI Sidebar 열기 및 기본 기능', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // AI Sidebar 열기 버튼 찾기 및 클릭
    const aiSidebarButton = page.locator('[data-testid="ai-sidebar-toggle"]');
    await expect(aiSidebarButton).toBeVisible({ timeout: 10000 });
    await aiSidebarButton.click();
    
    // AI Sidebar가 열렸는지 확인
    const aiSidebar = page.locator('[data-testid="ai-sidebar"]');
    await expect(aiSidebar).toBeVisible({ timeout: 5000 });
    
    // AI 엔진 선택기 확인
    const engineSelector = page.locator('[data-testid="ai-engine-selector"]');
    await expect(engineSelector).toBeVisible();
    
    // 채팅 입력창 확인
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEditable();
  });

  test('AI 쿼리 실행 플로우', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // AI Sidebar 열기
    const aiSidebarButton = page.locator('[data-testid="ai-sidebar-toggle"]');
    await aiSidebarButton.click();
    
    // AI Sidebar 로드 대기
    const aiSidebar = page.locator('[data-testid="ai-sidebar"]');
    await expect(aiSidebar).toBeVisible();
    
    // 채팅 입력창에 쿼리 입력
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('현재 서버 상태는 어떤가요?');
    
    // 전송 버튼 클릭
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();
    
    // 사용자 메시지가 표시되었는지 확인
    const userMessage = page.locator('[data-testid="chat-message-user"]').last();
    await expect(userMessage).toContainText('현재 서버 상태는 어떤가요?');
    
    // AI 응답 대기 (최대 30초)
    const aiResponse = page.locator('[data-testid="chat-message-assistant"]').last();
    await expect(aiResponse).toBeVisible({ timeout: 30000 });
    
    // AI 응답 내용 확인
    await expect(aiResponse).toContainText(/서버/);
  });

  test('AI 엔진 변경 기능', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // AI Sidebar 열기
    await page.locator('[data-testid="ai-sidebar-toggle"]').click();
    await expect(page.locator('[data-testid="ai-sidebar"]')).toBeVisible();
    
    // AI 엔진 선택기에서 Google AI로 변경
    const engineSelector = page.locator('[data-testid="ai-engine-selector"]');
    await engineSelector.click();
    
    const googleAIOption = page.locator('[data-testid="engine-option-GOOGLE_ONLY"]');
    await googleAIOption.click();
    
    // 선택된 엔진이 변경되었는지 확인
    await expect(page.locator('[data-testid="selected-engine"]')).toContainText('Google AI');
    
    // 간단한 쿼리로 새 엔진 테스트
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('안녕하세요');
    
    await page.locator('[data-testid="ai-send-button"]').click();
    
    // 응답이 오는지 확인
    const aiResponse = page.locator('[data-testid="chat-message-assistant"]').last();
    await expect(aiResponse).toBeVisible({ timeout: 20000 });
  });

  test('반응형 디자인 확인', async ({ page }) => {
    // 데스크톱 해상도
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseUrl);
    
    // AI Sidebar가 사이드바로 표시되는지 확인
    await page.locator('[data-testid="ai-sidebar-toggle"]').click();
    const sidebar = page.locator('[data-testid="ai-sidebar"]');
    await expect(sidebar).toBeVisible();
    
    // 모바일 해상도로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 모바일에서는 AI Sidebar가 오버레이로 표시되거나 다르게 동작할 수 있음
    // 최소한 접근 가능해야 함
    await expect(page.locator('[data-testid="ai-sidebar-toggle"]')).toBeVisible();
    
    // 태블릿 해상도 테스트
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="main-dashboard"]')).toBeVisible();
  });

  test('페이지 성능 확인', async ({ page }) => {
    // 네비게이션 시작 시간 기록
    const startTime = Date.now();
    
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 페이지 로드 시간이 10초 이내인지 확인
    expect(loadTime).toBeLessThan(10000);
    
    // 중요한 요소들이 빠르게 로드되는지 확인
    const dashboardVisible = Date.now();
    await expect(page.locator('[data-testid="main-dashboard"]')).toBeVisible({ timeout: 5000 });
    const dashboardLoadTime = Date.now() - dashboardVisible;
    
    expect(dashboardLoadTime).toBeLessThan(5000);
  });

  test('에러 처리 확인', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // AI Sidebar 열기
    await page.locator('[data-testid="ai-sidebar-toggle"]').click();
    await expect(page.locator('[data-testid="ai-sidebar"]')).toBeVisible();
    
    // 빈 쿼리 전송 시도
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    
    await chatInput.fill('');
    await sendButton.click();
    
    // 에러 메시지나 알림이 표시되는지 확인
    // 또는 빈 쿼리가 전송되지 않는지 확인
    await expect(chatInput).toBeFocused();
  });
});