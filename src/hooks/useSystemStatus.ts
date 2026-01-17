'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logging';

// 🔧 깊은 비교 함수 (불필요한 리렌더링 방지)
function isStatusEqual(
  a: SystemStatus | null,
  b: SystemStatus | null
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.isRunning === b.isRunning &&
    a.isStarting === b.isStarting &&
    a.userCount === b.userCount &&
    a.uptime === b.uptime &&
    a.version === b.version &&
    a.environment === b.environment
  );
}

export interface SystemStatus {
  isRunning: boolean;
  isStarting: boolean;
  lastUpdate: string;
  userCount: number;
  version: string;
  environment: string;
  uptime: number; // 초 단위
  services?: {
    database: boolean;
    cache: boolean;
    ai: boolean;
  };
}

export interface UseSystemStatusReturn {
  status: SystemStatus | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startSystem: () => Promise<void>;
}

export function useSystemStatus(): UseSystemStatusReturn {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFocusRefresh, setLastFocusRefresh] = useState<number>(0);
  const statusRef = useRef<SystemStatus | null>(null); // 🔧 비교용 ref

  // 🔧 상태 업데이트 최적화: 변경된 경우만 setState 호출
  const updateStatusIfChanged = useCallback((newStatus: SystemStatus) => {
    if (!isStatusEqual(statusRef.current, newStatus)) {
      statusRef.current = newStatus;
      setStatus(newStatus);
    }
  }, []);

  const _fetchStatus = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/api/system');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // API 응답을 SystemStatus 형태로 변환
      const systemStatus: SystemStatus = {
        isRunning: data.isRunning || false,
        isStarting: data.isStarting || false,
        lastUpdate: data.lastUpdate || new Date().toISOString(),
        userCount: data.activeUsers || data.userCount || 0, // activeUsers 우선 사용
        version: data.version || process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
        environment:
          data.environment ||
          process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ||
          'development',
        uptime: data.uptime || 0,
        services: {
          database: data.services?.database ?? true,
          cache: data.services?.cache ?? true,
          ai: data.services?.ai ?? true,
        },
      };

      setStatus(systemStatus);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '시스템 상태를 가져올 수 없습니다';
      setError(errorMessage);
      logger.error('시스템 상태 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '시스템 상태 조회 실패';
      setError(errorMessage);
      logger.error('시스템 상태 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // 함수 의존성 제거하여 React Error #310 해결

  const startSystem = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/api/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      if (!response.ok) {
        throw new Error(`시스템 시작 실패: ${response.statusText}`);
      }

      // 시스템 시작 후 상태 새로고침 - 인라인 구현
      const statusResponse = await fetch('/api/system');
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setStatus(data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '시스템 시작에 실패했습니다';
      setError(errorMessage);
      logger.error('시스템 시작 실패:', err);
    }
  }, []); // fetchStatus 의존성 제거하여 React Error #310 해결

  // 초기 로드 및 주기적 업데이트 - 인라인 구현
  useEffect(() => {
    const abortController = new AbortController();

    const performFetch = async () => {
      try {
        const response = await fetch('/api/system', {
          signal: abortController.signal, // AbortController로 fetch 취소 가능
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        // 🔧 불필요한 리렌더링 방지: 상태가 변경된 경우만 업데이트
        updateStatusIfChanged(data);
        setError(null);
      } catch (err) {
        // AbortError는 무시 (정상적인 cleanup)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : '시스템 상태 조회 실패';
        setError(errorMessage);
        logger.error('시스템 상태 조회 실패:', err);
      } finally {
        setIsLoading(false); // 🔧 누락된 setIsLoading(false) 추가 - 시스템 초기화중 상태 해결
      }
    };

    // 초기 로드
    void performFetch();

    // 30초마다 상태 업데이트 - 실시간성과 성능 균형
    const interval = setInterval(() => {
      void performFetch();
    }, 30000); // 🎯 300초 → 30초로 개선 (실시간 상태 동기화)

    return () => {
      clearInterval(interval);
      abortController.abort(); // 🔧 컴포넌트 unmount 시 진행 중인 fetch 취소
    };
  }, [updateStatusIfChanged]); // 🔧 최적화 함수 의존성 추가

  // 페이지 포커스 시 상태 새로고침 (2분 throttle) - 인라인 구현
  useEffect(() => {
    const abortController = new AbortController();

    const handleFocus = () => {
      if (!document.hidden) {
        const now = Date.now();
        // 2분(120초) 이내 중복 호출 방지
        if (now - lastFocusRefresh > 120000) {
          setLastFocusRefresh(now);
          // 인라인 상태 조회 함수
          void (async () => {
            try {
              const response = await fetch('/api/system', {
                signal: abortController.signal, // AbortController로 fetch 취소 가능
              });
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }

              const data = await response.json();
              // 🔧 불필요한 리렌더링 방지
              updateStatusIfChanged(data);
              setError(null);
            } catch (err) {
              // AbortError는 무시 (정상적인 cleanup)
              if (err instanceof Error && err.name === 'AbortError') {
                return;
              }
              const errorMessage =
                err instanceof Error ? err.message : '시스템 상태 조회 실패';
              setError(errorMessage);
              logger.error('시스템 상태 조회 실패:', err);
            } finally {
              setIsLoading(false); // 🔧 누락된 setIsLoading(false) 추가 - 포커스 시에도 로딩 상태 해제
            }
          })();
        }
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      abortController.abort(); // 🔧 컴포넌트 unmount 시 진행 중인 fetch 취소
    };
  }, [lastFocusRefresh, updateStatusIfChanged]); // 🔧 최적화 함수 의존성 추가

  return {
    status,
    isLoading,
    error,
    refresh,
    startSystem,
  };
}
