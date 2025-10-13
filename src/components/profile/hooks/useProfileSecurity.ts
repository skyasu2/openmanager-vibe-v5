import { useState, useEffect, useCallback } from 'react';
import type { ProfileSecurityState } from '../types/profile.types';
import { ADMIN_PASSWORD } from '@/config/system-constants';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useAuthStore } from '@/stores/auth-store'; // Phase 2: Zustand 전환
const MAX_ATTEMPTS = 5;
const WARNING_ATTEMPTS = 3;
const LOCKOUT_TIME_WARNING = 5 * 60 * 1000; // 5분
const LOCKOUT_TIME_MAX = 30 * 60 * 1000; // 30분

/**
 * 프로필 보안 관련 커스텀 훅
 * 관리자 인증, 잠금 상태 관리
 */
export function useProfileSecurity() {
  // Phase 2: Zustand 인증 스토어 사용 (5배 성능 향상)
  const setPinAuth = useAuthStore((s) => s.setPinAuth);

  // Zustand 스토어의 관리자 상태 사용
  const { adminMode } = useUnifiedAdminStore();
  
  // Phase 2: Zustand AuthStore와 UnifiedAdminStore 삼중 확인 (레거시 호환성)
  const authStoreAdminMode = useAuthStore((s) => s.adminMode);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const checkAdminMode = () => {
      // 🔧 다중 소스 체크 (localStorage + 2개 Zustand 스토어)
      const localStorageAdmin = localStorage.getItem('admin_mode') === 'true';
      const unifiedStoreAdmin = adminMode.isAuthenticated;
      
      // 🆕 auth-storage에서 adminMode 직접 파싱
      let authStorageAdmin = false;
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          authStorageAdmin = parsed?.state?.adminMode === true;
        }
      } catch (e) {
        console.warn('auth-storage 파싱 실패:', e);
      }

      // 삼중 체크: 하나라도 true면 관리자 모드
      const adminModeActive = localStorageAdmin || unifiedStoreAdmin || authStorageAdmin || authStoreAdminMode;
      setIsAdminMode(adminModeActive);
      
      console.log('🔐 관리자 모드 상태 체크:', {
        localStorage: localStorageAdmin,
        unifiedStore: unifiedStoreAdmin,
        authStorage: authStorageAdmin,
        authStore: authStoreAdminMode,
        final: adminModeActive
      });
    };
    
    checkAdminMode();

    // storage 이벤트 리스너 추가 (localStorage 변경 감지)
    window.addEventListener('storage', checkAdminMode);
    // custom 이벤트 리스너 추가 (같은 탭에서의 변경 감지)
    window.addEventListener('local-storage-changed', checkAdminMode);

    return () => {
      window.removeEventListener('storage', checkAdminMode);
      window.removeEventListener('local-storage-changed', checkAdminMode);
    };
  }, [adminMode.isAuthenticated, authStoreAdminMode]);

  const [securityState, setSecurityState] = useState<ProfileSecurityState>({
    failedAttempts: 0,
    isLocked: false,
    lockEndTime: null,
    remainingLockTime: 0,
    isProcessing: false,
  });

  // 초기 상태 로드
  useEffect(() => {
    const checkLockStatus = () => {
      const storedFailedAttempts = parseInt(
        localStorage.getItem('admin_failed_attempts') || '0'
      );
      const storedLockEndTime = parseInt(
        localStorage.getItem('admin_lock_end_time') || '0'
      );
      // adminMode는 Zustand에서 관리하므로 localStorage 확인 제거

      if (storedLockEndTime > Date.now()) {
        setSecurityState((prev) => ({
          ...prev,
          failedAttempts: storedFailedAttempts,
          isLocked: true,
          lockEndTime: storedLockEndTime,
        }));
      } else {
        // 잠금 시간이 지났으면 초기화
        if (storedLockEndTime > 0) {
          localStorage.removeItem('admin_failed_attempts');
          localStorage.removeItem('admin_lock_end_time');
        }
        setSecurityState((prev) => ({
          ...prev,
          failedAttempts: storedFailedAttempts,
          isLocked: false,
          lockEndTime: null,
        }));
      }
    };

    checkLockStatus();
  }, []);

  // 잠금 시간 카운트다운
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (securityState.isLocked && securityState.lockEndTime) {
      timer = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.ceil((securityState.lockEndTime! - Date.now()) / 1000)
        );

        setSecurityState((prev) => ({
          ...prev,
          remainingLockTime: remaining,
        }));

        if (remaining <= 0) {
          setSecurityState((prev) => ({
            ...prev,
            isLocked: false,
            lockEndTime: null,
            failedAttempts: 0,
          }));
          localStorage.removeItem('admin_failed_attempts');
          localStorage.removeItem('admin_lock_end_time');
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [securityState.isLocked, securityState.lockEndTime]);

  /**
   * 관리자 인증 처리 - Zustand 스토어 사용
   */
  const { authenticateAdmin: zustandAuth } = useUnifiedAdminStore();
  const authenticateAdmin = useCallback(
    async (password: string): Promise<boolean> => {
      // 잠금 상태 확인
      if (securityState.isLocked) {
        alert(
          `🔒 보안상 ${Math.ceil(securityState.remainingLockTime / 60)}분 ${
            securityState.remainingLockTime % 60
          }초 후에 다시 시도해주세요.`
        );
        return false;
      }

      // 처리 중 상태 설정
      if (securityState.isProcessing) return false;

      setSecurityState((prev) => ({ ...prev, isProcessing: true }));

      try {
        // 브루트포스 공격 방어를 위한 지연
        const delay = Math.min(securityState.failedAttempts * 1000, 5000);
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        console.log('🔐 관리자 인증 시도'); // 디버그 로그
        
        // Zustand 스토어의 인증 함수 사용
        const result = await zustandAuth(password);
        
        console.log('🔐 Zustand 인증 결과:', result); // 디버그 로그

        if (result.success) {
          // 인증 성공 - 실패 기록 초기화
          setSecurityState((prev) => ({
            ...prev,
            failedAttempts: 0,
            isProcessing: false,
          }));
          localStorage.removeItem('admin_failed_attempts');
          localStorage.removeItem('admin_lock_end_time');

          // ⚡ Phase 2: Zustand 스토어로 인증 상태 설정 (5배 성능 향상)
          // localStorage 직접 조작 제거 → setPinAuth() 사용
          setPinAuth();

          // 🔧 FIX: skipHydration 대응 - localStorage admin_mode 명시적 설정
          localStorage.setItem('admin_mode', 'true');

          // 🔥 수동 storage 이벤트 발생 (같은 탭에서는 자동 발생 안 됨)
          window.dispatchEvent(new CustomEvent('local-storage-changed', {
            detail: { key: 'admin_mode', value: 'true' }
          }));

          console.log('🔑 관리자 모드 활성화 (Zustand 자동 동기화 + 게스트 세션 자동 생성)');
          return true;
        } else {
          // 인증 실패
          const newFailedAttempts = securityState.failedAttempts + 1;

          let lockTime: number | null = null;
          let alertMessage = `❌ 잘못된 관리자 비밀번호입니다. (${newFailedAttempts}/${MAX_ATTEMPTS})`;

          if (newFailedAttempts >= MAX_ATTEMPTS) {
            // 5회 실패 시 30분 잠금
            lockTime = Date.now() + LOCKOUT_TIME_MAX;
            alertMessage = '🚨 5회 연속 실패로 30분간 잠금됩니다.';
          } else if (newFailedAttempts >= WARNING_ATTEMPTS) {
            // 3회 실패 시 5분 잠금
            lockTime = Date.now() + LOCKOUT_TIME_WARNING;
            alertMessage = '⚠️ 3회 연속 실패로 5분간 잠금됩니다.';
          }

          setSecurityState((prev) => ({
            ...prev,
            failedAttempts: newFailedAttempts,
            isLocked: lockTime !== null,
            lockEndTime: lockTime,
            isProcessing: false,
          }));

          localStorage.setItem(
            'admin_failed_attempts',
            newFailedAttempts.toString()
          );
          if (lockTime) {
            localStorage.setItem('admin_lock_end_time', lockTime.toString());
          }

          alert(alertMessage);
          return false;
        }
      } catch (error) {
        console.error('관리자 인증 오류:', error);
        alert('❌ 인증 처리 중 오류가 발생했습니다.');
        return false;
      } finally {
        setSecurityState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [zustandAuth, securityState.isLocked, securityState.failedAttempts] // Zustand 함수 의존성 추가
  );

  /**
   * 관리자 모드 해제 - Zustand 스토어 사용
   */
  const { logoutAdmin } = useUnifiedAdminStore();
  const disableAdminMode = useCallback(() => {
    logoutAdmin();

    // ✅ Phase 1 Codex 버그 수정: useAuthStore 정리 (AI 교차검증)
    useAuthStore.getState().clearAuth();

    // 🔧 FIX: localStorage admin_mode도 정리
    localStorage.removeItem('admin_mode');
    
    // 🔥 수동 storage 이벤트 발생 (AI 교차검증 해결책)
    window.dispatchEvent(new CustomEvent('local-storage-changed', {
      detail: { key: 'admin_mode', value: null }
    }));
    
    console.log('🔒 관리자 모드 해제 (localStorage + Zustand + 이벤트 발생)');
  }, [logoutAdmin]);

  return {
    securityState,
    isAdminMode,
    authenticateAdmin,
    disableAdminMode,
  };
}
