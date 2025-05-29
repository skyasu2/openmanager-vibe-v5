/**
 * 🔄 백그라운드 자동 갱신: Background Refetch
 * 
 * Phase 7.3: 실시간 데이터 통합
 * - 백그라운드 자동 데이터 갱신
 * - 조건부 리프레시 로직
 * - 성능 최적화된 갱신 스케줄
 * - 사용자 활성도 기반 갱신
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { serverKeys } from './useServerQueries';
import { predictionKeys } from './usePredictionQueries';
import { systemKeys } from './useSystemQueries';

// 🕰️ 갱신 간격 상수
const REFRESH_INTERVALS = {
  CRITICAL: 5000,    // 5초 - 중요한 데이터
  HIGH: 15000,       // 15초 - 높은 우선순위
  MEDIUM: 30000,     // 30초 - 보통 우선순위
  LOW: 60000,        // 1분 - 낮은 우선순위
  INACTIVE: 300000,  // 5분 - 비활성 상태
} as const;

// 📊 갱신 설정 타입
interface RefreshConfig {
  enabled?: boolean;
  interval?: number;
  condition?: () => boolean;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  activeOnly?: boolean;
}

// 👤 사용자 활성도 감지
export const useUserActivity = () => {
  const lastActivityRef = useRef(Date.now());
  const isActiveRef = useRef(true);

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      isActiveRef.current = true;
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // 5분 이상 비활성 시 비활성 상태로 전환
    const inactivityCheck = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      isActiveRef.current = timeSinceLastActivity < 300000; // 5분
    }, 60000); // 1분마다 체크

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(inactivityCheck);
    };
  }, []);

  return {
    isActive: isActiveRef.current,
    lastActivity: lastActivityRef.current,
  };
};

// 🔄 서버 데이터 백그라운드 갱신
export const useServerBackgroundRefresh = (config: RefreshConfig = {}) => {
  const queryClient = useQueryClient();
  const { isActive } = useUserActivity();
  
  const {
    enabled = true,
    interval = REFRESH_INTERVALS.HIGH,
    condition,
    priority = 'high',
    activeOnly = true,
  } = config;

  const refreshServers = useCallback(async () => {
    // 조건 체크
    if (!enabled) return;
    if (activeOnly && !isActive) return;
    if (condition && !condition()) return;

    try {
      // 서버 목록 갱신
      await queryClient.invalidateQueries({
        queryKey: serverKeys.lists(),
        refetchType: 'active',
      });

      // 현재 활성화된 서버 상세 정보 갱신
      const serverQueries = queryClient.getQueryCache().getAll()
        .filter(query => 
          query.queryKey[0] === 'servers' && 
          query.queryKey[1] === 'detail' &&
          query.state.status === 'success'
        );

      for (const query of serverQueries) {
        const serverId = query.queryKey[2] as string;
        await queryClient.invalidateQueries({
          queryKey: serverKeys.detail(serverId),
          refetchType: 'active',
        });
      }

      console.log('🔄 서버 데이터 백그라운드 갱신 완료');
    } catch (error) {
      console.error('❌ 서버 백그라운드 갱신 실패:', error);
    }
  }, [queryClient, enabled, isActive, condition, activeOnly]);

  useEffect(() => {
    if (!enabled) return;

    const actualInterval = isActive ? interval : REFRESH_INTERVALS.INACTIVE;
    const intervalId = setInterval(refreshServers, actualInterval);

    return () => clearInterval(intervalId);
  }, [enabled, interval, isActive, refreshServers]);

  return { refreshServers };
};

// 🔮 AI 예측 백그라운드 갱신
export const usePredictionBackgroundRefresh = (config: RefreshConfig = {}) => {
  const queryClient = useQueryClient();
  const { isActive } = useUserActivity();
  
  const {
    enabled = true,
    interval = REFRESH_INTERVALS.MEDIUM,
    condition,
    activeOnly = true,
  } = config;

  const refreshPredictions = useCallback(async () => {
    if (!enabled) return;
    if (activeOnly && !isActive) return;
    if (condition && !condition()) return;

    try {
      // 예측 목록 갱신
      await queryClient.invalidateQueries({
        queryKey: predictionKeys.list('{}'),
        refetchType: 'active',
      });

      // 예측 분석 데이터 갱신
      await queryClient.invalidateQueries({
        queryKey: predictionKeys.analytics('{}'),
        refetchType: 'active',
      });

      console.log('🔮 AI 예측 데이터 백그라운드 갱신 완료');
    } catch (error) {
      console.error('❌ 예측 백그라운드 갱신 실패:', error);
    }
  }, [queryClient, enabled, isActive, condition, activeOnly]);

  useEffect(() => {
    if (!enabled) return;

    const actualInterval = isActive ? interval : REFRESH_INTERVALS.INACTIVE;
    const intervalId = setInterval(refreshPredictions, actualInterval);

    return () => clearInterval(intervalId);
  }, [enabled, interval, isActive, refreshPredictions]);

  return { refreshPredictions };
};

// 🏥 시스템 헬스 백그라운드 갱신
export const useSystemHealthBackgroundRefresh = (config: RefreshConfig = {}) => {
  const queryClient = useQueryClient();
  const { isActive } = useUserActivity();
  
  const {
    enabled = true,
    interval = REFRESH_INTERVALS.CRITICAL,
    condition,
    activeOnly = false, // 시스템 헬스는 항상 모니터링
  } = config;

  const refreshHealth = useCallback(async () => {
    if (!enabled) return;
    if (activeOnly && !isActive) return;
    if (condition && !condition()) return;

    try {
      // 시스템 헬스 갱신
      await queryClient.invalidateQueries({
        queryKey: systemKeys.health(),
        refetchType: 'active',
      });

      // 시스템 메트릭 갱신 (인수 없이 호출)
      await queryClient.invalidateQueries({
        queryKey: systemKeys.metrics(),
        refetchType: 'active',
      });

      console.log('🏥 시스템 헬스 백그라운드 갱신 완료');
    } catch (error) {
      console.error('❌ 시스템 헬스 백그라운드 갱신 실패:', error);
    }
  }, [queryClient, enabled, isActive, condition, activeOnly]);

  useEffect(() => {
    if (!enabled) return;

    const actualInterval = isActive ? interval : REFRESH_INTERVALS.LOW;
    const intervalId = setInterval(refreshHealth, actualInterval);

    return () => clearInterval(intervalId);
  }, [enabled, interval, isActive, refreshHealth]);

  return { refreshHealth };
};

// 🎯 통합 백그라운드 갱신 관리
export const useBackgroundRefreshManager = (options: {
  servers?: RefreshConfig;
  predictions?: RefreshConfig;
  health?: RefreshConfig;
  globalEnabled?: boolean;
} = {}) => {
  const { 
    servers = {},
    predictions = {},
    health = {},
    globalEnabled = true,
  } = options;

  const serverRefresh = useServerBackgroundRefresh({
    ...servers,
    enabled: globalEnabled && (servers.enabled !== false),
  });

  const predictionRefresh = usePredictionBackgroundRefresh({
    ...predictions,
    enabled: globalEnabled && (predictions.enabled !== false),
  });

  const healthRefresh = useSystemHealthBackgroundRefresh({
    ...health,
    enabled: globalEnabled && (health.enabled !== false),
  });

  // 🔄 모든 데이터 수동 갱신
  const refreshAll = useCallback(async () => {
    await Promise.all([
      serverRefresh.refreshServers(),
      predictionRefresh.refreshPredictions(),
      healthRefresh.refreshHealth(),
    ]);
  }, [serverRefresh, predictionRefresh, healthRefresh]);

  return {
    refreshAll,
    servers: serverRefresh,
    predictions: predictionRefresh,
    health: healthRefresh,
  };
};

// 📊 네트워크 상태 기반 갱신 최적화
export const useNetworkOptimizedRefresh = () => {
  const { isActive } = useUserActivity();

  // 네트워크 상태 감지
  const getNetworkStatus = useCallback(() => {
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        saveData: connection?.saveData || false,
      };
    }
    return { effectiveType: 'unknown', downlink: 0, saveData: false };
  }, []);

  // 네트워크 상태에 따른 갱신 간격 조정
  const getOptimizedInterval = useCallback((baseInterval: number) => {
    const network = getNetworkStatus();
    
    // 데이터 절약 모드 또는 느린 네트워크
    if (network.saveData || network.effectiveType === 'slow-2g') {
      return baseInterval * 3; // 3배 느리게
    }
    
    // 빠른 네트워크
    if (network.effectiveType === '4g' && network.downlink > 5) {
      return baseInterval * 0.8; // 20% 빠르게
    }
    
    // 비활성 상태
    if (!isActive) {
      return baseInterval * 5; // 5배 느리게
    }
    
    return baseInterval;
  }, [getNetworkStatus, isActive]);

  return { getOptimizedInterval, getNetworkStatus };
};

// 🔔 조건부 갱신 헬퍼
export const createRefreshCondition = {
  // 페이지 가시성 기반
  whenPageVisible: () => () => !document.hidden,
  
  // 특정 라우트에서만
  onRoute: (routes: string[]) => () => 
    routes.some(route => window.location.pathname.includes(route)),
  
  // 에러 상태일 때만
  onError: (queryKey: any[]) => {
    return () => {
      const queryClient = useQueryClient();
      const query = queryClient.getQueryCache().find({ queryKey });
      return query?.state.status === 'error';
    };
  },
  
  // 데이터가 오래된 경우에만
  whenStale: (queryKey: any[], staleTime: number = 300000) => {
    return () => {
      const queryClient = useQueryClient();
      const query = queryClient.getQueryCache().find({ queryKey });
      if (!query) return true;
      
      const dataAge = Date.now() - query.state.dataUpdatedAt;
      return dataAge > staleTime;
    };
  },
  
  // 여러 조건 조합
  combine: (...conditions: (() => boolean)[]) => () =>
    conditions.every(condition => condition()),
}; 