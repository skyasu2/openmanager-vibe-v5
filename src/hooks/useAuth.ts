/**
 * 🔐 useAuth - 게스트 인증 훅
 *
 * OpenManager Vibe v5 게스트 인증 시스템 (Google OAuth 제거됨)
 */

import type { AuthUser } from '@/lib/auth-state-manager';
import { authStateManager } from '@/lib/auth-state-manager';
import { useEffect, useState } from 'react';

export interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionId: string | null;
  login: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // AuthStateManager 싱글톤 사용

  // 로그인 함수 (게스트 모드만 지원)
  const login = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // 게스트 사용자 생성
      const guestUser: AuthUser = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: '게스트 사용자',
        email: `guest_${Date.now()}@example.com`,
        provider: 'guest',
      };

      // AuthStateManager를 통한 게스트 인증 설정
      await authStateManager.setGuestAuth(guestUser);
      
      // 세션 ID 가져오기
      const newSessionId = localStorage.getItem('auth_session_id') || `guest_${Date.now()}`;
      
      setUser(guestUser);
      setSessionId(newSessionId);

      return { success: true };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = (): void => {
    try {
      if (sessionId) {
        authManager.logout(sessionId);
      }

      // 상태 초기화
      setUser(null);
      setSessionId(null);

      // 로컬 스토리지 정리
      localStorage.removeItem('auth_session_id');
      localStorage.removeItem('auth_type');

      console.log('로그아웃 완료');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 인증 상태 확인
  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);

      const storedSessionId = localStorage.getItem('auth_session_id');
      const authType = localStorage.getItem('auth_type');

      if (!storedSessionId || authType !== 'guest') {
        setUser(null);
        setSessionId(null);
        return;
      }

      // 세션 유효성 확인
      const session = authManager.getSession(storedSessionId);

      if (session) {
        setUser(session.user);
        setSessionId(storedSessionId);
      } else {
        // 세션이 만료된 경우 로컬 스토리지 정리
        localStorage.removeItem('auth_session_id');
        localStorage.removeItem('auth_type');
        setUser(null);
        setSessionId(null);
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      setUser(null);
      setSessionId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 권한 확인 함수
  const hasPermission = (permission: string): boolean => {
    // 게스트 모드에서는 기본 권한만 허용
    if (!user) return false;

    // 기본 권한 목록 (게스트 모드 기본 권한)
    const guestPermissions = [
      'view_dashboard',
      'view_servers',
      'view_metrics',
      'basic_actions',
    ];

    return guestPermissions.includes(permission);
  };

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    sessionId,
    login,
    logout,
    checkAuth,
    hasPermission,
  };
}
