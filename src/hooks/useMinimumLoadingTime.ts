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

// 🎯 90% 일관성을 위한 정규화된 로딩 단계
const LOADING_PHASES = {
  'system-starting': {
    duration: 2000,
    progressRange: { start: 0, end: 30 },
    description: '시스템 초기화 중...'
  },
  'data-loading': {
    duration: 1500,
    progressRange: { start: 30, end: 60 },
    description: '데이터 로딩 중...'
  },
  'python-warmup': {
    duration: 1000,
    progressRange: { start: 60, end: 90 },
    description: 'AI 엔진 준비 중...'
  },
  'completed': {
    duration: 500,
    progressRange: { start: 90, end: 100 },
    description: '완료'
  }
} as const;

/**
 * 🎬 useNaturalLoadingTime Hook v3.0 - 90% 일관성 보장
 *
 * 90% 일관성 원칙:
 * - 0-30%: 시스템 초기화 (2초, 일정한 속도)
 * - 30-60%: 데이터 로딩 (1.5초, 일정한 속도)  
 * - 60-90%: AI 엔진 준비 (1초, 일정한 속도)
 * - 90-100%: 최종 완료 (0.5초, 빠른 완료)
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
  const [phaseStartTime, setPhaseStartTime] = useState(() => Date.now());

  // 예상 남은 시간 계산 (90% 일관성 기반)
  const estimatedTimeRemaining = useMemo(() => {
    if (phase === 'completed' || isCompleted) return 0;

    const currentPhaseInfo = LOADING_PHASES[phase];
    const phaseElapsed = Date.now() - phaseStartTime;
    const phaseRemaining = Math.max(0, currentPhaseInfo.duration - phaseElapsed);

    // 남은 단계들의 시간 계산
    const phaseOrder: (keyof typeof LOADING_PHASES)[] = ['system-starting', 'data-loading', 'python-warmup', 'completed'];
    const currentIndex = phaseOrder.indexOf(phase);
    const remainingPhases = phaseOrder.slice(currentIndex + 1);
    const remainingPhasesTime = remainingPhases.reduce((sum, phaseName) => {
      return sum + LOADING_PHASES[phaseName].duration;
    }, 0);

    return phaseRemaining + remainingPhasesTime;
  }, [phase, phaseStartTime, isCompleted]);

  // 🎯 확실한 완료 처리 함수 (중복 호출 방지)
  const handleComplete = useCallback(() => {
    if (!isCompleted) {
      console.log('🎉 useNaturalLoadingTime 완료 처리 시작');
      setIsCompleted(true);
      setIsLoading(false);
      setPhase('completed');
      setProgress(100);

      // 즉시 콜백 호출 (90% 일관성을 위해 지연 최소화)
      setTimeout(() => {
        try {
          console.log('🎉 onComplete 콜백 호출');
          onComplete?.();
        } catch (error) {
          safeConsoleError('❌ onComplete 콜백 실행 중 에러', error);
        }
      }, 50); // 매우 짧은 지연으로 즉시 실행
    }
  }, [isCompleted, onComplete]);

  // 스킵 조건 체크 (즉시 실행)
  useEffect(() => {
    if (skipCondition && !isCompleted) {
      console.log('⚡ 로딩 애니메이션 스킵 - 즉시 완료');
      handleComplete();
      return;
    }
  }, [skipCondition, isCompleted, handleComplete]);

  // 🔥 키보드 단축키로 즉시 완료
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

  // 🔥 전역 개발자 도구 등록
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

  // 🎯 90% 일관성 로딩 로직
  useEffect(() => {
    if (skipCondition || isCompleted) return;

    console.log('🎬 90% 일관성 로딩 시작');

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

    // 진행률 업데이트 인터벌 (매 50ms로 부드러운 애니메이션)
    intervalId = setInterval(() => {
      const now = Date.now();
      const totalElapsed = now - startTime;
      const phaseElapsed = now - phaseStartTime;

      setElapsedTime(totalElapsed);

      const currentPhaseInfo = LOADING_PHASES[phase];
      const phaseProgress = Math.min(phaseElapsed / currentPhaseInfo.duration, 1);

      // 90% 일관성을 위한 정규화된 진행률 계산
      const { start, end } = currentPhaseInfo.progressRange;
      const normalizedProgress = start + (phaseProgress * (end - start));

      setProgress(Math.min(normalizedProgress, end));

      // 단계 완료 시 다음 단계로 전환
      if (phaseProgress >= 1) {
        const phaseOrder: (keyof typeof LOADING_PHASES)[] = ['system-starting', 'data-loading', 'python-warmup', 'completed'];
        const currentIndex = phaseOrder.indexOf(phase);
        const nextPhase = phaseOrder[currentIndex + 1];

        if (nextPhase && nextPhase !== 'completed') {
          console.log(`📊 ${phase} → ${nextPhase} 단계 전환`);
          setPhase(nextPhase);
          setPhaseStartTime(now);
        } else if (nextPhase === 'completed') {
          // 90-100% 빠른 완료
          console.log('🎯 90% 도달 - 빠른 완료 시작');
          setProgress(90);

          setTimeout(() => {
            setProgress(100);
            setTimeout(() => {
              handleComplete();
            }, 100);
          }, 200);
        }
      }
    }, 50);

    // 안전장치: 최대 6초 후 강제 완료
    cleanupTimer = setTimeout(() => {
      if (!isCompleted) {
        console.log('⏰ 타임아웃 - 강제 완료');
        handleComplete();
      }
    }, 6000);

    // 실제 데이터 로딩 Promise 처리
    const handleActualLoading = async () => {
      if (actualLoadingPromise) {
        try {
          console.log('📡 실제 데이터 로딩 시작');
          await actualLoadingPromise;
          console.log('✅ 실제 데이터 로딩 완료');

          // 데이터 로딩이 완료되면 python-warmup 단계로 빠르게 전환
          if (phase === 'data-loading' && !isCompleted) {
            setPhase('python-warmup');
            setPhaseStartTime(Date.now());
          }
        } catch (error) {
          safeConsoleError('❌ 실제 데이터 로딩 에러', error);
          // 에러가 발생해도 로딩은 계속 진행
        }
      }
    };

    handleActualLoading();

    return cleanup;
  }, [skipCondition, isCompleted, startTime, phaseStartTime, phase, actualLoadingPromise, handleComplete]);

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
    progress: Math.round(progress * 10) / 10, // 소수점 1자리로 정규화
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
