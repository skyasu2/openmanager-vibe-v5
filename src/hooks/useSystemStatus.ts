/**
 * 🔄 시스템 상태 동기화 훅
 * 전역 상태 관리 및 동기화
 */

import { useState, useEffect, useCallback } from 'react';

interface SystemStatus {
  isActive: boolean;
  isWarmupActive: boolean;
  isWarmupCompleted: boolean;
  isPythonWarm: boolean;
  lastUpdate: Date | null;
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    isActive: false,
    isWarmupActive: false,
    isWarmupCompleted: false,
    isPythonWarm: false,
    lastUpdate: null
  });

  const [isLoading, setIsLoading] = useState(true);

  const checkSystemStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. 웜업 상태 확인
      const warmupResponse = await fetch('/api/system/start-warmup');
      let warmupActive = false;
      let warmupCompleted = false;

      if (warmupResponse.ok) {
        const warmupData = await warmupResponse.json();
        warmupActive = warmupData.warmup_status?.active || false;
        warmupCompleted = warmupData.warmup_status?.completed || false;
      }

      // 2. 전체 시스템 상태 확인
      const statusResponse = await fetch('/api/status');
      let isActive = false;
      let isPythonWarm = false;

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        isActive = statusData.isActive || false;
        isPythonWarm = statusData.python?.isWarm || false;
      }

      // 상태 업데이트
      setStatus({
        isActive: isActive || warmupActive || warmupCompleted,
        isWarmupActive: warmupActive,
        isWarmupCompleted: warmupCompleted,
        isPythonWarm,
        lastUpdate: new Date()
      });

      console.log('🔄 시스템 상태 업데이트:', {
        isActive: isActive || warmupActive || warmupCompleted,
        warmupActive,
        warmupCompleted,
        isPythonWarm
      });

    } catch (error) {
      console.warn('⚠️ 시스템 상태 확인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 페이지 로드시 상태 확인
  useEffect(() => {
    checkSystemStatus();
  }, [checkSystemStatus]);

  // 주기적 상태 확인 (5초마다)
  useEffect(() => {
    const interval = setInterval(checkSystemStatus, 5000);
    return () => clearInterval(interval);
  }, [checkSystemStatus]);

  return {
    status,
    isLoading,
    refresh: checkSystemStatus
  };
} 