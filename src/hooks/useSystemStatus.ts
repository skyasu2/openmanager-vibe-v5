/**
 * 🎯 스마트 시스템 상태 관리 훅 (정적 최적화)
 *
 * @description
 * 모니터링 오버헤드 없이 정적 설정만으로 무료 한도 내에서
 * 안전하게 운영되는 시스템 상태 관리
 *
 * @features
 * - 정적 최적화 기반 폴링 간격 (5분)
 * - 시간대별 동적 간격 조정
 * - 모니터링 비활성화 모드 지원
 * - API 호출 최소화
 */

import { staticOptimizer } from '@/lib/smart-free-tier-config';
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
  // 🎯 스마트 최적화: 정적 설정 기반 폴링 간격
  const baseInterval = staticOptimizer.getOptimizedInterval('SYSTEM_STATUS');
  const smartInterval = staticOptimizer.getTimeBasedInterval(baseInterval);

  const { autoStart = true } = options;

  console.log(
    `🎯 스마트 최적화 - useSystemStatus 폴링 간격: ${smartInterval / 1000}초 (모니터링 비활성화: ${staticOptimizer.isMonitoringDisabled()})`
  );

  const [status, setStatus] = useState<SystemStatus>({
    isRunning: false,
    isStarting: false,
    lastUpdate: new Date().toISOString(),
    userCount: 0,
    version: '5.44.3',
    environment: 'production',
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
      // 🚫 모니터링 비활성화 모드에서는 정적 상태 반환
      if (staticOptimizer.isMonitoringDisabled()) {
        const staticStatus: SystemStatus = {
          isRunning: true,
          isStarting: false,
          lastUpdate: new Date().toISOString(),
          userCount: 1,
          version: '5.44.3',
          environment: 'production',
          uptime: Date.now(),
          services: {
            database: true,
            cache: true,
            ai: true,
          },
        };

        setStatus(staticStatus);
        setError(null);
        setIsLoading(false);
        return staticStatus;
      }

      // 실제 API 호출 (모니터링 활성화 시에만)
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

      const systemStatus: SystemStatus = {
        isRunning: data.isRunning || data.systemActive || true,
        isStarting: data.isStarting || data.systemStarting || false,
        lastUpdate: data.lastUpdate || new Date().toISOString(),
        userCount: data.userCount || 1,
        version: data.version || '5.44.3',
        environment: data.environment || 'production',
        uptime: data.uptime || Date.now(),
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

  // 시스템 시작 함수
  const startSystem = useCallback(async (): Promise<boolean> => {
    try {
      setStatus(prev => ({ ...prev, isStarting: true }));

      // 모니터링 비활성화 시 즉시 성공 반환
      if (staticOptimizer.isMonitoringDisabled()) {
        setStatus(prev => ({ ...prev, isStarting: false, isRunning: true }));
        return true;
      }

      // 실제 시스템 시작 API 호출
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

  // 🎯 스마트 폴링 간격 적용
  useEffect(() => {
    if (smartInterval > 0) {
      const interval = setInterval(() => {
        if (!status.isStarting) {
          checkStatus();
        }
      }, smartInterval);

      return () => clearInterval(interval);
    }
  }, [checkStatus, smartInterval, status.isStarting]);

  // 포커스 시 즉시 업데이트 (선택적)
  useEffect(() => {
    const handleFocus = () => {
      if (!staticOptimizer.isMonitoringDisabled()) {
        checkStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkStatus]);

  return {
    status,
    isLoading,
    error,
    refresh,
    startSystem,
  };
};
