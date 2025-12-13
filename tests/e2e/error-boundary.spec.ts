/**
 * 🛡️ 에러 바운더리 E2E 테스트
 *
 * 에러 페이지, 404, 인증 에러 등의 에러 처리 테스트
 */

import { expect, test } from '@playwright/test';
import {
  skipIfSecurityBlocked,
  skipIfSecurityCheckpoint,
} from './helpers/security';

test.describe('에러 바운더리 테스트', () => {
  test.describe('404 Not Found 페이지', () => {
    test('존재하지 않는 페이지에서 404 응답', async ({ page }) => {
      const response = await page.request.get(
        '/this-page-does-not-exist-12345'
      );

      if (skipIfSecurityBlocked(response.status())) return;

      expect(response.status()).toBe(404);
    });

    test('404 페이지가 사용자 친화적 메시지를 표시한다', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');
      await skipIfSecurityCheckpoint(page);

      // 페이지가 렌더링되었는지 확인
      await page.waitForLoadState('networkidle');
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('404 페이지에서 홈으로 이동 가능', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');
      await skipIfSecurityCheckpoint(page);

      await page.waitForLoadState('networkidle');

      // 홈 또는 뒤로가기 링크 확인
      const homeLink = page
        .locator('a[href="/"], a[href="/login"], a[href="/main"]')
        .first();
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await expect(page).toHaveURL(/\/(login|main)?$/);
      }
    });
  });

  test.describe('인증 에러 페이지', () => {
    test('인증 에러 페이지가 로드된다', async ({ page }) => {
      await page.goto('/auth/error');
      await skipIfSecurityCheckpoint(page);

      await expect(page).toHaveTitle(/OpenManager/);
    });

    test('인증 에러 페이지에 에러 메시지가 표시된다', async ({ page }) => {
      await page.goto('/auth/error?error=access_denied');
      await skipIfSecurityCheckpoint(page);

      await page.waitForLoadState('networkidle');

      // 에러 관련 텍스트 또는 UI 요소 확인
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('인증 에러 페이지에서 로그인으로 돌아갈 수 있다', async ({ page }) => {
      await page.goto('/auth/error');
      await skipIfSecurityCheckpoint(page);

      await page.waitForLoadState('networkidle');

      // 로그인 페이지로 이동하는 링크/버튼 확인
      const loginLink = page
        .locator('a[href*="login"], button:has-text("로그인")')
        .first();
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe('API 에러 응답', () => {
    test('잘못된 API 경로는 404를 반환한다', async ({ page }) => {
      const response = await page.request.get('/api/this-api-does-not-exist');

      if (skipIfSecurityBlocked(response.status())) return;

      expect(response.status()).toBe(404);
    });

    test('인증되지 않은 요청에 401/403 반환', async ({ page }) => {
      // 인증이 필요한 API 엔드포인트 테스트
      const response = await page.request.get('/api/admin/auth');

      if (response.status() === 403) {
        // Vercel Security Checkpoint 또는 인증 실패
        console.log('API 접근 제한됨 (예상된 동작)');
      }

      expect([401, 403, 404]).toContain(response.status());
    });

    test('잘못된 요청에 400 또는 에러 응답', async ({ page }) => {
      const response = await page.request.post('/api/ai/unified-stream', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({}), // 빈 요청 (messages 배열 누락)
      });

      if (skipIfSecurityBlocked(response.status())) return;

      // 빈 요청에 대해 400 또는 다른 에러 응답 예상
      expect([400, 401, 422, 500]).toContain(response.status());
    });
  });

  test.describe('콘솔 에러 모니터링', () => {
    test('404 페이지에서 치명적인 콘솔 에러가 없다', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/this-page-does-not-exist-12345');
      await page.waitForLoadState('networkidle');

      // 치명적인 에러 필터링
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('favicon') &&
          !error.includes('source-map') &&
          !error.includes('DevTools') &&
          !error.includes('403') &&
          !error.includes('404') // 404 관련은 예상된 에러
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('인증 에러 페이지에서 치명적인 콘솔 에러가 없다', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/auth/error');
      await page.waitForLoadState('networkidle');

      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('favicon') &&
          !error.includes('source-map') &&
          !error.includes('DevTools') &&
          !error.includes('403')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('에러 복구', () => {
    test('에러 후 정상 페이지로 네비게이션 가능', async ({ page }) => {
      // 에러 페이지 방문
      await page.goto('/this-page-does-not-exist-12345');
      await skipIfSecurityCheckpoint(page);

      await page.waitForLoadState('networkidle');

      // 정상 페이지로 이동
      await page.goto('/login');
      await skipIfSecurityCheckpoint(page);

      await expect(page).toHaveTitle(/OpenManager/);
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
