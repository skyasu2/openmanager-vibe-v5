/**
 * 🔐 Google OAuth Service
 * 
 * Google OAuth 2.0 인증 서비스
 */

import { getEnvironmentVar } from '@/lib/env-crypto-manager';

export interface GoogleOAuthConfig {
    clientId: string;
    redirectUri: string;
    scope: string[];
}

export interface GoogleTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    id_token?: string;
}

export interface GoogleUserProfile {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

export class GoogleOAuthService {
    private config: GoogleOAuthConfig;

    constructor() {
        this.config = {
            clientId: getEnvironmentVar('GOOGLE_OAUTH_CLIENT_ID') ||
                process.env.GOOGLE_OAUTH_CLIENT_ID ||
                '',
            redirectUri: getEnvironmentVar('GOOGLE_OAUTH_REDIRECT_URI') ||
                process.env.GOOGLE_OAUTH_REDIRECT_URI ||
                (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback'),
            scope: [
                'openid',
                'email',
                'profile'
            ]
        };
    }

    /**
     * 🔗 Google OAuth 로그인 URL 생성
     */
    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: this.config.scope.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            state: this.generateState()
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * 🎫 Authorization Code를 Access Token으로 교환
     */
    async exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: getEnvironmentVar('GOOGLE_OAUTH_CLIENT_SECRET') ||
                        process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: this.config.redirectUri,
                }),
            });

            if (!response.ok) {
                throw new Error(`Token exchange failed: ${response.statusText}`);
            }

            const tokenData: GoogleTokenResponse = await response.json();
            return tokenData;

        } catch (error) {
            console.error('Google OAuth token exchange 실패:', error);
            throw new Error('Failed to exchange authorization code for token');
        }
    }

    /**
     * 👤 Access Token으로 사용자 프로필 가져오기
     */
    async getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user profile: ${response.statusText}`);
            }

            const profile: GoogleUserProfile = await response.json();
            return profile;

        } catch (error) {
            console.error('Google 사용자 프로필 가져오기 실패:', error);
            throw new Error('Failed to fetch Google user profile');
        }
    }

    /**
     * 🔍 Access Token 검증
     */
    async verifyToken(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);

            if (!response.ok) {
                return false;
            }

            const tokenInfo = await response.json();

            // 토큰이 우리 클라이언트 ID와 일치하는지 확인
            return tokenInfo.aud === this.config.clientId && !tokenInfo.error;

        } catch (error) {
            console.error('Google 토큰 검증 실패:', error);
            return false;
        }
    }

    /**
     * 🚪 Google OAuth 로그아웃 (토큰 무효화)
     */
    async revokeToken(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            return response.ok;

        } catch (error) {
            console.error('Google 토큰 무효화 실패:', error);
            return false;
        }
    }

    /**
     * 🎲 State 값 생성 (CSRF 보호)
     */
    private generateState(): string {
        const state = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        // 세션 스토리지에 state 저장 (CSRF 검증용)
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('google_oauth_state', state);
        }

        return state;
    }

    /**
     * 🔐 State 값 검증 (CSRF 보호)
     */
    verifyState(state: string): boolean {
        if (typeof window === 'undefined') {
            return true; // 서버사이드에서는 검증 스킵
        }

        const storedState = sessionStorage.getItem('google_oauth_state');
        sessionStorage.removeItem('google_oauth_state'); // 일회용이므로 삭제

        return storedState === state;
    }

    /**
     * 📊 OAuth 설정 정보
     */
    getConfig(): GoogleOAuthConfig {
        return { ...this.config };
    }

    /**
     * 🧪 개발 모드 체크
     */
    isDevelopmentMode(): boolean {
        return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    }
} 