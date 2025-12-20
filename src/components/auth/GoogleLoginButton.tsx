/**
 * 🔐 Google Login Button (Supabase Auth)
 *
 * Supabase Auth 기반 Google OAuth 로그인 버튼
 * GitHub 로그인 버튼에서 복사됨
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { signOut, useSession } from '@/hooks/useSupabaseSession';
import { signInWithGoogle } from '@/lib/auth/supabase-auth';

export interface GoogleLoginButtonProps {
  onLoginError?: (error: string) => void;
  className?: string;
  buttonText?: string;
  showUserInfo?: boolean;
  // Controlled mode props
  onClick?: () => void | Promise<void>;
  isLoading?: boolean;
  loadingMessage?: string;
  pulse?: boolean;
}

export default function GoogleLoginButton({
  onLoginError,
  className = '',
  buttonText = 'Google로 로그인',
  showUserInfo = true,
  // Controlled mode
  onClick,
  isLoading: externalLoading,
  loadingMessage,
  pulse = false,
}: GoogleLoginButtonProps) {
  const { data: session, status } = useSession();
  const [internalLoading, setInternalLoading] = useState(false);

  // Controlled mode: 외부 로딩 상태 우선, 없으면 내부 상태 사용
  const isLoading = externalLoading ?? internalLoading;
  const setIsLoading = setInternalLoading;

  /**
   * 🔐 Google OAuth 로그인 처리
   * Controlled mode: onClick이 제공되면 외부 핸들러 호출
   */
  const handleGoogleLogin = async () => {
    // Controlled mode: 외부 onClick 핸들러 사용
    if (onClick) {
      await onClick();
      return;
    }

    // Standalone mode: 내부 로직 사용
    try {
      setIsLoading(true);
      console.log('🔐 Supabase Auth Google 로그인 시작...');

      // signInWithGoogle()은 이미 access_type, prompt 옵션을 내장하고 있음
      const { error } = await signInWithGoogle();

      if (error) {
        throw error;
      }

      console.log('✅ Google 로그인 시작, OAuth 페이지로 이동...');
    } catch (error) {
      const errorMessage = 'Google 로그인 중 오류가 발생했습니다.';
      console.error(errorMessage, error);
      onLoginError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔐 Google OAuth 로그아웃 처리
   */
  const handleGoogleLogout = async () => {
    try {
      setIsLoading(true);
      console.log('🔐 Supabase Auth Google 로그아웃...');

      await signOut({
        callbackUrl: '/login',
      });

      console.log('✅ Google 로그아웃 완료');
    } catch (error) {
      console.error('Google 로그아웃 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중일 때
  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-600"></div>
        <span className="ml-2 text-gray-600">세션 확인 중...</span>
      </div>
    );
  }

  // 이미 로그인된 경우
  if (status === 'authenticated' && session) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* 사용자 정보 표시 */}
        {showUserInfo && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center space-x-3">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user?.name || 'User'}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="text-sm font-medium text-green-800">
                  {session.user?.name || 'Google 사용자'}
                </p>
                <p className="text-xs text-green-600">{session.user?.email}</p>
                <p className="text-xs text-green-500">
                  ✅ Google OAuth (Supabase Auth) 인증됨
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => {
            void handleGoogleLogout();
          }}
          disabled={isLoading}
          className={`flex w-full items-center justify-center rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-white ${
            isLoading
              ? 'cursor-not-allowed bg-gray-600'
              : 'bg-red-600 hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
          } transition-colors duration-200`}
        >
          {isLoading ? (
            <>
              <svg
                className="-ml-1 mr-3 h-4 w-4 animate-spin text-white"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              로그아웃 중...
            </>
          ) : (
            '로그아웃'
          )}
        </button>
      </div>
    );
  }

  // 로그인 버튼
  return (
    <button
      onClick={() => {
        void handleGoogleLogin();
      }}
      disabled={isLoading}
      className={`flex w-full items-center justify-center rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-white ${
        isLoading
          ? 'cursor-not-allowed bg-gray-600'
          : 'bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      } ${pulse ? 'animate-pulse' : ''} transition-all duration-200 ${className} `}
    >
      {isLoading ? (
        <>
          <svg
            className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingMessage || 'Google 로그인 중...'}
        </>
      ) : (
        <>
          {/* Google Logo SVG */}
          <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#ffffff"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#ffffff"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#ffffff"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#ffffff"
            />
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
}
