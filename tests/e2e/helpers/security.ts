import * as path from 'node:path';
import type { Page } from '@playwright/test';
import { test } from '@playwright/test';
import * as dotenv from 'dotenv';
import { getTestBaseUrl, isVercelProduction } from './config';
import { TIMEOUTS } from './timeouts';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const SECURITY_CHECKPOINT_TITLE = 'Vercel Security Checkpoint';

/**
 * 현재 페이지가 Vercel Security Checkpoint인지 확인합니다.
 */
export async function isSecurityCheckpoint(page: Page): Promise<boolean> {
  try {
    const title = await page.title();
    return title.includes(SECURITY_CHECKPOINT_TITLE);
  } catch {
    return false;
  }
}

/**
 * Vercel Security Checkpoint가 감지되면 테스트를 스킵합니다.
 * @param page Playwright Page 객체
 * @param testName 테스트 이름 (로그용)
 */
export async function skipIfSecurityCheckpoint(
  page: Page,
  testName?: string
): Promise<void> {
  if (await isSecurityCheckpoint(page)) {
    const message = `Vercel Security Checkpoint detected${testName ? ` in ${testName}` : ''}`;
    console.log(`⚠️ ${message} - skipping`);
    test.skip(true, message);
  }
}

/**
 * API 응답이 403 (Security Checkpoint)이면 테스트를 스킵합니다.
 * @param status HTTP 상태 코드
 * @param testName 테스트 이름 (로그용)
 * @returns true면 스킵됨
 */
export function skipIfSecurityBlocked(
  status: number,
  testName?: string
): boolean {
  if (status === 403) {
    const message = `API blocked by Vercel Security Checkpoint${testName ? ` in ${testName}` : ''}`;
    console.log(`⚠️ ${message} - skipping`);
    test.skip(true, message);
    return true;
  }
  return false;
}

/**
 * Vercel Security Checkpoint를 우회하기 위해 bypass 쿠키를 선행 세팅합니다.
 *
 * 일부 테스트가 / 루트 진입 직후 `Failed to verify your browser (Code 21)`
 * 를 만나 버튼을 찾지 못하는 이슈가 반복되어, 실제 페이지 이동 전에
 * vercel_bypass 파라미터를 붙여 한 번 방문합니다.
 */
export async function ensureVercelBypassCookie(page: Page): Promise<void> {
  const baseUrl = getTestBaseUrl();
  if (!isVercelProduction(baseUrl)) {
    return;
  }

  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!bypassSecret) {
    console.warn(
      '⚠️ [Security Helper] VERCEL_AUTOMATION_BYPASS_SECRET 미설정 - bypass 생략'
    );
    return;
  }

  const bypassUrl = new URL(baseUrl);
  bypassUrl.searchParams.set('vercel_bypass', bypassSecret);

  try {
    console.log(
      '🔑 [Security Helper] Vercel 보호 우회 쿠키 요청:',
      bypassUrl.origin
    );
    await page.goto(bypassUrl.toString(), {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.NETWORK_REQUEST,
    });
    await page.waitForTimeout(500);
    console.log('✅ [Security Helper] Vercel bypass 쿠키 설정 완료');
  } catch (error) {
    console.warn(
      '⚠️ [Security Helper] Vercel bypass 쿠키 설정 실패 (계속 진행):',
      error
    );
  }
}
