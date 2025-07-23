/**
 * 🔐 GitHub Login Button (Supabase Auth)
 *
 * Supabase Auth 기반 GitHub OAuth 로그인 버튼
 * NextAuth에서 Supabase Auth로 마이그레이션됨
 */

'use client';

import { motion } from 'framer-motion';
import { useSession, signIn, signOut } from '@/hooks/useSupabaseSession';
import { useState } from 'react';
import Image from 'next/image';

export interface GitHubLoginButtonProps {
  onLoginError?: (error: string) => void;
  className?: string;
  buttonText?: string;
  showUserInfo?: boolean;
  callbackUrl?: string;
}

export default function GitHubLoginButton({
  onLoginError,
  className = '',
  buttonText = 'GitHub으로 로그인',
  showUserInfo = true,
  callbackUrl = '/main', // 기본값을 /main으로 변경
}: GitHubLoginButtonProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 🔐 GitHub OAuth 로그인 처리
   */
  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);

      console.log('🔐 Supabase Auth GitHub 로그인 시작...');

      await signIn('github', {
        callbackUrl,
      });

      // 로그인이 성공하면 자동으로 리다이렉트됨
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
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600'></div>
        <span className='ml-2 text-gray-600'>세션 확인 중...</span>
      </div>
    );
  }

  // 이미 로그인된 경우
  if (status === 'authenticated' && session) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* 사용자 정보 표시 */}
        {showUserInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-green-50 border border-green-200 rounded-lg p-4'
          >
            <div className='flex items-center space-x-3'>
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user?.name || 'User'}
                  width={40}
                  height={40}
                  className='w-10 h-10 rounded-full'
                />
              )}
              <div>
                <p className='text-sm font-medium text-green-800'>
                  {session.user?.name || 'GitHub 사용자'}
                </p>
                <p className='text-xs text-green-600'>{session.user?.email}</p>
                <p className='text-xs text-green-500'>
                  ✅ GitHub OAuth (Supabase Auth) 인증됨
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleGitHubLogout}
          disabled={isLoading}
          className={`
                        w-full flex justify-center items-center py-3 px-4 border border-transparent
                        text-sm font-medium rounded-lg text-white
                        ${
                          isLoading
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                        }
                        transition-colors duration-200
                    `}
        >
          {isLoading ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-3 h-4 w-4 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
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
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleGitHubLogin}
      disabled={isLoading}
      className={`
                w-full flex justify-center items-center py-3 px-4 border border-transparent
                text-sm font-medium rounded-lg text-white
                ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                }
                transition-all duration-200 ${className}
            `}
    >
      {isLoading ? (
        <>
          <svg
            className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
          GitHub 로그인 중...
        </>
      ) : (
        <>
          <svg className='w-5 h-5 mr-3' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
              clipRule='evenodd'
            />
          </svg>
          {buttonText}
        </>
      )}
    </motion.button>
  );
}
