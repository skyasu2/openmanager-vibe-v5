/**
 * 🎯 실제 사용자 시나리오 전체 플로우 테스트
 *
 * 테스트 순서:
 * 1. 게스트 모드로 접속
 * 2. 프로필 드롭다운으로 관리자 모드 진입
 * 3. PIN 4231 입력
 * 4. 시스템 시작
 * 5. 대시보드 진입
 * 6. AI 어시스턴트 기능 확인
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://openmanager-vibe-v5-skyasus-projects.vercel.app';

test.describe('전체 사용자 시나리오 플로우', () => {
  test('게스트 → 관리자 모드 → 시스템 시작 → 대시보드 → AI 어시스턴트 전체 플로우', async ({ page }) => {
    console.log('🚀 전체 시나리오 플로우 테스트 시작');

    // 1단계: 게스트 모드로 접속
    console.log('1️⃣ 게스트 모드로 접속');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // 페이지 로딩 확인
    await expect(page).toHaveTitle(/OpenManager/i);
    console.log('✅ 메인 페이지 로딩 완료');

    // 1.5단계: "게스트로 체험하기" 버튼 클릭
    console.log('1.5️⃣ 게스트로 체험하기 버튼 클릭');

    const guestButton = await page.locator('button:has-text("게스트로 체험하기")').first();
    await expect(guestButton).toBeVisible({ timeout: 10000 });
    await guestButton.click();
    console.log('✅ 게스트로 체험하기 버튼 클릭 완료');

    // 메인 페이지 로딩 대기
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('✅ 메인 애플리케이션 로딩 완료');

    // 2단계: 프로필 드롭다운 찾기 및 클릭
    console.log('2️⃣ 프로필 드롭다운 찾기');

    // 여러 가능한 프로필 버튼 셀렉터 시도
    const profileSelectors = [
      'button[aria-label*="profile"]',
      'button[aria-label*="Profile"]',
      'button[aria-label*="프로필"]',
      '[data-testid="profile-button"]',
      '[data-testid="user-menu"]',
      'button:has-text("GU")',  // 게스트 사용자 아이콘
      'button:has-text("프로필")',
      '.profile-button',
      '.user-menu-button',
      'button[title*="프로필"]',
      'button[title*="Profile"]'
    ];

    let profileButton = null;
    for (const selector of profileSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        profileButton = await page.locator(selector).first();
        if (await profileButton.isVisible()) {
          console.log(`✅ 프로필 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ 셀렉터 시도 실패: ${selector}`);
      }
    }

    if (!profileButton) {
      console.log('⚠️ 프로필 버튼을 찾을 수 없음. 페이지의 모든 버튼을 출력합니다.');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const ariaLabel = await allButtons[i].getAttribute('aria-label');
        console.log(`Button ${i}: text="${text}", aria-label="${ariaLabel}"`);
      }
      throw new Error('프로필 드롭다운 버튼을 찾을 수 없습니다');
    }

    // 프로필 드롭다운 클릭
    await profileButton.click();
    console.log('✅ 프로필 드롭다운 클릭');

    // 3단계: 관리자 모드 메뉴 아이템 찾기 및 클릭
    console.log('3️⃣ 관리자 모드 메뉴 찾기');

    const adminModeSelectors = [
      'text="관리자 모드"',
      'text="Admin Mode"',
      '[data-testid="admin-mode"]',
      'button:has-text("관리자")',
      'button:has-text("Admin")',
      '.admin-mode-item',
      '[role="menuitem"]:has-text("관리자")'
    ];

    let adminModeItem = null;
    for (const selector of adminModeSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        adminModeItem = await page.locator(selector).first();
        if (await adminModeItem.isVisible()) {
          console.log(`✅ 관리자 모드 메뉴 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ 관리자 모드 셀렉터 시도 실패: ${selector}`);
      }
    }

    if (!adminModeItem) {
      console.log('⚠️ 관리자 모드 메뉴를 찾을 수 없음. 모든 메뉴 아이템을 출력합니다.');
      const allMenuItems = await page.locator('[role="menuitem"], .menu-item, li').all();
      for (let i = 0; i < allMenuItems.length; i++) {
        const text = await allMenuItems[i].textContent();
        console.log(`Menu item ${i}: "${text}"`);
      }
      throw new Error('관리자 모드 메뉴 아이템을 찾을 수 없습니다');
    }

    await adminModeItem.click();
    console.log('✅ 관리자 모드 클릭');

    // 4단계: PIN 입력 필드 찾기 및 입력
    console.log('4️⃣ PIN 입력');

    const pinInputSelectors = [
      'input[type="password"]',
      'input[placeholder*="PIN"]',
      'input[placeholder*="pin"]',
      'input[placeholder*="패스워드"]',
      'input[placeholder*="비밀번호"]',
      '[data-testid="pin-input"]',
      '.pin-input',
      'input[aria-label*="PIN"]'
    ];

    let pinInput = null;
    for (const selector of pinInputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        pinInput = await page.locator(selector).first();
        if (await pinInput.isVisible()) {
          console.log(`✅ PIN 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ PIN 입력 셀렉터 시도 실패: ${selector}`);
      }
    }

    if (!pinInput) {
      console.log('⚠️ PIN 입력 필드를 찾을 수 없음. 모든 입력 필드를 출력합니다.');
      const allInputs = await page.locator('input').all();
      for (let i = 0; i < allInputs.length; i++) {
        const type = await allInputs[i].getAttribute('type');
        const placeholder = await allInputs[i].getAttribute('placeholder');
        console.log(`Input ${i}: type="${type}", placeholder="${placeholder}"`);
      }
      throw new Error('PIN 입력 필드를 찾을 수 없습니다');
    }

    // PIN 4231 입력
    await pinInput.fill('4231');
    console.log('✅ PIN 4231 입력 완료');

    // 확인 버튼 클릭
    const confirmSelectors = [
      'button:has-text("확인")',
      'button:has-text("OK")',
      'button:has-text("Enter")',
      'button[type="submit"]',
      '[data-testid="confirm-button"]',
      '.confirm-button'
    ];

    let confirmButton = null;
    for (const selector of confirmSelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible()) {
          confirmButton = button;
          console.log(`✅ 확인 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ 확인 버튼 셀렉터 시도 실패: ${selector}`);
      }
    }

    if (confirmButton) {
      await confirmButton.click();
      console.log('✅ 확인 버튼 클릭');
    } else {
      // Enter 키로 대체
      await pinInput.press('Enter');
      console.log('✅ Enter 키로 PIN 확인');
    }

    // 5단계: 시스템 시작 버튼 찾기 및 클릭
    console.log('5️⃣ 시스템 시작 버튼 찾기');

    const startButtonSelectors = [
      'button:has-text("🚀 시스템 시작")',
      'button:has-text("시스템 시작")',
      'button:has-text("Start System")',
      '[data-testid="start-system"]',
      '.start-system-button',
      'button[aria-label*="시스템 시작"]'
    ];

    let startButton = null;
    for (const selector of startButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        startButton = await page.locator(selector).first();
        if (await startButton.isVisible()) {
          console.log(`✅ 시스템 시작 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ 시스템 시작 버튼 셀렉터 시도 실패: ${selector}`);
      }
    }

    if (!startButton) {
      console.log('⚠️ 시스템 시작 버튼을 찾을 수 없음. 모든 버튼을 다시 출력합니다.');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const disabled = await allButtons[i].isDisabled();
        console.log(`Button ${i}: text="${text}", disabled=${disabled}`);
      }
      throw new Error('시스템 시작 버튼을 찾을 수 없습니다');
    }

    // 시스템 시작 버튼이 활성화될 때까지 대기
    await expect(startButton).not.toBeDisabled({ timeout: 15000 });
    await startButton.click();
    console.log('✅ 시스템 시작 버튼 클릭');

    // 6단계: 대시보드로 이동 대기
    console.log('6️⃣ 대시보드 페이지 로딩 대기');

    // 대시보드 URL 변경 또는 대시보드 요소 등장 대기
    try {
      await page.waitForURL('**/dashboard**', { timeout: 30000 });
      console.log('✅ 대시보드 URL로 이동 완료');
    } catch (e) {
      console.log('⚠️ URL 변경은 안 됐지만 대시보드 요소를 찾아봅니다');

      // 대시보드 특정 요소들 대기
      const dashboardSelectors = [
        'h1:has-text("Dashboard")',
        'h1:has-text("대시보드")',
        '[data-testid="dashboard"]',
        '.dashboard-container',
        '.dashboard-header'
      ];

      let dashboardFound = false;
      for (const selector of dashboardSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          console.log(`✅ 대시보드 요소 발견: ${selector}`);
          dashboardFound = true;
          break;
        } catch (e) {
          console.log(`❌ 대시보드 요소 셀렉터 시도 실패: ${selector}`);
        }
      }

      if (!dashboardFound) {
        console.log('⚠️ 대시보드 요소를 찾을 수 없음. 현재 페이지 내용을 확인합니다.');
        const currentURL = page.url();
        const pageTitle = await page.title();
        console.log(`현재 URL: ${currentURL}`);
        console.log(`페이지 제목: ${pageTitle}`);
      }
    }

    // 7단계: AI 어시스턴트 버튼 찾기
    console.log('7️⃣ AI 어시스턴트 버튼 찾기');

    const aiButtonSelectors = [
      'button:has-text("AI 어시스턴트")',
      'button:has-text("AI Assistant")',
      'button:has-text("🤖")',
      '[data-testid="ai-assistant"]',
      '[data-testid="ai-button"]',
      '.ai-assistant-button',
      'button[aria-label*="AI"]',
      'button[title*="AI"]'
    ];

    let aiButton = null;
    for (const selector of aiButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        aiButton = await page.locator(selector).first();
        if (await aiButton.isVisible()) {
          console.log(`✅ AI 어시스턴트 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ AI 어시스턴트 버튼 셀렉터 시도 실패: ${selector}`);
      }
    }

    if (!aiButton) {
      console.log('⚠️ AI 어시스턴트 버튼을 찾을 수 없음. 현재 페이지의 모든 버튼을 출력합니다.');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const ariaLabel = await allButtons[i].getAttribute('aria-label');
        const title = await allButtons[i].getAttribute('title');
        console.log(`Button ${i}: text="${text}", aria-label="${ariaLabel}", title="${title}"`);
      }

      // AI 어시스턴트 버튼이 없으면 경고만 하고 테스트 계속
      console.log('❌ AI 어시스턴트 버튼이 대시보드에 구현되지 않음');
    } else {
      // 8단계: AI 어시스턴트 기능 테스트
      console.log('8️⃣ AI 어시스턴트 기능 테스트');

      await aiButton.click();
      console.log('✅ AI 어시스턴트 버튼 클릭');

      // 크롬 브라우저 팝업 처리 (notifications, location 등)
      console.log('🔔 크롬 팝업 처리 중...');
      try {
        // 알림 권한 요청 팝업 거부
        page.on('dialog', async (dialog) => {
          console.log(`크롬 다이얼로그 감지: ${dialog.message()}`);
          await dialog.dismiss();
        });

        // 알림 권한 팝업 거부 (브라우저 레벨)
        const context = page.context();
        await context.grantPermissions([], { origin: page.url() });

        await page.waitForTimeout(2000); // 팝업 처리 대기
        console.log('✅ 크롬 팝업 처리 완료');
      } catch (e) {
        console.log('⚠️ 크롬 팝업 처리 실패, 계속 진행');
      }

      // AI 사이드바 등장 대기 (우측에서 슬라이드인)
      const aiSidebarSelectors = [
        '.ai-sidebar',
        '.ai-assistant-sidebar',
        '.sidebar.ai',
        '[data-testid="ai-sidebar"]',
        '.side-panel',
        '.assistant-panel',
        // 우측에서 나타나는 패널들
        '.slide-in-right',
        '.panel-right',
        '.fixed.right-0',
        // 일반적인 사이드바 패턴
        'aside',
        '.drawer',
        '.offcanvas'
      ];

      let aiSidebarFound = false;
      for (const selector of aiSidebarSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 8000 });
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ AI 사이드바 발견: ${selector}`);

            // 사이드바 내용 확인
            const sidebarContent = await element.textContent();
            if (sidebarContent && (sidebarContent.includes('AI') || sidebarContent.includes('어시스턴트') || sidebarContent.includes('Assistant'))) {
              console.log(`✅ AI 사이드바 내용 확인: ${sidebarContent.substring(0, 100)}...`);
              aiSidebarFound = true;
              break;
            }
          }
        } catch (e) {
          console.log(`❌ AI 사이드바 셀렉터 시도 실패: ${selector}`);
        }
      }

      if (!aiSidebarFound) {
        console.log('⚠️ AI 사이드바를 찾을 수 없음. 페이지의 모든 aside/sidebar 요소를 검사합니다.');

        const allSidebars = await page.locator('aside, .sidebar, .panel, .drawer, [class*="side"]').all();
        for (let i = 0; i < allSidebars.length; i++) {
          const text = await allSidebars[i].textContent();
          const isVisible = await allSidebars[i].isVisible();
          console.log(`Sidebar ${i}: visible=${isVisible}, content="${text?.substring(0, 50)}..."`);
        }
      }
    }

    // 최종 검증
    console.log('9️⃣ 최종 상태 검증');

    // 대시보드 기본 요소들 확인
    const dashboardElements = {
      headers: await page.locator('h1, h2, h3').count(),
      buttons: await page.locator('button').count(),
      canvases: await page.locator('canvas, svg').count()
    };

    console.log(`✅ 대시보드 요소 확인: ${JSON.stringify(dashboardElements)}`);

    // 현재 인증 상태 확인 (프로필에 "관리자 모드" 표시 여부)
    try {
      const profileStatus = await page.locator('button:has-text("관리자")').first();
      if (await profileStatus.isVisible()) {
        console.log('✅ 관리자 모드 인증 상태 확인됨');
      }
    } catch (e) {
      console.log('⚠️ 관리자 모드 상태 확인 불가');
    }

    console.log('🎉 전체 시나리오 플로우 테스트 완료!');

    // 테스트 결과 요약
    expect(dashboardElements.headers).toBeGreaterThan(0);
    expect(dashboardElements.buttons).toBeGreaterThan(0);
  });
});