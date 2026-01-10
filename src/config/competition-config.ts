/**
 * 🏆 경연대회 전용 환경 설정
 *
 * 특징:
 * - Vercel 유료 + Redis/Supabase 무료 티어 최적화
 * - 20분 자동 종료 시스템
 * - 스마트 온오프 기능
 * - 리소스 사용량 최소화
 */

import { logger } from '@/lib/logging';
export interface CompetitionConfig {
  mode: 'competition' | 'demo' | 'production';
  environment: {
    vercelTier: 'hobby' | 'pro' | 'enterprise';
    redisTier: 'free' | 'paid';
    supabaseTier: 'free' | 'paid';
  };
  limits: {
    maxServers: number;
    maxDuration: number; // 분 단위
    redisCommands: number; // 일일 한도
    supabaseStorage: number; // MB 단위
  };
  features: {
    autoShutdown: boolean;
    smartOnOff: boolean;
    resourceMonitoring: boolean;
    realTimeOptimization: boolean;
  };
  performance: {
    dataGenerationInterval: number;
    cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
    batchSize: number;
  };
}

/**
 * 🎯 경연대회 기본 설정
 */
export const COMPETITION_DEFAULTS: CompetitionConfig = {
  mode: 'competition',
  environment: {
    vercelTier: 'pro', // 경연대회는 유료
    redisTier: 'free',
    supabaseTier: 'free',
  },
  limits: {
    maxServers: 12, // Vercel Pro 기준 최적화
    maxDuration: 20, // 20분 자동 종료
    redisCommands: 8000, // 10K 한도의 80% 안전 마진
    supabaseStorage: 400, // 500MB 한도의 80% 안전 마진
  },
  features: {
    autoShutdown: true,
    smartOnOff: true,
    resourceMonitoring: true,
    realTimeOptimization: true,
  },
  performance: {
    dataGenerationInterval: 8000, // 8초 간격 (Redis 절약)
    cacheStrategy: 'aggressive',
    batchSize: 5, // 소량 배치로 안정성 확보
  },
};

/**
 * 🔧 Vercel 티어별 설정
 */
export const VERCEL_TIER_CONFIGS = {
  hobby: {
    maxServers: 6,
    memoryLimit: 256,
    functionTimeout: 10,
    features: {
      websocket: false,
      advancedAnalytics: false,
      aiProcessing: 'basic',
    },
  },
  pro: {
    maxServers: 12,
    memoryLimit: 1024,
    functionTimeout: 60,
    features: {
      websocket: true,
      advancedAnalytics: true,
      aiProcessing: 'enhanced',
    },
  },
  enterprise: {
    maxServers: 24,
    memoryLimit: 3008,
    functionTimeout: 300,
    features: {
      websocket: true,
      advancedAnalytics: true,
      aiProcessing: 'full',
    },
  },
} as const;

/**
 * 🌟 환경 감지 및 설정 반환
 */
export function getCompetitionConfig(): CompetitionConfig {
  const isCompetition = process.env.COMPETITION_MODE === 'true';
  const vercelTier = detectVercelTier();

  if (!isCompetition) {
    return {
      ...COMPETITION_DEFAULTS,
      mode: 'demo',
      limits: {
        ...COMPETITION_DEFAULTS.limits,
        maxDuration: 0, // 무제한
      },
      features: {
        ...COMPETITION_DEFAULTS.features,
        autoShutdown: false,
      },
    };
  }

  const tierConfig = VERCEL_TIER_CONFIGS[vercelTier];

  return {
    ...COMPETITION_DEFAULTS,
    environment: {
      ...COMPETITION_DEFAULTS.environment,
      vercelTier,
    },
    limits: {
      ...COMPETITION_DEFAULTS.limits,
      maxServers: tierConfig.maxServers,
    },
  };
}

/**
 * 🔍 Vercel 티어 감지
 */
function detectVercelTier(): 'hobby' | 'pro' | 'enterprise' {
  // 환경 변수에서 직접 확인
  const explicitTier = process.env.VERCEL_TIER;
  if (explicitTier && ['hobby', 'pro', 'enterprise'].includes(explicitTier)) {
    return explicitTier as 'hobby' | 'pro' | 'enterprise';
  }

  // 메모리 제한으로 추정
  const memoryLimit = parseInt(
    process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || '1024'
  );
  if (memoryLimit >= 3008) return 'enterprise';
  if (memoryLimit >= 1024) return 'pro';
  return 'hobby';
}

/**
 * 🔄 동적 설정 업데이트
 */
export class CompetitionConfigManager {
  private config: CompetitionConfig;
  private startTime: Date;
  private isActive: boolean = false;

  constructor() {
    this.config = getCompetitionConfig();
    this.startTime = new Date();
    // 자동 종료는 useUnifiedAdminStore에서 중앙 관리
  }

  /**
   * 🛑 시스템 종료 (수동 호출용)
   */
  shutdown(): void {
    this.isActive = false;

    // 글로벌 종료 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('competition-shutdown'));
    }

    // Node.js 환경에서 프로세스 종료 신호
    if (typeof process !== 'undefined') {
      process.emit('SIGTERM' as NodeJS.Signals);
    }
  }

  /**
   * 📊 현재 상태 확인
   */
  getStatus() {
    const runningTime = Date.now() - this.startTime.getTime();
    const remainingTime =
      this.config.limits.maxDuration * 60 * 1000 - runningTime;

    return {
      isActive: this.isActive,
      mode: this.config.mode,
      vercelTier: this.config.environment.vercelTier,
      runningTime: Math.floor(runningTime / 1000), // 초 단위
      remainingTime: Math.max(0, Math.floor(remainingTime / 1000)), // 초 단위
      config: this.config,
    };
  }

  /**
   * 🎮 활성 상태 전환
   */
  toggleActive(active: boolean): void {
    this.isActive = active;
    logger.info(`🎯 경연대회 모드: ${active ? '활성화' : '비활성화'}`);
  }

  /**
   * ⚙️ 실시간 설정 최적화
   */
  optimizeForUsage(metrics: {
    activeUsers: number;
    redisCommandsUsed: number;
    memoryUsage: number;
  }): void {
    if (!this.config.features.realTimeOptimization) return;

    // Redis 사용량 기반 최적화
    const redisUsagePercent =
      metrics.redisCommandsUsed / this.config.limits.redisCommands;
    if (redisUsagePercent > 0.8) {
      this.config.performance.dataGenerationInterval += 2000; // 간격 증가
      logger.info('🔻 Redis 사용량 높음 - 데이터 생성 간격 증가');
    }

    // 사용자 없을 때 절전 모드
    if (metrics.activeUsers === 0 && this.config.features.smartOnOff) {
      this.config.performance.dataGenerationInterval = 30000; // 30초로 증가
      logger.info('😴 사용자 없음 - 절전 모드 활성화');
    } else if (metrics.activeUsers > 0) {
      this.config.performance.dataGenerationInterval =
        COMPETITION_DEFAULTS.performance.dataGenerationInterval;
      logger.info('🔥 사용자 활동 감지 - 정상 모드 복귀');
    }
  }
}

// 글로벌 인스턴스
export const competitionConfig = new CompetitionConfigManager();
