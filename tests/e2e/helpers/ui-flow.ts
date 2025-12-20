/**
 * UI 플로우 헬퍼 함수
 *
 * @description UI 클릭 기반 테스트 플로우를 위한 헬퍼 함수 모음
 * @file tests/e2e/helpers/ui-flow.ts
 *
 * @note v5.80.0 업데이트: 관리자 모드 및 `/admin` 페이지가 완전히 제거됨
 *       - clickAdminModeMenuItem: 폐기됨
 *       - enterPinAndSubmit: 폐기됨
 *       - completeAdminModeActivationViaUI: 폐기됨 (no-op)
 */

import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from './timeouts';

const DASHBOARD_ROUTE_REGEX = /\/(dashboard|main)(\/|\?|$)/;

function profileTriggerLocator(page: Page) {
  return page.locator(
    '[data-testid="profile-dropdown-trigger"], [aria-label="프로필 메뉴"]'
  );
}

function _adminPageButtonLocator(page: Page) {
  return page
    .locator(
      '[data-testid="admin-page"], button:has-text("관리자 페이지"), a:has-text("관리자 페이지")'
    )
    .first();
}

/**
 * 프로필 드롭다운 열기
 *
 * @description data-testid 기반 안정적 셀렉터로 프로필 버튼 클릭
 * @param page Playwright Page 객체
 * @throws 프로필 버튼을 찾을 수 없거나 클릭할 수 없는 경우
 *
 * @example
 * await openProfileDropdown(page);
 */
export async function openProfileDropdown(page: Page): Promise<void> {
  // 대시보드/메인 화면이 완전히 로드될 때까지 대기 (WSL ↔️ Vercel 지연 대비)
  await page.waitForURL(DASHBOARD_ROUTE_REGEX, {
    timeout: TIMEOUTS.DASHBOARD_LOAD,
  });
  await page.waitForLoadState('networkidle', {
    timeout: TIMEOUTS.DASHBOARD_LOAD,
  });

  const trigger = profileTriggerLocator(page);

  await trigger.waitFor({
    state: 'visible',
    timeout: TIMEOUTS.DASHBOARD_LOAD,
  });
  await expect(trigger).toBeVisible({ timeout: TIMEOUTS.DASHBOARD_LOAD });
  await trigger.click({ timeout: TIMEOUTS.FORM_SUBMIT });

  // 드롭다운 애니메이션 대기 (300ms)
  await page.waitForTimeout(300);
}

/**
 * 관리자 모드 메뉴 아이템 클릭
 *
 * @deprecated v5.80.0에서 관리자 모드가 제거됨. 이 함수는 더 이상 사용되지 않음.
 * @description 프로필 드롭다운에서 "관리자 모드" 메뉴 아이템 클릭
 * @param page Playwright Page 객체
 * @throws 관리자 모드 메뉴를 찾을 수 없거나 클릭할 수 없는 경우
 *
 * @example
 * // 더 이상 사용하지 마세요
 * await clickAdminModeMenuItem(page);
 */
export async function clickAdminModeMenuItem(page: Page): Promise<void> {
  const menuItem = page
    .locator(
      '[data-testid="admin-toggle"], [data-testid="admin-mode"], [role="menuitem"]:has-text("관리자 모드"), [role="menuitem"]:has-text("Admin Mode")'
    )
    .first();

  await menuItem.waitFor({
    state: 'visible',
    timeout: TIMEOUTS.MODAL_DISPLAY,
  });
  await menuItem.click({ timeout: TIMEOUTS.FORM_SUBMIT });
}

/**
 * PIN 입력 및 제출
 *
 * @deprecated v5.80.0에서 관리자 모드가 제거됨. 이 함수는 더 이상 사용되지 않음.
 * @description 관리자 인증 모달에서 PIN 입력 후 확인 버튼 클릭
 * @param page Playwright Page 객체
 * @param pin 관리자 PIN 번호 (기본값: '4231')
 * @throws PIN 입력 필드 또는 확인 버튼을 찾을 수 없는 경우
 *
 * @example
 * // 더 이상 사용하지 마세요
 * await enterPinAndSubmit(page);
 */
export async function enterPinAndSubmit(
  page: Page,
  pin: string = '4231'
): Promise<void> {
  const input = page
    .locator(
      '[data-testid="admin-pin-input"], input[aria-label="관리자 비밀번호"], input[type="password"]'
    )
    .first();
  const submit = page
    .locator(
      '[data-testid="admin-auth-confirm-button"], button:has-text("확인")'
    )
    .first();

  // PIN 입력
  await input.waitFor({
    state: 'visible',
    timeout: TIMEOUTS.MODAL_DISPLAY,
  });
  await input.fill(pin, { timeout: TIMEOUTS.FORM_SUBMIT });
  await expect(input).toHaveValue(pin, { timeout: TIMEOUTS.CLICK_RESPONSE });

  // 확인 버튼 클릭
  await submit.waitFor({
    state: 'visible',
    timeout: TIMEOUTS.MODAL_DISPLAY,
  });
  if (await submit.isEnabled()) {
    await submit.click({ timeout: TIMEOUTS.FORM_SUBMIT });
  } else {
    await input.press('Enter', { timeout: TIMEOUTS.CLICK_RESPONSE });
  }

  // 페이지 로드 완료 대기
  await page.waitForLoadState('networkidle', {
    timeout: TIMEOUTS.FORM_SUBMIT,
  });
}

/**
 * 전체 관리자 모드 활성화 플로우 (UI 클릭 방식)
 *
 * @deprecated v5.80.0에서 관리자 모드가 제거됨. 이 함수는 no-op으로만 동작함.
 * @description 프로필 드롭다운 → 관리자 모드 → PIN 입력 → 제출 전체 플로우 실행 (현재 비활성화됨)
 * @param page Playwright Page 객체
 * @param pin 관리자 PIN 번호 (기본값: '4231') - 더 이상 사용되지 않음
 * @throws 플로우 중 어느 단계에서든 오류 발생 시
 *
 * @example
 * // 더 이상 사용하지 마세요 - 게스트 로그인 사용 권장
 * // import { loginAsGuest } from './guest';
 * // await loginAsGuest(page);
 */
export async function completeAdminModeActivationViaUI(
  page: Page,
  _pin: string = '4231'
): Promise<void> {
  console.log(
    'ℹ️ 관리자 모드가 제거되어 헬퍼가 더 이상 UI 단계를 실행하지 않습니다.'
  );
  try {
    await openProfileDropdown(page);
  } catch (error) {
    console.warn(
      '⚠️ 프로필 드롭다운을 열 수 없어도 테스트를 계속합니다.',
      error
    );
  }
}
