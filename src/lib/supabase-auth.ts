/**
 * 🔐 Supabase Auth 클라이언트 설정
 * 
 * GitHub OAuth 및 게스트 로그인 지원
 * NextAuth 대체 구현
 */

import { supabase } from './supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider?: 'github' | 'guest';
}

export interface AuthCallbackResult {
  session: Session | null;
  error: AuthError | Error | null;
}

/**
 * 에러 객체가 message 속성을 가지고 있는지 확인하는 타입 가드
 */
function hasMessageProperty(error: any): error is { message: string } {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string';
}

/**
 * GitHub OAuth 로그인
 */
export async function signInWithGitHub() {
  try {
    // 동적으로 리다이렉트 URL 설정 (로컬/베르셀 자동 감지)
    const origin = window.location.origin;
    
    // Implicit Grant Flow를 처리하기 위해 로그인 페이지로 리다이렉트
    const redirectUrl = `${origin}/login`;
    
    console.log('🔗 OAuth 리다이렉트 URL:', redirectUrl);
    console.log('🌍 현재 환경:', {
      origin,
      isVercel: origin.includes('vercel.app'),
      isLocal: origin.includes('localhost'),
      redirectUrl,
    });
    
    // GitHub OAuth App 설정 확인을 위한 로그
    console.log('⚠️ Supabase 대시보드의 Redirect URLs에 다음을 추가하세요:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectUrl,
        scopes: 'read:user user:email',
        // skipBrowserRedirect를 false로 설정하여 브라우저 리다이렉트 허용
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('❌ GitHub OAuth 로그인 실패:', error);
      throw error;
    }

    console.log('✅ GitHub OAuth 로그인 요청 성공');
    return { data, error: null };
  } catch (error) {
    console.error('❌ GitHub OAuth 로그인 에러:', error);
    return { data: null, error };
  }
}

/**
 * 로그아웃
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ 로그아웃 실패:', error);
      throw error;
    }

    // 게스트 세션 정리 (localStorage + 쿠키)
    localStorage.removeItem('auth_session_id');
    localStorage.removeItem('auth_type');
    localStorage.removeItem('auth_user');
    
    // 🍪 게스트 세션 쿠키 정리
    if (typeof document !== 'undefined') {
      document.cookie = 'guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }

    console.log('✅ 로그아웃 성공');
    return { error: null };
  } catch (error) {
    console.error('❌ 로그아웃 에러:', error);
    return { error };
  }
}

/**
 * 현재 세션 가져오기
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ 세션 가져오기 실패:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('❌ 세션 가져오기 에러:', error);
    return null;
  }
}

/**
 * 현재 사용자 가져오기
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      // 게스트 사용자 확인
      const guestUser = localStorage.getItem('auth_user');
      if (guestUser) {
        return JSON.parse(guestUser);
      }
      return null;
    }

    const user = session.user;
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.user_name || user.email?.split('@')[0] || 'GitHub User',
      avatar: user.user_metadata?.avatar_url,
      provider: 'github',
    };
  } catch (error) {
    console.error('❌ 사용자 정보 가져오기 에러:', error);
    return null;
  }
}

/**
 * 인증 상태 확인
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  const guestUser = localStorage.getItem('auth_user');
  
  return !!(session || guestUser);
}

/**
 * GitHub 인증 사용자인지 확인
 */
export async function isGitHubAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * 게스트 사용자인지 확인
 */
export function isGuestUser(): boolean {
  const authType = localStorage.getItem('auth_type');
  return authType === 'guest';
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth 상태 변경:', event, session?.user?.email);
    callback(session);
  });

  return authListener;
}

/**
 * 인증 콜백 처리 (OAuth 리다이렉트 후)
 */
export async function handleAuthCallback(): Promise<AuthCallbackResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth 콜백 처리 실패:', error);
      return { session: null, error };
    }

    if (session) {
      console.log('✅ Auth 콜백 처리 성공:', session.user.email);
    }

    return { session, error: null };
  } catch (error) {
    console.error('❌ Auth 콜백 처리 에러:', error);
    return { 
      session: null, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * 세션 새로고침
 */
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ 세션 새로고침 실패:', error);
      return { session: null, error };
    }

    console.log('✅ 세션 새로고침 성공');
    return { session, error: null };
  } catch (error) {
    console.error('❌ 세션 새로고침 에러:', error);
    return { session: null, error };
  }
}

// 초기화 로그
console.log('🔐 Supabase Auth 모듈 초기화됨');