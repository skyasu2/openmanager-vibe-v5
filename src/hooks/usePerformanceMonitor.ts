'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  // API 성능
  apiResponseTime: number;
  apiSuccessRate: number;
  activeRequests: number;
  
  // 메모리 및 CPU
  memoryUsage: number;
  cpuUsage: number;
  
  // 사용자 경험
  pageLoadTime: number;
  renderTime: number;
  interactionDelay: number;
  
  // 에러 및 복구
  errorRate: number;
  recoveryTime: number;
  uptime: number;
  
  // AI 엔진 성능
  aiEngineStatus: 'healthy' | 'degraded' | 'offline';
  aiResponseTime: number;
  aiSuccessRate: number;
  
  timestamp: number;
}

export interface PerformanceStats {
  current: PerformanceMetrics;
  history: PerformanceMetrics[];
  trends: {
    apiResponseTime: 'improving' | 'stable' | 'degrading';
    errorRate: 'improving' | 'stable' | 'degrading';
    memoryUsage: 'improving' | 'stable' | 'degrading';
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: number;
  }>;
}

export function usePerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    current: {
      apiResponseTime: 0,
      apiSuccessRate: 100,
      activeRequests: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      pageLoadTime: 0,
      renderTime: 0,
      interactionDelay: 0,
      errorRate: 0,
      recoveryTime: 0,
      uptime: 100,
      aiEngineStatus: 'healthy',
      aiResponseTime: 0,
      aiSuccessRate: 100,
      timestamp: Date.now()
    },
    history: [],
    trends: {
      apiResponseTime: 'stable',
      errorRate: 'stable',
      memoryUsage: 'stable'
    },
    alerts: []
  });

  const [isCollecting, setIsCollecting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const requestStartTimes = useRef<Map<string, number>>(new Map());
  const errorCount = useRef(0);
  const totalRequests = useRef(0);
  const startTime = useRef(Date.now());

  // 🎯 트렌드 비교 함수
  const compareTrend = useCallback((recent: number, older: number): 'improving' | 'stable' | 'degrading' => {
    if (older === 0) return 'stable';
    const change = ((recent - older) / older) * 100;
    if (change > 5) return 'degrading';
    if (change < -5) return 'improving';
    return 'stable';
  }, []);

  // 🎯 API 요청 추적 시작
  const trackAPIRequest = useCallback((requestId: string) => {
    requestStartTimes.current.set(requestId, Date.now());
    totalRequests.current += 1;
    
    // 활성 요청 수 업데이트
    setStats(prev => ({
      ...prev,
      current: {
        ...prev.current,
        activeRequests: requestStartTimes.current.size
      }
    }));
  }, []);

  // 🎯 API 요청 완료 추적
  const trackAPIResponse = useCallback((requestId: string, success: boolean = true) => {
    const startTime = requestStartTimes.current.get(requestId);
    if (startTime) {
      const responseTime = Date.now() - startTime;
      requestStartTimes.current.delete(requestId);
      
      if (!success) {
        errorCount.current += 1;
      }
      
      // 성능 지표 업데이트
      setStats(prev => {
        const successRate = totalRequests.current > 0 
          ? ((totalRequests.current - errorCount.current) / totalRequests.current) * 100 
          : 100;
        
        const errorRate = totalRequests.current > 0 
          ? (errorCount.current / totalRequests.current) * 100 
          : 0;
        
        return {
          ...prev,
          current: {
            ...prev.current,
            apiResponseTime: responseTime,
            apiSuccessRate: Math.round(successRate * 10) / 10,
            errorRate: Math.round(errorRate * 10) / 10,
            activeRequests: requestStartTimes.current.size,
            timestamp: Date.now()
          }
        };
      });
    }
  }, []);

  // 🧠 메모리 및 성능 지표 수집
  const collectSystemMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    const metrics: Partial<PerformanceMetrics> = {};

    // 메모리 사용량 (브라우저 지원 시)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
    }

    // 페이지 로딩 성능
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.pageLoadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
      metrics.renderTime = Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
    }

    // CPU 사용량 추정 (프레임률 기반)
    let cpuUsage = 0;
    const frameStart = performance.now();
    requestAnimationFrame(() => {
      const frameTime = performance.now() - frameStart;
      cpuUsage = Math.min(100, Math.round((frameTime / 16.67) * 100)); // 60fps 기준
      
      setStats(prev => ({
        ...prev,
        current: {
          ...prev.current,
          ...metrics,
          cpuUsage,
          uptime: Math.round((Date.now() - startTime.current) / 1000),
          timestamp: Date.now()
        }
      }));
    });
  }, []);

  // 📊 AI 엔진 상태 확인
  const checkAIEngineStatus = useCallback(async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/ai-agent/integrated', {
        method: 'GET'
      });
      
      const responseTime = Date.now() - startTime;
      const success = response.ok;
      
      setStats(prev => ({
        ...prev,
        current: {
          ...prev.current,
          aiEngineStatus: success ? 'healthy' : 'degraded',
          aiResponseTime: responseTime,
          aiSuccessRate: success ? 100 : 0,
          timestamp: Date.now()
        }
      }));
      
    } catch (error) {
      setStats(prev => ({
        ...prev,
        current: {
          ...prev.current,
          aiEngineStatus: 'offline',
          aiResponseTime: 5000,
          aiSuccessRate: 0,
          timestamp: Date.now()
        }
      }));
    }
  }, []);

  // 📈 트렌드 분석
  const analyzeTrends = useCallback((currentMetrics: PerformanceMetrics, history: PerformanceMetrics[]) => {
    if (history.length < 5) return { apiResponseTime: 'stable', errorRate: 'stable', memoryUsage: 'stable' } as const;

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const trends = {
      apiResponseTime: compareTrend(
        recent.reduce((sum, m) => sum + m.apiResponseTime, 0) / recent.length,
        older.reduce((sum, m) => sum + m.apiResponseTime, 0) / older.length
      ),
      errorRate: compareTrend(
        recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length,
        older.reduce((sum, m) => sum + m.errorRate, 0) / older.length
      ),
      memoryUsage: compareTrend(
        recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
        older.reduce((sum, m) => sum + m.memoryUsage, 0) / older.length
      )
    };

    return trends;
  }, [compareTrend]);

  // 🚨 알림 생성
  const generateAlerts = useCallback((metrics: PerformanceMetrics) => {
    const alerts: Array<{ type: 'warning' | 'error' | 'info'; message: string; timestamp: number }> = [];

    if (metrics.apiResponseTime > 2000) {
      alerts.push({
        type: 'warning',
        message: `API 응답 시간이 느립니다 (${metrics.apiResponseTime}ms)`,
        timestamp: Date.now()
      });
    }

    if (metrics.errorRate > 10) {
      alerts.push({
        type: 'error',
        message: `에러율이 높습니다 (${metrics.errorRate}%)`,
        timestamp: Date.now()
      });
    }

    if (metrics.memoryUsage > 90) {
      alerts.push({
        type: 'warning',
        message: `메모리 사용량이 높습니다 (${metrics.memoryUsage}%)`,
        timestamp: Date.now()
      });
    }

    if (metrics.aiEngineStatus === 'offline') {
      alerts.push({
        type: 'error',
        message: 'AI 엔진이 오프라인 상태입니다',
        timestamp: Date.now()
      });
    }

    return alerts;
  }, []);

  // 🔄 성능 데이터 수집 시작
  const startMonitoring = useCallback(() => {
    if (isCollecting) return;
    
    setIsCollecting(true);
    console.log('📊 성능 모니터링 시작');

    // 즉시 한 번 수집
    collectSystemMetrics();
    checkAIEngineStatus();

    // 주기적 수집 (5초마다)
    intervalRef.current = setInterval(() => {
      collectSystemMetrics();
      
      setStats(prev => {
        const newHistory = [...prev.history, prev.current].slice(-100); // 최대 100개 유지
        const trends = analyzeTrends(prev.current, newHistory);
        const alerts = generateAlerts(prev.current);

        return {
          ...prev,
          history: newHistory,
          trends,
          alerts: [...prev.alerts, ...alerts].slice(-50) // 최대 50개 알림 유지
        };
      });
    }, 5000);

    // AI 엔진 상태는 30초마다 확인
    const aiCheckInterval = setInterval(checkAIEngineStatus, 30000);

    return () => {
      clearInterval(aiCheckInterval);
    };
  }, [isCollecting, collectSystemMetrics, checkAIEngineStatus, analyzeTrends, generateAlerts]);

  // 🛑 모니터링 중지
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsCollecting(false);
    console.log('📊 성능 모니터링 중지');
  }, []);

  // 🧹 데이터 초기화
  const resetStats = useCallback(() => {
    errorCount.current = 0;
    totalRequests.current = 0;
    startTime.current = Date.now();
    requestStartTimes.current.clear();
    
    setStats({
      current: {
        apiResponseTime: 0,
        apiSuccessRate: 100,
        activeRequests: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        pageLoadTime: 0,
        renderTime: 0,
        interactionDelay: 0,
        errorRate: 0,
        recoveryTime: 0,
        uptime: 0,
        aiEngineStatus: 'healthy',
        aiResponseTime: 0,
        aiSuccessRate: 100,
        timestamp: Date.now()
      },
      history: [],
      trends: {
        apiResponseTime: 'stable',
        errorRate: 'stable',
        memoryUsage: 'stable'
      },
      alerts: []
    });
  }, []);

  // 컴포넌트 마운트 시 자동 시작
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return {
    stats,
    isCollecting,
    trackAPIRequest,
    trackAPIResponse,
    startMonitoring,
    stopMonitoring,
    resetStats
  };
} 