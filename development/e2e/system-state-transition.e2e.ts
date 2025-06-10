import { test, expect } from '@playwright/test';

test.describe('🔄 시스템 상태 전이 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // 페이지 로딩 대기
    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
  });

  test('시스템 OFF → ON → OFF 전체 상태 전이 시나리오', async ({ page }) => {
    // 1. 초기 시스템 OFF 상태 확인
    await test.step('초기 시스템 OFF 상태 확인', async () => {
      const systemStatus = page.locator('[data-testid="system-status"]');
      await expect(systemStatus).toContainText('OFF');
      
      // OFF 상태 UI 요소들 확인
      const startButton = page.locator('[data-testid="system-start-button"]');
      await expect(startButton).toBeVisible();
      await expect(startButton).toBeEnabled();
    });

    // 2. 시스템 시작 (OFF → ON)
    await test.step('시스템 시작 (OFF → ON)', async () => {
      const startButton = page.locator('[data-testid="system-start-button"]');
      await startButton.click();
      
      // 시작 중 로딩 상태 확인
      const loadingSpinner = page.locator('[data-testid="system-loading"]');
      await expect(loadingSpinner).toBeVisible();
      
      // ON 상태로 전환 확인 (최대 30초 대기)
      const systemStatus = page.locator('[data-testid="system-status"]');
      await expect(systemStatus).toContainText('ON', { timeout: 30000 });
      
      // ON 상태 UI 요소들 확인
      const stopButton = page.locator('[data-testid="system-stop-button"]');
      await expect(stopButton).toBeVisible();
      await expect(stopButton).toBeEnabled();
      
      // AI 에이전트 상태 확인
      const aiAgentStatus = page.locator('[data-testid="ai-agent-status"]');
      await expect(aiAgentStatus).toBeVisible();
    });

    // 3. ON 상태에서 시스템 기능 확인
    await test.step('ON 상태에서 시스템 기능 확인', async () => {
      // 서버 카드들이 보이는지 확인
      const serverCards = page.locator('[data-testid="server-card"]');
      await expect(serverCards.first()).toBeVisible();
      
      // 메트릭 데이터가 업데이트되는지 확인
      const cpuMetric = page.locator('[data-testid="cpu-metric"]');
      await expect(cpuMetric).toBeVisible();
      
      // AI 사이드바 토글 테스트
      const aiToggle = page.locator('[data-testid="ai-sidebar-toggle"]');
      if (await aiToggle.isVisible()) {
        await aiToggle.click();
        const aiSidebar = page.locator('[data-testid="ai-sidebar"]');
        await expect(aiSidebar).toBeVisible();
      }
    });

    // 4. 시스템 중지 (ON → OFF)
    await test.step('시스템 중지 (ON → OFF)', async () => {
      const stopButton = page.locator('[data-testid="system-stop-button"]');
      await stopButton.click();
      
      // 중지 확인 모달이 있다면 확인
      const confirmButton = page.locator('[data-testid="confirm-stop-button"]');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      // 중지 중 로딩 상태 확인
      const loadingSpinner = page.locator('[data-testid="system-loading"]');
      await expect(loadingSpinner).toBeVisible();
      
      // OFF 상태로 전환 확인 (최대 30초 대기)
      const systemStatus = page.locator('[data-testid="system-status"]');
      await expect(systemStatus).toContainText('OFF', { timeout: 30000 });
    });

    // 5. 최종 OFF 상태 확인
    await test.step('최종 OFF 상태 확인', async () => {
      // OFF 상태 UI 요소들 확인
      const startButton = page.locator('[data-testid="system-start-button"]');
      await expect(startButton).toBeVisible();
      await expect(startButton).toBeEnabled();
      
      // AI 사이드바가 닫혀있는지 확인
      const aiSidebar = page.locator('[data-testid="ai-sidebar"]');
      await expect(aiSidebar).not.toBeVisible();
      
      // 상태 스토어 초기화 확인을 위한 페이지 새로고침 후 확인
      await page.reload();
      await page.waitForSelector('[data-testid="dashboard-container"]');
      
      const systemStatusAfterReload = page.locator('[data-testid="system-status"]');
      await expect(systemStatusAfterReload).toContainText('OFF');
    });
  });

  test('AI 에이전트 개별 시작/중지 테스트', async ({ page }) => {
    // 시스템이 ON 상태일 때만 실행
    await test.step('시스템 시작', async () => {
      const startButton = page.locator('[data-testid="system-start-button"]');
      if (await startButton.isVisible()) {
        await startButton.click();
        const systemStatus = page.locator('[data-testid="system-status"]');
        await expect(systemStatus).toContainText('ON', { timeout: 30000 });
      }
    });

    await test.step('AI 에이전트 상태 전이 테스트', async () => {
      // AI 설정 모달 열기
      const aiSettingsButton = page.locator('[data-testid="ai-settings-button"]');
      if (await aiSettingsButton.isVisible()) {
        await aiSettingsButton.click();
        
        // AI 에이전트 토글 스위치 테스트
        const aiAgentToggle = page.locator('[data-testid="ai-agent-toggle"]');
        
        if (await aiAgentToggle.isVisible()) {
          // 현재 상태 확인
          const isChecked = await aiAgentToggle.isChecked();
          
          // 토글 변경
          await aiAgentToggle.click();
          
          // 상태 변경 확인
          await expect(aiAgentToggle).toBeChecked({ checked: !isChecked });
          
          // 다시 원래 상태로 복귀
          await aiAgentToggle.click();
          await expect(aiAgentToggle).toBeChecked({ checked: isChecked });
        }
        
        // 모달 닫기
        const closeButton = page.locator('[data-testid="modal-close-button"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    });
  });

  test('상태 전이 에러 시나리오 테스트', async ({ page }) => {
    await test.step('네트워크 오류 시뮬레이션', async () => {
      // 네트워크 요청 차단
      await page.route('**/api/system/**', route => route.abort());
      
      const startButton = page.locator('[data-testid="system-start-button"]');
      await startButton.click();
      
      // 에러 메시지 확인
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      
      // 시스템이 여전히 OFF 상태인지 확인
      const systemStatus = page.locator('[data-testid="system-status"]');
      await expect(systemStatus).toContainText('OFF');
    });
  });

  test('30분 자동 종료 타이머 테스트', async ({ page }) => {
    // 시스템 시작
    await test.step('시스템 시작 및 타이머 확인', async () => {
      const startButton = page.locator('[data-testid="system-start-button"]');
      await startButton.click();
      
      const systemStatus = page.locator('[data-testid="system-status"]');
      await expect(systemStatus).toContainText('ON', { timeout: 30000 });
      
      // 30분 타이머 표시 확인
      const autoShutdownTimer = page.locator('[data-testid="auto-shutdown-timer"]');
      await expect(autoShutdownTimer).toBeVisible();
      
      // 타이머가 감소하는지 확인 (몇 초 대기)
      const initialTime = await autoShutdownTimer.textContent();
      await page.waitForTimeout(3000);
      const laterTime = await autoShutdownTimer.textContent();
      
      expect(initialTime).not.toBe(laterTime);
    });
  });
}); 