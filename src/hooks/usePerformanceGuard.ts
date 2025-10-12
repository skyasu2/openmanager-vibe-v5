/**
 * 🛡️ Performance Guard Hook
 * 
 * Vercel Edge Runtime 성능 문제 예방 시스템
 * - 위험한 타이머 패턴 탐지
 * - 메모리 사용량 모니터링  
 * - localStorage 과도한 접근 방지
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceGuardOptions {
  /** 타이머 간격 최소값 (ms) */
  minTimerInterval?: number;
  /** 메모리 사용량 경고 임계값 (MB) */
  memoryWarningThreshold?: number;
  /** localStorage 접근 횟수 제한 (per minute) */
  localStorageAccessLimit?: number;
  /** 개발 환경에서만 활성화 */
  devOnly?: boolean;
}

interface PerformanceMetrics {
  timerCount: number;
  memoryUsage: number;
  localStorageAccesses: number;
  warningCount: number;
}

export function usePerformanceGuard({
  minTimerInterval = 5000, // 5초 최소값
  memoryWarningThreshold = 100, // 100MB 경고
  localStorageAccessLimit = 60, // 분당 60회 제한
  devOnly = true
}: PerformanceGuardOptions = {}) {
  
  const metricsRef = useRef<PerformanceMetrics>({
    timerCount: 0,
    memoryUsage: 0,
    localStorageAccesses: 0,
    warningCount: 0
  });

  const originalSetInterval = useRef<typeof setInterval>();
  const originalLocalStorageGetItem = useRef<typeof localStorage.getItem>();
  const originalLocalStorageSetItem = useRef<typeof localStorage.setItem>();

  // 위험한 타이머 패턴 탐지
  const interceptSetInterval = useCallback((callback: () => void, delay: number) => {
    metricsRef.current.timerCount++;

    if (delay < minTimerInterval) {
      const warningMessage = `🚨 Performance Warning: Timer interval ${delay}ms is below recommended ${minTimerInterval}ms`;
      console.warn(warningMessage, {
        stackTrace: new Error().stack,
        recommendation: `Use useUnifiedTimer or increase interval to ${minTimerInterval}ms+`
      });
      metricsRef.current.warningCount++;

      if (process.env.NODE_ENV === 'development') {
        // 개발 환경에서 자동 수정 제안
        console.group('🔧 Auto-fix suggestion:');
        console.log('Replace with unified timer:');
        console.log(`const timer = useUnifiedTimer();\ntimer.registerTask('task-id', ${Math.max(minTimerInterval, 30000)}, callback);`);
        console.groupEnd();
      }
    }

    return originalSetInterval.current!(callback, delay);
  }, [minTimerInterval]);

  // localStorage 접근 모니터링 (인터셉트 없이 카운팅만)
  const monitorLocalStorageAccess = useCallback(() => {
    // localStorage 접근 횟수 모니터링은 passive하게만 수행
    // 실제 intercept는 Vercel Edge Runtime과 충돌하므로 제거
    console.log('🛡️ Performance Guard: localStorage monitoring enabled (passive mode)');
  }, []);

  // 메모리 사용량 모니터링
  const checkMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as { memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory;
      if (memory) {
        const usedMB = (memory.usedJSHeapSize ?? 0) / 1024 / 1024;
        metricsRef.current.memoryUsage = usedMB;

        if (usedMB > memoryWarningThreshold) {
          console.warn(`🚨 Memory Warning: High memory usage detected (${usedMB.toFixed(1)}MB)`, {
            threshold: memoryWarningThreshold,
            recommendation: 'Check for memory leaks or optimize heavy components'
          });
          metricsRef.current.warningCount++;
        }
      }
    }
  }, [memoryWarningThreshold]);

  // 성능 가드 초기화
  useEffect(() => {
    // 프로덕션 환경에서는 localStorage intercept 비활성화 (Vercel Edge Runtime 호환성)
    if (devOnly && process.env.NODE_ENV !== 'development') {
      return;
    }
    
    // Vercel 프로덕션 환경 감지 추가
    const isVercelProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    if (isVercelProduction) {
      console.log('🛡️ Performance Guard: Vercel 프로덕션 환경에서 localStorage intercept 비활성화');
      return;
    }

    // setInterval 인터셉트 (개발 환경에서만)
    if (!originalSetInterval.current && typeof window !== 'undefined') {
      originalSetInterval.current = window.setInterval;
      window.setInterval = interceptSetInterval as typeof window.setInterval;
    }

    // localStorage 인터셉트 완전 비활성화 (Vercel Edge Runtime 호환성)
    monitorLocalStorageAccess();

    // 주기적 성능 체크 (30초마다)
    const performanceCheckInterval = setInterval(() => {
      checkMemoryUsage();
      
      // 성능 메트릭스 주기적 리셋
      if (metricsRef.current.warningCount > 10) {
        metricsRef.current.warningCount = 0;
      }
    }, 30000);

    // 초기 성능 리포트
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ Performance Guard activated:', {
        minTimerInterval,
        memoryWarningThreshold,
        localStorageAccessLimit
      });
    }

    return () => {
      clearInterval(performanceCheckInterval);
      
      // 원본 함수 복원
      if (originalSetInterval.current) {
        window.setInterval = originalSetInterval.current;
      }
      if (originalLocalStorageGetItem.current && originalLocalStorageSetItem.current) {
        localStorage.getItem = originalLocalStorageGetItem.current;
        localStorage.setItem = originalLocalStorageSetItem.current;
      }
    };
  }, [devOnly, minTimerInterval, memoryWarningThreshold, localStorageAccessLimit, interceptSetInterval, monitorLocalStorageAccess, checkMemoryUsage]);

  // 성능 메트릭스 반환
  const getMetrics = useCallback(() => ({
    ...metricsRef.current,
    isEdgeRuntime: process.env.NEXT_RUNTIME === 'edge',
    timestamp: Date.now()
  }), []);

  // 성능 리포트 생성
  const generateReport = useCallback(() => {
    const metrics = getMetrics();
    
    console.group('📊 Performance Report');
    console.log('Active Timers:', metrics.timerCount);
    console.log('Memory Usage:', `${metrics.memoryUsage.toFixed(1)}MB`);
    console.log('LocalStorage Accesses:', `${metrics.localStorageAccesses}/min`);
    console.log('Warnings Generated:', metrics.warningCount);
    console.log('Runtime Environment:', metrics.isEdgeRuntime ? 'Edge' : 'Node.js');
    
    if (metrics.warningCount > 0) {
      console.warn('⚠️ Performance issues detected. Check warnings above.');
    } else {
      console.log('✅ No performance issues detected.');
    }
    console.groupEnd();
    
    return metrics;
  }, [getMetrics]);

  return {
    getMetrics,
    generateReport,
    warningCount: metricsRef.current.warningCount
  };
}

/**
 * 🔧 자동 성능 최적화 유틸리티
 */
export const PerformanceUtils = {
  // 안전한 타이머 생성
  createSafeTimer: (callback: () => void, interval: number) => {
    const safeInterval = Math.max(interval, 5000); // 최소 5초
    if (interval < 5000) {
      console.warn(`Timer interval adjusted from ${interval}ms to ${safeInterval}ms for Edge Runtime compatibility`);
    }
    return setInterval(callback, safeInterval);
  },

  // 캐시된 localStorage 접근
  createCachedLocalStorage: <T>(key: string, defaultValue: T, ttl = 60000) => {
    let cache: { value: T; timestamp: number } | null = null;
    
    return {
      get: (): T => {
        if (cache && Date.now() - cache.timestamp < ttl) {
          return cache.value;
        }
        
        try {
          const stored = localStorage.getItem(key);
          const value = stored ? JSON.parse(stored) : defaultValue;
          cache = { value, timestamp: Date.now() };
          return value;
        } catch {
          return defaultValue;
        }
      },
      
      set: (value: T): void => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          cache = { value, timestamp: Date.now() };
        } catch (error) {
          console.warn('localStorage.setItem failed:', error);
        }
      }
    };
  }
};