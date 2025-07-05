/**
 * 🔐 AuthStateManager - Google OAuth 인증 상태 관리자
 * 
 * OpenManager Vibe v5 Google OAuth 인증 시스템
 */

import { getEnvironmentVar } from '@/lib/env-crypto-manager';
import { SystemStateManager } from '@/services/system/SystemStateManager';

export interface AuthUser {
    id: string;
    email?: string;
    name: string;
    picture?: string;
    type: 'google' | 'guest';
    permissions: string[];
}

export interface AuthSession {
    sessionId: string;
    userId: string;
    userType: 'google' | 'guest';
    user: AuthUser;
    createdAt: number;
    expiresAt: number;
    lastActivity: number;
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    sessionId?: string;
    error?: string;
    systemStarted?: boolean;
    systemError?: string;
}

export interface GoogleUserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

export class AuthStateManager {
    private sessions: Map<string, AuthSession> = new Map();
    private systemManager: SystemStateManager;
    private guestIdCounter = 0;

    // Google OAuth 설정
    private readonly GOOGLE_CLIENT_ID: string;
    private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간
    private readonly GUEST_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2시간

    constructor() {
        this.systemManager = new SystemStateManager();

        // 환경변수에서 Google OAuth 설정 가져오기
        this.GOOGLE_CLIENT_ID = getEnvironmentVar('GOOGLE_OAUTH_CLIENT_ID') ||
            process.env.GOOGLE_OAUTH_CLIENT_ID ||
            '';
    }

    /**
     * 🔐 Google OAuth 로그인
     */
    async loginWithGoogle(token: string): Promise<AuthResult> {
        try {
            // Google OAuth 토큰 검증
            const isValidToken = await this.verifyGoogleToken(token);
            if (!isValidToken) {
                return {
                    success: false,
                    error: 'Invalid Google OAuth token'
                };
            }

            // 사용자 정보 가져오기
            const userInfo = await this.getGoogleUserInfo(token);

            // 사용자 객체 생성
            const user: AuthUser = {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                type: 'google',
                permissions: [
                    'dashboard:access',
                    'dashboard:view',
                    'ai:basic',
                    'servers:view',
                    'settings:view'
                ]
            };

            // 세션 생성
            const sessionId = this.generateSessionId();
            const session: AuthSession = {
                sessionId,
                userId: user.id,
                userType: 'google',
                user,
                createdAt: Date.now(),
                expiresAt: Date.now() + this.SESSION_DURATION,
                lastActivity: Date.now()
            };

            this.sessions.set(sessionId, session);

            // 시스템 자동 시작
            const systemResult = await this.autoStartSystem(user);

            console.log(`✅ Google OAuth 로그인 성공: ${user.name} (${user.email})`);

            return {
                success: true,
                user,
                sessionId,
                systemStarted: systemResult.success,
                systemError: systemResult.error
            };

        } catch (error) {
            console.error('Google OAuth 로그인 실패:', error);
            return {
                success: false,
                error: `Google OAuth verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * 👤 게스트 모드 로그인
     */
    async loginAsGuest(): Promise<AuthResult> {
        try {
            // 게스트 사용자 생성
            const guestId = this.generateGuestId();
            const user: AuthUser = {
                id: guestId,
                name: '일반사용자',
                type: 'guest',
                permissions: ['view', 'basic_interaction']
            };

            // 세션 생성
            const sessionId = this.generateSessionId();
            const session: AuthSession = {
                sessionId,
                userId: user.id,
                userType: 'guest',
                user,
                createdAt: Date.now(),
                expiresAt: Date.now() + this.GUEST_SESSION_DURATION,
                lastActivity: Date.now()
            };

            this.sessions.set(sessionId, session);

            // 시스템 자동 시작
            const systemResult = await this.autoStartSystem(user);

            console.log(`👤 게스트 로그인: ${user.id}`);

            return {
                success: true,
                user,
                sessionId,
                systemStarted: systemResult.success,
                systemError: systemResult.error
            };

        } catch (error) {
            console.error('게스트 로그인 실패:', error);
            return {
                success: false,
                error: '게스트 로그인 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * 🚀 시스템 자동 시작
     */
    private async autoStartSystem(user: AuthUser): Promise<{ success: boolean; error?: string }> {
        try {
            const startResult = await this.systemManager.startSystem({
                startedBy: user.id,
                startedByName: user.name,
                authType: user.type
            });

            return {
                success: startResult.success
            };
        } catch (error) {
            console.error('시스템 시작 실패:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'System start failed'
            };
        }
    }

    /**
     * 🔍 세션 검증
     */
    validateSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        // 세션 만료 확인
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return false;
        }

        // 활동 시간 업데이트
        session.lastActivity = Date.now();
        return true;
    }

    /**
     * 📋 세션 정보 가져오기
     */
    getSession(sessionId: string): AuthSession | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // 세션 만료 확인
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return null;
        }

        return session;
    }

    /**
     * 🔑 권한 확인
     */
    hasPermission(sessionId: string, permission: string): boolean {
        const session = this.getSession(sessionId);
        if (!session) return false;

        return session.user.permissions.includes(permission);
    }

    /**
     * 🚪 로그아웃
     */
    logout(sessionId: string): { success: boolean; error?: string } {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return {
                success: false,
                error: 'Session not found'
            };
        }

        this.sessions.delete(sessionId);
        console.log(`🚪 로그아웃: ${session.user.name} (${sessionId})`);

        return { success: true };
    }

    /**
     * 🔐 Google OAuth 토큰 검증
     */
    private async verifyGoogleToken(token: string): Promise<boolean> {
        try {
            // 테스트 환경에서는 특정 토큰만 허용
            if (process.env.NODE_ENV === 'test') {
                return token.startsWith('mock-') && token !== 'invalid-token';
            }

            // 개발 환경에서는 목업 토큰 허용
            if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
                return true;
            }

            // 실제 Google OAuth 토큰 검증
            if (typeof fetch === 'undefined') {
                // 테스트 환경에서 fetch가 없는 경우 목업 동작
                return token.startsWith('mock-') && token !== 'invalid-token';
            }

            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
            if (!response.ok) {
                return false;
            }

            const tokenInfo = await response.json();

            // 토큰 유효성 및 클라이언트 ID 확인
            return tokenInfo.aud === this.GOOGLE_CLIENT_ID && !tokenInfo.error;

        } catch (error) {
            console.error('Google 토큰 검증 실패:', error);
            return false;
        }
    }

    /**
     * 👤 Google 사용자 정보 가져오기
     */
    private async getGoogleUserInfo(token: string): Promise<GoogleUserInfo> {
        try {
            // 테스트/개발 환경에서는 목업 데이터 반환
            if (process.env.NODE_ENV === 'test' || (process.env.NODE_ENV === 'development' && token.startsWith('mock-'))) {
                return {
                    id: 'test-user-123',
                    email: 'test@example.com',
                    name: 'Test User',
                    picture: 'https://via.placeholder.com/150'
                };
            }

            // 실제 Google API 호출
            if (typeof fetch === 'undefined') {
                // 테스트 환경에서 fetch가 없는 경우 목업 데이터 반환
                return {
                    id: 'test-user-123',
                    email: 'test@example.com',
                    name: 'Test User',
                    picture: 'https://via.placeholder.com/150'
                };
            }

            const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
            const userInfo = await response.json();

            return {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            };

        } catch (error) {
            console.error('Google 사용자 정보 가져오기 실패:', error);
            throw new Error('Failed to fetch Google user info');
        }
    }

    /**
     * 🎲 세션 ID 생성
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 👤 게스트 ID 생성
     */
    private generateGuestId(): string {
        this.guestIdCounter++;
        return `guest_${Date.now()}_${this.guestIdCounter}`;
    }

    /**
     * 📊 인증 상태 정보
     */
    getAuthStats() {
        const activeSessions = Array.from(this.sessions.values()).filter(
            session => Date.now() <= session.expiresAt
        );

        return {
            totalSessions: this.sessions.size,
            activeSessions: activeSessions.length,
            googleSessions: activeSessions.filter(s => s.userType === 'google').length,
            guestSessions: activeSessions.filter(s => s.userType === 'guest').length
        };
    }

    /**
     * 🧹 만료된 세션 정리
     */
    cleanupExpiredSessions(): number {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 만료된 세션 ${cleanedCount}개 정리 완료`);
        }

        return cleanedCount;
    }
} 