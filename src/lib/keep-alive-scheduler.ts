/**
 * Keep-Alive 스케줄러
 * 무료 티어 서비스 휴면/삭제 방지 시스템
 */

import { smartRedis, getRedisClient } from './redis';
import { smartSupabase } from './supabase';
import { usageMonitor } from './usage-monitor';

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

    this.initializeScheduler();
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
    };
  }

  // 상태 저장
  private saveStatusToStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('keep-alive-status', JSON.stringify(this.status));
  }

  // 스케줄러 초기화
  private initializeScheduler(): void {
    this.startSupabaseKeepAlive();
    this.startRedisKeepAlive();

    console.log('🔄 Keep-Alive 스케줄러 시작됨');
    console.log(
      `📊 Supabase: ${this.INTERVALS.supabase / 1000 / 60 / 60}시간 간격`
    );
    console.log(`📊 Redis: ${this.INTERVALS.redis / 1000 / 60 / 60}시간 간격`);
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
      if (!usageMonitor.canUseSupabase()) {
        console.log('⏭️ Supabase keep-alive 건너뜀: 사용량 제한');
        return;
      }

      console.log('🔔 Supabase keep-alive 실행 중...');

      // 매우 가벼운 쿼리 실행 (최소 사용량)
      const result = await smartSupabase.select('servers', 'count');

      this.status.lastPing.supabase = new Date();
      this.saveStatusToStorage();

      console.log(
        '✅ Supabase keep-alive 성공:',
        this.status.lastPing.supabase.toLocaleString()
      );

      // 사용량 기록 (매우 적은 양)
      usageMonitor.recordSupabaseUsage(0.01, 1); // 10KB, 1 request
    } catch (error) {
      console.warn('❌ Supabase keep-alive 실패:', error);

      // 재시도 로직 (5분 후)
      setTimeout(
        () => {
          console.log('🔄 Supabase keep-alive 재시도...');
          this.pingSupabase();
        },
        5 * 60 * 1000
      );
    }
  }

  // Redis ping 실행
  private async pingRedis(): Promise<void> {
    try {
      if (!usageMonitor.canUseRedis()) {
        console.log('⏭️ Redis keep-alive 건너뜀: 사용량 제한');
        return;
      }

      console.log('🔔 Redis keep-alive 실행 중...');

      // 직접 Redis 클라이언트의 ping 명령 사용 (더 안정적)
      const redisClient = await getRedisClient();
      const pingResult = await redisClient.ping();

      if (pingResult === 'PONG') {
        this.status.lastPing.redis = new Date();
        this.saveStatusToStorage();

        console.log(
          '✅ Redis keep-alive 성공:',
          this.status.lastPing.redis.toLocaleString()
        );

        // 사용량 기록 (1개 ping 명령)
        usageMonitor.recordRedisUsage(1);
      } else {
        throw new Error(`Redis ping 응답 오류: ${pingResult}`);
      }
    } catch (error) {
      console.warn('❌ Redis keep-alive 실패:', error);

      // 재시도 로직 (5분 후)
      setTimeout(
        () => {
          console.log('🔄 Redis keep-alive 재시도...');
          this.pingRedis();
        },
        5 * 60 * 1000
      );
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
