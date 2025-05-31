'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemControl } from './useSystemControl';
import { useSequentialServerGeneration } from './useSequentialServerGeneration';
import { useMinimumLoadingTime, useDataLoadingPromise } from './useMinimumLoadingTime';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Server } from '../types/server';
import { setupGlobalErrorHandler, safeErrorLog, isLoadingRelatedError } from '../lib/error-handler';

interface DashboardStats {
  total: number;
  online: number;
  warning: number;
  offline: number;
}

interface DashboardLogicState {
  isBootSequenceComplete: boolean;
  showBootSequence: boolean;
  loadingPhase: 'system-starting' | 'data-loading' | 'python-warmup' | 'completed';
  progress: number;
  skipAnimation: boolean;
  errorCount: number;
  emergencyModeActive: boolean;
}

/**
 * 🎯 useDashboardLogic Hook v2.0
 * 
 * 대시보드 전체 로직 관리
 * - 새로운 자연스러운 전환 시스템 통합
 * - 기존 기능 100% 호환성 유지
 * - SystemBootSequence 기반 로딩
 */
export function useDashboardLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [state, setState] = useState<DashboardLogicState>({
    isBootSequenceComplete: false,
    showBootSequence: true,
    loadingPhase: 'system-starting',
    progress: 0,
    skipAnimation: false,
    errorCount: 0,
    emergencyModeActive: false
  });

  // 🛡️ 전역 에러 핸들러 설정 및 에러 추적
  useEffect(() => {
    // 전역 에러 핸들러 설정
    if (typeof window !== 'undefined' && !(window as any).__openManagerErrorHandlerSetup) {
      setupGlobalErrorHandler();
    }

    // 로딩 관련 에러 감지 리스너
    const handleLoadingError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : event.reason;
      
      if (isLoadingRelatedError(error)) {
        setState(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1
        }));
        
        safeErrorLog('🚨 Dashboard 로딩 에러 감지', error);
        
        // 3번 이상 에러 발생 시 비상 모드 활성화
        if (state.errorCount >= 2) {
          console.log('🚨 비상 모드 활성화 - 강제 완료 처리');
          setState(prev => ({
            ...prev,
            emergencyModeActive: true,
            skipAnimation: true
          }));
          
          setTimeout(() => {
            handleBootComplete();
          }, 1000);
        }
      }
    };

    window.addEventListener('error', handleLoadingError as EventListener);
    window.addEventListener('unhandledrejection', handleLoadingError as EventListener);

    return () => {
      window.removeEventListener('error', handleLoadingError as EventListener);
      window.removeEventListener('unhandledrejection', handleLoadingError as EventListener);
    };
  }, [state.errorCount]);

  // URL 파라미터 기반 스킵 조건 확인
  const shouldSkipAnimation = useMemo(() => {
    const urlParams = [
      'instant',
      'fast', 
      'skip',
      'debug',
      'dev'
    ];
    
    return urlParams.some(param => searchParams?.get(param) === 'true') || 
           state.skipAnimation ||
           state.emergencyModeActive;
  }, [searchParams, state.skipAnimation, state.emergencyModeActive]);

  // 자연스러운 로딩 시간 훅 사용
  const {
    isLoading,
    progress,
    phase,
    estimatedTimeRemaining,
    elapsedTime
  } = useMinimumLoadingTime({
    skipCondition: shouldSkipAnimation,
    onComplete: handleBootComplete
  });

  // 🎯 부팅 완료 핸들러 (안전한 버전)
  function handleBootComplete() {
    try {
      console.log('🎉 Dashboard 부팅 완료 처리');
      
      setState(prev => ({
        ...prev,
        isBootSequenceComplete: true,
        showBootSequence: false,
        loadingPhase: 'completed',
        progress: 100
      }));

      // URL 파라미터 정리
      if (shouldSkipAnimation && router) {
        const url = new URL(window.location.href);
        url.searchParams.delete('instant');
        url.searchParams.delete('fast');
        url.searchParams.delete('skip');
        url.searchParams.delete('debug');
        
        // 파라미터가 변경된 경우에만 라우터 업데이트
        if (url.search !== window.location.search) {
          router.replace(url.pathname + url.search, { scroll: false });
        }
      }

      console.log('✅ Dashboard 초기화 완료');
    } catch (error) {
      safeErrorLog('❌ Dashboard 부팅 완료 처리 에러', error);
      // 에러가 발생해도 완료 처리
      setState(prev => ({
        ...prev,
        isBootSequenceComplete: true,
        showBootSequence: false,
        emergencyModeActive: true
      }));
    }
  }

  // 🚀 강제 완료 함수 (전역에서 호출 가능)
  const forceComplete = useCallback(() => {
    console.log('🚀 강제 완료 실행');
    setState(prev => ({
      ...prev,
      skipAnimation: true,
      emergencyModeActive: true
    }));
    handleBootComplete();
  }, []);

  // 전역 함수 등록
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).emergencyComplete = forceComplete;
      (window as any).skipToServer = () => {
        console.log('🚀 서버 대시보드로 바로 이동');
        window.location.href = '/dashboard?instant=true';
      };
    }
  }, [forceComplete]);

  // 🚨 절대 안전장치: 20초 후 무조건 완료
  useEffect(() => {
    const absoluteFailsafe = setTimeout(() => {
      if (!state.isBootSequenceComplete) {
        console.log('🚨 절대 안전장치 발동 - 20초 후 강제 완료');
        forceComplete();
      }
    }, 20000);

    return () => clearTimeout(absoluteFailsafe);
  }, [state.isBootSequenceComplete, forceComplete]);

  // 로딩 상태 동기화
  useEffect(() => {
    setState(prev => ({
      ...prev,
      loadingPhase: phase,
      progress: progress
    }));
  }, [phase, progress]);

  // State management
  const [isClient, setIsClient] = useState(() => {
    // 🚨 긴급 수정: 브라우저 환경이면 즉시 true로 설정
    if (typeof window !== 'undefined') {
      console.log('🌐 브라우저 환경 감지 - isClient 즉시 활성화');
      return true;
    }
    return false;
  });
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [serverStats, setServerStats] = useState<DashboardStats>({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0
  });

  // ✨ 새로운 전환 시스템 상태
  const [showSequentialGeneration, setShowSequentialGeneration] = useState(false);

  // System control and server generation
  const systemControl = useSystemControl();
  const serverGeneration = useSequentialServerGeneration({
    autoStart: showSequentialGeneration,
    intervalMs: 1000,
    onServerAdded: (server) => {
      console.log('🚀 새 서버 추가:', server.hostname);
      const allServers = serverGeneration.servers.concat(server);
      const stats = {
        total: allServers.length,
        online: allServers.filter(s => s.status === 'online').length,
        warning: allServers.filter(s => s.status === 'warning').length,
        offline: allServers.filter(s => s.status === 'offline').length
      };
      updateServerStats(stats);
    },
    onComplete: (allServers) => {
      console.log('🎉 모든 서버 생성 완료:', allServers.length);
      setShowSequentialGeneration(false);
      const stats = {
        total: allServers.length,
        online: allServers.filter(s => s.status === 'online').length,
        warning: allServers.filter(s => s.status === 'warning').length,
        offline: allServers.filter(s => s.status === 'offline').length
      };
      updateServerStats(stats);
    },
    onError: (error) => {
      console.error('❌ 서버 생성 오류:', error);
    }
  });

  /**
   * 서버 통계를 업데이트하는 함수
   * @param stats - 서버 통계 객체
   */
  const updateServerStats = useCallback((stats: DashboardStats) => {
    setServerStats(stats);
  }, []);

  /**
   * 서버 클릭 핸들러
   * @param server - 클릭된 서버 객체
   */
  const handleServerClick = useCallback((server: Server) => {
    setSelectedServer(server);
    console.log('🖱️ Server selected:', server.name);
  }, []);

  /**
   * AI 에이전트 닫기 핸들러
   */
  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
    console.log('🤖 AI 에이전트 닫힘');
  }, []);

  /**
   * AI 에이전트 토글 핸들러
   */
  const toggleAgent = useCallback(() => {
    setIsAgentOpen(prev => {
      const newState = !prev;
      console.log(newState ? '🤖 AI 에이전트 열림' : '🤖 AI 에이전트 닫힘');
      return newState;
    });
  }, []);

  /**
   * 홈 페이지로 네비게이션 핸들러
   */
  const handleNavigateHome = useCallback(() => {
    console.log('🏠 홈으로 이동');
    router.push('/');
  }, [router]);

  /**
   * 시스템 중지 핸들러
   */
  const handleSystemStop = useCallback(async () => {
    try {
      const result = await systemControl.stopFullSystem();
      if (result.success) {
        console.log('⏹️ 시스템 중지:', result.message);
      }
    } catch (error) {
      console.error('❌ 시스템 중지 실패:', error);
    }
  }, [systemControl.stopFullSystem]);

  /**
   * 시스템 일시정지 핸들러
   */
  const handleSystemPause = useCallback(async () => {
    try {
      const result = await systemControl.pauseFullSystem('사용자 요청');
      if (result.success) {
        console.log('⏸️ 시스템 일시정지:', result.message);
      }
    } catch (error) {
      console.error('❌ 시스템 일시정지 실패:', error);
    }
  }, [systemControl.pauseFullSystem]);

  /**
   * 시스템 재개 핸들러
   */
  const handleSystemResume = useCallback(async () => {
    try {
      const result = await systemControl.resumeFullSystem();
      if (result.success) {
        console.log('▶️ 시스템 재개:', result.message);
      }
    } catch (error) {
      console.error('❌ 시스템 재개 실패:', error);
    }
  }, [systemControl.resumeFullSystem]);

  // ✨ 서버 스폰 핸들러 (새로운 전환 시스템용)
  const handleServerSpawned = useCallback((server: Server, index: number) => {
    console.log(`🌐 Server spawned in background: ${server.name} (${index + 1})`);
    setState(prev => ({
      ...prev,
      progress: Math.min(prev.progress + 5, 95)
    }));
  }, []);

  // Client-side initialization
  useEffect(() => {
    // 🚨 강화된 클라이언트 초기화
    if (typeof window !== 'undefined' && !isClient) {
      console.log('🔧 강제 클라이언트 활성화');
      setIsClient(true);
    }
    
    // 추가 안전장치: 100ms 후 다시 체크
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && !isClient) {
        console.log('🚨 지연된 클라이언트 활성화');
        setIsClient(true);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isClient]);

  // ✨ 데이터 로딩 Promise 생성
  const dataLoadingPromise = useDataLoadingPromise(
    serverGeneration.servers,
    serverGeneration.status.isGenerating,
    serverGeneration.status.error
  );

  // Responsive screen size detection
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient]);

  // Auto authentication setup
  useEffect(() => {
    if (isClient) {
      console.log('🔓 대시보드 접근 - 자동 인증 처리');
      localStorage.setItem('dashboard_auth_token', `auto_${Date.now()}`);
      sessionStorage.setItem('dashboard_authorized', 'true');
      localStorage.setItem('dashboard_access_time', Date.now().toString());
      localStorage.setItem('authorized_from_index', 'true');
    }
  }, [isClient]);

  // User activity tracking with debounce optimization
  useEffect(() => {
    if (!isClient || !systemControl.isSystemActive || state.showBootSequence) return;

    let debounceTimer: NodeJS.Timeout;
    
    /**
     * 디바운스된 사용자 활동 핸들러
     * 1초 내에 여러 번 호출되면 마지막 호출만 실행
     */
    const handleUserActivity = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        systemControl.recordActivity();
      }, 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    systemControl.recordActivity();

    return () => {
      clearTimeout(debounceTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isClient, systemControl.isSystemActive, systemControl.recordActivity, state.showBootSequence]);

  // Animation variants for main content
  const mainContentVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  // 🚨 긴급 디버깅 로그
  useEffect(() => {
    console.log('🔍 useDashboardLogic 상태:', {
      isClient,
      showBootSequence: state.showBootSequence,
      serversCount: serverGeneration.servers.length,
      systemActive: systemControl.isSystemActive,
      loadingProgress: progress,
      loadingPhase: phase,
      estimatedTimeRemaining: estimatedTimeRemaining
    });
  }, [
    isClient, 
    state.showBootSequence, 
    serverGeneration.servers.length, 
    systemControl.isSystemActive,
    progress,
    phase,
    estimatedTimeRemaining
  ]);

  return {
    // State
    isAgentOpen,
    isClient,
    isMobile,
    isTablet,
    selectedServer,
    serverStats,
    
    // ✨ 새로운 전환 시스템 상태 (개선됨)
    showBootSequence: state.showBootSequence,
    bootProgress: progress,
    isTransitioning: false,
    showSequentialGeneration,
    
    // ✨ 추가된 로딩 상태 정보
    loadingPhase: phase,
    estimatedTimeRemaining,
    elapsedTime,
    isDataReady: !isLoading && serverGeneration.servers.length > 0,
    
    // Actions
    setSelectedServer,
    setShowSequentialGeneration,
    updateServerStats,
    
    // Handlers
    handleServerClick,
    toggleAgent,
    closeAgent,
    handleNavigateHome,
    handleSystemStop,
    handleSystemPause,
    handleSystemResume,
    
    // ✨ 새로운 전환 시스템 핸들러
    handleBootComplete,
    handleServerSpawned,
    
    // Animation
    mainContentVariants,
    
    // System control
    systemControl,
    
    // Server generation
    serverGeneration,
    
    // 계산된 상태
    shouldSkipAnimation,
    
    // 액션
    forceComplete,
    
    // 디버깅 정보
    debugInfo: {
      searchParams: searchParams?.toString(),
      errorCount: state.errorCount,
      emergencyMode: state.emergencyModeActive,
      phase,
      progress,
      timestamp: new Date().toISOString()
    }
  };
} 