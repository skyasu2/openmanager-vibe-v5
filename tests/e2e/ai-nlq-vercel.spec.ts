/**
 * 자연어 질의(NLQ) E2E 테스트 - Vercel Production
 *
 * Vercel production 환경에서 AI 사이드바를 통해 자연어 질의를 전송하고,
 * clarification 동작 및 AI 응답을 검증합니다.
 *
 * NOTE: Production 빌드에서 data-testid가 strip됨 → role/class/text 기반 셀렉터 사용.
 * NOTE: ClarificationDialog의 X 버튼은 dismiss(취소)이므로, 옵션 선택으로만 진행 가능.
 *
 * 실행: npm run test:vercel:e2e -- --grep @nlq
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { guestLogin, openAiSidebar } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

/**
 * AI 사이드바에서 메시지를 입력하고 전송합니다.
 * React controlled textarea에 native setter + dispatchEvent로 값을 설정합니다.
 */
async function sendMessage(page: Page, message: string) {
  const input = page.getByRole('textbox', { name: 'AI 질문 입력' });
  await expect(input).toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });
  await input.click();

  // React controlled input에 값을 강제 설정
  await input.evaluate((el, msg) => {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(el, msg);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, message);
  await page.waitForTimeout(500);

  // 전송 버튼 클릭 시도
  const sendButton = page.getByRole('button', { name: '메시지 전송' });
  const isEnabled = await sendButton.isEnabled().catch(() => false);

  if (isEnabled) {
    await sendButton.click();
  } else {
    // fallback: Playwright fill() + Enter
    await input.fill(message);
    await page.waitForTimeout(300);
    await input.press('Enter');
  }
}

/**
 * AI 응답(assistant 메시지)이 나타날 때까지 대기합니다.
 */
async function waitForAssistantResponse(
  page: Page,
  timeout = TIMEOUTS.AI_RESPONSE
) {
  const logArea = page.locator('[role="log"]');
  await expect(logArea).toBeVisible({ timeout: TIMEOUTS.MODAL_DISPLAY });

  const assistantMessage = logArea.locator('.justify-start').last();
  await expect(assistantMessage).toBeVisible({ timeout });

  // 스트리밍 완료 대기
  let prevText = '';
  let stable = 0;
  for (let i = 0; i < 120; i++) {
    const text = (await assistantMessage.textContent()) ?? '';
    if (text === prevText && text.length > 0) {
      stable++;
      if (stable >= 3) break;
    } else {
      stable = 0;
      prevText = text;
    }
    await page.waitForTimeout(1000);
  }

  return prevText;
}

/**
 * Clarification 다이얼로그에서 첫 번째 옵션을 선택합니다.
 * clarification이 나타나지 않으면 무시하고 진행합니다.
 */
async function handleClarificationIfPresent(page: Page) {
  // clarification dismiss 버튼(X)은 취소이므로, 옵션 버튼을 찾아 클릭
  // 옵션 버튼: grid 내부 button (aria-label="명확화 취소"가 아닌 것)
  const dismissBtn = page.locator('button[aria-label="명확화 취소"]').first();
  const hasClarification = await dismissBtn
    .isVisible({ timeout: TIMEOUTS.MODAL_DISPLAY })
    .catch(() => false);

  if (!hasClarification) return false;

  // clarification 컨테이너 내의 옵션 버튼 찾기
  // 옵션은 grid 안에 있음 (dismiss, 직접 입력하기 제외)
  const clarificationContainer = dismissBtn.locator('..').locator('..');
  const optionButtons = clarificationContainer.locator(
    'button:not([aria-label="명확화 취소"]):not(:has-text("직접 입력하기"))'
  );
  const optionCount = await optionButtons.count();

  if (optionCount > 0) {
    await optionButtons.first().click();
    return true;
  }

  // 옵션이 없으면 dismiss (취소)
  await dismissBtn.click();
  return false;
}

test.describe('자연어 질의 E2E (Vercel)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TIMEOUTS.AI_QUERY);
    await guestLogin(page);
    await page.waitForLoadState('networkidle');

    // 시스템 시작 버튼 클릭 → 대시보드 이동
    const startButton = page
      .locator(
        'button:has-text("🚀 시스템 시작"), button:has-text("시스템 시작")'
      )
      .first();
    const hasStartButton = await startButton
      .isVisible({ timeout: TIMEOUTS.MODAL_DISPLAY })
      .catch(() => false);

    if (hasStartButton) {
      await startButton.click();
      await page.waitForURL('**/dashboard**', {
        timeout: TIMEOUTS.NETWORK_REQUEST,
      });
    } else {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    }

    await page.waitForLoadState('networkidle');
    await openAiSidebar(page);
  });

  test(
    '구체적 쿼리 - clarification 스킵하고 AI 응답 수신',
    {
      tag: ['@ai-test', '@nlq'],
    },
    async ({ page }) => {
      await sendMessage(page, 'MySQL 서버 CPU 92% 대응방안');

      // clarification 미발생 확인 (3초 대기)
      await page.waitForTimeout(3000);
      const clarification = page.locator('button[aria-label="명확화 취소"]');
      expect(await clarification.count()).toBe(0);

      // AI 응답 수신
      const responseText = await waitForAssistantResponse(page);
      expect(responseText.length).toBeGreaterThan(20);
    }
  );

  test(
    '모호한 쿼리 - clarification 옵션 선택 후 AI 응답',
    {
      tag: ['@ai-test', '@nlq'],
    },
    async ({ page }) => {
      await sendMessage(page, '현재 전체 서버 상태를 요약해줘');

      // clarification이 나타나면 첫 번째 옵션 선택
      await handleClarificationIfPresent(page);

      // AI 응답 수신
      const responseText = await waitForAssistantResponse(page);
      expect(responseText.length).toBeGreaterThan(0);
    }
  );

  test(
    '모호한 쿼리 - 직접 입력으로 clarification 해소',
    {
      tag: ['@ai-test', '@nlq'],
    },
    async ({ page }) => {
      await sendMessage(page, '현재 전체 서버 상태를 요약해줘');

      // clarification이 나타나면 커스텀 입력 필드에 구체적 정보 입력
      const dismissBtn = page
        .locator('button[aria-label="명확화 취소"]')
        .first();
      const hasClarification = await dismissBtn
        .isVisible({ timeout: TIMEOUTS.MODAL_DISPLAY })
        .catch(() => false);

      if (hasClarification) {
        // 커스텀 입력 필드 (항상 표시됨)
        const customInput = page.getByPlaceholder('추가 정보를 입력하세요');
        const hasInput = await customInput
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        if (hasInput) {
          await customInput.fill('CPU와 메모리 사용률 중심으로');
          await page.waitForTimeout(300);
          // "확인" 버튼 클릭 (clarification 컨테이너 내)
          const confirmBtn = page.getByRole('button', { name: '확인' });
          await confirmBtn.click();
        } else {
          // fallback: 첫 번째 옵션 선택
          await handleClarificationIfPresent(page);
        }
      }

      // AI 응답 수신
      const responseText = await waitForAssistantResponse(page);
      expect(responseText.length).toBeGreaterThan(0);
    }
  );

  test(
    '제품명 포함 쿼리 - nginx',
    {
      tag: ['@ai-test', '@nlq'],
    },
    async ({ page }) => {
      await sendMessage(page, 'nginx 서버 상태 확인해줘');

      // clarification 미발생 확인
      await page.waitForTimeout(3000);
      const clarification = page.locator('button[aria-label="명확화 취소"]');
      expect(await clarification.count()).toBe(0);

      // AI 응답 수신
      const responseText = await waitForAssistantResponse(page);
      expect(responseText.length).toBeGreaterThan(20);
    }
  );
});
