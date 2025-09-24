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
 * 📊 측정된 실제 응답시간 기반 타임아웃 설정
 */
const TIMEOUT_CONFIG = {
  GOOGLE_AI: 3000, // Google AI 기본 타임아웃 (측정값: 1914ms + 50% 여유분)
  LOCAL_AI: 1500,  // Local AI 기본 타임아웃 (측정값: 987ms + 50% 여유분)
  MCP_SERVER: 5000 // MCP 서버 기본 타임아웃 (Claude Code 개발용)
};

/**
 * 🔧 환경변수 기반 타임아웃 설정 조회
 *
 * 환경변수를 통해 타임아웃 값을 오버라이드할 수 있으며,
 * 설정되지 않은 경우 측정된 실제 응답시간 기반 기본값 사용
 */
export function getEnvironmentTimeouts() {
  return {
    GOOGLE_AI: parseInt(process.env.GOOGLE_AI_TIMEOUT || '') || TIMEOUT_CONFIG.GOOGLE_AI,
    LOCAL_AI: parseInt(process.env.LOCAL_AI_TIMEOUT || '') || TIMEOUT_CONFIG.LOCAL_AI,
    MCP_SERVER: parseInt(process.env.MCP_TIMEOUT || '') || TIMEOUT_CONFIG.MCP_SERVER,
  };
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