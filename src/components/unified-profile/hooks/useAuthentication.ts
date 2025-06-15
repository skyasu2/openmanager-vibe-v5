/**
 * 🎣 useAuthentication Hook
 *
 * AI 관리자 인증 상태 관리 훅
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

import { useState, useCallback } from 'react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { AuthenticationState, ApiResponse } from '../types/ProfileTypes';

interface UseAuthenticationReturn {
  // 인증 상태
  authState: AuthenticationState;
  aiPassword: string;

  // 액션 함수들
  setAiPassword: (password: string) => void;
  setShowPassword: (show: boolean) => void;
  setIsAuthenticating: (authenticating: boolean) => void;

  // 인증 관련 함수들
  handleAIAuthentication: (password?: string) => Promise<ApiResponse>;

  // 유틸리티 함수들
  validatePassword: (password: string) => {
    isValid: boolean;
    message?: string;
  };
}

export function useAuthentication(): UseAuthenticationReturn {
  // 로컬 상태
  const [aiPassword, setAiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 스토어에서 관리자 관련 상태 가져오기
  const store = useUnifiedAdminStore();
  const {
    adminMode,
    attempts,
    isLocked,
    authenticateAdmin,
    getRemainingLockTime,
  } = store;

  // 인증 상태 객체 생성
  const authState: AuthenticationState = {
    attempts,
    isLocked,
    isAuthenticated: adminMode.isAuthenticated,
    isAuthenticating,
    showPassword,
  };

  /**
   * AI 관리자 인증
   */
  const handleAIAuthentication = useCallback(
    async (quickPassword?: string): Promise<ApiResponse> => {
      const passwordToUse = quickPassword || aiPassword.trim();

      setIsAuthenticating(true);

      try {
        const result = await authenticateAdmin(passwordToUse);

        // 성공 시 비밀번호 입력 필드 초기화
        if (result.success) {
          setAiPassword('');
          setShowPassword(false);
        }

        return {
          success: result.success,
          message: result.message,
          error: result.success ? undefined : result.message,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '인증 중 오류 발생',
        };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [aiPassword, authenticateAdmin]
  );

  /**
   * 비밀번호 검증
   */
  const validatePassword = useCallback((password: string) => {
    if (!password || password.trim().length === 0) {
      return { isValid: false, message: '비밀번호를 입력해주세요.' };
    }

    if (password.length !== 4) {
      return { isValid: false, message: '관리자 PIN은 4자리여야 합니다.' };
    }

    return { isValid: true };
  }, []);

  return {
    authState,
    aiPassword,
    setAiPassword,
    setShowPassword,
    setIsAuthenticating,
    handleAIAuthentication,
    validatePassword,
  };
}
