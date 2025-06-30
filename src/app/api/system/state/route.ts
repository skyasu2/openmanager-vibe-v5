/**
 * 🔄 다중 사용자 시스템 상태 API
 *
 * @description
 * 여러 사용자가 동시 접속할 때 시스템 상태를 실시간으로 공유합니다.
 * 기존 시스템 구조를 최대한 보존하면서 상태 관리 기능만 추가합니다.
 *
 * @endpoints
 * GET /api/system/state - 현재 시스템 상태 조회
 * POST /api/system/state - 시스템 상태 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';

// 시스템 상태 인터페이스
interface SystemState {
  isRunning: boolean;
  isStarting: boolean;
  lastUpdate: string;
  userCount: number;
  version: string;
  environment: string;
  uptime?: number;
  services?: {
    database: boolean;
    cache: boolean;
    ai: boolean;
  };
}

// 메모리 기반 상태 저장 (Redis 대신 임시 사용)
let systemState: SystemState = {
  isRunning: false,
  isStarting: false,
  lastUpdate: new Date().toISOString(),
  userCount: 0,
  version: '5.44.3',
  environment: process.env.NODE_ENV || 'development',
  uptime: 0,
  services: {
    database: true,
    cache: true,
    ai: true,
  },
};

// 사용자 세션 추적
const activeSessions = new Set<string>();

// 시스템 업타임 계산
function getSystemUptime(): number {
  try {
    return Math.floor(process.uptime());
  } catch {
    return Math.floor(Date.now() / 1000) % 86400; // 시뮬레이션
  }
}

// 환경 정보 감지
function getEnvironmentInfo(): string {
  if (process.env.VERCEL) {
    return process.env.VERCEL_ENV === 'production'
      ? 'vercel-prod'
      : 'vercel-dev';
  }
  return process.env.NODE_ENV || 'development';
}

// 서비스 상태 체크 (시뮬레이션)
function checkServices() {
  return {
    database: Math.random() > 0.05, // 95% 확률로 정상
    cache: Math.random() > 0.1, // 90% 확률로 정상
    ai: Math.random() > 0.15, // 85% 확률로 정상
  };
}

// GET: 현재 시스템 상태 조회
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId =
      url.searchParams.get('sessionId') ||
      request.headers.get('x-session-id') ||
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 세션 추가 (자동 정리를 위해 Set 사용)
    activeSessions.add(sessionId);

    // 현재 상태 업데이트
    const currentState: SystemState = {
      ...systemState,
      lastUpdate: new Date().toISOString(),
      userCount: activeSessions.size,
      environment: getEnvironmentInfo(),
      uptime: getSystemUptime(),
      services: checkServices(),
    };

    // 메모리 상태 업데이트
    systemState = currentState;

    console.log(
      `🔄 시스템 상태 조회 - 사용자: ${activeSessions.size}명, 상태: ${currentState.isRunning ? '가동중' : '정지'}`,
      {
        sessionId: sessionId.substring(0, 12) + '...',
        isRunning: currentState.isRunning,
        userCount: currentState.userCount,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: currentState,
        // 하위 호환성을 위한 추가 필드들
        isRunning: currentState.isRunning,
        isStarting: currentState.isStarting,
        systemActive: currentState.isRunning,
        systemStarting: currentState.isStarting,
        lastUpdate: currentState.lastUpdate,
        userCount: currentState.userCount,
        version: currentState.version,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('❌ 시스템 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        data: {
          isRunning: false,
          isStarting: false,
          lastUpdate: new Date().toISOString(),
          userCount: 1,
          version: '5.44.3',
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

// POST: 시스템 상태 업데이트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, data: updateData } = body;

    console.log(`🔄 시스템 상태 업데이트 요청:`, {
      action,
      sessionId: sessionId?.substring(0, 12),
    });

    // 세션 ID가 있으면 추가
    if (sessionId) {
      activeSessions.add(sessionId);
    }

    switch (action) {
      case 'start':
        systemState = {
          ...systemState,
          isRunning: true,
          isStarting: false,
          lastUpdate: new Date().toISOString(),
          userCount: activeSessions.size,
        };
        console.log('🚀 시스템 시작됨');
        break;

      case 'stop':
        systemState = {
          ...systemState,
          isRunning: false,
          isStarting: false,
          lastUpdate: new Date().toISOString(),
          userCount: activeSessions.size,
        };
        console.log('🛑 시스템 정지됨');
        break;

      case 'starting':
        systemState = {
          ...systemState,
          isStarting: true,
          lastUpdate: new Date().toISOString(),
          userCount: activeSessions.size,
        };
        console.log('🔄 시스템 시작 중...');
        break;

      case 'heartbeat':
        // 단순 하트비트 - 사용자 수만 업데이트
        systemState = {
          ...systemState,
          lastUpdate: new Date().toISOString(),
          userCount: activeSessions.size,
        };
        break;

      default:
        // 사용자 정의 데이터 업데이트
        if (updateData) {
          systemState = {
            ...systemState,
            ...updateData,
            lastUpdate: new Date().toISOString(),
            userCount: activeSessions.size,
          };
        }
    }

    return NextResponse.json(
      {
        success: true,
        data: systemState,
        message: `시스템 상태 업데이트 완료: ${action || 'update'}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId || `session-${Date.now()}`,
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('❌ 시스템 상태 업데이트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상태 업데이트 실패',
        data: systemState,
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

// PUT: 특정 상태 필드 부분 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, ...updateFields } = body;

    if (sessionId) {
      activeSessions.add(sessionId);
    }

    // 부분 업데이트
    systemState = {
      ...systemState,
      ...updateFields,
      lastUpdate: new Date().toISOString(),
      userCount: activeSessions.size,
    };

    console.log('🔄 시스템 상태 부분 업데이트:', Object.keys(updateFields));

    return NextResponse.json({
      success: true,
      data: systemState,
      updated: Object.keys(updateFields),
    });
  } catch (error) {
    console.error('❌ 시스템 상태 부분 업데이트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '부분 업데이트 실패',
      },
      { status: 500 }
    );
  }
}

// DELETE: 세션 정리
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (sessionId && activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);

      systemState = {
        ...systemState,
        lastUpdate: new Date().toISOString(),
        userCount: activeSessions.size,
      };

      console.log(
        `🗑️ 세션 제거: ${sessionId.substring(0, 12)}... (남은 사용자: ${activeSessions.size}명)`
      );
    }

    return NextResponse.json({
      success: true,
      userCount: activeSessions.size,
      sessionRemoved: !!sessionId,
    });
  } catch (error) {
    console.error('❌ 세션 제거 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '세션 제거 실패',
      },
      { status: 500 }
    );
  }
}
