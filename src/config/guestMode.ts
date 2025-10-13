/**
 * 게스트 모드 설정
 *
 * 환경 변수로 게스트 접근 권한을 제어합니다.
 *
 * ⚠️ 주의: NEXT_PUBLIC_ 환경 변수는 빌드 타임에 번들링됩니다.
 * Vercel에서 환경 변수 변경 후 반드시 재빌드가 필요합니다.
 *
 * @example
 * // .env.local (개발 환경)
 * NEXT_PUBLIC_GUEST_MODE=full_access
 *
 * // Vercel 환경 변수 (프로덕션)
 * NEXT_PUBLIC_GUEST_MODE=full_access
 *
 * 📝 Build timestamp: 2025-10-13
 */

export const GUEST_MODE = {
  /** 게스트가 모든 기능 사용 가능 (개발용) */
  FULL_ACCESS: 'full_access',
  /** 게스트 접근 제한 (프로덕션용) */
  RESTRICTED: 'restricted',
} as const;

export type GuestModeType = typeof GUEST_MODE[keyof typeof GUEST_MODE];

/**
 * 현재 게스트 모드 설정을 반환합니다.
 *
 * @returns 'full_access' | 'restricted'
 * @default 'restricted' (환경 변수 미설정 시)
 */
export function getGuestMode(): GuestModeType {
  const mode = process.env.NEXT_PUBLIC_GUEST_MODE;

  // 디버그: 환경 변수 값 확인 (빌드 타임)
  if (typeof window === 'undefined') {
    console.log('🎛️ [Build] NEXT_PUBLIC_GUEST_MODE:', mode);
  }

  if (mode === GUEST_MODE.FULL_ACCESS || mode === GUEST_MODE.RESTRICTED) {
    return mode;
  }

  // 기본값: 프로덕션 안전 모드
  return GUEST_MODE.RESTRICTED;
}

/**
 * 게스트 전체 접근이 허용되었는지 확인합니다.
 *
 * @returns true: 게스트가 모든 기능 사용 가능
 * @returns false: 게스트 접근 제한 (기본값)
 */
export function isGuestFullAccessEnabled(): boolean {
  return getGuestMode() === GUEST_MODE.FULL_ACCESS;
}

/**
 * 현재 게스트 모드 설정 정보를 반환합니다.
 *
 * @returns 설정 정보 객체
 */
export function getGuestModeInfo() {
  const mode = getGuestMode();

  return {
    mode,
    isFullAccess: mode === GUEST_MODE.FULL_ACCESS,
    isRestricted: mode === GUEST_MODE.RESTRICTED,
    description: mode === GUEST_MODE.FULL_ACCESS
      ? '게스트 모든 권한 허용 (개발 모드)'
      : '게스트 접근 제한 (프로덕션 모드)',
  };
}
