import { useState, useEffect, useCallback } from 'react';
import type { ProfileSecurityState } from '../types/profile.types';
import { ADMIN_PASSWORD } from '@/config/system-constants';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
const MAX_ATTEMPTS = 5;
const WARNING_ATTEMPTS = 3;
const LOCKOUT_TIME_WARNING = 5 * 60 * 1000; // 5분
const LOCKOUT_TIME_MAX = 30 * 60 * 1000; // 30분

/**
 * 프로필 보안 관련 커스텀 훅
 * 관리자 인증, 잠금 상태 관리
 */
export function useProfileSecurity() {
  // Zustand 스토어의 관리자 상태 사용
  const { adminMode } = useUnifiedAdminStore();
  const isAdminMode = adminMode.isAuthenticated;

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

        console.log('🔐 관리자 인증 시도:', password); // 디버그 로그
        
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

          console.log('🔑 관리자 모드 활성화');
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
    console.log('🔒 관리자 모드 해제');
  }, [logoutAdmin]);

  return {
    securityState,
    isAdminMode,
    authenticateAdmin,
    disableAdminMode,
  };
}
