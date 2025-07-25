/**
 * 🟢 Redis 기반 시스템 상태 관리자
 *
 * @description
 * 페이지 갱신 기반 시스템 상태 공유 기능
 * - Redis TTL 기반 자동 정리
 * - 30분 시스템 타이머
 * - 5분 사용자 활동 추적
 * - 3-5명 동시 접속 지원
 *
 * @features
 * - 싱글톤 패턴
 * - Redis 기반 상태 저장
 * - 자동 TTL 관리
 * - 익명 사용자 ID 지원
 *
 * @note
 * 인증 연동 시스템 상태 관리는 /services/system/SystemStateManager.ts 참조
 */

import { getRedisClient } from '@/lib/redis';

export interface SystemState {
  isRunning: boolean;
  startedBy: string; // 익명 사용자 ID
  startTime: number;
  endTime: number; // 30분 후
  activeUsers: number;
  lastActivity: number;
  version: string;
  environment: string;
}

export interface UserActivity {
  userId: string;
  lastSeen: number;
  sessionStart: number;
}

export class RedisSystemStateManager {
  private static instance: RedisSystemStateManager;

  // Redis 키 패턴
  private readonly SYSTEM_STATE_KEY = 'system:state';
  private readonly USER_ACTIVITY_PREFIX = 'user_activity:';
  private readonly ACTIVE_USERS_SET = 'active_users';

  // TTL 설정 (초)
  private readonly SYSTEM_TTL = 35 * 60; // 35분 (30분 + 5분 버퍼)
  private readonly USER_TTL = 5 * 60; // 5분
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30분 (밀리초)

  private constructor() {}

  static getInstance(): RedisSystemStateManager {
    if (!RedisSystemStateManager.instance) {
      RedisSystemStateManager.instance = new RedisSystemStateManager();
    }
    return RedisSystemStateManager.instance;
  }

  /**
   * 🔍 현재 시스템 상태 조회
   */
  async getSystemState(): Promise<SystemState> {
    try {
      const redis = await getRedisClient('system-state');
      if (!redis) {
        return this.getDefaultState();
      }

      const stateData = await redis.get(this.SYSTEM_STATE_KEY);
      if (!stateData) {
        return this.getDefaultState();
      }

      const state = JSON.parse(stateData) as SystemState;

      // 시간 만료 확인
      if (state.endTime && Date.now() > state.endTime) {
        await this.stopSystem('system-timeout');
        return this.getDefaultState();
      }

      // 활성 사용자 수 업데이트 (시스템이 실행 중일 때만)
      if (state.isRunning) {
        state.activeUsers = await this.getActiveUserCount();
        // 최소 1명은 보장 (현재 요청한 사용자)
        state.activeUsers = Math.max(state.activeUsers, 1);
      } else {
        state.activeUsers = 0;
      }

      return state;
    } catch (error) {
      console.error('❌ 시스템 상태 조회 실패:', error);
      return this.getDefaultState();
    }
  }

  /**
   * 🚀 시스템 시작
   */
  async startSystem(userId: string): Promise<SystemState> {
    try {
      const redis = await getRedisClient('system-control');
      if (!redis) {
        throw new Error('Redis 연결 실패');
      }

      const startTime = Date.now();
      const endTime = startTime + this.SESSION_DURATION;

      const systemState: SystemState = {
        isRunning: true,
        startedBy: userId,
        startTime,
        endTime,
        activeUsers: 1,
        lastActivity: startTime,
        version: '5.44.4',
        environment: process.env.NODE_ENV || 'development',
      };

      // 시스템 상태 저장 (35분 TTL)
      await redis.setex(
        this.SYSTEM_STATE_KEY,
        this.SYSTEM_TTL,
        JSON.stringify(systemState)
      );

      // 시작한 사용자 활동 등록
      await this.updateUserActivity(userId);

      console.log(
        `🚀 시스템 시작됨 - 사용자: ${userId}, 종료 예정: ${new Date(endTime).toLocaleString()}`
      );

      return systemState;
    } catch (error) {
      console.error('❌ 시스템 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 🛑 시스템 중지
   */
  async stopSystem(userId: string): Promise<SystemState> {
    try {
      const redis = await getRedisClient('system-control');
      if (!redis) {
        throw new Error('Redis 연결 실패');
      }

      // 시스템 상태 삭제
      await redis.del(this.SYSTEM_STATE_KEY);

      // 모든 사용자 활동 정리
      await this.cleanupAllUsers();

      const stoppedState = this.getDefaultState();

      console.log(`🛑 시스템 중지됨 - 사용자: ${userId}`);

      return stoppedState;
    } catch (error) {
      console.error('❌ 시스템 중지 실패:', error);
      throw error;
    }
  }

  /**
   * 👤 사용자 활동 업데이트
   */
  async updateUserActivity(userId: string): Promise<number> {
    try {
      const redis = await getRedisClient('user-activity');
      if (!redis) {
        return 1;
      }

      const now = Date.now();

      // 사용자 활동 시간 업데이트 (5분 TTL)
      await redis.setex(
        `${this.USER_ACTIVITY_PREFIX}${userId}`,
        this.USER_TTL,
        now.toString()
      );

      // 활성 사용자 세트에 추가
      await redis.sadd(this.ACTIVE_USERS_SET, userId);
      await redis.expire(this.ACTIVE_USERS_SET, this.USER_TTL);

      // 현재 활성 사용자 수 반환
      return await this.getActiveUserCount();
    } catch (error) {
      console.error('❌ 사용자 활동 업데이트 실패:', error);
      return 1;
    }
  }

  /**
   * 🧹 비활성 사용자 정리
   */
  async cleanupInactiveUsers(): Promise<number> {
    try {
      const redis = await getRedisClient('user-cleanup');
      if (!redis) {
        return 0;
      }

      const now = Date.now();
      const fiveMinutesAgo = now - this.USER_TTL * 1000;

      const activeUsers = (await redis.smembers(this.ACTIVE_USERS_SET)) || [];
      const inactiveUsers: string[] = [];

      for (const userId of activeUsers) {
        const lastActivity = await redis.get(
          `${this.USER_ACTIVITY_PREFIX}${userId}`
        );
        if (!lastActivity || parseInt(lastActivity) < fiveMinutesAgo) {
          inactiveUsers.push(userId);
        }
      }

      // 비활성 사용자 제거
      if (inactiveUsers.length > 0) {
        await redis.srem(this.ACTIVE_USERS_SET, ...inactiveUsers);

        // 개별 활동 기록도 삭제
        for (const userId of inactiveUsers) {
          await redis.del(`${this.USER_ACTIVITY_PREFIX}${userId}`);
        }

        console.log(`🧹 비활성 사용자 ${inactiveUsers.length}명 정리됨`);
      }

      return activeUsers.length - inactiveUsers.length;
    } catch (error) {
      console.error('❌ 비활성 사용자 정리 실패:', error);
      return 0;
    }
  }

  /**
   * 📊 활성 사용자 수 조회
   */
  private async getActiveUserCount(): Promise<number> {
    try {
      const redis = await getRedisClient('user-count');
      if (!redis) {
        return 1;
      }

      const count = await redis.scard(this.ACTIVE_USERS_SET);
      return Math.max(count || 0, 0);
    } catch (error) {
      console.error('❌ 활성 사용자 수 조회 실패:', error);
      return 1;
    }
  }

  /**
   * 🧹 모든 사용자 정리
   */
  private async cleanupAllUsers(): Promise<void> {
    try {
      const redis = await getRedisClient('cleanup-all');
      if (!redis) {
        return;
      }

      // 활성 사용자 세트 삭제
      await redis.del(this.ACTIVE_USERS_SET);

      // 개별 사용자 활동 기록 정리는 TTL로 자동 처리됨
      console.log('🧹 모든 사용자 활동 정리 완료');
    } catch (error) {
      console.error('❌ 전체 사용자 정리 실패:', error);
    }
  }

  /**
   * 📋 기본 시스템 상태
   */
  private getDefaultState(): SystemState {
    return {
      isRunning: false,
      startedBy: '',
      startTime: 0,
      endTime: 0,
      activeUsers: 0,
      lastActivity: Date.now(),
      version: '5.44.4',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * 🔧 시스템 상태 강제 업데이트 (디버깅용)
   */
  async forceUpdateState(updates: Partial<SystemState>): Promise<SystemState> {
    try {
      const currentState = await this.getSystemState();
      const updatedState = { ...currentState, ...updates };

      const redis = await getRedisClient('force-update');
      if (redis) {
        await redis.setex(
          this.SYSTEM_STATE_KEY,
          this.SYSTEM_TTL,
          JSON.stringify(updatedState)
        );
      }

      return updatedState;
    } catch (error) {
      console.error('❌ 시스템 상태 강제 업데이트 실패:', error);
      throw error;
    }
  }
}

// 🚀 전역 인스턴스
export const systemStateManager = RedisSystemStateManager.getInstance();

// Backward compatibility
export { RedisSystemStateManager as SystemStateManager };

// 🔧 편의 함수들
export const generateAnonymousId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatTimeRemaining = (endTime: number): string => {
  const remaining = Math.max(0, endTime - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
