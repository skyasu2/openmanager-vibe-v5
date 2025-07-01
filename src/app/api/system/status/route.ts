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
    const userId = getUserId(request);
    const context = getRequestContext(request);

    console.log(
      `🔄 시스템 상태 확인 - 사용자: ${userId.substring(0, 12)}..., 소스: ${context.source}`
    );

    // 1. 사용자 활동 업데이트 (5분 TTL)
    const activeUserCount = await systemStateManager.updateUserActivity(userId);

    // 2. 비활성 사용자 정리 (5분 이상 비활성)
    await systemStateManager.cleanupInactiveUsers();

    // 3. 현재 시스템 상태 조회
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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
