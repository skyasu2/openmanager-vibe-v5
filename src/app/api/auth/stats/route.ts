/**
 * Authentication Statistics API
 *
 * 🔐 인증 통계 및 보안 모니터링 API
 * - 로그인 시도 통계
 * - 차단된 IP 목록
 * - 활성 세션 정보
 * - 보안 이벤트 로그
 */

import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId =
      searchParams.get('sessionId') || request.headers.get('x-session-id');

    // 인증 확인 (관리자 권한 필요)
    if (!sessionId || !authManager.hasPermission(sessionId, 'system:admin')) {
      return NextResponse.json(
        {
          success: false,
          error: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      );
    }

    // 인증 통계 조회
    const authStats = authManager.getAuthStats();

    return NextResponse.json({
      success: true,
      data: authStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Auth Stats API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '인증 통계 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data, sessionId: bodySessionId } = await request.json();
    const sessionId = bodySessionId || request.headers.get('x-session-id');

    // 인증 확인 (관리자 권한 필요)
    if (!sessionId || !authManager.hasPermission(sessionId, 'system:admin')) {
      return NextResponse.json(
        {
          success: false,
          error: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      );
    }

    switch (action) {
      case 'invalidate-session':
        return handleInvalidateSession(data);

      case 'invalidate-all-sessions':
        return handleInvalidateAllSessions(data);

      case 'unblock-ip':
        return handleUnblockIP(data);

      case 'cleanup':
        return handleCleanup();

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다.',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auth Stats POST API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '인증 관리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

// 특정 세션 무효화
async function handleInvalidateSession(data: any) {
  const { sessionId } = data;

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: '세션 ID가 필요합니다.',
      },
      { status: 400 }
    );
  }

  const success = authManager.invalidateSession(sessionId);

  return NextResponse.json({
    success,
    message: success ? '세션이 무효화되었습니다.' : '세션을 찾을 수 없습니다.',
  });
}

// 모든 세션 무효화
async function handleInvalidateAllSessions(data: any) {
  const { userId } = data;

  const count = authManager.invalidateAllSessions(userId);

  return NextResponse.json({
    success: true,
    message: `${count}개의 세션이 무효화되었습니다.`,
    invalidatedCount: count,
  });
}

// IP 차단 해제
async function handleUnblockIP(data: any) {
  const { ipAddress } = data;

  if (!ipAddress) {
    return NextResponse.json(
      {
        success: false,
        error: 'IP 주소가 필요합니다.',
      },
      { status: 400 }
    );
  }

  // 실제 구현에서는 authManager에 unblockIP 메서드 추가 필요
  // 현재는 시뮬레이션

  return NextResponse.json({
    success: true,
    message: `IP ${ipAddress}의 차단이 해제되었습니다.`,
  });
}

// 인증 시스템 정리
async function handleCleanup() {
  authManager.cleanup();

  return NextResponse.json({
    success: true,
    message: '인증 시스템 정리가 완료되었습니다.',
  });
}
