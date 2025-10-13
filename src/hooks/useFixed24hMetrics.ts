/**
 * 🎯 24시간 고정 데이터 + 1분 미세 변동 훅
 *
 * 10분 고정 데이터 위에 1분마다 ±2-3% 미세 변동 추가
 * 한국 시간(KST) 동기화
 */

import { useState, useEffect, useRef } from 'react';
import {
  getServer24hData,
  getDataAtMinute,
  getRecentData,
  type Server24hDataset,
  type Fixed10MinMetric,
} from '@/data/fixed-24h-metrics';
import { getKSTMinuteOfDay, getKST10MinSlotStart } from '@/utils/kst-time';

/**
 * 1분 단위 실시간 메트릭 (미세 변동 포함)
 */
export interface RealtimeMetric {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: number; // KST minuteOfDay
  isFixed: boolean; // 고정 데이터 여부
}

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
 * 고정 데이터 위에 미세 변동 추가 (±2-3%)
 */
function addMicroVariation(baseValue: number, maxVariation: number = 2.5): number {
  const variation = (Math.random() - 0.5) * maxVariation * 2; // ±2.5%
  const newValue = baseValue + variation;
  return Math.max(0, Math.min(100, Math.round(newValue * 10) / 10));
}

/**
 * 미세 변동이 적용된 실시간 메트릭 생성
 */
function applyMicroVariation(fixedData: Fixed10MinMetric): RealtimeMetric {
  return {
    cpu: addMicroVariation(fixedData.cpu),
    memory: addMicroVariation(fixedData.memory),
    disk: addMicroVariation(fixedData.disk),
    network: addMicroVariation(fixedData.network),
    timestamp: getKSTMinuteOfDay(),
    isFixed: false,
  };
}

/**
 * 24시간 고정 데이터 + 1분 미세 변동 훅
 *
 * @param serverId 서버 ID (예: "WEB-01")
 * @param updateInterval 업데이트 주기 (밀리초, 기본 60000 = 1분)
 * @returns 실시간 메트릭 + 히스토리 데이터
 */
export function useFixed24hMetrics(serverId: string, updateInterval: number = 60000) {
  const [currentMetrics, setCurrentMetrics] = useState<RealtimeMetric | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [dataset, setDataset] = useState<Server24hDataset | null>(null);
  const isMountedRef = useRef(true);

  // 서버 데이터셋 로드
  useEffect(() => {
    isMountedRef.current = true;
    const serverDataset = getServer24hData(serverId);

    if (serverDataset) {
      setDataset(serverDataset);

      // 초기 데이터 로드
      updateMetrics(serverDataset);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [serverId]);

  // 메트릭 업데이트 함수
  const updateMetrics = (serverDataset: Server24hDataset) => {
    if (!isMountedRef.current) return;

    const currentMinute = getKSTMinuteOfDay();
    const slotStart = getKST10MinSlotStart();

    // 현재 10분 슬롯의 고정 데이터 가져오기
    const fixedData = getDataAtMinute(serverDataset, slotStart);

    if (fixedData) {
      // 고정 데이터에 미세 변동 추가
      const realtimeData = applyMicroVariation(fixedData);
      setCurrentMetrics(realtimeData);

      // 히스토리 데이터 업데이트 (최근 10분, 1분 간격)
      const recentData = getRecentData(serverDataset, currentMinute, 11); // 11개 = 10분 + 현재
      const history: HistoryDataPoint[] = recentData.reverse().map((point) => ({
        time: `${Math.floor(point.minuteOfDay / 60)
          .toString()
          .padStart(2, '0')}:${(point.minuteOfDay % 60).toString().padStart(2, '0')}`,
        cpu: point.cpu,
        memory: point.memory,
        disk: point.disk,
        network: point.network,
      }));

      setHistoryData(history);
    }
  };

  // 1분마다 자동 업데이트
  useEffect(() => {
    if (!dataset) return;

    const intervalId = setInterval(() => {
      updateMetrics(dataset);
    }, updateInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [dataset, updateInterval]);

  return {
    currentMetrics,
    historyData,
    dataset,
    refreshMetrics: () => dataset && updateMetrics(dataset),
  };
}

/**
 * 여러 서버의 메트릭을 동시에 가져오는 훅
 *
 * @param serverIds 서버 ID 배열
 * @returns 서버별 실시간 메트릭 맵
 */
export function useMultipleFixed24hMetrics(serverIds: string[]) {
  const [metricsMap, setMetricsMap] = useState<Map<string, RealtimeMetric>>(new Map());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const updateAllMetrics = () => {
      if (!isMountedRef.current) return;

      const newMap = new Map<string, RealtimeMetric>();
      const slotStart = getKST10MinSlotStart();

      for (const serverId of serverIds) {
        const serverDataset = getServer24hData(serverId);
        if (serverDataset) {
          const fixedData = getDataAtMinute(serverDataset, slotStart);
          if (fixedData) {
            newMap.set(serverId, applyMicroVariation(fixedData));
          }
        }
      }

      setMetricsMap(newMap);
    };

    // 초기 로드
    updateAllMetrics();

    // 1분마다 업데이트
    const intervalId = setInterval(updateAllMetrics, 60000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [serverIds.join(',')]); // serverIds 배열 변경 시에만 재실행

  return {
    metricsMap,
    getMetric: (serverId: string) => metricsMap.get(serverId),
  };
}

/**
 * 특정 메트릭 타입만 가져오는 훅
 *
 * @param serverId 서버 ID
 * @param metricType 메트릭 타입
 * @returns 단일 메트릭 값
 */
export function useSingleMetric(
  serverId: string,
  metricType: 'cpu' | 'memory' | 'disk' | 'network'
) {
  const [value, setValue] = useState<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const updateMetric = () => {
      if (!isMountedRef.current) return;

      const serverDataset = getServer24hData(serverId);
      if (serverDataset) {
        const slotStart = getKST10MinSlotStart();
        const fixedData = getDataAtMinute(serverDataset, slotStart);
        if (fixedData) {
          const realtimeData = applyMicroVariation(fixedData);
          setValue(realtimeData[metricType]);
        }
      }
    };

    // 초기 로드
    updateMetric();

    // 1분마다 업데이트
    const intervalId = setInterval(updateMetric, 60000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [serverId, metricType]);

  return value;
}

/**
 * 현재 시간의 고정 데이터만 가져오는 유틸리티 (미세 변동 없음)
 *
 * @param serverId 서버 ID
 * @returns 고정 데이터 (10분 슬롯)
 */
export function getFixedMetricNow(serverId: string): Fixed10MinMetric | null {
  const serverDataset = getServer24hData(serverId);
  if (!serverDataset) return null;

  const slotStart = getKST10MinSlotStart();
  return getDataAtMinute(serverDataset, slotStart) || null;
}
