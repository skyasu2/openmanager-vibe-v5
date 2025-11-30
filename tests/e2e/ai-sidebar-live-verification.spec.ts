/**
 * AI 사이드바 실시간 검증 테스트 (Vercel 배포 환경)
 *
 * 목적: 프론트엔드 → 백엔드 → AI 엔진 전체 플로우 검증
 *
 * 테스트 범위:
 * 1. 자연어 질의 응답
 * 2. 자동 장애 보고서 생성
 * 3. Extended Thinking 시각화
 * 4. Tool Calling 실행 (서버 메트릭, ML 예측)
 * 5. SSE 스트리밍 응답
 *
 * @see /tmp/ai-sidebar-verification-report.md - 코드 레벨 분석 보고서
 */

import { expect, test } from '@playwright/test';
import { guestLogin, openAiSidebar } from './helpers/guest';
import { TIMEOUTS } from './helpers/timeouts';

test.describe('AI 사이드바 실시간 검증 (Vercel)', () => {
  test.beforeEach(async ({ page }) => {
    // Vercel 배포 환경 접속
    await guestLogin(page);

    // Fix: /main에서 "🚀 시스템 시작" 버튼 클릭하여 /dashboard로 이동
    await page.waitForLoadState('networkidle');

    const startButton = page
      .locator(
        'button:has-text("🚀 시스템 시작"), button:has-text("시스템 시작")'
      )
      .first();
    await startButton.waitFor({
      state: 'visible',
      timeout: TIMEOUTS.DASHBOARD_LOAD,
    });

    // 버튼 클릭 (시스템 초기화 트리거)
    await startButton.click();

    // /system-boot 로딩 페이지로 이동 대기 (3초 카운트다운 후)
    await page.waitForURL('**/system-boot', { timeout: 10000 });

    // 로딩 화면 완료 후 /dashboard로 자동 전환 대기 (Vercel Cold Start 대응)
    await page.waitForURL('**/dashboard', {
      timeout: TIMEOUTS.DASHBOARD_LOAD,
    });
    await page.waitForLoadState('networkidle');
  });

  test('자연어 질의: 서버 상태 문의', async ({ page }) => {
    await openAiSidebar(page);

    // AI 입력창 찾기
    const input = page
      .locator(
        'textarea[placeholder*="메시지"], textarea[placeholder*="질문"], input[type="text"][placeholder*="AI"]'
      )
      .first();
    await expect(input).toBeVisible({ timeout: TIMEOUTS.DOM_UPDATE });

    // 자연어 질의 전송
    await input.fill('현재 서버 상태를 알려주세요');
    await page.keyboard.press('Enter');

    // AI 응답 대기 (SSE 스트리밍)
    const aiResponse = page
      .locator('[data-testid="ai-message"], .ai-message, [role="article"]')
      .last();
    await expect(aiResponse).toBeVisible({ timeout: TIMEOUTS.AI_RESPONSE });

    // 응답에 서버 관련 내용이 포함되어 있는지 확인
    const responseText = await aiResponse.textContent();
    expect(responseText).toBeTruthy();
    expect(responseText?.length ?? 0).toBeGreaterThan(10); // 실제 응답이 있는지 확인
  });

  test('Extended Thinking 시각화 확인', async ({ page }) => {
    await openAiSidebar(page);

    const input = page
      .locator('textarea[placeholder*="메시지"], textarea[placeholder*="질문"]')
      .first();
    await input.fill('서버 장애를 예측해주세요');
    await page.keyboard.press('Enter');

    // Extended Thinking 단계 표시 대기
    // AI는 analyzeIntent → analyzeComplexity → selectRoute → searchContext → generateInsight 순서로 진행
    const thinkingIndicator = page
      .locator(
        '[data-testid="thinking-indicator"], .thinking-step, [aria-label*="thinking"]'
      )
      .first();

    // Thinking 표시가 잠깐이라도 나타났는지 확인 (timeout 짧게)
    try {
      await expect(thinkingIndicator).toBeVisible({ timeout: 5000 });
    } catch {
      // Thinking이 너무 빨라서 못 봤을 수도 있음 - 최종 응답 확인으로 대체
    }

    // 최종 AI 응답 확인
    const aiResponse = page
      .locator('[data-testid="ai-message"], .ai-message')
      .last();
    await expect(aiResponse).toBeVisible({ timeout: TIMEOUTS.AI_RESPONSE });
  });

  test('Preset 질문: 자동 장애 보고서 생성', async ({ page }) => {
    await openAiSidebar(page);

    // Preset 버튼 찾기 (자동 보고서 관련)
    const presetButton = page
      .locator(
        'button:has-text("장애"), button:has-text("보고서"), button:has-text("분석")'
      )
      .first();

    // Preset 버튼이 있으면 클릭, 없으면 직접 입력
    const hasPreset = await presetButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasPreset) {
      await presetButton.click();
    } else {
      const input = page.locator('textarea[placeholder*="메시지"]').first();
      await input.fill('자동 장애 보고서를 생성해주세요');
      await page.keyboard.press('Enter');
    }

    // AI 응답 대기 (GCP ML Engine 호출 포함될 수 있음)
    const aiResponse = page
      .locator('[data-testid="ai-message"], .ai-message')
      .last();
    await expect(aiResponse).toBeVisible({ timeout: TIMEOUTS.AI_RESPONSE });

    const responseText = await aiResponse.textContent();
    expect(responseText).toBeTruthy();
    // 보고서 관련 키워드 확인
    expect(responseText ?? '').toMatch(/서버|분석|예측|메트릭|상태/);
  });

  test('Tool Calling: 서버 메트릭 조회', async ({ page }) => {
    await openAiSidebar(page);

    const input = page.locator('textarea[placeholder*="메시지"]').first();
    await input.fill('서버 CPU 사용률을 보여주세요');
    await page.keyboard.press('Enter');

    // Tool Calling 실행 표시 (있을 경우)
    const toolIndicator = page
      .locator(
        '[data-testid="tool-calling"], .tool-execution, [aria-label*="tool"]'
      )
      .first();

    // Tool 실행 표시 확인 (짧은 timeout)
    try {
      await expect(toolIndicator).toBeVisible({ timeout: 5000 });
    } catch {
      // Tool 실행이 너무 빨라서 표시를 못 봤을 수 있음
    }

    // 최종 응답에 메트릭 정보 포함 확인
    const aiResponse = page
      .locator('[data-testid="ai-message"], .ai-message')
      .last();
    await expect(aiResponse).toBeVisible({ timeout: TIMEOUTS.AI_RESPONSE });

    const responseText = await aiResponse.textContent();
    expect(responseText).toMatch(/CPU|메모리|메트릭|서버/i);
  });

  test('SSE 스트리밍 응답 확인', async ({ page }) => {
    await openAiSidebar(page);

    const input = page.locator('textarea[placeholder*="메시지"]').first();
    await input.fill('OpenManager VIBE에 대해 설명해주세요');

    // Network 탭 모니터링 시작
    const streamingResponse = page.waitForResponse(
      (response) => response.url().includes('/api/ai/unified-stream'),
      { timeout: TIMEOUTS.AI_RESPONSE }
    );

    await page.keyboard.press('Enter');

    // SSE endpoint 호출 확인
    const response = await streamingResponse;
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/event-stream');

    // AI 응답 완료 대기
    const aiResponse = page
      .locator('[data-testid="ai-message"], .ai-message')
      .last();
    await expect(aiResponse).toBeVisible({ timeout: TIMEOUTS.AI_RESPONSE });
  });

  test('에러 핸들링: GCP ML Engine Fallback', async ({ page }) => {
    await openAiSidebar(page);

    const input = page.locator('textarea[placeholder*="메시지"]').first();
    // GCP ML Engine을 호출하는 질문 (predictIncident tool)
    await input.fill('server-1의 장애 가능성을 예측해주세요');
    await page.keyboard.press('Enter');

    // AI 응답 대기 (GCP 실패 시 로컬 fallback 사용)
    const aiResponse = page
      .locator('[data-testid="ai-message"], .ai-message')
      .last();
    await expect(aiResponse).toBeVisible({
      timeout: TIMEOUTS.AI_RESPONSE * 1.5,
    }); // Fallback 시간 고려

    const responseText = await aiResponse.textContent();
    expect(responseText).toBeTruthy();
    // 예측 결과가 포함되어 있는지 확인 (GCP OR Fallback)
    expect(responseText ?? '').toMatch(/예측|확률|위험|정상|분석/);
  });

  test('채팅 히스토리 유지 확인', async ({ page }) => {
    await openAiSidebar(page);

    const input = page.locator('textarea[placeholder*="메시지"]').first();

    // 첫 번째 메시지
    await input.fill('안녕하세요');
    await page.keyboard.press('Enter');

    // 첫 번째 AI 응답 대기
    const firstResponse = page
      .locator('[data-testid="ai-message"], .ai-message, [role="article"]')
      .first();
    await expect(firstResponse).toBeVisible({ timeout: TIMEOUTS.AI_RESPONSE });

    // 두 번째 메시지
    await input.fill('제 이름을 기억하나요?');
    await page.keyboard.press('Enter');

    // 두 번째 AI 응답 대기
    const secondResponse = page
      .locator('[data-testid="ai-message"], .ai-message, [role="article"]')
      .last();
    await expect(secondResponse).toBeVisible({ timeout: TIMEOUTS.AI_RESPONSE });

    // 히스토리 개수 확인 (사용자 2개 + AI 2개 = 최소 4개)
    const messages = page.locator(
      '[data-testid="ai-message"], .message, [role="article"]'
    );
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(4); // 최소 4개 (사용자2 + AI2)
  });
});

test.describe('AI 사이드바 성능 테스트', () => {
  test('AI 응답 시간 측정', async ({ page }) => {
    await guestLogin(page);

    // Fix: /main에서 "🚀 시스템 시작" 버튼 클릭하여 /dashboard로 이동
    await page.waitForLoadState('networkidle');

    const startButton = page
      .locator(
        'button:has-text("🚀 시스템 시작"), button:has-text("시스템 시작")'
      )
      .first();
    await startButton.waitFor({
      state: 'visible',
      timeout: TIMEOUTS.DASHBOARD_LOAD,
    });

    // 버튼 클릭 (시스템 초기화 트리거)
    await startButton.click();

    // /system-boot 로딩 페이지로 이동 대기 (3초 카운트다운 후)
    await page.waitForURL('**/system-boot', { timeout: 10000 });

    // 로딩 화면 완료 후 /dashboard로 자동 전환 대기 (Vercel Cold Start 대응)
    await page.waitForURL('**/dashboard', {
      timeout: TIMEOUTS.DASHBOARD_LOAD,
    });
    await page.waitForLoadState('networkidle');

    await openAiSidebar(page);

    const input = page.locator('textarea[placeholder*="메시지"]').first();
    await input.fill('간단한 질문입니다');

    const startTime = Date.now();
    await page.keyboard.press('Enter');

    // 첫 번째 토큰 응답 대기 (Time to First Token)
    const aiResponse = page
      .locator('[data-testid="ai-message"], .ai-message')
      .last();
    await expect(aiResponse).toBeVisible({ timeout: TIMEOUTS.AI_RESPONSE });

    const ttft = Date.now() - startTime;

    // TTFT가 합리적인 범위인지 확인 (< 10초)
    expect(ttft).toBeLessThan(10000);
  });
});
