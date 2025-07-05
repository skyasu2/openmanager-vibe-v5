/**
 * 🎯 사용량 모니터링 시스템 (경고 전용)
 *
 * @description
 * 서비스 차단 없이 사용량을 추적하고 경고만 제공하는 시스템
 *
 * @features
 * - 사용량 추적 및 통계
 * - 임계점 경고 (차단 없음)
 * - 사용량 리포팅
 * - 서비스 차단 로직 완전 제거
 */

interface UsageLimits {
  supabase: {
    monthlyTransferMB: number;
    storageMB: number;
    requests: number;
  };
  redis: {
    dailyCommands: number;
    storageMB: number;
  };
}

interface CurrentUsage {
  supabase: {
    transferMB: number;
    requests: number;
    lastReset: Date;
  };
  redis: {
    commands: number;
    lastReset: Date;
  };
}

const FREE_TIER_LIMITS: UsageLimits = {
  supabase: {
    monthlyTransferMB: 5000, // 5GB
    storageMB: 500, // 500MB
    requests: 50000, // 50K requests
  },
  redis: {
    dailyCommands: 10000, // 10K commands
    storageMB: 30, // 30MB
  },
};

class UsageMonitor {
  private usage: CurrentUsage;

  constructor() {
    this.usage = this.loadUsageFromStorage();
  }

  private loadUsageFromStorage(): CurrentUsage {
    if (typeof window === 'undefined') {
      return this.getDefaultUsage();
    }

    try {
      const stored = localStorage.getItem('openmanager-usage');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Date 객체 복원
        parsed.supabase.lastReset = new Date(parsed.supabase.lastReset);
        parsed.redis.lastReset = new Date(parsed.redis.lastReset);
        return parsed;
      }
      return this.getDefaultUsage();
    } catch (error) {
      console.warn('사용량 데이터 로드 실패:', error);
      return this.getDefaultUsage();
    }
  }

  private getDefaultUsage(): CurrentUsage {
    return {
      supabase: {
        transferMB: 0,
        requests: 0,
        lastReset: new Date(),
      },
      redis: {
        commands: 0,
        lastReset: new Date(),
      },
    };
  }

  // 카운터 리셋 체크
  private resetCountersIfNeeded(): void {
    const now = new Date();

    // Supabase: 월별 리셋
    const monthDiff =
      (now.getFullYear() - this.usage.supabase.lastReset.getFullYear()) * 12 +
      (now.getMonth() - this.usage.supabase.lastReset.getMonth());

    if (monthDiff >= 1) {
      this.usage.supabase = {
        transferMB: 0,
        requests: 0,
        lastReset: now,
      };
      console.log('🔄 Supabase 사용량 월별 리셋');
    }

    // Redis: 일별 리셋
    const dayDiff = Math.floor(
      (now.getTime() - this.usage.redis.lastReset.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (dayDiff >= 1) {
      this.usage.redis = {
        commands: 0,
        lastReset: now,
      };
      console.log('🔄 Redis 사용량 일별 리셋');
    }

    this.saveUsageToStorage();
  }

  // 사용량 저장
  private saveUsageToStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('openmanager-usage', JSON.stringify(this.usage));
  }

  // 🎯 Supabase 사용 체크 (항상 허용, 경고만 제공)
  canUseSupabase(): boolean {
    this.resetCountersIfNeeded();

    const limits = FREE_TIER_LIMITS.supabase;
    const usage = this.usage.supabase;

    // 경고만 제공, 차단하지 않음
    if (usage.transferMB >= limits.monthlyTransferMB * 0.8) {
      console.warn('⚠️ Supabase: 80% of monthly transfer limit used');
    }

    if (usage.requests >= limits.requests * 0.8) {
      console.warn('⚠️ Supabase: 80% of monthly requests used');
    }

    if (usage.transferMB >= limits.monthlyTransferMB) {
      console.warn(
        '⚠️ Supabase: Monthly transfer limit exceeded (monitoring only)'
      );
    }

    if (usage.requests >= limits.requests) {
      console.warn(
        '⚠️ Supabase: Monthly requests limit exceeded (monitoring only)'
      );
    }

    return true; // 항상 허용
  }

  // 🎯 Redis 사용 체크 (항상 허용, 경고만 제공)
  canUseRedis(): boolean {
    this.resetCountersIfNeeded();

    const limits = FREE_TIER_LIMITS.redis;
    const usage = this.usage.redis;

    // 경고만 제공, 차단하지 않음
    if (usage.commands >= limits.dailyCommands * 0.8) {
      console.warn('⚠️ Redis: 80% of daily commands used');
    }

    if (usage.commands >= limits.dailyCommands) {
      console.warn('⚠️ Redis: Daily commands limit exceeded (monitoring only)');
    }

    return true; // 항상 허용
  }

  // Supabase 사용량 기록
  recordSupabaseUsage(transferMB: number = 0.1, requests: number = 1): void {
    this.usage.supabase.transferMB += transferMB;
    this.usage.supabase.requests += requests;
    this.saveUsageToStorage();

    // 임계점 경고
    const limits = FREE_TIER_LIMITS.supabase;
    const usage = this.usage.supabase;

    if (usage.transferMB > limits.monthlyTransferMB * 0.8) {
      console.warn('⚠️ Supabase: 80% of monthly transfer limit used');
    }

    if (usage.requests > limits.requests * 0.8) {
      console.warn('⚠️ Supabase: 80% of monthly requests used');
    }
  }

  // Redis 사용량 기록
  recordRedisUsage(commands: number = 1): void {
    this.usage.redis.commands += commands;
    this.saveUsageToStorage();

    // 임계점 경고
    const limits = FREE_TIER_LIMITS.redis;
    const usage = this.usage.redis;

    if (usage.commands > limits.dailyCommands * 0.8) {
      console.warn('⚠️ Redis: 80% of daily commands used');
    }
  }

  // 현재 사용량 상태
  getUsageStatus() {
    return {
      supabase: {
        enabled: true, // 항상 활성화
        usage: this.usage.supabase,
        limits: FREE_TIER_LIMITS.supabase,
        percentage: {
          transfer:
            (this.usage.supabase.transferMB /
              FREE_TIER_LIMITS.supabase.monthlyTransferMB) *
            100,
          requests:
            (this.usage.supabase.requests /
              FREE_TIER_LIMITS.supabase.requests) *
            100,
        },
      },
      redis: {
        enabled: true, // 항상 활성화
        usage: this.usage.redis,
        limits: FREE_TIER_LIMITS.redis,
        percentage: {
          commands:
            (this.usage.redis.commands / FREE_TIER_LIMITS.redis.dailyCommands) *
            100,
        },
      },
    };
  }

  // 사용량 리셋 (관리자용)
  resetUsage(service: 'supabase' | 'redis' | 'all'): void {
    if (service === 'supabase' || service === 'all') {
      this.usage.supabase = {
        transferMB: 0,
        requests: 0,
        lastReset: new Date(),
      };
      console.log('🔄 Supabase 사용량 리셋');
    }

    if (service === 'redis' || service === 'all') {
      this.usage.redis = {
        commands: 0,
        lastReset: new Date(),
      };
      console.log('🔄 Redis 사용량 리셋');
    }

    this.saveUsageToStorage();
  }
}

// 싱글톤 인스턴스
export const usageMonitor = new UsageMonitor();

// React Hook
export function useUsageMonitor() {
  return {
    canUseSupabase: () => usageMonitor.canUseSupabase(),
    canUseRedis: () => usageMonitor.canUseRedis(),
    recordSupabaseUsage: (transferMB?: number, requests?: number) =>
      usageMonitor.recordSupabaseUsage(transferMB, requests),
    recordRedisUsage: (commands?: number) =>
      usageMonitor.recordRedisUsage(commands),
    getUsageStatus: () => usageMonitor.getUsageStatus(),
    resetUsage: (service: 'supabase' | 'redis' | 'all') =>
      usageMonitor.resetUsage(service),
  };
}
