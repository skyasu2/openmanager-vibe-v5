/**
 * 🧪 AI 사이드바 입력 검증 테스트
 *
 * ⚠️ 주의: 하루 2-3번 수동 실행 권장 (Vercel 무료 티어 고려)
 *
 * 🎯 목적:
 * - AI 사이드바 입력 필드 유효성 검증
 * - 엣지 케이스 및 에러 핸들링 확인
 * - 사용자 입력 제약사항 검증
 *
 * 📊 Vercel 부하:
 * - 테스트 수: 6개
 * - AI 쿼리: 2개 (실제 API 호출이 필요한 테스트만)
 * - 예상 요청: 총 2-3회 (매우 적음)
 * - 실행 시간: ~2-3분
 *
 * 🚀 실행 방법:
 * ```bash
 * npx playwright test tests/e2e/ai-input-validation.spec.ts --project=chromium
 * ```
 */

import { test, expect } from '@playwright/test';
import { submitAiMessage } from './helpers/ai-interaction';
import { guestLogin, openAiSidebar } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

test.describe('AI 사이드바 입력 검증 (하루 2-3회 수동 실행)', () => {
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

  test('1. 빈 메시지 전송 방지 검증', async ({ page }) => {
    // 입력 필드 찾기
    const inputSelectors = [
      'textarea[placeholder*="질문"]',
      'textarea[placeholder*="메시지"]',
      'textarea[name="message"]',
      'input[type="text"][placeholder*="질문"]',
    ];

    let inputField = null;
    for (const selector of inputSelectors) {
      const candidate = page.locator(selector).first();
      const isVisible = await candidate
        .isVisible({ timeout: TIMEOUTS.DOM_UPDATE })
        .catch(() => false);
      if (isVisible) {
        inputField = candidate;
        break;
      }
    }

    expect(inputField).not.toBeNull();

    // 제출 버튼 찾기
    const submitButton = page.locator('button[type="submit"]').first();
    expect(await submitButton.isVisible()).toBe(true);

    // 빈 입력 상태에서 버튼 비활성화 확인
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);

    // 공백만 입력했을 때도 버튼 비활성화 확인
    if (inputField) {
      await inputField.fill('   ');
      await page.waitForTimeout(500);
      const stillDisabled = await submitButton.isDisabled();
      expect(stillDisabled).toBe(true);
    }
  });

  test('2. 최대 길이 제한 검증 (10,000자)', async ({ page }) => {
    const inputField = page.locator('textarea[placeholder*="질문"]').first();
    expect(await inputField.isVisible()).toBe(true);

    // 10,001자 입력 시도 (제한 초과)
    const longMessage = 'a'.repeat(10001);
    await inputField.fill(longMessage);

    // 실제 입력된 값 확인 (최대 10,000자로 제한되어야 함)
    const actualValue = await inputField.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(10000);
  });

  test('3. 특수문자 입력 처리 검증', async ({ page }) => {
    // 특수문자가 포함된 메시지 (Vercel 요청 1회)
    const specialCharsMessage =
      '특수문자 테스트: <script>alert("XSS")</script> & "quotes" \' {curly} [brackets]';

    const response = await submitAiMessage(page, specialCharsMessage, {
      waitForResponse: true,
      responseTimeout: TIMEOUTS.AI_RESPONSE,
    });

    // AI가 정상적으로 응답했는지 확인
    expect(response.responseText).toBeTruthy();
    expect(response.responseTime).toBeGreaterThan(0);

    // XSS 방어 확인: <script> 태그가 실행되지 않았는지 확인
    const scriptElements = await page.$$('script');
    const hasInjectedScript = scriptElements.some(async (script) => {
      const textContent = await script.textContent();
      return textContent?.includes('alert("XSS")');
    });
    expect(hasInjectedScript).toBe(false);
  });

  test('4. 연속 메시지 전송 제한 검증', async ({ page }) => {
    // 첫 번째 메시지 전송 (Vercel 요청 1회)
    await submitAiMessage(page, '첫 번째 메시지', {
      waitForResponse: false, // 응답 대기 안 함
    });

    // 즉시 두 번째 메시지 전송 시도 (버튼이 비활성화되어야 함)
    await page.waitForTimeout(100);

    const submitButton = page.locator('button[type="submit"]').first();
    const isDisabledDuringProcessing = await submitButton.isDisabled();

    // AI 응답 처리 중에는 버튼이 비활성화되어야 함
    expect(isDisabledDuringProcessing).toBe(true);

    // 응답 완료 후 버튼이 다시 활성화되는지 확인
    await page.waitForTimeout(TIMEOUTS.AI_RESPONSE);
    const isEnabledAfterResponse = await submitButton.isEnabled();
    expect(isEnabledAfterResponse).toBe(true);
  });

  test('5. Enter 키 전송 동작 확인', async ({ page }) => {
    const inputField = page.locator('textarea[placeholder*="질문"]').first();
    expect(await inputField.isVisible()).toBe(true);

    // 메시지 입력
    await inputField.fill('Enter 키 테스트');

    // Enter 키로 전송 (Shift+Enter는 줄바꿈, Enter만은 전송)
    await inputField.press('Enter');

    // 전송 후 입력 필드가 비워졌는지 확인
    await page.waitForTimeout(500);
    const inputValue = await inputField.inputValue();
    expect(inputValue).toBe('');
  });

  test('6. Shift+Enter 줄바꿈 동작 확인', async ({ page }) => {
    const inputField = page.locator('textarea[placeholder*="질문"]').first();
    expect(await inputField.isVisible()).toBe(true);

    // 첫 번째 줄 입력
    await inputField.fill('첫 번째 줄');

    // Shift+Enter로 줄바꿈
    await inputField.press('Shift+Enter');

    // 두 번째 줄 입력
    await inputField.press('Control+End'); // 커서를 끝으로 이동
    await inputField.type('두 번째 줄');

    // 입력 필드 값 확인 (줄바꿈이 포함되어야 함)
    const inputValue = await inputField.inputValue();
    expect(inputValue).toContain('\n');
    expect(inputValue).toContain('첫 번째 줄');
    expect(inputValue).toContain('두 번째 줄');

    // 메시지가 전송되지 않았는지 확인 (입력 필드가 비워지지 않음)
    expect(inputValue).not.toBe('');
  });
});
