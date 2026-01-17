/**
 * 🎯 무료 티어 최적화 간격 설정
 *
 * 무료 티어 한계를 초과하지 않도록 각종 간격을 환경변수로 관리합니다.
 * 하드코딩 없이 유연하게 조정 가능한 구조입니다.
 */

/**
 * 환경변수에서 숫자 값을 안전하게 가져오는 헬퍼 함수
 */
import { logger } from '@/lib/logging';
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

/**
 * 🕐 폴링 및 업데이트 간격 설정
 */
export const FREE_TIER_INTERVALS = {
  // API 폴링 간격 (밀리초)
  API_POLLING_INTERVAL: getEnvNumber('API_POLLING_INTERVAL', 30000), // 기본값: 30초 (기존 5초에서 변경)

  // 캐시 TTL (초)
  CACHE_TTL_SECONDS: getEnvNumber('CACHE_TTL_SECONDS', 1800), // 기본값: 30분 (기존 5분에서 변경)

  // 실시간 데이터 업데이트 간격 (밀리초)
  REALTIME_UPDATE_INTERVAL: getEnvNumber('REALTIME_UPDATE_INTERVAL', 30000), // 기본값: 30초

  // WebSocket 하트비트 간격 (밀리초)
  WEBSOCKET_HEARTBEAT_INTERVAL: getEnvNumber(
    'WEBSOCKET_HEARTBEAT_INTERVAL',
    45000
  ), // 기본값: 45초

  // 데이터 수집 간격 (밀리초)
  DATA_COLLECTION_INTERVAL: getEnvNumber('DATA_COLLECTION_INTERVAL', 300000), // 기본값: 5분

  // 헬스체크 간격 (밀리초) - 웜업 3단계 이후에만 동작
  // 🔧 최적화: 시스템 시작 전 헬스체크 비활성화, 5분 간격으로 최소화
  HEALTH_CHECK_INTERVAL: getEnvNumber('HEALTH_CHECK_INTERVAL', 300000), // 기본값: 5분

  // 메트릭 수집 간격 (밀리초)
  METRICS_COLLECTION_INTERVAL: getEnvNumber(
    'METRICS_COLLECTION_INTERVAL',
    60000
  ), // 기본값: 1분
} as const;

/**
 * 🎯 무료 티어 한계
 */
export const FREE_TIER_LIMITS = {
  // Vercel
  VERCEL_BANDWIDTH_GB: 100, // 100GB/월
  VERCEL_BUILD_MINUTES: 6000, // 100시간/월

  // Supabase
  SUPABASE_STORAGE_MB: 500, // 500MB
  SUPABASE_MONTHLY_REQUESTS: 500000, // 50만 요청/월

  // Upstash Redis
  UPSTASH_COMMANDS_PER_MONTH: 500000, // 50만 명령/월
  UPSTASH_STORAGE_MB: 256, // 256MB

  // Cloud Run (AI Engine)
  CLOUD_RUN_INVOCATIONS_PER_MONTH: 2000000, // 200만 호출/월
  CLOUD_RUN_GB_SECONDS: 400000, // 400,000 GB-초
} as const;

/**
 * 📊 예상 사용량 계산
 */
export function calculateExpectedUsage() {
  const secondsPerMonth = 30 * 24 * 60 * 60; // 약 2,592,000초

  // API 폴링 횟수/월
  const apiCallsPerMonth =
    secondsPerMonth / (FREE_TIER_INTERVALS.API_POLLING_INTERVAL / 1000);

  // 캐시 미스율 가정 (20%)
  const cacheMissRate = 0.2;
  const actualApiCallsPerMonth = apiCallsPerMonth * cacheMissRate;

  // Redis 명령 횟수/월 (get, set, expire 각각 계산)
  const redisCommandsPerApiCall = 3; // get, set, expire
  const redisCommandsPerMonth = apiCallsPerMonth * redisCommandsPerApiCall;

  return {
    apiCallsPerMonth: Math.round(apiCallsPerMonth),
    actualApiCallsPerMonth: Math.round(actualApiCallsPerMonth),
    redisCommandsPerMonth: Math.round(redisCommandsPerMonth),

    // 사용률 계산
    cloudRunUsagePercent:
      (actualApiCallsPerMonth / FREE_TIER_LIMITS.CLOUD_RUN_INVOCATIONS_PER_MONTH) *
      100,
    redisUsagePercent:
      (redisCommandsPerMonth / FREE_TIER_LIMITS.UPSTASH_COMMANDS_PER_MONTH) *
      100,
  };
}

/**
 * 📊 절감률 계산 (기존 대비)
 */
export function calculateSavings() {
  const oldIntervals = {
    API_POLLING_INTERVAL: 5000, // 5초
    CACHE_TTL_SECONDS: 300, // 5분
  };

  const secondsPerMonth = 30 * 24 * 60 * 60;

  // 기존 사용량
  const oldApiCallsPerMonth =
    secondsPerMonth / (oldIntervals.API_POLLING_INTERVAL / 1000);
  const oldCacheMissRate = 0.8; // 캐시 TTL이 짧아서 미스율이 높음
  const oldActualApiCallsPerMonth = oldApiCallsPerMonth * oldCacheMissRate;

  // 새로운 사용량
  const newUsage = calculateExpectedUsage();

  // 절감률
  const apiCallSavings =
    ((oldActualApiCallsPerMonth - newUsage.actualApiCallsPerMonth) /
      oldActualApiCallsPerMonth) *
    100;
  const redisCommandSavings =
    ((oldApiCallsPerMonth * 3 - newUsage.redisCommandsPerMonth) /
      (oldApiCallsPerMonth * 3)) *
    100;

  return {
    oldMonthlyApiCalls: Math.round(oldActualApiCallsPerMonth),
    newMonthlyApiCalls: newUsage.actualApiCallsPerMonth,
    apiCallSavingsPercent: Math.round(apiCallSavings),
    redisCommandSavingsPercent: Math.round(redisCommandSavings),
  };
}

/**
 * 🎯 동적 간격 조정 (사용률 기반)
 */
export function getDynamicInterval(
  baseInterval: number,
  usagePercent: number
): number {
  // 사용률이 높을수록 간격을 늘림
  if (usagePercent > 80) {
    return baseInterval * 2; // 2배 증가
  } else if (usagePercent > 60) {
    return baseInterval * 1.5; // 1.5배 증가
  }
  return baseInterval;
}

/**
 * 📊 간격 설정 검증
 */
export function validateIntervals(): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // 최소 간격 검증
  if (FREE_TIER_INTERVALS.API_POLLING_INTERVAL < 10000) {
    warnings.push('API 폴링 간격이 10초 미만입니다. 무료 티어 한계 초과 위험');
  }

  if (FREE_TIER_INTERVALS.CACHE_TTL_SECONDS < 300) {
    warnings.push('캐시 TTL이 5분 미만입니다. Redis 명령 횟수 증가 위험');
  }

  // 예상 사용량 검증
  const usage = calculateExpectedUsage();
  if (usage.cloudRunUsagePercent > 80) {
    warnings.push(
      `Cloud Run 사용률이 ${Math.round(usage.cloudRunUsagePercent)}%로 높습니다`
    );
  }

  if (usage.redisUsagePercent > 80) {
    warnings.push(
      `Redis 사용률이 ${Math.round(usage.redisUsagePercent)}%로 높습니다`
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

// 설정 검증 및 로깅
if (typeof window === 'undefined') {
  const validation = validateIntervals();
  const usage = calculateExpectedUsage();
  const savings = calculateSavings();

  logger.info('🎯 무료 티어 최적화 설정:');
  logger.info(
    `  API 폴링: ${FREE_TIER_INTERVALS.API_POLLING_INTERVAL / 1000}초`
  );
  logger.info(`  캐시 TTL: ${FREE_TIER_INTERVALS.CACHE_TTL_SECONDS / 60}분`);
  logger.info(
    `  예상 월간 API 호출: ${usage.actualApiCallsPerMonth.toLocaleString()}회`
  );
  logger.info(`  Cloud Run 사용률: ${usage.cloudRunUsagePercent.toFixed(1)}%`);
  logger.info(`  Redis 사용률: ${usage.redisUsagePercent.toFixed(1)}%`);
  logger.info('\n💰 절감 효과:');
  logger.info(`  API 호출 감소: ${savings.apiCallSavingsPercent}%`);
  logger.info(`  Redis 명령 감소: ${savings.redisCommandSavingsPercent}%`);

  if (!validation.isValid) {
    logger.warn('\n⚠️ 경고:');
    validation.warnings.forEach((warning) => logger.warn(`  - ${warning}`));
  }
}
