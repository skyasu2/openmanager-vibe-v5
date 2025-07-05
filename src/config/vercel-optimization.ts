/**
 * 🚀 Vercel 무료 한도 최적화 설정
 *
 * Google Cloud 백엔드 활용으로 Vercel 요청 수를 최소화하면서
 * 필요한 기능은 유지하는 스마트 최적화 전략
 */

// 🔍 Vercel 무료 한도 (월간)
export const VERCEL_FREE_LIMITS = {
  FUNCTION_INVOCATIONS: 100000, // 10만 회
  BANDWIDTH: 100 * 1024 * 1024 * 1024, // 100GB
  EDGE_REQUESTS: 1000000, // 100만 회
} as const;

// 📊 현재 예상 사용량 (비상 모드 제거 후)
export const CURRENT_USAGE_ESTIMATE = {
  HOURLY_REQUESTS: 540, // 30초 + 20초 + 35초 간격
  DAILY_REQUESTS: 13000, // 540 * 24
  MONTHLY_REQUESTS: 390000, // 13000 * 30
} as const;

// ⚡ 최적화된 폴링 간격 (사용량 70% 감소 목표)
export const OPTIMIZED_POLLING_INTERVALS = {
  // 🔄 시스템 상태 (중요도: 높음)
  SYSTEM_STATUS: 90000, // 30초 → 90초 (3배 증가)

  // 📊 실시간 서버 데이터 (중요도: 중간)
  REALTIME_SERVERS: 120000, // 20초 → 120초 (6배 증가)

  // 🗄️ 서버 데이터 스토어 (중요도: 낮음)
  SERVER_DATA_STORE: 180000, // 35초 → 180초 (5배 증가)

  // 📈 시스템 메트릭 (중요도: 낮음)
  SYSTEM_METRICS: 300000, // 5분 간격
} as const;

// 🎯 스마트 폴링 전략
export const SMART_POLLING_CONFIG = {
  // 🌅 활성 시간대 (한국 시간 기준)
  ACTIVE_HOURS: {
    START: 9, // 오전 9시
    END: 22, // 오후 10시
  },

  // 📅 활성 요일 (월-금)
  ACTIVE_DAYS: [1, 2, 3, 4, 5], // 월요일 = 1

  // ⚡ 활성 시간대 폴링 간격
  ACTIVE_INTERVALS: {
    SYSTEM_STATUS: 60000, // 1분
    REALTIME_SERVERS: 90000, // 1.5분
    SERVER_DATA_STORE: 120000, // 2분
  },

  // 😴 비활성 시간대 폴링 간격
  INACTIVE_INTERVALS: {
    SYSTEM_STATUS: 300000, // 5분
    REALTIME_SERVERS: 600000, // 10분
    SERVER_DATA_STORE: 900000, // 15분
  },
} as const;

// 🔄 Google Cloud 백엔드 활용 최적화
export const GCP_OPTIMIZATION_CONFIG = {
  // 🚀 GCP Functions 직접 호출로 Vercel 우회
  DIRECT_GCP_ENDPOINTS: {
    DASHBOARD: `${process.env.NEXT_PUBLIC_GCP_FUNCTIONS_BASE_URL}/dashboard`,
    UNIFIED_METRICS: `${process.env.NEXT_PUBLIC_GCP_FUNCTIONS_BASE_URL}/unified-metrics`,
    SERVER_STATUS: `${process.env.NEXT_PUBLIC_GCP_FUNCTIONS_BASE_URL}/server-status`,
  },

  // 📦 클라이언트 사이드 캐싱 강화
  CLIENT_CACHE: {
    SYSTEM_STATUS: 120000, // 2분 캐시
    SERVER_DATA: 180000, // 3분 캐시
    METRICS: 300000, // 5분 캐시
  },

  // 🎯 중요 데이터만 Vercel 경유
  VERCEL_ONLY_ENDPOINTS: [
    '/api/system/state', // 시스템 상태 (보안상 Vercel 경유)
    '/api/mcp/warmup', // MCP 상태 (로컬 처리)
  ],
} as const;

// 🔧 환경별 최적화 설정
export const getOptimizedConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercelDeployment = process.env.VERCEL === '1';

  if (isProduction && isVercelDeployment) {
    return {
      ...OPTIMIZED_POLLING_INTERVALS,
      USE_SMART_POLLING: true,
      USE_GCP_DIRECT: true,
      CACHE_AGGRESSIVE: true,
    };
  }

  // 개발 환경에서는 빠른 폴링 유지
  return {
    SYSTEM_STATUS: 30000,
    REALTIME_SERVERS: 20000,
    SERVER_DATA_STORE: 35000,
    USE_SMART_POLLING: false,
    USE_GCP_DIRECT: false,
    CACHE_AGGRESSIVE: false,
  };
};

// 🎯 현재 시간대 기반 폴링 간격 결정
export const getCurrentPollingInterval = (baseInterval: number): number => {
  const config = getOptimizedConfig();

  if (!config.USE_SMART_POLLING) {
    return baseInterval;
  }

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const isActiveHour =
    hour >= SMART_POLLING_CONFIG.ACTIVE_HOURS.START &&
    hour <= SMART_POLLING_CONFIG.ACTIVE_HOURS.END;
  const isActiveDay = SMART_POLLING_CONFIG.ACTIVE_DAYS.includes(
    day as 1 | 2 | 3 | 4 | 5
  );

  if (isActiveHour && isActiveDay) {
    // 활성 시간대: 기본 간격 사용
    return baseInterval;
  } else {
    // 비활성 시간대: 간격 5배 증가
    return baseInterval * 5;
  }
};

// 📊 사용량 추정 함수
export const estimateMonthlyUsage = (config: {
  SYSTEM_STATUS: number;
  REALTIME_SERVERS: number;
  SERVER_DATA_STORE: number;
}) => {
  const hourlyRequests =
    3600 / (config.SYSTEM_STATUS / 1000) +
    3600 / (config.REALTIME_SERVERS / 1000) +
    3600 / (config.SERVER_DATA_STORE / 1000);

  const dailyRequests = hourlyRequests * 24;
  const monthlyRequests = dailyRequests * 30;

  return {
    hourly: Math.round(hourlyRequests),
    daily: Math.round(dailyRequests),
    monthly: Math.round(monthlyRequests),
    utilizationPercent: Math.round(
      (monthlyRequests / VERCEL_FREE_LIMITS.FUNCTION_INVOCATIONS) * 100
    ),
  };
};

// 📈 실시간 사용량 모니터링
export const trackVercelUsage = () => {
  const config = getOptimizedConfig();
  const estimate = estimateMonthlyUsage(config);

  console.log('📊 Vercel 사용량 추정:', estimate);

  if (estimate.utilizationPercent > 80) {
    console.warn('⚠️ Vercel 사용량 80% 초과! 추가 최적화 필요');
  }

  return estimate;
};
