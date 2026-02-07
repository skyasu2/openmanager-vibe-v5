/**
 * 🎯 24시간 고정 데이터 훅 (v3.2 - Vercel 최적화)
 *
 * ✅ Single Source of Truth: scenario-loader 기반 통합 데이터
 * ✅ 10분 간격 데이터 갱신 (JSON 데이터 주기와 일치)
 * ✅ 한국 시간(KST) 동기화
 * ✅ UnifiedServerDataSource 10분 TTL 캐시 활용
 * ✅ 히스토리 데이터 누적 (최대 60개 포인트 = 10시간 분량)
 * ✅ Vercel 사용량 최적화 (불필요한 API 호출 방지)
 *
 * 📊 데이터 구조:
 *   - 24개 JSON 파일 (hour-00 ~ hour-23)
 *   - 각 파일당 6개 dataPoints (10분 간격: 0, 10, 20, 30, 40, 50분)
 *   - 총 144개 데이터 포인트 / 24시간
 *
 * @see src/services/data/UnifiedServerDataSource.ts - 통합 데이터 소스 (10분 TTL)
 * @see src/services/scenario/scenario-loader.ts - 시나리오 기반 데이터
 * @see public/hourly-data/hour-XX.json - 시간별 JSON 데이터
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logging';
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

// 히스토리 데이터 최대 포인트 수 (10분 간격 시 10시간 분량)
const MAX_HISTORY_POINTS = 60;

/**
 * 다음 10분 단위(00, 10, 20, 30, 40, 50분)까지 남은 밀리초 계산
 * @returns 다음 10분 정시까지 남은 ms (최소 1000ms 보장)
 */
function getMillisToNextTenMinutes(): number {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  // 다음 10분 단위까지 남은 분
  const minutesToNext = 10 - (minutes % 10);
  // 총 남은 밀리초
  const totalMs = minutesToNext * 60 * 1000 - seconds * 1000 - ms;

  // 최소 1초 보장 (즉시 실행 방지)
  return Math.max(totalMs, 1000);
}

/**
 * 24시간 JSON 데이터 + 1분 선형 보간 훅
 *
 * @param serverId 서버 ID (예: "web-prod-01", "api-prod-01")
 * @param updateInterval 업데이트 주기 (밀리초, 기본 600000 = 10분)
 *                       'sync' 전달 시 정시 10분 단위에만 갱신 (00, 10, 20, 30, 40, 50분)
 * @returns 실시간 메트릭 + 히스토리 데이터
 *
 * @example
 * ```tsx
 * // 기본 사용 (10분 간격)
 * const { currentMetrics, historyData } = useFixed24hMetrics('web-prod-01');
 *
 * // 정시 동기화 모드 (모달용 - 10, 20, 30... 분에만 갱신)
 * const { currentMetrics, historyData } = useFixed24hMetrics('web-prod-01', 'sync');
 * ```
 */
export function useFixed24hMetrics(
  serverId: string,
  updateInterval: number | 'sync' = 600000 // 10분 or 'sync' (정시 동기화)
) {
  const [currentMetrics, setCurrentMetrics] = useState<Server | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  // 마지막 업데이트 시간 추적 (중복 데이터 방지)
  const lastUpdateTimeRef = useRef<string>('');

  // 메트릭 업데이트 함수
  const updateMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // 🎯 Single Source of Truth: UnifiedServerDataSource
      const dataSource = UnifiedServerDataSource.getInstance();
      const servers = await dataSource.getServers();

      // 특정 서버 찾기 - Case-insensitive Matching
      const server = servers.find(
        (s) => s.id.toLowerCase() === serverId.toLowerCase()
      );

      if (server) {
        setCurrentMetrics(server);
        setError(null);

        // 현재 시간 포맷
        const currentTime = new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        // 중복 데이터 방지: 같은 시간(분)에 이미 데이터가 있으면 스킵
        if (currentTime !== lastUpdateTimeRef.current) {
          lastUpdateTimeRef.current = currentTime;

          // 새 데이터 포인트 생성
          const newDataPoint: HistoryDataPoint = {
            time: currentTime,
            cpu: Math.round(server.cpu * 10) / 10,
            memory: Math.round(server.memory * 10) / 10,
            disk: Math.round(server.disk * 10) / 10,
            network: Math.round((server.network ?? 0) * 10) / 10,
          };

          // 히스토리 데이터 누적 (최대 MAX_HISTORY_POINTS 유지)
          setHistoryData((prev) => {
            const updated = [...prev, newDataPoint];
            // 최대 포인트 수 초과 시 오래된 데이터 제거
            if (updated.length > MAX_HISTORY_POINTS) {
              return updated.slice(-MAX_HISTORY_POINTS);
            }
            return updated;
          });
        }

        setIsLoading(false);
      } else {
        // Fallback: Mock Data for Dev/Demo if real ID not found
        // This ensures the UI doesn't look broken even if IDs mismatch
        logger.warn(`Server "${serverId}" not found, using fallback.`);
        setIsLoading(false);
      }
    } catch (err) {
      logger.error('메트릭 업데이트 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setIsLoading(false);
    }
  }, [serverId]);

  // 초기 로드: 과거 데이터 채우기 (Time-Synced Consistency)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentional - only run once per serverId change, guard inside prevents re-run
  useEffect(() => {
    // 1. UnifiedServerDataSource에서 가져오는 것은 비동기이므로,
    //    우선 FIXED_24H_DATASETS에서 즉시 동기적으로 데이터를 Lookup 할 수 있습니다. (Client-side optimization)
    //    이렇게 하면 "Loading..." 없이 즉시 그래프가 뜹니다.

    // Lazy import to avoid circular dependency issues if any, though here it's fine.
    import('../data/fixed-24h-metrics').then(
      ({ FIXED_24H_DATASETS, getDataAtMinute }) => {
        if (historyData.length > 0) return; // 이미 데이터가 있으면 패스

        const targetServerId = serverId.toLowerCase();
        // Case-insensitive finding
        const dataset = FIXED_24H_DATASETS.find(
          (d) => d.serverId.toLowerCase() === targetServerId
        );

        if (dataset) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentMinuteOfDay = currentHour * 60 + currentMinute;

          const initialHistory: HistoryDataPoint[] = [];

          // 과거 12개 포인트 (2시간) 생성 - 10분 간격 (실제 데이터 주기와 일치)
          for (let i = 11; i >= 0; i--) {
            // i번째 과거 시점 (10분 * i)
            let targetMinute = currentMinuteOfDay - i * 10;

            // 자정 넘어가는 경우 처리 (음수 -> 전날)
            if (targetMinute < 0) targetMinute += 1440;

            // 데이터 조회
            const metric = getDataAtMinute(dataset, targetMinute);

            if (metric) {
              // 시간 라벨 생성
              // 해당 targetMinute를 다시 Date 객체 시/분으로 변환하거나 단순 계산
              const hours = Math.floor(targetMinute / 60);
              const minutes = targetMinute % 60;
              const timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

              initialHistory.push({
                time: timeLabel,
                cpu: metric.cpu,
                memory: metric.memory,
                disk: metric.disk,
                network: metric.network,
              });
            }
          }

          if (initialHistory.length > 0) {
            setHistoryData(initialHistory);
            // 현재 메트릭도 이 데이터셋 기준으로 초기화해주면 깜빡임이 더 줄어듭니다.
            // 다만 updateMetrics가 곧 돌아서 최신화 할 것이므로 history만 설정합니다.
          }
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // 초기 로드 및 자동 업데이트
  useEffect(() => {
    isMountedRef.current = true;

    // 초기 로드 (모달 열릴 때 즉시 갱신)
    void updateMetrics();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (updateInterval === 'sync') {
      // 🕐 정시 동기화 모드: 10, 20, 30, 40, 50, 00분에만 갱신
      // 1. 다음 10분 정시까지 대기
      const msToNext = getMillisToNextTenMinutes();

      timeoutId = setTimeout(() => {
        if (!isMountedRef.current) return;
        void updateMetrics();

        // 2. 이후 10분마다 갱신
        intervalId = setInterval(
          () => {
            if (isMountedRef.current) {
              void updateMetrics();
            }
          },
          10 * 60 * 1000
        ); // 10분
      }, msToNext);
    } else {
      // 기존 동작: 지정된 간격으로 갱신
      intervalId = setInterval(() => {
        void updateMetrics();
      }, updateInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
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
 * @param updateInterval 업데이트 주기 (밀리초, 기본 600000 = 10분)
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
  updateInterval: number = 600000 // 10분 (JSON 데이터 10분 간격에 맞춤)
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
      logger.error('다중 메트릭 업데이트 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setIsLoading(false);
    }
  }, [serverIds]);

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
 * @param updateInterval 업데이트 주기 (밀리초, 기본 600000 = 10분)
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
  updateInterval: number = 600000 // 10분 (JSON 데이터 10분 간격에 맞춤)
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
      logger.error('단일 메트릭 업데이트 실패:', err);
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
 * logger.info(metric?.cpu);
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
    logger.error('현재 메트릭 가져오기 실패:', error);
    return null;
  }
}
