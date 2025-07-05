/**
 * 🔄 Google OAuth Callback API Route
 * 
 * Google OAuth 인증 콜백 처리
 */

import { AuthStateManager } from '@/services/auth/AuthStateManager';
import { GoogleOAuthService } from '@/services/auth/GoogleOAuthService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // OAuth 에러 처리
        if (error) {
            console.error('Google OAuth 에러:', error);
            return NextResponse.redirect(
                new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
            );
        }

        // 필수 파라미터 확인
        if (!code || !state) {
            console.error('OAuth callback: 필수 파라미터 누락', { code: !!code, state: !!state });
            return NextResponse.redirect(
                new URL('/login?error=missing_parameters', request.url)
            );
        }

        const googleOAuthService = new GoogleOAuthService();
        const authManager = new AuthStateManager();

        // State 검증 (CSRF 보호)
        // 참고: 서버사이드에서는 세션 스토리지에 접근할 수 없으므로
        // 클라이언트에서 검증하도록 리다이렉트
        return NextResponse.redirect(
            new URL(`/login?code=${code}&state=${state}`, request.url)
        );

    } catch (error) {
        console.error('Google OAuth callback 처리 실패:', error);
        return NextResponse.redirect(
            new URL('/login?error=callback_failed', request.url)
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, state } = body;

        if (!code || !state) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const googleOAuthService = new GoogleOAuthService();
        const authManager = new AuthStateManager();

        // Authorization Code를 Access Token으로 교환
        const tokenResponse = await googleOAuthService.exchangeCodeForToken(code);

        // AuthStateManager를 통해 로그인 처리
        const result = await authManager.loginWithGoogle(tokenResponse.access_token);

        if (result.success) {
            return NextResponse.json({
                success: true,
                user: result.user,
                sessionId: result.sessionId,
                systemStarted: result.systemStarted
            });
        } else {
            return NextResponse.json(
                { error: result.error },
                { status: 401 }
            );
        }

    } catch (error) {
        console.error('Google OAuth POST callback 처리 실패:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
} 