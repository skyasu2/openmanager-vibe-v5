/**
 * 🔐 Supabase Auth 클라이언트 설정
 *
 * GitHub OAuth 및 게스트 로그인 지원
 * NextAuth 대체 구현
 */

import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { validateRedirectUrl, guestSessionCookies } from '@/utils/secure-cookies';

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
 * GitHub OAuth 로그인
 */
export async function signInWithGitHub() {
  try {
    // 동적으로 리다이렉트 URL 설정 (로컬/베르셀 자동 감지)
    const origin = window.location.origin;

    // Authorization Code Flow를 위해 콜백 라우트로 리다이렉트
    const redirectUrl = `${origin}/auth/callback`;

    // 🔒 OAuth 리다이렉트 URL 보안 검증
    if (!validateRedirectUrl(redirectUrl)) {
      throw new Error(`보안상 허용되지 않은 리다이렉트 URL입니다: ${redirectUrl}`);
    }

    console.log('🔗 OAuth 리다이렉트 URL:', redirectUrl);
    console.log('🌍 현재 환경:', {
      origin,
      isVercel: origin.includes('vercel.app'),
      isLocal: origin.includes('localhost'),
      redirectUrl,
      supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL, // 민감정보 마스킹
    });

    // GitHub OAuth App 설정 확인을 위한 로그
    console.log('⚠️ 필요한 설정:');
    console.log('  Supabase Redirect URLs:', redirectUrl);
    console.log(
      '  GitHub OAuth Callback:',
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`
    );

    // 환경변수 검증
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test')
    ) {
      throw new Error('Supabase URL이 올바르게 설정되지 않았습니다.');
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('test')
    ) {
      throw new Error('Supabase Anon Key가 올바르게 설정되지 않았습니다.');
    }

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
      console.error('🔧 디버깅 정보:', {
        errorCode: error.code,
        errorMessage: error.message,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        redirectUrl,
      });
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
 * 로그아웃 (AuthStateManager 사용)
 * @deprecated - 새로운 코드에서는 authStateManager.clearAllAuthData() 사용 권장
 */
export async function signOut(options?: { authType?: 'github' | 'guest' }) {
  try {
    console.log('🚪 통합 로그아웃 시작:', options);

    // AuthStateManager를 통한 통합 로그아웃 처리
    const { authStateManager } = await import('./auth-state-manager');
    await authStateManager.clearAllAuthData(options?.authType);

    console.log('✅ 통합 로그아웃 성공');
    return { error: null };
  } catch (error) {
    console.error('❌ 통합 로그아웃 에러:', error);
    
    // Fallback: 레거시 로직 사용
    console.warn('⚠️ 레거시 로그아웃으로 fallback');
    return await signOutLegacy(options?.authType);
  }
}

/**
 * 레거시 로그아웃 구현 (하위 호환성용)
 */
async function signOutLegacy(authType?: 'github' | 'guest') {
  try {
    console.warn('⚠️ 레거시 signOut 사용 중 - AuthStateManager로 마이그레이션 권장');

    // Supabase 세션 정리 (GitHub OAuth)
    if (!authType || authType === 'github') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('⚠️ Supabase 로그아웃 실패:', error);
      }
    }

    // localStorage 정리 (레거시 키들)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_session_id');
      localStorage.removeItem('auth_type');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('admin_mode');
      
      // Supabase 관련 키들도 정리
      const supabaseKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('sb-') || key.includes('supabase'));
      supabaseKeys.forEach(key => localStorage.removeItem(key));
    }

    // 쿠키 정리 (레거시)
    if (typeof document !== 'undefined') {
      document.cookie = 'guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Strict';
      document.cookie = 'auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Strict';
    }

    // 🍪 보안 강화된 게스트 세션 쿠키 정리 (기존 유틸 사용)
    try {
      guestSessionCookies.clearGuestSession();
    } catch (error) {
      console.warn('⚠️ guestSessionCookies 정리 실패:', error);
    }

    console.log('✅ 레거시 로그아웃 완료');
    return { error: null };
  } catch (error) {
    console.error('❌ 레거시 로그아웃 에러:', error);
    return { error };
  }
}

/**
 * 현재 세션 가져오기
 */
export async function getSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

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
 * 현재 사용자 가져오기 (AuthStateManager 사용)
 * @deprecated - 새로운 코드에서는 authStateManager.getAuthState() 사용 권장
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // AuthStateManager를 통한 통합 상태 관리로 리팩토링
    const { authStateManager } = await import('./auth-state-manager');
    const authState = await authStateManager.getAuthState();
    
    console.log('🔄 getCurrentUser -> AuthStateManager 위임:', {
      type: authState.type,
      isAuthenticated: authState.isAuthenticated,
      userId: authState.user?.id
    });
    
    return authState.user;
  } catch (error) {
    console.error('❌ getCurrentUser 에러 (AuthStateManager 위임 실패):', error);
    
    // Fallback: 기존 로직 유지 (하위 호환성)
    return await getCurrentUserLegacy();
  }
}

/**
 * 레거시 getCurrentUser 구현 (하위 호환성용)
 */
async function getCurrentUserLegacy(): Promise<AuthUser | null> {
  try {
    console.warn('⚠️ 레거시 getCurrentUser 사용 중 - AuthStateManager로 마이그레이션 권장');
    
    // 세션 상태 확인 (재시도 로직 포함)
    let session = null;
    let attempts = 0;
    const maxAttempts = 3;

    // GitHub OAuth 콜백 후 세션이 설정되는 데 시간이 걸릴 수 있으므로 재시도
    do {
      const sessionResult = await getSession();
      session = sessionResult;
      
      if (!session?.user && attempts < maxAttempts - 1) {
        // 짧은 지연 후 재시도 (OAuth 콜백 직후 세션 설정 대기)
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      attempts++;
    } while (!session?.user && attempts < maxAttempts);

    if (!session?.user) {
      // 클라이언트 환경에서만 localStorage 확인
      if (typeof window !== 'undefined') {
        // 게스트 사용자 확인 (localStorage) - 레거시 키 사용
        const guestUser = localStorage.getItem('auth_user');
        if (guestUser) {
          return JSON.parse(guestUser);
        }

        // Supabase 세션 토큰 직접 확인 (fallback)
        const supabaseAuthToken = localStorage.getItem('sb-vnswjnltnhpsueosfhmw-auth-token');
        if (supabaseAuthToken) {
          try {
            const tokenData = JSON.parse(supabaseAuthToken);
            if (tokenData?.access_token && tokenData?.user) {
              console.log('🔄 Supabase 토큰에서 세션 복원 시도');
              // 세션을 한 번 더 시도해보기
              const retrySession = await getSession();
              if (retrySession?.user) {
                const user = retrySession.user;
                return {
                  id: user.id,
                  email: user.email,
                  name:
                    user.user_metadata?.full_name ||
                    user.user_metadata?.user_name ||
                    user.email?.split('@')[0] ||
                    'GitHub User',
                  avatar: user.user_metadata?.avatar_url,
                  provider: 'github',
                };
              }
            }
          } catch (e) {
            console.warn('⚠️ Supabase 토큰 파싱 실패:', e);
          }
        }
      }
      
      // 서버 환경 또는 localStorage가 없는 경우 쿠키 확인
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const guestSessionCookie = cookies.find(c => c.startsWith('guest_session_id='));
        const authTypeCookie = cookies.find(c => c.startsWith('auth_type=guest'));
        
        if (guestSessionCookie && authTypeCookie) {
          // 쿠키에서 게스트 사용자 정보 복원
          const sessionId = guestSessionCookie.split('=')[1] ?? crypto.randomUUID();
          
          // localStorage에서 사용자 정보 확인 (쿠키는 sessionId만 저장)
          if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
              return JSON.parse(storedUser);
            }
          }
          
          // localStorage가 없으면 기본 게스트 사용자 생성
          return {
            id: sessionId,
            name: 'Guest User',
            provider: 'guest',
          };
        }
      }
      
      return null;
    }

    const user = session.user;
    return {
      id: user.id,
      email: user.email,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.user_name ||
        user.email?.split('@')[0] ||
        'GitHub User',
      avatar: user.user_metadata?.avatar_url,
      provider: 'github',
    };
  } catch (error) {
    console.error('❌ 레거시 getCurrentUser 에러:', error);
    return null;
  }
}

/**
 * 인증 상태 확인 (AuthStateManager 사용)
 * @deprecated - 새로운 코드에서는 authStateManager.getAuthState() 사용 권장
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    // AuthStateManager를 통한 통합 상태 확인
    const { authStateManager } = await import('./auth-state-manager');
    const authState = await authStateManager.getAuthState();
    
    console.log('🔄 isAuthenticated -> AuthStateManager 위임:', {
      type: authState.type,
      isAuthenticated: authState.isAuthenticated
    });
    
    return authState.isAuthenticated;
  } catch (error) {
    console.error('❌ isAuthenticated 에러 (AuthStateManager 위임 실패):', error);
    
    // Fallback: getCurrentUser 사용 (레거시 호환성)
    const user = await getCurrentUser();
    return !!user;
  }
}

/**
 * GitHub 인증 사용자인지 확인 (AuthStateManager 사용)
 * @deprecated - 새로운 코드에서는 authStateManager.isGitHubAuthenticated() 사용 권장
 */
export async function isGitHubAuthenticated(): Promise<boolean> {
  try {
    // AuthStateManager를 통한 GitHub 인증 확인
    const { authStateManager } = await import('./auth-state-manager');
    const isGitHub = await authStateManager.isGitHubAuthenticated();
    
    console.log('🔄 isGitHubAuthenticated -> AuthStateManager 위임:', { isGitHub });
    
    return isGitHub;
  } catch (error) {
    console.error('❌ isGitHubAuthenticated 에러 (AuthStateManager 위임 실패):', error);
    
    // Fallback: 레거시 로직 사용
    return await isGitHubAuthenticatedLegacy();
  }
}

/**
 * 게스트 사용자인지 확인 (AuthStateManager 사용)
 * @deprecated - 새로운 코드에서는 authStateManager.isGuestAuthenticated() 사용 권장
 */
export function isGuestUser(): boolean {
  try {
    // AuthStateManager를 통한 게스트 인증 확인 (동기 함수)
    // 동적 import를 사용할 수 없으므로 require 사용
    const authStateManagerModule = require('./auth-state-manager');
    const isGuest = authStateManagerModule.authStateManager.isGuestAuthenticated();
    
    console.log('🔄 isGuestUser -> AuthStateManager 위임:', { isGuest });
    
    return isGuest;
  } catch (error) {
    console.error('❌ isGuestUser 에러 (AuthStateManager 위임 실패):', error);
    
    // Fallback: 레거시 로직 사용
    return isGuestUserLegacy();
  }
}

/**
 * 레거시 GitHub 인증 확인 (하위 호환성용)
 */
async function isGitHubAuthenticatedLegacy(): Promise<boolean> {
  console.warn('⚠️ 레거시 isGitHubAuthenticated 사용 중 - AuthStateManager로 마이그레이션 권장');
  
  const session = await getSession();
  // GitHub OAuth 로그인 확인: 세션이 있고 GitHub 프로바이더인지 확인
  return !!(session && 
    session.user && 
    (session.user.app_metadata?.provider === 'github' || 
     session.user.user_metadata?.provider === 'github'));
}

/**
 * 레거시 게스트 사용자 확인 (하위 호환성용)
 */
function isGuestUserLegacy(): boolean {
  console.warn('⚠️ 레거시 isGuestUser 사용 중 - AuthStateManager로 마이그레이션 권장');
  
  // 클라이언트 환경에서만 localStorage 확인
  if (typeof window !== 'undefined') {
    const authType = localStorage.getItem('auth_type');
    if (authType === 'guest') return true;
  }
  
  // 쿠키에서 게스트 세션 확인 (getCurrentUser와 동일한 로직)
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const guestSessionCookie = cookies.find(c => c.startsWith('guest_session_id='));
    const authTypeCookie = cookies.find(c => c.startsWith('auth_type=guest'));
    
    if (guestSessionCookie && authTypeCookie) return true;
  }
  
  return false;
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('🔄 Auth 상태 변경:', event, session?.user?.email);
      callback(session);
    }
  );

  return authListener;
}

/**
 * 인증 콜백 처리 (OAuth 리다이렉트 후)
 */
export async function handleAuthCallback(): Promise<AuthCallbackResult> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

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
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * 세션 새로고침
 */
export async function refreshSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

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
