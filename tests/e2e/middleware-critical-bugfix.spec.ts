/**
 * 🔒 미들웨어 Critical Bug Fix 검증 테스트
 *
 * 테스트 대상:
 * 1. 환경변수 검증 (크래시 방지)
 * 2. 루트 경로(/) 랜딩 페이지 로드
 * 3. 에러 처리 (무한 루프 방지)
 * 4. 성능 영향 측정
 *
 * NOTE: 2024-12 리팩토링으로 / 경로는 랜딩 페이지를 직접 표시합니다.
 *       (이전: / → /login 리다이렉트)
 *
 * Vercel 프로덕션 환경: https://openmanager-vibe-v5.vercel.app/
 */

import { expect, test } from '@playwright/test';
import { getTestBaseUrl } from './helpers/config';
import { ensureVercelBypassCookie } from './helpers/security';
import { TIMEOUTS } from './helpers/timeouts';

const VERCEL_PRODUCTION_URL = getTestBaseUrl();

test.beforeEach(async ({ page }) => {
  await ensureVercelBypassCookie(page);
});

test.describe('🔒 미들웨어 Critical Bug Fix 검증', () => {
  test('✅ 1. 루트 경로(/) 접근 시 랜딩 페이지 로드', async ({ page }) => {
    const startTime = Date.now();

    // 루트 경로 접근
    const response = await page.goto(`${VERCEL_PRODUCTION_URL}/`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // 검증 1: 200 OK 응답 (랜딩 페이지 직접 표시)
    expect(response?.status()).toBe(200);

    // 검증 2: 랜딩 페이지 타이틀 확인
    await expect(page).toHaveTitle(/OpenManager/);

    // 검증 3: 응답 시간이 합리적인지 확인 (5초 이내)
    expect(responseTime).toBeLessThan(5000);

    console.log(`✅ 루트 → 랜딩 페이지 로드 성공 (${responseTime}ms)`);
  });

  test('✅ 2. 미들웨어 응답 헤더 확인', async ({ page }) => {
    // 루트 경로 접근
    const response = await page.goto(`${VERCEL_PRODUCTION_URL}/`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });

    // 검증: Vercel Edge Runtime 헤더 확인
    const headers = response?.headers();

    if (headers) {
      // Vercel 배포 헤더 확인
      expect(headers.server).toBe('Vercel');

      // Edge Runtime 헤더 확인 (있으면)
      if (headers['x-edge-runtime']) {
        expect(headers['x-edge-runtime']).toBe('vercel');
      }

      console.log('✅ 미들웨어 헤더 검증 성공');
      console.log('  - Server:', headers.server);
      console.log('  - Cache:', headers['x-vercel-cache']);
    }
  });

  test('✅ 3. 환경변수 누락 시나리오 (간접 검증)', async ({ page }) => {
    // 프로덕션 환경에서는 환경변수가 설정되어 있으므로
    // 크래시 없이 정상 작동하는지 확인

    const startTime = Date.now();

    // 여러 번 접근하여 안정성 확인
    for (let i = 0; i < 3; i++) {
      const response = await page.goto(`${VERCEL_PRODUCTION_URL}/`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.NETWORK_REQUEST,
      });

      // 크래시 없이 정상 로드 확인 (200 OK)
      expect(response?.status()).toBe(200);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`✅ 환경변수 검증 정상 작동 (3회 반복, ${totalTime}ms)`);
  });

  test('✅ 4. 에러 처리 안정성 (무한 루프 방지)', async ({ page }) => {
    // /login 페이지 접근하여 무한 루프가 없는지 확인

    const _response = await page.goto(`${VERCEL_PRODUCTION_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });

    // 검증 1: /login 페이지가 정상 로드되는지
    expect(page.url()).toContain('/login');

    // 검증 2: 무한 리다이렉트가 발생하지 않는지 (URL이 안정적인지)
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login'); // 여전히 /login

    console.log('✅ 무한 루프 방지 확인 완료');
  });

  test('✅ 5. 성능 영향 측정 (응답 시간)', async ({ page }) => {
    const iterations = 5;
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      await page.goto(`${VERCEL_PRODUCTION_URL}/`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.NETWORK_REQUEST,
      });

      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
    }

    // 평균 응답 시간 계산
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / iterations;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    console.log(`✅ 성능 측정 결과 (${iterations}회):`);
    console.log(`  - 평균: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`  - 최소: ${minResponseTime}ms`);
    console.log(`  - 최대: ${maxResponseTime}ms`);

    // 검증: 평균 응답 시간이 5초 이내
    expect(avgResponseTime).toBeLessThan(5000);
  });

  test('✅ 6. Guest 쿠키 폴백 동작 확인', async ({ page, context }) => {
    // Guest 쿠키 설정
    await context.addCookies([
      {
        name: 'guest_session_id',
        value: `test-guest-session-${Date.now()}`,
        url: VERCEL_PRODUCTION_URL,
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'auth_type',
        value: 'guest',
        url: VERCEL_PRODUCTION_URL,
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);

    // 루트 경로 접근
    const response = await page.goto(`${VERCEL_PRODUCTION_URL}/`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });

    // 검증: 랜딩 페이지가 정상 로드됨 (Guest 쿠키 여부와 관계없이)
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/OpenManager/);

    const currentUrl = page.url();
    console.log(`✅ Guest 쿠키 폴백 동작 확인 완료 (현재 URL: ${currentUrl})`);
  });

  test('✅ 7. 종합 시나리오 (연속 접근)', async ({ page }) => {
    // 시나리오: 루트 → 로그인 페이지 → 다시 루트

    // 1단계: 루트 접근 → 랜딩 페이지 로드
    const response1 = await page.goto(`${VERCEL_PRODUCTION_URL}/`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });
    expect(response1?.status()).toBe(200);
    await expect(page).toHaveTitle(/OpenManager/);

    // 2단계: 로그인 페이지로 이동
    await page.goto(`${VERCEL_PRODUCTION_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });
    expect(page.url()).toContain('/login');

    // 3단계: 다시 루트 접근 → 랜딩 페이지 로드
    const response3 = await page.goto(`${VERCEL_PRODUCTION_URL}/`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });
    expect(response3?.status()).toBe(200);
    await expect(page).toHaveTitle(/OpenManager/);

    console.log('✅ 종합 시나리오 테스트 성공');
  });
});
