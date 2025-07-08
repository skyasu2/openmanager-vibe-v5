/**
 * 🔐 NextAuth Sign In Page - GitHub OAuth
 *
 * OpenManager Vibe v5 - NextAuth 기반 GitHub OAuth 로그인 페이지
 * 별도 GitHub OAuth 로그인 페이지 (선택적 사용)
 */

'use client';

import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 🚫 정적 생성 완전 비활성화 (동적 렌더링만 사용)
export const dynamic = 'force-dynamic';

export default function NextAuthSignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // 이미 로그인된 사용자인지 확인
    checkExistingSession();
  }, []);

  /**
   * 🔍 기존 세션 확인
   */
  const checkExistingSession = async () => {
    try {
      const session = await getSession();
      if (session) {
        console.log('✅ 기존 NextAuth 세션 감지:', session.user);
        router.push('/');
      }
    } catch (error) {
      console.error('세션 확인 중 오류:', error);
    }
  };

  /**
   * 🔐 GitHub OAuth 로그인 처리
   */
  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 NextAuth GitHub OAuth 로그인 시작...');

      // NextAuth signIn 호출
      const result = await signIn('github', {
        callbackUrl: '/',
        redirect: false,
      });

      if (result?.error) {
        console.error('GitHub OAuth 로그인 실패:', result.error);
        setError(`GitHub 로그인 실패: ${result.error}`);
        return;
      }

      if (result?.url) {
        console.log('✅ GitHub OAuth 로그인 성공, 리다이렉팅...');
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('GitHub OAuth 로그인 중 오류:', error);
      setError('GitHub 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔙 기존 로그인 페이지로 돌아가기
   */
  const handleBackToMainLogin = () => {
    router.push('/login');
  };

  // 클라이언트 렌더링이 준비되지 않았으면 로딩 표시
  if (!isClient) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center'>
        <div className='text-white'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* 헤더 */}
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-white'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <h1 className='text-2xl font-bold text-white mb-2'>GitHub OAuth</h1>
          <p className='text-gray-400'>NextAuth 기반 GitHub 로그인</p>
        </div>

        {/* 로그인 폼 */}
        <div className='bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 space-y-6'>
          {/* 에러 메시지 */}
          {error && (
            <div className='bg-red-900/50 border border-red-700 rounded-lg p-4'>
              <div className='flex'>
                <svg
                  className='h-5 w-5 text-red-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
                <div className='ml-3'>
                  <p className='text-sm text-red-300'>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* GitHub 로그인 버튼 */}
          <div>
            <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className='w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
            >
              {isLoading ? (
                <>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3'></div>
                  로그인 중...
                </>
              ) : (
                <>
                  <svg
                    className='w-5 h-5 mr-3'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  GitHub으로 로그인
                </>
              )}
            </button>
          </div>

          {/* 기존 로그인 페이지로 돌아가기 */}
          <div>
            <button
              onClick={handleBackToMainLogin}
              className='w-full flex justify-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200'
            >
              메인 로그인 페이지로 돌아가기
            </button>
          </div>
        </div>

        {/* 정보 표시 */}
        <div className='text-center mt-8'>
          <div className='text-xs text-gray-500 space-y-1'>
            <p>🔐 NextAuth 기반 GitHub OAuth</p>
            <p>🔒 안전한 JWT 토큰 기반 인증</p>
          </div>
        </div>
      </div>
    </div>
  );
}
