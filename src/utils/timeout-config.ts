/**
 * 🕐 타임아웃 설정 유틸리티
 *
 * AI API 타임아웃 불일치 문제 해결을 위한
 * 통합 타임아웃 설정 관리 유틸리티
 *
 * v5.84.0: Cloud Run AI로 마이그레이션 (Google AI 제거)
 *
 * @version 2.0.0 - Cloud Run based
 * @date 2025-12-31
 */

/**
 * 📊 넉넉한 타임아웃 설정 - 베르셀 제한 고려
 *
 * 🚀 2025-12-31 Cloud Run 최적화: 복잡한 쿼리 안정성 우선
 * - Simple 쿼리: ~1초, Medium: ~2초, Complex: ~4초 예상
 * - 베르셀 무료 티어 제한: 10초 최대
 * - 안전 여유분: 8초 설정 (베르셀 제한의 80%)
 */
import { logger } from '@/lib/logging';

const TIMEOUT_CONFIG = {
  CLOUD_RUN_AI: 8000, // 🎯 Cloud Run AI 타임아웃 (베르셀 10초 제한 고려)
  LOCAL_AI: 3500, // Local AI 충분한 타임아웃 (Cloud Run 응답 고려)
  MCP_SERVER: 5000, // MCP 서버 기본 타임아웃 (Claude Code 개발용)
};

/**
 * 🔧 환경변수 기반 타임아웃 설정 조회
 *
 * 환경변수를 통해 타임아웃 값을 오버라이드할 수 있으며,
 * 설정되지 않은 경우 측정된 실제 응답시간 기반 기본값 사용
 */
export function getEnvironmentTimeouts() {
  const envCloudRunAI = process.env.CLOUD_RUN_AI_TIMEOUT;
  const envLocalAI = process.env.LOCAL_AI_TIMEOUT;
  const envMCP = process.env.MCP_TIMEOUT;

  if (process.env.NODE_ENV === 'development') {
    logger.info('🔧 [DEBUG] Environment variables loading:', {
      CLOUD_RUN_AI_TIMEOUT: envCloudRunAI,
      LOCAL_AI_TIMEOUT: envLocalAI,
      MCP_TIMEOUT: envMCP,
      fallback_CLOUD_RUN_AI: TIMEOUT_CONFIG.CLOUD_RUN_AI,
      fallback_LOCAL_AI: TIMEOUT_CONFIG.LOCAL_AI,
      fallback_MCP_SERVER: TIMEOUT_CONFIG.MCP_SERVER,
    });
  }

  const result = {
    CLOUD_RUN_AI:
      parseInt(envCloudRunAI || '', 10) || TIMEOUT_CONFIG.CLOUD_RUN_AI,
    LOCAL_AI: parseInt(envLocalAI || '', 10) || TIMEOUT_CONFIG.LOCAL_AI,
    MCP_SERVER: parseInt(envMCP || '', 10) || TIMEOUT_CONFIG.MCP_SERVER,
  };

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
  CLOUD_RUN_AI: number;
  LOCAL_AI: number;
  MCP_SERVER: number;
}
