import { Page } from '@playwright/test';
import { ensureVercelBypassCookie } from './security';
import { TIMEOUTS } from './timeouts';

export interface GuestLoginOptions {
  landingPath?: string;
  guestButtonSelector?: string;
  waitForPath?: string;
  skipLandingNavigation?: boolean;
}

/**
 * 게스트 세션 관련 상태(localStorage/cookies)를 정리합니다.
 */
export async function resetGuestState(page: Page): Promise<void> {
  const context = page.context();
  await context.clearCookies();
  await context.clearPermissions().catch(() => undefined);

  try {
    await page.goto('about:blank');
  } catch {
    // ignore navigation errors during reset
  }

  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // noop
    }
  });
}

/**
 * 게스트 로그인 버튼을 클릭해 /main으로 이동합니다.
 */
export async function guestLogin(
  page: Page,
  options: GuestLoginOptions = {}
): Promise<void> {
  const {
    landingPath = '/',
    guestButtonSelector = 'button:has-text("게스트로 체험하기")',
    waitForPath = '/main',
    skipLandingNavigation = false,
  } = options;

  await ensureVercelBypassCookie(page);
  if (!skipLandingNavigation) {
    await page.goto(landingPath, { waitUntil: 'domcontentloaded' });
  }

  const guestButton = page.locator(guestButtonSelector).first();
  await guestButton.waitFor({
    state: 'visible',
    timeout: TIMEOUTS.MODAL_DISPLAY,
  });
  await guestButton.click();

  await page.waitForURL(`**${waitForPath}**`, {
    timeout: TIMEOUTS.NETWORK_REQUEST,
  });
  await page.waitForLoadState('networkidle', {
    timeout: TIMEOUTS.NETWORK_REQUEST,
  });
}
