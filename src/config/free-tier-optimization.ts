/**
 * 🆓 무료티어 최적화 설정
 *
 * Vercel Hobby, Supabase Free, Upstash Free, Google AI Free 한도 내에서
 * 안전하게 동작하도록 최적화된 설정
 */

// ============================================
// 🎯 무료티어 제한사항 정의
// ============================================

export const FREE_TIER_LIMITS = {
  // 🔴 Vercel Hobby Plan
  vercel: {
    maxMemory: 50, // MB
    maxDuration: 10, // seconds
    maxConcurrentRequests: 10,
    maxExecutions: 100_000, // per month
    maxBandwidth: 100, // GB per month
    maxFunctions: 12, // serverless functions
    maxEdgeFunctions: 0, // 무료 플랜은 Edge Functions 없음
  },

  // 🟢 Supabase Free Plan
  supabase: {
    maxDatabase: 0.5, // GB
    maxBandwidth: 5, // GB per month
    maxRequests: 50_000, // per month
    maxStorage: 1, // GB
    maxRealtimeConnections: 2, // concurrent
    maxRows: 500_000, // per table
  },

  // 🟡 Upstash Redis Free Plan
  redis: {
    maxMemory: 256, // MB
    maxCommands: 10_000, // per day
    maxConnections: 20, // concurrent
    maxBandwidth: 100, // MB per day
    maxDatabases: 1,
  },

  // 🔵 Google AI Free Plan
  googleAI: {
    maxRequests: 1_500, // per day
    maxTokens: 1_000_000, // per day
    maxRPM: 15, // requests per minute
    maxTPM: 32_000, // tokens per minute
    maxConcurrent: 2, // concurrent requests
  },
};

// ============================================
// 🚀 무료티어 최적화 전략
// ============================================

export const FREE_TIER_OPTIMIZATION = {
  // 🎯 서버리스 함수 최적화
  serverless: {
    // 메모리 사용량 최적화
    enableMemoryOptimization: true,
    maxMemoryPerFunction: 40, // MB (안전 여유분 10MB)

    // 실행 시간 최적화
    maxExecutionTime: 8, // seconds (안전 여유분 2초)
    enableTimeoutProtection: true,

    // 동시 실행 제한
    maxConcurrentExecutions: 5, // 안전 여유분 50%
    enableConcurrencyControl: true,

    // 배치 처리 최적화
    batchSize: 2, // 작은 배치로 메모리 절약
    enableBatchProcessing: true,
  },

  // 🗄️ 데이터베이스 최적화
  database: {
    // 쿼리 최적화
    maxQueryLimit: 10, // 한 번에 최대 10개만 조회
    enableQueryOptimization: true,

    // 캐싱 전략
    enableCaching: true,
    cacheDuration: 300, // 5분
    maxCacheSize: 5, // MB

    // 연결 풀 최적화
    maxConnections: 2, // 동시 연결 2개로 제한
    connectionTimeout: 5000, // 5초

    // 실시간 기능 제한
    enableRealtime: false, // 무료 플랜에서는 실시간 기능 비활성화
  },

  // 🔄 Redis 최적화
  redis: {
    // 명령어 사용량 최적화
    maxCommandsPerHour: 400, // 시간당 400개 (일일 한도 10,000개)
    enableCommandThrottling: true,

    // 메모리 사용량 최적화
    maxMemoryUsage: 200, // MB (안전 여유분 56MB)
    enableMemoryManagement: true,

    // 연결 최적화
    maxConnections: 10, // 동시 연결 10개로 제한
    connectionPoolSize: 5,

    // TTL 최적화
    defaultTTL: 3600, // 1시간
    enableAutoExpiration: true,
  },

  // 🤖 AI 서비스 최적화
  ai: {
    // Google AI 할당량 보호
    maxRequestsPerDay: 1000, // 일일 1000개 (안전 여유분 500개)
    maxRequestsPerMinute: 10, // 분당 10개 (안전 여유분 5개)

    // 토큰 사용량 최적화
    maxTokensPerRequest: 1000, // 요청당 최대 1000토큰
    maxTokensPerDay: 800_000, // 일일 800,000토큰

    // 동시 요청 제한
    maxConcurrentRequests: 1, // 동시 요청 1개로 제한
    enableRateLimiting: true,

    // 응답 캐싱
    enableResponseCaching: true,
    cacheExpiryHours: 24, // 24시간 캐싱
  },
};

// ============================================
// 🛡️ 안전 장치 설정
// ============================================

export const SAFETY_MECHANISMS = {
  // 🚨 사용량 모니터링
  monitoring: {
    enableUsageTracking: true,
    alertThresholds: {
      memory: 80, // 80% 사용 시 경고
      duration: 80, // 80% 실행 시간 사용 시 경고
      requests: 80, // 80% 할당량 사용 시 경고
    },

    // 자동 차단 임계값
    shutdownThresholds: {
      memory: 95, // 95% 사용 시 자동 차단
      duration: 95, // 95% 실행 시간 사용 시 자동 차단
      requests: 95, // 95% 할당량 사용 시 자동 차단
    },
  },

  // 🔧 자동 복구 메커니즘
  recovery: {
    enableAutoRecovery: true,
    retryAttempts: 3,
    retryDelay: 1000, // 1초

    // 폴백 전략
    enableFallbackMode: true,
    fallbackToMockData: true,
    fallbackToCache: true,
  },

  // 🏁 Graceful Degradation
  degradation: {
    enableGracefulDegradation: true,

    // 기능 우선순위 (높은 순)
    featurePriority: [
      'core_data_generation',
      'basic_ai_features',
      'realtime_updates',
      'advanced_analytics',
      'ai_predictions',
      'monitoring_features',
    ],

    // 단계별 비활성화
    degradationSteps: {
      level1: ['monitoring_features'], // 80% 사용량
      level2: ['ai_predictions', 'advanced_analytics'], // 85% 사용량
      level3: ['realtime_updates'], // 90% 사용량
      level4: ['basic_ai_features'], // 95% 사용량
      level5: [], // 99% 사용량 - 코어 기능만 유지
    },
  },
};

// ============================================
// 🎯 환경별 설정
// ============================================

export const ENVIRONMENT_CONFIG = {
  // 🏠 로컬 개발 환경
  development: {
    ...FREE_TIER_OPTIMIZATION,
    // 개발 환경에서는 제한 완화
    serverless: {
      ...FREE_TIER_OPTIMIZATION.serverless,
      maxMemoryPerFunction: 100, // 개발 시 더 많은 메모리
      maxExecutionTime: 30, // 개발 시 더 긴 실행 시간
    },
    ai: {
      ...FREE_TIER_OPTIMIZATION.ai,
      maxRequestsPerDay: 100, // 개발 시 적은 요청
      enableResponseCaching: false, // 개발 시 캐싱 비활성화
    },
  },

  // 🌐 프로덕션 환경
  production: {
    ...FREE_TIER_OPTIMIZATION,
    // 프로덕션 환경에서는 최대 제한
    serverless: {
      ...FREE_TIER_OPTIMIZATION.serverless,
      maxMemoryPerFunction: 35, // 더 엄격한 메모리 제한
      maxExecutionTime: 7, // 더 엄격한 실행 시간 제한
    },
    ai: {
      ...FREE_TIER_OPTIMIZATION.ai,
      maxRequestsPerDay: 800, // 프로덕션에서 더 많은 요청
      enableResponseCaching: true, // 프로덕션에서 캐싱 활성화
    },
  },

  // 🧪 테스트 환경
  test: {
    ...FREE_TIER_OPTIMIZATION,
    // 테스트 환경에서는 모든 외부 서비스 비활성화
    database: {
      ...FREE_TIER_OPTIMIZATION.database,
      enableRealtime: false,
      enableCaching: false,
    },
    redis: {
      ...FREE_TIER_OPTIMIZATION.redis,
      enableCommandThrottling: false,
      enableMemoryManagement: false,
    },
    ai: {
      ...FREE_TIER_OPTIMIZATION.ai,
      maxRequestsPerDay: 0, // 테스트에서는 AI 호출 금지
      enableResponseCaching: false,
    },
  },
};

// ============================================
// 📊 사용량 추적 유틸리티
// ============================================

export class FreeTierUsageTracker {
  private usage = {
    vercel: { requests: 0, memory: 0, duration: 0 },
    supabase: { requests: 0, bandwidth: 0, rows: 0 },
    redis: { commands: 0, memory: 0, connections: 0 },
    googleAI: { requests: 0, tokens: 0, concurrent: 0 },
  };

  private lastReset = Date.now();
  private readonly RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24시간

  /**
   * 사용량 추적
   */
  trackUsage(service: keyof typeof this.usage, metric: string, value: number) {
    // 일일 리셋 체크
    if (Date.now() - this.lastReset > this.RESET_INTERVAL) {
      this.resetDailyUsage();
    }

    // 사용량 기록
    const serviceUsage = this.usage[service];
    if (serviceUsage && metric in serviceUsage) {
      const usageRecord = serviceUsage as Record<string, number>;
      if (usageRecord[metric] !== undefined) {
        usageRecord[metric] += value;
      }
    }
  }

  /**
   * 한도 초과 체크
   */
  checkLimits(): { exceeded: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let exceeded = false;

    // Vercel 체크
    if (
      this.usage.vercel.requests >
      FREE_TIER_LIMITS.vercel.maxExecutions * 0.8
    ) {
      warnings.push('Vercel 실행 횟수 80% 초과');
    }

    // Supabase 체크
    if (
      this.usage.supabase.requests >
      FREE_TIER_LIMITS.supabase.maxRequests * 0.8
    ) {
      warnings.push('Supabase 요청 수 80% 초과');
    }

    // Redis 체크
    if (this.usage.redis.commands > FREE_TIER_LIMITS.redis.maxCommands * 0.8) {
      warnings.push('Redis 명령어 수 80% 초과');
    }

    // Google AI 체크
    if (
      this.usage.googleAI.requests >
      FREE_TIER_LIMITS.googleAI.maxRequests * 0.8
    ) {
      warnings.push('Google AI 요청 수 80% 초과');
      exceeded = true;
    }

    return { exceeded, warnings };
  }

  /**
   * 일일 사용량 리셋
   */
  private resetDailyUsage() {
    this.usage = {
      vercel: { requests: 0, memory: 0, duration: 0 },
      supabase: { requests: 0, bandwidth: 0, rows: 0 },
      redis: { commands: 0, memory: 0, connections: 0 },
      googleAI: { requests: 0, tokens: 0, concurrent: 0 },
    };
    this.lastReset = Date.now();
  }

  /**
   * 현재 사용량 조회
   */
  getCurrentUsage() {
    return {
      ...this.usage,
      lastReset: this.lastReset,
      nextReset: this.lastReset + this.RESET_INTERVAL,
    };
  }
}

// ============================================
// 🛠️ 최적화 유틸리티
// ============================================

export class FreeTierOptimizer {
  private usageTracker = new FreeTierUsageTracker();

  /**
   * 현재 환경에 맞는 설정 반환
   */
  getEnvironmentConfig() {
    const env = process.env.NODE_ENV || 'development';
    return ENVIRONMENT_CONFIG[env] || ENVIRONMENT_CONFIG.development;
  }

  /**
   * 메모리 사용량 체크
   */
  checkMemoryUsage(): { safe: boolean; usage: number; limit: number } {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapUsed + memUsage.external;
    const totalMemoryMB = totalMemory / (1024 * 1024);
    const limit = FREE_TIER_LIMITS.vercel.maxMemory;

    return {
      safe: totalMemoryMB < limit * 0.8,
      usage: totalMemoryMB,
      limit: limit,
    };
  }

  /**
   * 실행 시간 체크
   */
  checkExecutionTime(startTime: number): {
    safe: boolean;
    duration: number;
    limit: number;
  } {
    const duration = (Date.now() - startTime) / 1000;
    const limit = FREE_TIER_LIMITS.vercel.maxDuration;

    return {
      safe: duration < limit * 0.8,
      duration: duration,
      limit: limit,
    };
  }

  /**
   * 안전 종료 체크
   */
  shouldGracefullyExit(): boolean {
    const memCheck = this.checkMemoryUsage();
    const limitCheck = this.usageTracker.checkLimits();

    return !memCheck.safe || limitCheck.exceeded;
  }
}

// ============================================
// 📥 내보내기
// ============================================

export const freeTierOptimizer = new FreeTierOptimizer();
export const freeTierUsageTracker = new FreeTierUsageTracker();

// 전역 설정
export const CURRENT_CONFIG = freeTierOptimizer.getEnvironmentConfig();
