'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

  // 기본 상태
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    isLoading: true,
    progress: 0,
    phase: '_initializing',
    error: null,
    isReady: false,
  });

  // 대시보드 관련 상태들
  const [isClient, setIsClient] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [serverStats, setServerStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    warning: 0,
  });

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // URL 파라미터 확인
  const skipLoading = useMemo(() => {
    if (typeof window === 'undefined') return false;

    const searchParams = new URLSearchParams(window.location.search);
    return (
      searchParams.get('instant') === 'true' ||
      searchParams.get('skip') === 'true'
    );
  }, [isClient]);

  // 완료 처리 함수
  const handleLoadingComplete = useCallback(() => {
    console.log('🎯 대시보드 로딩 완료');
    setDashboardState((prev) => ({
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
    setDashboardState((prev) => ({
      ...prev,
      isLoading: loadingState.isLoading,
      progress: loadingState.progress,
      phase: loadingState.phase,
    }));
  }, [loadingState]);

  // 에러 처리
  const handleError = useCallback((error: string) => {
    console.error('❌ 대시보드 에러:', error);
    setDashboardState((prev) => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  // 핸들러 함수들
  const handleServerClick = useCallback((server: any) => {
    setSelectedServer(server);
  }, []);

  const toggleAgent = useCallback(() => {
    setIsAgentOpen((prev) => !prev);
  }, []);

  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
  }, []);

  const handleNavigateHome = useCallback(() => {
    router.push('/main');
  }, [router]);

  const handleSystemStop = useCallback(async () => {
    console.log('시스템 중지');
  }, []);

  const handleSystemPause = useCallback(async () => {
    console.log('시스템 일시정지');
  }, []);

  const handleSystemResume = useCallback(async () => {
    console.log('시스템 재개');
  }, []);

  // 애니메이션 variants
  const mainContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // 대시보드 준비 완료 시 추가 초기화
  useEffect(() => {
    if (dashboardState.isReady && !dashboardState.error) {
      console.log('✅ 대시보드 준비 완료 - 추가 초기화 시작');

      // 서버 통계 초기화
      setServerStats({
        total: 12,
        online: 8,
        offline: 2,
        warning: 2,
      });

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
  }, [
    dashboardState,
    loadingState,
    skipLoading,
    handleLoadingComplete,
    handleError,
  ]);

  return {
    // 기본 상태
    isLoading: dashboardState.isLoading,
    progress: dashboardState.progress,
    phase: dashboardState.phase,
    error: dashboardState.error,
    isReady: dashboardState.isReady,

    // 대시보드 상태
    isClient,
    isAgentOpen,
    selectedServer,
    serverStats,

    // Actions
    setSelectedServer,
    setShowSequentialGeneration: () => {},

    // Handlers
    handleServerClick,
    toggleAgent,
    closeAgent,
    handleNavigateHome,
    handleSystemStop,
    handleSystemPause,
    handleSystemResume,

    // Animation
    mainContentVariants,

    // System control
    systemControl: {},

    // Server generation
    serverGeneration: {
      servers: [] as any[],
      status: 'idle',
      actions: {},
    },

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
