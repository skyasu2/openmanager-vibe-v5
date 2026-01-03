/**
 * 🔐 클라이언트 사이드 인증 토큰 처리
 * URL 해시에서 access_token을 받아 처리하는 컴포넌트
 *
 * 2026-01-03: callback 페이지에서 처리하도록 위임
 * 이 컴포넌트는 callback 페이지 외의 페이지에서만 동작
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

export function AuthTokenHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleAuthToken = async () => {
      // 🚨 callback 페이지에서는 처리하지 않음 (callback 페이지가 직접 처리)
      if (pathname === '/auth/callback') {
        console.log(
          '🔐 AuthTokenHandler: callback 페이지에서는 처리 스킵 (callback 페이지가 처리)'
        );
        return;
      }

      // URL 해시에서 토큰 확인
      const hash = window.location.hash;

      if (hash?.includes('access_token=')) {
        console.log('🔐 URL 해시에서 인증 토큰 발견 (callback 외 페이지)');

        try {
          // Supabase가 자동으로 해시 토큰을 처리할 시간 대기
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Supabase에서 세션 처리
          const { data, error } = await getSupabase().auth.getSession();

          if (data.session) {
            console.log('✅ 세션 생성 성공, userId:', data.session.user.id);

            // URL 해시 제거
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );

            // 메인 페이지로 리다이렉트
            router.push('/');
          } else if (error) {
            console.error('❌ 세션 처리 실패:', error);
            router.push('/login?error=session_failed');
          }
        } catch (error) {
          console.error('❌ 토큰 처리 중 오류:', error);
          // 에러 발생 시에도 callback 페이지로 위임
          router.push('/auth/callback' + window.location.hash);
        }
      }
    };

    // 컴포넌트 마운트 후 토큰 처리
    void handleAuthToken();
  }, [router, pathname]);

  return null; // 렌더링하지 않음
}
