import type { Locator, Page } from '@playwright/test';
import { ensureVercelBypassCookie } from './security';
import { TIMEOUTS } from './timeouts';

export interface GuestLoginOptions {
  landingPath?: string;
  guestButtonSelector?: string;
  waitForPath?: string;
  skipLandingNavigation?: boolean;
}

export interface AiToggleOptions {
  buttonSelectors?: string[];
  sidebarSelectors?: string[];
  waitForSidebar?: boolean;
  waitTimeout?: number;
}

const DEFAULT_AI_BUTTON_SELECTORS = [
  'button:has-text("AI 어시스턴트 열기")',
  'button:has-text("AI 어시스턴트")',
  '[data-testid="ai-assistant"]',
  '[data-testid="ai-sidebar-trigger"]',
  'button[aria-label*="AI"]',
  'button[title*="AI"]',
];

const DEFAULT_AI_SIDEBAR_SELECTORS = [
  'dialog:has-text("AI 어시스턴트")',
  '[role="dialog"]:has-text("AI")',
  '[data-testid="ai-sidebar"]',
  '.ai-sidebar',
  '.ai-panel',
];

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
 * 게스트 로그인 버튼을 클릭해 메인 페이지(/)로 이동합니다.
 */
export async function guestLogin(
  page: Page,
  options: GuestLoginOptions = {}
): Promise<void> {
  const {
    landingPath = '/',
    guestButtonSelector = 'button:has-text("게스트로 체험하기")',
    waitForPath = '/',
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

/**
 * AI 사이드바 토글을 열고 해당 locator를 반환합니다.
 * 이미 열려있는 경우 버튼을 클릭하지 않습니다.
 */
export async function openAiSidebar(
  page: Page,
  options: AiToggleOptions = {}
): Promise<Locator> {
  const {
    buttonSelectors = DEFAULT_AI_BUTTON_SELECTORS,
    sidebarSelectors = DEFAULT_AI_SIDEBAR_SELECTORS,
    waitForSidebar = true,
    waitTimeout = TIMEOUTS.DOM_UPDATE,
  } = options;

  // 먼저 사이드바가 이미 열려있는지 확인
  for (const selector of sidebarSelectors) {
    const sidebar = page.locator(selector).first();
    const isVisible = await sidebar
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (isVisible) {
      // 이미 열려있으면 바로 반환
      return sidebar;
    }
  }

  // 사이드바가 닫혀있으면 버튼을 찾아서 클릭
  let trigger: Locator | null = null;
  const attemptedButtonSelectors: string[] = [];

  for (const selector of buttonSelectors) {
    attemptedButtonSelectors.push(selector);
    const candidate = page.locator(selector).first();
    try {
      // waitFor를 사용하여 실제로 버튼이 나타날 때까지 기다림
      await candidate.waitFor({
        state: 'visible',
        timeout: TIMEOUTS.DOM_UPDATE,
      });
      trigger = candidate;
      break;
    } catch {}
  }

  if (!trigger) {
    throw new Error(
      `AI 토글 버튼을 찾을 수 없습니다.\n` +
        `페이지: ${page.url()}\n` +
        `시도한 셀렉터: ${attemptedButtonSelectors.join(', ')}`
    );
  }

  await trigger.click();

  if (!waitForSidebar) {
    return trigger;
  }

  const attemptedSidebarSelectors: string[] = [];

  for (const selector of sidebarSelectors) {
    attemptedSidebarSelectors.push(selector);
    const sidebar = page.locator(selector).first();
    try {
      await sidebar.waitFor({ state: 'visible', timeout: waitTimeout });
      return sidebar;
    } catch {
      // 다음 셀렉터 시도
    }
  }

  throw new Error(
    `AI 사이드바가 나타나지 않았습니다.\n` +
      `페이지: ${page.url()}\n` +
      `시도한 셀렉터: ${attemptedSidebarSelectors.join(', ')}`
  );
}
