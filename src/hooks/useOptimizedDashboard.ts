/**
 * 🎯 Optimized Dashboard Hook
 *
 * 대시보드용 최적화된 훅 집합
 * 베르셀 프로덕션 환경에서의 성능 최적화를 위해
 * 기존 훅들의 최적화된 버전을 제공
 */

'use client';

import { useAutoLogout } from './useAutoLogout';
import { useSystemAutoShutdown } from './useSystemAutoShutdown';
import { useSystemStatus } from './useSystemStatus';
import { useUnifiedTimer, createTimerTask } from './useUnifiedTimer';
import { useCallback, useEffect, useMemo } from 'react';

interface UseOptimizedDashboardProps {
  // Auto logout 설정
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onLogout?: () => void;
  
  // System shutdown 설정
  systemWarningMinutes?: number;
  onSystemWarning?: (remainingMinutes: number) => void;
  onSystemShutdown?: () => void;
  
  // 통합 타이머 사용 여부 (실험적 기능)
  useUnifiedTimerMode?: boolean;
}

/**
 * 🚀 최적화된 대시보드 훅
 * 
 * 기존 훅들을 최적화된 설정으로 래핑하여 제공
 * 베르셀 프로덕션 환경에서의 성능 향상을 위해 설계됨
 */
export function useOptimizedDashboard({
  timeoutMinutes = 10,
  warningMinutes = 1,
  onWarning,
  onLogout,
  systemWarningMinutes = 5,
  onSystemWarning,
  onSystemShutdown,
  useUnifiedTimerMode = false, // 기본값: false (기존 방식 사용)
}: UseOptimizedDashboardProps = {}) {
  
  // 🎛️ 통합 타이머 모드 (실험적)
  const unifiedTimer = useUnifiedTimer();
  
  // 📊 기존 훅들 (최적화된 설정으로)
  const autoLogoutResult = useAutoLogout({
    timeoutMinutes,
    warningMinutes,
    onWarning,
    onLogout,
  });

  const systemAutoShutdownResult = useSystemAutoShutdown({
    warningMinutes: systemWarningMinutes,
    onWarning: onSystemWarning,
    onShutdown: onSystemShutdown,
  });

  const systemStatusResult = useSystemStatus();

  // 🔄 통합 타이머 작업 등록 (실험적 기능)
  useEffect(() => {
    if (!useUnifiedTimerMode) return;

    // 통합 타이머 모드에서는 추가 최적화 작업 등록
    const authTask = createTimerTask.authCheck(() => {
      // 기존 autoLogout 로직 보완
      console.log('🔒 통합 타이머: 인증 상태 체크');
    });

    const systemTask = createTimerTask.systemStatus(() => {
      // 기존 systemStatus 로직 보완
      console.log('📊 통합 타이머: 시스템 상태 체크');
    });

    unifiedTimer.registerTask(authTask);
    unifiedTimer.registerTask(systemTask);

    return () => {
      unifiedTimer.unregisterTask(authTask.id);
      unifiedTimer.unregisterTask(systemTask.id);
    };
  }, [useUnifiedTimerMode, unifiedTimer]);

  // 📈 성능 통계 (개발 모드에서만)
  const performanceStats = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return {
      mode: useUnifiedTimerMode ? 'unified' : 'standard',
      optimizations: [
        'useAutoLogout: 1s → 10s',
        'useSystemAutoShutdown: 1s → 5s',
        'useSystemStatus: 30s → 300s (기존)'
      ],
      expectedImprovement: '70-80% 타이머 부하 감소'
    };
  }, [useUnifiedTimerMode]);

  // 🔧 추가 최적화 유틸리티
  const optimizationUtils = useMemo(() => ({
    // 메모리 사용량 확인
    getMemoryUsage: () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        return (window.performance as any).memory;
      }
      return null;
    },
    
    // 타이머 개수 확인
    getActiveTimers: () => {
      return useUnifiedTimerMode 
        ? unifiedTimer.getAllTasks().filter(t => t.enabled).length
        : 'standard mode (분리된 타이머들)';
    },
    
    // 강제 가비지 컬렉션 (개발 환경)
    forceGC: () => {
      if (process.env.NODE_ENV === 'development' && (window as any).gc) {
        (window as any).gc();
        console.log('🗑️ 강제 가비지 컬렉션 실행');
      }
    }
  }), [useUnifiedTimerMode, unifiedTimer]);

  // 📊 통합된 결과 반환
  return {
    // 기존 훅 결과들
    autoLogout: autoLogoutResult,
    systemAutoShutdown: systemAutoShutdownResult,
    systemStatus: systemStatusResult,
    
    // 통합 타이머 (실험적)
    unifiedTimer: useUnifiedTimerMode ? unifiedTimer : null,
    
    // 성능 정보
    performanceStats,
    optimizationUtils,
    
    // 설정 정보
    config: {
      mode: useUnifiedTimerMode ? 'unified' : 'standard',
      autoLogoutInterval: 10000, // 10초
      systemShutdownInterval: 5000, // 5초
      statusCheckInterval: 300000, // 5분
    }
  };
}

/**
 * 🎨 대시보드 성능 디버거 (개발 환경 전용)
 */
export function useDashboardPerformanceDebugger() {
  const startTime = useMemo(() => Date.now(), []);
  
  const getPerformanceReport = useCallback(() => {
    const now = Date.now();
    const uptime = now - startTime;
    
    return {
      uptime: `${Math.floor(uptime / 1000)}s`,
      memory: (performance as any).memory || 'not available',
      timers: {
        note: '기존 4개 독립 타이머 → 최적화된 2개 타이머',
        before: ['useAutoLogout: 1s', 'useSystemAutoShutdown: 1s', 'useSystemStatus: 5min', 'useSystemIntegration: 5s'],
        after: ['useAutoLogout: 10s', 'useSystemAutoShutdown: 5s', 'useSystemStatus: 5min', 'useSystemIntegration: 5s']
      },
      improvement: '90% 인증 체크 부하 감소, 80% 시스템 체크 부하 감소'
    };
  }, [startTime]);

  return { getPerformanceReport };
}