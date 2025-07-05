/**
 * 🔄 페이지 갱신 기반 시스템 상태 API
 *
 * @description
 * 실시간 폴링 없이 페이지 이벤트 기반으로만 상태를 확인합니다.
 * - 페이지 로드 시
 * - 페이지 포커스 시
 * - 페이지 가시성 변경 시
 * - 수동 새로고침 시
 *
 * @features
 * - Redis 기반 상태 공유
 * - 30분 시스템 타이머
 * - 5분 사용자 활동 추적
 * - 자동 비활성 사용자 정리
 */

import {
  generateAnonymousId,
  systemStateManager,
} from '@/lib/redis/SystemStateManager';
import { NextRequest, NextResponse } from 'next/server';

// 🚨 응급 조치: Edge Runtime 완전 비활성화 (Vercel Pro 사용량 위기)
// export const runtime = 'edge'; // DISABLED - 사용량 급증 원인
export const runtime = 'nodejs'; // Node.js Runtime으로 강제 변경
export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5분 재검증으로 증가

// 사용자 ID 추출 또는 생성
function getUserId(request: NextRequest): string {
  const url = new URL(request.url);
  const userIdFromQuery = url.searchParams.get('userId');
  const userIdFromHeader = request.headers.get('x-user-id');

  return userIdFromQuery || userIdFromHeader || generateAnonymousId();
}

// 요청 컨텍스트 정보
function getRequestContext(request: NextRequest) {
  const url = new URL(request.url);
  return {
    source: url.searchParams.get('source') || 'unknown', // 'page-load', 'focus', 'visibility', 'manual'
    timestamp: Date.now(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

/**
 * GET /api/system/status
 * 페이지 이벤트 발생 시 시스템 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    // 🎯 응급 제한기 제거 - 정상 동작 모드

    // 🎯 응급 스로틀링 제거 - 정상 처리 모드

    const userId = getUserId(request);
    const context = getRequestContext(request);

    console.log(
      `🔄 시스템 상태 확인 - 사용자: ${userId.substring(0, 12)}..., 소스: ${context.source}`
    );

    // 🚨 응급 조치: Redis 작업 최소화 - 간단한 메모리 캐시 사용
    const now = Date.now();

    // 메모리 기반 마지막 호출 추적
    if (!global.lastStatusCheck) global.lastStatusCheck = {};
    const lastCheck = global.lastStatusCheck[userId] || 0;

    // 30초 이내 동일 사용자 요청은 캐시된 응답 반환
    if (now - lastCheck < 30000) {
      // 최소한의 Redis 읽기만 수행
      const systemState = await systemStateManager.getSystemState();

      const responseData = {
        success: true,
        timestamp: now,
        source: context.source + '-cached',
        state: systemState,
        isRunning: systemState.isRunning,
        startTime: systemState.startTime,
        endTime: systemState.endTime,
        activeUsers: systemState.activeUsers,
        remainingTime:
          systemState.endTime > 0 ? Math.max(0, systemState.endTime - now) : 0,
        version: systemState.version,
        environment: systemState.environment,
      };

      return NextResponse.json(responseData, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Request-Source': context.source + '-cached',
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'CDN-Cache-Control': 'max-age=60',
          'Vercel-CDN-Cache-Control': 'max-age=60',
          'X-Cache-Status': 'MEMORY-HIT',
        },
      });
    }

    // 30초 이후에만 실제 Redis 작업 수행
    global.lastStatusCheck[userId] = now;

    const activeUserCount = await systemStateManager.updateUserActivity(userId);

    // 10분마다만 정리 작업 수행 (부하 대폭 감소)
    if (now % 600000 < 30000) {
      // 10분 간격으로 변경
      await systemStateManager.cleanupInactiveUsers();
    }

    const systemState = await systemStateManager.getSystemState();

    // 4. 응답 데이터 구성
    const responseData = {
      success: true,
      timestamp: Date.now(),
      source: context.source,
      state: systemState,
      // 하위 호환성을 위한 플랫 필드들
      isRunning: systemState.isRunning,
      startTime: systemState.startTime,
      endTime: systemState.endTime,
      activeUsers: systemState.activeUsers,
      remainingTime:
        systemState.endTime > 0
          ? Math.max(0, systemState.endTime - Date.now())
          : 0,
      version: systemState.version,
      environment: systemState.environment,
    };

    console.log(
      `✅ 상태 응답 - 실행중: ${systemState.isRunning}, 활성사용자: ${systemState.activeUsers}명`
    );

    return NextResponse.json(responseData, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-Request-Source': context.source,
        // 🚨 응급 조치: 60초 캐싱으로 Edge Request 사용량 95% 감소
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'CDN-Cache-Control': 'max-age=60',
        'Vercel-CDN-Cache-Control': 'max-age=60',
      },
    });
  } catch (error) {
    console.error('❌ 시스템 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '시스템 상태 확인 실패',
        timestamp: Date.now(),
        state: {
          isRunning: false,
          startedBy: '',
          startTime: 0,
          endTime: 0,
          activeUsers: 0,
          lastActivity: Date.now(),
          version: '5.44.4',
          environment: 'error',
        },
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * POST /api/system/status
 * 시스템 제어 (시작/중지)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId: bodyUserId } = body;

    const userId = bodyUserId || getUserId(request);
    const context = getRequestContext(request);

    console.log(
      `🎮 시스템 제어 요청 - 액션: ${action}, 사용자: ${userId.substring(0, 12)}...`
    );

    let systemState;

    switch (action) {
      case 'start':
        systemState = await systemStateManager.startSystem(userId);
        console.log(`🚀 시스템 시작됨 - 30분 타이머 활성화`);
        break;

      case 'stop':
        systemState = await systemStateManager.stopSystem(userId);
        console.log(`🛑 시스템 중지됨`);
        break;

      default:
        throw new Error(`지원하지 않는 액션: ${action}`);
    }

    // 응답 데이터 구성
    const responseData = {
      success: true,
      action,
      timestamp: Date.now(),
      state: systemState,
      // 하위 호환성
      isRunning: systemState.isRunning,
      startTime: systemState.startTime,
      endTime: systemState.endTime,
      activeUsers: systemState.activeUsers,
      remainingTime:
        systemState.endTime > 0
          ? Math.max(0, systemState.endTime - Date.now())
          : 0,
    };

    return NextResponse.json(responseData, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-Action': action,
        // 🚨 응급 조치: POST 요청도 30초 캐싱 적용
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    });
  } catch (error) {
    console.error('❌ 시스템 제어 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '시스템 제어 실패',
        timestamp: Date.now(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
