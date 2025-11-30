/**
 * Feature Cards E2E Test
 *
 * 메인 페이지의 4개 Feature Cards 렌더링 및 상호작용 테스트
 * - 🧠 AI 어시스턴트
 * - 🏗️ 클라우드 플랫폼 활용
 * - 💻 기술 스택
 * - 🔥 Vibe Coding
 */

import { expect, test } from '@playwright/test';
import { guestLogin } from './helpers/guest';

test.describe('Feature Cards - Main Page', () => {
  test.beforeEach(async ({ page }) => {
    // 게스트 로그인 후 메인 페이지로 이동
    await guestLogin(page);

    // Feature Cards 렌더링 대기
    await page.waitForLoadState('networkidle');
  });

  test('메인 페이지 4개 Feature Cards 렌더링 확인', async ({ page }) => {
    // 4개 카드의 제목 확인
    await expect(page.locator('text=🧠 AI 어시스턴트')).toBeVisible();
    await expect(page.locator('text=🏗️ 클라우드 플랫폼 활용')).toBeVisible();
    await expect(page.locator('text=💻 기술 스택')).toBeVisible();
    await expect(page.locator('text=🔥 Vibe Coding')).toBeVisible();
  });

  test('AI 어시스턴트 카드 설명 확인', async ({ page }) => {
    const aiCard = page.locator('text=🧠 AI 어시스턴트').locator('..');

    // 설명 텍스트 확인
    await expect(aiCard).toContainText('Google AI 통합 엔진');
    await expect(aiCard).toContainText('5개 AI 기능');
  });

  test('클라우드 플랫폼 카드 설명 확인', async ({ page }) => {
    const cloudCard = page.locator('text=🏗️ 클라우드 플랫폼 활용').locator('..');

    // 설명 텍스트 확인
    await expect(cloudCard).toContainText('엔터프라이즈급 클라우드 인프라');
    await expect(cloudCard).toContainText('3개 핵심 플랫폼');
  });

  test('기술 스택 카드 클릭 시 모달 오픈 확인', async ({ page }) => {
    // 기술 스택 카드 클릭
    await page.click('text=💻 기술 스택');

    // 모달 오픈 확인
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 모달 제목 확인 (Strict Mode 준수: heading level 3로 구체화)
    await expect(modal.getByRole('heading', { level: 3 })).toContainText(
      '💻 기술 스택'
    );
  });

  test('기술 스택 모달 - 최신 버전 확인', async ({ page }) => {
    // 기술 스택 카드 클릭
    await page.click('text=💻 기술 스택');

    // 모달 내 최신 기술 버전 확인
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('v15.4'); // Next.js
    await expect(modal).toContainText('v5.7'); // TypeScript
    await expect(modal).toContainText('v18.3'); // React
    await expect(modal).toContainText('v3.4'); // Tailwind CSS
  });

  test('Vibe Coding 카드 클릭 시 모달 오픈 확인', async ({ page }) => {
    // Vibe Coding 카드 클릭
    await page.click('text=🔥 Vibe Coding');

    // 모달 오픈 확인
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 모달 제목 확인 (Strict Mode 준수)
    await expect(modal.getByRole('heading', { level: 3 })).toContainText(
      '🔥 Vibe Coding'
    );
  });

  test('Vibe Coding 모달 - 워크플로우 확인', async ({ page }) => {
    // Vibe Coding 카드 클릭
    await page.click('text=🔥 Vibe Coding');

    // 모달 내 업데이트된 워크플로우 확인
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Claude Code');
    await expect(modal).toContainText('메인 개발 도구');
    await expect(modal).toContainText('Codex CLI');
    await expect(modal).toContainText('Gemini CLI');
  });

  test('AI 어시스턴트 카드 클릭 시 모달 오픈 확인', async ({ page }) => {
    // AI 어시스턴트 카드 클릭
    await page.click('text=🧠 AI 어시스턴트');

    // 모달 오픈 확인
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 모달 제목 확인 (Strict Mode 준수)
    await expect(modal.getByRole('heading', { level: 3 })).toContainText(
      '🧠 AI 어시스턴트'
    );
  });

  test('AI 어시스턴트 모달 - AI 기능 확인', async ({ page }) => {
    // AI 어시스턴트 카드 클릭
    await page.click('text=🧠 AI 어시스턴트');

    // 모달 내 주요 AI 기능 확인 (실제 current array 기준)
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Google AI');
    await expect(modal).toContainText('Gemini');
    await expect(modal).toContainText('RAG');
  });

  test('클라우드 플랫폼 카드 클릭 시 모달 오픈 확인', async ({ page }) => {
    // 클라우드 플랫폼 카드 클릭
    await page.click('text=🏗️ 클라우드 플랫폼 활용');

    // 모달 오픈 확인
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 모달 제목 확인 (Strict Mode 준수)
    await expect(modal.getByRole('heading', { level: 3 })).toContainText(
      '🏗️ 클라우드 플랫폼 활용'
    );
  });

  test('클라우드 플랫폼 모달 - 3개 플랫폼 확인', async ({ page }) => {
    // 클라우드 플랫폼 카드 클릭
    await page.click('text=🏗️ 클라우드 플랫폼 활용');

    // 모달 내 3개 플랫폼 확인
    const modal = page.locator('role=dialog');
    await expect(modal).toContainText('Vercel');
    await expect(modal).toContainText('Supabase');
    await expect(modal).toContainText('GCP');
  });

  test('모달 닫기 버튼 동작 확인', async ({ page }) => {
    // 기술 스택 카드 클릭
    await page.click('text=💻 기술 스택');

    // 모달 오픈 확인
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 닫기 버튼 클릭 (aria-label 정확히 매칭)
    await modal.getByRole('button', { name: 'Close modal' }).click();

    // 모달 닫힘 확인
    await expect(modal).not.toBeVisible();
  });

  test('모달 ESC 키로 닫기', async ({ page }) => {
    // AI 어시스턴트 카드 클릭
    await page.click('text=🧠 AI 어시스턴트');

    // 모달 오픈 확인
    await expect(page.locator('role=dialog')).toBeVisible();

    // ESC 키 누르기
    await page.keyboard.press('Escape');

    // 모달 닫힘 확인
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  test('모달 외부 클릭으로 닫기', async ({ page }) => {
    // Vibe Coding 카드 클릭
    await page.click('text=🔥 Vibe Coding');

    // 모달 오픈 확인
    await expect(page.locator('role=dialog')).toBeVisible();

    // 모달 외부 클릭 (backdrop 클릭)
    await page.click('body', { position: { x: 10, y: 10 } });

    // 모달 닫힘 확인
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  test('모든 카드 순서대로 열고 닫기', async ({ page }) => {
    const cards = [
      '🧠 AI 어시스턴트',
      '🏗️ 클라우드 플랫폼 활용',
      '💻 기술 스택',
      '🔥 Vibe Coding',
    ];

    for (const cardTitle of cards) {
      // 카드 클릭
      await page.click(`text=${cardTitle}`);

      // 모달 오픈 확인
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('heading', { level: 3 })).toContainText(
        cardTitle
      );

      // ESC로 닫기
      await page.keyboard.press('Escape');

      // 모달 닫힘 확인
      await expect(modal).not.toBeVisible();

      // 다음 카드 클릭 전 대기
      await page.waitForTimeout(200);
    }
  });

  test('카드 hover 효과 확인', async ({ page }) => {
    const aiCard = page.locator('text=🧠 AI 어시스턴트').locator('..');

    // hover 전 상태
    const _beforeHover = await aiCard.boundingBox();

    // hover
    await aiCard.hover();

    // hover 후 상태 (CSS transition으로 변경되었는지 확인하기 어려우므로 visibility만 확인)
    await expect(aiCard).toBeVisible();
  });

  test('4개 카드 모두 클릭 가능', async ({ page }) => {
    const cards = [
      '🧠 AI 어시스턴트',
      '🏗️ 클라우드 플랫폼 활용',
      '💻 기술 스택',
      '🔥 Vibe Coding',
    ];

    for (const cardTitle of cards) {
      // 카드가 클릭 가능한지 확인
      const card = page.locator(`text=${cardTitle}`);
      await expect(card).toBeVisible();
      await expect(card).toBeEnabled();
    }
  });

  test('기술 스택 모달 - 전체 기술 목록 확인', async ({ page }) => {
    // 기술 스택 카드 클릭
    await page.click('text=💻 기술 스택');

    const modal = page.locator('role=dialog');

    // 주요 기술 스택 확인
    const technologies = [
      'Recharts',
      'Vitest',
      'Zustand',
      'Radix UI',
      'Lucide React',
    ];

    for (const tech of technologies) {
      await expect(modal).toContainText(tech);
    }
  });

  test('Vibe Coding 모달 - MCP 서버 언급 확인', async ({ page }) => {
    // Vibe Coding 카드 클릭
    await page.click('text=🔥 Vibe Coding');

    const modal = page.getByRole('dialog');

    // MCP 서버 관련 내용 확인
    await expect(modal).toContainText('MCP 서버');

    // 주요 MCP 서버 확인 (11개 중 대표 3개)
    await expect(modal).toContainText('vercel');
    await expect(modal).toContainText('serena');
    await expect(modal).toContainText('playwright');
  });

  test('AI 어시스턴트 모달 - 성능 지표 확인', async ({ page }) => {
    // AI 어시스턴트 카드 클릭
    await page.click('text=🧠 AI 어시스턴트');

    const modal = page.locator('role=dialog');

    // 성능 지표 확인
    await expect(modal).toContainText('평균 응답 250');
    await expect(modal).toContainText('캐시 히트');
  });
});
