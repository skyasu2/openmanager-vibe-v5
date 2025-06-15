import { test, expect } from '@playwright/test';

test.describe('🎭 UI 모달 전수 동작 확인 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
  });

  test('AI 에이전트 모달 전체 동작 테스트', async ({ page }) => {
    await test.step('AI 에이전트 모달 열기', async () => {
      const aiButton = page.locator('[data-testid="ai-agent-modal-trigger"]');
      await aiButton.click();
      
      const aiModal = page.locator('[data-testid="ai-agent-modal"]');
      await expect(aiModal).toBeVisible();
      
      // 모달 백드롭 확인
      const backdrop = page.locator('[data-testid="modal-backdrop"]');
      await expect(backdrop).toBeVisible();
    });

    await test.step('AI 모달 컨텐츠 확인', async () => {
      // AI 에이전트 상태 토글
      const agentToggle = page.locator('[data-testid="ai-agent-toggle"]');
      await expect(agentToggle).toBeVisible();
      
      // 설정 옵션들
      const settingsSection = page.locator('[data-testid="ai-settings-section"]');
      await expect(settingsSection).toBeVisible();
      
      // 저장 버튼
      const saveButton = page.locator('[data-testid="ai-modal-save"]');
      await expect(saveButton).toBeVisible();
    });

    await test.step('AI 모달 닫기 테스트', async () => {
      // ESC 키로 닫기
      await page.keyboard.press('Escape');
      
      const aiModal = page.locator('[data-testid="ai-agent-modal"]');
      await expect(aiModal).not.toBeVisible();
      
      // 다시 열기
      const aiButton = page.locator('[data-testid="ai-agent-modal-trigger"]');
      await aiButton.click();
      await expect(aiModal).toBeVisible();
      
      // X 버튼으로 닫기
      const closeButton = page.locator('[data-testid="modal-close-button"]');
      await closeButton.click();
      await expect(aiModal).not.toBeVisible();
      
      // 백드롭 클릭으로 닫기
      await aiButton.click();
      await expect(aiModal).toBeVisible();
      
      const backdrop = page.locator('[data-testid="modal-backdrop"]');
      await backdrop.click({ position: { x: 10, y: 10 } });
      await expect(aiModal).not.toBeVisible();
    });
  });

  test('통합 설정 모달 전체 동작 테스트', async ({ page }) => {
    await test.step('프로필 드롭다운에서 통합 설정 열기', async () => {
      // 프로필 버튼 클릭
      const profileButton = page.locator('[data-testid="profile-dropdown-trigger"]');
      await profileButton.click();
      
      // 드롭다운 메뉴 확인
      const dropdown = page.locator('[data-testid="profile-dropdown"]');
      await expect(dropdown).toBeVisible();
      
      // 통합 설정 메뉴 클릭
      const unifiedSettingsItem = page.locator('[data-testid="unified-settings-item"]');
      await unifiedSettingsItem.click();
      
      // 통합 설정 모달 확인
      const unifiedModal = page.locator('[data-testid="unified-settings-modal"]');
      await expect(unifiedModal).toBeVisible();
    });

    await test.step('통합 설정 모달 컨텐츠 확인', async () => {
      // 탭 네비게이션 확인
      const generalTab = page.locator('[data-testid="settings-general-tab"]');
      const securityTab = page.locator('[data-testid="settings-security-tab"]');
      const advancedTab = page.locator('[data-testid="settings-advanced-tab"]');
      
      await expect(generalTab).toBeVisible();
      await expect(securityTab).toBeVisible();
      await expect(advancedTab).toBeVisible();
      
      // 각 탭 클릭 테스트
      await securityTab.click();
      const securityContent = page.locator('[data-testid="security-settings-content"]');
      await expect(securityContent).toBeVisible();
      
      await advancedTab.click();
      const advancedContent = page.locator('[data-testid="advanced-settings-content"]');
      await expect(advancedContent).toBeVisible();
      
      await generalTab.click();
      const generalContent = page.locator('[data-testid="general-settings-content"]');
      await expect(generalContent).toBeVisible();
    });

    await test.step('설정 변경 및 저장 테스트', async () => {
      // 설정 변경
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      if (await themeToggle.isVisible()) {
        const initialState = await themeToggle.isChecked();
        await themeToggle.click();
        await expect(themeToggle).toBeChecked({ checked: !initialState });
      }
      
      // 저장 버튼 클릭
      const saveButton = page.locator('[data-testid="settings-save-button"]');
      await saveButton.click();
      
      // 성공 메시지 확인
      const successMessage = page.locator('[data-testid="success-toast"]');
      await expect(successMessage).toBeVisible();
    });

    await test.step('통합 설정 모달 닫기 테스트', async () => {
      const unifiedModal = page.locator('[data-testid="unified-settings-modal"]');
      
      // ESC 키로 닫기 테스트
      await page.keyboard.press('Escape');
      await expect(unifiedModal).not.toBeVisible();
    });
  });

  test('서버 상세 정보 모달 테스트', async ({ page }) => {
    await test.step('서버 카드에서 상세 모달 열기', async () => {
      // 첫 번째 서버 카드 클릭
      const serverCard = page.locator('[data-testid="server-card"]').first();
      await serverCard.click();
      
      const serverModal = page.locator('[data-testid="server-detail-modal"]');
      await expect(serverModal).toBeVisible();
    });

    await test.step('서버 상세 정보 확인', async () => {
      // 서버 메트릭 정보
      const cpuUsage = page.locator('[data-testid="server-cpu-usage"]');
      const memoryUsage = page.locator('[data-testid="server-memory-usage"]');
      const diskUsage = page.locator('[data-testid="server-disk-usage"]');
      
      await expect(cpuUsage).toBeVisible();
      await expect(memoryUsage).toBeVisible();
      await expect(diskUsage).toBeVisible();
      
      // 서버 로그 섹션
      const logsSection = page.locator('[data-testid="server-logs-section"]');
      await expect(logsSection).toBeVisible();
    });

    await test.step('서버 상세 모달 닫기', async () => {
      const closeButton = page.locator('[data-testid="server-modal-close"]');
      await closeButton.click();
      
      const serverModal = page.locator('[data-testid="server-detail-modal"]');
      await expect(serverModal).not.toBeVisible();
    });
  });

  test('알림/경고 모달 테스트', async ({ page }) => {
    await test.step('시스템 경고 모달 트리거', async () => {
      // 시스템 경고를 시뮬레이션하기 위해 특정 액션 수행
      const alertTrigger = page.locator('[data-testid="test-alert-trigger"]');
      if (await alertTrigger.isVisible()) {
        await alertTrigger.click();
        
        const alertModal = page.locator('[data-testid="alert-modal"]');
        await expect(alertModal).toBeVisible();
        
        // 경고 메시지 확인
        const alertMessage = page.locator('[data-testid="alert-message"]');
        await expect(alertMessage).toBeVisible();
        
        // 확인 버튼 클릭
        const okButton = page.locator('[data-testid="alert-ok-button"]');
        await okButton.click();
        
        await expect(alertModal).not.toBeVisible();
      }
    });
  });

  test('확인 다이얼로그 모달 테스트', async ({ page }) => {
    await test.step('시스템 중지 확인 다이얼로그', async () => {
      // 시스템 시작 (중지 버튼을 보기 위해)
      const startButton = page.locator('[data-testid="system-start-button"]');
      if (await startButton.isVisible()) {
        await startButton.click();
        
        // ON 상태 대기
        const systemStatus = page.locator('[data-testid="system-status"]');
        await expect(systemStatus).toContainText('ON', { timeout: 30000 });
        
        // 중지 버튼 클릭
        const stopButton = page.locator('[data-testid="system-stop-button"]');
        await stopButton.click();
        
        // 확인 다이얼로그 확인
        const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
        await expect(confirmDialog).toBeVisible();
        
        // 취소 버튼 테스트
        const cancelButton = page.locator('[data-testid="confirm-cancel"]');
        await cancelButton.click();
        await expect(confirmDialog).not.toBeVisible();
        
        // 다시 중지 시도하고 확인
        await stopButton.click();
        await expect(confirmDialog).toBeVisible();
        
        const confirmButton = page.locator('[data-testid="confirm-ok"]');
        await confirmButton.click();
        await expect(confirmDialog).not.toBeVisible();
      }
    });
  });

  test('모달 스택(중첩) 테스트', async ({ page }) => {
    await test.step('모달 위에 모달 열기 테스트', async () => {
      // 첫 번째 모달 열기 (설정 모달)
      const profileButton = page.locator('[data-testid="profile-dropdown-trigger"]');
      await profileButton.click();
      
      const settingsItem = page.locator('[data-testid="unified-settings-item"]');
      await settingsItem.click();
      
      const settingsModal = page.locator('[data-testid="unified-settings-modal"]');
      await expect(settingsModal).toBeVisible();
      
      // 설정 모달 위에 도움말 모달 열기
      const helpButton = page.locator('[data-testid="settings-help-button"]');
      if (await helpButton.isVisible()) {
        await helpButton.click();
        
        const helpModal = page.locator('[data-testid="help-modal"]');
        await expect(helpModal).toBeVisible();
        
        // 두 모달이 모두 보이는지 확인
        await expect(settingsModal).toBeVisible();
        await expect(helpModal).toBeVisible();
        
        // 맨 위 모달 닫기
        const helpCloseButton = page.locator('[data-testid="help-modal-close"]');
        await helpCloseButton.click();
        await expect(helpModal).not.toBeVisible();
        
        // 아래 모달은 여전히 보이는지 확인
        await expect(settingsModal).toBeVisible();
        
        // 설정 모달 닫기
        await page.keyboard.press('Escape');
        await expect(settingsModal).not.toBeVisible();
      }
    });
  });

  test('모달 접근성 테스트', async ({ page }) => {
    await test.step('키보드 네비게이션 테스트', async () => {
      // AI 모달 열기
      const aiButton = page.locator('[data-testid="ai-agent-modal-trigger"]');
      await aiButton.click();
      
      const aiModal = page.locator('[data-testid="ai-agent-modal"]');
      await expect(aiModal).toBeVisible();
      
      // 포커스가 모달 내부로 이동했는지 확인
      const firstFocusableElement = page.locator('[data-testid="ai-agent-modal"] button, [data-testid="ai-agent-modal"] input').first();
      await expect(firstFocusableElement).toBeFocused();
      
      // Tab 키로 네비게이션 테스트
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // ESC 키로 닫기
      await page.keyboard.press('Escape');
      await expect(aiModal).not.toBeVisible();
      
      // 포커스가 트리거 버튼으로 돌아왔는지 확인
      await expect(aiButton).toBeFocused();
    });

    await test.step('ARIA 라벨 확인', async () => {
      const aiButton = page.locator('[data-testid="ai-agent-modal-trigger"]');
      await aiButton.click();
      
      const aiModal = page.locator('[data-testid="ai-agent-modal"]');
      
      // ARIA 라벨들 확인
      const ariaLabel = await aiModal.getAttribute('aria-label');
      const ariaDescribedby = await aiModal.getAttribute('aria-describedby');
      const role = await aiModal.getAttribute('role');
      
      expect(ariaLabel || ariaDescribedby).toBeTruthy();
      expect(role).toBe('dialog');
      
      await page.keyboard.press('Escape');
    });
  });

  test('모달 성능 테스트', async ({ page }) => {
    await test.step('모달 열기/닫기 반응 속도 테스트', async () => {
      const aiButton = page.locator('[data-testid="ai-agent-modal-trigger"]');
      const aiModal = page.locator('[data-testid="ai-agent-modal"]');
      
      // 여러 번 빠르게 열고 닫기
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await aiButton.click();
        await expect(aiModal).toBeVisible();
        
        const openTime = Date.now() - startTime;
        expect(openTime).toBeLessThan(1000); // 1초 이내 열기
        
        const closeStartTime = Date.now();
        await page.keyboard.press('Escape');
        await expect(aiModal).not.toBeVisible();
        
        const closeTime = Date.now() - closeStartTime;
        expect(closeTime).toBeLessThan(500); // 0.5초 이내 닫기
        
        await page.waitForTimeout(100); // 안정화 대기
      }
    });
  });
}); 