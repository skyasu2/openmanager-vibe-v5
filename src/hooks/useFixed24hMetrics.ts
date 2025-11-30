/**
 * 🎯 24시간 고정 데이터 훅 (v3.0 - UnifiedServerDataSource)
 *
 * ✅ Single Source of Truth: scenario-loader 기반 통합 데이터
 * ✅ 5분 간격 고정 데이터 (선형 보간 제거)
 * ✅ 한국 시간(KST) 동기화
 * ✅ UnifiedServerDataSource 캐시 활용
 *
 * @see src/services/data/UnifiedServerDataSource.ts - 통합 데이터 소스
 * @see src/services/scenario/scenario-loader.ts - 시나리오 기반 데이터
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { UnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';
import type { Server } from '@/types/server';

/**
 * 히스토리 데이터 포인트 (차트용)
 */
export interface HistoryDataPoint {
  time: string; // "HH:MM"
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

/**
 * 24시간 JSON 데이터 + 1분 선형 보간 훅
 *
 * @param serverId 서버 ID (예: "web-prod-01", "api-prod-01")
 * @param updateInterval 업데이트 주기 (밀리초, 기본 60000 = 1분)
 * @returns 실시간 메트릭 + 히스토리 데이터
 *
 * @example
 * ```tsx
 * const { currentMetrics, historyData, isLoading, error } = useFixed24hMetrics('web-prod-01');
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 *
 * return (
 *   <div>
 *     <p>CPU: {currentMetrics?.cpu}%</p>
 *     <p>Status: {currentMetrics?.status}</p>
 *     <p>{currentMetrics?.isInterpolated ? '보간값' : '실제값'}</p>
 *   </div>
 * );
 * ```
 */
export function useFixed24hMetrics(
  serverId: string,
  updateInterval: number = 60000
) {
  const [currentMetrics, setCurrentMetrics] = useState<Server | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // 메트릭 업데이트 함수
  const updateMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // 🎯 Single Source of Truth: UnifiedServerDataSource
      const dataSource = UnifiedServerDataSource.getInstance();
      const servers = await dataSource.getServers();

      // 특정 서버 찾기
      const server = servers.find((s) => s.id === serverId);

      if (server) {
        setCurrentMetrics(server);
        setError(null);

        // 히스토리 데이터는 현재 시점의 스냅샷만 제공
        // (5분 간격 데이터이므로 실시간 변화 추적)
        const history: HistoryDataPoint[] = [
          {
            time: new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            cpu: Math.round(server.cpu * 10) / 10,
            memory: Math.round(server.memory * 10) / 10,
            disk: Math.round(server.disk * 10) / 10,
            network: Math.round((server.network ?? 0) * 10) / 10,
          },
        ];

        setHistoryData(history);
        setIsLoading(false);
      } else {
        setError(`서버 "${serverId}" 데이터를 찾을 수 없습니다.`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('메트릭 업데이트 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setIsLoading(false);
    }
  }, [serverId]);

  // 초기 로드 및 자동 업데이트
  useEffect(() => {
    isMountedRef.current = true;

    // 초기 로드
    void updateMetrics();

    // 자동 업데이트 (기본 1분)
    const intervalId = setInterval(() => {
      void updateMetrics();
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [updateInterval, updateMetrics]);

  return {
    currentMetrics,
    historyData,
    isLoading,
    error,
    refreshMetrics: updateMetrics,
  };
}

/**
 * 여러 서버의 메트릭을 동시에 가져오는 훅
 *
 * @param serverIds 서버 ID 배열 (예: ["web-prod-01", "api-prod-01", "db-prod-01"])
 * @param updateInterval 업데이트 주기 (밀리초, 기본 60000 = 1분)
 * @returns 서버별 실시간 메트릭 맵
 *
 * @example
 * ```tsx
 * const { metricsMap, isLoading, error } = useMultipleFixed24hMetrics([
 *   'web-prod-01',
 *   'api-prod-01',
 *   'db-prod-01'
 * ]);
 *
 * const webMetric = metricsMap.get('web-prod-01');
 * ```
 */
export function useMultipleFixed24hMetrics(
  serverIds: string[],
  updateInterval: number = 60000
) {
  const [metricsMap, setMetricsMap] = useState<Map<string, Server>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // 메트릭 업데이트 함수
  const updateAllMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // 🎯 Single Source of Truth: UnifiedServerDataSource
      const dataSource = UnifiedServerDataSource.getInstance();
      const servers = await dataSource.getServers();

      // 요청된 서버 ID만 필터링하여 Map 생성
      const newMap = new Map<string, Server>();
      for (const serverId of serverIds) {
        const server = servers.find((s) => s.id === serverId);
        if (server) {
          newMap.set(serverId, server);
        }
      }

      setMetricsMap(newMap);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('다중 메트릭 업데이트 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setIsLoading(false);
    }
  }, [serverIds]);

  // serverIds.join(',')을 별도 변수로 추출하여 의존성 배열의 복잡도를 줄임
  const _serverIdsKey = serverIds.join(',');

  useEffect(() => {
    isMountedRef.current = true;

    // 초기 로드
    void updateAllMetrics();

    // 자동 업데이트
    const intervalId = setInterval(() => {
      void updateAllMetrics();
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [updateInterval, updateAllMetrics]);

  return {
    metricsMap,
    isLoading,
    error,
    getMetric: (serverId: string) => metricsMap.get(serverId),
    refreshMetrics: updateAllMetrics,
  };
}

/**
 * 특정 메트릭 타입만 가져오는 훅
 *
 * @param serverId 서버 ID
 * @param metricType 메트릭 타입
 * @param updateInterval 업데이트 주기 (밀리초, 기본 60000 = 1분)
 * @returns 단일 메트릭 값
 *
 * @example
 * ```tsx
 * const cpuValue = useSingleMetric('web-prod-01', 'cpu');
 * ```
 */
export function useSingleMetric(
  serverId: string,
  metricType: 'cpu' | 'memory' | 'disk' | 'network',
  updateInterval: number = 60000
) {
  const [value, setValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const updateMetric = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // 🎯 Single Source of Truth: UnifiedServerDataSource
      const dataSource = UnifiedServerDataSource.getInstance();
      const servers = await dataSource.getServers();

      const server = servers.find((s) => s.id === serverId);

      if (server) {
        const value = server[metricType] ?? 0;
        setValue(Math.round(value * 10) / 10);
        setError(null);
        setIsLoading(false);
      } else {
        setError(`서버 "${serverId}" 데이터를 찾을 수 없습니다.`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('단일 메트릭 업데이트 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setIsLoading(false);
    }
  }, [serverId, metricType]);

  useEffect(() => {
    isMountedRef.current = true;

    // 초기 로드
    void updateMetric();

    // 자동 업데이트
    const intervalId = setInterval(() => {
      void updateMetric();
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [updateInterval, updateMetric]);

  return { value, isLoading, error };
}

/**
 * 현재 시간의 서버 메트릭 가져오기 (훅 외부에서 사용)
 *
 * @param serverId 서버 ID
 * @returns 현재 메트릭 또는 null
 *
 * @example
 * ```tsx
 * const metric = await getFixedMetricNow('web-prod-01');
 * console.log(metric?.cpu);
 * ```
 */
export async function getFixedMetricNow(
  serverId: string
): Promise<Server | null> {
  try {
    // 🎯 Single Source of Truth: UnifiedServerDataSource
    const dataSource = UnifiedServerDataSource.getInstance();
    const servers = await dataSource.getServers();

    return servers.find((s) => s.id === serverId) || null;
  } catch (error) {
    console.error('현재 메트릭 가져오기 실패:', error);
    return null;
  }
}
