/**
 * 🔐 useAuth Hook - 인증 상태 관리 훅
 * 
 * OpenManager Vibe v5 인증 시스템 React 훅
 */

'use client';

import { AuthResult, AuthStateManager, AuthUser } from '@/services/auth/AuthStateManager';
import { useCallback, useEffect, useState } from 'react';

// 전역 AuthStateManager 인스턴스
let authManagerInstance: AuthStateManager | null = null;

const getAuthManager = (): AuthStateManager => {
    if (!authManagerInstance) {
        authManagerInstance = new AuthStateManager();
    }
    return authManagerInstance;
};

export interface UseAuthReturn {
    // 상태
    isAuthenticated: boolean;
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;

    // 액션
    login: {
        withGoogle: (token?: string) => Promise<AuthResult>;
        asGuest: () => Promise<AuthResult>;
    };
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;

    // 권한
    hasPermission: (permission: string) => boolean;

    // 세션
    getSessionInfo: () => any;
}

export const useAuth = (): UseAuthReturn => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const authManager = getAuthManager();

    // 세션 복구 및 초기화
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setIsLoading(true);

                // 로컬 스토리지에서 세션 정보 복구
                const savedSessionId = localStorage.getItem('auth_session_id');
                const savedUser = localStorage.getItem('auth_user');

                if (savedSessionId && savedUser) {
                    // 세션 유효성 검증
                    const isValidSession = authManager.validateSession(savedSessionId);

                    if (isValidSession) {
                        const parsedUser = JSON.parse(savedUser);
                        setIsAuthenticated(true);
                        setUser(parsedUser);
                        setSessionId(savedSessionId);
                        console.log('✅ 세션 복구 성공:', parsedUser.name);
                    } else {
                        // 만료된 세션 정리
                        localStorage.removeItem('auth_session_id');
                        localStorage.removeItem('auth_user');
                        console.log('⏰ 만료된 세션 정리 완료');
                    }
                }
            } catch (error) {
                console.error('❌ 인증 초기화 실패:', error);
                setError('인증 시스템 초기화에 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // 세션 정리 (컴포넌트 언마운트 시)
    useEffect(() => {
        const handleBeforeUnload = () => {
            authManager.cleanupExpiredSessions();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Google OAuth 로그인
    const loginWithGoogle = useCallback(async (token?: string): Promise<AuthResult> => {
        try {
            setIsLoading(true);
            setError(null);

            let authToken = token;

            // 토큰이 제공되지 않은 경우 Google OAuth 플로우 시작
            if (!authToken) {
                authToken = await initiateGoogleOAuth();
            }

            const result = await authManager.loginWithGoogle(authToken);

            if (result.success && result.user && result.sessionId) {
                setIsAuthenticated(true);
                setUser(result.user);
                setSessionId(result.sessionId);

                // 세션 정보 로컬 스토리지에 저장
                localStorage.setItem('auth_session_id', result.sessionId);
                localStorage.setItem('auth_user', JSON.stringify(result.user));

                console.log('✅ Google 로그인 성공:', result.user.name);
            } else {
                setError(result.error || 'Google 로그인에 실패했습니다.');
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.';
            setError(errorMessage);
            console.error('❌ Google 로그인 실패:', error);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 게스트 로그인
    const loginAsGuest = useCallback(async (): Promise<AuthResult> => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await authManager.loginAsGuest();

            if (result.success && result.user && result.sessionId) {
                setIsAuthenticated(true);
                setUser(result.user);
                setSessionId(result.sessionId);

                // 게스트 세션은 로컬 스토리지에 저장하지 않음 (보안상 이유)
                console.log('👤 게스트 로그인 성공:', result.user.id);
            } else {
                setError(result.error || '게스트 로그인에 실패했습니다.');
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '게스트 로그인 중 오류가 발생했습니다.';
            setError(errorMessage);
            console.error('❌ 게스트 로그인 실패:', error);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 로그아웃
    const logout = useCallback(async (): Promise<void> => {
        try {
            if (sessionId) {
                authManager.logout(sessionId);
            }

            // 상태 초기화
            setIsAuthenticated(false);
            setUser(null);
            setSessionId(null);
            setError(null);

            // 로컬 스토리지 정리
            localStorage.removeItem('auth_session_id');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('google_oauth_token');

            console.log('🚪 로그아웃 완료');
        } catch (error) {
            console.error('❌ 로그아웃 실패:', error);
        }
    }, [sessionId]);

    // 인증 상태 새로고침
    const refreshAuth = useCallback(async (): Promise<void> => {
        if (!sessionId) return;

        try {
            const isValidSession = authManager.validateSession(sessionId);

            if (!isValidSession) {
                await logout();
            }
        } catch (error) {
            console.error('❌ 인증 새로고침 실패:', error);
            await logout();
        }
    }, [sessionId, logout]);

    // 권한 확인
    const hasPermission = useCallback((permission: string): boolean => {
        if (!sessionId || !isAuthenticated) return false;
        return authManager.hasPermission(sessionId, permission);
    }, [sessionId, isAuthenticated]);

    // 세션 정보 가져오기
    const getSessionInfo = useCallback(() => {
        if (!sessionId) return null;
        return authManager.getSession(sessionId);
    }, [sessionId]);

    return {
        // 상태
        isAuthenticated,
        user,
        isLoading,
        error,

        // 액션
        login: {
            withGoogle: loginWithGoogle,
            asGuest: loginAsGuest
        },
        logout,
        refreshAuth,

        // 권한
        hasPermission,

        // 세션
        getSessionInfo
    };
};

/**
 * 🔐 Google OAuth 플로우 시작
 */
async function initiateGoogleOAuth(): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // 개발 환경에서는 목업 토큰 반환
            if (process.env.NODE_ENV === 'development') {
                resolve('mock-google-token');
                return;
            }

            // Google API 스크립트 로드 확인
            if (typeof window.gapi === 'undefined') {
                loadGoogleAPI().then(() => {
                    startOAuthFlow(resolve, reject);
                }).catch(reject);
            } else {
                startOAuthFlow(resolve, reject);
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 📜 Google API 스크립트 로드
 */
function loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            window.gapi.load('auth2', () => {
                resolve();
            });
        };
        script.onerror = () => reject(new Error('Google API 스크립트 로드 실패'));
        document.head.appendChild(script);
    });
}

/**
 * 🚀 OAuth 플로우 시작
 */
function startOAuthFlow(resolve: (token: string) => void, reject: (error: Error) => void) {
    try {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

        if (!clientId) {
            reject(new Error('Google OAuth Client ID가 설정되지 않았습니다.'));
            return;
        }

        window.gapi.auth2.init({
            client_id: clientId
        }).then(() => {
            const authInstance = window.gapi.auth2.getAuthInstance();

            authInstance.signIn().then((googleUser: any) => {
                const authResponse = googleUser.getAuthResponse();
                resolve(authResponse.access_token);
            }).catch((error: any) => {
                reject(new Error(`Google OAuth 로그인 실패: ${error.error || 'Unknown error'}`));
            });
        }).catch((error: any) => {
            reject(new Error(`Google OAuth 초기화 실패: ${error.error || 'Unknown error'}`));
        });
    } catch (error) {
        reject(error instanceof Error ? error : new Error('OAuth 플로우 시작 실패'));
    }
}

// 전역 타입 확장
declare global {
    interface Window {
        gapi: any;
    }
}

export default useAuth; 