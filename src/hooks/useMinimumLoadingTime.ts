import { useState, useEffect, useCallback, useMemo } from 'react';
import { safeConsoleError, safeErrorMessage } from '../lib/utils-functions';

interface UseNaturalLoadingTimeProps {
  actualLoadingPromise?: Promise<any> | null;
  skipCondition?: boolean;
  onComplete?: () => void;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  estimatedTimeRemaining: number;
  phase: 'system-starting' | 'data-loading' | 'python-warmup' | 'completed';
  elapsedTime: number;
}

/**
 * 🎬 useNaturalLoadingTime Hook v2.1 - 호환성 개선
 *
 * 실제 시스템 가동 시간을 자연스럽게 반영하는 로딩 훅
 * - 시스템 초기화 (파이썬 엔진 가동)
 * - 데이터 로딩 (서버 목록, 메트릭)
 * - 최종 준비 완료
 * - 프론트엔드 구성 90% 유지하면서 호환성 문제 해결
 *
 * @param actualLoadingPromise - 실제 데이터 로딩 Promise
 * @param skipCondition - 스킵 조건 (URL 파라미터 등)
 * @param onComplete - 완료 시 호출될 콜백 함수
 */
export const useNaturalLoadingTime = ({
  actualLoadingPromise = null,
  skipCondition = false,
  onComplete,
}: UseNaturalLoadingTimeProps): LoadingState => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<LoadingState['phase']>('system-starting');
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // 예상 남은 시간 계산 (자연스러운 추정)
  const estimatedTimeRemaining = useMemo(() => {
    if (phase === 'completed') return 0;

    // 각 단계별 예상 시간
    const phaseEstimates = {
      'system-starting': 2000, // 시스템 초기화 ~2초
      'data-loading': 1500, // 데이터 로딩 ~1.5초
      'python-warmup': 1000, // 파이썬 웜업 ~1초
    };

    const currentPhaseEstimate = phaseEstimates[phase] || 1000;
    return Math.max(500, currentPhaseEstimate - (elapsedTime % 2000));
  }, [phase, elapsedTime]);

  // 확실한 완료 처리 함수 (중복 호출 방지)
  const handleComplete = useCallback(() => {
    if (!isCompleted) {
      console.log('🎯 useNaturalLoadingTime 완료 처리 시작');
      setIsCompleted(true);
      setIsLoading(false);
      setPhase('completed');
      setProgress(100);

      // 콜백 호출 (약간의 지연으로 안정성 확보)
      setTimeout(() => {
        try {
          console.log('🎉 onComplete 콜백 호출');
          onComplete?.();
        } catch (error) {
          safeConsoleError('❌ onComplete 콜백 실행 중 에러', error);
          // 콜백 에러가 발생해도 로딩은 완료된 것으로 처리
        }
      }, 100);
    }
  }, [isCompleted, onComplete]);

  // 스킵 조건 체크 (즉시 실행)
  useEffect(() => {
    if (skipCondition && !isCompleted) {
      console.log('⚡ 로딩 애니메이션 스킵 - 즉시 완료');
      // 즉시 상태 업데이트
      setIsCompleted(true);
      setIsLoading(false);
      setPhase('completed');
      setProgress(100);

      // 콜백도 즉시 실행
      setTimeout(() => {
        try {
          console.log('🎉 onComplete 콜백 즉시 호출');
          onComplete?.();
        } catch (error) {
          safeConsoleError('❌ onComplete 콜백 실행 중 에러', error);
        }
      }, 10); // 매우 짧은 지연으로 즉시 실행
      return;
    }
  }, [skipCondition, isCompleted, onComplete]);

  // 키보드 단축키로 즉시 완료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') &&
        !isCompleted
      ) {
        console.log(`🚀 ${e.key} 키로 즉시 완료`);
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleComplete, isCompleted]);

  // 전역 개발자 도구 등록
  useEffect(() => {
    (window as any).debugLoadingState = {
      isLoading,
      phase,
      progress,
      isCompleted,
      elapsedTime,
      timestamp: Date.now(),
    };

    (window as any).emergencyComplete = () => {
      console.log('🚨 비상 완료 실행!');
      handleComplete();
    };

    (window as any).skipToServer = () => {
      console.log('🚀 서버 대시보드로 바로 이동');
      window.location.href = '/dashboard?instant=true';
    };
  }, [isLoading, phase, progress, isCompleted, elapsedTime, handleComplete]);

  // 자연스러운 로딩 로직
  useEffect(() => {
    if (skipCondition || isCompleted) return;

    console.log('🎬 자연스러운 시스템 로딩 시작');

    let intervalId: NodeJS.Timeout | undefined;
    let phaseTimer: NodeJS.Timeout | undefined;
    let cleanupTimer: NodeJS.Timeout | undefined;
    let isCleanedUp = false;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;

      if (intervalId) clearInterval(intervalId);
      if (phaseTimer) clearTimeout(phaseTimer);
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };

    // 진행률 업데이트 인터벌 (매 100ms)
    intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      // 자연스러운 진행률 계산 (시간 기반이 아닌 단계 기반)
      let naturalProgress = 0;

      if (phase === 'system-starting') {
        naturalProgress = Math.min((elapsed / 2000) * 30, 30); // 0-30%
      } else if (phase === 'data-loading') {
        naturalProgress = 30 + Math.min(((elapsed - 2000) / 1500) * 40, 40); // 30-70%
      } else if (phase === 'python-warmup') {
        naturalProgress = 70 + Math.min(((elapsed - 3500) / 1000) * 30, 30); // 70-100%
      }

      setProgress(naturalProgress);
    }, 100);

    // 단계별 전환 로직
    const startPhaseTransitions = () => {
      // 2초 후: 데이터 로딩 단계
      setTimeout(() => {
        if (!isCleanedUp && !isCompleted) {
          console.log('📊 데이터 로딩 단계 시작');
          setPhase('data-loading');
        }
      }, 2000);

      // 3.5초 후: 파이썬 웜업 단계
      setTimeout(() => {
        if (!isCleanedUp && !isCompleted) {
          console.log('🐍 파이썬 시스템 웜업 단계 시작');
          setPhase('python-warmup');
        }
      }, 3500);
    };

    startPhaseTransitions();

    // 실제 데이터 로딩 Promise 처리
    const handleActualLoading = async () => {
      if (actualLoadingPromise) {
        try {
          console.log('📡 실제 데이터 로딩 시작');
          await actualLoadingPromise;
          console.log('✅ 실제 데이터 로딩 완료');

          // 데이터 로딩이 완료되면 빠르게 완료 처리
          if (!isCompleted) {
            setTimeout(() => {
              handleComplete();
            }, 500);
          }
        } catch (error) {
          safeConsoleError('❌ 실제 데이터 로딩 에러', error);
          // 에러가 발생해도 로딩은 계속 진행
        }
      }
    };

    handleActualLoading();

    // 안전장치: 최대 5초 후 강제 완료
    cleanupTimer = setTimeout(() => {
      if (!isCompleted) {
        console.log('⏰ 타임아웃 - 강제 완료');
        handleComplete();
      }
    }, 5000);

    return cleanup;
  }, [
    skipCondition,
    isCompleted,
    startTime,
    phase,
    actualLoadingPromise,
    handleComplete,
  ]);

  // 클릭으로 스킵 기능 (3초 후 활성화)
  useEffect(() => {
    const enableSkipTimer = setTimeout(() => {
      const handleClick = () => {
        if (!isCompleted) {
          console.log('👆 클릭으로 로딩 스킵');
          handleComplete();
        }
      };

      document.addEventListener('click', handleClick);

      return () => {
        document.removeEventListener('click', handleClick);
      };
    }, 3000);

    return () => clearTimeout(enableSkipTimer);
  }, [handleComplete, isCompleted]);

  return {
    isLoading,
    progress: Math.round(progress),
    estimatedTimeRemaining,
    phase,
    elapsedTime,
  };
};

// 별칭 export (기존 호환성 유지)
export const useMinimumLoadingTime = useNaturalLoadingTime;

// 데이터 로딩 Promise 헬퍼
export const useDataLoadingPromise = (
  data: any[],
  isLoading: boolean,
  error: any
): Promise<any[]> => {
  return useMemo(() => {
    return new Promise((resolve, reject) => {
      const checkDataReady = () => {
        if (error) {
          reject(error);
        } else if (!isLoading && data && data.length > 0) {
          resolve(data);
        } else {
          setTimeout(checkDataReady, 100);
        }
      };
      checkDataReady();
    });
  }, [data, isLoading, error]);
};
