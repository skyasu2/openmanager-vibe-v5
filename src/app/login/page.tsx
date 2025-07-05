/**
 * 🔐 Login Page - Google OAuth 인증
 * 
 * "시스템 시작" 대신 "Google로 로그인" 페이지
 */

'use client';

import { AuthStateManager } from '@/services/auth/AuthStateManager';
import { GoogleOAuthService } from '@/services/auth/GoogleOAuthService';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [googleOAuthService] = useState(() => new GoogleOAuthService());
    const [authManager] = useState(() => new AuthStateManager());

    useEffect(() => {
        // URL에서 authorization code 확인 (OAuth callback 처리)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            setError(`OAuth 인증 실패: ${error}`);
            return;
        }

        if (code && state) {
            handleOAuthCallback(code, state);
        }
    }, []);

    /**
     * 🔐 Google OAuth 로그인 시작
     */
    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const authUrl = googleOAuthService.getAuthUrl();
            window.location.href = authUrl;

        } catch (error) {
            console.error('Google OAuth 로그인 시작 실패:', error);
            setError('Google 로그인을 시작할 수 없습니다.');
            setIsLoading(false);
        }
    };

    /**
     * 👤 게스트 모드 로그인
     */
    const handleGuestLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await authManager.loginAsGuest();

            if (result.success) {
                // 세션 정보를 로컬 스토리지에 저장
                localStorage.setItem('auth_session', result.sessionId!);
                localStorage.setItem('auth_user', JSON.stringify(result.user));

                // 대시보드로 리다이렉트
                router.push('/dashboard');
            } else {
                setError(result.error || '게스트 로그인에 실패했습니다.');
            }

        } catch (error) {
            console.error('게스트 로그인 실패:', error);
            setError('게스트 로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 🔄 OAuth Callback 처리
     */
    const handleOAuthCallback = async (code: string, state: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // State 검증 (CSRF 보호)
            if (!googleOAuthService.verifyState(state)) {
                throw new Error('Invalid state parameter');
            }

            // Authorization Code를 Access Token으로 교환
            const tokenResponse = await googleOAuthService.exchangeCodeForToken(code);

            // AuthStateManager를 통해 로그인 처리
            const result = await authManager.loginWithGoogle(tokenResponse.access_token);

            if (result.success) {
                // 세션 정보를 로컬 스토리지에 저장
                localStorage.setItem('auth_session', result.sessionId!);
                localStorage.setItem('auth_user', JSON.stringify(result.user));
                localStorage.setItem('google_access_token', tokenResponse.access_token);

                // URL 정리
                window.history.replaceState({}, document.title, '/login');

                // 대시보드로 리다이렉트
                router.push('/dashboard');
            } else {
                setError(result.error || 'Google 로그인에 실패했습니다.');
            }

        } catch (error) {
            console.error('OAuth callback 처리 실패:', error);
            setError('Google 인증 처리 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full space-y-8"
            >
                {/* 로고 및 제목 */}
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6"
                    >
                        <span className="text-white text-2xl font-bold">OM</span>
                    </motion.div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        OpenManager Vibe v5
                    </h2>
                    <p className="text-gray-600">
                        시스템에 로그인하여 시작하세요
                    </p>
                </div>

                {/* 로그인 폼 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
                >
                    {/* 에러 메시지 */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Google 로그인 버튼 */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                <span>로그인 중...</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Google로 로그인</span>
                            </div>
                        )}
                    </button>

                    {/* 구분선 */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">또는</span>
                        </div>
                    </div>

                    {/* 게스트 로그인 버튼 */}
                    <button
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>일반사용자로 계속</span>
                        </div>
                    </button>

                    {/* 시스템 정보 */}
                    <div className="text-center text-sm text-gray-500 space-y-1">
                        <p>로그인하면 시스템이 자동으로 시작됩니다</p>
                        <p className="text-xs">Google 계정: 전체 기능 이용 가능</p>
                        <p className="text-xs">게스트 모드: 제한된 기능 이용 가능</p>
                    </div>
                </motion.div>

                {/* 푸터 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-center text-sm text-gray-500"
                >
                    <p>© 2024 OpenManager Vibe v5. All rights reserved.</p>
                </motion.div>
            </motion.div>
        </div>
    );
} 