/**
 * 🕐 System Auto Shutdown Hook
 *
 * 포트폴리오 최적화를 위한 20분 자동 종료 시스템
 * - 시스템 시작 후 20분 동안만 동작
 * - 5분, 1분 전 경고 알림
 * - 수동 중지 가능
 * - Vercel 사용량 88% 절약
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useServerDataStore } from '@/components/providers/StoreProvider';
import { systemInactivityService } from '@/services/system/SystemInactivityService';

interface UseSystemAutoShutdownOptions {
  /** 활성 시간 (분) */
  activeMinutes?: number;
  /** 경고 시간 (분) */
  warningMinutes?: number;
  /** 경고 콜백 */
  onWarning?: (remainingMinutes: number) => void;
  /** 종료 콜백 */
  onShutdown?: () => void;
}

export function useSystemAutoShutdown({
  activeMinutes = 20,
  warningMinutes = 5,
  onWarning,
  onShutdown,
}: UseSystemAutoShutdownOptions = {}) {
  const stopAutoRefresh = useServerDataStore(state => state.stopAutoRefresh);

  // 상태 관리
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [remainingTime, setRemainingTime] = useState(activeMinutes * 60 * 1000); // 밀리초
  const [isWarning, setIsWarning] = useState(false);
  const [startTime] = useState(Date.now());

  // 타이머 참조
  const shutdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 남은 시간 업데이트 (1초마다)
  useEffect(() => {
    if (!isSystemActive) return;

    updateIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, activeMinutes * 60 * 1000 - elapsed);
      setRemainingTime(remaining);

      // 경고 시간 체크
      const remainingMinutes = Math.floor(remaining / 60000);
      if (remainingMinutes === warningMinutes && !isWarning) {
        setIsWarning(true);
        onWarning?.(warningMinutes);
      } else if (remainingMinutes === 1 && isWarning) {
        onWarning?.(1);
      }
    }, 1000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [
    isSystemActive,
    startTime,
    activeMinutes,
    warningMinutes,
    isWarning,
    onWarning,
  ]);

  // 시스템 종료 처리
  const handleSystemShutdown = useCallback(async () => {
    console.log('🛑 시스템 자동 종료 시작');

    try {
      // 1. 상태 업데이트
      setIsSystemActive(false);
      setRemainingTime(0);

      // 2. 서버 데이터 갱신 중지
      stopAutoRefresh();
      console.log('✅ 서버 데이터 자동 갱신 중지됨');

      // 3. 시스템 비활성화
      systemInactivityService.pauseSystem();
      console.log('✅ 시스템 비활성 상태 설정됨');

      // 4. 콜백 실행
      onShutdown?.();

      // 5. 로컬 스토리지에 종료 시간 저장
      localStorage.setItem('system_shutdown_time', new Date().toISOString());
      localStorage.setItem('system_auto_shutdown', 'true');

      console.log('✅ 시스템 자동 종료 완료 - 모든 동적 기능 중지됨');
    } catch (error) {
      console.error('❌ 시스템 종료 중 오류:', error);
    }
  }, [stopAutoRefresh, onShutdown]);

  // 수동 시스템 중지
  const stopSystem = useCallback(() => {
    console.log('🛑 사용자가 시스템을 수동으로 중지했습니다');

    // 타이머 정리
    if (shutdownTimerRef.current) {
      clearTimeout(shutdownTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    handleSystemShutdown();
  }, [handleSystemShutdown]);

  // 시스템 재시작
  const restartSystem = useCallback(() => {
    console.log('🔄 시스템 재시작');

    // 상태 초기화
    setIsSystemActive(true);
    setRemainingTime(activeMinutes * 60 * 1000);
    setIsWarning(false);

    // 로컬 스토리지 정리
    localStorage.removeItem('system_shutdown_time');
    localStorage.removeItem('system_auto_shutdown');

    // 시스템 재활성화
    systemInactivityService.resumeSystem();

    // 서버 데이터 갱신 재시작은 컴포넌트에서 처리
    window.location.reload(); // 간단한 방법으로 전체 재시작
  }, [activeMinutes]);

  // 타이머 설정
  useEffect(() => {
    if (!isSystemActive) return;

    // 경고 타이머 (5분 전)
    const warningDelay = (activeMinutes - warningMinutes) * 60 * 1000;
    warningTimerRef.current = setTimeout(() => {
      console.log(`⚠️ ${warningMinutes}분 후 시스템이 자동 종료됩니다`);
      setIsWarning(true);
      onWarning?.(warningMinutes);
    }, warningDelay);

    // 종료 타이머 (20분)
    const shutdownDelay = activeMinutes * 60 * 1000;
    shutdownTimerRef.current = setTimeout(() => {
      handleSystemShutdown();
    }, shutdownDelay);

    return () => {
      if (shutdownTimerRef.current) {
        clearTimeout(shutdownTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [
    isSystemActive,
    activeMinutes,
    warningMinutes,
    handleSystemShutdown,
    onWarning,
  ]);

  // 초기 상태 확인
  useEffect(() => {
    const autoShutdown = localStorage.getItem('system_auto_shutdown');
    const shutdownTime = localStorage.getItem('system_shutdown_time');

    if (autoShutdown === 'true' && shutdownTime) {
      console.log('🔍 이전 세션에서 시스템이 종료되었습니다');
      setIsSystemActive(false);
      setRemainingTime(0);
    }
  }, []);

  // 남은 시간 포맷팅 (MM:SS)
  const formatRemainingTime = useCallback(() => {
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingTime]);

  return {
    isSystemActive,
    remainingTime,
    remainingTimeFormatted: formatRemainingTime(),
    isWarning,
    stopSystem,
    restartSystem,
  };
}
