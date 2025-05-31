/**
 * useErrorMonitoring Hook
 * 
 * 🚨 AI 사이드바의 실시간 에러 모니터링 및 복구 시스템
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorState } from '@/types/ai-thinking';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  stack?: string;
  userAgent?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  resolved: boolean;
}

interface ErrorMonitoringOptions {
  enableGlobalHandler: boolean;
  enableConsoleCapture: boolean;
  enablePerformanceMonitoring: boolean;
  maxLogEntries: number;
  autoReportThreshold: number;
}

export const useErrorMonitoring = (options: Partial<ErrorMonitoringOptions> = {}) => {
  const defaultOptions: ErrorMonitoringOptions = {
    enableGlobalHandler: true,
    enableConsoleCapture: true,
    enablePerformanceMonitoring: true,
    maxLogEntries: 100,
    autoReportThreshold: 5
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [currentError, setCurrentError] = useState<ErrorState | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState({
    totalErrors: 0,
    errorRate: 0,
    lastErrorTime: null as Date | null,
    averageResponseTime: 0
  });

  const errorCountRef = useRef(0);
  const performanceMarks = useRef<Record<string, number>>({});

  // 에러 로그 추가
  const addErrorLog = useCallback((error: Partial<ErrorLog>) => {
    const newError: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level: 'error',
      category: 'unknown',
      message: '',
      resolved: false,
      ...error
    };

    setErrors(prev => {
      const updated = [newError, ...prev];
      return updated.slice(0, finalOptions.maxLogEntries);
    });

    errorCountRef.current++;
    
    // 통계 업데이트
    setStats(prev => ({
      ...prev,
      totalErrors: errorCountRef.current,
      lastErrorTime: new Date(),
      errorRate: calculateErrorRate()
    }));

    console.error('🚨 Error Monitoring:', newError);
    
    // 자동 신고 임계치 확인
    if (errorCountRef.current >= finalOptions.autoReportThreshold) {
      handleAutoReport(newError);
    }
  }, [finalOptions.maxLogEntries, finalOptions.autoReportThreshold]);

  // 에러율 계산
  const calculateErrorRate = useCallback(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    const recentErrors = errors.filter(error => 
      new Date(error.timestamp).getTime() > fiveMinutesAgo
    );
    
    return recentErrors.length / 5; // 분당 에러 수
  }, [errors]);

  // 자동 신고 처리
  const handleAutoReport = useCallback((error: ErrorLog) => {
    console.warn('⚠️ Auto-reporting threshold reached:', {
      totalErrors: errorCountRef.current,
      threshold: finalOptions.autoReportThreshold,
      latestError: error
    });
    
    // 여기에 자동 신고 로직 구현 (Sentry, LogRocket 등)
  }, [finalOptions.autoReportThreshold]);

  // 전역 에러 핸들러
  const globalErrorHandler = useCallback((event: ErrorEvent) => {
    addErrorLog({
      level: 'error',
      category: 'javascript',
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
      userAgent: navigator.userAgent
    });
  }, [addErrorLog]);

  // 프로미스 거부 핸들러
  const unhandledRejectionHandler = useCallback((event: PromiseRejectionEvent) => {
    addErrorLog({
      level: 'error',
      category: 'promise',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack
    });
  }, [addErrorLog]);

  // 콘솔 에러 캡처
  const captureConsoleErrors = useCallback(() => {
    if (!finalOptions.enableConsoleCapture) return;

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      addErrorLog({
        level: 'error',
        category: 'console',
        message: args.join(' ')
      });
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      addErrorLog({
        level: 'warning',
        category: 'console',
        message: args.join(' ')
      });
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [finalOptions.enableConsoleCapture, addErrorLog]);

  // 성능 모니터링
  const startPerformanceMonitoring = useCallback((label: string) => {
    if (!finalOptions.enablePerformanceMonitoring) return;
    
    performanceMarks.current[label] = performance.now();
  }, [finalOptions.enablePerformanceMonitoring]);

  const endPerformanceMonitoring = useCallback((label: string) => {
    if (!finalOptions.enablePerformanceMonitoring) return;
    
    const startTime = performanceMarks.current[label];
    if (startTime) {
      const duration = performance.now() - startTime;
      delete performanceMarks.current[label];
      
      // 응답 시간 통계 업데이트
      setStats(prev => ({
        ...prev,
        averageResponseTime: (prev.averageResponseTime + duration) / 2
      }));
      
      // 성능 경고 (5초 이상)
      if (duration > 5000) {
        addErrorLog({
          level: 'warning',
          category: 'performance',
          message: `Slow operation detected: ${label} took ${duration.toFixed(2)}ms`
        });
      }
      
      return duration;
    }
    return null;
  }, [finalOptions.enablePerformanceMonitoring, addErrorLog]);

  // AI 관련 에러 특화 처리
  const handleAIError = useCallback((error: any, context: string) => {
    let errorType: ErrorState['errorType'] = 'unknown';
    let message = error.message || '알 수 없는 오류';

    // 에러 타입 분류
    if (error.name === 'AbortError' || message.includes('timeout')) {
      errorType = 'timeout';
    } else if (error.name === 'TypeError' && message.includes('fetch')) {
      errorType = 'network';
    } else if (message.includes('parse') || message.includes('JSON')) {
      errorType = 'parsing';
    } else if (message.includes('validation')) {
      errorType = 'validation';
    }

    const errorState: ErrorState = {
      hasError: true,
      errorType,
      message,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3
    };

    setCurrentError(errorState);

    addErrorLog({
      level: 'error',
      category: 'ai-system',
      message: `[${context}] ${message}`,
      stack: error.stack
    });

    return errorState;
  }, [addErrorLog]);

  // 에러 해결 표시
  const resolveError = useCallback((errorId: string) => {
    setErrors(prev => 
      prev.map(error => 
        error.id === errorId ? { ...error, resolved: true } : error
      )
    );
  }, []);

  // 모든 에러 클리어
  const clearErrors = useCallback(() => {
    setErrors([]);
    setCurrentError(null);
    errorCountRef.current = 0;
    setStats(prev => ({
      ...prev,
      totalErrors: 0,
      errorRate: 0
    }));
  }, []);

  // 에러 통계 조회
  const getErrorStats = useCallback(() => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentErrors = errors.filter(error => 
      new Date(error.timestamp) >= last24Hours
    );

    const errorsByCategory = recentErrors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByLevel = recentErrors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: recentErrors.length,
      byCategory: errorsByCategory,
      byLevel: errorsByLevel,
      resolved: recentErrors.filter(e => e.resolved).length,
      unresolved: recentErrors.filter(e => !e.resolved).length
    };
  }, [errors]);

  // 폴백 처리
  const handleFallback = useCallback((context: string, fallbackValue?: any) => {
    addErrorLog({
      level: 'info',
      category: 'fallback',
      message: `Fallback activated for: ${context}`
    });

    console.warn(`🔄 Fallback activated: ${context}`);
    return fallbackValue;
  }, [addErrorLog]);

  // 모니터링 시작/중지
  useEffect(() => {
    if (!isMonitoring) return;

    let cleanupConsole: (() => void) | undefined;

    // 전역 에러 핸들러 등록
    if (finalOptions.enableGlobalHandler) {
      window.addEventListener('error', globalErrorHandler);
      window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    }

    // 콘솔 에러 캡처
    cleanupConsole = captureConsoleErrors();

    console.log('🔍 Error monitoring started');

    return () => {
      if (finalOptions.enableGlobalHandler) {
        window.removeEventListener('error', globalErrorHandler);
        window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      }
      
      cleanupConsole?.();
      console.log('🔍 Error monitoring stopped');
    };
  }, [
    isMonitoring,
    finalOptions.enableGlobalHandler,
    globalErrorHandler,
    unhandledRejectionHandler,
    captureConsoleErrors
  ]);

  // 컴포넌트 마운트 시 모니터링 시작
  useEffect(() => {
    setIsMonitoring(true);
    return () => setIsMonitoring(false);
  }, []);

  return {
    // 상태
    errors,
    currentError,
    isMonitoring,
    stats,
    
    // 함수
    addErrorLog,
    handleAIError,
    resolveError,
    clearErrors,
    getErrorStats,
    handleFallback,
    startPerformanceMonitoring,
    endPerformanceMonitoring,
    
    // 유틸리티
    hasErrors: errors.length > 0,
    hasUnresolvedErrors: errors.some(e => !e.resolved),
    recentErrorCount: errors.filter(e => 
      new Date().getTime() - new Date(e.timestamp).getTime() < 5 * 60 * 1000
    ).length
  };
}; 