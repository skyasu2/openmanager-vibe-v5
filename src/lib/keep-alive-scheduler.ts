/**
 * Keep-Alive 스케줄러
 * 무료 티어 서비스 휴면/삭제 방지 시스템
 */

import { logger } from './logger';
import { env } from './env';
import { usageMonitor } from './usage-monitor';
import { createClient } from '@supabase/supabase-js';
import { checkSupabaseConnection } from './supabase';
import smartRedis, { getRedisClient } from './redis';

interface KeepAliveStatus {
  lastPing: {
    supabase: Date | null;
    redis: Date | null;
  };
  isActive: {
    supabase: boolean;
    redis: boolean;
  };
  nextScheduled: {
    supabase: Date | null;
    redis: Date | null;
  };
  errors: {
    supabase: number;
  };
}

class KeepAliveScheduler {
  private status: KeepAliveStatus;
  private intervals: {
    supabase: NodeJS.Timeout | null;
    redis: NodeJS.Timeout | null;
  };

  // Keep-alive 주기 설정
  private readonly INTERVALS = {
    supabase: 4 * 60 * 60 * 1000, // 4시간마다 (하루 6회)
    redis: 12 * 60 * 60 * 1000, // 12시간마다 (하루 2회)
  };

  constructor() {
    this.status = this.loadStatusFromStorage();
    this.intervals = {
      supabase: null,
      redis: null,
    };

    // 비동기 초기화를 나중에 호출
    this.initializeScheduler().catch(console.error);
  }

  // 로컬 스토리지에서 상태 로드
  private loadStatusFromStorage(): KeepAliveStatus {
    if (typeof window === 'undefined') {
      return this.getDefaultStatus();
    }

    const stored = localStorage.getItem('keep-alive-status');
    if (!stored) {
      return this.getDefaultStatus();
    }

    try {
      const parsed = JSON.parse(stored);
      return {
        lastPing: {
          supabase: parsed.lastPing.supabase
            ? new Date(parsed.lastPing.supabase)
            : null,
          redis: parsed.lastPing.redis ? new Date(parsed.lastPing.redis) : null,
        },
        isActive: parsed.isActive || { supabase: false, redis: false },
        nextScheduled: {
          supabase: parsed.nextScheduled.supabase
            ? new Date(parsed.nextScheduled.supabase)
            : null,
          redis: parsed.nextScheduled.redis
            ? new Date(parsed.nextScheduled.redis)
            : null,
        },
        errors: parsed.errors || { supabase: 0 },
      };
    } catch {
      return this.getDefaultStatus();
    }
  }

  private getDefaultStatus(): KeepAliveStatus {
    return {
      lastPing: { supabase: null, redis: null },
      isActive: { supabase: false, redis: false },
      nextScheduled: { supabase: null, redis: null },
      errors: { supabase: 0 },
    };
  }

  // 상태 저장
  private saveStatusToStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('keep-alive-status', JSON.stringify(this.status));
  }

  // 스케줄러 초기화
  private async initializeScheduler(): Promise<void> {
    // 환경 체크 추가
    let envManager;
    try {
      const envModule = await import('@/lib/environment/EnvironmentManager');
      envManager = envModule.envManager;
    } catch {
      // 환경 매니저가 없으면 기존 방식 사용
      console.log('⚠️ EnvironmentManager 없음 - 기존 방식 사용');
    }

    // 빌드 시에는 Keep-Alive 스케줄러 비활성화
    if (envManager?.isBuildTime) {
      console.log('🔨 빌드 환경 감지 - Keep-Alive 스케줄러 건너뜀');
      return;
    }

    // Keep-Alive가 허용된 환경에서만 실행
    if (envManager && !envManager.shouldStartKeepAlive()) {
      console.log('⏭️ Keep-Alive 스케줄러 비활성화됨 (환경 설정)');
      return;
    }

    this.startSupabaseKeepAlive();
    this.startRedisKeepAlive();

    console.log('🔄 Keep-Alive 스케줄러 시작됨');
    console.log(
      `📊 Supabase: ${this.INTERVALS.supabase / 1000 / 60 / 60}시간 간격`
    );
    console.log(`📊 Redis: ${this.INTERVALS.redis / 1000 / 60 / 60}시간 간격`);

    if (envManager) {
      envManager.log('info', 'Keep-Alive 스케줄러 시작됨');
    }
  }

  // Supabase Keep-alive 시작
  private startSupabaseKeepAlive(): void {
    if (this.intervals.supabase) {
      clearInterval(this.intervals.supabase);
    }

    // 즉시 한 번 실행
    this.pingSupabase();

    // 주기적 실행 설정
    this.intervals.supabase = setInterval(() => {
      this.pingSupabase();
    }, this.INTERVALS.supabase);

    this.status.isActive.supabase = true;
    this.status.nextScheduled.supabase = new Date(
      Date.now() + this.INTERVALS.supabase
    );
    this.saveStatusToStorage();
  }

  // Redis Keep-alive 시작
  private startRedisKeepAlive(): void {
    if (this.intervals.redis) {
      clearInterval(this.intervals.redis);
    }

    // 즉시 한 번 실행
    this.pingRedis();

    // 주기적 실행 설정
    this.intervals.redis = setInterval(() => {
      this.pingRedis();
    }, this.INTERVALS.redis);

    this.status.isActive.redis = true;
    this.status.nextScheduled.redis = new Date(
      Date.now() + this.INTERVALS.redis
    );
    this.saveStatusToStorage();
  }

  // Supabase ping 실행
  private async pingSupabase(): Promise<void> {
    try {
      // 🛡️ 빌드 타임에는 Supabase 요청 완전 차단
      if (
        typeof window === 'undefined' &&
        (process.env.VERCEL_ENV ||
          (process.env.NODE_ENV === 'production' && !process.env.RUNTIME_ENV))
      ) {
        console.log('⏭️ Supabase keep-alive 건너뜀: 빌드 타임');
        return;
      }

      if (!usageMonitor.canUseSupabase()) {
        console.log('⏭️ Supabase keep-alive 건너뜀: 사용량 제한');
        return;
      }

      console.log('🔔 Supabase keep-alive 실행 중...');

      // Supabase 연결 테스트
      const isConnected = await checkSupabaseConnection();

      if (isConnected) {
        this.status.lastPing.supabase = new Date();
        this.status.errors.supabase = 0;
        console.log(
          `✅ Supabase keep-alive 성공: ${this.status.lastPing.supabase.toLocaleString()}`
        );
      } else {
        throw new Error('Supabase 연결 실패');
      }

      usageMonitor.recordSupabaseUsage(1);
    } catch (error: any) {
      this.status.errors.supabase++;
      console.log(
        `❌ Supabase keep-alive 실패 (${this.status.errors.supabase}회):`,
        error.message
      );

      if (this.status.errors.supabase >= 3) {
        console.log('⚠️ Supabase keep-alive 연속 실패로 일시 중단');
      }
    }
  }

  // Redis ping 실행
  private async pingRedis(): Promise<void> {
    try {
      // 🛡️ 빌드 타임에는 Redis 요청 완전 차단
      if (
        typeof window === 'undefined' &&
        (process.env.VERCEL_ENV ||
          (process.env.NODE_ENV === 'production' && !process.env.RUNTIME_ENV))
      ) {
        console.log('⏭️ Redis keep-alive 건너뜀: 빌드 타임');
        return;
      }

      if (!usageMonitor.canUseRedis()) {
        console.log('⏭️ Redis keep-alive 건너뜀: 사용량 제한');
        return;
      }

      console.log('🔔 Redis keep-alive 실행 중...');

      // 🛡️ Throttle 방지를 위한 지연 추가
      await new Promise(resolve => setTimeout(resolve, 300));

      // 하이브리드 Redis 클라이언트 사용 (keep-alive 컨텍스트)
      const result = await smartRedis.ping('keep-alive');

      this.status.lastPing.redis = new Date();
      console.log(
        `✅ Redis keep-alive 성공: ${this.status.lastPing.redis.toLocaleString()}`
      );

      usageMonitor.recordRedisUsage(1);
    } catch (error: any) {
      console.log(`❌ Redis keep-alive 실패:`, error.message);
    }
  }

  // 수동 ping 실행
  async manualPing(service: 'supabase' | 'redis'): Promise<boolean> {
    try {
      if (service === 'supabase') {
        await this.pingSupabase();
      } else {
        await this.pingRedis();
      }
      return true;
    } catch (error) {
      console.error(`Manual ${service} ping failed:`, error);
      return false;
    }
  }

  // Keep-alive 중지
  stopKeepAlive(service?: 'supabase' | 'redis'): void {
    if (!service || service === 'supabase') {
      if (this.intervals.supabase) {
        clearInterval(this.intervals.supabase);
        this.intervals.supabase = null;
        this.status.isActive.supabase = false;
        console.log('🔒 Supabase keep-alive 중지됨');
      }
    }

    if (!service || service === 'redis') {
      if (this.intervals.redis) {
        clearInterval(this.intervals.redis);
        this.intervals.redis = null;
        this.status.isActive.redis = false;
        console.log('🔒 Redis keep-alive 중지됨');
      }
    }

    this.saveStatusToStorage();
  }

  // Keep-alive 재시작
  restartKeepAlive(service?: 'supabase' | 'redis'): void {
    if (!service || service === 'supabase') {
      this.startSupabaseKeepAlive();
      console.log('🔄 Supabase keep-alive 재시작됨');
    }

    if (!service || service === 'redis') {
      this.startRedisKeepAlive();
      console.log('🔄 Redis keep-alive 재시작됨');
    }
  }

  // 상태 정보 반환
  getStatus(): KeepAliveStatus & {
    timeSinceLastPing: {
      supabase: number | null;
      redis: number | null;
    };
    timeToNext: {
      supabase: number | null;
      redis: number | null;
    };
  } {
    const now = Date.now();

    return {
      ...this.status,
      timeSinceLastPing: {
        supabase: this.status.lastPing.supabase
          ? now - this.status.lastPing.supabase.getTime()
          : null,
        redis: this.status.lastPing.redis
          ? now - this.status.lastPing.redis.getTime()
          : null,
      },
      timeToNext: {
        supabase: this.status.nextScheduled.supabase
          ? this.status.nextScheduled.supabase.getTime() - now
          : null,
        redis: this.status.nextScheduled.redis
          ? this.status.nextScheduled.redis.getTime() - now
          : null,
      },
    };
  }

  // 위험 상태 체크 (삭제 임박)
  getDangerStatus(): {
    supabase: { danger: boolean; daysLeft: number };
    redis: { danger: boolean; daysLeft: number };
  } {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const supabaseDays = this.status.lastPing.supabase
      ? Math.floor((now - this.status.lastPing.supabase.getTime()) / DAY_MS)
      : 999;

    const redisDays = this.status.lastPing.redis
      ? Math.floor((now - this.status.lastPing.redis.getTime()) / DAY_MS)
      : 999;

    return {
      supabase: {
        danger: supabaseDays > 5, // 5일 이상 미사용시 위험
        daysLeft: Math.max(0, 7 - supabaseDays),
      },
      redis: {
        danger: redisDays > 25, // 25일 이상 미사용시 위험
        daysLeft: Math.max(0, 30 - redisDays),
      },
    };
  }

  // 정리 (컴포넌트 언마운트시)
  cleanup(): void {
    this.stopKeepAlive();
    console.log('🧹 Keep-Alive 스케줄러 정리됨');
  }
}

// 싱글톤 인스턴스
export const keepAliveScheduler = new KeepAliveScheduler();

// React Hook
export function useKeepAlive() {
  return {
    getStatus: () => keepAliveScheduler.getStatus(),
    getDangerStatus: () => keepAliveScheduler.getDangerStatus(),
    manualPing: (service: 'supabase' | 'redis') =>
      keepAliveScheduler.manualPing(service),
    stopKeepAlive: (service?: 'supabase' | 'redis') =>
      keepAliveScheduler.stopKeepAlive(service),
    restartKeepAlive: (service?: 'supabase' | 'redis') =>
      keepAliveScheduler.restartKeepAlive(service),
  };
}
