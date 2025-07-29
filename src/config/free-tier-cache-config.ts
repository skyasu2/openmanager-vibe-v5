/**
 * 💰 무료 티어 최적화 캐시 설정
 *
 * Upstash Redis 무료 한도:
 * - 메모리: 256MB
 * - 일일 명령어: 10,000개
 * - 월간 대역폭: 200MB
 * - 연결 수: 20개 동시
 */

export const FREE_TIER_CACHE_CONFIG = {
  // 📊 캐시 TTL 설정 (무료 한도 최적화)
  ttl: {
    // 자주 사용하는 데이터 (긴 TTL)
    staticData: 24 * 60 * 60, // 24시간
    serverMetrics: process.env.CACHE_TTL_SECONDS
      ? parseInt(process.env.CACHE_TTL_SECONDS)
      : 30 * 60, // 환경변수 우선, 기본값: 30분
    healthCheck: 10 * 60, // 10분

    // 실시간성이 중요한 데이터 (짧은 TTL)
    liveStatus: 30, // 30초
    alerts: 1 * 60, // 1분
    apiResponse: process.env.CACHE_TTL_SECONDS
      ? parseInt(process.env.CACHE_TTL_SECONDS)
      : 30 * 60, // 환경변수 우선, 기본값: 30분

    // AI 관련 캐시
    aiResponse: 15 * 60, // 15분
    ragResults: 30 * 60, // 30분
    aiAnalysis: 60 * 60, // 1시간
  },

  // 🎯 최대 데이터 크기 제한 (메모리 절약)
  maxSize: {
    singleKey: 10 * 1024, // 10KB per key
    totalCache: 200 * 1024 * 1024, // 200MB (무료 한도의 80%)
    aiResponse: 5 * 1024, // 5KB per AI response
    metrics: 2 * 1024, // 2KB per metric
  },

  // ⚡ 압축 설정
  compression: {
    enabled: true,
    threshold: 1024, // 1KB 이상 데이터 압축
    level: 6, // gzip 압축 레벨 (속도와 용량의 균형)
  },

  // 🔄 자동 정리 설정
  cleanup: {
    enabled: true,
    intervalMinutes: 30, // 30분마다 정리
    maxKeys: 5000, // 최대 5000개 키 유지
    oldestFirstPolicy: true, // 오래된 것부터 삭제
  },

  // 📈 사용량 모니터링
  monitoring: {
    trackUsage: true,
    dailyLimit: 8000, // 일일 명령어 8000개 (80% 한도)
    alertThreshold: 0.8, // 80% 도달 시 알림
    memoryThreshold: 0.85, // 85% 메모리 사용 시 알림
  },

  // 🎯 키 네이밍 규칙 (효율적 관리)
  keyPrefix: {
    server: 'srv:',
    metrics: 'met:',
    ai: 'ai:',
    cache: 'cache:',
    health: 'health:',
    alerts: 'alert:',
    temp: 'tmp:', // 임시 데이터 (짧은 TTL)
  },

  // 🚀 성능 최적화
  performance: {
    batchSize: 50, // 배치 작업 최대 50개
    pipelining: true, // 파이프라이닝 활성화
    maxConnections: 10, // 최대 10개 동시 연결 (무료 한도의 50%)
    connectionTimeout: 5000, // 5초 타임아웃
    retryAttempts: 2, // 최대 2번 재시도
  },

  // 🔐 보안 설정
  security: {
    encryptSensitiveData: true,
    keyRotation: false, // 무료 한도에서는 비활성화
    accessLogging: true,
  },
};

/**
 * 무료 티어 캐시 키 생성 도우미
 */
export function createCacheKey(
  prefix: keyof typeof FREE_TIER_CACHE_CONFIG.keyPrefix,
  identifier: string,
  suffix?: string
): string {
  const prefixValue = FREE_TIER_CACHE_CONFIG.keyPrefix[prefix];
  const key = `${prefixValue}${identifier}`;
  return suffix ? `${key}:${suffix}` : key;
}

/**
 * 데이터 크기 체크
 */
export function validateDataSize(
  data: any,
  type: keyof typeof FREE_TIER_CACHE_CONFIG.maxSize
): boolean {
  const serialized = JSON.stringify(_data);
  const size = new TextEncoder().encode(serialized).length;
  const maxSize = FREE_TIER_CACHE_CONFIG.maxSize[type];

  if (size > maxSize) {
    console.warn(`⚠️ 데이터 크기 초과: ${size}bytes > ${maxSize}bytes`);
    return false;
  }

  return true;
}

/**
 * TTL 가져오기
 */
export function getTTL(type: keyof typeof FREE_TIER_CACHE_CONFIG.ttl): number {
  return FREE_TIER_CACHE_CONFIG.ttl[type];
}

/**
 * 압축 여부 결정
 */
export function shouldCompress(data: any): boolean {
  if (!FREE_TIER_CACHE_CONFIG.compression.enabled) return false;

  const size = new TextEncoder().encode(JSON.stringify(_data)).length;
  return size >= FREE_TIER_CACHE_CONFIG.compression.threshold;
}
