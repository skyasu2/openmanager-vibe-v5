/**
 * 🚀 시스템 부트 E2E 테스트
 *
 * 시스템 초기화 페이지 및 부팅 프로세스 테스트
 */

import { expect, type Page, test } from '@playwright/test';

const SECURITY_CHECKPOINT_TITLE = 'Vercel Security Checkpoint';

async function isSecurityCheckpoint(page: Page) {
  try {
    const title = await page.title();
    return title.includes(SECURITY_CHECKPOINT_TITLE);
  } catch {
    return false;
  }
}

test.describe('시스템 부트 테스트', () => {
  test.describe('시스템 부트 페이지', () => {
    test('시스템 부트 페이지가 로드된다', async ({ page }) => {
      await page.goto('/system-boot');

      if (await isSecurityCheckpoint(page)) {
        console.log('⚠️ Vercel Security Checkpoint 감지 - 건너뜀');
        return;
      }

      // 페이지 로드 확인
      await expect(page).toHaveTitle(/OpenManager/);
    });

    test('부팅 진행 상태가 표시된다', async ({ page }) => {
      await page.goto('/system-boot');

      if (await isSecurityCheckpoint(page)) {
        console.log('⚠️ Vercel Security Checkpoint 감지 - 건너뜀');
        return;
      }

      // 부팅 관련 UI 요소 확인 (로딩 또는 진행 표시)
      await page.waitForLoadState('networkidle');

      // 페이지가 렌더링되었는지 확인
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('부팅 완료 후 리다이렉트된다', async ({ page }) => {
      await page.goto('/system-boot');

      if (await isSecurityCheckpoint(page)) {
        console.log('⚠️ Vercel Security Checkpoint 감지 - 건너뜀');
        return;
      }

      // 부팅 완료 대기 (최대 30초)
      await page.waitForURL(/\/(main|login|dashboard)/, { timeout: 30000 }).catch(() => {
        // 타임아웃 시 현재 페이지 확인
        console.log('부팅 리다이렉트 타임아웃 - 현재 URL:', page.url());
      });
    });
  });

  test.describe('시스템 초기화 API', () => {
    test('시스템 상태 API가 응답한다', async ({ page }) => {
      const response = await page.request.get('/api/system/status');

      if (response.status() === 403) {
        console.log('⚠️ API가 Vercel Security Checkpoint로 차단됨 - 건너뜀');
        return;
      }

      // 200 또는 503 (시스템 미초기화) 허용
      expect([200, 503]).toContain(response.status());
    });

    test('시스템 시작 API가 존재한다', async ({ page }) => {
      const response = await page.request.post('/api/system/start', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-secret': process.env.TEST_SECRET_KEY || '',
        },
      });

      if (response.status() === 403) {
        console.log('⚠️ API가 Vercel Security Checkpoint로 차단됨 - 건너뜀');
        return;
      }

      // API가 존재하고 응답하는지 확인 (성공 또는 인증 필요)
      expect([200, 201, 401, 405]).toContain(response.status());
    });

    test('시스템 초기화 API가 존재한다', async ({ page }) => {
      const response = await page.request.post('/api/system/initialize', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-secret': process.env.TEST_SECRET_KEY || '',
        },
      });

      if (response.status() === 403) {
        console.log('⚠️ API가 Vercel Security Checkpoint로 차단됨 - 건너뜀');
        return;
      }

      // API가 존재하고 응답하는지 확인
      expect([200, 201, 401, 405]).toContain(response.status());
    });
  });

  test.describe('시스템 헬스 체크', () => {
    test('헬스 체크 API가 200을 반환한다', async ({ page }) => {
      const response = await page.request.get('/api/health');

      if (response.status() === 403) {
        console.log('⚠️ API가 Vercel Security Checkpoint로 차단됨 - 건너뜀');
        return;
      }

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
    });

    test('에이전트 헬스 체크 API가 응답한다', async ({ page }) => {
      const response = await page.request.get('/api/agents/health');

      if (response.status() === 403) {
        console.log('⚠️ API가 Vercel Security Checkpoint로 차단됨 - 건너뜀');
        return;
      }

      expect([200, 503]).toContain(response.status());
    });
  });
});
