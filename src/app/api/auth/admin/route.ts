/**
 * 🔐 Admin Authentication API - Edge Runtime 최적화
 */

export const runtime = 'edge'; // Edge Runtime으로 최적화
export const dynamic = 'force-dynamic';

import { EdgeLogger } from '@/lib/edge-runtime-utils';
import { NextRequest, NextResponse } from 'next/server';

const logger = EdgeLogger.getInstance();

// 목업 authManager (실제 환경에서는 실제 구현으로 대체)
const authManager = {
  async authenticateAdmin(credentials: any, context: any) {
    // 목업 인증 로직
    if (
      credentials.username === 'admin' &&
      credentials.password === 'admin123'
    ) {
      return {
        success: true,
        sessionId: `session_${Date.now()}`,
      };
    }
    return {
      success: false,
      error: '인증 실패',
    };
  },

  validateSession(sessionId: string) {
    // 목업 세션 검증
    if (sessionId.startsWith('session_')) {
      return {
        sessionId,
        userId: 'admin',
        userRole: 'admin',
        permissions: ['system:admin'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivity: new Date(),
      };
    }
    return null;
  },

  hasPermission(sessionId: string, permission: string) {
    const session = this.validateSession(sessionId);
    return session?.permissions.includes(permission) || false;
  },

  invalidateSession(sessionId: string) {
    // 목업 세션 무효화
    return true;
  },
};

export async function POST(request: NextRequest) {
  try {
    const { adminKey } = await request.json();

    // 간단한 관리자 키 검증
    const isValidAdmin = adminKey === process.env.ADMIN_SECRET_KEY;

    if (isValidAdmin) {
      logger.info('관리자 인증 성공');

      return NextResponse.json({
        success: true,
        message: '관리자 인증 성공',
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.warn('관리자 인증 실패 - 잘못된 키');

      return NextResponse.json({
        success: false,
        error: 'INVALID_ADMIN_KEY',
        message: '관리자 키가 올바르지 않습니다.',
      }, { status: 401 });
    }

  } catch (error) {
    logger.error('관리자 인증 API 오류', error);

    return NextResponse.json({
      success: false,
      error: 'AUTH_ERROR',
      message: '인증 처리 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId =
      searchParams.get('sessionId') || request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: '세션 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 세션 검증
    const session = authManager.validateSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 세션입니다.',
        },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (!authManager.hasPermission(sessionId, 'system:admin')) {
      return NextResponse.json(
        {
          success: false,
          error: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        userRole: session.userRole,
        permissions: session.permissions,
        expiresAt: session.expiresAt,
        lastActivity: session.lastActivity,
      },
    });
  } catch (error) {
    console.error('Admin Session Check Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '세션 확인 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: '세션 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 세션 무효화
    const success = authManager.invalidateSession(sessionId);

    return NextResponse.json({
      success,
      message: success
        ? '로그아웃이 완료되었습니다.'
        : '세션을 찾을 수 없습니다.',
    });
  } catch (error) {
    console.error('Admin Logout Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '로그아웃 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
