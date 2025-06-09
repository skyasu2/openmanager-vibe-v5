/**
 * 🎣 useAuthentication Hook
 * 
 * AI 에이전트 인증 상태 관리 훅
 * 
 * @created 2025-06-09
 * @author AI Assistant
 */

import { useState, useCallback } from 'react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { AuthenticationState, ApiResponse } from '../types/ProfileTypes';
import { AuthenticationService } from '../services/AuthenticationService';

interface UseAuthenticationReturn {
    // 인증 상태
    authState: AuthenticationState;
    aiPassword: string;

    // 액션 함수들
    setAiPassword: (password: string) => void;
    setShowPassword: (show: boolean) => void;
    setIsAuthenticating: (authenticating: boolean) => void;

    // 인증 관련 함수들
    handleQuickActivation: () => Promise<ApiResponse>;
    handleAIAuthentication: (password?: string) => Promise<ApiResponse>;
    handleAIDisable: () => Promise<ApiResponse>;

    // 유틸리티 함수들
    validatePassword: (password: string) => { isValid: boolean; message?: string };
    canBypassPassword: () => boolean;
    isDevelopmentMode: () => boolean;
}

export function useAuthentication(): UseAuthenticationReturn {
    // 서비스 인스턴스
    const authService = AuthenticationService.getInstance();

    // 로컬 상태
    const [aiPassword, setAiPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // 스토어에서 인증 관련 상태 가져오기
    const store = useUnifiedAdminStore();
    const {
        aiAgent,
        attempts,
        isLocked,
        authenticateAIAgent,
        disableAIAgent,
        getRemainingLockTime,
    } = store;

    // 인증 상태 객체 생성
    const authState: AuthenticationState = {
        attempts,
        isLocked,
        isAuthenticating,
        showPassword,
    };

    /**
     * 빠른 활성화 (개발 모드용)
     */
    const handleQuickActivation = useCallback(async (): Promise<ApiResponse> => {
        setIsAuthenticating(true);

        try {
            const result = await authService.quickActivation();

            if (result.success) {
                // 스토어의 인증 함수 호출
                const storeResult = await authenticateAIAgent('dev-mode');
                return {
                    success: storeResult.success,
                    message: result.message || '인증 성공',
                    data: result.data
                };
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '빠른 활성화 실패'
            };
        } finally {
            setIsAuthenticating(false);
        }
    }, [authService, authenticateAIAgent]);

    /**
     * AI 에이전트 인증
     */
    const handleAIAuthentication = useCallback(async (quickPassword?: string): Promise<ApiResponse> => {
        const passwordToUse = quickPassword || aiPassword.trim();

        setIsAuthenticating(true);

        try {
            const result = await authService.authenticateAIAgent(passwordToUse, store);

            // 성공 시 비밀번호 입력 필드 초기화
            if (result.success) {
                setAiPassword('');
                setShowPassword(false);
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '인증 중 오류 발생'
            };
        } finally {
            setIsAuthenticating(false);
        }
    }, [aiPassword, authService, store]);

    /**
     * AI 에이전트 비활성화
     */
    const handleAIDisable = useCallback(async (): Promise<ApiResponse> => {
        try {
            const result = await authService.disableAIAgent(store);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '비활성화 중 오류 발생'
            };
        }
    }, [authService, store]);

    /**
     * 비밀번호 검증
     */
    const validatePassword = useCallback((password: string) => {
        return authService.validatePassword(password);
    }, [authService]);

    /**
     * 비밀번호 우회 가능 여부
     */
    const canBypassPassword = useCallback(() => {
        return authService.canBypassPassword();
    }, [authService]);

    /**
     * 개발 모드 확인
     */
    const isDevelopmentMode = useCallback(() => {
        return authService.isDevelopmentMode();
    }, [authService]);

    return {
        // 인증 상태
        authState,
        aiPassword,

        // 액션 함수들
        setAiPassword,
        setShowPassword,
        setIsAuthenticating,

        // 인증 관련 함수들
        handleQuickActivation,
        handleAIAuthentication,
        handleAIDisable,

        // 유틸리티 함수들
        validatePassword,
        canBypassPassword,
        isDevelopmentMode,
    };
} 