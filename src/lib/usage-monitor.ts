/**
 * 무료 티어 사용량 모니터링 시스템
 * Supabase + Upstash Redis 무료 티어 보호
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

// 무료 티어 제한
const FREE_TIER_LIMITS: UsageLimits = {
  supabase: {
    monthlyTransferMB: 45, // 50MB 중 여유분 5MB
    storageMB: 480, // 500MB 중 여유분 20MB
    requests: 45000, // 50K 중 여유분 5K
  },
  redis: {
    dailyCommands: 9000, // 10K 중 여유분 1K
    storageMB: 240, // 256MB 중 여유분 16MB
  },
};

class UsageMonitor {
  private usage: CurrentUsage;
  private isSupabaseEnabled = true;
  private isRedisEnabled = true;

  constructor() {
    this.usage = this.loadUsageFromStorage();
    this.resetCountersIfNeeded();
  }

  // 로컬 스토리지에서 사용량 로드
  private loadUsageFromStorage(): CurrentUsage {
    if (typeof window === 'undefined') {
      return this.getDefaultUsage();
    }

    const stored = localStorage.getItem('openmanager-usage');
    if (!stored) {
      return this.getDefaultUsage();
    }

    try {
      const parsed = JSON.parse(stored);
      return {
        supabase: {
          ...parsed.supabase,
          lastReset: new Date(parsed.supabase.lastReset),
        },
        redis: {
          ...parsed.redis,
          lastReset: new Date(parsed.redis.lastReset),
        },
      };
    } catch {
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
      this.isSupabaseEnabled = true;
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
      this.isRedisEnabled = true;
    }

    this.saveUsageToStorage();
  }

  // 사용량 저장
  private saveUsageToStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('openmanager-usage', JSON.stringify(this.usage));
  }

  // Supabase 사용 체크
  canUseSupabase(): boolean {
    this.resetCountersIfNeeded();

    if (!this.isSupabaseEnabled) {
      console.warn('🚫 Supabase disabled: Free tier limit exceeded');
      return false;
    }

    const limits = FREE_TIER_LIMITS.supabase;
    const usage = this.usage.supabase;

    if (
      usage.transferMB >= limits.monthlyTransferMB ||
      usage.requests >= limits.requests
    ) {
      this.isSupabaseEnabled = false;
      console.warn('🚫 Supabase disabled: Monthly limit reached');
      return false;
    }

    return true;
  }

  // Redis 사용 체크
  canUseRedis(): boolean {
    this.resetCountersIfNeeded();

    if (!this.isRedisEnabled) {
      console.warn('🚫 Redis disabled: Free tier limit exceeded');
      return false;
    }

    const limits = FREE_TIER_LIMITS.redis;
    const usage = this.usage.redis;

    if (usage.commands >= limits.dailyCommands) {
      this.isRedisEnabled = false;
      console.warn('🚫 Redis disabled: Daily limit reached');
      return false;
    }

    return true;
  }

  // Supabase 사용량 기록
  recordSupabaseUsage(transferMB: number = 0.1, requests: number = 1): void {
    if (!this.canUseSupabase()) return;

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
    if (!this.canUseRedis()) return;

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
        enabled: this.isSupabaseEnabled,
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
        enabled: this.isRedisEnabled,
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

  // 강제 활성화 (관리자용)
  forceEnable(service: 'supabase' | 'redis'): void {
    if (service === 'supabase') {
      this.isSupabaseEnabled = true;
      console.log('🔄 Supabase force enabled');
    } else {
      this.isRedisEnabled = true;
      console.log('🔄 Redis force enabled');
    }
  }

  // 수동 비활성화
  disable(service: 'supabase' | 'redis'): void {
    if (service === 'supabase') {
      this.isSupabaseEnabled = false;
      console.log('🔒 Supabase manually disabled');
    } else {
      this.isRedisEnabled = false;
      console.log('🔒 Redis manually disabled');
    }
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
    forceEnable: (service: 'supabase' | 'redis') =>
      usageMonitor.forceEnable(service),
    disable: (service: 'supabase' | 'redis') => usageMonitor.disable(service),
  };
}
