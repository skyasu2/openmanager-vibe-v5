/**
 * 🚀 Performance Observer API - Phase 2 실시간 성능 모니터링
 * 
 * Core Web Vitals 실시간 수집 및 Box-Muller 캐시 성능 추적
 * - LCP (Largest Contentful Paint) 라이브 모니터링
 * - FID (First Input Delay) 실시간 측정
 * - CLS (Cumulative Layout Shift) 지속적 추적
 * - Box-Muller Transform 캐시 히트율 실시간 분석
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getBoxMullerCacheStats } from '@/utils/box-muller-lru-cache';

// 🎯 Core Web Vitals 메트릭 타입 정의
export interface CoreWebVitals {
  lcp: number | null;           // Largest Contentful Paint (ms)
  fid: number | null;           // First Input Delay (ms)
  cls: number | null;           // Cumulative Layout Shift (score)
  fcp: number | null;           // First Contentful Paint (ms)
  ttfb: number | null;          // Time to First Byte (ms)
}

// 📊 Box-Muller 캐시 성능 메트릭
export interface BoxMullerPerformance {
  hitRate: number;              // 캐시 히트율 (%)
  totalRequests: number;        // 총 요청 수
  memoryUsage: string;          // 메모리 사용량 (KB)
  lastUpdated: number;          // 마지막 업데이트 시간 (timestamp)
}

// 🔍 통합 성능 메트릭
export interface PerformanceMetrics {
  coreWebVitals: CoreWebVitals;
  boxMullerCache: BoxMullerPerformance;
  isSupported: boolean;         // Performance Observer 지원 여부
  isCollecting: boolean;        // 데이터 수집 중 여부
  lastCollected: number;        // 마지막 수집 시간
}

/**
 * 🎯 Performance Observer 훅
 * 
 * 실시간 성능 메트릭을 수집하고 Box-Muller 캐시 성능을 추적합니다.
 */
export function usePerformanceObserver() {
  // 🔄 상태 관리
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    coreWebVitals: {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
    },
    boxMullerCache: {
      hitRate: 0,
      totalRequests: 0,
      memoryUsage: '0 KB',
      lastUpdated: 0,
    },
    isSupported: false,
    isCollecting: false,
    lastCollected: 0,
  });

  // 📝 Observer 참조 관리
  const observerRef = useRef<PerformanceObserver | null>(null);
  const clsValueRef = useRef<number>(0);
  const isCollectingRef = useRef<boolean>(false);

  // 🔍 Performance Observer 지원 확인
  const checkSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return 'PerformanceObserver' in window && 'PerformanceEntry' in window;
  }, []);

  // 📊 Box-Muller 캐시 성능 업데이트
  const updateBoxMullerMetrics = useCallback(() => {
    try {
      const cacheStats = getBoxMullerCacheStats();
      const newBoxMullerMetrics: BoxMullerPerformance = {
        hitRate: cacheStats.hitRate,
        totalRequests: cacheStats.totalRequests,
        memoryUsage: cacheStats.memoryUsage,
        lastUpdated: Date.now(),
      };

      setMetrics(prev => ({
        ...prev,
        boxMullerCache: newBoxMullerMetrics,
      }));
    } catch (error) {
      console.warn('[usePerformanceObserver] Box-Muller 메트릭 수집 실패:', error);
    }
  }, []);

  // 🎯 Core Web Vitals 메트릭 처리
  const handlePerformanceEntry = useCallback((entry: PerformanceEntry) => {
    const now = Date.now();
    
    setMetrics(prev => {
      const newCoreWebVitals = { ...prev.coreWebVitals };
      
      // 📈 LCP (Largest Contentful Paint)
      if (entry.entryType === 'largest-contentful-paint') {
        newCoreWebVitals.lcp = Math.round(entry.startTime);
      }
      
      // ⚡ FCP (First Contentful Paint)  
      else if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
        newCoreWebVitals.fcp = Math.round(entry.startTime);
      }
      
      // 🌊 CLS (Cumulative Layout Shift)
      else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
        clsValueRef.current += (entry as any).value;
        newCoreWebVitals.cls = Math.round(clsValueRef.current * 1000) / 1000;
      }
      
      // 🚀 Navigation (TTFB)
      else if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        newCoreWebVitals.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
      }

      return {
        ...prev,
        coreWebVitals: newCoreWebVitals,
        lastCollected: now,
      };
    });
  }, []);

  // 🔧 FID (First Input Delay) 이벤트 리스너
  const handleFirstInput = useCallback((event: Event) => {
    const entry = (event as any).processingStart - (event as any).timeStamp;
    if (entry > 0) {
      setMetrics(prev => ({
        ...prev,
        coreWebVitals: {
          ...prev.coreWebVitals,
          fid: Math.round(entry),
        },
        lastCollected: Date.now(),
      }));
    }
  }, []);

  // 🚀 Performance Observer 시작
  const startObserving = useCallback(() => {
    if (!checkSupport() || isCollectingRef.current) return;
    
    try {
      // 🔍 기존 Observer 정리
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // 📊 새 Observer 생성
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(handlePerformanceEntry);
      });

      // 👀 관찰할 타입 지정
      const observeTypes = [
        'largest-contentful-paint',
        'layout-shift', 
        'paint',
        'navigation'
      ];

      observeTypes.forEach(type => {
        try {
          observer.observe({ 
            entryTypes: [type],
            buffered: true  // 기존 항목도 포함
          });
        } catch (error) {
          console.warn(`[usePerformanceObserver] ${type} 관찰 실패:`, error);
        }
      });

      observerRef.current = observer;
      isCollectingRef.current = true;

      // 🎯 FID 이벤트 리스너 추가
      if (typeof window !== 'undefined') {
        window.addEventListener('pointerdown', handleFirstInput, { once: true });
        window.addEventListener('mousedown', handleFirstInput, { once: true });
        window.addEventListener('keydown', handleFirstInput, { once: true });
        window.addEventListener('touchstart', handleFirstInput, { once: true });
      }

      setMetrics(prev => ({ 
        ...prev, 
        isSupported: true,
        isCollecting: true 
      }));

      console.log('🚀 [usePerformanceObserver] 실시간 성능 모니터링 시작');
      
    } catch (error) {
      console.error('[usePerformanceObserver] Observer 시작 실패:', error);
    }
  }, [checkSupport, handlePerformanceEntry, handleFirstInput]);

  // 🛑 Performance Observer 중지
  const stopObserving = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    isCollectingRef.current = false;
    
    setMetrics(prev => ({ ...prev, isCollecting: false }));
    
    console.log('🛑 [usePerformanceObserver] 실시간 성능 모니터링 중지');
  }, []);

  // 🔄 메트릭 초기화
  const resetMetrics = useCallback(() => {
    clsValueRef.current = 0;
    setMetrics(prev => ({
      ...prev,
      coreWebVitals: {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
      },
      lastCollected: 0,
    }));
    
    console.log('🔄 [usePerformanceObserver] 메트릭 초기화');
  }, []);

  // 🚀 컴포넌트 마운트 시 자동 시작
  useEffect(() => {
    startObserving();
    
    // 📊 Box-Muller 캐시 성능 정기 업데이트 (5초마다)
    const cacheUpdateInterval = setInterval(updateBoxMullerMetrics, 5000);
    updateBoxMullerMetrics(); // 즉시 한 번 실행

    // 🧹 정리 함수
    return () => {
      stopObserving();
      clearInterval(cacheUpdateInterval);
    };
  }, []); // 빈 의존성 배열 - 컴포넌트 마운트 시에만 실행

  // 📊 성능 등급 계산 (A+ ~ F)
  const getPerformanceGrade = useCallback(() => {
    const { lcp, cls, fcp } = metrics.coreWebVitals;
    
    let score = 0;
    let factors = 0;
    
    // LCP 점수 (2.5초 이하 = 100점)
    if (lcp !== null) {
      score += lcp <= 2500 ? 100 : Math.max(0, 100 - ((lcp - 2500) / 100));
      factors++;
    }
    
    // CLS 점수 (0.1 이하 = 100점)
    if (cls !== null) {
      score += cls <= 0.1 ? 100 : Math.max(0, 100 - (cls * 1000));
      factors++;
    }
    
    // FCP 점수 (1.8초 이하 = 100점)
    if (fcp !== null) {
      score += fcp <= 1800 ? 100 : Math.max(0, 100 - ((fcp - 1800) / 50));
      factors++;
    }
    
    if (factors === 0) return 'N/A';
    
    const avgScore = score / factors;
    
    if (avgScore >= 90) return 'A+';
    if (avgScore >= 80) return 'A';
    if (avgScore >= 70) return 'B';
    if (avgScore >= 60) return 'C';
    if (avgScore >= 50) return 'D';
    return 'F';
  }, [metrics.coreWebVitals]);

  return {
    // 📊 데이터
    metrics,
    performanceGrade: getPerformanceGrade(),
    
    // 🎛️ 제어 함수
    startObserving,
    stopObserving,
    resetMetrics,
    updateBoxMullerMetrics,
    
    // 🔍 유틸리티
    isSupported: checkSupport(),
  };
}