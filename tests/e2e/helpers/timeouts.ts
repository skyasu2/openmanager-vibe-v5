/**
 * ⏱️ E2E 테스트 Timeout 표준화
 *
 * 🎯 목적: Timeout 값 중앙 관리 및 일관성 보장
 * 📊 효과: 24개 파일, 207개 하드코딩 값 제거, 유지보수성 향상
 *
 * 사용 예시:
 * ```typescript
 * import { TIMEOUTS } from './helpers/timeouts';
 *
 * await page.waitForSelector('.dashboard', {
 *   timeout: TIMEOUTS.DASHBOARD_LOAD  // 20초
 * });
 * ```
 */

/**
 * 표준화된 Timeout 상수
 *
 * 분류:
 * - QUICK: 빠른 동작 (5초 이하)
 * - STANDARD: 일반 동작 (10-30초)
 * - EXTENDED: 복잡한 동작 (60초 이상)
 */
export const TIMEOUTS = {
  // ⚡ Micro Timeouts (1초 이하)
  /** 애니메이션 완료 대기 (500ms) - 탭 전환, 모달 페이드 등 */
  ANIMATION: 500,

  /** 짧은 입력 대기 (300ms) - 디바운스, 키 입력 후 */
  INPUT_DELAY: 300,

  /** 매우 짧은 대기 (100ms) - 포커스 이동, 마이크로 인터랙션 */
  MICRO: 100,

  // ⚡ Quick Timeouts (5초 이하)
  /** API 응답 대기 (5초) */
  API_RESPONSE: 5000,

  /** 간단한 DOM 업데이트 (3초) */
  DOM_UPDATE: 3000,

  /** 버튼 클릭 후 반응 (2초) */
  CLICK_RESPONSE: 2000,

  /** 입력 필드 포커스 (1초) */
  INPUT_FOCUS: 1000,

  // 🏃 Standard Timeouts (10-30초)
  /** 일반 페이지 로딩 (20초) */
  PAGE_LOAD: 20000,

  /** 대시보드 페이지 로딩 (40초) - Vercel Cold Start 대응 */
  DASHBOARD_LOAD: 40000,

  /** 네트워크 요청 완료 (30초) */
  NETWORK_REQUEST: 30000,

  /** 모달/다이얼로그 표시 (10초) */
  MODAL_DISPLAY: 10000,

  /** 폼 제출 처리 (15초) */
  FORM_SUBMIT: 15000,

  // ⏳ Extended Timeouts (60초 이상)
  /** E2E 테스트 전체 (60초) */
  E2E_TEST: 60000,

  /** 복잡한 UI 인터랙션 (90초) */
  COMPLEX_INTERACTION: 90000,

  /** 전체 사용자 플로우 (2분) */
  FULL_USER_FLOW: 120000,

  /** AI 쿼리 처리 (180초) */
  AI_QUERY: 180000,

  /** AI 응답 대기 (120초) - E2E 테스트용 */
  AI_RESPONSE: 120000,
} as const;

/**
 * Timeout 타입 (TypeScript strict 모드 지원)
 */
export type TimeoutValue = (typeof TIMEOUTS)[keyof typeof TIMEOUTS];

/**
 * Timeout 헬퍼 함수
 */
export const TimeoutUtils = {
  /**
   * 환경별 Timeout 조정
   *
   * @param baseTimeout - 기본 Timeout 값
   * @param isProduction - 프로덕션 환경 여부
   * @returns 조정된 Timeout 값
   */
  adjustForEnvironment(baseTimeout: number, isProduction: boolean): number {
    // 프로덕션은 네트워크 레이턴시가 높으므로 1.5배
    return isProduction ? Math.floor(baseTimeout * 1.5) : baseTimeout;
  },

  /**
   * Retry 패턴을 위한 Timeout 계산
   *
   * @param baseTimeout - 기본 Timeout 값
   * @param retryCount - 재시도 횟수
   * @returns 재시도를 고려한 Timeout 값
   */
  withRetries(baseTimeout: number, retryCount: number): number {
    // 각 재시도마다 전체 timeout 필요
    return baseTimeout * (retryCount + 1);
  },
} as const;
