/* eslint-disable prefer-const */
import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseNaturalLoadingTimeProps {
  actualLoadingPromise?: Promise<any> | null;
  skipCondition?: boolean; // 스킵 조건
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  estimatedTimeRemaining: number;
  phase: 'system-starting' | 'data-loading' | 'python-warmup' | 'completed';
  elapsedTime: number;
}

/**
 * 🎬 useNaturalLoadingTime Hook
 * 
 * 실제 시스템 가동 시간을 자연스럽게 반영하는 로딩 훅
 * - 시스템 초기화 (파이썬 엔진 가동)
 * - 데이터 로딩 (서버 목록, 메트릭)
 * - 최종 준비 완료
 * 
 * @param actualLoadingPromise - 실제 데이터 로딩 Promise
 * @param skipCondition - 스킵 조건 (URL 파라미터 등)
 */
export const useNaturalLoadingTime = ({
  actualLoadingPromise = null,
  skipCondition = false
}: UseNaturalLoadingTimeProps): LoadingState => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<LoadingState['phase']>('system-starting');
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

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

  // 자연스러운 로딩 로직
  useEffect(() => {
    if (skipCondition) return;

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
        if (!isCleanedUp) {
          console.log('📊 데이터 로딩 단계 시작');
          setPhase('data-loading');
        }
      }, 2000);

      // 3.5초 후: 파이썬 웜업 단계  
      setTimeout(() => {
        if (!isCleanedUp) {
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

        if (!isCleanedUp) {
          console.log('🎉 전체 시스템 로딩 완료');
          setProgress(100);
          setPhase('completed');
          
          // 완료 애니메이션을 위한 짧은 딜레이
          setTimeout(() => {
            if (!isCleanedUp) {
              setIsLoading(false);
            }
          }, 300);
        }
      } catch (error) {
        if (isCleanedUp) return;
        
        console.error('❌ 시스템 로딩 에러:', error);
        
        // 에러가 발생해도 자연스럽게 처리
        setTimeout(() => {
          if (!isCleanedUp) {
            setProgress(100);
            setPhase('completed');
            setIsLoading(false);
          }
        }, 1000);
      }
    };

    handleActualLoading();

    // 컴포넌트 언마운트 시 정리
    return cleanup;
  }, [actualLoadingPromise, skipCondition, startTime, phase]);

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