'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemControl } from './useSystemControl';
import { useSequentialServerGeneration } from './useSequentialServerGeneration';
import { useMinimumLoadingTime, useDataLoadingPromise } from './useMinimumLoadingTime';
import { useRouter } from 'next/navigation';
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

// 🛡️ 기본 서버 객체 (null-safe fallback)
const DEFAULT_SERVER: Server = {
  id: 'unknown',
  name: 'Unknown Server',
  status: 'offline',
  cpu: 0,
  memory: 0,
  disk: 0,
  uptime: '0s',
  location: 'Unknown',
  alerts: 0,
  lastUpdate: new Date(),
  services: []
};

// 🛡️ 기본 서버 통계 (null-safe fallback)
const DEFAULT_STATS: DashboardStats = {
  total: 0,
  online: 0,
  warning: 0,
  offline: 0
};

/**
 * 🎯 useDashboardLogic Hook v2.1 - Null-Safe Edition
 * 
 * 대시보드 전체 로직 관리
 * - 새로운 자연스러운 전환 시스템 통합
 * - 기존 기능 100% 호환성 유지
 * - SystemBootSequence 기반 로딩
 * - 🛡️ Null-safe 체크 및 안전한 오류 처리 추가
 */
export function useDashboardLogic() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  // 클라이언트 사이드에서만 searchParams 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);
  
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
      console.error('❌ 로딩 에러 감지:', event);
      setState(prev => ({ 
        ...prev, 
        errorCount: prev.errorCount + 1,
        emergencyModeActive: prev.errorCount >= 2
      }));
    };

    window.addEventListener('error', handleLoadingError as EventListener);
    window.addEventListener('unhandledrejection', handleLoadingError as EventListener);

    return () => {
      window.removeEventListener('error', handleLoadingError as EventListener);
      window.removeEventListener('unhandledrejection', handleLoadingError as EventListener);
    };
  }, []);

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

  // 🎯 부팅 완료 핸들러 (안전한 버전)
  const handleBootComplete = useCallback(() => {
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
  }, [shouldSkipAnimation, router]);

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

  // 부팅 완료 시 handleBootComplete 실행
  useEffect(() => {
    if (isLoading === false && !state.isBootSequenceComplete) {
      handleBootComplete();
    }
  }, [isLoading, state.isBootSequenceComplete, handleBootComplete]);

  // 🚀 강제 완료 함수 (전역에서 호출 가능)
  const forceComplete = useCallback(() => {
    console.log('🚀 강제 완료 실행');
    setState(prev => ({
      ...prev,
      skipAnimation: true,
      emergencyModeActive: true
    }));
    handleBootComplete();
  }, [handleBootComplete]);

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

  // State management with null-safe initialization
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
  // 🛡️ selectedServer를 안전하게 초기화
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  // 🛡️ serverStats를 기본값으로 초기화
  const [serverStats, setServerStats] = useState<DashboardStats>(DEFAULT_STATS);

  // ✨ 새로운 전환 시스템 상태
  const [showSequentialGeneration, setShowSequentialGeneration] = useState(false);

  // System control and server generation
  const systemControl = useSystemControl();
  const serverGeneration = useSequentialServerGeneration({
    autoStart: showSequentialGeneration,
    intervalMs: 1000,
    onServerAdded: (server) => {
      console.log('🚀 새 서버 추가:', server?.hostname || 'Unknown');
      // 🛡️ 안전한 서버 리스트 접근
      const allServers = Array.isArray(serverGeneration.servers) ? serverGeneration.servers.concat(server) : [server];
      const stats = {
        total: allServers.length,
        online: allServers.filter(s => s?.status === 'online').length,
        warning: allServers.filter(s => s?.status === 'warning').length,
        offline: allServers.filter(s => s?.status === 'offline').length
      };
      updateServerStats(stats);
    },
    onComplete: (allServers) => {
      console.log('🎉 모든 서버 생성 완료:', allServers?.length || 0);
      setShowSequentialGeneration(false);
      // 🛡️ 안전한 서버 리스트 접근
      const safeServers = Array.isArray(allServers) ? allServers : [];
      const stats = {
        total: safeServers.length,
        online: safeServers.filter(s => s?.status === 'online').length,
        warning: safeServers.filter(s => s?.status === 'warning').length,
        offline: safeServers.filter(s => s?.status === 'offline').length
      };
      updateServerStats(stats);
    },
    onError: (error) => {
      console.error('❌ 서버 생성 오류:', error);
      // 🛡️ 에러 발생 시 기본값으로 복구
      updateServerStats(DEFAULT_STATS);
    }
  });

  /**
   * 🛡️ 안전한 서버 통계 업데이트 함수
   * @param stats - 서버 통계 객체
   */
  const updateServerStats = useCallback((stats: DashboardStats) => {
    try {
      // 🛡️ stats가 유효한지 검증
      if (stats && typeof stats === 'object') {
        setServerStats({
          total: Number(stats.total) || 0,
          online: Number(stats.online) || 0,
          warning: Number(stats.warning) || 0,
          offline: Number(stats.offline) || 0
        });
      } else {
        console.warn('⚠️ 잘못된 서버 통계 데이터:', stats);
        setServerStats(DEFAULT_STATS);
      }
    } catch (error) {
      console.error('❌ 서버 통계 업데이트 오류:', error);
      setServerStats(DEFAULT_STATS);
    }
  }, []);

  /**
   * 🛡️ 안전한 서버 클릭 핸들러
   * @param server - 클릭된 서버 객체
   */
  const handleServerClick = useCallback((server: Server | null | undefined) => {
    try {
      // 🛡️ server가 유효한지 검증
      if (server && typeof server === 'object' && server.id) {
        setSelectedServer(server);
        console.log('🖱️ Server selected:', server.name || server.id);
      } else {
        console.warn('⚠️ 잘못된 서버 객체:', server);
        setSelectedServer(null);
      }
    } catch (error) {
      console.error('❌ 서버 클릭 핸들러 오류:', error);
      setSelectedServer(null);
    }
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
      if (result?.success) {
        console.log('⏹️ 시스템 중지:', result.message);
      }
    } catch (error) {
      console.error('❌ 시스템 중지 실패:', error);
    }
  }, [systemControl]);

  /**
   * 시스템 일시정지 핸들러
   */
  const handleSystemPause = useCallback(async () => {
    try {
      const result = await systemControl.pauseFullSystem('사용자 요청');
      if (result?.success) {
        console.log('⏸️ 시스템 일시정지:', result.message);
      }
    } catch (error) {
      console.error('❌ 시스템 일시정지 실패:', error);
    }
  }, [systemControl]);

  /**
   * 시스템 재개 핸들러
   */
  const handleSystemResume = useCallback(async () => {
    try {
      const result = await systemControl.resumeFullSystem();
      if (result?.success) {
        console.log('▶️ 시스템 재개:', result.message);
      }
    } catch (error) {
      console.error('❌ 시스템 재개 실패:', error);
    }
  }, [systemControl]);

  // ✨ 서버 스폰 핸들러 (새로운 전환 시스템용)
  const handleServerSpawned = useCallback((server: Server | null | undefined, index: number) => {
    try {
      if (server && typeof server === 'object') {
        console.log(`🌐 Server spawned in background: ${server.name || server.id} (${index + 1})`);
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 5, 95)
        }));
      }
    } catch (error) {
      console.error('❌ 서버 스폰 핸들러 오류:', error);
    }
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

  // ✨ 데이터 로딩 Promise 생성 (null-safe)
  const dataLoadingPromise = useDataLoadingPromise(
    Array.isArray(serverGeneration.servers) ? serverGeneration.servers : [],
    serverGeneration.status?.isGenerating || false,
    serverGeneration.status?.error
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
    if (!isClient || !systemControl?.isSystemActive || state.showBootSequence) return;

    let debounceTimer: NodeJS.Timeout;
    
    /**
     * 디바운스된 사용자 활동 핸들러
     * 1초 내에 여러 번 호출되면 마지막 호출만 실행
     */
    const handleUserActivity = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (systemControl?.recordActivity) {
          systemControl.recordActivity();
        }
      }, 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    if (systemControl?.recordActivity) {
      systemControl.recordActivity();
    }

    return () => {
      clearTimeout(debounceTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isClient, systemControl, state.showBootSequence]);

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

  // 🚨 긴급 디버깅 로그 (null-safe)
  useEffect(() => {
    console.log('🔍 useDashboardLogic 상태:', {
      isClient,
      showBootSequence: state.showBootSequence,
      serversCount: Array.isArray(serverGeneration.servers) ? serverGeneration.servers.length : 0,
      systemActive: systemControl?.isSystemActive || false,
      loadingProgress: progress,
      loadingPhase: phase,
      estimatedTimeRemaining: estimatedTimeRemaining,
      selectedServer: selectedServer ? { id: selectedServer.id, name: selectedServer.name } : null,
      serverStats
    });
  }, [
    isClient, 
    state.showBootSequence, 
    serverGeneration.servers, 
    systemControl?.isSystemActive,
    progress,
    phase,
    estimatedTimeRemaining,
    selectedServer,
    serverStats
  ]);

  // 🛡️ 안전한 서버 리스트 반환
  const safeServerList = useMemo(() => {
    return Array.isArray(serverGeneration.servers) ? serverGeneration.servers : [];
  }, [serverGeneration.servers]);

  return {
    // State (null-safe)
    isAgentOpen,
    isClient,
    isMobile,
    isTablet,
    selectedServer: selectedServer || null,
    serverStats: serverStats || DEFAULT_STATS,
    
    // ✨ 새로운 전환 시스템 상태 (개선됨)
    showBootSequence: state.showBootSequence,
    bootProgress: progress,
    isTransitioning: false,
    showSequentialGeneration,
    
    // ✨ 추가된 로딩 상태 정보
    loadingPhase: phase,
    estimatedTimeRemaining,
    elapsedTime,
    isDataReady: !isLoading && safeServerList.length > 0,
    
    // Actions
    setSelectedServer,
    setShowSequentialGeneration,
    updateServerStats,
    
    // Handlers (null-safe)
    handleServerClick,
    toggleAgent,
    closeAgent,
    handleNavigateHome,
    handleSystemStop,
    handleSystemPause,
    handleSystemResume,
    
    // ✨ 새로운 전환 시스템 핸들러
    handleBootComplete,
    handleServerSpawned: (server: any, index: number) => {
      console.log(`🚀 서버 생성됨: ${server?.name || server?.id || 'Unknown'} (${index + 1}/${safeServerList.length})`);
    },
    handleBootSequenceComplete: handleBootComplete,
    
    // Animation
    mainContentVariants,
    
    // System control (null-safe)
    systemControl: systemControl || {},
    
    // Server generation (null-safe)
    serverGeneration: {
      ...serverGeneration,
      servers: safeServerList
    },
    
    // 계산된 상태
    shouldSkipAnimation,
    
    // 액션
    forceComplete,
    
    // 디버깅 정보
    debugInfo: {
      searchParams: searchParams?.toString() || '',
      errorCount: state.errorCount,
      emergencyMode: state.emergencyModeActive,
      phase,
      progress,
      timestamp: new Date().toISOString(),
      safeServerCount: safeServerList.length
    }
  };
} 