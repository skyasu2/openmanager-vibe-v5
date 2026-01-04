/**
 * 🔐 GitHub Login Button (Supabase Auth)
 *
 * Supabase Auth 기반 GitHub OAuth 로그인 버튼
 * NextAuth에서 Supabase Auth로 마이그레이션됨
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { signIn, signOut, useSession } from '@/hooks/useSupabaseSession';

export interface GitHubLoginButtonProps {
  onLoginError?: (error: string) => void;
  className?: string;
  buttonText?: string;
  showUserInfo?: boolean;
  callbackUrl?: string;
  // Controlled mode props
  onClick?: () => void | Promise<void>;
  isLoading?: boolean;
  loadingMessage?: string;
  pulse?: boolean;
}

export default function GitHubLoginButton({
  onLoginError,
  className = '',
  buttonText = 'GitHub으로 로그인',
  showUserInfo = true,
  callbackUrl = '/main',
  // Controlled mode
  onClick,
  isLoading: externalLoading,
  loadingMessage,
  pulse = false,
}: GitHubLoginButtonProps) {
  const { data: session, status } = useSession();
  const [internalLoading, setInternalLoading] = useState(false);

  // Controlled mode: 외부 로딩 상태 우선, 없으면 내부 상태 사용
  const isLoading = externalLoading ?? internalLoading;
  const setIsLoading = setInternalLoading;

  /**
   * 🔐 GitHub OAuth 로그인 처리
   * Controlled mode: onClick이 제공되면 외부 핸들러 호출
   */
  const handleGitHubLogin = async () => {
    // Controlled mode: 외부 onClick 핸들러 사용
    if (onClick) {
      await onClick();
      return;
    }

    // Standalone mode: 내부 로직 사용
    try {
      setIsLoading(true);
      console.log('🔐 Supabase Auth GitHub 로그인 시작...');

      await signIn('github', {
        callbackUrl,
      });

      console.log('✅ GitHub 로그인 시작, OAuth 페이지로 이동...');
    } catch (error) {
      const errorMessage = 'GitHub 로그인 중 오류가 발생했습니다.';
      console.error(errorMessage, error);
      onLoginError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔐 GitHub OAuth 로그아웃 처리
   */
  const handleGitHubLogout = async () => {
    try {
      setIsLoading(true);
      console.log('🔐 Supabase Auth GitHub 로그아웃...');

      await signOut({
        callbackUrl: '/login',
      });

      console.log('✅ GitHub 로그아웃 완료');
    } catch (error) {
      console.error('GitHub 로그아웃 중 오류:', error);
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
                  {session.user?.name || 'GitHub 사용자'}
                </p>
                <p className="text-xs text-green-600">{session.user?.email}</p>
                <p className="text-xs text-green-500">
                  ✅ GitHub OAuth (Supabase Auth) 인증됨
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => {
            void handleGitHubLogout();
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
        void handleGitHubLogin();
      }}
      disabled={isLoading}
      className={`flex w-full items-center justify-center rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-white ${
        isLoading
          ? 'cursor-not-allowed bg-gray-600'
          : 'bg-gray-800 hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
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
          {loadingMessage || 'GitHub 로그인 중...'}
        </>
      ) : (
        <>
          <svg
            className="mr-3 h-5 w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
}
