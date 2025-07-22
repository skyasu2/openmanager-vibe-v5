import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/hooks/useSupabaseSession';
import {
  getCurrentUser,
  isGitHubAuthenticated,
  isGuestUser,
} from '@/lib/supabase-auth';
import type { UserInfo, UserType } from '../types/profile.types';

/**
 * 프로필 인증 관련 커스텀 훅
 * 사용자 정보, 인증 상태 관리
 */
export function useProfileAuth() {
  const { status } = useSession();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userType, setUserType] = useState<UserType>('unknown');
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        const isGitHub = await isGitHubAuthenticated();
        const isGuest = isGuestUser();

        setUserInfo(user);

        // 사용자 타입 결정
        if (isGitHub) {
          setUserType('github');
        } else if (isGuest) {
          setUserType('guest');
        } else {
          setUserType('unknown');
        }

        console.log('👤 사용자 정보 로드:', {
          user,
          isGitHub,
          isGuest,
          sessionStatus: status,
        });
      } catch (error) {
        console.error('❌ 사용자 정보 로드 실패:', error);
        setUserType('unknown');
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      loadUserInfo();
    }
  }, [status]); // session 제거하여 무한 루프 방지

  /**
   * 로그아웃 처리
   */
  const handleLogout = useCallback(async () => {
    const userTypeLabel = userType === 'github' ? 'GitHub' : '게스트';
    const confirmed = confirm(
      `🚪 ${userTypeLabel} 계정에서 로그아웃하시겠습니까?`
    );

    if (!confirmed) {
      return false;
    }

    try {
      console.log('🚪 로그아웃 시작:', { userType });

      // 관리자 모드 해제
      localStorage.removeItem('admin_mode');

      // 모든 인증 관련 데이터 정리
      localStorage.removeItem('auth_session_id');
      localStorage.removeItem('auth_type');
      localStorage.removeItem('auth_user');

      // 쿠키 정리
      document.cookie =
        'guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      if (userType === 'github') {
        // GitHub OAuth 로그아웃
        await signOut({ callbackUrl: '/login' });
      } else {
        // 게스트 모드 로그아웃
        window.location.href = '/login';
      }

      return true;
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      // 실패해도 로그인 페이지로 강제 이동
      window.location.href = '/login';
      return false;
    }
  }, [userType]);

  // 비활성 타이머는 사용하지 않음 (max-lines-per-function 경고 해결)

  /**
   * 페이지 이동 핸들러들
   */
  const navigateToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  const navigateToAdmin = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const navigateToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return {
    userInfo,
    userType,
    isLoading,
    status,
    handleLogout,
    navigateToLogin,
    navigateToAdmin,
    navigateToDashboard,
  };
}
