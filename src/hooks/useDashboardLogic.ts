'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemControl } from './useSystemControl';
import { useSequentialServerGeneration } from './useSequentialServerGeneration';
import { useMinimumLoadingTime, useDataLoadingPromise } from './useMinimumLoadingTime';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Server } from '../types/server';

interface DashboardStats {
  total: number;
  online: number;
  warning: number;
  offline: number;
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
  const [showBootSequence, setShowBootSequence] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
  const router = useRouter();

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

  // ✨ 새로운 부팅 시퀀스 완료 핸들러
  const handleBootSequenceComplete = useCallback(() => {
    console.log('🎉 Boot sequence completed, transitioning to dashboard');
    setIsTransitioning(true);
    
    // 부드러운 전환 후 대시보드 표시
    setTimeout(() => {
      setShowBootSequence(false);
      setIsTransitioning(false);
      console.log('✅ Dashboard fully loaded and ready');
    }, 500);
  }, []);

  // ✨ 서버 스폰 핸들러 (새로운 전환 시스템용)
  const handleServerSpawned = useCallback((server: Server, index: number) => {
    console.log(`🌐 Server spawned in background: ${server.name} (${index + 1})`);
    setBootProgress(prev => Math.min(prev + 5, 95)); // 점진적 진행률 업데이트
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

  // ✨ URL 파라미터 기반 스킵 조건 확인
  const skipCondition = useMemo(() => {
    if (!isClient) return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const skipAnimation = urlParams.get('skip-animation') === 'true';
    const fastLoad = urlParams.get('fast') === 'true';
    const instantLoad = urlParams.get('instant') === 'true';
    const forceSkip = urlParams.get('force-skip') === 'true';
    
    // 🚨 긴급 수정: prefers-reduced-motion은 제거하고 명시적 스킵만 허용
    console.log('🔍 Skip condition check:', { skipAnimation, fastLoad, instantLoad, forceSkip });
    
    return skipAnimation || fastLoad || instantLoad || forceSkip;
  }, [isClient]);

  // 🔥 부팅 시퀀스 완료 핸들러 (useNaturalLoadingTime 완료 시 호출)
  const handleNaturalLoadingComplete = useCallback(() => {
    console.log('🎯 자연스러운 로딩 완료 - 부팅 시퀀스 종료');
    setShowBootSequence(false);
  }, []);

  // ✨ 자연스러운 로딩 시간 반영 (5초 최소 조건 제거)
  const naturalLoadingState = useMinimumLoadingTime({
    actualLoadingPromise: dataLoadingPromise,
    skipCondition,
    onComplete: handleNaturalLoadingComplete // 🔥 완료 콜백 연결
  });

  // ✨ showBootSequence 조건 개선
  const shouldShowBootSequence = useMemo(() => {
    console.log('🎬 Boot sequence decision:', {
      skipCondition,
      isLoading: naturalLoadingState.isLoading,
      phase: naturalLoadingState.phase,
      progress: naturalLoadingState.progress
    });
    
    // 스킵 조건이 있으면 부팅 시퀀스 숨김
    if (skipCondition) {
      console.log('⚡ Boot sequence skipped due to skip condition');
      return false;
    }
    
    // 🔥 확실한 조건: 로딩 중이면서 아직 완료되지 않은 경우만 표시
    const shouldShow = naturalLoadingState.isLoading && naturalLoadingState.phase !== 'completed';
    console.log('🎯 Boot sequence decision result:', shouldShow);
    
    return shouldShow;
  }, [skipCondition, naturalLoadingState.isLoading, naturalLoadingState.phase, naturalLoadingState.progress]);

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
    if (!isClient || !systemControl.isSystemActive || showBootSequence) return;

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
  }, [isClient, systemControl.isSystemActive, systemControl.recordActivity, showBootSequence]);

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
      showBootSequence: shouldShowBootSequence,
      serversCount: serverGeneration.servers.length,
      systemActive: systemControl.isSystemActive,
      loadingProgress: naturalLoadingState.progress,
      loadingPhase: naturalLoadingState.phase,
      estimatedTimeRemaining: naturalLoadingState.estimatedTimeRemaining
    });
  }, [
    isClient, 
    shouldShowBootSequence, 
    serverGeneration.servers.length, 
    systemControl.isSystemActive,
    naturalLoadingState.progress,
    naturalLoadingState.phase,
    naturalLoadingState.estimatedTimeRemaining
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
    showBootSequence: shouldShowBootSequence,
    bootProgress: naturalLoadingState.progress,
    isTransitioning,
    showSequentialGeneration,
    
    // ✨ 추가된 로딩 상태 정보
    loadingPhase: naturalLoadingState.phase,
    estimatedTimeRemaining: naturalLoadingState.estimatedTimeRemaining,
    elapsedTime: naturalLoadingState.elapsedTime,
    isDataReady: !naturalLoadingState.isLoading && serverGeneration.servers.length > 0,
    
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
    handleBootSequenceComplete,
    handleServerSpawned,
    
    // Animation
    mainContentVariants,
    
    // System control
    systemControl,
    
    // Server generation
    serverGeneration
  };
} 