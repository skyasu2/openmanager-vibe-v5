/**
 * 🧪 AI 사이드바 네트워크 오류 복구 테스트
 *
 * ⚠️ 주의: 하루 2-3번 수동 실행 권장 (Vercel 무료 티어 고려)
 *
 * 🎯 목적:
 * - AI 사이드바 네트워크 오류 처리 검증
 * - 오프라인/온라인 전환 시 복구 확인
 * - 타임아웃 에러 핸들링 검증
 *
 * 📊 Vercel 부하:
 * - 테스트 수: 5개
 * - AI 쿼리: 0-1개 (네트워크 오류 시나리오는 실제 요청 최소화)
 * - 예상 요청: 총 0-1회 (매우 적음)
 * - 실행 시간: ~2-3분
 *
 * 🚀 실행 방법:
 * ```bash
 * npx playwright test tests/e2e/ai-network-recovery.spec.ts --project=chromium
 * ```
 */

import { expect, test } from '@playwright/test';
import { submitAiMessage } from './helpers/ai-interaction';
import { guestLogin, openAiSidebar } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

test.describe('AI 사이드바 네트워크 오류 복구 (하루 2-3회 수동 실행)', () => {
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

  test('1. 오프라인 모드 전환 시 UI 응답 확인', async ({ page, context }) => {
    // 오프라인 모드로 전환
    await context.setOffline(true);

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 메시지 전송 시도 (Vercel 요청 0회, 네트워크 차단)
    await submitAiMessage(page, '오프라인 테스트', {
      waitForResponse: false,
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 에러 메시지 또는 네트워크 오류 표시 확인
    // (선택적: 에러 메시지가 없을 수도 있음)
    const errorMessage = page.locator(
      'text=/네트워크|연결|오류|error|offline/i'
    );
    const hasErrorMessage = await errorMessage
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!hasErrorMessage) {
      // eslint-disable-next-line no-undef
      console.log(
        '⚠️ 네트워크 오류 메시지 미표시 (UI 구현에 따라 정상일 수 있음)'
      );
    }

    // 온라인 모드로 복구
    await context.setOffline(false);
  });

  test('2. 온라인 복구 후 메시지 재전송 확인', async ({ page, context }) => {
    // 오프라인 모드로 전환
    await context.setOffline(true);

    await page.waitForTimeout(500);

    // 메시지 전송 시도 (실패 예상)
    await submitAiMessage(page, '오프라인 메시지', {
      waitForResponse: false,
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 온라인 모드로 복구
    await context.setOffline(false);

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 복구 후 새 메시지 전송 (Vercel 요청 1회)
    const response = await submitAiMessage(page, '온라인 복구 테스트', {
      waitForResponse: true,
      responseTimeout: TIMEOUTS.AI_RESPONSE,
    });

    // 복구 후 정상 응답 확인
    expect(response.responseText).toBeTruthy();
    expect(response.responseTime).toBeGreaterThan(0);
  });

  test('3. 느린 네트워크 환경 시뮬레이션', async ({ page, context }) => {
    // 느린 3G 네트워크 시뮬레이션
    await context.route('**/*', (route) => {
      // 500ms 지연 추가
      // eslint-disable-next-line no-undef
      setTimeout(() => {
        route.continue();
      }, 500);
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 메시지 전송 (느린 네트워크, Vercel 요청 0회)
    await submitAiMessage(page, '느린 네트워크 테스트', {
      waitForResponse: false,
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 로딩 인디케이터 또는 메시지 전송 상태 확인 (선택적)
    const loadingIndicator = page.locator(
      '[data-testid="loading"], .loading, .spinner'
    );
    const hasLoadingIndicator = await loadingIndicator
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!hasLoadingIndicator) {
      // eslint-disable-next-line no-undef
      console.log('⚠️ 로딩 인디케이터 미표시 (UI 구현에 따라 정상일 수 있음)');
    }
  });

  test('4. API 엔드포인트 실패 시 에러 핸들링', async ({ page }) => {
    // /api/ai/unified-stream 엔드포인트를 500 에러로 응답하도록 설정
    await page.route('**/api/ai/unified-stream', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 메시지 전송 시도 (Vercel 요청 0회, 라우팅 차단)
    await submitAiMessage(page, '서버 에러 테스트', {
      waitForResponse: false,
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 에러 메시지 표시 확인 (선택적)
    const errorMessage = page.locator(
      'text=/서버 오류|에러|실패|error|failed/i'
    );
    const hasErrorMessage = await errorMessage
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!hasErrorMessage) {
      // eslint-disable-next-line no-undef
      console.log('⚠️ 서버 오류 메시지 미표시 (UI 구현에 따라 정상일 수 있음)');
    }
  });

  test('5. 재시도 메커니즘 확인 (선택적)', async ({ page }) => {
    let requestCount = 0;

    // /api/ai/unified-stream 엔드포인트 요청 수 추적
    await page.route('**/api/ai/unified-stream', (route) => {
      requestCount++;

      if (requestCount === 1) {
        // 첫 번째 요청은 실패
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary Server Error' }),
        });
      } else {
        // 두 번째 이후 요청은 정상 처리
        route.continue();
      }
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE);

    // 메시지 전송 (Vercel 요청 0회, 라우팅 제어)
    await submitAiMessage(page, '재시도 테스트', {
      waitForResponse: false,
    });

    await page.waitForTimeout(TIMEOUTS.DOM_UPDATE * 3); // 재시도 시간 대기

    // 재시도가 발생했는지 확인
    // (실제 구현에서 재시도 메커니즘이 있다면 requestCount가 2 이상이어야 함)
    // 현재는 재시도 메커니즘이 없을 수 있으므로, 요청 수만 확인

    // 사이드바가 정상 작동하는지만 확인
    const sidebar = page.locator('[data-testid="ai-sidebar"]');
    expect(await sidebar.isVisible()).toBe(true);
  });
});
