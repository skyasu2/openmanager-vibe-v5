/**
 * useErrorMonitoring Hook
 *
 * 🚨 AI 시스템 실시간 에러 모니터링 및 복구 훅
 * - 네트워크, 파싱, 타임아웃, 처리 에러 감지
 * - 자동 복구 시도 및 폴백 처리
 * - 성능 모니터링
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorState } from '@/types/ai-thinking';

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

interface MonitoringConfig {
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
  enableAutoRecover: boolean;
  enablePerformanceTracking: boolean;
}

export const useErrorMonitoring = (config?: Partial<MonitoringConfig>) => {
  const defaultConfig: MonitoringConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    timeoutMs: 30000,
    enableAutoRecover: true,
    enablePerformanceTracking: true,
    ...config,
  };

  // 상태 관리
  const [errors, setErrors] = useState<ErrorState[]>([]);
  const [currentError, setCurrentError] = useState<ErrorState | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);

  // 참조 관리
  const performanceTracker = useRef<Map<string, PerformanceMetric>>(new Map());
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 에러 생성 유틸리티
  const createError = useCallback(
    (
      type: ErrorState['errorType'],
      message: string,
      retryCount: number = 0
    ): ErrorState => ({
      hasError: true,
      errorType: type,
      message,
      timestamp: new Date().toISOString(),
      retryCount,
      maxRetries: defaultConfig.maxRetries,
    }),
    [defaultConfig.maxRetries]
  );

  // AI 에러 처리
  const handleAIError = useCallback(
    (error: any, context: string = 'AI Operation') => {
      let errorType: ErrorState['errorType'] = 'unknown';
      let message = `${context}: `;

      // 에러 타입 분석
      if (error instanceof TypeError || error?.name === 'TypeError') {
        errorType = 'parsing';
        message += '데이터 파싱 오류가 발생했습니다.';
      } else if (
        error?.name === 'TimeoutError' ||
        error?.code === 'ECONNABORTED'
      ) {
        errorType = 'timeout';
        message += '요청 시간이 초과되었습니다.';
      } else if (error?.name === 'NetworkError' || !navigator.onLine) {
        errorType = 'network';
        message += '네트워크 연결에 문제가 있습니다.';
      } else if (error?.status >= 400 && error?.status < 500) {
        errorType = 'validation';
        message += '요청 데이터에 문제가 있습니다.';
      } else if (error?.status >= 500) {
        errorType = 'processing';
        message += '서버에서 처리 중 오류가 발생했습니다.';
      } else {
        message += error?.message || '알 수 없는 오류가 발생했습니다.';
      }

      const errorState = createError(errorType, message);

      setCurrentError(errorState);
      setErrors(prev => [...prev, errorState]);

      console.error(`🚨 AI Error Monitor [${errorType}]:`, {
        context,
        message,
        originalError: error,
        timestamp: errorState.timestamp,
      });

      // 자동 복구 시도
      if (
        defaultConfig.enableAutoRecover &&
        errorState.retryCount < defaultConfig.maxRetries
      ) {
        attemptAutoRecover(errorState, context);
      }

      return errorState;
    },
    [createError, defaultConfig.enableAutoRecover, defaultConfig.maxRetries]
  );

  // 자동 복구 시도
  const attemptAutoRecover = useCallback(
    (error: ErrorState, context: string) => {
      const retryKey = `${context}-${Date.now()}`;

      const timeout = setTimeout(
        () => {
          console.log(
            `🔄 자동 복구 시도 [${error.errorType}] - 시도 ${error.retryCount + 1}/${error.maxRetries}`
          );

          // 복구 전략
          switch (error.errorType) {
            case 'network':
              // 네트워크 재연결 확인
              if (navigator.onLine) {
                resolveError(error);
              }
              break;

            case 'timeout':
              // 타임아웃은 즉시 재시도
              resolveError(error);
              break;

            case 'processing':
              // 서버 처리 오류는 잠시 후 재시도
              setTimeout(() => resolveError(error), 2000);
              break;

            default:
              // 기본적으로 에러 해결로 처리
              resolveError(error);
          }

          retryTimeouts.current.delete(retryKey);
        },
        defaultConfig.retryDelay * (error.retryCount + 1)
      ); // 지수 백오프

      retryTimeouts.current.set(retryKey, timeout);
    },
    [defaultConfig.retryDelay]
  );

  // 에러 해결
  const resolveError = useCallback((error?: ErrorState) => {
    if (error) {
      setErrors(prev => prev.filter(e => e.timestamp !== error.timestamp));
    }
    setCurrentError(null);
    console.log('✅ AI Error 해결됨:', error?.errorType);
  }, []);

  // 모든 에러 클리어
  const clearErrors = useCallback(() => {
    setErrors([]);
    setCurrentError(null);

    // 진행 중인 재시도 취소
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.clear();

    console.log('🧹 모든 AI 에러 클리어됨');
  }, []);

  // 성능 모니터링 시작
  const startPerformanceMonitoring = useCallback(
    (operation: string) => {
      if (!defaultConfig.enablePerformanceTracking) return;

      const metric: PerformanceMetric = {
        operation,
        startTime: performance.now(),
        success: false,
      };

      performanceTracker.current.set(operation, metric);
      console.log(`📊 성능 추적 시작: ${operation}`);
    },
    [defaultConfig.enablePerformanceTracking]
  );

  // 성능 모니터링 종료
  const endPerformanceMonitoring = useCallback(
    (operation: string, success: boolean = true, error?: string) => {
      if (!defaultConfig.enablePerformanceTracking) return;

      const metric = performanceTracker.current.get(operation);
      if (!metric) return;

      const endTime = performance.now();
      const duration = endTime - metric.startTime;

      const completedMetric: PerformanceMetric = {
        ...metric,
        endTime,
        duration,
        success,
        error,
      };

      setPerformanceMetrics(prev => [...prev.slice(-49), completedMetric]); // 최근 50개만 유지
      performanceTracker.current.delete(operation);

      console.log(
        `📊 성능 추적 완료: ${operation} - ${duration.toFixed(2)}ms (${success ? '성공' : '실패'})`
      );
    },
    [defaultConfig.enablePerformanceTracking]
  );

  // 폴백 처리
  const handleFallback = useCallback(
    (operation: string, fallbackData: any) => {
      console.warn(`🔄 폴백 처리 활성화: ${operation}`, fallbackData);

      // 폴백 사용 메트릭 기록
      endPerformanceMonitoring(`${operation}-fallback`, true);

      return fallbackData;
    },
    [endPerformanceMonitoring]
  );

  // 네트워크 상태 모니터링
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 네트워크 연결됨 - 자동 복구 가능');

      // 네트워크 에러 자동 해결
      setErrors(prev => prev.filter(error => error.errorType !== 'network'));
      if (currentError?.errorType === 'network') {
        setCurrentError(null);
      }
    };

    const handleOffline = () => {
      console.warn('📴 네트워크 연결 끊김');
      const networkError = createError(
        'network',
        '네트워크 연결이 끊어졌습니다.'
      );
      setCurrentError(networkError);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      // 정리: 진행 중인 재시도 취소
      retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
      retryTimeouts.current.clear();
    };
  }, [createError, currentError]);

  // 성능 요약 계산
  const getPerformanceSummary = useCallback(() => {
    if (performanceMetrics.length === 0) return null;

    const totalOperations = performanceMetrics.length;
    const successfulOperations = performanceMetrics.filter(
      m => m.success
    ).length;
    const averageDuration =
      performanceMetrics
        .filter(m => m.duration)
        .reduce((sum, m) => sum + m.duration!, 0) / totalOperations;

    return {
      totalOperations,
      successfulOperations,
      successRate: (successfulOperations / totalOperations) * 100,
      averageDuration: Math.round(averageDuration),
      errorRate:
        ((totalOperations - successfulOperations) / totalOperations) * 100,
    };
  }, [performanceMetrics]);

  return {
    // 에러 상태
    errors,
    currentError,
    hasErrors: errors.length > 0,

    // 성능 메트릭
    performanceMetrics,
    performanceSummary: getPerformanceSummary(),

    // 에러 처리 함수
    handleAIError,
    resolveError,
    clearErrors,

    // 성능 모니터링 함수
    startPerformanceMonitoring,
    endPerformanceMonitoring,

    // 유틸리티 함수
    handleFallback,

    // 설정
    config: defaultConfig,
  };
};
