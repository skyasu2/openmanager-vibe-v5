/**
 * 🕐 타임아웃 설정 유틸리티
 *
 * Google AI API 테스트에서 발견된 타임아웃 불일치 문제 해결을 위한
 * 통합 타임아웃 설정 관리 유틸리티
 *
 * 중복 제거: SimplifiedQueryEngine.ts, SimplifiedQueryEngine.processors.googleai.ts, route.ts 통합
 *
 * @version 1.0.0
 * @date 2025-09-23
 */

/**
 * 📊 넉넉한 타임아웃 설정 - 베르셀 제한 고려
 *
 * 🚀 2025-09-29 무료 티어 최적화: 복잡한 쿼리 안정성 우선
 * - Simple 쿼리: ~1초, Medium: ~2초, Complex: ~4초 예상
 * - 베르셀 무료 티어 제한: 10초 최대
 * - 안전 여유분: 8초 설정 (베르셀 제한의 80%)
 */
const TIMEOUT_CONFIG = {
  GOOGLE_AI: 8000, // 🎯 넉넉한 타임아웃: 복잡한 쿼리 안정성 보장 (베르셀 10초 제한 고려)
  LOCAL_AI: 3500,  // Local AI 충분한 타임아웃 (GCP Functions 응답 고려) - 환경변수와 일치
  MCP_SERVER: 5000 // MCP 서버 기본 타임아웃 (Claude Code 개발용)
};

/**
 * 🔧 환경변수 기반 타임아웃 설정 조회
 *
 * 환경변수를 통해 타임아웃 값을 오버라이드할 수 있으며,
 * 설정되지 않은 경우 측정된 실제 응답시간 기반 기본값 사용
 */
export function getEnvironmentTimeouts() {
  // 🔍 디버깅을 위한 환경변수 로깅 (2025-09-29)
  const envGoogleAI = process.env.GOOGLE_AI_TIMEOUT;
  const envLocalAI = process.env.LOCAL_AI_TIMEOUT;
  const envMCP = process.env.MCP_TIMEOUT;

  console.log('🔧 [DEBUG] Environment variables loading:', {
    GOOGLE_AI_TIMEOUT: envGoogleAI,
    LOCAL_AI_TIMEOUT: envLocalAI,
    MCP_TIMEOUT: envMCP,
    fallback_GOOGLE_AI: TIMEOUT_CONFIG.GOOGLE_AI,
    fallback_LOCAL_AI: TIMEOUT_CONFIG.LOCAL_AI,
    fallback_MCP_SERVER: TIMEOUT_CONFIG.MCP_SERVER,
  });

  const result = {
    GOOGLE_AI: parseInt(envGoogleAI || '') || TIMEOUT_CONFIG.GOOGLE_AI,
    LOCAL_AI: parseInt(envLocalAI || '') || TIMEOUT_CONFIG.LOCAL_AI,
    MCP_SERVER: parseInt(envMCP || '') || TIMEOUT_CONFIG.MCP_SERVER,
  };

  console.log('🎯 [DEBUG] Final timeout configuration:', result);

  return result;
}

/**
 * 📈 타임아웃 상수 노출 (디버깅 및 테스트용)
 */
export { TIMEOUT_CONFIG };

/**
 * 🛠️ 타입 정의
 */
export interface TimeoutConfig {
  GOOGLE_AI: number;
  LOCAL_AI: number;
  MCP_SERVER: number;
}