'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LoadingStep {
    id: string;
    label: string;
    description?: string;
    duration: number; // ms
    status: 'pending' | 'loading' | 'completed' | 'error';
    error?: string;
}

export interface LoadingState {
    currentStep: string | null;
    currentStepIndex: number;
    totalSteps: number;
    progress: number;
    isLoading: boolean;
    isCompleted: boolean;
    hasError: boolean;
    error?: string;
    estimatedTimeRemaining: number;
    elapsedTime: number;
    steps: LoadingStep[];
}

export interface LoadingStepInput {
    id: string;
    label: string;
    description?: string;
    duration: number;
}

export interface UseLoadingStateOptions {
    steps: LoadingStepInput[];
    autoStart?: boolean;
    skipCondition?: boolean;
    onStepComplete?: (step: LoadingStep) => void;
    onComplete?: () => void;
    onError?: (error: string, step: LoadingStep) => void;
    minStepDuration?: number;
}

/**
 * 🔄 Enhanced Loading State Hook
 * 
 * 단계별 로딩 상태를 관리하고 시각적 피드백을 제공합니다.
 * 
 * Features:
 * - 단계별 진행 상황 추적
 * - 진행률 및 예상 시간 계산
 * - 에러 처리 및 복구
 * - 스킵 조건 지원
 * - 메모리 누수 방지
 */
export function useLoadingState(options: UseLoadingStateOptions) {
    const {
        steps: initialSteps,
        autoStart = true,
        skipCondition = false,
        onStepComplete,
        onComplete,
        onError,
        minStepDuration = 100,
    } = options;

    // 컴포넌트 마운트 상태 추적
    const isMountedRef = useRef(true);
    const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
    const startTimeRef = useRef<number>(Date.now());

    // LoadingStepInput을 LoadingStep으로 변환
    const stepsWithStatus: LoadingStep[] = initialSteps.map(step => ({
        ...step,
        status: 'pending' as const
    }));

    const [state, setState] = useState<LoadingState>(() => ({
        currentStep: null,
        currentStepIndex: -1,
        totalSteps: initialSteps.length,
        progress: 0,
        isLoading: false,
        isCompleted: false,
        hasError: false,
        estimatedTimeRemaining: 0,
        elapsedTime: 0,
        steps: stepsWithStatus,
    }));

    // 타이머 정리 함수
    const clearAllTimeouts = useCallback(() => {
        timeoutRefs.current.forEach(clearTimeout);
        timeoutRefs.current = [];
    }, []);

    // 안전한 상태 업데이트
    const safeSetState = useCallback((updater: (prev: LoadingState) => LoadingState) => {
        if (isMountedRef.current) {
            setState(updater);
        }
    }, []);

    // 진행률 계산
    const calculateProgress = useCallback((stepIndex: number, totalSteps: number) => {
        return Math.round(((stepIndex + 1) / totalSteps) * 100);
    }, []);

    // 예상 시간 계산
    const calculateEstimatedTime = useCallback((
        currentIndex: number,
        steps: LoadingStepInput[],
        elapsedTime: number
    ) => {
        const completedSteps = currentIndex + 1;
        const remainingSteps = steps.slice(completedSteps);
        const remainingDuration = remainingSteps.reduce((sum, step) => sum + step.duration, 0);

        // 실제 경과 시간을 고려한 보정
        const avgStepTime = completedSteps > 0 ? elapsedTime / completedSteps : 0;
        const adjustedRemaining = avgStepTime > 0
            ? (remainingSteps.length * avgStepTime)
            : remainingDuration;

        return Math.max(0, adjustedRemaining);
    }, []);

    // 단일 스텝 실행
    const executeStep = useCallback(async (stepIndex: number): Promise<void> => {
        if (!isMountedRef.current || stepIndex >= initialSteps.length) return;

        const step = initialSteps[stepIndex];
        const startTime = Date.now();

        try {
            // 스텝 시작
            safeSetState(prev => ({
                ...prev,
                currentStep: step.id,
                currentStepIndex: stepIndex,
                steps: prev.steps.map((s, i) =>
                    i === stepIndex ? { ...s, status: 'loading' } : s
                ),
            }));

            // 최소 시간 보장을 위한 딜레이
            const minDelay = Math.max(minStepDuration, step.duration);

            await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    if (!isMountedRef.current) {
                        reject(new Error('Component unmounted'));
                        return;
                    }

                    // 스텝 완료
                    const elapsedTime = Date.now() - startTimeRef.current;
                    const progress = calculateProgress(stepIndex, initialSteps.length);
                    const estimatedTime = calculateEstimatedTime(stepIndex, initialSteps, elapsedTime);

                    safeSetState(prev => ({
                        ...prev,
                        progress,
                        elapsedTime,
                        estimatedTimeRemaining: estimatedTime,
                        steps: prev.steps.map((s, i) =>
                            i === stepIndex ? { ...s, status: 'completed' } : s
                        ),
                    }));

                    onStepComplete?.({ ...step, status: 'completed' });
                    resolve();
                }, minDelay);

                timeoutRefs.current.push(timeoutId);
            });

        } catch (error) {
            if (!isMountedRef.current) return;

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            safeSetState(prev => ({
                ...prev,
                hasError: true,
                error: errorMessage,
                steps: prev.steps.map((s, i) =>
                    i === stepIndex ? { ...s, status: 'error', error: errorMessage } : s
                ),
            }));

            onError?.(errorMessage, { ...step, status: 'error', error: errorMessage });
            throw error;
        }
    }, [
        initialSteps,
        minStepDuration,
        safeSetState,
        calculateProgress,
        calculateEstimatedTime,
        onStepComplete,
        onError,
    ]);

    // 로딩 시작
    const startLoading = useCallback(async () => {
        if (!isMountedRef.current) return;

        startTimeRef.current = Date.now();

        safeSetState(prev => ({
            ...prev,
            isLoading: true,
            isCompleted: false,
            hasError: false,
            error: undefined,
            currentStepIndex: -1,
            progress: 0,
            elapsedTime: 0,
            estimatedTimeRemaining: initialSteps.reduce((sum, step) => sum + step.duration, 0),
        }));

        try {
            // 스킵 조건 확인
            if (skipCondition) {
                safeSetState(prev => ({
                    ...prev,
                    isLoading: false,
                    isCompleted: true,
                    progress: 100,
                    steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
                }));
                onComplete?.();
                return;
            }

            // 순차적으로 스텝 실행
            for (let i = 0; i < initialSteps.length; i++) {
                if (!isMountedRef.current) break;
                await executeStep(i);
            }

            if (isMountedRef.current) {
                safeSetState(prev => ({
                    ...prev,
                    isLoading: false,
                    isCompleted: true,
                    progress: 100,
                    estimatedTimeRemaining: 0,
                }));
                onComplete?.();
            }

        } catch (error) {
            if (isMountedRef.current) {
                safeSetState(prev => ({
                    ...prev,
                    isLoading: false,
                    hasError: true,
                }));
            }
        }
    }, [skipCondition, initialSteps, executeStep, safeSetState, onComplete]);

    // 로딩 재시작
    const restartLoading = useCallback(() => {
        clearAllTimeouts();
        startLoading();
    }, [clearAllTimeouts, startLoading]);

    // 로딩 중단
    const stopLoading = useCallback(() => {
        clearAllTimeouts();
        safeSetState(prev => ({
            ...prev,
            isLoading: false,
        }));
    }, [clearAllTimeouts, safeSetState]);

    // 자동 시작
    useEffect(() => {
        if (autoStart) {
            startLoading();
        }

        return () => {
            isMountedRef.current = false;
            clearAllTimeouts();
        };
    }, [autoStart, startLoading, clearAllTimeouts]);

    // 정리
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearAllTimeouts();
        };
    }, [clearAllTimeouts]);

    return {
        ...state,
        startLoading,
        restartLoading,
        stopLoading,
        // 유틸리티 함수들
        getCurrentStep: () => state.steps[state.currentStepIndex],
        getCompletedSteps: () => state.steps.filter(s => s.status === 'completed'),
        getFailedSteps: () => state.steps.filter(s => s.status === 'error'),
        isStepCompleted: (stepId: string) =>
            state.steps.find(s => s.id === stepId)?.status === 'completed',
        isStepLoading: (stepId: string) =>
            state.steps.find(s => s.id === stepId)?.status === 'loading',
        isStepFailed: (stepId: string) =>
            state.steps.find(s => s.id === stepId)?.status === 'error',
    };
} 