/**
 * 🎬 useSequentialLoadingTime Hook v2.0
 * 
 * 순차적 단계별 로딩 시스템
 * - 병렬 처리 제거로 명확한 순차 진행
 * - 각 단계별 충분한 시간 (3초씩) 보장
 * - 시각적 피드백 강화
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

const LOADING_STAGES: LoadingStage[] = [
  {
    id: 'system-initialization',
    name: '시스템 초기화',
    description: '코어 시스템 모듈을 로딩하고 있습니다...',
    duration: 3000,
    icon: '⚙️',
    color: 'text-blue-400',
    bgGradient: 'from-blue-600 to-cyan-600',
    progress: { start: 0, end: 20 }
  },
  {
    id: 'data-collection',
    name: '데이터 수집',
    description: '서버 메트릭과 상태 정보를 수집하고 있습니다...',
    duration: 3000,
    icon: '📊',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-600 to-green-600',
    progress: { start: 20, end: 50 }
  },
  {
    id: 'ai-engine-warmup',
    name: 'AI 엔진 웜업',
    description: '인공지능 분석 엔진을 준비하고 있습니다...',
    duration: 2500,
    icon: '🧠',
    color: 'text-green-400',
    bgGradient: 'from-green-600 to-purple-600',
    progress: { start: 50, end: 75 }
  },
  {
    id: 'server-spawning',
    name: '서버 생성',
    description: '가상 서버 인스턴스를 생성하고 있습니다...',
    duration: 2000,
    icon: '🚀',
    color: 'text-purple-400',
    bgGradient: 'from-purple-600 to-pink-600',
    progress: { start: 75, end: 95 }
  },
  {
    id: 'finalization',
    name: '최종 준비',
    description: '대시보드 인터페이스를 준비하고 있습니다...',
    duration: 1500,
    icon: '✨',
    color: 'text-pink-400',
    bgGradient: 'from-pink-600 to-orange-600',
    progress: { start: 95, end: 100 }
  }
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
  autoStart = true
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
  
  // 전체 진행률 계산
  const overallProgress = useMemo(() => {
    if (!currentStage) return 0;
    return currentStage.progress.start + (stageProgress / 100) * (currentStage.progress.end - currentStage.progress.start);
  }, [currentStage, stageProgress]);

  // 예상 남은 시간 계산
  const estimatedTimeRemaining = useMemo(() => {
    if (isCompleted || !currentStage) return 0;
    
    const remainingInCurrentStage = currentStage.duration * (1 - stageProgress / 100);
    const remainingStages = LOADING_STAGES.slice(currentStageIndex + 1);
    const remainingStagesTime = remainingStages.reduce((sum, stage) => sum + stage.duration, 0);
    
    return remainingInCurrentStage + remainingStagesTime;
  }, [currentStage, stageProgress, currentStageIndex, isCompleted]);

  // 🎯 완료 처리 함수 (중복 호출 방지)
  const handleComplete = useCallback(() => {
    if (!isCompleted) {
      console.log('🎉 순차적 로딩 시퀀스 완료');
      setIsCompleted(true);
      
      // 0.3초 후 콜백 실행으로 자연스러운 전환
      setTimeout(() => {
        try {
          onComplete?.();
        } catch (error) {
          safeErrorLog('❌ onComplete 콜백 에러', error);
        }
      }, 300);
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

  // 3초 후 스킵 활성화
  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
      console.log('✨ 3초 경과 - 스킵 기능 활성화');
    }, 3000);

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

  // 🎬 순차적 단계 진행 로직 (병렬 처리 방지)
  useEffect(() => {
    if (!autoStart || isCompleted || !currentStage) return;
    
    if (!isStarted) {
      setIsStarted(true);
      console.log('🎬 순차적 로딩 시퀀스 시작');
    }

    console.log(`🎯 ${currentStage.name} 단계 시작 (${currentStage.duration}ms)`);
    console.log(`📋 ${currentStage.description}`);
    
    const stageStartTime = Date.now();
    let animationFrame: number;
    
    const updateStageProgress = () => {
      const elapsed = Date.now() - stageStartTime;
      const progress = Math.min((elapsed / currentStage.duration) * 100, 100);
      
      setStageProgress(progress);
      
      if (progress >= 100) {
        // 현재 단계 완료
        console.log(`✅ ${currentStage.name} 단계 완료`);
        
        if (currentStageIndex < LOADING_STAGES.length - 1) {
          // 다음 단계로 이동 (0.5초 지연으로 자연스러운 전환)
          setTimeout(() => {
            setCurrentStageIndex(prev => prev + 1);
            setStageProgress(0);
          }, 500);
        } else {
          // 모든 단계 완료
          console.log('🎉 모든 순차적 로딩 단계 완료');
          setTimeout(() => {
            handleComplete();
          }, 500);
        }
      } else {
        // 부드러운 진행률 업데이트 (60fps)
        animationFrame = requestAnimationFrame(updateStageProgress);
      }
    };
    
    updateStageProgress();
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [currentStageIndex, isCompleted, handleComplete, autoStart, currentStage, isStarted]);

  // 전역 디버깅 함수 등록
  useEffect(() => {
    (window as any).debugSequentialLoading = {
      currentStage: currentStage?.name,
      stageProgress,
      overallProgress,
      stageIndex: currentStageIndex,
      totalStages: LOADING_STAGES.length,
      elapsedTime,
      estimatedTimeRemaining,
      canSkip,
      isCompleted
    };

    (window as any).emergencyCompleteSequential = () => {
      console.log('🚨 순차적 로딩 비상 완료');
      handleComplete();
    };
  }, [currentStage, stageProgress, overallProgress, currentStageIndex, elapsedTime, estimatedTimeRemaining, canSkip, isCompleted, handleComplete]);

  return {
    currentStage,
    stageProgress,
    overallProgress,
    isCompleted,
    stageIndex: currentStageIndex,
    totalStages: LOADING_STAGES.length,
    elapsedTime,
    estimatedTimeRemaining,
    canSkip
  };
}; 