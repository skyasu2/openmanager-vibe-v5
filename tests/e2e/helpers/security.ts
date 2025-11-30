import * as path from 'node:path';
import { Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import { getTestBaseUrl, isVercelProduction } from './config';
import { TIMEOUTS } from './timeouts';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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
