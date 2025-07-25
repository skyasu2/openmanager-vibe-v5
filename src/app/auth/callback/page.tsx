/**
 * 🔐 OAuth 콜백 페이지 (클라이언트 컴포넌트)
 *
 * PKCE를 지원하는 클라이언트 사이드 OAuth 콜백 처리
 * Supabase가 자동으로 code_verifier를 처리합니다
 */

'use client';

import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const startTime = performance.now();

      try {
        console.log('🔐 OAuth 콜백 처리 시작...');
        console.log('⏱️ Phase 3 최적화: 다이렉트 리다이렉트 모드');

        // 즉시 세션 확인 (극도로 빠른 검사)
        const quickCheck = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 100)),
        ]);

        if (quickCheck && quickCheck.data?.session) {
          console.log('✅ 기존 세션 발견 (100ms 이내)');
          console.log(
            `⏱️ 콜백 처리 시간: ${(performance.now() - startTime).toFixed(0)}ms`
          );

          // Phase 3: success 페이지 건너뛰고 바로 메인으로
          router.push('/main');
          return;
        }

        // 세션이 없으면 OAuth 코드로 세션 생성 시도
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
          console.error('❌ OAuth 코드가 없습니다');
          router.push('/login?error=no_code');
          return;
        }

        console.log('🔑 OAuth 코드 확인됨');

        // Phase 3: 코드 교환과 동시에 쿠키 사전 설정
        const exchangeStart = performance.now();

        // 쿠키 사전 설정 (리다이렉트 준비)
        document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;
        document.cookie = `auth_redirect_to=/main; path=/; max-age=60; SameSite=Lax`;

        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);

        console.log(
          `⏱️ 코드 교환 시간: ${(performance.now() - exchangeStart).toFixed(0)}ms`
        );

        if (error) {
          console.error('❌ 코드 교환 실패:', error);
          router.push('/login?error=code_exchange_failed');
          return;
        }

        if (!data.session) {
          console.error('❌ 세션 생성 실패');
          router.push('/login?error=no_session');
          return;
        }

        console.log('✅ OAuth 세션 생성 성공:', data.session.user?.email);

        // Phase 3: 쿠키가 설정될 때까지 최소 대기
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log(
          `⏱️ 전체 콜백 처리 시간: ${(performance.now() - startTime).toFixed(0)}ms`
        );

        // Phase 3 옵션: 바로 메인으로 가기
        const skipSuccessPage = true; // 설정으로 관리 가능

        if (skipSuccessPage) {
          console.log('🚀 Phase 3: success 페이지 건너뛰고 메인으로 직행!');

          // 라우터 캐시 갱신
          router.refresh();
          await new Promise(resolve => setTimeout(resolve, 200));

          // 메인으로 직접 이동
          window.location.href = '/main';
        } else {
          // 기존 플로우 유지 (안전 모드)
          router.push('/auth/success');
        }
      } catch (error) {
        console.error('❌ OAuth 콜백 처리 오류:', error);
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center'>
      <div className='text-center'>
        <div className='mb-8'>
          <Loader2 className='w-16 h-16 text-blue-500 animate-spin mx-auto' />
        </div>
        <h1 className='text-2xl font-bold text-white mb-2'>인증 처리 중...</h1>
        <p className='text-gray-400'>잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
