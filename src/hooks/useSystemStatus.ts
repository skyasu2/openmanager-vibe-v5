/**
 * 🔄 다중 사용자 시스템 상태 관리 훅
 *
 * @description
 * 여러 사용자가 동시 접속할 때 시스템 상태를 실시간으로 공유합니다.
 * 기존 코드 구조를 최대한 보존하면서 상태 체크 로직만 추가합니다.
 *
 * @features
 * - Redis 기반 상태 공유
 * - 30초 주기 자동 상태 체크
 * - 시스템 시작/정지 상태 추적
 * - 여러 사용자간 상태 동기화
 */

import {
  getCurrentPollingInterval,
  getOptimizedConfig,
} from '@/config/vercel-optimization';
import { useCallback, useEffect, useState } from 'react';

export interface SystemStatus {
  isRunning: boolean;
  isStarting: boolean;
  lastUpdate: string;
  userCount?: number;
  version?: string;
  environment?: string;
  uptime?: number;
  services?: {
    database: boolean;
    cache: boolean;
    ai: boolean;
  };
}

interface UseSystemStatusOptions {
  pollingInterval?: number;
  autoStart?: boolean;
}

interface UseSystemStatusReturn {
  status: SystemStatus;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startSystem: () => Promise<boolean>;
}

export const useSystemStatus = (
  options: UseSystemStatusOptions = {}
): UseSystemStatusReturn => {
  const config = getOptimizedConfig();
  const baseInterval = options.pollingInterval || 30000;

  // 🚀 Vercel 최적화: 스마트 폴링 간격 적용
  const optimizedInterval = config.USE_SMART_POLLING
    ? getCurrentPollingInterval(config.SYSTEM_STATUS)
    : baseInterval;

  const { autoStart = true } = options;

  console.log(
    `⚡ useSystemStatus 폴링 간격: ${optimizedInterval / 1000}초 (최적화: ${config.USE_SMART_POLLING ? 'ON' : 'OFF'})`
  );

  const [status, setStatus] = useState<SystemStatus>({
    isRunning: false,
    isStarting: false,
    lastUpdate: new Date().toISOString(),
    userCount: 0,
    version: '5.44.3',
    environment: 'unknown',
    uptime: 0,
    services: {
      database: true,
      cache: true,
      ai: true,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 시스템 상태 체크 함수
  const checkStatus = useCallback(async (): Promise<SystemStatus | null> => {
    try {
      const response = await fetch('/api/system/state', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 기존 API 구조 활용하면서 새 필드 추가
      const systemStatus: SystemStatus = {
        isRunning: data.isRunning || data.systemActive || false,
        isStarting: data.isStarting || data.systemStarting || false,
        lastUpdate: data.lastUpdate || new Date().toISOString(),
        userCount: data.userCount || 1,
        version: data.version || '5.44.3',
        environment: data.environment || 'unknown',
        uptime: data.uptime || 0,
        services: data.services || {
          database: true,
          cache: true,
          ai: true,
        },
      };

      setStatus(systemStatus);
      setError(null);
      console.log('🔄 시스템 상태 업데이트:', systemStatus);

      return systemStatus;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error('❌ 시스템 상태 체크 실패:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 수동 새로고침
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await checkStatus();
  }, [checkStatus]);

  // 시스템 시작 함수 (기존 로직 활용)
  const startSystem = useCallback(async (): Promise<boolean> => {
    try {
      setStatus(prev => ({ ...prev, isStarting: true }));

      // 기존 시스템 시작 API 호출
      const response = await fetch('/api/system/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          initiatedBy: 'user',
        }),
      });

      if (!response.ok) {
        throw new Error(`시스템 시작 실패: HTTP ${response.status}`);
      }

      const result = await response.json();

      // 즉시 상태 체크하여 업데이트
      await checkStatus();

      return result.success || true;
    } catch (err) {
      console.error('❌ 시스템 시작 실패:', err);
      setStatus(prev => ({ ...prev, isStarting: false }));
      setError(err instanceof Error ? err.message : '시스템 시작 실패');
      return false;
    }
  }, [checkStatus]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    if (autoStart) {
      checkStatus();
    }
  }, [checkStatus, autoStart]);

  // 주기적 상태 체크 - 정상 폴링 복원
  useEffect(() => {
    if (optimizedInterval > 0) {
      const interval = setInterval(() => {
        if (!status.isStarting) {
          checkStatus();
        }
      }, optimizedInterval);

      return () => clearInterval(interval);
    }
  }, [checkStatus, optimizedInterval, status.isStarting]);

  // 페이지 포커스 시 상태 체크
  useEffect(() => {
    const handleFocus = () => {
      if (!document.hidden && !status.isStarting) {
        checkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkStatus, status.isStarting]);

  return {
    status,
    isLoading,
    error,
    refresh,
    startSystem,
  };
};
