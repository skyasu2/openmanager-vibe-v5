/**
 * 🔄 페이지 갱신 기반 시스템 상태 훅
 *
 * @description
 * 실시간 폴링 없이 페이지 이벤트 기반으로만 상태를 확인합니다.
 * - 페이지 로드 시
 * - 페이지 포커스 시 (다른 탭에서 돌아올 때)
 * - 페이지 가시성 변경 시 (탭 전환)
 * - 수동 새로고침 시
 *
 * @features
 * - Redis 기반 상태 공유
 * - 30분 카운트다운 타이머
 * - 익명 사용자 ID 관리
 * - 자동 사용자 활동 추적
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SystemState {
  isRunning: boolean;
  startedBy: string;
  startTime: number;
  endTime: number;
  activeUsers: number;
  lastActivity: number;
  version: string;
  environment: string;
}

export interface UseSystemStateReturn {
  systemState: SystemState | null;
  isLoading: boolean;
  error: string | null;
  userId: string;
  refreshState: () => Promise<void>;
  startSystem: () => Promise<boolean>;
  stopSystem: () => Promise<boolean>;
}

// 익명 사용자 ID 생성
const generateAnonymousId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 기본 시스템 상태
const getDefaultState = (): SystemState => ({
  isRunning: false,
  startedBy: '',
  startTime: 0,
  endTime: 0,
  activeUsers: 0,
  lastActivity: Date.now(),
  version: '5.44.4',
  environment: 'unknown',
});

export const useSystemState = (): UseSystemStateReturn => {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState(() => {
    // 브라우저 환경에서만 localStorage 사용
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('openmanager-user-id');
      if (stored) return stored;

      const newId = generateAnonymousId();
      localStorage.setItem('openmanager-user-id', newId);
      return newId;
    }
    return generateAnonymousId();
  });

  // 중복 요청 방지를 위한 ref
  const isRequestingRef = useRef(false);

  /**
   * 🔍 시스템 상태 확인 함수
   */
  const fetchSystemState = useCallback(
    async (source: string = 'manual'): Promise<SystemState | null> => {
      // 중복 요청 방지
      if (isRequestingRef.current) {
        console.log('⏸️ 이미 요청 중이므로 스킵');
        return systemState;
      }

      try {
        isRequestingRef.current = true;
        setError(null);

        const url = `/api/system/status?userId=${encodeURIComponent(userId)}&source=${encodeURIComponent(source)}`;

        console.log(`🔄 시스템 상태 요청 - 소스: ${source}`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
          },
          cache: 'no-store', // 캐시 비활성화
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.state) {
          setSystemState(data.state);
          console.log(
            `✅ 상태 업데이트 - 실행중: ${data.state.isRunning}, 사용자: ${data.state.activeUsers}명`
          );
          return data.state;
        } else {
          throw new Error(data.error || '상태 조회 실패');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '알 수 없는 오류';
        setError(errorMessage);
        console.error(`❌ 시스템 상태 확인 실패 (${source}):`, errorMessage);

        // 오류 시 기본 상태 설정
        const defaultState = getDefaultState();
        setSystemState(defaultState);
        return defaultState;
      } finally {
        isRequestingRef.current = false;
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId] // systemState 제거 - 무한 루프 방지
  );

  /**
   * 🔄 수동 새로고침 - fetchSystemState 로직 직접 구현
   */
  const refreshState = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    // fetchSystemState 로직 직접 구현
    const source = 'manual-refresh';
    
    // 중복 요청 방지
    if (isRequestingRef.current) {
      console.log('⏸️ 이미 요청 중이므로 스킵');
      return;
    }

    try {
      isRequestingRef.current = true;
      setError(null);

      const url = `/api/system/status?userId=${encodeURIComponent(userId)}&source=${encodeURIComponent(source)}`;

      console.log(`🔄 시스템 상태 요청 - 소스: ${source}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        cache: 'no-store', // 캐시 비활성화
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.state) {
        setSystemState(data.state);
        console.log(
          `✅ 상태 업데이트 - 실행중: ${data.state.isRunning}, 사용자: ${data.state.activeUsers}명`
        );
      } else {
        throw new Error(data.error || '상태 조회 실패');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error(`❌ 시스템 상태 확인 실패 (${source}):`, errorMessage);

      // 오류 시 기본 상태 설정
      const defaultState = getDefaultState();
      setSystemState(defaultState);
    } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
    }
  }, [userId]); // ✅ fetchSystemState 함수 의존성 제거하여 순환 의존성 해결

  /**
   * 🚀 시스템 시작
   */
  const startSystem = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(
        `🚀 시스템 시작 요청 - 사용자: ${userId.substring(0, 12)}...`
      );

      const response = await fetch('/api/system/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          action: 'start',
          userId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`시스템 시작 실패: HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.state) {
        setSystemState(result.state);
        console.log(
          `✅ 시스템 시작 완료 - 종료 예정: ${new Date(result.state.endTime).toLocaleString()}`
        );
        return true;
      } else {
        throw new Error(result.error || '시스템 시작 실패');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '시스템 시작 실패';
      setError(errorMessage);
      console.error('❌ 시스템 시작 실패:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * 🛑 시스템 중지
   */
  const stopSystem = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(
        `🛑 시스템 중지 요청 - 사용자: ${userId.substring(0, 12)}...`
      );

      const response = await fetch('/api/system/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          action: 'stop',
          userId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`시스템 중지 실패: HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.state) {
        setSystemState(result.state);
        console.log(`✅ 시스템 중지 완료`);
        return true;
      } else {
        throw new Error(result.error || '시스템 중지 실패');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '시스템 중지 실패';
      setError(errorMessage);
      console.error('❌ 시스템 중지 실패:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * 🎯 초기 로드 시에만 상태 확인 - 이벤트 기반 자동 체크 제거
   */
  useEffect(() => {
    // 초기 상태 확인만 수행
    void fetchSystemState('page-load');

    // 🚨 페이지 포커스/가시성 이벤트 리스너 제거 - 과도한 API 호출 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 변경 - 마운트 시 한 번만 실행

  return {
    systemState,
    isLoading,
    error,
    userId,
    refreshState,
    startSystem,
    stopSystem,
  };
};
