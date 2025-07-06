/**
 * 🔐 GoogleLoginButton - Google OAuth 로그인 버튼
 * 
 * OpenManager Vibe v5 Google 인증 컴포넌트
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { GoogleOAuthService } from '@/services/auth/google-oauth-service';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export interface GoogleLoginButtonProps {
    onLoginSuccess?: (result: any) => void;
    className?: string;
    buttonText?: string;
    disabled?: boolean;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
    onLoginSuccess,
    className = '',
    buttonText = 'Google로 로그인',
    disabled = false
}) => {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 이미 인증된 경우 렌더링하지 않음
    if (isAuthenticated) {
        return null;
    }

    const handleGoogleLogin = async () => {
        if (disabled || isLoading) return;

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // OAuth 서비스 초기화
            const oauthService = new GoogleOAuthService();
            const authUrl = oauthService.getAuthUrl();

            // 인증 URL로 리다이렉트
            window.location.href = authUrl;

        } catch (error) {
            console.error('Google OAuth 초기화 실패:', error);

            // 구체적인 에러 메시지 설정
            if (error instanceof Error) {
                switch (error.message) {
                    case 'Failed to exchange authorization code for token':
                        setError('Google OAuth 토큰 교환이 실패했습니다.');
                        break;
                    case 'Failed to fetch Google user profile':
                        setError('Google 프로필 정보를 가져오는데 실패했습니다.');
                        break;
                    case 'Network':
                        setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
                        break;
                    default:
                        setError('로그인에 실패했습니다. 다시 시도해주세요.');
                }
            } else {
                setError('알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleGoogleLogin();
        }
    };

    const buttonClasses = `
    bg-blue-600 hover:bg-blue-700 
    disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50
    text-white font-bold py-3 px-6 rounded-lg
    flex items-center justify-center gap-3
    transition-all duration-200 ease-in-out
    transform hover:scale-105 active:scale-95
    focus:outline-none focus:ring-4 focus:ring-blue-300
    min-w-[200px] h-[48px]
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <div className="flex flex-col items-center gap-3">
            <button
                type="button"
                onClick={handleGoogleLogin}
                onKeyDown={handleKeyDown}
                disabled={disabled || isLoading}
                className={buttonClasses}
                aria-label="Google로 로그인"
                aria-describedby="google-login-description"
                aria-busy={isLoading}
                aria-live="polite"
            >
                {isLoading ? (
                    <>
                        {/* 로딩 스피너 */}
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        로그인 중...
                    </>
                ) : (
                    <>
                        {/* Google 아이콘 */}
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {buttonText}
                    </>
                )}
            </button>

            {/* 설명 텍스트 */}
            <p
                id="google-login-description"
                className="text-sm text-gray-600 text-center max-w-md"
            >
                Google 계정으로 안전하게 로그인하고 모든 기능을 이용하세요
            </p>

            {/* 에러 메시지 */}
            {error && (
                <div
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                </div>
            )}

            {/* 성공 메시지 */}
            {successMessage && (
                <div
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {successMessage}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleLoginButton; 