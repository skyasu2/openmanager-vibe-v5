/**
 * Feature Cards E2E 테스트
 * 메인 페이지의 4개 Feature Cards 검증
 */

import { test, expect } from '@playwright/test';
import { getTestBaseUrl } from './helpers/config';

const BASE_URL = getTestBaseUrl();

test.describe('Feature Cards 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('메인 페이지 4개 Feature Cards 렌더링', async ({ page }) => {
    // 4개 카드 제목 확인
    await expect(page.locator('text=🧠 AI 어시스턴트')).toBeVisible();
    await expect(page.locator('text=🏗️ 클라우드 플랫폼 활용')).toBeVisible();
    await expect(page.locator('text=💻 기술 스택')).toBeVisible();
    await expect(page.locator('text=🔥 Vibe Coding')).toBeVisible();
  });

  test('기술 스택 카드 - 최신 버전 확인', async ({ page }) => {
    // 기술 스택 카드 클릭
    await page.click('text=💻 기술 스택');
    
    // 모달 오픈 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 최신 버전 확인
    await expect(page.locator('text=Next.js 15.5.5')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=TypeScript 5.7.3')).toBeVisible({ timeout: 3000 });
  });

  test('Vibe Coding 카드 - 업데이트된 워크플로우 확인', async ({ page }) => {
    // Vibe Coding 카드 클릭
    await page.click('text=🔥 Vibe Coding');
    
    // 모달 오픈 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 업데이트된 워크플로우 확인
    await expect(page.locator('text=Claude Code (메인 개발)')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Codex CLI (코드 리뷰)')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Gemini CLI (코드 리뷰)')).toBeVisible({ timeout: 3000 });
  });

  test('AI 어시스턴트 카드 - 5개 기능 확인', async ({ page }) => {
    // AI 어시스턴트 카드 클릭
    await page.click('text=🧠 AI 어시스턴트');
    
    // 모달 오픈 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 5개 AI 기능 확인
    await expect(page.locator('text=자연어 질의')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=자동장애 보고서')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=이상감지/예측')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=AI 고급관리')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=무료 티어 모니터')).toBeVisible({ timeout: 3000 });
  });

  test('클라우드 플랫폼 카드 - 무료 티어 정보 확인', async ({ page }) => {
    // 클라우드 플랫폼 카드 클릭
    await page.click('text=🏗️ 클라우드 플랫폼 활용');
    
    // 모달 오픈 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 무료 티어 정보 확인
    await expect(page.locator('text=무료 티어 최적화')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=GCP Functions')).toBeVisible({ timeout: 3000 });
  });

  test('모든 카드 모달 닫기 기능', async ({ page }) => {
    // 첫 번째 카드 클릭
    await page.click('text=💻 기술 스택');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // ESC 키로 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // 모달이 닫혔는지 확인
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
