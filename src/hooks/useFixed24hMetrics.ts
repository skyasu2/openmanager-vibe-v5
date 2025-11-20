/**
 * 🎯 24시간 JSON 데이터 + 1분 선형 보간 훅 (v2.0)
 *
 * ✅ 10분 간격 실제 데이터 (Vercel JSON)
 * ✅ 1분 단위 선형 보간 (자연스러운 변화)
 * ✅ 한국 시간(KST) 동기화
 *
 * @see /public/data/servers/hourly/hour-XX.json - 데이터 소스
 * @see src/data/hourly-server-data.ts - 데이터 로더 + 보간 로직
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getServerMetricAt,
  getRecentMetrics,
  getMultipleServerMetrics,
  type InterpolatedMetric,
} from '@/data/hourly-server-data';
import { KST } from '@/lib/time';

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
  const [currentMetrics, setCurrentMetrics] =
    useState<InterpolatedMetric | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // 메트릭 업데이트 함수
  const updateMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const kst = KST.getKST();
      const hour = kst.getUTCHours();
      const minute = kst.getUTCMinutes();

      // 현재 시간의 메트릭 가져오기 (선형 보간 포함)
      const metric = await getServerMetricAt(serverId, hour, minute);

      if (metric) {
        setCurrentMetrics(metric);
        setError(null);

        // 히스토리 데이터 가져오기 (최근 60분, 10분 간격)
        const recentData = await getRecentMetrics(serverId, hour, minute, 60);

        const history: HistoryDataPoint[] = recentData.map((point) => ({
          time: point.timestamp,
          cpu: Math.round(point.cpu * 10) / 10,
          memory: Math.round(point.memory * 10) / 10,
          disk: Math.round(point.disk * 10) / 10,
          network: Math.round(point.network * 10) / 10,
        }));

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
  }, [serverId]); // serverId를 의존성에 추가

  // 초기 로드 및 자동 업데이트
  useEffect(() => {
    isMountedRef.current = true;

    // 초기 로드
    void updateMetrics();

    // 1분마다 자동 업데이트
    const intervalId = setInterval(() => {
      void updateMetrics();
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [serverId, updateInterval, updateMetrics]);

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
  const [metricsMap, setMetricsMap] = useState<Map<string, InterpolatedMetric>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // 메트릭 업데이트 함수
  const updateAllMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const kst = KST.getKST();
      const hour = kst.getUTCHours();
      const minute = kst.getUTCMinutes();

      // 모든 서버 메트릭 병렬로 가져오기
      const newMap = await getMultipleServerMetrics(serverIds, hour, minute);

      setMetricsMap(newMap);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('다중 메트릭 업데이트 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setIsLoading(false);
    }
  }, [serverIds]); // serverIds를 의존성에 추가

  // serverIds.join(',')을 별도 변수로 추출하여 의존성 배열의 복잡도를 줄임
  const serverIdsKey = serverIds.join(',');

  useEffect(() => {
    isMountedRef.current = true;

    // 초기 로드
    void updateAllMetrics();

    // 1분마다 자동 업데이트
    const intervalId = setInterval(() => {
      void updateAllMetrics();
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [serverIdsKey, updateInterval, updateAllMetrics]); // serverIds 배열 변경 시에만 재실행

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
      const kst = KST.getKST();
      const hour = kst.getUTCHours();
      const minute = kst.getUTCMinutes();

      const metric = await getServerMetricAt(serverId, hour, minute);

      if (metric) {
        setValue(Math.round(metric[metricType] * 10) / 10);
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
  }, [serverId, metricType]); // serverId와 metricType을 의존성에 추가

  useEffect(() => {
    isMountedRef.current = true;

    // 초기 로드
    void updateMetric();

    // 1분마다 자동 업데이트
    const intervalId = setInterval(() => {
      void updateMetric();
    }, updateInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [serverId, metricType, updateInterval, updateMetric]);

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
): Promise<InterpolatedMetric | null> {
  try {
    const kst = KST.getKST();
    const hour = kst.getUTCHours();
    const minute = kst.getUTCMinutes();

    return await getServerMetricAt(serverId, hour, minute);
  } catch (error) {
    console.error('현재 메트릭 가져오기 실패:', error);
    return null;
  }
}
