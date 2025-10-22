/**
 * 서버 사이드 전용 게스트 모드 유틸리티
 *
 * ✅ 단일 토글 환경 변수 우선순위
 * 1. GUEST_FULL_ACCESS_ENABLED (bool)
 * 2. GUEST_MODE_ENABLED (bool 또는 문자열)
 * 3. NEXT_PUBLIC_GUEST_FULL_ACCESS (bool) - 서버/클라이언트 공통
 * 4. NEXT_PUBLIC_GUEST_MODE (문자열)
 *
 * fallback: 'restricted'
 */

import {
  GUEST_MODE,
  type GuestModeType,
  normalizeGuestModeValue,
  parseGuestBooleanFlag,
} from './guestMode';

function resolveBooleanFlag(): boolean | undefined {
  const candidates = [
    process.env.GUEST_FULL_ACCESS_ENABLED,
    process.env.GUEST_MODE_ENABLED,
    process.env.NEXT_PUBLIC_GUEST_FULL_ACCESS,
  ];

  for (const value of candidates) {
    const parsed = parseGuestBooleanFlag(value);
    if (typeof parsed === 'boolean') {
      return parsed;
    }
  }

  return undefined;
}

function resolveStringMode(): GuestModeType | undefined {
  const candidates = [
    process.env.GUEST_MODE_ENABLED,
    process.env.NEXT_PUBLIC_GUEST_MODE,
  ];

  for (const value of candidates) {
    const normalized = normalizeGuestModeValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export function getServerGuestMode(): GuestModeType {
  const booleanOverride = resolveBooleanFlag();
  if (typeof booleanOverride === 'boolean') {
    return booleanOverride ? GUEST_MODE.FULL_ACCESS : GUEST_MODE.RESTRICTED;
  }

  const stringMode = resolveStringMode();
  if (stringMode) {
    return stringMode;
  }

  return GUEST_MODE.RESTRICTED;
}

export function isGuestFullAccessEnabledServer(): boolean {
  return getServerGuestMode() === GUEST_MODE.FULL_ACCESS;
}
