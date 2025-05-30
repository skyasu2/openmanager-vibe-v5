'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemControl } from './useSystemControl';
import { useSequentialServerGeneration } from './useSequentialServerGeneration';

/**
 * 서버 통계 인터페이스
 */
interface ServerStats {
  /** 전체 서버 수 */
  total: number;
  /** 온라인 서버 수 */
  online: number;
  /** 경고 상태 서버 수 */
  warning: number;
  /** 오프라인 서버 수 */
  offline: number;
}

/**
 * 대시보드 페이지의 모든 비즈니스 로직을 관리하는 커스텀 훅
 * 
 * @description
 * 이 훅은 대시보드 페이지의 복잡한 상태 관리와 비즈니스 로직을 캡슐화합니다.
 * 
 * **주요 기능:**
 * - 상태 관리 (UI 상태, 서버 선택, 통계 등)
 * - 시스템 제어 (시작/중지/일시정지)
 * - AI 에이전트 제어
 * - 반응형 레이아웃 처리
 * - 사용자 활동 추적
 * - 애니메이션 제어
 * 
 * **최적화된 기능:**
 * - React.memo와 useCallback을 통한 불필요한 리렌더링 방지
 * - 디바운스를 적용한 사용자 활동 추적
 * - 반응형 애니메이션 변수 최적화
 * 
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const {
 *     isAgentOpen,
 *     serverStats,
 *     toggleAgent,
 *     handleNavigateHome,
 *     systemControl
 *   } = useDashboardLogic();
 * 
 *   return (
 *     <div>
 *       <Header onToggle={toggleAgent} stats={serverStats} />
 *       // ... 기타 컴포넌트
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {Object} 대시보드 관련 상태와 핸들러들
 * 
 * @since 5.11.0
 * @author OpenManager Team
 */
export function useDashboardLogic() {
  // State management
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any | null>(null);
  const [serverStats, setServerStats] = useState<ServerStats>({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0
  });
  const [showEntrance, setShowEntrance] = useState(true);
  const [showSequentialGeneration, setShowSequentialGeneration] = useState(false);

  // System control hook
  const systemControl = useSystemControl();

  // Sequential server generation hook
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

  // Animation variants for main content
  const mainContentVariants = useMemo(() => ({
    normal: {
      transform: 'translateX(0px)',
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 400,
        duration: 0.4
      }
    },
    pushed: {
      transform: isMobile 
        ? 'translateX(0px)' // 모바일에서는 밀지 않음
        : isTablet 
          ? 'translateX(-210px)' // 태블릿: 절반만 밀기
          : 'translateX(-300px)', // 데스크탑: 300px 밀기
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 400,
        duration: 0.4
      }
    }
  }), [isMobile, isTablet]);

  /**
   * 서버 통계를 업데이트하는 함수
   * @param stats - 서버 통계 객체
   */
  const updateServerStats = useCallback((stats: ServerStats) => {
    setServerStats(stats);
  }, []);

  /**
   * 서버 클릭 핸들러
   * @param server - 클릭된 서버 객체
   */
  const handleServerClick = useCallback((server: any) => {
    console.log('🖱️ 서버 카드 클릭:', server.hostname);
    systemControl.recordActivity();
    
    // 서버 데이터를 Server 타입에 맞게 변환
    const formattedServer = {
      id: server.id,
      name: server.name || server.hostname,
      status: server.status,
      cpu: server.cpu,
      memory: server.memory,
      disk: server.disk,
      uptime: server.uptime,
      location: server.location,
      alerts: server.alerts || 0,
      ip: server.ip,
      os: server.os,
      lastUpdate: server.lastUpdate || new Date(),
      services: server.services || []
    };
    
    setSelectedServer(formattedServer);
  }, [systemControl.recordActivity]);

  /**
   * AI 에이전트 닫기 핸들러
   */
  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
    systemControl.recordActivity();
  }, [systemControl.recordActivity]);

  /**
   * AI 에이전트 토글 핸들러
   */
  const toggleAgent = useCallback(() => {
    if (isAgentOpen) {
      closeAgent();
    } else {
      setIsAgentOpen(true);
      systemControl.recordActivity();
    }
  }, [isAgentOpen, closeAgent, systemControl.recordActivity]);

  /**
   * 홈 페이지로 네비게이션 핸들러
   */
  const handleNavigateHome = useCallback(() => {
    console.log('🏠 OpenManager 버튼 클릭 - 랜딩페이지로 이동');
    systemControl.recordActivity();
    window.location.href = '/';
  }, [systemControl.recordActivity]);

  /**
   * 시스템 중지 핸들러
   */
  const handleSystemStop = useCallback(async () => {
    const sessionType = systemControl.isUserSession ? '사용자 세션' : 'AI 세션';
    
    if (!confirm(`${sessionType}을 중지하시겠습니까?\n\n• 모든 서버 모니터링이 중단됩니다\n• AI 에이전트가 비활성화됩니다\n• 랜딩페이지로 이동합니다`)) {
      return;
    }

    try {
      const result = await systemControl.stopFullSystem();
      
      if (result.success) {
        console.log('✅ 시스템 중지 완료:', result.message);
        
        if (result.errors.length > 0) {
          alert(`${result.message}\n\n경고 사항:\n${result.errors.join('\n')}\n\n랜딩페이지로 이동합니다.`);
        } else {
          alert(`${result.message}\n\n랜딩페이지로 이동합니다.`);
        }
        
        window.location.href = '/';
      } else {
        console.warn('⚠️ 시스템 중지 중 오류:', result.errors);
        alert(`${result.message}\n\n오류 내용:\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('❌ 시스템 중지 실패:', error);
      alert('시스템 중지 중 오류가 발생했습니다.\n다시 시도해주세요.');
    }
  }, [systemControl]);

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

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Entrance animation timer
  useEffect(() => {
    if (isClient && showEntrance) {
      const timer = setTimeout(() => {
        setShowEntrance(false);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [isClient, showEntrance]);

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
    if (!isClient || !systemControl.isSystemActive || showEntrance) return;

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
  }, [isClient, systemControl.isSystemActive, systemControl.recordActivity, showEntrance]);

  return {
    // State
    isAgentOpen,
    isClient,
    isMobile,
    isTablet,
    selectedServer,
    serverStats,
    showEntrance,
    showSequentialGeneration,
    
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
    
    // Animation
    mainContentVariants,
    
    // System control
    systemControl,
    
    // Server generation
    serverGeneration
  };
} 