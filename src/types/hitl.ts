/**
 * 세션 상태 타입 정의
 *
 * AI 채팅 세션 관리를 위한 타입들
 * Note: HITL(Human-in-the-Loop) 기능은 v4.1에서 제거됨 - 모든 AI 기능이 사용자 요청 기반
 */

// ============================================================================
// 세션 상태 타입
// ============================================================================

/**
 * 세션 상태 (메시지 제한 관리용)
 */
export interface SessionState {
  count: number;
  remaining: number;
  isWarning: boolean;
  isLimitReached: boolean;
}

/**
 * 세션 제한 상수
 *
 * @updated 2025-12-30 - 제한 완화 (20 → 100)
 * - 기존 20개 제한은 실질적 대화 불가능
 * - 50 대화쌍 (100 메시지)으로 확장
 * - WARNING_THRESHOLD는 80개 (80%)에서 경고
 */
export const SESSION_LIMITS = {
  MESSAGE_LIMIT: 100,
  WARNING_THRESHOLD: 80,
} as const;
