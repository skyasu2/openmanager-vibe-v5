/**
 * 🧪 AI 사이드바 기능 전환 테스트
 *
 * ⚠️ 주의: 하루 2-3번 수동 실행 권장 (Vercel 무료 티어 고려)
 *
 * 🎯 목적:
 * - AI 사이드바 5개 기능 전환 검증
 * - 기능 전환 후 UI 업데이트 확인
 * - 기능별 메시지 전송 및 응답 검증
 *
 * 📊 Vercel 부하:
 * - 테스트 수: 7개
 * - AI 쿼리: 3개 (실제 API 호출이 필요한 테스트만)
 * - 예상 요청: 총 3-4회 (매우 적음)
 * - 실행 시간: ~3-4분
 *
 * 🚀 실행 방법:
 * ```bash
 * npx playwright test tests/e2e/ai-functions.spec.ts --project=chromium
 * ```
 */

import { expect, test } from '@playwright/test';
import { submitAiMessage, switchAiFunction } from './helpers/ai-interaction';
import { guestLogin, openAiSidebar } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

test.describe('AI 사이드바 기능 전환 (하루 2-3회 수동 실행)', () => {
  test.beforeEach(async ({ page }) => {
    // 게스트 로그인
    await guestLogin(page);

    // 대시보드로 이동
    const startButton = page.locator('button:has-text("🚀 시스템 시작")');
    await startButton.click();

    // /system-boot 로딩 페이지 대기 (4.7-10초)
    await page.waitForURL('**/system-boot', { timeout: 10000 });

    // /dashboard로 자동 전환 대기 (Vercel Cold Start 대응)
    await page.waitForURL('**/dashboard', {
      timeout: TIMEOUTS.DASHBOARD_LOAD,
    });

    // AI 사이드바 열기
    await openAiSidebar(page);
  });

  test('1. 기본 기능 (chat) UI 확인', async ({ page }) => {
    // 기본 선택된 기능이 'chat'인지 확인
    const chatButton = page.locator('[data-testid="ai-function-chat"]');
    expect(await chatButton.isVisible()).toBe(true);

    // 활성 상태 확인 (그라데이션 배경 또는 scale-105 클래스)
    const chatButtonClass = await chatButton.getAttribute('class');
    const isActive =
      chatButtonClass?.includes('bg-gradient-to-r') ||
      chatButtonClass?.includes('scale-105');

    expect(isActive).toBe(true);
  });

  test('2. 자동장애 보고서 기능으로 전환', async ({ page }) => {
    // auto-report로 전환
    await switchAiFunction(page, 'auto-report', {
      waitForUiUpdate: true,
    });

    // UI 업데이트 확인
    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    const autoReportButton = page.locator(
      '[data-testid="ai-function-auto-report"]'
    );
    const buttonClass = await autoReportButton.getAttribute('class');
    const isActive =
      buttonClass?.includes('bg-gradient-to-r') ||
      buttonClass?.includes('scale-105');

    expect(isActive).toBe(true);
  });

  test('3. 이상감지/예측 기능으로 전환 및 메시지 전송', async ({ page }) => {
    // intelligent-monitoring으로 전환
    await switchAiFunction(page, 'intelligent-monitoring', {
      waitForUiUpdate: true,
    });

    // 전환 후 메시지 전송 (Vercel 요청 1회)
    const response = await submitAiMessage(page, '서버 상태를 알려주세요', {
      waitForResponse: true,
      responseTimeout: TIMEOUTS.AI_RESPONSE,
    });

    // 응답 검증
    expect(response.responseText).toBeTruthy();
    expect(response.responseTime).toBeGreaterThan(0);
  });

  test('4. AI 고급관리 기능으로 전환', async ({ page }) => {
    // advanced-management로 전환
    await switchAiFunction(page, 'advanced-management', {
      waitForUiUpdate: true,
    });

    // UI 업데이트 확인
    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    const advancedButton = page.locator(
      '[data-testid="ai-function-advanced-management"]'
    );
    const buttonClass = await advancedButton.getAttribute('class');
    const isActive =
      buttonClass?.includes('bg-gradient-to-r') ||
      buttonClass?.includes('scale-105');

    expect(isActive).toBe(true);
  });

  test('5. 무료 티어 모니터 기능으로 전환 및 메시지 전송', async ({ page }) => {
    // free-tier-monitor로 전환
    await switchAiFunction(page, 'free-tier-monitor', {
      waitForUiUpdate: true,
    });

    // 전환 후 메시지 전송 (Vercel 요청 1회)
    const response = await submitAiMessage(
      page,
      'Vercel 무료 티어 사용량을 알려주세요',
      {
        waitForResponse: true,
        responseTimeout: TIMEOUTS.AI_RESPONSE,
      }
    );

    // 응답 검증
    expect(response.responseText).toBeTruthy();
    expect(response.responseTime).toBeGreaterThan(0);
  });

  test('6. 기능 전환 후 다시 chat으로 복귀', async ({ page }) => {
    // intelligent-monitoring으로 전환
    await switchAiFunction(page, 'intelligent-monitoring', {
      waitForUiUpdate: true,
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 다시 chat으로 복귀
    await switchAiFunction(page, 'chat', {
      waitForUiUpdate: true,
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // chat 버튼 활성 상태 확인
    const chatButton = page.locator('[data-testid="ai-function-chat"]');
    const buttonClass = await chatButton.getAttribute('class');
    const isActive =
      buttonClass?.includes('bg-gradient-to-r') ||
      buttonClass?.includes('scale-105');

    expect(isActive).toBe(true);
  });

  test('7. 전체 플로우: 기능 전환 → 메시지 전송 → 응답 확인', async ({
    page,
  }) => {
    // 1. chat에서 메시지 전송 (Vercel 요청 1회)
    const chatResponse = await submitAiMessage(page, '안녕하세요', {
      waitForResponse: true,
      responseTimeout: TIMEOUTS.AI_RESPONSE,
    });

    expect(chatResponse.responseText).toBeTruthy();

    // 2. intelligent-monitoring으로 전환
    await switchAiFunction(page, 'intelligent-monitoring', {
      waitForUiUpdate: true,
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 3. 전환 후 다른 메시지 전송 (응답 대기 안 함)
    await submitAiMessage(page, '시스템 상태 요약', {
      waitForResponse: false,
    });

    // 4. 다시 chat으로 복귀
    await switchAiFunction(page, 'chat', {
      waitForUiUpdate: true,
    });

    // 최종 UI 상태 확인
    const chatButton = page.locator('[data-testid="ai-function-chat"]');
    const buttonClass = await chatButton.getAttribute('class');
    const isActive =
      buttonClass?.includes('bg-gradient-to-r') ||
      buttonClass?.includes('scale-105');

    expect(isActive).toBe(true);
  });
});
