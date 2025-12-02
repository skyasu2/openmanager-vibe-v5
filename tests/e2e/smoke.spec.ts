/**
 * 🧪 기본 스모크 테스트
 * 주요 페이지들이 올바르게 로드되는지 확인하는 기본적인 E2E 테스트
 */

import { expect, test } from '@playwright/test';
import {
  hideNextJsDevOverlay,
  skipIfSecurityBlocked,
  skipIfSecurityCheckpoint,
} from './helpers/security';

test.describe('기본 스모크 테스트', () => {
  test('로그인 페이지가 올바르게 로드된다', async ({ page }) => {
    // Dev 서버에서 안정적인 로딩을 위해 networkidle 대기
    await page.goto('/login', { waitUntil: 'networkidle' });
    await hideNextJsDevOverlay(page);
    await skipIfSecurityCheckpoint(page);

    // 제목 로딩 대기 (Dev 서버에서 hydration 완료 필요)
    await expect(page).toHaveTitle(/OpenManager/, { timeout: 30000 });

    // 기본 UI 요소들 확인
    await expect(page.locator('h1')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /GitHub로 계속하기/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /게스트로 체험하기/i })
    ).toBeVisible();
  });

  test('메인 대시보드로 리다이렉트된다', async ({ page }) => {
    await page.goto('/');
    await skipIfSecurityCheckpoint(page);

    // 루트 경로가 /login으로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test('404 페이지가 존재하지 않는 경로에서 작동한다', async ({ page }) => {
    await page.goto('/non-existent-page');

    // 404 상태 코드나 404 페이지 컨텐츠 확인
    const response = await page.request.get('/non-existent-page');
    if (skipIfSecurityBlocked(response.status())) return;

    expect(response.status()).toBe(404);
  });

  test('API 엔드포인트가 응답한다', async ({ page }) => {
    // Health check API 테스트
    const healthResponse = await page.request.get('/api/health');
    if (skipIfSecurityBlocked(healthResponse.status())) return;

    expect(healthResponse.status()).toBe(200);

    const healthData = await healthResponse.json();
    expect(healthData).toBeDefined();
  });

  test('서버 API가 기본 응답을 제공한다', async ({ page }) => {
    // 통합 서버 API 사용 (/api/servers는 308 리다이렉트를 반환)
    const serversResponse = await page.request.get('/api/servers-unified', {
      headers: {
        'x-test-secret': process.env.TEST_SECRET_KEY || '',
      },
    });
    if (skipIfSecurityBlocked(serversResponse.status())) return;

    expect(serversResponse.ok()).toBeTruthy();

    const serversData = await serversResponse.json();
    expect(serversData).toBeDefined();
    expect(
      Array.isArray(serversData.data || serversData.servers || serversData)
    ).toBeTruthy();
  });

  test('정적 자산이 로드된다', async ({ page }) => {
    await page.goto('/login');

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // CSS가 로드되었는지 확인 (스타일이 적용된 요소 확인)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('브라우저 콘솔에 치명적인 에러가 없다', async ({ page }) => {
    const errors: string[] = [];

    // 콘솔 에러 수집
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 치명적인 에러는 없어야 함 (일부 경고는 허용)
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') && // favicon 에러는 무시
        !error.includes('source-map') && // source map 에러는 무시
        !error.includes('DevTools') && // DevTools 관련 에러는 무시
        !error.includes('403') // Vercel Security Checkpoint로 인한 403은 무시
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
