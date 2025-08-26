/**
 * 🔐 Login Client Component - GitHub OAuth & 게스트 로그인
 *
 * OpenManager Vibe v5 로그인 시스템 (Google OAuth 제거됨)
 * 모든 로그인 성공 시 루트 페이지(/)로 리다이렉트
 */

'use client';

import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import debug from '@/utils/debug';

// Supabase Auth 관련 임포트
import { signInWithGitHub } from '@/lib/supabase-auth';

// 게스트 로그인 관련 임포트
import type { AuthUser } from '@/services/auth/AuthStateManager';
import { AuthStateManager } from '@/services/auth/AuthStateManager';

interface GuestSessionData {
  sessionId: string;
  user: AuthUser;
}

export default function LoginClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'github' | 'guest' | null>(
    null
  );
  const [isClient, setIsClient] = useState(false);
  const [guestSession, setGuestSession] = useState<GuestSessionData | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showPulse, setShowPulse] = useState<'github' | 'guest' | null>(null);

  const authManager = new AuthStateManager();

  // 단계별 로딩 메시지 효과
  useEffect(() => {
    if (!loadingType) return;

    const messages = {
      github: [
        'GitHub에 연결 중...',
        'OAuth 인증 대기 중...',
        '사용자 정보 확인 중...',
        '리다이렉트 준비 중...',
      ],
      guest: [
        '게스트 세션 생성 중...',
        '임시 프로필 설정 중...',
        '시스템 접근 권한 부여 중...',
        '메인 페이지로 이동 중...',
      ],
    };

    const currentMessages = messages[loadingType];
    let messageIndex = 0;
    setLoadingMessage(currentMessages[0]);

    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % currentMessages.length;
      setLoadingMessage(currentMessages[messageIndex]);
    }, 1500); // 1.5초마다 메시지 변경

    return () => clearInterval(interval);
  }, [loadingType]);

  // ESC 키로 로딩 취소
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoading) {
        debug.log('🛑 로딩 취소됨');
        setIsLoading(false);
        setLoadingType(null);
        setLoadingMessage('');
        setSuccessMessage('로그인이 취소되었습니다.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isLoading]);

  useEffect(() => {
    setIsClient(true);

    // URL 파라미터에서 에러 메시지와 리다이렉트 URL 확인
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const warning = searchParams.get('warning');
    const redirectTo = searchParams.get('redirectTo');

    // redirectTo 파라미터가 있으면 세션 스토리지에 저장
    if (redirectTo && redirectTo !== '/main') {
      sessionStorage.setItem('auth_redirect_to', redirectTo);
      debug.log('🔗 로그인 후 리다이렉트 URL 저장:', redirectTo);
    }

    if (error && message) {
      setErrorMessage(decodeURIComponent(message));
    } else if (error === 'provider_error') {
      setErrorMessage(
        'GitHub OAuth 설정을 확인해주세요. 아래 가이드를 참고하세요.'
      );
    } else if (error === 'auth_callback_failed') {
      setErrorMessage('인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } else if (warning === 'no_session') {
      setSuccessMessage(
        '인증이 완료되었지만 세션이 생성되지 않았습니다. 게스트 모드를 이용해주세요.'
      );
    }
  }, []);

  // guestSession 상태가 변경되면 localStorage와 쿠키에 저장하고 페이지 이동
  useEffect(() => {
    if (guestSession) {
      // localStorage 저장 (기존 로직)
      localStorage.setItem('auth_session_id', guestSession.sessionId);
      localStorage.setItem('auth_type', 'guest');
      localStorage.setItem('auth_user', JSON.stringify(guestSession.user));

      // 🍪 쿠키 저장 (middleware 인식용, HTTPS 환경 대응)
      const isProduction = window.location.protocol === 'https:';
      const secureFlag = isProduction ? '; Secure' : '';
      document.cookie = `guest_session_id=${guestSession.sessionId}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax${secureFlag}`;
      document.cookie = `auth_type=guest; path=/; max-age=${2 * 60 * 60}; SameSite=Lax${secureFlag}`;

      debug.log(
        '✅ 게스트 세션 저장 완료 (localStorage + 쿠키), 페이지 이동:',
        guestSession.user.name
      );
      
      // 강제 페이지 새로고침과 함께 이동 (쿠키가 확실히 적용되도록)
      setTimeout(() => {
        window.location.href = '/main';
      }, 500);
    }
  }, [guestSession]); // router 함수 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  // GitHub OAuth 로그인
  const handleGitHubLogin = async () => {
    try {
      setShowPulse('github');
      setTimeout(() => setShowPulse(null), 600); // 애니메이션 시간과 동일

      setIsLoading(true);
      setLoadingType('github');
      setErrorMessage('');

      debug.log('🔐 GitHub OAuth 로그인 시작 (Supabase Auth)...');
      debug.log('🌍 현재 환경:', {
        origin: window.location.origin,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        isLocal: window.location.origin.includes('localhost'),
        isVercel: window.location.origin.includes('vercel.app'),
      });

      const { error } = await signInWithGitHub();

      if (error) {
        debug.error('❌ GitHub 로그인 실패:', error);

        // 더 구체적인 에러 메시지
        let errorMsg = 'GitHub 로그인에 실패했습니다.';
        const errorMessage = (error as any)?.message || '';
        const errorCode = (error as any)?.code || '';

        if (errorMessage.includes('Invalid login credentials')) {
          errorMsg = 'GitHub 인증 정보가 올바르지 않습니다.';
        } else if (errorMessage.includes('redirect_uri')) {
          errorMsg = 'OAuth 설정 오류입니다. 관리자에게 문의하세요.';
        } else if (errorMessage.includes('network')) {
          errorMsg = '네트워크 오류입니다. 잠시 후 다시 시도해주세요.';
        } else if (errorMessage.includes('Invalid API key')) {
          errorMsg = 'Supabase 설정 오류입니다. 환경변수를 확인해주세요.';
        }

        setErrorMessage(errorMsg);
        debug.log('🔧 디버깅 정보:', {
          errorMessage: errorMessage,
          errorCode: errorCode,
          currentUrl: window.location.href,
          expectedCallback: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        });

        setIsLoading(false);
        setLoadingType(null);
        return;
      }

      debug.log('✅ GitHub OAuth 로그인 요청 성공 - 리다이렉트 중...');
      // 성공 시 자동으로 OAuth 리다이렉트됨
    } catch (error) {
      debug.error('❌ GitHub 로그인 에러:', error);
      setErrorMessage(
        '로그인 중 예상치 못한 오류가 발생했습니다. 게스트 모드를 이용해주세요.'
      );
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  // 게스트 로그인
  const handleGuestLogin = async () => {
    try {
      setShowPulse('guest');
      setTimeout(() => setShowPulse(null), 600); // 애니메이션 시간과 동일

      setIsLoading(true);
      setLoadingType('guest');

      debug.log('👤 게스트 로그인 시작...');

      // 게스트 인증 처리
      const result = await authManager.authenticateGuest();

      if (result.success && result.user && result.sessionId) {
        // localStorage에 직접 접근하는 대신 상태를 업데이트
        setGuestSession({ sessionId: result.sessionId, user: result.user });
      } else {
        debug.error('게스트 로그인 실패:', result.error);
        alert('게스트 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      debug.error('게스트 로그인 실패:', error);
      alert('게스트 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  // 클라이언트 렌더링이 준비되지 않았으면 로딩 표시
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600">
            <span className="text-2xl font-bold text-white">OM</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">OpenManager</h1>
          <p className="text-gray-400">AI 서버 모니터링 시스템</p>
        </div>

        {/* 로그인 폼 */}
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-8 shadow-2xl">
          <h2 className="mb-6 text-center text-xl font-semibold text-white">
            로그인 방식을 선택하세요
          </h2>

          {/* 🚨 에러 메시지 표시 */}
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-600/30 bg-red-900/20 p-3">
              <p className="text-sm text-red-300">❌ {errorMessage}</p>
              {errorMessage.includes('OAuth') && (
                <>
                  <p className="mt-2 text-xs text-red-300">
                    GitHub OAuth 앱의 콜백 URL이 현재 도메인과 일치하는지
                    확인하세요.
                  </p>
                  <p className="mt-1 text-xs text-yellow-300">
                    현재 도메인:{' '}
                    {typeof window !== 'undefined'
                      ? window.location.origin
                      : '확인 중...'}
                  </p>
                </>
              )}
            </div>
          )}

          {/* ✅ 성공 메시지 표시 */}
          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-600/30 bg-green-900/20 p-3">
              <p className="text-sm text-green-300">✅ {successMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* GitHub OAuth 로그인 - 업계 표준 스타일 */}
            <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg border border-gray-600 bg-[#24292e] px-4 py-3 text-white shadow-lg transition-all duration-200 hover:bg-[#1a1e22] hover:shadow-xl disabled:cursor-progress disabled:opacity-70"
            >
              {/* 로딩 오버레이 */}
              {loadingType === 'github' && (
                <div className="_animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}

              {/* 프로그레스 바 */}
              {loadingType === 'github' && (
                <div className="_animate-progress absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-blue-500" />
              )}

              {/* 클릭 펄스 애니메이션 */}
              {showPulse === 'github' && (
                <div className="_animate-pulse-click pointer-events-none absolute inset-0 rounded-lg bg-white/20" />
              )}

              <svg
                className="relative z-10 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="relative z-10 font-semibold">
                {loadingType === 'github'
                  ? loadingMessage
                  : 'GitHub로 계속하기'}
              </span>
              {loadingType === 'github' && (
                <div className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
            </button>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-800 px-2 text-gray-400">또는</span>
              </div>
            </div>

            {/* 게스트 로그인 - 개선된 스타일 */}
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:cursor-progress disabled:opacity-70"
            >
              {/* 로딩 오버레이 */}
              {loadingType === 'guest' && (
                <div className="_animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}

              {/* 프로그레스 바 */}
              {loadingType === 'guest' && (
                <div className="_animate-progress absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-purple-500" />
              )}

              {/* 클릭 펄스 애니메이션 */}
              {showPulse === 'guest' && (
                <div className="_animate-pulse-click pointer-events-none absolute inset-0 rounded-lg bg-white/20" />
              )}

              <User className="relative z-10 h-5 w-5" />
              <span className="relative z-10 font-semibold">
                {loadingType === 'guest' ? loadingMessage : '게스트로 체험하기'}
              </span>
              {loadingType === 'guest' && (
                <div className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
            </button>
          </div>

          {/* 로딩 중 추가 안내 */}
          {isLoading && (
            <div className="_animate-fadeIn mt-4 space-y-1 text-center">
              <p className="text-xs text-gray-400">예상 소요 시간: 3-5초</p>
              <p className="text-xs text-gray-500">
                ESC 키를 눌러 취소할 수 있습니다
              </p>
            </div>
          )}

          {/* 안내 텍스트 */}
          <div className="mt-6 space-y-2 text-center text-sm text-gray-400">
            <p>
              🔐 <strong>GitHub 로그인</strong>: 개인화된 설정과 고급 기능
            </p>
            <p>
              👤 <strong>게스트 모드</strong>: 인증 없이 기본 기능 사용
            </p>
            <p className="mt-4 text-xs text-gray-500">
              모든 로그인 방식은 OpenManager 메인 페이지(/main)로 이동합니다
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            OpenManager Vibe v5.44.3 • Supabase Auth (GitHub OAuth + 게스트)
          </p>
        </div>
      </div>
    </div>
  );
}
