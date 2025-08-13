/**
 * 🔐 루트 페이지 - 스마트 리다이렉션
 *
 * 인증된 사용자는 메인 페이지(/main)로,
 * 미인증 사용자는 로그인 페이지(/login)로 보냅니다.
 *
 * 메인 페이지: /main
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated } from '@/lib/supabase-auth';

export default function RootRedirect() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // 인증 상태 확인
        const authenticated = await isAuthenticated();
        const user = await getCurrentUser();

        console.log('🔍 루트 페이지 인증 체크:', { authenticated, user });

        if (authenticated && user) {
          // 인증된 사용자는 메인 페이지로
          console.log('✅ 인증된 사용자 - 메인 페이지로 이동');
          router.replace('/main');
        } else {
          // 미인증 사용자는 로그인 페이지로
          console.log('❌ 미인증 사용자 - 로그인 페이지로 이동');
          router.replace('/login');
        }
      } catch (error) {
        console.error('❌ 인증 체크 오류:', error);
        // 오류 시 안전하게 로그인 페이지로
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    void checkAuthAndRedirect();
  }, [router]);

  // 리다이렉션 중 로딩 화면 표시
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="flex items-center space-x-2 text-white">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        <span>{isChecking ? '인증 확인 중...' : '리다이렉션 중...'}</span>
      </div>
    </div>
  );
}
