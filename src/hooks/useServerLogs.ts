/**
 * 📝 useServerLogs - 서버 로그 조회 훅
 *
 * Supabase server_logs 테이블에서 실시간 로그 조회
 * - 폴링 기반 업데이트 (기본 10초)
 * - 레벨 필터링 지원
 * - 자동 정리 (화면에서 나갈 때)
 *
 * @refactored 2026-01-03 - 새로 생성
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

export interface ServerLog {
  id: string;
  server_id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

interface UseServerLogsOptions {
  /** 폴링 간격 (ms), 0이면 폴링 비활성화 */
  pollingInterval?: number;
  /** 조회할 로그 개수 */
  limit?: number;
  /** 로그 레벨 필터 */
  levels?: ('info' | 'warn' | 'error')[];
}

interface UseServerLogsReturn {
  /** 로그 목록 */
  logs: ServerLog[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: string | null;
  /** 총 로그 수 */
  total: number;
  /** 수동 새로고침 */
  refresh: () => Promise<void>;
  /** 로그 추가 */
  addLog: (
    level: 'info' | 'warn' | 'error',
    message: string,
    source?: string
  ) => Promise<void>;
}

export function useServerLogs(
  serverId: string,
  options: UseServerLogsOptions = {}
): UseServerLogsReturn {
  const { pollingInterval = 10000, limit = 50, levels } = options;

  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // 로그 조회
  const fetchLogs = useCallback(async () => {
    if (!serverId) return;

    try {
      const params = new URLSearchParams({
        server_id: serverId,
        limit: limit.toString(),
      });

      if (levels && levels.length > 0) {
        params.set('levels', levels.join(','));
      }

      const response = await fetch(`/api/logs?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs);
        setTotal(result.data.total);
        setError(null);
      } else {
        // 테이블이 없는 경우 빈 배열로 처리 (마이그레이션 전)
        if (result.details?.includes('does not exist')) {
          setLogs([]);
          setTotal(0);
          setError(null);
        } else {
          setError(result.error || '로그 조회 실패');
        }
      }
    } catch (err) {
      // 네트워크 에러 등은 조용히 처리
      console.warn('[useServerLogs] 로그 조회 실패:', err);
      setLogs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [serverId, limit, levels]);

  // 로그 추가
  const addLog = useCallback(
    async (
      level: 'info' | 'warn' | 'error',
      message: string,
      source = 'system'
    ) => {
      if (!serverId) return;

      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server_id: serverId,
            level,
            message,
            source,
          }),
        });

        // 추가 후 새로고침
        await fetchLogs();
      } catch (err) {
        console.error('[useServerLogs] 로그 추가 실패:', err);
      }
    },
    [serverId, fetchLogs]
  );

  // 초기 로드
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 폴링
  useEffect(() => {
    if (pollingInterval <= 0) return;

    const interval = setInterval(fetchLogs, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval, fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    total,
    refresh: fetchLogs,
    addLog,
  };
}

/**
 * 📝 서버 로그 추가 유틸리티 함수
 *
 * 컴포넌트 외부에서 로그를 추가할 때 사용
 */
export async function addServerLog(
  serverId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  source = 'system',
  context?: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        server_id: serverId,
        level,
        message,
        source,
        context,
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (err) {
    console.error('[addServerLog] 로그 추가 실패:', err);
    return false;
  }
}
