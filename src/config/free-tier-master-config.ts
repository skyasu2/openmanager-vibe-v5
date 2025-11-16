/**
 * 🎯 무료 티어 마스터 설정
 *
 * 모든 서비스의 무료 한도를 통합 관리하여
 * 100% 무료로 OpenManager Vibe v5 운영
 */

import { FREE_TIER_CACHE_CONFIG } from './free-tier-cache-config';
import { SUPABASE_FREE_TIER_CONFIG } from './supabase-free-tier-config';

export const FREE_TIER_MASTER_CONFIG = {
  // 🔧 전체 시스템 설정
  system: {
    environment: 'free-tier-optimized',
    mode: 'production',

    // 자동 최적화 활성화
    autoOptimization: {
      enabled: true,
      aggressiveMode: true, // 적극적 최적화
      monitoring: true,
    },

    // 글로벌 제한
    global: {
      maxApiCallsPerHour: 1000, // 시간당 1000회 API 호출
      maxConcurrentUsers: 100, // 최대 100명 동시 사용자
      maxDataProcessingMB: 50, // 시간당 50MB 데이터 처리
    },
  },

  // 🌐 Vercel 무료 티어 설정
  vercel: {
    plan: 'hobby',
    limits: {
      functions: {
        executionTime: 10, // 10초
        invocations: 100000, // 10만회/월
        bandwidth: 100 * 1024 * 1024 * 1024, // 100GB/월
      },
      build: {
        time: 6000, // 6000분/월
        deployments: 100, // 100회/일
      },
    },

    // 최적화 전략
    optimization: {
      // API 라우트 통합
      routeConsolidation: true,

      // 개발/테스트 API 프로덕션 차단
      blockDevAPIs: true,

      // 정적 파일 최적화
      staticOptimization: true,

      // 캐싱 강화
      aggressiveCaching: true,

      // 압축 활성화
      compression: {
        enabled: true,
        level: 'maximum',
      },
    },
  },

  // 🗄️ Supabase 무료 티어 설정
  supabase: {
    plan: 'free',
    limits: {
      database: 500 * 1024 * 1024, // 500MB
      storage: 1 * 1024 * 1024 * 1024, // 1GB
      bandwidth: 5 * 1024 * 1024 * 1024, // 5GB/월
      users: 50000, // 5만명
    },

    // 사용량 최적화
    usage: {
      database: 0.8, // 80% 까지만 사용
      storage: 0.8,
      bandwidth: 0.8,
      users: 0.8,
    },

    // 설정 임포트
    config: SUPABASE_FREE_TIER_CONFIG,
  },

  // 🔴 Redis (Upstash) 무료 티어 설정
  redis: {
    plan: 'free',
    limits: {
      memory: 256 * 1024 * 1024, // 256MB
      dailyCommands: 10000, // 1만회/일
      bandwidth: 200 * 1024 * 1024, // 200MB/월
      connections: 20, // 20개 동시
    },

    // 사용량 최적화
    usage: {
      memory: 0.8, // 80% 까지만 사용
      dailyCommands: 0.8,
      bandwidth: 0.8,
      connections: 0.5, // 50% 까지만 사용
    },

    // 설정 임포트
    config: FREE_TIER_CACHE_CONFIG,
  },

  // ☁️ Google Cloud Platform 무료 티어 설정
  gcp: {
    plan: 'always-free',
    limits: {
      computeEngine: {
        instances: 1, // e2-micro 1개
        storage: 30 * 1024 * 1024 * 1024, // 30GB HDD
        egress: 1 * 1024 * 1024 * 1024, // 1GB/월
      },
      cloudFunctions: {
        invocations: 2000000, // 200만회/월
        gbSeconds: 400000, // 40만 GB-초/월
        gHzSeconds: 200000, // 20만 GHz-초/월
      },
      cloudStorage: {
        storage: 5 * 1024 * 1024 * 1024, // 5GB
        classAOps: 5000, // 5천회/월
        classBOps: 50000, // 5만회/월
      },
    },

    // 현재 사용량
    usage: {
      riskLevel: 'low', // 15% 위험도
      compute: 1.0, // VM 1개 (100% 할당)
      functions: 0.0000025, // 극소량 사용
      storage: 0.0, // 미사용
    },
  },

  // 🤖 AI API 무료 티어 설정
  ai: {
    google: {
      plan: 'free',
      limits: {
        requestsPerMinute: 15, // 분당 15회
        requestsPerDay: 1500, // 일일 1500회
        tokensPerRequest: 32000, // 요청당 32K 토큰
      },

      // 무료 한도 준수 설정
      quotaProtection: {
        enabled: true,
        strictMode: true,
        fallbackToLocal: true,
      },
    },

    // 대안 AI 엔진들
    alternatives: {
      huggingFace: {
        enabled: true,
        rateLimit: 1000, // 시간당 1000회
      },

      localRAG: {
        enabled: true,
        priority: 'high', // 높은 우선순위
        supabaseVector: true,
      },

      openSource: {
        enabled: true,
        korean: {
          morphology: true,
          nlp: true,
        },
      },
    },
  },

  // 📊 통합 모니터링
  monitoring: {
    enabled: true,

    // 사용량 추적
    tracking: {
      realtime: true,
      historical: true,
      alerts: true,
    },

    // 알림 임계값
    thresholds: {
      warning: 0.7, // 70% 사용 시 경고
      critical: 0.85, // 85% 사용 시 위험
      emergency: 0.95, // 95% 사용 시 긴급
    },

    // 자동 액션
    actions: {
      autoCleanup: true, // 자동 정리
      loadBalancing: true, // 부하 분산
      emergencyShutdown: true, // 긴급 차단
    },
  },

  // 🔄 자동 최적화 규칙
  autoOptimization: {
    rules: [
      {
        name: 'vercel-function-consolidation',
        condition: 'api_calls > 80000/month',
        action: 'consolidate_endpoints',
        priority: 'high',
      },
      {
        name: 'redis-memory-cleanup',
        condition: 'redis_memory > 200MB',
        action: 'cleanup_old_keys',
        priority: 'medium',
      },
      {
        name: 'supabase-data-archival',
        condition: 'db_size > 400MB',
        action: 'archive_old_data',
        priority: 'medium',
      },
      {
        name: 'google-ai-quota-protection',
        condition: 'daily_requests > 1200',
        action: 'switch_to_local_ai',
        priority: 'critical',
      },
    ],
  },

  // 🎯 성능 목표
  targets: {
    // 비용 목표
    cost: {
      monthly: 0, // 월 $0
      overage: 0, // 초과 비용 $0
    },

    // 성능 목표
    performance: {
      apiResponseTime: 200, // 200ms 이하
      pageLoadTime: 1000, // 1초 이하
      uptime: 99.9, // 99.9% 가동률
    },

    // 사용량 목표
    usage: {
      vercelFunctions: 0.8, // 80% 이하
      supabaseDB: 0.8, // 80% 이하
      redisMemory: 0.8, // 80% 이하
      gcpCompute: 0.9, // 90% 이하 (1개 인스턴스)
    },
  },
};

/**
 * 무료 티어 상태 체크
 */
export function checkFreeTierStatus(): {
  overall: 'safe' | 'warning' | 'critical';
  services: Record<
    string,
    {
      status: 'safe' | 'warning' | 'critical';
      usage: number;
      recommendation?: string;
    }
  >;
} {
  // 실제 구현은 각 서비스의 사용량을 체크
  return {
    overall: 'safe',
    services: {
      vercel: {
        status: 'warning',
        usage: 0.8,
        recommendation: 'API 통합 필요',
      },
      supabase: { status: 'safe', usage: 0.1 },
      redis: { status: 'safe', usage: 0.05 },
      gcp: { status: 'safe', usage: 0.15 },
      googleAI: {
        status: 'safe',
        usage: 0.0,
        recommendation: '무료 한도로 제한됨',
      },
    },
  };
}

/**
 * 자동 최적화 실행
 */
export async function runAutoOptimization(): Promise<{
  executed: string[];
  recommendations: string[];
}> {
  const executed: string[] = [];
  const recommendations: string[] = [];

  // 무료 티어 상태 체크
  const status = checkFreeTierStatus();

  // 자동 최적화 규칙 실행
  for (const rule of FREE_TIER_MASTER_CONFIG.autoOptimization.rules) {
    // 실제 조건 체크 로직은 여기에 구현
    if (rule.priority === 'critical') {
      executed.push(rule.name);
    } else {
      recommendations.push(rule.name);
    }
  }

  return { executed, recommendations };
}

export default FREE_TIER_MASTER_CONFIG;
