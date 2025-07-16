/**
 * 🔐 Login Page - GitHub OAuth & 게스트 로그인
 *
 * OpenManager Vibe v5 로그인 시스템 (Google OAuth 제거됨)
 * 모든 로그인 성공 시 루트 페이지(/)로 리다이렉트
 */

'use client';

import { Github, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Supabase Auth 관련 임포트
import { signInWithGitHub } from '@/lib/supabase-auth';

// 게스트 로그인 관련 임포트
import { AuthStateManager, AuthUser } from '@/services/auth/AuthStateManager';

// 🚫 정적 생성 완전 비활성화 (동적 렌더링만 사용)
export const dynamic = 'force-dynamic';

interface GuestSessionData {
  sessionId: string;
  user: AuthUser;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'github' | 'guest' | null>(
    null
  );
  const [isClient, setIsClient] = useState(false);
  const [guestSession, setGuestSession] = useState<GuestSessionData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const authManager = new AuthStateManager();

  useEffect(() => {
    setIsClient(true);
    
    // URL 파라미터에서 에러 메시지 확인
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const warning = searchParams.get('warning');
    
    if (error && message) {
      setErrorMessage(decodeURIComponent(message));
    } else if (error === 'provider_error') {
      setErrorMessage('GitHub OAuth 설정을 확인해주세요. 아래 가이드를 참고하세요.');
    } else if (error === 'auth_callback_failed') {
      setErrorMessage('인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } else if (warning === 'no_session') {
      setSuccessMessage('인증이 완료되었지만 세션이 생성되지 않았습니다. 게스트 모드를 이용해주세요.');
    }
  }, []);

  // guestSession 상태가 변경되면 localStorage와 쿠키에 저장하고 페이지 이동
  useEffect(() => {
    if (guestSession) {
      // localStorage 저장 (기존 로직)
      localStorage.setItem('auth_session_id', guestSession.sessionId);
      localStorage.setItem('auth_type', 'guest');
      localStorage.setItem('auth_user', JSON.stringify(guestSession.user));

      // 🍪 쿠키 저장 (middleware 인식용)
      document.cookie = `guest_session_id=${guestSession.sessionId}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax`;
      document.cookie = `auth_type=guest; path=/; max-age=${2 * 60 * 60}; SameSite=Lax`;

      console.log('✅ 게스트 세션 저장 완료 (localStorage + 쿠키), 페이지 이동:', guestSession.user.name);
      router.push('/');
    }
  }, [guestSession, router]);

  // GitHub OAuth 로그인
  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      setLoadingType('github');

      console.log('🔐 GitHub OAuth 로그인 시작 (Supabase Auth)...');

      const { error } = await signInWithGitHub();

      if (error) {
        console.error('GitHub 로그인 실패:', error);
        alert('GitHub 로그인에 실패했습니다. 게스트 모드를 이용해주세요.');
        setIsLoading(false);
        setLoadingType(null);
      }
      // 성공 시 자동으로 OAuth 리다이렉트됨
    } catch (error) {
      console.error('GitHub 로그인 실패:', error);
      alert('GitHub 로그인에 실패했습니다. 게스트 모드를 이용해주세요.');
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  // 게스트 로그인
  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      setLoadingType('guest');

      console.log('👤 게스트 로그인 시작...');

      // 게스트 인증 처리
      const result = await authManager.authenticateGuest();

      if (result.success && result.user && result.sessionId) {
        // localStorage에 직접 접근하는 대신 상태를 업데이트
        setGuestSession({ sessionId: result.sessionId, user: result.user });
      } else {
        console.error('게스트 로그인 실패:', result.error);
        alert('게스트 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('게스트 로그인 실패:', error);
      alert('게스트 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
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
          <div className='w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <span className='text-white text-2xl font-bold'>OM</span>
          </div>
          <h1 className='text-3xl font-bold text-white mb-2'>OpenManager</h1>
          <p className='text-gray-400'>AI 서버 모니터링 시스템</p>
        </div>

        {/* 로그인 폼 */}
        <div className='bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700'>
          <h2 className='text-xl font-semibold text-white mb-6 text-center'>
            로그인 방식을 선택하세요
          </h2>

          {/* 🚨 에러 메시지 표시 */}
          {errorMessage && (
            <div className='mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg'>
              <p className='text-red-300 text-sm'>
                ❌ {errorMessage}
              </p>
              {errorMessage.includes('OAuth') && (
                <>
                  <p className='text-red-300 text-xs mt-2'>
                    GitHub OAuth 앱의 콜백 URL이 현재 도메인과 일치하는지 확인하세요.
                  </p>
                  <p className='text-yellow-300 text-xs mt-1'>
                    현재 도메인: {typeof window !== 'undefined' ? window.location.origin : '확인 중...'}
                  </p>
                </>
              )}
            </div>
          )}

          {/* ✅ 성공 메시지 표시 */}
          {successMessage && (
            <div className='mb-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg'>
              <p className='text-green-300 text-sm'>
                ✅ {successMessage}
              </p>
            </div>
          )}

          <div className='space-y-4'>
            {/* GitHub OAuth 로그인 */}
            <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group border border-gray-600'
            >
              <Github className='w-5 h-5' />
              <span className='font-medium'>
                {loadingType === 'github' ? '로그인 중...' : 'GitHub로 로그인'}
              </span>
              {loadingType === 'github' && (
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
              )}
            </button>

            {/* 구분선 */}
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-600' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-gray-800 text-gray-400'>또는</span>
              </div>
            </div>

            {/* 게스트 로그인 */}
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group'
            >
              <User className='w-5 h-5' />
              <span className='font-medium'>
                {loadingType === 'guest' ? '로그인 중...' : '게스트로 시작하기'}
              </span>
              {loadingType === 'guest' && (
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
              )}
            </button>
          </div>

          {/* 안내 텍스트 */}
          <div className='mt-6 text-center text-sm text-gray-400 space-y-2'>
            <p>
              🔐 <strong>GitHub 로그인</strong>: 개인화된 설정과 고급 기능
            </p>
            <p>
              👤 <strong>게스트 모드</strong>: 인증 없이 기본 기능 사용
            </p>
            <p className='text-xs text-gray-500 mt-4'>
              모든 로그인 방식은 OpenManager 메인 페이지로 이동합니다
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className='text-center mt-8'>
          <p className='text-xs text-gray-500'>
            OpenManager Vibe v5.44.3 • Supabase Auth (GitHub OAuth + 게스트)
          </p>
        </div>
      </div>
    </div>
  );
}
