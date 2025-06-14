/**
 * 🎬 useSequentialLoadingTime Hook v3.0 - 90% 일관성 보장
 *
 * 순차적 단계별 로딩 시스템
 * - 90% 일관성 원칙 적용
 * - 각 단계별 명확한 진행률 (0→20→50→75→90→100)
 * - 90% 이후 빠른 완료 (500ms 이내)
 * - 사용자 제어 옵션 (스킵 기능)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { safeErrorLog } from '../lib/error-handler';

export interface LoadingStage {
  id: string;
  name: string;
  description: string;
  duration: number;
  icon: string;
  color: string;
  bgGradient: string;
  progress: {
    start: number;
    end: number;
  };
}

// 🎯 90% 일관성을 위한 정규화된 로딩 단계
const LOADING_STAGES: LoadingStage[] = [
  {
    id: 'system-initialization',
    name: '시스템 초기화',
    description: '코어 시스템 모듈을 로딩하고 있습니다...',
    duration: 2500,
    icon: '⚙️',
    color: 'text-blue-400',
    bgGradient: 'from-blue-600 to-cyan-600',
    progress: { start: 0, end: 20 },
  },
  {
    id: 'data-collection',
    name: '데이터 수집',
    description: '실시간 서버 메트릭과 성능 지표를 수집하고 있습니다...',
    duration: 2000,
    icon: '📊',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-600 to-green-600',
    progress: { start: 20, end: 50 },
  },
  {
    id: 'ai-engine-warmup',
    name: 'AI 엔진 최적화',
    description: '인공지능 분석 엔진과 패턴 인식 모델을 준비하고 있습니다...',
    duration: 1500,
    icon: '🧠',
    color: 'text-green-400',
    bgGradient: 'from-green-600 to-purple-600',
    progress: { start: 50, end: 75 },
  },
  {
    id: 'server-spawning',
    name: '서버 생성',
    description: '가상 서버 인스턴스를 생성하고 있습니다...',
    duration: 1000,
    icon: '🚀',
    color: 'text-purple-400',
    bgGradient: 'from-purple-600 to-pink-600',
    progress: { start: 75, end: 90 },
  },
  {
    id: 'finalization',
    name: '최종 준비',
    description: '대시보드 인터페이스를 준비하고 있습니다...',
    duration: 500, // 90% 이후 빠른 완료
    icon: '✨',
    color: 'text-pink-400',
    bgGradient: 'from-pink-600 to-orange-600',
    progress: { start: 90, end: 100 },
  },
];

interface UseSequentialLoadingTimeProps {
  onComplete?: () => void;
  skipCondition?: boolean;
  autoStart?: boolean;
}

interface SequentialLoadingState {
  currentStage: LoadingStage | null;
  stageProgress: number;
  overallProgress: number;
  isCompleted: boolean;
  stageIndex: number;
  totalStages: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  canSkip: boolean;
}

export const useSequentialLoadingTime = ({
  onComplete,
  skipCondition = false,
  autoStart = true,
}: UseSequentialLoadingTimeProps): SequentialLoadingState => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // 현재 단계 정보
  const currentStage = LOADING_STAGES[currentStageIndex] || null;

  // 전체 진행률 계산 (90% 일관성 적용)
  const overallProgress = useMemo(() => {
    if (!currentStage) return 0;

    const { start, end } = currentStage.progress;
    const normalizedProgress = start + (stageProgress / 100) * (end - start);

    // 90% 이후 빠른 진행을 위한 가속
    if (normalizedProgress >= 90) {
      const acceleratedProgress = 90 + (normalizedProgress - 90) * 2;
      return Math.min(acceleratedProgress, 100);
    }

    return Math.round(normalizedProgress * 10) / 10; // 소수점 1자리로 정규화
  }, [currentStage, stageProgress]);

  // 예상 남은 시간 계산 (90% 일관성 기반)
  const estimatedTimeRemaining = useMemo(() => {
    if (isCompleted || !currentStage) return 0;

    const remainingInCurrentStage =
      currentStage.duration * (1 - stageProgress / 100);
    const remainingStages = LOADING_STAGES.slice(currentStageIndex + 1);

    // 90% 이후 단계들은 시간을 단축하여 계산
    const remainingStagesTime = remainingStages.reduce((sum, stage) => {
      const adjustedDuration = stage.progress.start >= 90 ? stage.duration * 0.5 : stage.duration;
      return sum + adjustedDuration;
    }, 0);

    return remainingInCurrentStage + remainingStagesTime;
  }, [currentStage, stageProgress, currentStageIndex, isCompleted]);

  // 🎯 확실한 완료 처리 함수 (중복 호출 방지)
  const handleComplete = useCallback(() => {
    if (!isCompleted) {
      console.log('🎉 순차적 로딩 시퀀스 완료 (90% 일관성)');
      setIsCompleted(true);

      // 90% 일관성을 위해 즉시 콜백 실행
      setTimeout(() => {
        try {
          onComplete?.();
        } catch (error) {
          safeErrorLog('❌ onComplete 콜백 에러', error);
        }
      }, 100); // 매우 짧은 지연으로 즉시 실행
    }
  }, [isCompleted, onComplete]);

  // 스킵 조건 체크
  useEffect(() => {
    if (skipCondition) {
      console.log('⚡ 순차적 로딩 스킵 - 즉시 완료');
      handleComplete();
    }
  }, [skipCondition, handleComplete]);

  // 키보드 단축키 (Enter, Space, Escape)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'Escape'].includes(e.key) && canSkip && !isCompleted) {
        console.log(`🚀 ${e.key} 키로 로딩 스킵`);
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canSkip, isCompleted, handleComplete]);

  // 2초 후 스킵 활성화 (90% 일관성을 위해 단축)
  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
      console.log('✨ 2초 경과 - 스킵 기능 활성화');
    }, 2000);

    return () => clearTimeout(skipTimer);
  }, []);

  // 시간 추적
  useEffect(() => {
    if (!isStarted || isCompleted) return;

    const timeInterval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(timeInterval);
  }, [isStarted, isCompleted, startTime]);

  // 🎬 90% 일관성 순차적 단계 진행 로직
  useEffect(() => {
    if (!autoStart || skipCondition || isCompleted) return;

    console.log('🎬 90% 일관성 순차적 로딩 시작');
    setIsStarted(true);

    let progressInterval: NodeJS.Timeout | undefined;
    let stageTimer: NodeJS.Timeout | undefined;
    let isCleanedUp = false;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;

      if (progressInterval) clearInterval(progressInterval);
      if (stageTimer) clearTimeout(stageTimer);
    };

    // 현재 단계 진행률 업데이트 (매 50ms로 부드러운 애니메이션)
    const updateStageProgress = () => {
      const stage = LOADING_STAGES[currentStageIndex];
      if (!stage || isCompleted) return;

      const stageStartTime = Date.now();

      progressInterval = setInterval(() => {
        if (isCompleted || isCleanedUp) return;

        const elapsed = Date.now() - stageStartTime;
        const progress = Math.min((elapsed / stage.duration) * 100, 100);

        setStageProgress(progress);

        // 단계 완료 시 다음 단계로 전환
        if (progress >= 100) {
          if (progressInterval) clearInterval(progressInterval);

          if (currentStageIndex < LOADING_STAGES.length - 1) {
            console.log(`📊 ${stage.name} 완료 → 다음 단계`);
            setCurrentStageIndex(prev => prev + 1);
            setStageProgress(0);
          } else {
            // 마지막 단계 완료 - 90% 일관성을 위해 빠른 완료
            console.log('🎯 모든 단계 완료 - 즉시 완료');
            handleComplete();
          }
        }
      }, 50);
    };

    updateStageProgress();

    // 안전장치: 최대 8초 후 강제 완료
    stageTimer = setTimeout(() => {
      if (!isCompleted) {
        console.log('⏰ 타임아웃 - 강제 완료');
        handleComplete();
      }
    }, 8000);

    return cleanup;
  }, [autoStart, skipCondition, isCompleted, currentStageIndex, handleComplete]);

  // 전역 개발자 도구 등록
  useEffect(() => {
    (window as any).debugSequentialLoading = {
      currentStage: currentStage?.name,
      stageProgress,
      overallProgress,
      isCompleted,
      canSkip,
      elapsedTime,
    };

    (window as any).skipSequentialLoading = () => {
      console.log('🚨 순차 로딩 강제 스킵');
      handleComplete();
    };
  }, [currentStage, stageProgress, overallProgress, isCompleted, canSkip, elapsedTime, handleComplete]);

  return {
    currentStage,
    stageProgress: Math.round(stageProgress * 10) / 10,
    overallProgress,
    isCompleted,
    stageIndex: currentStageIndex,
    totalStages: LOADING_STAGES.length,
    elapsedTime,
    estimatedTimeRemaining,
    canSkip,
  };
};
