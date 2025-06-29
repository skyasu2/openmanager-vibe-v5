/**
 * 🔧 시스템 상태 관리 API v2.0
 * 한국시간: 2025-06-26 02:15 KST
 * 
 * ✅ Redis 기반 상태 저장/조회
 * ✅ 베르셀 서버리스 최적화
 * ✅ 세션 기반 실시간 동기화
 */

import { devKeyManager } from '@/utils/dev-key-manager';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Redis 클라이언트 초기화
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl =
      devKeyManager.getKey('UPSTASH_REDIS_REST_URL') ||
      process.env.UPSTASH_REDIS_REST_URL;
    const redisToken =
      devKeyManager.getKey('UPSTASH_REDIS_REST_TOKEN') ||
      process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      throw new Error('Redis 환경변수가 설정되지 않았습니다');
    }

    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  }
  return redis;
}

// 시스템 상태 타입
export type SystemState = 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING';

interface SystemStateData {
  state: SystemState;
  lastUpdated: string;
  sessionId: string;
  activeUsers: number;
  startedAt?: string;
  stoppedAt?: string;
  heartbeat: string;
}

const REDIS_KEYS = {
  SYSTEM_STATE: 'vercel:system:state',
  ACTIVE_SESSIONS: 'vercel:system:sessions',
  HEARTBEAT_PREFIX: 'vercel:system:heartbeat:',
};

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5분

/**
 * 현재 한국시간 반환
 */
function getKoreanTime(): string {
  return new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 세션 정리 (비활성 세션 제거)
 */
async function cleanupInactiveSessions(redis: Redis): Promise<void> {
  try {
    const now = Date.now();
    const sessions = (await redis.smembers(
      REDIS_KEYS.ACTIVE_SESSIONS
    )) as string[];

    for (const sessionId of sessions) {
      const heartbeatKey = REDIS_KEYS.HEARTBEAT_PREFIX + sessionId;
      const lastHeartbeat = await redis.get(heartbeatKey);

      if (
        !lastHeartbeat ||
        now - parseInt(lastHeartbeat as string) > SESSION_TIMEOUT
      ) {
        // 비활성 세션 제거
        await redis.srem(REDIS_KEYS.ACTIVE_SESSIONS, sessionId);
        await redis.del(heartbeatKey);
      }
    }
  } catch (error) {
    console.error('세션 정리 실패:', error);
  }
}

/**
 * GET - 시스템 상태 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const redis = getRedisClient();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId') || 'anonymous';

    // 세션 정리
    await cleanupInactiveSessions(redis);

    // 현재 시스템 상태 조회
    const systemState = (await redis.get(
      REDIS_KEYS.SYSTEM_STATE
    )) as SystemStateData | null;

    // 활성 세션 수 계산
    const activeSessions = await redis.scard(REDIS_KEYS.ACTIVE_SESSIONS);

    const currentTime = getKoreanTime();

    if (!systemState) {
      // 초기 상태
      const initialState: SystemStateData = {
        state: 'STOPPED',
        lastUpdated: currentTime,
        sessionId: sessionId,
        activeUsers: 0,
        heartbeat: currentTime,
      };

      await redis.set(REDIS_KEYS.SYSTEM_STATE, JSON.stringify(initialState), {
        ex: 24 * 60 * 60,
      });

      return NextResponse.json({
        success: true,
        data: initialState,
        timestamp: currentTime,
      });
    }

    // 상태 데이터 업데이트
    const updatedState: SystemStateData = {
      ...systemState,
      activeUsers: activeSessions,
      heartbeat: currentTime,
    };

    // 세션 하트비트 업데이트
    const heartbeatKey = REDIS_KEYS.HEARTBEAT_PREFIX + sessionId;
    await redis.set(heartbeatKey, Date.now().toString(), {
      ex: SESSION_TIMEOUT / 1000,
    });
    await redis.sadd(REDIS_KEYS.ACTIVE_SESSIONS, sessionId);

    return NextResponse.json({
      success: true,
      data: updatedState,
      timestamp: currentTime,
      debug: {
        activeSessions,
        sessionId,
        redisConnected: true,
      },
    });
  } catch (error) {
    console.error('시스템 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '시스템 상태 조회 실패',
        details: error instanceof Error ? error.message : String(error),
        timestamp: getKoreanTime(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 시스템 상태 변경
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const redis = getRedisClient();
    const body = await request.json();
    const { action, sessionId = 'anonymous' } = body;

    const currentTime = getKoreanTime();

    // 현재 상태 조회
    const currentStateData = (await redis.get(
      REDIS_KEYS.SYSTEM_STATE
    )) as SystemStateData | null;
    const currentState = currentStateData?.state || 'STOPPED';

    let newState: SystemState = currentState;
    let additionalData = {};

    // 상태 전이 로직
    switch (action) {
      case 'start':
        if (currentState === 'STOPPED') {
          newState = 'STARTING';
          additionalData = { startedAt: currentTime };
        }
        break;

      case 'complete_start':
        if (currentState === 'STARTING') {
          newState = 'RUNNING';
        }
        break;

      case 'stop':
        if (currentState === 'RUNNING') {
          newState = 'STOPPING';
        }
        break;

      case 'complete_stop':
        if (currentState === 'STOPPING') {
          newState = 'STOPPED';
          additionalData = { stoppedAt: currentTime, startedAt: undefined };
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: '잘못된 액션입니다',
            validActions: ['start', 'complete_start', 'stop', 'complete_stop'],
          },
          { status: 400 }
        );
    }

    // 활성 세션 수 계산
    await cleanupInactiveSessions(redis);
    const activeSessions = await redis.scard(REDIS_KEYS.ACTIVE_SESSIONS);

    // 새로운 상태 저장
    const newStateData: SystemStateData = {
      state: newState,
      lastUpdated: currentTime,
      sessionId: sessionId,
      activeUsers: activeSessions,
      heartbeat: currentTime,
      ...(currentStateData || {}),
      ...additionalData,
    };

    await redis.set(REDIS_KEYS.SYSTEM_STATE, JSON.stringify(newStateData), {
      ex: 24 * 60 * 60,
    });

    // 세션 등록
    const heartbeatKey = REDIS_KEYS.HEARTBEAT_PREFIX + sessionId;
    await redis.set(heartbeatKey, Date.now().toString(), {
      ex: SESSION_TIMEOUT / 1000,
    });
    await redis.sadd(REDIS_KEYS.ACTIVE_SESSIONS, sessionId);

    console.log(
      `🔄 시스템 상태 변경: ${currentState} → ${newState} (세션: ${sessionId}, 사용자: ${activeSessions}명)`
    );

    return NextResponse.json({
      success: true,
      data: newStateData,
      previousState: currentState,
      timestamp: currentTime,
      debug: {
        action,
        sessionId,
        activeSessions,
        redisConnected: true,
      },
    });
  } catch (error) {
    console.error('시스템 상태 변경 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '시스템 상태 변경 실패',
        details: error instanceof Error ? error.message : String(error),
        timestamp: getKoreanTime(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 세션 정리 (수동)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const redis = getRedisClient();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (sessionId) {
      // 특정 세션 제거
      await redis.srem(REDIS_KEYS.ACTIVE_SESSIONS, sessionId);
      await redis.del(REDIS_KEYS.HEARTBEAT_PREFIX + sessionId);
    } else {
      // 모든 비활성 세션 정리
      await cleanupInactiveSessions(redis);
    }

    const activeSessions = await redis.scard(REDIS_KEYS.ACTIVE_SESSIONS);

    return NextResponse.json({
      success: true,
      message: sessionId
        ? '세션이 제거되었습니다'
        : '비활성 세션이 정리되었습니다',
      activeUsers: activeSessions,
      timestamp: getKoreanTime(),
    });
  } catch (error) {
    console.error('세션 정리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '세션 정리 실패',
        details: error instanceof Error ? error.message : String(error),
        timestamp: getKoreanTime(),
      },
      { status: 500 }
    );
  }
}
