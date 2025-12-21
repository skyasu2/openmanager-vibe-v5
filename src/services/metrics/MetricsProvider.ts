/**
 * 🎯 MetricsProvider - 단일 데이터 소스 (Single Source of Truth)
 *
 * 역할:
 * - 현재 한국 시간(KST) 기준으로 고정 메트릭 데이터 제공
 * - 모든 API와 컴포넌트가 이 서비스를 통해 일관된 데이터 접근
 * - 날짜는 현재, 시간만 고정 데이터의 시간과 매칭
 */

import {
  calculateAverageMetrics,
  FIXED_24H_DATASETS,
  type Fixed10MinMetric,
  getDataAtMinute,
} from '@/data/fixed-24h-metrics';

/**
 * 서버 메트릭 (API 응답용)
 */
export interface ServerMetrics {
  serverId: string;
  serverType: string;
  location: string;
  timestamp: string; // ISO 8601
  minuteOfDay: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  logs: string[];
  status: 'online' | 'warning' | 'critical' | 'offline';
}

/**
 * 전체 시스템 요약
 */
export interface SystemSummary {
  timestamp: string;
  minuteOfDay: number;
  totalServers: number;
  onlineServers: number;
  warningServers: number;
  criticalServers: number;
  averageCpu: number;
  averageMemory: number;
  averageDisk: number;
  averageNetwork: number;
}

/**
 * 한국 시간(KST) 기준 현재 minuteOfDay 계산
 */
export function getKSTMinuteOfDay(): number {
  const now = new Date();
  // UTC + 9시간 = KST
  const kstOffset = 9 * 60; // 분 단위
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = (utcMinutes + kstOffset) % 1440; // 1440 = 24시간

  // 10분 단위로 반올림
  return Math.floor(kstMinutes / 10) * 10;
}

/**
 * 현재 KST 타임스탬프 생성
 */
export function getKSTTimestamp(): string {
  const now = new Date();
  // KST 시간 계산
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kstTime.toISOString().replace('Z', '+09:00');
}

/**
 * 메트릭 값 기반 서버 상태 판별
 */
function determineStatus(
  cpu: number,
  memory: number,
  disk: number,
  network: number
): 'online' | 'warning' | 'critical' | 'offline' {
  // Critical: 어느 하나라도 90% 이상
  if (cpu >= 90 || memory >= 90 || disk >= 95 || network >= 90) {
    return 'critical';
  }
  // Warning: 어느 하나라도 80% 이상
  if (cpu >= 80 || memory >= 80 || disk >= 85 || network >= 80) {
    return 'warning';
  }
  return 'online';
}

/**
 * 🎯 MetricsProvider 클래스
 * Singleton 패턴으로 구현하여 일관된 데이터 제공
 */
export class MetricsProvider {
  private static instance: MetricsProvider;

  private constructor() {}

  public static getInstance(): MetricsProvider {
    if (!MetricsProvider.instance) {
      MetricsProvider.instance = new MetricsProvider();
    }
    return MetricsProvider.instance;
  }

  /**
   * 현재 시간 기준 단일 서버 메트릭 조회
   */
  public getServerMetrics(serverId: string): ServerMetrics | null {
    const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
    if (!dataset) return null;

    const minuteOfDay = getKSTMinuteOfDay();
    const dataPoint = getDataAtMinute(dataset, minuteOfDay);
    if (!dataPoint) return null;

    return {
      serverId: dataset.serverId,
      serverType: dataset.serverType,
      location: dataset.location,
      timestamp: getKSTTimestamp(),
      minuteOfDay,
      cpu: dataPoint.cpu,
      memory: dataPoint.memory,
      disk: dataPoint.disk,
      network: dataPoint.network,
      logs: dataPoint.logs,
      status: determineStatus(
        dataPoint.cpu,
        dataPoint.memory,
        dataPoint.disk,
        dataPoint.network
      ),
    };
  }

  /**
   * 현재 시간 기준 모든 서버 메트릭 조회
   */
  public getAllServerMetrics(): ServerMetrics[] {
    const minuteOfDay = getKSTMinuteOfDay();
    const timestamp = getKSTTimestamp();

    return FIXED_24H_DATASETS.map((dataset) => {
      const dataPoint = getDataAtMinute(dataset, minuteOfDay);
      if (!dataPoint) {
        // fallback: baseline 사용
        return {
          serverId: dataset.serverId,
          serverType: dataset.serverType,
          location: dataset.location,
          timestamp,
          minuteOfDay,
          cpu: dataset.baseline.cpu,
          memory: dataset.baseline.memory,
          disk: dataset.baseline.disk,
          network: dataset.baseline.network,
          logs: [],
          status: 'online' as const,
        };
      }

      return {
        serverId: dataset.serverId,
        serverType: dataset.serverType,
        location: dataset.location,
        timestamp,
        minuteOfDay,
        cpu: dataPoint.cpu,
        memory: dataPoint.memory,
        disk: dataPoint.disk,
        network: dataPoint.network,
        logs: dataPoint.logs,
        status: determineStatus(
          dataPoint.cpu,
          dataPoint.memory,
          dataPoint.disk,
          dataPoint.network
        ),
      };
    });
  }

  /**
   * 시스템 전체 요약 정보
   */
  public getSystemSummary(): SystemSummary {
    const minuteOfDay = getKSTMinuteOfDay();
    const averages = calculateAverageMetrics(minuteOfDay);
    const allMetrics = this.getAllServerMetrics();

    const statusCounts = allMetrics.reduce(
      (acc, m) => {
        acc[m.status]++;
        return acc;
      },
      { online: 0, warning: 0, critical: 0, offline: 0 }
    );

    return {
      timestamp: getKSTTimestamp(),
      minuteOfDay,
      totalServers: allMetrics.length,
      onlineServers: statusCounts.online,
      warningServers: statusCounts.warning,
      criticalServers: statusCounts.critical,
      averageCpu: averages.avgCpu,
      averageMemory: averages.avgMemory,
      averageDisk: averages.avgDisk,
      averageNetwork: averages.avgNetwork,
    };
  }

  /**
   * 특정 시간대 메트릭 조회 (히스토리용)
   */
  public getMetricsAtTime(
    serverId: string,
    minuteOfDay: number
  ): Fixed10MinMetric | null {
    const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
    if (!dataset) return null;

    return getDataAtMinute(dataset, minuteOfDay) || null;
  }

  /**
   * 서버 목록 조회
   */
  public getServerList(): Array<{
    serverId: string;
    serverType: string;
    location: string;
  }> {
    return FIXED_24H_DATASETS.map((d) => ({
      serverId: d.serverId,
      serverType: d.serverType,
      location: d.location,
    }));
  }

  /**
   * 디버그용: 현재 시간 정보
   */
  public getTimeInfo(): {
    kstTime: string;
    minuteOfDay: number;
    slotIndex: number;
    humanReadable: string;
  } {
    const minuteOfDay = getKSTMinuteOfDay();
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;

    return {
      kstTime: getKSTTimestamp(),
      minuteOfDay,
      slotIndex: minuteOfDay / 10,
      humanReadable: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} KST`,
    };
  }
}

// 편의를 위한 싱글톤 인스턴스 export
export const metricsProvider = MetricsProvider.getInstance();
