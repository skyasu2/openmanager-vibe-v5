'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMockConfig } from '@/config/mock-config';
import {
  timeRotationService,
  type TimeOfDayPattern,
  type TimeRotationState,
} from '@/services/time/TimeRotationService';

/**
 * 🕐 시간 회전 React Hook
 * 
 * TimeRotationService와 연동하여 React 컴포넌트에서
 * 24시간 데이터 회전 시스템을 사용할 수 있게 해줍니다.
 * 
 * 30초 실제 시간 = 1시간 시뮬레이션
 */
export interface UseTimeRotationReturn {
  // 현재 시간 상태
  timeState: TimeRotationState;
  
  // 포맷된 시간 정보
  formattedTime: {
    time: string;
    label: string;
    cycle: number;
    progress: string;
  };
  
  // 현재 시간대 패턴
  currentPattern: TimeOfDayPattern;
  
  // 다음 시간대 패턴
  upcomingPattern: TimeOfDayPattern;
  
  // 메트릭 배율
  metricMultipliers: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    alert: number;
  };
  
  // 제어 함수들
  startRotation: () => void;
  pauseRotation: () => void;
  resumeRotation: () => void;
  stopRotation: () => void;
  jumpToHour: (hour: number) => void;
  
  // 상태 확인
  isActive: boolean;
  isPaused: boolean;
}

/**
 * 🕐 useTimeRotation Hook
 * 
 * 사용 예시:
 * ```tsx
 * const { 
 *   formattedTime, 
 *   metricMultipliers, 
 *   startRotation,
 *   isActive 
 * } = useTimeRotation();
 * 
 * // 시간 표시
 * <div>{formattedTime.time} ({formattedTime.label})</div>
 * 
 * // 메트릭에 시간대별 배율 적용
 * const adjustedCpu = baseCpu * metricMultipliers.cpu;
 * ```
 */
export function useTimeRotation(): UseTimeRotationReturn {
  const [timeState, setTimeState] = useState<TimeRotationState>(
    timeRotationService.getState()
  );
  const mockEnabled = getMockConfig().enabled;
  
  // TimeRotationService 구독
  useEffect(() => {
    if (!mockEnabled) {
      // Mock 비활성 시, 구독/업데이트로 인한 리렌더를 막기 위해 noop 처리
      return;
    }
    const unsubscribe = timeRotationService.subscribe((state) => {
      setTimeState(state);
    });
    // 초기 상태 설정
    setTimeState(timeRotationService.getState());
    return unsubscribe;
  }, [mockEnabled]);
  
  // 포맷된 시간 정보 계산
  const formattedTime = timeRotationService.getFormattedTime();
  
  // 현재 시간대 패턴
  const currentPattern = timeRotationService.getCurrentTimePattern();
  
  // 다음 시간대 패턴
  const upcomingPattern = timeRotationService.getUpcomingPattern();
  
  // 메트릭 배율
  const metricMultipliers = timeRotationService.getMetricMultipliers();
  
  // 제어 함수들
  const startRotation = useCallback(() => {
    if (mockEnabled) timeRotationService.start();
  }, [mockEnabled]);
  
  const pauseRotation = useCallback(() => {
    if (mockEnabled) timeRotationService.pause();
  }, [mockEnabled]);
  
  const resumeRotation = useCallback(() => {
    if (mockEnabled) timeRotationService.resume();
  }, [mockEnabled]);
  
  const stopRotation = useCallback(() => {
    if (mockEnabled) timeRotationService.stop();
  }, [mockEnabled]);
  
  const jumpToHour = useCallback((hour: number) => {
    if (mockEnabled) timeRotationService.jumpToHour(hour);
  }, [mockEnabled]);
  
  return {
    timeState,
    formattedTime,
    currentPattern,
    upcomingPattern,
    metricMultipliers,
    startRotation,
    pauseRotation,
    resumeRotation,
    stopRotation,
    jumpToHour,
    isActive: timeState.isActive,
    isPaused: timeState.isPaused,
  };
}

/**
 * 🎯 시간대별 서버 메트릭 계산 유틸리티 훅
 * 
 * 기본 메트릭에 시간대별 배율을 적용하여 
 * 현실적인 서버 사용량 패턴을 시뮬레이션합니다.
 */
export function useTimeBasedMetrics(baseMetrics: {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}) {
  const { metricMultipliers, formattedTime } = useTimeRotation();
  
  return {
    // 시간대별 배율이 적용된 메트릭
    adjustedMetrics: {
      cpu: Math.round(Math.min(100, baseMetrics.cpu * metricMultipliers.cpu)),
      memory: Math.round(Math.min(100, baseMetrics.memory * metricMultipliers.memory)),
      disk: Math.round(Math.min(100, baseMetrics.disk * metricMultipliers.disk)),
      network: Math.round(Math.min(100, baseMetrics.network * metricMultipliers.network)),
    },
    
    // 알림 발생 확률
    alertProbability: metricMultipliers.alert,
    
    // 시간 정보
    timeInfo: formattedTime,
    
    // 배율 정보
    multipliers: metricMultipliers,
  };
}

/**
 * 🎮 시간 제어 컴포넌트용 훅
 * 
 * 관리자가 시간을 제어할 수 있는 UI를 위한 훅
 */
export function useTimeControl() {
  const { 
    timeState, 
    formattedTime, 
    currentPattern,
    startRotation,
    pauseRotation,
    resumeRotation,
    stopRotation,
    jumpToHour,
    isActive,
    isPaused 
  } = useTimeRotation();
  
  // 프리셋 시간대 점프
  const jumpToPresets = {
    morning: () => jumpToHour(8),     // 오전 8시 (업무시작)
    peak: () => jumpToHour(15),       // 오후 3시 (최대피크)
    evening: () => jumpToHour(19),    // 저녁 7시 (저녁시간)
    night: () => jumpToHour(2),       // 새벽 2시 (백업시간)
  };
  
  // 시간 제어 상태
  const controlState = {
    canStart: !isActive,
    canPause: isActive && !isPaused,
    canResume: isActive && isPaused,
    canStop: isActive,
  };
  
  // 시간대 정보 (UI 표시용)
  const timeDisplay = {
    current: `${formattedTime.time} (${currentPattern.label})`,
    cycle: `Day ${formattedTime.cycle}`,
    progress: formattedTime.progress,
    status: isActive 
      ? (isPaused ? '일시정지' : '실행중') 
      : '중지됨',
  };
  
  return {
    timeState,
    timeDisplay,
    controlState,
    actions: {
      start: startRotation,
      pause: pauseRotation,
      resume: resumeRotation,
      stop: stopRotation,
      jumpToHour,
      jumpToPresets,
    },
  };
}
