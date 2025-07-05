/**
 * 🔐 Google OAuth API Endpoint
 * 
 * OpenManager Vibe v5 Google 인증 API
 */

import { AuthStateManager } from '@/services/auth/AuthStateManager';
import { NextRequest, NextResponse } from 'next/server';

// 강제 동적 라우팅 설정
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const authManager = new AuthStateManager();

/**
 * 🔐 Google OAuth 로그인 처리
 */
export async function POST(request: NextRequest) {
    try {
        const { token, clientInfo } = await request.json();

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Google OAuth 토큰이 필요합니다.'
                },
                { status: 400 }
            );
        }

        // Google OAuth 로그인 시도
        const result = await authManager.loginWithGoogle(token);

        if (result.success) {
            // 성공 응답
            return NextResponse.json({
                success: true,
                user: result.user,
                sessionId: result.sessionId,
                systemStarted: result.systemStarted,
                systemError: result.systemError,
                message: 'Google 로그인이 완료되었습니다.'
            });
        } else {
            // 실패 응답
            return NextResponse.json(
                {
                    success: false,
                    error: result.error
                },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Google OAuth API Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Google 로그인 중 오류가 발생했습니다.',
                details: error instanceof Error ? error.message : '알 수 없는 오류'
            },
            { status: 500 }
        );
    }
}

/**
 * 👤 게스트 로그인 처리
 */
export async function PUT(request: NextRequest) {
    try {
        const { clientInfo } = await request.json();

        // 게스트 로그인 시도
        const result = await authManager.loginAsGuest();

        if (result.success) {
            return NextResponse.json({
                success: true,
                user: result.user,
                sessionId: result.sessionId,
                systemStarted: result.systemStarted,
                message: '게스트 로그인이 완료되었습니다.'
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Guest Login API Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: '게스트 로그인 중 오류가 발생했습니다.',
                details: error instanceof Error ? error.message : '알 수 없는 오류'
            },
            { status: 500 }
        );
    }
}

/**
 * 🚪 로그아웃 처리
 */
export async function DELETE(request: NextRequest) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                {
                    success: false,
                    error: '세션 ID가 필요합니다.'
                },
                { status: 400 }
            );
        }

        // 로그아웃 처리
        const result = authManager.logout(sessionId);

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? '로그아웃이 완료되었습니다.'
                : result.error
        });
    } catch (error) {
        console.error('Logout API Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: '로그아웃 중 오류가 발생했습니다.',
                details: error instanceof Error ? error.message : '알 수 없는 오류'
            },
            { status: 500 }
        );
    }
}

/**
 * 📋 세션 상태 확인
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId') ||
            request.headers.get('x-session-id');

        if (!sessionId) {
            return NextResponse.json(
                {
                    success: false,
                    authenticated: false,
                    error: '세션 ID가 필요합니다.'
                },
                { status: 400 }
            );
        }

        // 세션 검증
        const isValid = authManager.validateSession(sessionId);
        const session = authManager.getSession(sessionId);

        if (isValid && session) {
            return NextResponse.json({
                success: true,
                authenticated: true,
                user: session.user,
                sessionInfo: {
                    sessionId: session.sessionId,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt,
                    lastActivity: session.lastActivity
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                authenticated: false,
                error: '유효하지 않은 세션입니다.'
            });
        }
    } catch (error) {
        console.error('Session Check API Error:', error);

        return NextResponse.json(
            {
                success: false,
                authenticated: false,
                error: '세션 확인 중 오류가 발생했습니다.',
                details: error instanceof Error ? error.message : '알 수 없는 오류'
            },
            { status: 500 }
        );
    }
} 