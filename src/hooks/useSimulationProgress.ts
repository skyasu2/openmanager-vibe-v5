/**
 * 🔄 useSimulationProgress Hook v2.0
 *
 * 성능 최적화된 시뮬레이션 진행 상황 추적 훅
 * - Page Visibility API로 백그라운드 폴링 제어
 * - 메모화로 불필요한 리렌더링 방지
 * - 지능적 재시도 및 에러 처리
 * - 메모리 누수 방지
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface SimulationProgressData {
  currentStep: number;
  totalSteps: number;
  isActive: boolean;
  progress: number;
  stepDescription?: string;
  stepIcon?: string;
  nextStepETA?: number;
  elapsedSeconds?: number;
}

interface UseSimulationProgressReturn {
  data: SimulationProgressData | null;
  loading: boolean;
  error: string | null;
  isComplete: boolean;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPaused: boolean;
}

interface UseSimulationProgressOptions {
  pollInterval?: number;
  autoStart?: boolean;
  pauseWhenHidden?: boolean;
  maxRetries?: number;
  enableCaching?: boolean;
}

const useSimulationProgress = ({
  pollInterval = 2000,
  autoStart = true,
  pauseWhenHidden = true,
  maxRetries = 3,
  enableCaching = true,
}: UseSimulationProgressOptions = {}): UseSimulationProgressReturn => {
  const [data, setData] = useState<SimulationProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastDataRef = useRef<SimulationProgressData | null>(null);
  const isVisibleRef = useRef(true);
  const cacheRef = useRef<
    Map<string, { data: SimulationProgressData; timestamp: number }>
  >(new Map());

  // 완료 상태 메모화
  const isComplete = useMemo(() => {
    return data
      ? data.currentStep >= data.totalSteps - 1 || data.progress >= 100
      : false;
  }, [data]);

  /**
   * 🎯 Page Visibility 상태 감지
   */
  useEffect(() => {
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      const isCurrentlyVisible = document.visibilityState === 'visible';
      isVisibleRef.current = isCurrentlyVisible;

      if (isCurrentlyVisible && isPaused && isPolling) {
        console.log('📱 페이지가 활성화됨. 폴링 재개...');
        setIsPaused(false);
        refresh(); // 즉시 데이터 갱신
      } else if (!isCurrentlyVisible && isPolling) {
        console.log('📱 페이지가 백그라운드로 이동. 폴링 일시정지...');
        setIsPaused(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused, isPolling]);

  /**
   * 🎯 캐시에서 데이터 조회
   */
  const getCachedData = useCallback(
    (key: string): SimulationProgressData | null => {
      if (!enableCaching) return null;

      const cached = cacheRef.current.get(key);
      if (cached && Date.now() - cached.timestamp < 5000) {
        // 5초 캐시
        return cached.data;
      }
      return null;
    },
    [enableCaching]
  );

  /**
   * 🎯 캐시에 데이터 저장
   */
  const setCachedData = useCallback(
    (key: string, data: SimulationProgressData) => {
      if (!enableCaching) return;

      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
      });

      // 캐시 크기 제한 (최대 10개)
      if (cacheRef.current.size > 10) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }
    },
    [enableCaching]
  );

  /**
   * 🎯 API에서 시뮬레이션 데이터 가져오기 (최적화됨)
   */
  const fetchSimulationData =
    useCallback(async (): Promise<SimulationProgressData | null> => {
      // 캐시 확인
      const cacheKey = 'simulation-progress';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

        const response = await fetch('/api/simulate/data?action=status', {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `API 응답 실패: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '시뮬레이션 데이터 조회 실패');
        }

        const apiData = result.data;

        const newData: SimulationProgressData = {
          currentStep: apiData.currentStep || 0,
          totalSteps: apiData.totalSteps || 12,
          isActive: apiData.isActive ?? true,
          progress:
            apiData.progress ||
            Math.round(
              ((apiData.currentStep + 1) / (apiData.totalSteps || 12)) * 100
            ),
          stepDescription:
            apiData.stepInfo?.description || apiData.stepDescription,
          stepIcon: apiData.stepInfo?.icon || apiData.stepIcon,
          nextStepETA: apiData.timing?.nextStepETA,
          elapsedSeconds: apiData.timing?.elapsedSeconds,
        };

        // 캐시에 저장
        setCachedData(cacheKey, newData);

        return newData;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('요청 시간 초과');
        }
        console.error('❌ 시뮬레이션 데이터 조회 실패:', err);
        throw err;
      }
    }, [getCachedData, setCachedData]);

  /**
   * 🎯 데이터 새로고침 (메모화됨)
   */
  const refresh = useCallback(async () => {
    if (!isVisibleRef.current && pauseWhenHidden) {
      console.log('📱 페이지가 숨겨진 상태. 새로고침 건너뛰기');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchSimulationData();

      // 얕은 비교로 불필요한 리렌더링 방지
      if (
        !lastDataRef.current ||
        lastDataRef.current.currentStep !== newData?.currentStep ||
        lastDataRef.current.progress !== newData?.progress ||
        lastDataRef.current.stepDescription !== newData?.stepDescription
      ) {
        setData(newData);
        lastDataRef.current = newData;
      }

      retryCountRef.current = 0; // 성공시 재시도 카운터 리셋
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);

      // 지능적 재시도 로직
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const retryDelay = Math.min(
          1000 * Math.pow(2, retryCountRef.current - 1),
          10000
        ); // 지수 백오프, 최대 10초
        console.log(
          `🔄 재시도 ${retryCountRef.current}/${maxRetries} (${retryDelay}ms 후)...`
        );

        setTimeout(() => {
          if (isVisibleRef.current || !pauseWhenHidden) {
            refresh();
          }
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchSimulationData, maxRetries, pauseWhenHidden]);

  /**
   * 🎯 폴링 시작 (최적화됨)
   */
  const startPolling = useCallback(() => {
    if (isPolling || intervalRef.current) return;

    console.log('🔄 시뮬레이션 폴링 시작 (최적화됨)');
    setIsPolling(true);
    setIsPaused(false);

    intervalRef.current = setInterval(async () => {
      // 페이지가 숨겨져 있으면 폴링 건너뛰기
      if (!isVisibleRef.current && pauseWhenHidden) {
        setIsPaused(true);
        return;
      }

      setIsPaused(false);

      try {
        const newData = await fetchSimulationData();

        // 데이터가 변경된 경우에만 업데이트
        if (
          !lastDataRef.current ||
          lastDataRef.current.currentStep !== newData?.currentStep ||
          lastDataRef.current.progress !== newData?.progress ||
          lastDataRef.current.stepDescription !== newData?.stepDescription
        ) {
          setData(prevData => {
            lastDataRef.current = newData;
            return newData;
          });
        }

        setError(null);
        retryCountRef.current = 0;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '폴링 중 오류 발생';
        setError(errorMessage);

        // 연속 실패시 폴링 중단
        if (retryCountRef.current >= maxRetries) {
          console.warn('⚠️ 최대 재시도 횟수 초과. 폴링을 중단합니다.');
          stopPolling();
        } else {
          retryCountRef.current += 1;
        }
      }
    }, pollInterval);
  }, [
    isPolling,
    fetchSimulationData,
    pollInterval,
    maxRetries,
    pauseWhenHidden,
  ]);

  /**
   * 🎯 폴링 중단
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    setIsPaused(false);
    console.log('⏹️ 시뮬레이션 폴링 중단');
  }, []);

  /**
   * 🎯 시뮬레이션 완료시 자동 폴링 중단
   */
  useEffect(() => {
    if (isComplete && isPolling) {
      console.log('✅ 시뮬레이션 완료. 폴링을 자동 중단합니다.');
      const cleanupDelay = setTimeout(() => stopPolling(), 3000); // 3초 후 중단
      return () => clearTimeout(cleanupDelay);
    }
  }, [isComplete, isPolling, stopPolling]);

  /**
   * 🎯 초기 데이터 로드 및 자동 폴링 시작
   */
  useEffect(() => {
    if (autoStart) {
      refresh().then(() => {
        if (!isComplete) {
          startPolling();
        }
      });
    }

    // 컴포넌트 언마운트시 정리
    return () => {
      stopPolling();
      // 캐시 정리
      if (cacheRef.current) {
        cacheRef.current.clear();
      }
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // Pause when page is hidden
  useEffect(() => {
    if (!autoStart) return;

    const handleVisibilityChange = () => {
      if (document.hidden && pauseWhenHidden) {
        stopPolling();
      } else if (!document.hidden && pauseWhenHidden) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoStart, pauseWhenHidden, startPolling, stopPolling]);

  const resetSimulation = useCallback(() => {
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentStep: 0,
        progress: 0,
        isActive: false,
      };
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    stopPolling();
  }, [stopPolling]);

  // Main effect for controlling polling lifecycle
  useEffect(() => {
    const currentCache = cacheRef.current;

    return () => {
      if (currentCache) {
        currentCache.clear();
      }
    };
  }, []);

  useEffect(() => {
    if (autoStart && !isComplete) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [autoStart, isComplete, startPolling, stopPolling]);

  // 메모화된 반환값
  return useMemo(
    () => ({
      data,
      loading,
      error,
      isComplete,
      refresh,
      startPolling,
      stopPolling,
      isPaused,
    }),
    [
      data,
      loading,
      error,
      isComplete,
      refresh,
      startPolling,
      stopPolling,
      isPaused,
    ]
  );
};

export default useSimulationProgress;
