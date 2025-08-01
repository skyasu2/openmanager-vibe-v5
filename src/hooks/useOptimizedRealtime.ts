/**
 * 🎯 Optimized Realtime Hook v1.0
 *
 * 최적화된 실시간 데이터 훅
 * - 중앙화된 데이터 관리자 사용
 * - 가시성 기반 업데이트
 * - 메모이제이션 적용
 * - 자동 구독/구독해제
 */

import {
  centralDataManager,
  updateDataVisibility,
} from '@/services/realtime/CentralizedDataManager';
import { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

type DataType = 'servers' | 'network' | 'system' | 'metrics';
type UpdateFrequency = 'high' | 'medium' | 'low';

interface UseOptimizedRealtimeOptions {
  dataType: DataType;
  frequency?: UpdateFrequency;
  enableVisibilityOptimization?: boolean;
  _initialData?: any;
  onUpdate?: (data: any) => void;
  subscriberId?: string;
}

interface UseOptimizedRealtimeReturn<T = any> {
  data: T;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  forceUpdate: () => void;
  elementRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
  stats: {
    updateCount: number;
    subscriberCount: number;
  };
}

export function useOptimizedRealtime<T = any>({
  dataType,
  frequency = 'medium',
  enableVisibilityOptimization = true,
  _initialData = null,
  onUpdate,
  subscriberId: customSubscriberId,
}: UseOptimizedRealtimeOptions): UseOptimizedRealtimeReturn<T> {
  const [data, setData] = useState<T>(_initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  const subscriberIdRef = useRef<string>(
    customSubscriberId || `${dataType}-${Date.now()}-${Math.random()}`
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // onUpdate를 ref로 저장하여 의존성 문제 해결
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // 가시성 감지 (옵션)
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    // enabled: enableVisibilityOptimization, // 타입 오류로 주석 처리
  });

  // 강제 업데이트 (단순 함수 호출이라 useCallback 불필요)
  const forceUpdate = () => {
    console.log(`🔄 강제 업데이트 요청: ${subscriberIdRef.current}`);
    centralDataManager.forceUpdate(dataType);
  };

  // 구독 설정
  useEffect(() => {
    const subscriberId = subscriberIdRef.current;

    console.log(`📡 실시간 데이터 구독 시작: ${subscriberId}`);

    // 데이터 업데이트 핸들러 (useEffect 내부에서 정의하여 의존성 문제 해결)
    const handleDataUpdate = (newData: T) => {
      try {
        setData(newData);
        setLastUpdate(new Date());
        setUpdateCount((prev) => prev + 1);
        setIsLoading(false);
        setError(null);

        // 외부 콜백 호출 (ref 사용)
        onUpdateRef.current?.(newData);

        console.log(`📊 데이터 업데이트: ${subscriberId}`, newData);
      } catch (err) {
        console.error(`❌ 데이터 업데이트 실패: ${subscriberId}`, err);
        setError(err instanceof Error ? err.message : '데이터 업데이트 실패');
      }
    };

    try {
      // 중앙 데이터 관리자에 구독
      const unsubscribe = centralDataManager.subscribe(
        subscriberId,
        handleDataUpdate,
        dataType
      );

      unsubscribeRef.current = unsubscribe;

      console.log(`✅ 구독 완료: ${subscriberId} (${dataType})`);
    } catch (err) {
      console.error(`❌ 구독 실패: ${subscriberId}`, err);
      setError(err instanceof Error ? err.message : '구독 실패');
      setIsLoading(false);
    }

    // 정리 함수
    return () => {
      if (unsubscribeRef.current) {
        console.log(`📡 구독 해제: ${subscriberId}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [dataType, frequency]); // handleDataUpdate 의존성 제거

  // 가시성 업데이트
  useEffect(() => {
    if (enableVisibilityOptimization) {
      const subscriberId = subscriberIdRef.current;
      updateDataVisibility(subscriberId, isVisible);

      console.log(`👁️ 가시성 업데이트: ${subscriberId} = ${isVisible}`);
    }
  }, [isVisible, enableVisibilityOptimization]);

  // 통계 정보
  const stats = {
    updateCount,
    subscriberCount: centralDataManager.getStats().totalSubscribers,
  };

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    forceUpdate,
    elementRef,
    isVisible,
    stats,
  };
}

/**
 * 서버 메트릭 전용 훅
 */
export function useServerMetrics(
  options?: Omit<UseOptimizedRealtimeOptions, 'dataType'> & {
    serverId?: string;
  }
) {
  // ✅ 서버별 고유 구독 ID 생성 (중복 구독 방지)
  const serverId = options?.serverId || 'default';
  const subscriberId = `server-metrics-${serverId}`;

  return useOptimizedRealtime<{
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    timestamp: number;
  }>({
    ...options,
    dataType: 'servers',
    frequency: options?.frequency || 'high', // 서버 메트릭은 높은 주기
    subscriberId, // ✅ 고유 구독 ID 전달
  });
}

/**
 * 네트워크 메트릭 전용 훅
 */
export function useNetworkMetrics(
  options?: Omit<UseOptimizedRealtimeOptions, 'dataType'>
) {
  return useOptimizedRealtime<{
    bandwidth: number;
    latency: number;
    downloadSpeed: number;
    uploadSpeed: number;
    ip: string;
    timestamp: number;
  }>({
    ...options,
    dataType: 'network',
    frequency: options?.frequency || 'low', // 네트워크는 낮은 주기 (IP는 자주 안 바뀜)
  });
}

/**
 * 시스템 메트릭 전용 훅
 */
export function useSystemMetrics(
  options?: Omit<UseOptimizedRealtimeOptions, 'dataType'>
) {
  return useOptimizedRealtime<{
    uptime: string;
    processes: number;
    connections: number;
    timestamp: number;
  }>({
    ...options,
    dataType: 'system',
    frequency: options?.frequency || 'medium',
  });
}

/**
 * 성능 메트릭 전용 훅
 */
export function usePerformanceMetrics(
  options?: Omit<UseOptimizedRealtimeOptions, 'dataType'>
) {
  return useOptimizedRealtime<{
    responseTime: number;
    throughput: number;
    errorRate: number;
    timestamp: number;
  }>({
    ...options,
    dataType: 'metrics',
    frequency: options?.frequency || 'medium',
  });
}
