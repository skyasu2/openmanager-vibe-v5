/**
 * 🚫 NextAuth Error Page
 *
 * GitHub OAuth 인증 오류 시 표시되는 페이지
 */

'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams?.get('error');

    // NextAuth 에러 코드를 한국어로 변환
    const getErrorMessage = (errorCode: string | null): string => {
      switch (errorCode) {
        case 'Configuration':
          return 'GitHub OAuth 설정 오류가 발생했습니다.';
        case 'AccessDenied':
          return 'GitHub 로그인 권한이 거부되었습니다.';
        case 'Verification':
          return 'GitHub 계정 인증에 실패했습니다.';
        case 'Default':
          return 'GitHub 로그인 중 알 수 없는 오류가 발생했습니다.';
        case 'OAuthCallback':
          return 'GitHub OAuth 콜백 처리 중 오류가 발생했습니다.';
        case 'OAuthCreateAccount':
          return 'GitHub 계정 정보를 가져오는데 실패했습니다.';
        case 'EmailCreateAccount':
          return 'GitHub 이메일 정보를 가져오는데 실패했습니다.';
        case 'Callback':
          return 'GitHub 인증 콜백 처리에 실패했습니다.';
        case 'OAuthAccountNotLinked':
          return 'GitHub 계정이 다른 제공자와 연결되어 있습니다.';
        case 'EmailSignin':
          return 'GitHub 이메일로 로그인할 수 없습니다.';
        case 'CredentialsSignin':
          return 'GitHub 자격 증명 확인에 실패했습니다.';
        case 'SessionRequired':
          return 'GitHub 로그인 세션이 필요합니다.';
        default:
          return 'GitHub 로그인 중 오류가 발생했습니다.';
      }
    };

    setError(getErrorMessage(errorParam));
  }, [searchParams]);

  /**
   * 🔙 로그인 페이지로 돌아가기
   */
  const handleBackToLogin = () => {
    router.push('/login');
  };

  /**
   * 🔄 GitHub 로그인 다시 시도
   */
  const handleTryAgain = () => {
    router.push('/login');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* 에러 아이콘 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className='text-center mb-8'
        >
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>로그인 실패</h1>
          <p className='text-gray-600'>GitHub OAuth 인증에 실패했습니다</p>
        </motion.div>

        {/* 에러 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='bg-white rounded-xl p-6 shadow-lg border border-red-200 mb-6'
        >
          <div className='flex items-start space-x-3'>
            <div className='w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
              <svg
                className='w-3 h-3 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <h3 className='font-semibold text-gray-900 mb-1'>오류 내용</h3>
              <p className='text-sm text-gray-600 leading-relaxed'>{error}</p>
            </div>
          </div>
        </motion.div>

        {/* 해결 방법 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className='bg-blue-50 rounded-xl p-6 mb-6'
        >
          <h3 className='font-semibold text-blue-900 mb-3'>해결 방법</h3>
          <div className='space-y-2 text-sm text-blue-800'>
            <div className='flex items-start space-x-2'>
              <span className='text-blue-600'>1.</span>
              <span>GitHub에 로그인되어 있는지 확인하세요</span>
            </div>
            <div className='flex items-start space-x-2'>
              <span className='text-blue-600'>2.</span>
              <span>브라우저 쿠키와 캐시를 지워보세요</span>
            </div>
            <div className='flex items-start space-x-2'>
              <span className='text-blue-600'>3.</span>
              <span>다른 브라우저를 사용해보세요</span>
            </div>
            <div className='flex items-start space-x-2'>
              <span className='text-blue-600'>4.</span>
              <span>문제가 계속되면 게스트 로그인을 사용하세요</span>
            </div>
          </div>
        </motion.div>

        {/* 액션 버튼들 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='space-y-3'
        >
          <div className='grid grid-cols-2 gap-3'>
            <button
              onClick={handleTryAgain}
              className='py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
            >
              다시 시도
            </button>
            <button
              onClick={handleBackToLogin}
              className='py-3 px-4 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium transition-colors'
            >
              로그인 페이지로
            </button>
          </div>

          {/* 대안 인증 방법 */}
          <div className='text-center'>
            <p className='text-sm text-gray-500 mb-2'>
              또는 다른 방법으로 로그인
            </p>
            <button
              onClick={() => router.push('/login')}
              className='w-full text-sm bg-gray-50 text-gray-700 px-3 py-2 rounded hover:bg-gray-100 transition-colors'
            >
              게스트 모드로 시작하기
            </button>
          </div>
        </motion.div>

        {/* 기술 정보 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className='text-center mt-8'
        >
          <div className='text-xs text-gray-500 space-y-1'>
            <p>🔐 NextAuth 기반 GitHub OAuth</p>
            <p>🛠️ 문제가 계속되면 관리자에게 문의하세요</p>
            <p>OpenManager Vibe v5.44.3</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function LoadingFallback() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md text-center'>
        <div className='w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4'></div>
        <p className='text-gray-600'>로딩 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 - Suspense로 감싸기
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
