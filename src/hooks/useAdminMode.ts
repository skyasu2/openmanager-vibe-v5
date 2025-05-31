import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASSWORD = '4231';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10000; // 10초 (실제로는 10분이라고 표시)

interface AdminModeState {
  isAdminMode: boolean;
  isLocked: boolean;
  attempts: number;
  lockoutEndTime: number | null;
}

export const useAdminMode = () => {
  const [state, setState] = useState<AdminModeState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminModeState');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 잠금 시간이 지났으면 초기화
        if (parsed.lockoutEndTime && Date.now() > parsed.lockoutEndTime) {
          return {
            isAdminMode: parsed.isAdminMode || false,
            isLocked: false,
            attempts: 0,
            lockoutEndTime: null
          };
        }
        return parsed;
      }
    }
    return {
      isAdminMode: false,
      isLocked: false,
      attempts: 0,
      lockoutEndTime: null
    };
  });

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminModeState', JSON.stringify(state));
    }
  }, [state]);

  // 잠금 해제 타이머
  useEffect(() => {
    if (state.isLocked && state.lockoutEndTime) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLocked: false,
          attempts: 0,
          lockoutEndTime: null
        }));
      }, state.lockoutEndTime - Date.now());

      return () => clearTimeout(timer);
    }
  }, [state.isLocked, state.lockoutEndTime]);

  const authenticateAdmin = useCallback((password: string): { success: boolean; message: string; remainingTime?: number } => {
    if (state.isLocked) {
      const remainingTime = state.lockoutEndTime ? Math.max(0, state.lockoutEndTime - Date.now()) : 0;
      return {
        success: false,
        message: `5번 틀려서 10분간 잠겼습니다. ${Math.ceil(remainingTime / 1000)}초 후 다시 시도하세요.`,
        remainingTime
      };
    }

    if (password === ADMIN_PASSWORD) {
      setState(prev => ({
        ...prev,
        isAdminMode: true,
        attempts: 0
      }));
      return { success: true, message: 'AI 관리자 모드가 활성화되었습니다.' };
    } else {
      const newAttempts = state.attempts + 1;
      
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutEndTime = Date.now() + LOCKOUT_DURATION;
        setState(prev => ({
          ...prev,
          attempts: newAttempts,
          isLocked: true,
          lockoutEndTime
        }));
        return {
          success: false,
          message: '5번 틀려서 10분간 잠겼습니다. 잠시 후 다시 시도하세요.'
        };
      } else {
        setState(prev => ({
          ...prev,
          attempts: newAttempts
        }));
        return {
          success: false,
          message: `비밀번호가 틀렸습니다. (${newAttempts}/${MAX_ATTEMPTS})`
        };
      }
    }
  }, [state]);

  const exitAdminMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAdminMode: false
    }));
  }, []);

  const getRemainingLockTime = useCallback(() => {
    if (!state.isLocked || !state.lockoutEndTime) return 0;
    return Math.max(0, state.lockoutEndTime - Date.now());
  }, [state.isLocked, state.lockoutEndTime]);

  return {
    isAdminMode: state.isAdminMode,
    isLocked: state.isLocked,
    attempts: state.attempts,
    authenticateAdmin,
    exitAdminMode,
    getRemainingLockTime
  };
}; 