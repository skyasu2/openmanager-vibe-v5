'use client';

import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// NextAuth 호환 세션 타입
interface Session {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  } | null;
  expires?: string;
}

interface UseSessionReturn {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<Session | null>;
}

/**
 * NextAuth의 useSession을 대체하는 Supabase 기반 훅
 * 기존 코드와의 호환성을 위해 동일한 인터페이스 제공
 */
export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated'
  >('loading');
  const router = useRouter();

  useEffect(() => {
    // 초기 세션 확인
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setStatus('authenticated');
        } else {
          // 🎯 게스트 세션 확인 (Vercel Edge Runtime 안전성 강화)
          try {
            const guestUser = localStorage.getItem('auth_user');
            const authType = localStorage.getItem('auth_type');

            if (guestUser && authType === 'guest') {
              const guestUserData = JSON.parse(guestUser);
            // 게스트 사용자를 Supabase User 형태로 변환
            setUser({
              id: guestUserData.id,
              aud: 'guest',
              email: guestUserData.email || null,
              created_at: guestUserData.created_at || new Date().toISOString(),
              updated_at: guestUserData.updated_at || new Date().toISOString(),
              last_sign_in_at:
                guestUserData.last_sign_in_at || new Date().toISOString(),
              app_metadata: {
                provider: 'guest',
                providers: ['guest'],
              },
              user_metadata: {
                name: guestUserData.name,
                auth_type: 'guest',
              },
              identities: [],
              factors: [],
              role: 'authenticated',
            } as User);
            setStatus('authenticated');
            } else {
              setUser(null);
              setStatus('unauthenticated');
            }
          } catch (error) {
            console.warn('게스트 세션 확인 오류 (localStorage 접근 제한):', error);
            setUser(null);
            setStatus('unauthenticated');
          }
        }
      } catch (error) {
        console.error('세션 확인 오류:', error);
        setStatus('unauthenticated');
      }
    };

    checkSession();

    // 세션 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }

      // 🎯 router.refresh() 제거: 불필요한 전체 페이지 리렌더링 방지
      // React의 자연스러운 상태 전파를 통해 필요한 컴포넌트만 리렌더링
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // router 의존성 제거 - Next.js router는 불안정한 참조로 무한 리렌더링 유발

  // NextAuth 호환 세션 객체 생성
  const data: Session | null = user
    ? {
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || null,
          image: user.user_metadata?.avatar_url || null,
        },
        expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString(), // 30일
      }
    : null;

  // 세션 업데이트 함수
  const update = async (): Promise<Session | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      setStatus('authenticated');
    }
    return data;
  };

  return {
    data,
    status,
    update,
  };
}

/**
 * NextAuth의 signOut을 대체하는 Supabase 기반 함수
 * 게스트 세션도 함께 정리
 */
export async function signOut(options?: { callbackUrl?: string }) {
  try {
    await supabase.auth.signOut();

    // 🍪 게스트 세션 정리 (localStorage + 쿠키) - Vercel Edge Runtime 안전성 강화
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth_session_id');
        localStorage.removeItem('auth_type');
        localStorage.removeItem('auth_user');
      } catch (error) {
        console.warn('localStorage 정리 오류 (무시됨):', error);
      }

      // 게스트 세션 쿠키 정리
      document.cookie =
        'guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie =
        'auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }

    // 콜백 URL이 제공되면 해당 URL로, 아니면 홈으로 리다이렉트
    if (typeof window !== 'undefined') {
      window.location.href = options?.callbackUrl || '/';
    }
  } catch (error) {
    console.error('로그아웃 오류:', error);
  }
}

/**
 * NextAuth의 signIn을 대체하는 Supabase 기반 함수
 */
export async function signIn(
  provider: string,
  options?: { callbackUrl?: string }
) {
  try {
    if (provider === 'github') {
      const baseUrl = window.location.origin;
      const finalRedirect = options?.callbackUrl || '/main';

      // 최종 목적지를 세션 스토리지에 저장 (Vercel Edge Runtime 안전성 강화)
      if (finalRedirect) {
        try {
          sessionStorage.setItem('auth_redirect_to', finalRedirect);
        } catch (error) {
          console.warn('sessionStorage 접근 오류 (무시됨):', error);
        }
      }

      // Supabase OAuth는 자체 콜백 URL을 사용
      // redirectTo는 인증 성공 후 리다이렉트될 애플리케이션 URL
      const redirectTo = `${baseUrl}/auth/success`;

      console.log('🔐 GitHub OAuth 시작:', {
        baseUrl,
        finalRedirect,
        redirectTo,
        provider: 'github',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        environment: process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV,
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
          // PKCE 플로우 사용 (보안 강화)
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('GitHub 로그인 오류:', error);
        throw error;
      }

      console.log('✅ GitHub OAuth 요청 성공 - 리다이렉트 중...');
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    throw error;
  }
}
