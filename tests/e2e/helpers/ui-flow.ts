/**
 * UI 플로우 헬퍼 함수
 *
 * @description 관리자 모드 활성화 등 UI 클릭 기반 테스트 플로우를 위한 헬퍼 함수 모음
 * @file tests/e2e/helpers/ui-flow.ts
 */

import { Page } from '@playwright/test';
import { TIMEOUTS } from './timeouts';

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
  const trigger = page.locator('[data-testid="profile-dropdown-trigger"]');
  await trigger.click();

  // 드롭다운 애니메이션 대기 (300ms)
  await page.waitForTimeout(300);
}

/**
 * 관리자 모드 메뉴 아이템 클릭
 *
 * @description 프로필 드롭다운에서 "관리자 모드" 메뉴 아이템 클릭
 * @param page Playwright Page 객체
 * @throws 관리자 모드 메뉴를 찾을 수 없거나 클릭할 수 없는 경우
 *
 * @example
 * await clickAdminModeMenuItem(page);
 */
export async function clickAdminModeMenuItem(page: Page): Promise<void> {
  const menuItem = page.locator('[data-testid="admin-mode"]');
  await menuItem.click();
}

/**
 * PIN 입력 및 제출
 *
 * @description 관리자 인증 모달에서 PIN 입력 후 확인 버튼 클릭
 * @param page Playwright Page 객체
 * @param pin 관리자 PIN 번호 (기본값: '4231')
 * @throws PIN 입력 필드 또는 확인 버튼을 찾을 수 없는 경우
 *
 * @example
 * await enterPinAndSubmit(page); // 기본 PIN 4231 사용
 * await enterPinAndSubmit(page, '1234'); // 커스텀 PIN 사용
 */
export async function enterPinAndSubmit(
  page: Page,
  pin: string = '4231'
): Promise<void> {
  const input = page.locator('[data-testid="admin-pin-input"]');
  const submit = page.locator('[data-testid="admin-auth-confirm-button"]');

  // PIN 입력
  await input.fill(pin);

  // 확인 버튼 클릭
  await submit.click();

  // 페이지 로드 완료 대기
  await page.waitForLoadState('networkidle', {
    timeout: TIMEOUTS.FORM_SUBMIT
  });
}

/**
 * 전체 관리자 모드 활성화 플로우 (UI 클릭 방식)
 *
 * @description 프로필 드롭다운 → 관리자 모드 → PIN 입력 → 제출 전체 플로우 실행
 * @param page Playwright Page 객체
 * @param pin 관리자 PIN 번호 (기본값: '4231')
 * @throws 플로우 중 어느 단계에서든 오류 발생 시
 *
 * @example
 * // 기본 사용
 * await completeAdminModeActivationViaUI(page);
 *
 * // 커스텀 PIN 사용
 * await completeAdminModeActivationViaUI(page, '1234');
 *
 * // 테스트 내 사용 예시
 * test('관리자 페이지 접근', async ({ page }) => {
 *   await page.goto('/dashboard');
 *   await completeAdminModeActivationViaUI(page);
 *
 *   // 관리자 모드 확인
 *   await expect(page.locator('[data-admin="true"]')).toBeVisible();
 * });
 */
export async function completeAdminModeActivationViaUI(
  page: Page,
  pin: string = '4231'
): Promise<void> {
  console.log('🔐 관리자 모드 활성화 플로우 시작 (UI 클릭 방식)');

  // 1단계: 프로필 드롭다운 열기
  console.log('  1️⃣ 프로필 드롭다운 열기');
  await openProfileDropdown(page);

  // 2단계: 관리자 모드 메뉴 클릭
  console.log('  2️⃣ 관리자 모드 메뉴 클릭');
  await clickAdminModeMenuItem(page);

  // 3단계: PIN 입력 및 제출
  console.log('  3️⃣ PIN 입력 및 제출');
  await enterPinAndSubmit(page, pin);

  console.log('✅ 관리자 모드 활성화 완료');
}
