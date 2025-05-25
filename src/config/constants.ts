/**
 * System Constants Configuration
 * 
 * 🔧 모든 하드코딩된 상수들을 중앙에서 관리
 */

// 🌐 네트워크 설정
export const NETWORK = {
  PORTS: {
    DEFAULT_HTTP: 80,
    DEFAULT_HTTPS: 443,
    REDIS_DEFAULT: 6379,
    PROMETHEUS_DEFAULT: 9090,
    CUSTOM_API_DEFAULT: 8080,
    NODE_EXPORTER: 9100,
    GRAFANA_DEFAULT: 3000
  },
  
  TIMEOUTS: {
    API_REQUEST: 10000,      // 10초
    HEALTH_CHECK: 5000,      // 5초
    WEBSOCKET: 30000,        // 30초
    DATABASE: 15000          // 15초
  },

  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MS: 1000,        // 1초
    EXPONENTIAL_BASE: 2
  }
} as const;

// ⏰ 시간 관련 상수
export const TIME = {
  MILLISECONDS: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000
  },

  SECONDS: {
    MINUTE: 60,
    HOUR: 3600,
    DAY: 86400,
    WEEK: 604800
  },

  // 세션 및 캐시 TTL
  TTL: {
    SESSION: 24 * 60 * 60,      // 24시간 (초)
    CACHE_SHORT: 5 * 60,        // 5분 (초)
    CACHE_MEDIUM: 30 * 60,      // 30분 (초)
    CACHE_LONG: 60 * 60,        // 1시간 (초)
    REDIS_DEFAULT: 300          // 5분 (초)
  },

  // 업무 시간 설정
  BUSINESS_HOURS: {
    START: 9,    // 오전 9시
    END: 18,     // 오후 6시
    LUNCH_START: 12,
    LUNCH_END: 13
  }
} as const;

// 📊 데이터 제한
export const LIMITS = {
  // 페이지네이션
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 1
  },

  // 문자열 길이
  STRING: {
    MAX_URL_LENGTH: 2048,
    MAX_HEADER_SIZE: 8192,
    MAX_QUERY_LENGTH: 1000,
    MAX_MESSAGE_LENGTH: 5000
  },

  // 파일 크기
  FILE: {
    MAX_PAYLOAD_SIZE: 1024 * 1024,    // 1MB
    MAX_LOG_SIZE: 10 * 1024 * 1024,   // 10MB
    MAX_UPLOAD_SIZE: 50 * 1024 * 1024 // 50MB
  },

  // 컬렉션 크기
  COLLECTION: {
    MAX_HISTORY_LENGTH: 50,
    MAX_SESSIONS: 10,
    MAX_LOGS: 10000,
    MAX_METRICS_POINTS: 1000,
    MAX_ALERTS_PER_HOUR: 50
  },

  // 성능 관련
  PERFORMANCE: {
    MAX_ITERATIONS: 100,
    SLOW_QUERY_MS: 3000,
    MEMORY_WARNING_PERCENT: 80,
    CPU_WARNING_PERCENT: 70
  }
} as const;

// 🖥️ 화면 크기 브레이크포인트
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
  LARGE: 1536
} as const;

// 🎨 UI 상수
export const UI = {
  ANIMATION: {
    DURATION_FAST: 150,      // 0.15초
    DURATION_NORMAL: 300,    // 0.3초
    DURATION_SLOW: 500,      // 0.5초
    DELAY_INCREMENT: 100     // 0.1초씩 증가
  },

  COLORS: {
    STATUS: {
      SUCCESS: '#10B981',    // green-500
      WARNING: '#F59E0B',    // amber-500
      ERROR: '#EF4444',      // red-500
      INFO: '#3B82F6'        // blue-500
    }
  },

  SIZES: {
    BUTTON_MIN_HEIGHT: 44,   // 터치 친화적 최소 크기
    MODAL_MIN_WIDTH: 300,
    MODAL_MAX_WIDTH: 800,
    SIDEBAR_WIDTH: 384       // 24rem
  }
} as const;

// 🔐 보안 설정
export const SECURITY = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false
  },

  SESSION: {
    MAX_AGE_HOURS: 24,
    REFRESH_THRESHOLD_HOURS: 2,
    MAX_CONCURRENT_SESSIONS: 5
  },

  RATE_LIMIT: {
    API_REQUESTS_PER_MINUTE: 60,
    LOGIN_ATTEMPTS_PER_HOUR: 5,
    PASSWORD_RESET_PER_DAY: 3
  }
} as const;

// 📈 모니터링 설정
export const MONITORING = {
  INTERVALS: {
    HEALTH_CHECK_MS: 30000,     // 30초
    METRICS_COLLECTION_MS: 60000, // 1분
    LOG_ROTATION_MS: 3600000,   // 1시간
    CLEANUP_MS: 86400000        // 24시간
  },

  RETENTION: {
    METRICS_DAYS: 30,
    LOGS_DAYS: 7,
    ALERTS_DAYS: 90,
    SESSIONS_HOURS: 24
  },

  BATCH_SIZES: {
    METRICS_BATCH: 100,
    LOGS_BATCH: 50,
    ALERTS_BATCH: 20
  }
} as const;

// 🌍 환경별 설정
export const ENVIRONMENT = {
  DEVELOPMENT: {
    LOG_LEVEL: 'debug',
    ENABLE_MOCK_DATA: true,
    CACHE_DISABLED: true
  },
  
  PRODUCTION: {
    LOG_LEVEL: 'error',
    ENABLE_MOCK_DATA: false,
    CACHE_DISABLED: false
  },

  TEST: {
    LOG_LEVEL: 'silent',
    ENABLE_MOCK_DATA: true,
    CACHE_DISABLED: true
  }
} as const;

// 🔧 유틸리티 함수들
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENT[env as keyof typeof ENVIRONMENT] || ENVIRONMENT.DEVELOPMENT;
};

export const isBusinessHour = (hour: number = new Date().getHours()): boolean => {
  return hour >= TIME.BUSINESS_HOURS.START && hour < TIME.BUSINESS_HOURS.END;
};

export const isMobileScreen = (width: number): boolean => {
  return width < BREAKPOINTS.MOBILE;
};

export const isTabletScreen = (width: number): boolean => {
  return width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.DESKTOP;
};

// 타입 정의
export type NetworkPort = typeof NETWORK.PORTS[keyof typeof NETWORK.PORTS];
export type TimeConstant = typeof TIME.MILLISECONDS[keyof typeof TIME.MILLISECONDS];
export type UISize = typeof UI.SIZES[keyof typeof UI.SIZES]; 