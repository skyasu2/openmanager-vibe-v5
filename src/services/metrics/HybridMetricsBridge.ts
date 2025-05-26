import { ServerMetrics } from '@/types/server';
import { dataManager } from '@/services/dataManager';
import { SystemHealthChecker } from '@/services/SystemHealthChecker';

/**
 * 시계열 데이터 포인트 인터페이스
 */
export interface TimeSeriesPoint {
  timestamp: string;
  serverId: string;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
    alerts: number;
    network?: {
      bytesIn: number;
      bytesOut: number;
    };
    uptime?: number;
  };
}

/**
 * 병합된 시계열 응답 인터페이스
 */
export interface MergedTimeSeriesResponse {
  serverGroups: Map<string, TimeSeriesPoint[]>;
  totalPoints: number;
  timeWindow: {
    start: string;
    end: string;
    duration: string;
  };
  dataSource: {
    dailyPoints: number;
    realtimePoints: number;
    coverage: number; // 0-1, 데이터 커버리지 비율
  };
  metadata: {
    lastUpdated: string;
    interpolatedPoints: number;
    missingDataRanges: Array<{ start: string; end: string }>;
  };
}

/**
 * 서버 메트릭 스냅샷
 */
export interface ServerMetricsSnapshot {
  serverId: string;
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  responseTime: number;
  alerts: number;
  network?: {
    bytesIn: number;
    bytesOut: number;
  };
  uptime?: number;
}

/**
 * 시간 윈도우 옵션
 */
export interface TimeWindowOptions {
  windowStart?: Date;
  windowEnd?: Date;
  duration?: '1h' | '6h' | '12h' | '24h';
  interval?: '1m' | '5m' | '15m' | '1h';
}

/**
 * 🔗 HybridMetricsBridge
 * 
 * daily_metrics와 realtime_metrics를 하나의 연속된 시계열로 병합하는 브리지 모듈
 * 
 * 🎯 주요 기능:
 * - 24시간 연속 시계열 데이터 생성
 * - 실시간 데이터 슬라이딩 윈도우 관리 (20분)
 * - 시간 정렬 및 데이터 무결성 보장
 * - AI/예측 엔진을 위한 표준 인터페이스 제공
 */
export class HybridMetricsBridge {
  private static instance: HybridMetricsBridge;
  private healthChecker: SystemHealthChecker;
  private realtimeCache: Map<string, ServerMetricsSnapshot[]> = new Map();
  private readonly REALTIME_WINDOW_MINUTES = 20;
  private readonly DEFAULT_INTERVAL_MINUTES = 5;

  private constructor() {
    this.healthChecker = SystemHealthChecker.getInstance();
    this.initializeRealtimeCache();
  }

  public static getInstance(): HybridMetricsBridge {
    if (!this.instance) {
      this.instance = new HybridMetricsBridge();
    }
    return this.instance;
  }

  /**
   * 🔄 병합된 시계열 데이터 반환 (메인 메서드)
   */
  async getMergedTimeSeries(options: TimeWindowOptions = {}): Promise<MergedTimeSeriesResponse> {
    console.log('🔗 HybridMetricsBridge: Merging time series data...');

    // 시간 윈도우 설정
    const { windowStart, windowEnd } = this.calculateTimeWindow(options);
    
    // 데이터 소스 병합
    const dailyData = this.getDailyMetricsInWindow(windowStart, windowEnd);
    const realtimeData = this.getRealtimeMetricsInWindow(windowStart, windowEnd);
    
    // 서버별 그룹핑 및 시간 정렬
    const serverGroups = this.mergeAndGroupByServer(dailyData, realtimeData);
    
    // 데이터 보간 및 빈 구간 채우기
    const interpolatedGroups = this.interpolateMissingData(serverGroups, windowStart, windowEnd);
    
    // 메타데이터 생성
    const metadata = this.generateMetadata(dailyData, realtimeData, windowStart, windowEnd);

    console.log(`✅ Merged time series: ${interpolatedGroups.size} servers, ${metadata.totalPoints} points`);

    return {
      serverGroups: interpolatedGroups,
      totalPoints: metadata.totalPoints,
      timeWindow: {
        start: windowStart.toISOString(),
        end: windowEnd.toISOString(),
        duration: this.formatDuration(windowEnd.getTime() - windowStart.getTime())
      },
      dataSource: {
        dailyPoints: metadata.dailyPoints,
        realtimePoints: metadata.realtimePoints,
        coverage: metadata.coverage
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        interpolatedPoints: metadata.interpolatedPoints,
        missingDataRanges: metadata.missingDataRanges
      }
    };
  }

  /**
   * 📊 실시간 데이터 추가 (슬라이딩 윈도우)
   */
  appendRealtimeData(newEntry: ServerMetricsSnapshot): void {
    const serverId = newEntry.serverId;
    
    if (!this.realtimeCache.has(serverId)) {
      this.realtimeCache.set(serverId, []);
    }

    const serverData = this.realtimeCache.get(serverId)!;
    
    // 새 데이터 추가
    serverData.push(newEntry);

    // 20분 윈도우 유지 (FIFO)
    const cutoffTime = new Date(Date.now() - (this.REALTIME_WINDOW_MINUTES * 60 * 1000));
    const filteredData = serverData.filter(entry => entry.timestamp >= cutoffTime);
    
    this.realtimeCache.set(serverId, filteredData);

    console.log(`🔄 Real-time data appended for ${serverId}: ${filteredData.length} points in window`);
  }

  /**
   * ⏰ 현재 20분 윈도우 데이터 반환
   */
  getCurrentWindow(): Map<string, ServerMetricsSnapshot[]> {
    const cutoffTime = new Date(Date.now() - (this.REALTIME_WINDOW_MINUTES * 60 * 1000));
    const currentWindow = new Map<string, ServerMetricsSnapshot[]>();

    this.realtimeCache.forEach((data, serverId) => {
      const windowData = data.filter(entry => entry.timestamp >= cutoffTime);
      if (windowData.length > 0) {
        currentWindow.set(serverId, windowData);
      }
    });

    return currentWindow;
  }

  /**
   * 📈 특정 서버의 시계열 데이터 추출
   */
  async getServerTimeSeries(serverId: string, options: TimeWindowOptions = {}): Promise<TimeSeriesPoint[]> {
    const merged = await this.getMergedTimeSeries(options);
    return merged.serverGroups.get(serverId) || [];
  }

  /**
   * 🧠 AI 분석용 최적화된 데이터 반환
   */
  async getAIAnalysisData(serverIds: string[] = [], timeRange: '1h' | '6h' | '12h' | '24h' = '24h'): Promise<{
    timeSeries: Map<string, TimeSeriesPoint[]>;
    summary: {
      avgCpu: number;
      avgMemory: number;
      avgDisk: number;
      anomalyCount: number;
      trendDirection: 'increasing' | 'decreasing' | 'stable';
    };
  }> {
    const options: TimeWindowOptions = { duration: timeRange };
    const merged = await this.getMergedTimeSeries(options);

    // 서버 필터링 (지정된 경우)
    let filteredGroups = merged.serverGroups;
    if (serverIds.length > 0) {
      filteredGroups = new Map();
      serverIds.forEach(id => {
        if (merged.serverGroups.has(id)) {
          filteredGroups.set(id, merged.serverGroups.get(id)!);
        }
      });
    }

    // AI 분석을 위한 요약 통계 생성
    const summary = this.generateAISummary(filteredGroups);

    return {
      timeSeries: filteredGroups,
      summary
    };
  }

  /**
   * 🔧 Private Methods
   */

  private initializeRealtimeCache(): void {
    // 기존 DataManager의 실시간 데이터로 캐시 초기화
    const realtimeMetrics = dataManager.getRealtimeMetrics();
    
    realtimeMetrics.forEach(metric => {
      const snapshot: ServerMetricsSnapshot = {
        serverId: metric.id,
        timestamp: new Date(metric.last_updated),
        cpu: metric.cpu_usage,
        memory: metric.memory_usage,
        disk: metric.disk_usage,
        responseTime: metric.response_time,
        alerts: metric.alerts.length,
        network: {
          bytesIn: metric.network_in,
          bytesOut: metric.network_out
        },
        uptime: metric.uptime
      };

      this.appendRealtimeData(snapshot);
    });

    console.log('🔄 Initialized realtime cache with existing data');
  }

  private calculateTimeWindow(options: TimeWindowOptions): { windowStart: Date; windowEnd: Date } {
    const now = new Date();
    let windowStart: Date;
    const windowEnd: Date = options.windowEnd || now;

    if (options.windowStart) {
      windowStart = options.windowStart;
    } else {
      // duration 기반 시작 시간 계산
      const duration = options.duration || '24h';
      const hoursBack = this.parseDurationToHours(duration);
      windowStart = new Date(windowEnd.getTime() - (hoursBack * 60 * 60 * 1000));
    }

    return { windowStart, windowEnd };
  }

  private parseDurationToHours(duration: string): number {
    switch (duration) {
      case '1h': return 1;
      case '6h': return 6;
      case '12h': return 12;
      case '24h': return 24;
      default: return 24;
    }
  }

  private getDailyMetricsInWindow(start: Date, end: Date): ServerMetrics[] {
    const dailyMetrics = dataManager.getDailyMetrics();
    return dailyMetrics.filter(metric => {
      const timestamp = new Date(metric.last_updated);
      return timestamp >= start && timestamp <= end;
    });
  }

  private getRealtimeMetricsInWindow(start: Date, end: Date): ServerMetricsSnapshot[] {
    const realtimeData: ServerMetricsSnapshot[] = [];
    
    this.realtimeCache.forEach((snapshots) => {
      const filteredSnapshots = snapshots.filter(snapshot => 
        snapshot.timestamp >= start && snapshot.timestamp <= end
      );
      realtimeData.push(...filteredSnapshots);
    });

    return realtimeData;
  }

  private mergeAndGroupByServer(
    dailyData: ServerMetrics[], 
    realtimeData: ServerMetricsSnapshot[]
  ): Map<string, TimeSeriesPoint[]> {
    const serverGroups = new Map<string, TimeSeriesPoint[]>();

    // Daily 데이터 처리
    dailyData.forEach(metric => {
      const point: TimeSeriesPoint = {
        timestamp: metric.last_updated,
        serverId: metric.id,
        metrics: {
          cpu: metric.cpu_usage,
          memory: metric.memory_usage,
          disk: metric.disk_usage,
          responseTime: metric.response_time,
          alerts: metric.alerts.length,
          network: {
            bytesIn: metric.network_in,
            bytesOut: metric.network_out
          },
          uptime: metric.uptime
        }
      };

      if (!serverGroups.has(metric.id)) {
        serverGroups.set(metric.id, []);
      }
      serverGroups.get(metric.id)!.push(point);
    });

    // Realtime 데이터 처리
    realtimeData.forEach(snapshot => {
      const point: TimeSeriesPoint = {
        timestamp: snapshot.timestamp.toISOString(),
        serverId: snapshot.serverId,
        metrics: {
          cpu: snapshot.cpu,
          memory: snapshot.memory,
          disk: snapshot.disk,
          responseTime: snapshot.responseTime,
          alerts: snapshot.alerts,
          network: snapshot.network,
          uptime: snapshot.uptime
        }
      };

      if (!serverGroups.has(snapshot.serverId)) {
        serverGroups.set(snapshot.serverId, []);
      }
      serverGroups.get(snapshot.serverId)!.push(point);
    });

    // 서버별 시간 정렬 및 중복 제거
    serverGroups.forEach((points, serverId) => {
      const sorted = points
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .filter((point, index, arr) => {
          // 중복 제거: 같은 시간대의 데이터는 더 최신 것 사용
          if (index === 0) return true;
          return new Date(point.timestamp).getTime() !== new Date(arr[index - 1].timestamp).getTime();
        });
      
      serverGroups.set(serverId, sorted);
    });

    return serverGroups;
  }

  private interpolateMissingData(
    serverGroups: Map<string, TimeSeriesPoint[]>,
    windowStart: Date,
    windowEnd: Date
  ): Map<string, TimeSeriesPoint[]> {
    const interpolatedGroups = new Map<string, TimeSeriesPoint[]>();
    const intervalMs = this.DEFAULT_INTERVAL_MINUTES * 60 * 1000;

    serverGroups.forEach((points, serverId) => {
      if (points.length === 0) return;

      const interpolated: TimeSeriesPoint[] = [];
      let currentTime = new Date(windowStart);

      while (currentTime <= windowEnd) {
        const currentTimeStr = currentTime.toISOString();
        
        // 기존 데이터포인트 찾기
        const exactMatch = points.find(p => 
          Math.abs(new Date(p.timestamp).getTime() - currentTime.getTime()) < 30000 // 30초 허용 오차
        );

        if (exactMatch) {
          interpolated.push(exactMatch);
        } else {
          // 보간 데이터 생성
          const interpolatedPoint = this.createInterpolatedPoint(points, currentTime, serverId);
          if (interpolatedPoint) {
            interpolated.push(interpolatedPoint);
          }
        }

        currentTime = new Date(currentTime.getTime() + intervalMs);
      }

      interpolatedGroups.set(serverId, interpolated);
    });

    return interpolatedGroups;
  }

  private createInterpolatedPoint(
    existingPoints: TimeSeriesPoint[],
    targetTime: Date,
    serverId: string
  ): TimeSeriesPoint | null {
    if (existingPoints.length === 0) return null;

    // 앞뒤 포인트 찾기
    const beforePoint = existingPoints
      .filter(p => new Date(p.timestamp) <= targetTime)
      .pop();
    
    const afterPoint = existingPoints
      .find(p => new Date(p.timestamp) > targetTime);

    if (!beforePoint && !afterPoint) return null;

    // 한쪽만 있는 경우 해당 값 사용
    if (!beforePoint) return afterPoint!;
    if (!afterPoint) return beforePoint;

    // 선형 보간
    const beforeTime = new Date(beforePoint.timestamp).getTime();
    const afterTime = new Date(afterPoint.timestamp).getTime();
    const targetTimeMs = targetTime.getTime();
    
    const ratio = (targetTimeMs - beforeTime) / (afterTime - beforeTime);

    return {
      timestamp: targetTime.toISOString(),
      serverId,
      metrics: {
        cpu: this.linearInterpolate(beforePoint.metrics.cpu, afterPoint.metrics.cpu, ratio),
        memory: this.linearInterpolate(beforePoint.metrics.memory, afterPoint.metrics.memory, ratio),
        disk: this.linearInterpolate(beforePoint.metrics.disk, afterPoint.metrics.disk, ratio),
        responseTime: this.linearInterpolate(beforePoint.metrics.responseTime, afterPoint.metrics.responseTime, ratio),
        alerts: Math.round(this.linearInterpolate(beforePoint.metrics.alerts, afterPoint.metrics.alerts, ratio)),
        network: beforePoint.metrics.network && afterPoint.metrics.network ? {
          bytesIn: this.linearInterpolate(beforePoint.metrics.network.bytesIn, afterPoint.metrics.network.bytesIn, ratio),
          bytesOut: this.linearInterpolate(beforePoint.metrics.network.bytesOut, afterPoint.metrics.network.bytesOut, ratio)
        } : undefined,
        uptime: beforePoint.metrics.uptime && afterPoint.metrics.uptime ? 
          this.linearInterpolate(beforePoint.metrics.uptime, afterPoint.metrics.uptime, ratio) : undefined
      }
    };
  }

  private linearInterpolate(start: number, end: number, ratio: number): number {
    return Math.round((start + (end - start) * ratio) * 100) / 100;
  }

  private generateMetadata(
    dailyData: ServerMetrics[],
    realtimeData: ServerMetricsSnapshot[],
    windowStart: Date,
    windowEnd: Date
  ): {
    totalPoints: number;
    dailyPoints: number;
    realtimePoints: number;
    coverage: number;
    interpolatedPoints: number;
    missingDataRanges: Array<{ start: string; end: string }>;
  } {
    const totalPoints = dailyData.length + realtimeData.length;
    const windowDurationMs = windowEnd.getTime() - windowStart.getTime();
    const expectedPoints = Math.ceil(windowDurationMs / (this.DEFAULT_INTERVAL_MINUTES * 60 * 1000));
    const coverage = Math.min(totalPoints / expectedPoints, 1);

    return {
      totalPoints,
      dailyPoints: dailyData.length,
      realtimePoints: realtimeData.length,
      coverage,
      interpolatedPoints: Math.max(0, expectedPoints - totalPoints),
      missingDataRanges: [] // 추후 구현
    };
  }

  private generateAISummary(serverGroups: Map<string, TimeSeriesPoint[]>): {
    avgCpu: number;
    avgMemory: number;
    avgDisk: number;
    anomalyCount: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
  } {
    let totalCpu = 0, totalMemory = 0, totalDisk = 0, totalPoints = 0;
    let anomalyCount = 0;

    serverGroups.forEach(points => {
      points.forEach(point => {
        totalCpu += point.metrics.cpu;
        totalMemory += point.metrics.memory;
        totalDisk += point.metrics.disk;
        totalPoints++;

        // 임계값 기반 이상 징후 감지
        if (point.metrics.cpu > 90 || point.metrics.memory > 90 || point.metrics.disk > 95) {
          anomalyCount++;
        }
      });
    });

    const avgCpu = totalPoints > 0 ? Math.round(totalCpu / totalPoints * 100) / 100 : 0;
    const avgMemory = totalPoints > 0 ? Math.round(totalMemory / totalPoints * 100) / 100 : 0;
    const avgDisk = totalPoints > 0 ? Math.round(totalDisk / totalPoints * 100) / 100 : 0;

    // 트렌드 분석 (간단한 구현)
    let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (avgCpu > 75 || avgMemory > 80) {
      trendDirection = 'increasing';
    } else if (avgCpu < 30 && avgMemory < 40) {
      trendDirection = 'decreasing';
    }

    return {
      avgCpu,
      avgMemory,
      avgDisk,
      anomalyCount,
      trendDirection
    };
  }

  private formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  /**
   * 🔧 SystemHealthChecker와 연동
   */
  async syncWithHealthChecker(): Promise<void> {
    try {
      // SystemHealthChecker에서 최신 분석 데이터 가져오기
      const analysis = this.healthChecker.getStatisticalAnalysis();
      
      if (analysis) {
        // 필요 시 실시간 캐시 업데이트
        console.log('🔗 Synced with SystemHealthChecker');
      }
    } catch (error) {
      console.warn('🔗 Failed to sync with SystemHealthChecker:', error);
    }
  }

  /**
   * 🧹 캐시 정리
   */
  cleanup(): void {
    const cutoffTime = new Date(Date.now() - (this.REALTIME_WINDOW_MINUTES * 60 * 1000));
    
    this.realtimeCache.forEach((data, serverId) => {
      const cleanedData = data.filter(entry => entry.timestamp >= cutoffTime);
      this.realtimeCache.set(serverId, cleanedData);
    });

    console.log('🧹 HybridMetricsBridge cache cleaned');
  }
}

// 싱글톤 인스턴스 export
export const hybridMetricsBridge = HybridMetricsBridge.getInstance(); 