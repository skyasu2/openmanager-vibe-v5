/**
 * 🔐 통합 인증 상태 관리자
 * 
 * GitHub OAuth와 게스트 인증의 통합 관리
 * - 단일 소스를 통한 일관된 상태 확인
 * - 원자적 로그아웃 처리
 * - 저장소 키 분리로 충돌 방지
 */

import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

// 저장소 키 접두사
const GITHUB_PREFIX = 'github_';
const GUEST_PREFIX = 'guest_';
const COMMON_PREFIX = 'auth_';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider?: 'github' | 'guest';
}

export interface AuthState {
  user: AuthUser | null;
  type: 'github' | 'guest' | 'unknown';
  isAuthenticated: boolean;
  sessionId?: string;
}

export class AuthStateManager {
  private static instance: AuthStateManager;
  private cachedState: AuthState | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5000; // 5초 캐시

  public static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }

  /**
   * 통합 인증 상태 확인 (캐싱 포함)
   */
  async getAuthState(): Promise<AuthState> {
    // 캐시된 상태가 유효하면 반환
    if (this.cachedState && Date.now() < this.cacheExpiry) {
      return this.cachedState;
    }

    try {
      // 1. Supabase 세션 확인 (GitHub OAuth) 우선 - GitHub 로그인 정확한 감지
      const session = await this.getSupabaseSession();
      if (session?.user) {
        const githubUser = this.extractGitHubUser(session);
        const state: AuthState = {
          user: githubUser,
          type: 'github',
          isAuthenticated: true,
          sessionId: session.access_token?.substring(0, 8) + '...',
        };
        
        this.setCachedState(state);
        console.log('✅ GitHub 세션 확인 (우선순위):', { userId: githubUser.id, name: githubUser.name });
        return state;
      }

      // 2. 게스트 세션 확인 - GitHub 세션이 없을 때만
      const guestState = await this.getGuestState();
      if (guestState.isAuthenticated) {
        this.setCachedState(guestState);
        console.log('✅ 게스트 세션 확인 (GitHub 세션 없음):', { userId: guestState.user?.id });
        return guestState;
      }

      // 3. 인증되지 않은 상태
      const unknownState: AuthState = {
        user: null,
        type: 'unknown',
        isAuthenticated: false,
      };
      
      this.setCachedState(unknownState);
      return unknownState;

    } catch (error) {
      console.error('❌ 인증 상태 확인 실패:', error);
      const errorState: AuthState = {
        user: null,
        type: 'unknown',
        isAuthenticated: false,
      };
      
      this.setCachedState(errorState);
      return errorState;
    }
  }

  /**
   * GitHub 인증 전용 상태 확인
   */
  async isGitHubAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getSupabaseSession();
      return !!(session?.user && this.isGitHubProvider(session));
    } catch (error) {
      console.error('❌ GitHub 인증 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 게스트 인증 전용 상태 확인
   */
  isGuestAuthenticated(): boolean {
    try {
      // localStorage 확인
      if (typeof window !== 'undefined') {
        const authType = localStorage.getItem(`${GUEST_PREFIX}auth_type`);
        if (authType === 'guest') {
          const sessionId = localStorage.getItem(`${GUEST_PREFIX}session_id`);
          return !!sessionId;
        }
      }

      // 쿠키 fallback 확인
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const guestSession = cookies.find(c => c.startsWith(`${GUEST_PREFIX}session_id=`));
        const authType = cookies.find(c => c.startsWith(`${GUEST_PREFIX}auth_type=guest`));
        
        return !!(guestSession && authType);
      }

      return false;
    } catch (error) {
      console.error('❌ 게스트 인증 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 원자적 로그아웃 처리 (모든 인증 데이터 정리)
   */
  async clearAllAuthData(authType?: 'github' | 'guest'): Promise<void> {
    console.log('🚪 AuthStateManager.clearAllAuthData 시작:', authType || 'all');

    try {
      // 1. React 상태 캐시 즉시 무효화
      console.log('🔄 캐시 무효화 중...');
      this.invalidateCache();

      // 2. Supabase 세션 정리 (GitHub OAuth)
      if (!authType || authType === 'github') {
        console.log('🔄 Supabase 세션 정리 중...');
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.warn('⚠️ Supabase 로그아웃 실패:', error.message);
          } else {
            console.log('✅ Supabase 세션 정리 완료');
          }
        } catch (error) {
          console.warn('⚠️ Supabase 로그아웃 예외:', error);
        }
      }

      // 3. localStorage 정리
      if (typeof window !== 'undefined') {
        if (!authType || authType === 'github') {
          this.clearGitHubLocalStorage();
        }
        if (!authType || authType === 'guest') {
          this.clearGuestLocalStorage();
        }
        // 공통 데이터 정리
        this.clearCommonLocalStorage();
      }

      // 4. 쿠키 정리
      if (typeof document !== 'undefined') {
        if (!authType || authType === 'github') {
          this.clearGitHubCookies();
        }
        if (!authType || authType === 'guest') {
          this.clearGuestCookies();
        }
      }

      console.log('✅ 인증 데이터 정리 완료');
    } catch (error) {
      console.error('❌ 인증 데이터 정리 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(): void {
    this.cachedState = null;
    this.cacheExpiry = 0;
  }

  /**
   * 게스트 로그인 설정 (기존 GitHub 세션 자동 정리)
   */
  async setGuestAuth(guestUser: AuthUser): Promise<void> {
    console.log('🔄 게스트 로그인 설정 시작 - 기존 세션 정리 중...');
    
    // 1. 기존 GitHub 세션이 있으면 먼저 정리
    try {
      const existingSession = await this.getSupabaseSession();
      if (existingSession?.user) {
        console.log('🔄 기존 GitHub 세션 발견 - 정리 중...');
        await supabase.auth.signOut();
        console.log('✅ 기존 GitHub 세션 정리 완료');
      }
    } catch (error) {
      console.warn('⚠️ 기존 세션 정리 실패 (계속 진행):', error);
    }

    // 2. 게스트 세션 설정
    if (typeof window !== 'undefined') {
      const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
      
      // localStorage에 게스트 정보 저장
      localStorage.setItem(`${GUEST_PREFIX}auth_type`, 'guest');
      localStorage.setItem(`${GUEST_PREFIX}session_id`, sessionId);
      localStorage.setItem(`${GUEST_PREFIX}user`, JSON.stringify(guestUser));
      localStorage.setItem(`${COMMON_PREFIX}user`, JSON.stringify(guestUser));

      // 쿠키에 세션 ID 저장 (HttpOnly는 서버에서 설정)
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
      document.cookie = `${GUEST_PREFIX}session_id=${sessionId}; path=/; expires=${expires.toUTCString()}; Secure; SameSite=Strict`;
      document.cookie = `${GUEST_PREFIX}auth_type=guest; path=/; expires=${expires.toUTCString()}; Secure; SameSite=Strict`;

      console.log('✅ 게스트 로그인 설정 완료:', { sessionId, userId: guestUser.id });
    }

    // 캐시 무효화하여 다음 호출에서 새 상태 반영
    this.invalidateCache();
  }

  /**
   * Private 헬퍼 메서드들
   */
  private async getSupabaseSession(): Promise<Session | null> {
    try {
      const response = await supabase.auth.getSession();
      const session = response?.data?.session;
      const error = response?.error;
      if (error) {
        console.warn('⚠️ Supabase 세션 가져오기 실패:', error.message);
        return null;
      }
      return session || null;
    } catch (error) {
      console.error('❌ Supabase 세션 에러:', error);
      return null;
    }
  }

  private async getGuestState(): Promise<AuthState> {
    // localStorage 우선 확인
    if (typeof window !== 'undefined') {
      const authType = localStorage.getItem(`${GUEST_PREFIX}auth_type`);
      const sessionId = localStorage.getItem(`${GUEST_PREFIX}session_id`);
      const userStr = localStorage.getItem(`${GUEST_PREFIX}user`);

      if (authType === 'guest' && sessionId && userStr) {
        try {
          const user = JSON.parse(userStr);
          return {
            user: { ...user, provider: 'guest' },
            type: 'guest',
            isAuthenticated: true,
            sessionId: sessionId.substring(0, 8) + '...',
          };
        } catch (error) {
          console.warn('⚠️ 게스트 사용자 정보 파싱 실패:', error);
        }
      }
    }

    // 쿠키 fallback 확인
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith(`${GUEST_PREFIX}session_id=`));
      const authTypeCookie = cookies.find(c => c.startsWith(`${GUEST_PREFIX}auth_type=guest`));

      if (sessionCookie && authTypeCookie) {
        const sessionId = sessionCookie.split('=')[1];
        
        // 쿠키에는 기본 게스트 사용자 생성
        return {
          user: {
            id: sessionId || `guest_${Date.now()}`,
            name: 'Guest User',
            provider: 'guest',
          },
          type: 'guest',
          isAuthenticated: true,
          sessionId: sessionId?.substring(0, 8) + '...',
        };
      }
    }

    return {
      user: null,
      type: 'unknown',
      isAuthenticated: false,
    };
  }

  private extractGitHubUser(session: Session): AuthUser {
    const user = session.user;
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || 
            user.user_metadata?.user_name || 
            user.email?.split('@')[0] || 
            'GitHub User',
      avatar: user.user_metadata?.avatar_url,
      provider: 'github',
    };
  }

  private isGitHubProvider(session: Session): boolean {
    return !!(session.user?.app_metadata?.provider === 'github' || 
              session.user?.user_metadata?.provider === 'github');
  }

  private setCachedState(state: AuthState): void {
    this.cachedState = state;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  private clearGitHubLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    // GitHub 관련 키들 정리 (더 포괄적으로)
    const keysToRemove = Object.keys(localStorage)
      .filter(key => 
        key.startsWith(GITHUB_PREFIX) || 
        key.startsWith('sb-') || // Supabase 토큰
        key.includes('supabase') ||
        key.includes('github') ||
        key.startsWith('supabase.auth.') ||
        key.includes('access_token') ||
        key.includes('refresh_token')
      );
                     
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 GitHub localStorage 정리: ${key}`);
    });
    
    // sessionStorage도 정리
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage)
        .filter(key => 
          key.includes('supabase') || 
          key.includes('github') ||
          key.includes('auth')
        )
        .forEach(key => {
          sessionStorage.removeItem(key);
          console.log(`🧹 GitHub sessionStorage 정리: ${key}`);
        });
    }
  }

  private clearGuestLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    // 게스트 관련 키들 정리
    const keysToRemove = Object.keys(localStorage)
      .filter(key => key.startsWith(GUEST_PREFIX));
      
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 localStorage 정리: ${key}`);
    });
  }

  private clearCommonLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    // 공통 인증 관련 키들 정리
    const commonKeys = [
      `${COMMON_PREFIX}session_id`,
      `${COMMON_PREFIX}type`,
      `${COMMON_PREFIX}user`,
      'admin_mode',
    ];
    
    commonKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 localStorage 정리: ${key}`);
    });
  }

  private clearGitHubCookies(): void {
    if (typeof document === 'undefined') return;
    
    const githubCookies = [
      `${GITHUB_PREFIX}session_id`,
      `${GITHUB_PREFIX}auth_type`,
    ];
    
    githubCookies.forEach(cookie => {
      document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Strict`;
      console.log(`🧹 쿠키 정리: ${cookie}`);
    });
  }

  private clearGuestCookies(): void {
    if (typeof document === 'undefined') return;
    
    const guestCookies = [
      `${GUEST_PREFIX}session_id`,
      `${GUEST_PREFIX}auth_type`,
      'guest_session_id', // 레거시 호환
      'auth_type', // 레거시 호환
    ];
    
    guestCookies.forEach(cookie => {
      document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Strict`;
      console.log(`🧹 쿠키 정리: ${cookie}`);
    });
  }
}

// 싱글톤 인스턴스 내보내기
export const authStateManager = AuthStateManager.getInstance();

// 편의 함수들
export const getAuthState = () => authStateManager.getAuthState();
export const isGitHubAuthenticated = () => authStateManager.isGitHubAuthenticated();
export const isGuestAuthenticated = () => authStateManager.isGuestAuthenticated();
export const clearAuthData = (authType?: 'github' | 'guest') => authStateManager.clearAllAuthData(authType);
export const invalidateAuthCache = () => authStateManager.invalidateCache();

console.log('🔐 AuthStateManager 초기화 완료');