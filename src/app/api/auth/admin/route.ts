/**
 * Admin Authentication API
 * 
 * 🔐 관리자 인증 API
 * - 관리자 로그인 처리
 * - 2FA 인증
 * - 세션 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password, totpCode, ipAddress, userAgent } = await request.json();

    // 필수 파라미터 확인
    if (!username || !password || !totpCode) {
      return NextResponse.json({
        success: false,
        error: '모든 필드를 입력해주세요.'
      }, { status: 400 });
    }

    // 관리자 인증 시도
    const authResult = await authManager.authenticateAdmin(
      { username, password, totpCode },
      { ipAddress, userAgent }
    );

    if (authResult.success) {
      return NextResponse.json({
        success: true,
        sessionId: authResult.sessionId,
        message: '관리자 인증이 완료되었습니다.'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Admin Auth API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '관리자 인증 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: '세션 ID가 필요합니다.'
      }, { status: 400 });
    }

    // 세션 검증
    const session = authManager.validateSession(sessionId);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 세션입니다.'
      }, { status: 401 });
    }

    // 관리자 권한 확인
    if (!authManager.hasPermission(sessionId, 'system:admin')) {
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다.'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        userRole: session.userRole,
        permissions: session.permissions,
        expiresAt: session.expiresAt,
        lastActivity: session.lastActivity
      }
    });

  } catch (error) {
    console.error('Admin Session Check Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '세션 확인 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: '세션 ID가 필요합니다.'
      }, { status: 400 });
    }

    // 세션 무효화
    const success = authManager.invalidateSession(sessionId);

    return NextResponse.json({
      success,
      message: success ? '로그아웃이 완료되었습니다.' : '세션을 찾을 수 없습니다.'
    });

  } catch (error) {
    console.error('Admin Logout Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '로그아웃 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 