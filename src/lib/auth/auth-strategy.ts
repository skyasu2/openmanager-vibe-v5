/**
 * 인증 전략 결정 로직
 *
 * 환경 변수에 따라 적절한 인증 방식('password' | 'bypass')을 결정합니다.
 * 보안을 위해 프로덕션 환경에서는 절대 'bypass'를 허용하지 않습니다.
 */

export type AuthMethod = 'password' | 'bypass';

/**
 * 현재 환경에 적합한 인증 방식을 반환합니다.
 *
 * @returns {'password' | 'bypass'} 인증 방식
 * - 'password': 일반적인 인증 (기본값, 프로덕션 강제)
 * - 'bypass': 테스트용 우회 (로컬 개발 환경에서만 가능)
 */
export function getAuthMethod(): AuthMethod {
  // 1. 프로덕션 환경 감지 (가장 높은 우선순위)
  // VERCEL 환경 변수나 NODE_ENV가 production인 경우 무조건 password 사용
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'password';
  }

  // 2. 로컬/테스트 환경에서만 bypass 허용
  // TEST_BYPASS_SECRET 환경 변수가 설정되어 있을 때만 bypass
  if (process.env.TEST_BYPASS_SECRET) {
    return 'bypass';
  }

  // 3. 기본값: password (안전한 기본값)
  return 'password';
}
