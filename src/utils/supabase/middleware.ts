import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔐 Supabase 미들웨어 세션 업데이트 함수
 *
 * PKCE 플로우를 자동으로 처리하고 쿠키를 관리합니다.
 * Server Components가 쿠키를 쓸 수 없으므로 미들웨어에서 처리합니다.
 */
export async function updateSession(
  request: NextRequest,
  response?: NextResponse
) {
  // response가 없으면 새로 생성
  const supabaseResponse = response || NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name);
          if (!cookie) return undefined;
          return typeof cookie === 'string'
            ? cookie
            : String((cookie as any).value);
        },
        set(name: string, value: string, options: any) {
          // 응답 쿠키에만 설정 (request.cookies는 읽기 전용)
          try {
            if (supabaseResponse && 'cookies' in supabaseResponse) {
              (supabaseResponse as any).cookies.set({
                name,
                value,
                ...options,
              });
            }
          } catch (e) {
            console.warn('Cookie set failed:', e);
          }
        },
        remove(name: string, options: any) {
          // 응답 쿠키에서만 제거 (request.cookies는 읽기 전용)
          try {
            if (supabaseResponse && 'cookies' in supabaseResponse) {
              (supabaseResponse as any).cookies.set({
                name,
                value: '',
                maxAge: 0,
                ...options,
              });
            }
          } catch (e) {
            console.warn('Cookie remove failed:', e);
          }
        },
      },
    }
  );

  // OAuth 콜백 처리를 먼저 수행 (PKCE 자동 처리)
  const pathname = request.nextUrl.pathname;
  if (pathname === '/auth/callback') {
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');

    console.log('🔐 미들웨어: OAuth 콜백 처리', {
      hasCode: !!code,
      hasError: !!error,
      origin: request.headers.get('host'),
    });

    if (code && !error) {
      // PKCE 코드 교환 처리
      console.log('🔄 미들웨어: PKCE 코드 교환 처리 중...');
      
      // exchangeCodeForSession을 명시적으로 호출
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (sessionData?.session && !sessionError) {
          console.log('✅ 미들웨어: PKCE 코드 교환 성공', sessionData.session.user.email);
          
          // 세션이 쿠키에 제대로 설정될 때까지 대기
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 세션 재확인
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (user && !userError) {
            console.log('✅ 미들웨어: 세션 확인 완료', user.email);
            
            // 쿠키 설정 확인 로그
            const authToken = request.cookies.get('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
            console.log('🍪 미들웨어: Auth 토큰 쿠키', authToken ? '설정됨' : '없음');
            
            // Phase 3 최적화: 바로 메인으로 리다이렉트
            const redirectTo = new URL(request.nextUrl.href);
            redirectTo.pathname = '/main';
            redirectTo.searchParams.delete('code');
            redirectTo.searchParams.delete('error');
            redirectTo.searchParams.delete('error_description');
            
            // 리다이렉트 응답에 세션 쿠키가 포함되도록 보장
            const redirectResponse = NextResponse.redirect(redirectTo);
            
            // 추가 쿠키 설정 (세션 안정화)
            redirectResponse.cookies().set('auth_verified', 'true', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24, // 24시간
              path: '/',
            });
            
            return redirectResponse;
          }
        } else {
          console.error('❌ 미들웨어: PKCE 코드 교환 실패', sessionError?.message);
          // 에러 시 로그인 페이지로
          const errorUrl = new URL('/login', request.url);
          errorUrl.searchParams.set('error', 'auth_callback_failed');
          errorUrl.searchParams.set('message', sessionError?.message || 'Session exchange failed');
          return NextResponse.redirect(errorUrl);
        }
      } catch (error) {
        console.error('❌ 미들웨어: PKCE 처리 예외', error);
        const errorUrl = new URL('/login', request.url);
        errorUrl.searchParams.set('error', 'auth_callback_failed');
        return NextResponse.redirect(errorUrl);
      }
    }
  } else {
    // 다른 경로에서는 일반적인 세션 업데이트
    await supabase.auth.getUser();
  }

  return supabaseResponse;
}
