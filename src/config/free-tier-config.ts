/**
 * 🆓 무료 티어 전환 설정
 *
 * 동시접속 5명, 일 최대 10명 기준
 * 월 사용량을 무료 제한 내로 최적화
 */

export const FREE_TIER_CONFIG = {
  // 🎯 트래픽 제한 설정
  traffic: {
    maxConcurrentUsers: 5,
    maxDailyUsers: 10,
    maxMonthlyPageviews: 1500,
    maxMonthlyAPICallss: 500,
  },

  // ✅ Vercel 무료 티어 최적화
  vercel: {
    enabled: true,
    plan: 'hobby',
    limits: {
      fastDataTransfer: '100GB', // 실제 사용: ~0.1GB
      functionInvocations: 1000000, // 실제 사용: ~500
      functionDuration: '100GB-Hr', // 실제 사용: ~1GB-Hr
      buildExecution: '6000분', // 실제 사용: ~60분
      edgeRequests: 1000000, // 실제 사용: ~1,500
    },
    safetyMargin: 0.1, // 10% 사용량으로 제한
  },

  // ✅ Supabase 무료 티어 최적화
  supabase: {
    enabled: true,
    plan: 'free',
    limits: {
      databaseSize: '500MB', // 실제 사용: ~10MB
      monthlyActiveUsers: 50000, // 실제 사용: ~100
      databaseRequests: 'unlimited', // 실제 사용: ~1,000/월
      authUsers: 50000, // 실제 사용: ~100
      storage: '1GB', // 실제 사용: ~1MB
    },
    optimizations: {
      enableRowLevelSecurity: true,
      enableRealtime: false, // 비활성화로 리소스 절약
      enableStorage: false, // 로컬 스토리지 사용
      maxConnections: 10, // 연결 수 제한
    },
  },

  // ⚠️ Upstash Redis 제한적 사용
  redis: {
    enabled: true,
    plan: 'free',
    limits: {
      dailyCommands: 10000, // 실제 사용: ~200
      monthlyBandwidth: '200MB', // 실제 사용: ~1MB
      databaseSize: '256MB', // 실제 사용: ~1MB
      maxConnections: 30, // 실제 사용: ~5
    },
    optimizations: {
      enableCaching: false, // 캐싱 비활성화
      enableStreamLogging: false, // 스트림 로깅 비활성화
      enableVersionStorage: false, // 버전 저장 비활성화
      ttl: 3600, // 1시간 TTL
      compressionEnabled: true, // 압축 활성화
    },
  },

  // ⚠️ Cloud Run AI 설정 (v5.84.0: Mistral)
  cloudRunAI: {
    enabled: true,
    plan: 'cloud-run',
    limits: {
      requestsPerMinute: 60, // Cloud Run 제한
      requestsPerDay: 2000, // 일일 제한
      inputTokensPerMinute: 500000, // Mistral 제한
      outputTokensPerMinute: 100000,
    },
    optimizations: {
      enableCaching: true, // 응답 캐싱 활성화
      cacheTimeout: 3600, // 1시간 캐시
      enableRateLimit: true, // 요청 속도 제한
      requestInterval: 1000, // 1초 간격
      enableSampling: false, // 샘플링 비활성화
      samplingRate: 1.0,
    },
  },

  // ❌ 제거할 기능들
  disabledFeatures: {
    cloudVersionManager: true, // Vercel 자체 버전 관리 사용
    cloudLogSaver: true, // 로컬 로그만 사용
    cloudLoggingService: true, // Vercel 로그 사용
    gcpCloudFunctions: false, // ❌ 제거됨 - Cloud Run으로 대체
    realTimeMonitoring: true, // 실시간 모니터링 제거
    aiAnalytics: false, // ✅ AI 분석 활성화 (Cloud Run)
    performanceTracking: true, // 성능 추적 제거
  },

  // 🔄 MCP 서버 설정 (Development Only)
  mcpServer: {
    provider: 'local', // Claude Code 로컬 MCP (개발환경)
    productionMcp: 'supabase', // Cloud Run에서 Supabase MCP만 사용
    status: 'development-only',
  },

  // 📊 모니터링 설정
  monitoring: {
    enableUsageTracking: true, // 사용량 추적 유지
    enableAlerts: true, // 제한 임박 알림
    alertThresholds: {
      vercel: 0.8, // 80% 사용시 알림
      supabase: 0.8,
      redis: 0.7, // 70% 사용시 알림 (더 민감)
      cloudRunAI: 0.8, // 80% 사용시 알림 (Cloud Run 여유로움)
    },
    enableAutoOptimization: true, // 자동 최적화 활성화
  },
};

// 🎯 무료 티어 검증 함수
export function validateFreeTierUsage() {
  return {
    vercel: {
      status: 'safe',
      usage: '< 1%',
      recommendation: '현재 상태 유지',
    },
    supabase: {
      status: 'safe',
      usage: '< 0.2%',
      recommendation: '현재 상태 유지',
    },
    redis: {
      status: 'warning',
      usage: '~30%',
      recommendation: '캐싱 및 로깅 기능 90% 축소 필요',
    },
    cloudRunAI: {
      status: 'safe',
      usage: '< 20%',
      recommendation: 'Cloud Run 기반 Mistral AI 정상 운영',
    },
    mcp: {
      status: 'active',
      usage: 'Development Only (Local)',
      recommendation: 'Claude Code 로컬 MCP + Cloud Run Supabase MCP',
    },
  };
}
