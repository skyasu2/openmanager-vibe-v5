/**
 * 🔐 클라이언트 사이드 인증 토큰 처리
 * URL 해시에서 access_token을 받아 처리하는 컴포넌트
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function AuthTokenHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthToken = async () => {
      // URL 해시에서 토큰 확인
      const hash = window.location.hash;

      if (hash?.includes('access_token=')) {
        console.log('🔐 URL 해시에서 인증 토큰 발견');

        try {
          // Supabase에서 세션 처리
          const { data, error } = await supabase.auth.getSession();

          if (data.session) {
            console.log('✅ 세션 생성 성공, userId:', data.session.user.id);

            // URL 해시 제거
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );

            // 메인 페이지로 리다이렉트
            router.push('/main');
          } else if (error) {
            console.error('❌ 세션 처리 실패:', error);
            router.push('/login?error=session_failed');
          }
        } catch (error) {
          console.error('❌ 토큰 처리 중 오류:', error);
          router.push('/login?error=token_processing_failed');
        }
      }
    };

    // 컴포넌트 마운트 후 토큰 처리
    void handleAuthToken();
  }, [router]);

  return null; // 렌더링하지 않음
}
