/**
 * 🎯 Optimized Realtime Hook v1.0
 * 
 * 최적화된 실시간 데이터 훅
 * - 중앙화된 데이터 관리자 사용
 * - 가시성 기반 업데이트
 * - 메모이제이션 적용
 * - 자동 구독/구독해제
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDataManager } from '@/services/realtime/RealtimeDataManager';
import { useIntersectionObserver } from './useIntersectionObserver';

type DataType = 'server' | 'network' | 'system' | 'metrics';
type UpdateFrequency = 'high' | 'medium' | 'low';

interface UseOptimizedRealtimeOptions {
  dataType: DataType;
  frequency?: UpdateFrequency;
  enableVisibilityOptimization?: boolean;
  initialData?: any;
  onUpdate?: (data: any) => void;
}

interface UseOptimizedRealtimeReturn<T = any> {
  data: T;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  forceUpdate: () => void;
  elementRef: React.RefObject<HTMLElement>;
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
  initialData = null,
  onUpdate,
}: UseOptimizedRealtimeOptions): UseOptimizedRealtimeReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const subscriberIdRef = useRef<string>(`${dataType}-${Date.now()}-${Math.random()}`);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 가시성 감지 (옵션)
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    // enabled: enableVisibilityOptimization, // 타입 오류로 주석 처리
  });

  // 데이터 업데이트 콜백
  const handleDataUpdate = useCallback((newData: T) => {
    try {
      setData(newData);
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
      setIsLoading(false);
      setError(null);
      
      // 외부 콜백 호출
      onUpdate?.(newData);
      
      console.log(`📊 데이터 업데이트: ${subscriberIdRef.current}`, newData);
    } catch (err) {
      console.error(`❌ 데이터 업데이트 실패: ${subscriberIdRef.current}`, err);
      setError(err instanceof Error ? err.message : '데이터 업데이트 실패');
    }
  }, [onUpdate]);

  // 강제 업데이트
  const forceUpdate = useCallback(() => {
    console.log(`🔄 강제 업데이트 요청: ${subscriberIdRef.current}`);
    realtimeDataManager.forceUpdate(dataType);
  }, [dataType]);

  // 구독 설정
  useEffect(() => {
    const subscriberId = subscriberIdRef.current;
    
    console.log(`📡 실시간 데이터 구독 시작: ${subscriberId}`);
    
    try {
      // 데이터 관리자에 구독
      const unsubscribe = realtimeDataManager.subscribe(
        subscriberId,
        handleDataUpdate,
        dataType,
        frequency
      );
      
      unsubscribeRef.current = unsubscribe;
      
      console.log(`✅ 구독 완료: ${subscriberId} (${dataType}, ${frequency})`);
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
  }, [dataType, frequency, handleDataUpdate]);

  // 가시성 업데이트
  useEffect(() => {
    if (enableVisibilityOptimization) {
      const subscriberId = subscriberIdRef.current;
      realtimeDataManager.updateVisibility(subscriberId, isVisible);
      
      console.log(`👁️ 가시성 업데이트: ${subscriberId} = ${isVisible}`);
    }
  }, [isVisible, enableVisibilityOptimization]);

  // 통계 정보
  const stats = {
    updateCount,
    subscriberCount: realtimeDataManager.getStats().subscriberCount,
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
export function useServerMetrics(options?: Omit<UseOptimizedRealtimeOptions, 'dataType'>) {
  return useOptimizedRealtime<{
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    timestamp: number;
  }>({
    ...options,
    dataType: 'server',
    frequency: options?.frequency || 'high', // 서버 메트릭은 높은 주기
  });
}

/**
 * 네트워크 메트릭 전용 훅
 */
export function useNetworkMetrics(options?: Omit<UseOptimizedRealtimeOptions, 'dataType'>) {
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
export function useSystemMetrics(options?: Omit<UseOptimizedRealtimeOptions, 'dataType'>) {
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
export function usePerformanceMetrics(options?: Omit<UseOptimizedRealtimeOptions, 'dataType'>) {
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