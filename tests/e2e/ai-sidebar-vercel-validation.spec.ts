/**
 * 🚀 AI 사이드바 Vercel E2E 검증 테스트
 *
 * ⚠️ 주의: 하루 2-3번 수동 실행 권장 (Vercel 무료 티어 고려)
 *
 * 🎯 목적:
 * - Vercel 프로덕션 환경에서 AI 사이드바 핵심 기능 검증
 * - 기존 헬퍼 함수 활용 (ai-interaction.ts, network-monitor.ts)
 * - 최소한의 Vercel 요청으로 최대 효과 (총 6-8회 요청)
 *
 * 🚀 실행 방법:
 * ```bash
 * # Vercel 프로덕션 환경에서 실행 (하루 2-3번 권장)
 * npx playwright test tests/e2e/ai-sidebar-vercel-validation.spec.ts --project=chromium
 * ```
 *
 * 📊 Vercel 부하:
 * - 테스트 수: 6개
 * - AI 쿼리: 6개 (각 1개)
 * - 예상 요청: 총 6-8회 (매우 적음)
 * - 실행 시간: ~3-5분
 */

import { expect, test } from '@playwright/test';
import {
  closeAiSidebar,
  submitAiMessage,
  switchAiFunction,
} from './helpers/ai-interaction';
import { guestLogin, openAiSidebar } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

test.describe('@ai-test AI 사이드바 Vercel 검증 (하루 2-3회 수동 실행)', () => {
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
  });

  test('1. 기본 AI 응답 검증 (응답 시간 측정)', async ({ page }) => {
    // AI 사이드바 열기
    await openAiSidebar(page);

    // 간단한 질문 1개 (Vercel 부하 최소화)
    const response = await submitAiMessage(page, '안녕하세요', {
      waitForResponse: true,
      responseTimeout: TIMEOUTS.AI_RESPONSE,
    });

    // 응답 검증
    expect(response.responseText).toBeTruthy();
    expect(response.responseTime).toBeGreaterThan(0);
    expect(response.responseTime).toBeLessThan(TIMEOUTS.AI_RESPONSE);
  });

  test('2. MCP 로깅 검증', async ({ page }) => {
    await openAiSidebar(page);

    // MCP 로깅 활성화
    const response = await submitAiMessage(page, '현재 시간을 알려주세요', {
      waitForResponse: true,
      enableMcpLogging: true,
    });

    // MCP 로그 검증
    expect(response.consoleLogs).toBeDefined();
    expect(response.responseText).toBeTruthy();
  });

  test('3. SSE 스트리밍 검증', async ({ page }) => {
    await openAiSidebar(page);

    // SSE 스트리밍 완료 감지
    const response = await submitAiMessage(page, '간단한 인사말을 해주세요', {
      waitForResponse: true,
      detectStreamingEnd: true,
    });

    // 스트리밍 이벤트 수 검증
    expect(response.sseEventCount).toBeDefined();
    expect(response.sseEventCount).toBeGreaterThan(0);
    expect(response.responseText).toBeTruthy();
  });

  test('4. AI 기능 전환 검증', async ({ page }) => {
    await openAiSidebar(page);

    // intelligent-monitoring으로 전환
    await switchAiFunction(page, 'intelligent-monitoring', {
      waitForUiUpdate: true,
    });

    // 전환 후 메시지 전송
    const response = await submitAiMessage(page, '서버 상태를 알려주세요', {
      waitForResponse: true,
    });

    expect(response.responseText).toBeTruthy();
  });

  test('5. 사이드바 닫기 검증 (ESC 키)', async ({ page }) => {
    await openAiSidebar(page);

    // ESC 키로 닫기
    await closeAiSidebar(page, {
      method: 'esc',
      verifyClose: true,
    });

    // 사이드바가 닫혔는지 확인
    const sidebar = page.locator('[data-testid="ai-sidebar"]');
    const isHidden = await sidebar.isHidden().catch(() => true);

    expect(isHidden).toBe(true);
  });

  test('6. 전체 플로우 검증 (열기 → 질문 → 응답 → 닫기)', async ({ page }) => {
    // 1. AI 사이드바 열기
    await openAiSidebar(page);

    // 2. 메시지 전송 및 응답 대기
    const response = await submitAiMessage(page, '오늘 날씨는 어때요?', {
      waitForResponse: true,
      enableMcpLogging: true,
      detectStreamingEnd: true,
    });

    expect(response.responseText).toBeTruthy();
    expect(response.responseTime).toBeGreaterThan(0);

    // 3. 사이드바 닫기
    await closeAiSidebar(page, { method: 'esc' });

    // 4. 닫힌 상태 확인
    const sidebar = page.locator('[data-testid="ai-sidebar"]');
    const isHidden = await sidebar.isHidden().catch(() => true);

    expect(isHidden).toBe(true);
  });
});
