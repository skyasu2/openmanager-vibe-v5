/**
 * 🚨 Google AI 무료 티어 사용량 제한 설정
 *
 * 2025년 기준 Google Gemini AI API 무료 티어 실제 한도
 * 출처: Google AI for Developers, Community Feedback
 */

// 📊 모델별 무료 티어 한도 (2025-12 테스트 기준)
export const GOOGLE_AI_MODEL_LIMITS = {
  // ✅ 현재 유일하게 Free Tier 접근 가능한 모델 (2025-12-18 테스트)
  'gemini-2.5-flash': {
    RPM: 5,
    TPM: 250_000,
    RPD: 20, // 🚨 축소됨 (이전 1500 → 20)
    DESC: '유일한 Free Tier 사용 가능 모델',
    STATUS: 'AVAILABLE',
  },

  // ⚠️ 존재하지만 무료 할당량 초과된 모델
  'gemini-2.5-pro': {
    RPM: 2,
    TPM: 32_000,
    RPD: 5, // 🚨 거의 사용 불가
    DESC: '유료 플랜 권장',
    STATUS: 'QUOTA_EXCEEDED',
  },

  // ❌ 더 이상 사용 불가 (NOT_FOUND)
  // 'gemini-1.5-flash': DEPRECATED
  // 'gemini-1.5-pro': DEPRECATED
  // 'gemini-2.0-flash': QUOTA_EXCEEDED
} as const;

export const GOOGLE_AI_FREE_TIER_LIMITS = {
  // 🚨 현재 기본 모델 (gemini-2.5-flash) 기준 - 2025-12 테스트 반영
  DAILY_REQUESTS: 20, // 🚨 대폭 축소됨 (이전 1500 → 20)

  // ⚡ 분당 요청 한도
  REQUESTS_PER_MINUTE: 5, // 축소됨 (이전 15 → 5)

  // 🕐 리셋 시간 (태평양 표준시 자정)
  RESET_TIMEZONE: 'America/Los_Angeles',
  RESET_HOUR: 0,

  // ⚠️ 경고 임계값 (20회 기준)
  WARNING_THRESHOLD: 15, // 75% 사용 시점
  CRITICAL_THRESHOLD: 18, // 90% 사용 시점

  // 📊 토큰 한도
  CONTEXT_TOKENS: 250_000, // 축소됨 (이전 1M → 250K)

  // 🔄 HTTP 429 에러 처리
  RATE_LIMIT_RETRY_DELAY: 60_000, // 1분
  MAX_RETRIES: 3,
} as const;

/**
 * 🎯 사용량 최적화 설정
 */
export const USAGE_OPTIMIZATION_CONFIG = {
  // 💾 캐시 설정 (무료 티어 최적화)
  CACHE_TTL_HOURS: 24, // 24시간 캐시 (일일 한도 고려)
  ENABLE_AGGRESSIVE_CACHING: true,
  CACHE_SIMILAR_QUERIES: true,

  // 🔄 폴백 전략
  PREFER_LOCAL_AI: true,
  GOOGLE_AI_ONLY_ON_FAILURE: false, // 로컬 AI 실패 시에만 사용
  AUTO_DISABLE_ON_LIMIT: true,

  // 📝 프롬프트 최적화
  COMPRESS_PROMPTS: true,
  REMOVE_UNNECESSARY_METADATA: true,
  BATCH_RELATED_QUERIES: true,
} as const;

/**
 * 📊 사용량 추적 타입
 */
export interface GoogleAIUsageTracker {
  dailyCount: number;
  minuteCount: number;
  lastRequest: Date;
  warningsSent: number;
  isDisabled: boolean;
  resetTime: Date;
}

/**
 * 🚨 사용량 상태 체크 함수
 */
export function checkUsageStatus(tracker: GoogleAIUsageTracker): {
  canMakeRequest: boolean;
  status: 'ok' | 'warning' | 'critical' | 'limit_exceeded';
  remainingRequests: number;
  warningMessage?: string;
} {
  const { dailyCount, isDisabled } = tracker;
  const { DAILY_REQUESTS, WARNING_THRESHOLD, CRITICAL_THRESHOLD } =
    GOOGLE_AI_FREE_TIER_LIMITS;

  if (isDisabled) {
    return {
      canMakeRequest: false,
      status: 'limit_exceeded',
      remainingRequests: 0,
      warningMessage: 'Google AI API가 일일 한도 초과로 비활성화됨',
    };
  }

  const remaining = Math.max(0, DAILY_REQUESTS - dailyCount);

  if (dailyCount >= DAILY_REQUESTS) {
    return {
      canMakeRequest: false,
      status: 'limit_exceeded',
      remainingRequests: 0,
      warningMessage: `일일 한도 ${DAILY_REQUESTS}회 초과`,
    };
  }

  if (dailyCount >= CRITICAL_THRESHOLD) {
    return {
      canMakeRequest: true,
      status: 'critical',
      remainingRequests: remaining,
      warningMessage: `일일 한도 거의 도달 (${dailyCount}/${DAILY_REQUESTS}회 사용)`,
    };
  }

  if (dailyCount >= WARNING_THRESHOLD) {
    return {
      canMakeRequest: true,
      status: 'warning',
      remainingRequests: remaining,
      warningMessage: `사용량 주의 (${dailyCount}/${DAILY_REQUESTS}회 사용)`,
    };
  }

  return {
    canMakeRequest: true,
    status: 'ok',
    remainingRequests: remaining,
  };
}

/**
 * 🕐 다음 리셋 시간 계산
 */
export function getNextResetTime(): Date {
  const now = new Date();
  const resetTime = new Date();

  // 태평양 표준시 자정으로 설정
  resetTime.setHours(GOOGLE_AI_FREE_TIER_LIMITS.RESET_HOUR, 0, 0, 0);

  // 이미 지났다면 다음 날로
  if (resetTime <= now) {
    resetTime.setDate(resetTime.getDate() + 1);
  }

  return resetTime;
}

/**
 * 🎯 최적화 권장사항
 */
export const OPTIMIZATION_RECOMMENDATIONS = [
  '캐시 우선 사용으로 API 호출 최소화',
  'Local AI 모드를 기본으로 설정',
  '복잡한 쿼리만 Google AI 사용',
  '유사한 질문들을 배치로 처리',
  '일일 사용량 모니터링 강화',
  '태평양 표준시 자정 이후 사용량 리셋 활용',
] as const;