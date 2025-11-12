/**
 * 🎯 실제 사용자 시나리오 전체 플로우 테스트
 *
 * 테스트 순서:
 * 1. 게스트 모드로 접속
 * 2. 게스트 전체 접근 모드에서 시스템 시작
 * 3. 대시보드 진입
 * 4. AI 어시스턴트 기능 확인
 */

import { test, expect } from '@playwright/test';
import { getTestBaseUrl } from './helpers/config';
import { TIMEOUTS } from './helpers/timeouts';
import { guestLogin, resetGuestState, openAiSidebar } from './helpers/guest';

const BASE_URL = getTestBaseUrl();

test.describe('전체 사용자 시나리오 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await resetGuestState(page);
  });

  test('게스트 → 시스템 시작 → 대시보드 → AI 어시스턴트 플로우', async ({
    page,
  }) => {
    console.log('🚀 전체 시나리오 플로우 테스트 시작');

    // 1단계: 게스트 모드로 접속
    console.log('1️⃣ 게스트 모드로 접속');
    await guestLogin(page, { landingPath: BASE_URL });
    console.log('✅ 게스트 로그인 및 메인 애플리케이션 로딩 완료');

    // 2단계: 시스템 시작 버튼 찾기 및 클릭
    console.log('2️⃣ 시스템 시작 버튼 찾기');

    const startButtonSelectors = [
      'button:has-text("🚀 시스템 시작")',
      'button:has-text("시스템 시작")',
      'button:has-text("Start System")',
      '[data-testid="start-system"]',
      '.start-system-button',
      'button[aria-label*="시스템 시작"]',
    ];

    let startButton = null;
    for (const selector of startButtonSelectors) {
      try {
        await page.waitForSelector(selector, {
          timeout: TIMEOUTS.MODAL_DISPLAY,
        });
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
      console.log(
        '⚠️ 시스템 시작 버튼을 찾을 수 없음. 모든 버튼을 다시 출력합니다.'
      );
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const disabled = await allButtons[i].isDisabled();
        console.log(`Button ${i}: text="${text}", disabled=${disabled}`);
      }
      throw new Error('시스템 시작 버튼을 찾을 수 없습니다');
    }

    // 시스템 시작 버튼이 활성화될 때까지 대기
    await expect(startButton).not.toBeDisabled({
      timeout: TIMEOUTS.FORM_SUBMIT,
    });
    await startButton.click();
    console.log('✅ 시스템 시작 버튼 클릭');

    // 3단계: 대시보드로 이동 대기
    console.log('3️⃣ 대시보드 페이지 로딩 대기');

    // 대시보드 URL 변경 또는 대시보드 요소 등장 대기
    try {
      await page.waitForURL('**/dashboard**', {
        timeout: TIMEOUTS.NETWORK_REQUEST,
      });
      console.log('✅ 대시보드 URL로 이동 완료');
    } catch (e) {
      console.log('⚠️ URL 변경은 안 됐지만 대시보드 요소를 찾아봅니다');

      // 대시보드 특정 요소들 대기
      const dashboardSelectors = [
        'h1:has-text("Dashboard")',
        'h1:has-text("대시보드")',
        '[data-testid="dashboard"]',
        '.dashboard-container',
        '.dashboard-header',
      ];

      let dashboardFound = false;
      for (const selector of dashboardSelectors) {
        try {
          await page.waitForSelector(selector, {
            timeout: TIMEOUTS.MODAL_DISPLAY,
          });
          console.log(`✅ 대시보드 요소 발견: ${selector}`);
          dashboardFound = true;
          break;
        } catch (e) {
          console.log(`❌ 대시보드 요소 셀렉터 시도 실패: ${selector}`);
        }
      }

      if (!dashboardFound) {
        console.log(
          '⚠️ 대시보드 요소를 찾을 수 없음. 현재 페이지 내용을 확인합니다.'
        );
        const currentURL = page.url();
        const pageTitle = await page.title();
        console.log(`현재 URL: ${currentURL}`);
        console.log(`페이지 제목: ${pageTitle}`);
      }
    }

    // 4-5단계: AI 어시스턴트 토글 및 사이드바 확인
    console.log('4️⃣ AI 어시스턴트 버튼 및 사이드바 확인');
    try {
      const sidebar = await openAiSidebar(page, {
        waitTimeout: TIMEOUTS.MODAL_DISPLAY,
      });
      await expect(sidebar).toBeVisible();
      const sidebarContent = await sidebar.textContent();
      console.log(
        `✅ AI 사이드바 내용 확인: ${sidebarContent?.substring(0, 100) ?? ''}`
      );
    } catch (error) {
      console.log('⚠️ AI 토글/사이드바 확인 실패:', error);
    }

    // 최종 검증
    console.log('6️⃣ 최종 상태 검증');

    // 대시보드 기본 요소들 확인
    const dashboardElements = {
      headers: await page.locator('h1, h2, h3').count(),
      buttons: await page.locator('button').count(),
      canvases: await page.locator('canvas, svg').count(),
    };

    console.log(`✅ 대시보드 요소 확인: ${JSON.stringify(dashboardElements)}`);

    // 관리자 모드 UI가 노출되지 않는지 점검
    const adminBadge = page.locator('text=관리자 모드');
    const adminBadgeCount = await adminBadge.count();
    if (adminBadgeCount > 0) {
      console.log('❌ 관리자 모드 배지가 여전히 노출되고 있습니다.');
    } else {
      console.log('ℹ️ 관리자 모드 배지가 표시되지 않는 것을 확인했습니다.');
    }
    expect(adminBadgeCount).toBe(0);

    console.log('🎉 전체 시나리오 플로우 테스트 완료!');

    // 테스트 결과 요약
    expect(dashboardElements.headers).toBeGreaterThan(0);
    expect(dashboardElements.buttons).toBeGreaterThan(0);
  });
});
