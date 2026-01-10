/**
 * AI Engine Enum Types
 *
 * 시나리오, Provider 타입, 우선순위 등 기본 열거형 타입
 */

/**
 * AI 쿼리 시나리오 타입
 *
 * 각 시나리오마다 다른 프롬프트, Provider 활성화, 옵션이 적용됩니다.
 */
export type AIScenario =
  | 'failure-analysis' // 장애 분석
  | 'performance-report' // 성능 리포트
  | 'document-qa' // 문서 Q/A
  | 'dashboard-summary' // 대시보드 요약
  | 'general-query' // 일반 쿼리
  | 'incident-report' // 사고 리포트
  | 'optimization-advice'; // 최적화 조언

/**
 * Provider 타입
 */
export type ProviderType = 'rag' | 'ml' | 'rule';

/**
 * 컨텍스트 우선순위
 */
export type ContextPriority = 'high' | 'medium' | 'low';
