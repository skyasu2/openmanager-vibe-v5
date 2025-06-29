/**
 * 🎬 useSequentialLoadingTime Hook v2.1 - 호환성 개선
 *
 * 순차적 로딩 단계를 시뮬레이션하는 훅
 * - 프론트엔드 구성 90% 유지
 * - 실제 시스템과의 호환성 문제 해결
 * - 자연스러운 단계별 진행
 *
 * @param onComplete - 완료 시 호출될 콜백 함수
 * @param skipCondition - 스킵 조건
 */

import { useState, useEffect, useCallback } from 'react';

interface UseSequentialLoadingTimeProps {
  onComplete?: () => void;
  skipCondition?: boolean;
}

interface LoadingStage {
  name: string;
  duration: number;
  description: string;
}

export const useSequentialLoadingTime = ({
  onComplete,
  skipCondition = false,
}: UseSequentialLoadingTimeProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // 로딩 단계 정의 (기존 구성 유지)
  const stages: LoadingStage[] = [
    { name: 'system-init', duration: 1500, description: '시스템 초기화 중...' },
    { name: 'data-loading', duration: 1200, description: '데이터 로딩 중...' },
    { name: 'ai-warmup', duration: 800, description: 'AI 엔진 준비 중...' },
    { name: 'finalizing', duration: 500, description: '완료 중...' },
  ];

  // 완료 처리 함수
  const handleComplete = useCallback(() => {
    if (!isCompleted) {
      console.log('🎯 useSequentialLoadingTime 완료');
      setIsCompleted(true);
      setIsLoading(false);
      setProgress(100);
      setCurrentStage(stages.length);

      setTimeout(() => {
        try {
          onComplete?.();
        } catch (error) {
          console.error('❌ onComplete 콜백 에러:', error);
        }
      }, 100);
    }
  }, [isCompleted, onComplete, stages.length]);

  // 스킵 조건 처리
  useEffect(() => {
    if (skipCondition && !isCompleted) {
      console.log('⚡ 순차 로딩 스킵');
      handleComplete();
      return;
    }
  }, [skipCondition, isCompleted, handleComplete]);

  // 키보드 스킵 기능
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isCompleted) {
        console.log(`🚀 ${e.key} 키로 순차 로딩 스킵`);
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleComplete, isCompleted]);

  // 순차적 로딩 로직
  useEffect(() => {
    if (skipCondition || isCompleted) return;

    console.log('🎬 순차적 로딩 시작');

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    let isCleanedUp = false;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };

    const runStage = (stageIndex: number) => {
      if (isCleanedUp || isCompleted || stageIndex >= stages.length) {
        handleComplete();
        return;
      }

      const stage = stages[stageIndex];
      console.log(`📊 ${stage.name} 단계 시작: ${stage.description}`);
      setCurrentStage(stageIndex);

      const startTime = Date.now();
      const baseProgress = (stageIndex / stages.length) * 100;
      const stageProgressRange = 100 / stages.length;

      // 단계별 진행률 업데이트
      intervalId = setInterval(() => {
        if (isCleanedUp) return;

        const elapsed = Date.now() - startTime;
        const stageProgress = Math.min(elapsed / stage.duration, 1);
        const totalProgress = baseProgress + stageProgress * stageProgressRange;

        setProgress(Math.round(totalProgress));

        if (stageProgress >= 1) {
          clearInterval(intervalId);
          // 다음 단계로 진행
          timeoutId = setTimeout(() => runStage(stageIndex + 1), 100);
        }
      }, 50);
    };

    // 첫 번째 단계 시작
    runStage(0);

    // 안전장치: 최대 5초 후 강제 완료
    const safetyTimer = setTimeout(() => {
      if (!isCompleted) {
        console.log('⏰ 순차 로딩 타임아웃 - 강제 완료');
        handleComplete();
      }
    }, 5000);

    return () => {
      cleanup();
      clearTimeout(safetyTimer);
    };
  }, [skipCondition, isCompleted, handleComplete, stages]);

  // 클릭으로 스킵 (2초 후 활성화)
  useEffect(() => {
    const enableSkipTimer = setTimeout(() => {
      const handleClick = () => {
        if (!isCompleted) {
          console.log('👆 클릭으로 순차 로딩 스킵');
          handleComplete();
        }
      };

      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }, 2000);

    return () => clearTimeout(enableSkipTimer);
  }, [handleComplete, isCompleted]);

  return {
    isLoading,
    progress,
    currentStage: currentStage < stages.length ? stages[currentStage] : null,
    stageDescription:
      currentStage < stages.length ? stages[currentStage].description : '완료',
    totalStages: stages.length,
    currentStageIndex: currentStage,
  };
};
