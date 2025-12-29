/**
 * Human-in-the-Loop (HITL) 공유 타입 정의
 *
 * Cloud Run과 Vercel에서 공통으로 사용하는 HITL 타입들
 * Note: Cloud Run 측 타입과 동기화 필요
 * @see cloud-run/ai-engine/src/services/approval/approval-store.ts
 */

// ============================================================================
// 승인 액션 타입
// ============================================================================

/**
 * Cloud Run에서 정의하는 승인 액션 타입
 * @sync cloud-run/ai-engine/src/services/approval/approval-store.ts
 */
export type ApprovalActionType =
  | 'incident_report' // 인시던트 리포트 생성
  | 'system_command' // 시스템 명령어 실행
  | 'critical_alert'; // 중요 알림 발송

/**
 * Vercel Frontend에서 사용하는 승인 요청 타입
 * ApprovalActionType을 확장하여 UI 표시용 타입 추가
 */
export type ApprovalRequestType =
  | ApprovalActionType
  | 'tool_execution' // 도구 실행
  | 'data_access' // 데이터 접근
  | 'report_generation'; // 보고서 생성

// ============================================================================
// 승인 요청/응답 인터페이스
// ============================================================================

/**
 * Cloud Run에서 생성하는 승인 대기 정보
 * @sync cloud-run/ai-engine/src/services/approval/approval-store.ts
 */
export interface PendingApproval {
  sessionId: string;
  actionType: ApprovalActionType;
  description: string;
  payload: Record<string, unknown>;
  requestedAt: Date | string;
  requestedBy: string;
  expiresAt: Date | string;
}

/**
 * Frontend에서 사용하는 승인 요청 UI 정보
 */
export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  description: string;
  details?: string;
}

/**
 * 승인/거부 결정 정보
 * @sync cloud-run/ai-engine/src/services/approval/approval-store.ts
 */
export interface ApprovalDecision {
  approved: boolean;
  decidedAt: Date | string;
  decidedBy?: string;
  reason?: string;
}

// ============================================================================
// API 응답 타입
// ============================================================================

/**
 * GET /api/ai/approval 응답 타입
 */
export interface ApprovalStatusResponse {
  success: boolean;
  hasPending: boolean;
  action: {
    type: ApprovalActionType;
    description: string;
    details?: Record<string, unknown>;
    requestedAt: string;
    requestedBy: string;
    expiresAt: string;
  } | null;
  sessionId: string;
  _backend?: 'cloud-run' | 'local';
}

/**
 * POST /api/ai/approval 요청 타입
 */
export interface ApprovalDecisionRequest {
  sessionId: string;
  approved: boolean;
  reason?: string;
  approvedBy?: string;
}

/**
 * POST /api/ai/approval 응답 타입
 */
export interface ApprovalDecisionResponse {
  success: boolean;
  sessionId: string;
  decision: 'approved' | 'rejected';
  decidedAt: string;
  processingTime?: string;
  error?: string;
}

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
