/* eslint-disable no-undef */
/**
 * 🧪 AI Interaction Helpers 샘플 테스트 (로컬 개발 환경 전용)
 *
 * ⚠️ 주의: 이 파일은 실제 테스트 suite에 포함되지 않습니다 (*.sample.spec.ts)
 *
 * 🎯 목적:
 * - ai-interaction.ts 헬퍼 함수의 실제 동작 확인
 * - MCP 로깅 기능 검증
 * - Vercel 부하 없이 로컬 환경에서만 실행
 *
 * 🚀 실행 방법:
 * ```bash
 * # 1. 로컬 개발 서버 시작
 * npm run dev
 *
 * # 2. 샘플 테스트 실행 (1회만)
 * npx playwright test tests/e2e/helpers/ai-interaction.sample.spec.ts --headed
 * ```
 *
 * 📊 효과:
 * - Vercel 요청: 0회
 * - 헬퍼 함수 실제 동작 확인
 * - MCP 로깅 검증
 */

import { test, expect } from '@playwright/test';
import {
  submitAiMessage,
  switchAiFunction,
  closeAiSidebar,
} from './ai-interaction';
import { guestLogin, openAiSidebar } from './guest';

test.describe('AI Interaction Helpers 샘플 테스트 (로컬 전용)', () => {
  test.beforeEach(async ({ page }) => {
    // 로컬 개발 서버 사용 (http://localhost:3000)
    await guestLogin(page);

    // 대시보드로 이동
    const startButton = page.locator('button:has-text("🚀 시스템 시작")');
    await startButton.click();

    // /system-boot 로딩 페이지 대기
    await page.waitForURL('**/system-boot', { timeout: 10000 });

    // /dashboard로 자동 전환 대기
    await page.waitForURL('**/dashboard', { timeout: 40000 });
  });

  test('submitAiMessage: 기본 동작 확인', async ({ page }) => {
    // AI 사이드바 열기
    await openAiSidebar(page);

    // 헬퍼 함수 테스트: 간단한 메시지 전송
    const response = await submitAiMessage(page, '안녕하세요', {
      waitForResponse: true,
      enableMcpLogging: true,
      detectStreamingEnd: true,
    });

    // 검증
    expect(response.responseText).toBeTruthy();
    expect(response.responseTime).toBeGreaterThan(0);

    console.log('✅ submitAiMessage 정상 작동:', {
      responseLength: response.responseText.length,
      responseTime: `${response.responseTime}ms`,
      sseEventCount: response.sseEventCount ?? 'N/A',
      mcpLogsCount: response.consoleLogs?.length ?? 0,
    });
  });

  test('submitAiMessage: MCP 로깅 확인', async ({ page }) => {
    await openAiSidebar(page);

    // MCP 로깅 활성화
    const response = await submitAiMessage(page, '서버 상태를 알려주세요', {
      waitForResponse: true,
      enableMcpLogging: true,
    });

    // MCP 로그 검증
    expect(response.consoleLogs).toBeDefined();
    if (response.consoleLogs) {
      expect(response.consoleLogs.length).toBeGreaterThan(0);

      console.log('✅ MCP 로그 수집:', {
        totalLogs: response.consoleLogs.length,
        sampleLogs: response.consoleLogs.slice(0, 3),
      });
    }
  });

  test('switchAiFunction: 기능 전환 확인', async ({ page }) => {
    await openAiSidebar(page);

    // 기능 전환 테스트 (chat → intelligent-monitoring)
    await switchAiFunction(page, 'intelligent-monitoring', {
      waitForUiUpdate: true,
    });

    // UI 업데이트 확인 (예: 버튼 활성 상태 변경)
    const activeButton = page.locator(
      '[data-testid="ai-function-intelligent-monitoring"]'
    );
    const isActive = await activeButton.isVisible().catch(() => false);

    console.log('✅ switchAiFunction 정상 작동:', {
      targetFunction: 'intelligent-monitoring',
      uiUpdated: isActive,
    });
  });

  test('closeAiSidebar: ESC 키로 닫기', async ({ page }) => {
    await openAiSidebar(page);

    // ESC 키로 사이드바 닫기
    await closeAiSidebar(page, {
      method: 'esc',
      verifyClose: true,
    });

    // 사이드바가 닫혔는지 확인
    const sidebar = page.locator('[data-testid="ai-sidebar"]');
    const isHidden = await sidebar.isHidden().catch(() => true);

    expect(isHidden).toBe(true);

    console.log('✅ closeAiSidebar (ESC) 정상 작동');
  });

  test('closeAiSidebar: 버튼으로 닫기', async ({ page }) => {
    await openAiSidebar(page);

    // 닫기 버튼으로 사이드바 닫기
    await closeAiSidebar(page, {
      method: 'button',
      verifyClose: true,
    });

    // 사이드바가 닫혔는지 확인
    const sidebar = page.locator('[data-testid="ai-sidebar"]');
    const isHidden = await sidebar.isHidden().catch(() => true);

    expect(isHidden).toBe(true);

    console.log('✅ closeAiSidebar (버튼) 정상 작동');
  });

  test('전체 플로우: 메시지 전송 → 응답 확인 → 사이드바 닫기', async ({
    page,
  }) => {
    // 1. AI 사이드바 열기
    await openAiSidebar(page);

    // 2. 메시지 전송 및 응답 대기
    const response = await submitAiMessage(page, '현재 시간을 알려주세요', {
      waitForResponse: true,
      enableMcpLogging: true,
    });

    expect(response.responseText).toBeTruthy();

    // 3. 사이드바 닫기
    await closeAiSidebar(page, { method: 'esc' });

    console.log('✅ 전체 플로우 정상 작동:', {
      step1: 'AI 사이드바 열기',
      step2: `메시지 전송 (응답 시간: ${response.responseTime}ms)`,
      step3: '사이드바 닫기',
    });
  });
});
