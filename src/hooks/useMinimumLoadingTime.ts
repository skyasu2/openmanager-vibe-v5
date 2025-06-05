
import { useState, useEffect, useCallback, useMemo } from 'react';
import { safeConsoleError, safeErrorMessage } from '../lib/utils-functions';

interface UseNaturalLoadingTimeProps {
  actualLoadingPromise?: Promise<any> | null;
  skipCondition?: boolean; // 스킵 조건
  onComplete?: () => void; // 🔥 새로 추가: 완료 콜백
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  estimatedTimeRemaining: number;
  phase: 'system-starting' | 'data-loading' | 'python-warmup' | 'completed';
  elapsedTime: number;
}

/**
 * 🎬 useNaturalLoadingTime Hook v2.0
 * 
 * 실제 시스템 가동 시간을 자연스럽게 반영하는 로딩 훅
 * - 시스템 초기화 (파이썬 엔진 가동)
 * - 데이터 로딩 (서버 목록, 메트릭)
 * - 최종 준비 완료
 * - 🔥 다중 안전장치로 확실한 완료 보장
 * 
 * @param actualLoadingPromise - 실제 데이터 로딩 Promise
 * @param skipCondition - 스킵 조건 (URL 파라미터 등)
 * @param onComplete - 완료 시 호출될 콜백 함수
 */
export const useNaturalLoadingTime = ({
  actualLoadingPromise = null,
  skipCondition = false,
  onComplete
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
      'data-loading': 1500,    // 데이터 로딩 ~1.5초  
      'python-warmup': 1000    // 파이썬 웜업 ~1초
    };
    
    const currentPhaseEstimate = phaseEstimates[phase] || 1000;
    return Math.max(500, currentPhaseEstimate - (elapsedTime % 2000));
  }, [phase, elapsedTime]);

  // 🔥 확실한 완료 처리 함수 (중복 호출 방지)
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

  // 스킵 조건 체크
  useEffect(() => {
    if (skipCondition) {
      console.log('⚡ 로딩 애니메이션 스킵 - 즉시 완료');
      handleComplete();
      return;
    }
  }, [skipCondition, handleComplete]);

  // 🔥 키보드 단축키로 즉시 완료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && !isCompleted) {
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
      timestamp: Date.now()
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

    // 실제 로딩 Promise와 함께 처리
    const handleActualLoading = async () => {
      try {
        if (actualLoadingPromise) {
          console.log('⏳ 실제 데이터 로딩 대기 중...');
          await actualLoadingPromise;
          console.log('✅ 실제 데이터 로딩 완료');
        }

        // 최소 4.5초는 기다림 (자연스러운 시스템 로딩 시간)
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 4500 - elapsed);
        
        if (remainingTime > 0) {
          console.log('⏱️ 시스템 안정화 대기:', remainingTime, 'ms');
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        if (!isCleanedUp && !isCompleted) {
          console.log('✅ 모든 시스템 준비 완료');
          handleComplete();
        }
      } catch (error) {
        if (isCleanedUp || isCompleted) return;
        
        // 🔥 안전한 에러 처리
        safeConsoleError('❌ 시스템 로딩 에러', error);
        
        // 에러가 발생해도 자연스럽게 처리
        setTimeout(() => {
          if (!isCleanedUp && !isCompleted) {
            console.log('🔄 에러 후 강제 완료');
            handleComplete();
          }
        }, 1000);
      }
    };

    handleActualLoading();

    // 🔥 1차 안전장치: 6초 후 비상 완료
    const emergencyComplete1 = setTimeout(() => {
      if (!isCompleted) {
        console.log('🚨 6초 후 비상 완료 (1차)');
        handleComplete();
      }
    }, 6000);

    // 🔥 2차 안전장치: 10초 후 최종 강제 완료
    const emergencyComplete2 = setTimeout(() => {
      if (!isCompleted) {
        console.log('🚨 10초 후 최종 강제 완료 (2차)');
        handleComplete();
      }
    }, 10000);

    // 🔥 마우스 클릭으로도 완료 (3초 후부터)
    const enableClickComplete = setTimeout(() => {
      const handleClick = () => {
        if (!isCompleted) {
          console.log('🖱️ 클릭으로 완료');
          handleComplete();
        }
      };
      document.addEventListener('click', handleClick, { once: true });
    }, 3000);

    // 컴포넌트 언마운트 시 정리
    return () => {
      cleanup();
      clearTimeout(emergencyComplete1);
      clearTimeout(emergencyComplete2);
      clearTimeout(enableClickComplete);
    };
  }, [actualLoadingPromise, skipCondition, phase, handleComplete, isCompleted, startTime]);

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

// 🔄 기존 훅과의 호환성을 위한 별칭
export const useMinimumLoadingTime = useNaturalLoadingTime; 