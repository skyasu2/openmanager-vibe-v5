/**
 * 🎯 스마트 무료티어 설정 시스템
 *
 * 모니터링 없이 정적 설정만으로 무료 한도 내에서
 * 안전하게 운영되도록 설계된 최적화 시스템
 */

// 📊 무료 한도 (30% 안전 마진 적용)
export const SAFE_FREE_TIER_LIMITS = {
  VERCEL_FUNCTIONS: 70000, // 100K의 70% (30% 안전 마진)
  UPSTASH_COMMANDS: 7000, // 10K의 70% (30% 안전 마진)
  SUPABASE_BANDWIDTH: 3500, // 5GB의 70% (30% 안전 마진)
  GCP_INVOCATIONS: 1400000, // 2M의 70% (30% 안전 마진)
  GOOGLE_AI_REQUESTS: 10, // 15/분의 67% (33% 안전 마진)
} as const;

// 🔄 최적화된 폴링 간격 (API 호출 최소화)
export const OPTIMIZED_INTERVALS = {
  SYSTEM_STATUS: 300000, // 5분 (기존 45초 → 6.7배 감소)
  SERVER_DATA: 600000, // 10분 (기존 35초 → 17배 감소)
  HEALTH_CHECK: 900000, // 15분 (기존 30초 → 30배 감소)
  PERFORMANCE: 1800000, // 30분 (기존 30초 → 60배 감소)
  ADMIN_DASHBOARD: 1200000, // 20분 (기존 30초 → 40배 감소)
} as const;

// 🚫 모니터링 완전 비활성화 모드
export const MONITORING_CONFIG = {
  DISABLE_REAL_TIME_MONITORING: true,
  DISABLE_USAGE_TRACKING: true,
  DISABLE_DASHBOARD_POLLING: true,
  DISABLE_HEALTH_CHECK_POLLING: true,
  USE_STATIC_OPTIMIZATION_ONLY: true,
} as const;

// 📈 예상 월간 API 호출량 계산
export const calculateMonthlyAPICalls = () => {
  const MONTH_SECONDS = 30 * 24 * 60 * 60; // 30일

  return {
    systemStatus: Math.floor(
      MONTH_SECONDS / (OPTIMIZED_INTERVALS.SYSTEM_STATUS / 1000)
    ),
    serverData: Math.floor(
      MONTH_SECONDS / (OPTIMIZED_INTERVALS.SERVER_DATA / 1000)
    ),
    healthCheck: Math.floor(
      MONTH_SECONDS / (OPTIMIZED_INTERVALS.HEALTH_CHECK / 1000)
    ),
    performance: Math.floor(
      MONTH_SECONDS / (OPTIMIZED_INTERVALS.PERFORMANCE / 1000)
    ),
    adminDashboard: Math.floor(
      MONTH_SECONDS / (OPTIMIZED_INTERVALS.ADMIN_DASHBOARD / 1000)
    ),
    total: function () {
      return (
        this.systemStatus +
        this.serverData +
        this.healthCheck +
        this.performance +
        this.adminDashboard
      );
    },
  };
};

// 🎛️ 정적 최적화 설정
export class StaticFreeTierOptimizer {
  private static instance: StaticFreeTierOptimizer;
  private config = MONITORING_CONFIG;

  private constructor() {}

  public static getInstance(): StaticFreeTierOptimizer {
    if (!StaticFreeTierOptimizer.instance) {
      StaticFreeTierOptimizer.instance = new StaticFreeTierOptimizer();
    }
    return StaticFreeTierOptimizer.instance;
  }

  // 🔄 최적화된 폴링 간격 반환
  public getOptimizedInterval(type: keyof typeof OPTIMIZED_INTERVALS): number {
    return OPTIMIZED_INTERVALS[type];
  }

  // 🚫 모니터링 비활성화 확인
  public isMonitoringDisabled(): boolean {
    return this.config.USE_STATIC_OPTIMIZATION_ONLY;
  }

  // 📊 월간 예상 사용량 리포트
  public getUsageProjection() {
    const calls = calculateMonthlyAPICalls();
    const total = calls.total();

    return {
      projectedAPICalls: total,
      safetyMargin: (
        ((SAFE_FREE_TIER_LIMITS.VERCEL_FUNCTIONS - total) /
          SAFE_FREE_TIER_LIMITS.VERCEL_FUNCTIONS) *
        100
      ).toFixed(1),
      breakdown: {
        systemStatus: calls.systemStatus,
        serverData: calls.serverData,
        healthCheck: calls.healthCheck,
        performance: calls.performance,
        adminDashboard: calls.adminDashboard,
      },
      recommendation:
        total < SAFE_FREE_TIER_LIMITS.VERCEL_FUNCTIONS
          ? 'SAFE - 무료 한도 내 안전 운영'
          : 'WARNING - 간격 추가 조정 필요',
    };
  }

  // 🎯 스마트 간격 조정 (시간대별)
  public getTimeBasedInterval(baseInterval: number): number {
    const hour = new Date().getHours();

    // 심야 시간 (23:00 - 07:00): 2배 증가
    if (hour >= 23 || hour < 7) {
      return baseInterval * 2;
    }

    // 업무 시간 (09:00 - 18:00): 기본 간격
    if (hour >= 9 && hour <= 18) {
      return baseInterval;
    }

    // 기타 시간: 1.5배 증가
    return baseInterval * 1.5;
  }

  // 🔍 현재 설정 요약
  public getConfigSummary() {
    const projection = this.getUsageProjection();

    return {
      mode: 'STATIC_OPTIMIZATION',
      monitoringDisabled: this.isMonitoringDisabled(),
      projectedMonthlyCalls: projection.projectedAPICalls,
      safetyMargin: projection.safetyMargin + '%',
      intervals: {
        systemStatus: `${OPTIMIZED_INTERVALS.SYSTEM_STATUS / 1000}초`,
        serverData: `${OPTIMIZED_INTERVALS.SERVER_DATA / 1000}초`,
        healthCheck: `${OPTIMIZED_INTERVALS.HEALTH_CHECK / 1000}초`,
        performance: `${OPTIMIZED_INTERVALS.PERFORMANCE / 1000}초`,
        adminDashboard: `${OPTIMIZED_INTERVALS.ADMIN_DASHBOARD / 1000}초`,
      },
      recommendation: projection.recommendation,
    };
  }
}

// 🚀 전역 인스턴스
export const staticOptimizer = StaticFreeTierOptimizer.getInstance();

// 📋 사용량 예상 리포트 출력
console.log('📊 무료티어 최적화 설정:', staticOptimizer.getConfigSummary());
