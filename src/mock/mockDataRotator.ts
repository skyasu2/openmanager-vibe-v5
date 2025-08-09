/**
 * 실시간 데이터 회전 메커니즘
 * 24시간 데이터를 순환시켜 실시간 모니터링 효과 생성
 */

import type { Server } from '@/types/server';
import type { ScenarioPoint, ServerTimeSeriesData } from './mockDataGenerator';
import { decompressTimeSeriesData } from './mockDataGenerator';

export interface RotationConfig {
  intervalMs: number; // 회전 간격 (기본: 30초)
  startOffset: number; // 시작 오프셋 (0-2879)
  speed: number; // 재생 속도 배수 (1 = 실시간, 2 = 2배속)
}

export class MockDataRotator {
  private config: RotationConfig;
  private currentIndex: number;
  private startTime: number;
  private timeSeries: Record<string, ServerTimeSeriesData>;
  private decompressedData: Record<string, ScenarioPoint[]> = {};
  private rotationTimer?: NodeJS.Timeout;
  private updateCallback?: (servers: Server[]) => void;

  constructor(
    timeSeries: Record<string, ServerTimeSeriesData>,
    config: Partial<RotationConfig> = {}
  ) {
    this.config = {
      intervalMs: 30000, // 30초
      startOffset: Math.floor(Math.random() * 2880), // 랜덤 시작점
      speed: 1,
      ...config,
    };

    this.currentIndex = this.config.startOffset;
    this.startTime = Date.now();
    this.timeSeries = timeSeries;

    // 데이터 압축 해제
    this.decompressAllData();
  }

  /**
   * 모든 시계열 데이터 압축 해제
   */
  private decompressAllData() {
    Object.entries(this.timeSeries).forEach(([serverId, data]) => {
      this.decompressedData[serverId] = decompressTimeSeriesData(
        (data.data as unknown) as import('./mockDataGenerator').CompressedDataPoint[]
      );
    });
  }

  /**
   * 현재 인덱스 계산
   */
  private calculateCurrentIndex(): number {
    const elapsed = Date.now() - this.startTime;
    const intervals = Math.floor(
      elapsed / (this.config.intervalMs / this.config.speed)
    );
    return (this.config.startOffset + intervals) % 2880;
  }

  /**
   * 현재 시점의 메트릭 가져오기
   */
  getCurrentMetrics(serverId: string): ScenarioPoint {
    const data = this.decompressedData[serverId];
    if (!data || data.length === 0) {
      return { cpu: 0, memory: 0, disk: 0, network: 0 };
    }

    this.currentIndex = this.calculateCurrentIndex();
    const current = data[this.currentIndex];

    // 다음 포인트와 보간하여 부드러운 전환
    const nextIndex = (this.currentIndex + 1) % data.length;
    const next = data[nextIndex];

    // 시간 내 위치 계산 (0-1)
    const elapsed = Date.now() - this.startTime;
    const intervalProgress =
      (elapsed % (this.config.intervalMs / this.config.speed)) /
      (this.config.intervalMs / this.config.speed);

    // 선형 보간
    return {
      cpu: current.cpu + (next.cpu - current.cpu) * intervalProgress,
      memory:
        current.memory + (next.memory - current.memory) * intervalProgress,
      disk: current.disk + (next.disk - current.disk) * intervalProgress,
      network:
        current.network + (next.network - current.network) * intervalProgress,
      responseTime: current.responseTime,
      errorRate: current.errorRate,
    };
  }

  /**
   * 서버 목록 업데이트
   */
  updateServers(servers: Server[]): Server[] {
    return servers.map((server) => {
      const metrics = this.getCurrentMetrics(server.id);

      // 메트릭 기반 상태 결정
      let status: 'online' | 'warning' | 'critical' = 'online';
      if (metrics.cpu > 85 || metrics.memory > 90 || metrics.disk > 90) {
        status = 'critical';
      } else if (metrics.cpu > 70 || metrics.memory > 75 || metrics.disk > 80) {
        status = 'warning';
      }

      return {
        ...server,
        cpu: Math.round(metrics.cpu),
        memory: Math.round(metrics.memory),
        disk: Math.round(metrics.disk),
        network: Math.round(metrics.network),
        status,
        lastUpdate: new Date(),
        alerts: (this.timeSeries[server.id]?.alerts || []).length,
      };
    });
  }

  /**
   * 자동 회전 시작
   */
  startRotation(callback: (servers: Server[]) => void, servers: Server[]) {
    this.updateCallback = callback;

    // 즉시 한 번 업데이트
    callback(this.updateServers(servers));

    // 주기적 업데이트
    this.rotationTimer = setInterval(() => {
      callback(this.updateServers(servers));
    }, this.config.intervalMs / this.config.speed);
  }

  /**
   * 자동 회전 중지
   */
  stopRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }
  }

  /**
   * 현재 시뮬레이션 시간 가져오기
   */
  getCurrentSimulationTime(): { hour: number; minute: number; second: number } {
    const totalSeconds = this.currentIndex * 30; // 30초 간격
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hour: hours, minute: minutes, second: seconds };
  }

  /**
   * 특정 시간대로 점프
   */
  jumpToTime(hour: number, minute: number = 0) {
    const targetIndex = Math.floor((hour * 60 + minute) * 2); // 30초 간격이므로 *2
    this.currentIndex = Math.min(2879, Math.max(0, targetIndex));
    this.startTime =
      Date.now() -
      (this.currentIndex * this.config.intervalMs) / this.config.speed;

    // 콜백이 있으면 즉시 업데이트
    if (this.updateCallback) {
      const servers = this.updateServers([]); // 빈 배열 전달, 실제로는 외부에서 관리
      this.updateCallback(servers);
    }
  }

  /**
   * 재생 속도 변경
   */
  setSpeed(speed: number) {
    this.config.speed = Math.max(0.1, Math.min(10, speed)); // 0.1x ~ 10x

    // 타이머 재시작
    if (this.rotationTimer && this.updateCallback) {
      this.stopRotation();
      const servers: Server[] = []; // 실제로는 외부에서 관리
      this.startRotation(this.updateCallback, servers);
    }
  }

  /**
   * 현재 상태 정보
   */
  getStatus() {
    const simTime = this.getCurrentSimulationTime();
    return {
      currentIndex: this.currentIndex,
      totalPoints: 2880,
      progress: (this.currentIndex / 2880) * 100,
      simulationTime: `${String(simTime.hour).padStart(2, '0')}:${String(simTime.minute).padStart(2, '0')}:${String(simTime.second).padStart(2, '0')}`,
      speed: this.config.speed,
      isRunning: !!this.rotationTimer,
    };
  }
}

// 싱글톤 인스턴스
let rotatorInstance: MockDataRotator | null = null;

export function getRotatorInstance(
  timeSeries?: Record<string, ServerTimeSeriesData>,
  config?: Partial<RotationConfig>
): MockDataRotator {
  if (!rotatorInstance && timeSeries) {
    rotatorInstance = new MockDataRotator(timeSeries, config);
  }

  if (!rotatorInstance) {
    throw new Error('MockDataRotator not _initialized');
  }

  return rotatorInstance;
}

export function resetRotator() {
  if (rotatorInstance) {
    rotatorInstance.stopRotation();
    rotatorInstance = null;
  }
}
