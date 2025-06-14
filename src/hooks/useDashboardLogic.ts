'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNaturalLoadingTime } from './useMinimumLoadingTime';
import { useSequentialLoadingTime } from './useSequentialLoadingTime';

interface DashboardState {
  isLoading: boolean;
  progress: number;
  phase: string;
  error: string | null;
  isReady: boolean;
}

/**
 * 🎯 useDashboardLogic Hook v2.1 - 호환성 개선
 *
 * 대시보드 초기화 및 로딩 상태를 관리하는 통합 훅
 * - 프론트엔드 구성 90% 유지
 * - 실제 시스템과의 호환성 문제 해결
 * - 자연스러운 로딩 플로우 제공
 */
export const useDashboardLogic = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 기본 상태
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    isLoading: true,
    progress: 0,
    phase: 'initializing',
    error: null,
    isReady: false,
  });

  // URL 파라미터 확인
  const skipLoading = useMemo(() => {
    return searchParams?.get('instant') === 'true' ||
      searchParams?.get('skip') === 'true';
  }, [searchParams]);

  // 완료 처리 함수
  const handleLoadingComplete = useCallback(() => {
    console.log('🎯 대시보드 로딩 완료');
    setDashboardState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
      phase: 'ready',
      isReady: true,
    }));
  }, []);

  // 자연스러운 로딩 훅
  const naturalLoading = useNaturalLoadingTime({
    skipCondition: skipLoading,
    onComplete: handleLoadingComplete,
  });

  // 순차적 로딩 훅 (백업용)
  const sequentialLoading = useSequentialLoadingTime({
    skipCondition: skipLoading,
    onComplete: handleLoadingComplete,
  });

  // 통합 로딩 상태 (자연스러운 로딩 우선)
  const loadingState = useMemo(() => {
    const primary = naturalLoading;
    const backup = sequentialLoading;

    return {
      isLoading: primary.isLoading || backup.isLoading,
      progress: Math.max(primary.progress, backup.progress),
      phase: primary.phase || 'loading',
      estimatedTimeRemaining: primary.estimatedTimeRemaining,
      elapsedTime: primary.elapsedTime,
    };
  }, [naturalLoading, sequentialLoading]);

  // 대시보드 상태 업데이트
  useEffect(() => {
    setDashboardState(prev => ({
      ...prev,
      isLoading: loadingState.isLoading,
      progress: loadingState.progress,
      phase: loadingState.phase,
    }));
  }, [loadingState]);

  // 에러 처리
  const handleError = useCallback((error: string) => {
    console.error('❌ 대시보드 에러:', error);
    setDashboardState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  // 대시보드 준비 완료 시 추가 초기화
  useEffect(() => {
    if (dashboardState.isReady && !dashboardState.error) {
      console.log('✅ 대시보드 준비 완료 - 추가 초기화 시작');

      // 여기에 대시보드 관련 추가 초기화 로직 추가 가능
      // 예: 실시간 데이터 구독, 웹소켓 연결 등

      try {
        // 전역 상태 설정
        if (typeof window !== 'undefined') {
          (window as any).dashboardReady = true;
          (window as any).dashboardLoadTime = Date.now();
        }
      } catch (error) {
        console.warn('⚠️ 전역 상태 설정 실패:', error);
      }
    }
  }, [dashboardState.isReady, dashboardState.error]);

  // 개발자 도구
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugDashboard = {
        state: dashboardState,
        loading: loadingState,
        skipLoading,
        forceComplete: handleLoadingComplete,
        simulateError: (msg: string) => handleError(msg),
      };
    }
  }, [dashboardState, loadingState, skipLoading, handleLoadingComplete, handleError]);

  return {
    // 기본 상태
    isLoading: dashboardState.isLoading,
    progress: dashboardState.progress,
    phase: dashboardState.phase,
    error: dashboardState.error,
    isReady: dashboardState.isReady,

    // 상세 로딩 정보
    estimatedTimeRemaining: loadingState.estimatedTimeRemaining,
    elapsedTime: loadingState.elapsedTime,

    // 제어 함수
    handleError,
    forceComplete: handleLoadingComplete,

    // 설정
    skipLoading,
  };
};
