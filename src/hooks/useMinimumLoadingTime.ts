import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseMinimumLoadingTimeProps {
  minimumDuration?: number; // 기본 5초
  actualLoadingPromise?: Promise<any> | null;
  skipCondition?: boolean; // 스킵 조건
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  estimatedTimeRemaining: number;
  phase: 'minimum-wait' | 'actual-loading' | 'completed';
  elapsedTime: number;
}

/**
 * 🎬 useMinimumLoadingTime Hook
 * 
 * 로딩 애니메이션의 최소 시간을 보장하면서
 * 실제 데이터 로딩 시간이 더 길면 그만큼 연장하는 훅
 * 
 * @param minimumDuration - 최소 보장 시간 (기본: 5000ms)
 * @param actualLoadingPromise - 실제 데이터 로딩 Promise
 * @param skipCondition - 스킵 조건 (URL 파라미터 등)
 */
export const useMinimumLoadingTime = ({
  minimumDuration = 5000,
  actualLoadingPromise = null,
  skipCondition = false
}: UseMinimumLoadingTimeProps): LoadingState => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<LoadingState['phase']>('minimum-wait');
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // 예상 남은 시간 계산
  const estimatedTimeRemaining = useMemo(() => {
    if (phase === 'completed') return 0;
    
    if (phase === 'minimum-wait') {
      return Math.max(0, minimumDuration - elapsedTime);
    }
    
    // actual-loading 단계에서는 예측 어려움
    return Math.max(1000, minimumDuration - elapsedTime);
  }, [phase, minimumDuration, elapsedTime]);

  // 스킵 조건 체크
  useEffect(() => {
    if (skipCondition) {
      console.log('⚡ 로딩 애니메이션 스킵 - 즉시 완료');
      setIsLoading(false);
      setProgress(100);
      setPhase('completed');
      return;
    }
  }, [skipCondition]);

  // 메인 로딩 로직
  useEffect(() => {
    if (skipCondition) return;

    console.log('🎬 최소 로딩 시간 보장 시작:', minimumDuration, 'ms');
    
    // eslint-disable-next-line prefer-const
    let intervalId: NodeJS.Timeout;
    let cleanupTimer: NodeJS.Timeout;
    let isCleanedUp = false;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      
      if (intervalId) clearInterval(intervalId);
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };

    // 진행률 업데이트 인터벌 (매 100ms)
    intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);
      
      // 최소 시간 기반 진행률 계산
      const minimumProgress = Math.min((elapsed / minimumDuration) * 100, 100);
      
      if (minimumProgress >= 100) {
        setPhase('actual-loading');
      }
      
      setProgress(minimumProgress);
    }, 100);

    // 최소 시간 Promise
    const minimumTimePromise = new Promise<void>(resolve => {
      cleanupTimer = setTimeout(() => {
        console.log('✅ 최소 시간 완료:', minimumDuration, 'ms');
        resolve();
      }, minimumDuration);
    });

    // 실제 로딩 Promise (없으면 즉시 완료로 간주)
    const loadingPromise = actualLoadingPromise || Promise.resolve();

    // 두 Promise 중 더 긴 시간 대기
    Promise.all([minimumTimePromise, loadingPromise])
      .then(() => {
        if (isCleanedUp) return;
        
        const totalTime = Date.now() - startTime;
        console.log('🎉 전체 로딩 완료 - 경과 시간:', totalTime, 'ms');
        
        setProgress(100);
        setPhase('completed');
        
        // 완료 애니메이션을 위한 짧은 딜레이
        setTimeout(() => {
          if (!isCleanedUp) {
            setIsLoading(false);
          }
        }, 300);
      })
      .catch((error) => {
        if (isCleanedUp) return;
        
        console.error('❌ 로딩 에러:', error);
        
        // 에러가 발생해도 최소 시간은 보장
        const remainingTime = Math.max(0, minimumDuration - (Date.now() - startTime));
        
        setTimeout(() => {
          if (!isCleanedUp) {
            setProgress(100);
            setPhase('completed');
            setIsLoading(false);
          }
        }, remainingTime);
      });

    // 컴포넌트 언마운트 시 정리
    return cleanup;
  }, [minimumDuration, actualLoadingPromise, skipCondition, startTime]);

  return {
    isLoading,
    progress,
    estimatedTimeRemaining,
    phase,
    elapsedTime
  };
};

/**
 * 🎯 useDataLoadingPromise Hook
 * 
 * 서버 데이터 로딩 상태를 Promise로 변환하는 헬퍼 훅
 */
export const useDataLoadingPromise = (
  data: any[], 
  isLoading: boolean, 
  error: any
): Promise<any[]> => {
  return useMemo(() => {
    return new Promise((resolve, reject) => {
      const checkDataReady = () => {
        if (!isLoading && data && data.length > 0) {
          console.log('✅ 서버 데이터 로딩 완료:', data.length, '개');
          resolve(data);
        } else if (error) {
          console.error('❌ 서버 데이터 로딩 실패:', error);
          reject(error);
        } else {
          // 100ms마다 다시 체크
          setTimeout(checkDataReady, 100);
        }
      };
      
      checkDataReady();
    });
  }, [data, isLoading, error]);
}; 