/**
 * 📊 메트릭 생성기 v1.0
 *
 * 책임:
 * - 서버 메트릭 업데이트
 * - 시뮬레이션 로직
 * - 로드 멀티플라이어 적용
 * - 인시던트 시뮬레이션
 */

import type { ServerInstance, SimulationConfig } from '@/types/data-generator';

export class MetricsGenerator {
  private simulationConfig: SimulationConfig;
  private serverBaselines = new Map<string, any>();
  private incidentStates = new Map<
    string,
    { active: boolean; startTime: number; type: string }
  >();

  constructor(simulationConfig: SimulationConfig) {
    this.simulationConfig = simulationConfig;
  }

  /**
   * 서버 메트릭 업데이트
   */
  updateServerMetrics(
    server: ServerInstance,
    loadMultiplier: number,
    realMetrics?: any
  ): void {
    const baseline = this.getOrCreateBaseline(server.id, server.type);
    const timeMultiplier = this.getTimeMultiplier(new Date().getHours());
    const finalMultiplier = loadMultiplier * timeMultiplier;

    // CPU 메트릭 업데이트
    server.metrics.cpu = Math.min(
      100,
      baseline.cpu * finalMultiplier + (Math.random() - 0.5) * 10
    );

    // 메모리 메트릭 업데이트
    server.metrics.memory = Math.min(
      100,
      baseline.memory * finalMultiplier + (Math.random() - 0.5) * 8
    );

    // 디스크 메트릭 업데이트
    server.metrics.disk = Math.min(
      100,
      baseline.disk + (Math.random() - 0.5) * 5
    );

    // 네트워크 메트릭 업데이트
    const networkBaseline = baseline.network || { in: 100, out: 50 };
    server.metrics.network = {
      in: Math.max(
        0,
        networkBaseline.in * finalMultiplier + (Math.random() - 0.5) * 50
      ),
      out: Math.max(
        0,
        networkBaseline.out * finalMultiplier + (Math.random() - 0.5) * 30
      ),
    };

    // 요청 및 에러 메트릭
    const requestsBaseline = baseline.requests || 1000;
    server.metrics.requests = Math.max(
      0,
      Math.floor(
        requestsBaseline * finalMultiplier + (Math.random() - 0.5) * 200
      )
    );

    // 에러율 계산 (정상: 0.1%, 부하 시: 증가)
    const baseErrorRate = server.metrics.cpu > 80 ? 0.005 : 0.001;
    server.metrics.errors = Math.floor(
      server.metrics.requests * baseErrorRate * (0.5 + Math.random())
    );

    // 업타임 업데이트 (시뮬레이션)
    server.metrics.uptime += 0.1; // 6분마다 1시간 증가

    // 인시던트 시뮬레이션 적용
    this.simulateIncidents(server);

    // 커스텀 메트릭 업데이트
    this.updateCustomMetrics(server, finalMultiplier);

    // 실제 메트릭이 있다면 일부 적용
    if (realMetrics) {
      this.applyRealMetrics(server, realMetrics);
    }
  }

  /**
   * 인시던트 시뮬레이션
   */
  private simulateIncidents(server: ServerInstance): void {
    const incidentState = this.incidentStates.get(server.id);
    const now = Date.now();

    // 기존 인시던트 체크
    if (incidentState?.active) {
      const duration = now - incidentState.startTime;

      if (duration > this.simulationConfig.incidents.duration) {
        // 인시던트 종료
        this.incidentStates.delete(server.id);
        console.log(`🔧 ${server.name}: ${incidentState.type} 인시던트 해결됨`);
      } else {
        // 인시던트 진행 중 - 메트릭 악화
        this.applyIncidentEffects(server, incidentState.type, duration);
      }
      return;
    }

    // 새 인시던트 발생 확률 체크
    if (Math.random() < this.simulationConfig.incidents.probability) {
      const incidentTypes = [
        'cpu-spike',
        'memory-leak',
        'disk-full',
        'network-congestion',
      ];
      const incidentType =
        incidentTypes[Math.floor(Math.random() * incidentTypes.length)];

      this.incidentStates.set(server.id, {
        active: true,
        startTime: now,
        type: incidentType,
      });

      console.log(`🚨 ${server.name}: ${incidentType} 인시던트 발생`);
    }
  }

  /**
   * 인시던트 효과 적용
   */
  private applyIncidentEffects(
    server: ServerInstance,
    incidentType: string,
    duration: number
  ): void {
    const severity = Math.min(
      1,
      duration / (this.simulationConfig.incidents.duration * 0.5)
    );

    switch (incidentType) {
      case 'cpu-spike':
        server.metrics.cpu = Math.min(100, server.metrics.cpu + severity * 40);
        break;
      case 'memory-leak':
        server.metrics.memory = Math.min(
          100,
          server.metrics.memory + severity * 30
        );
        break;
      case 'disk-full':
        server.metrics.disk = Math.min(
          100,
          server.metrics.disk + severity * 25
        );
        break;
      case 'network-congestion':
        server.metrics.network.in *= 1 + severity * 2;
        server.metrics.network.out *= 1 + severity * 2;
        break;
    }

    // 에러율 증가
    const additionalErrors = Math.floor(
      server.metrics.requests * severity * 0.01
    );
    server.metrics.errors += additionalErrors;
  }

  /**
   * 커스텀 메트릭 업데이트
   */
  private updateCustomMetrics(
    server: ServerInstance,
    multiplier: number
  ): void {
    if (!server.metrics.customMetrics) return;

    const customMetrics = server.metrics.customMetrics;

    switch (server.type) {
      case 'database':
        if (customMetrics.replication_lag !== undefined) {
          customMetrics.replication_lag = Math.max(
            0,
            (customMetrics.replication_lag + (Math.random() - 0.5) * 50) *
              (0.8 + multiplier * 0.4)
          );
        }
        if (customMetrics.connection_pool !== undefined) {
          customMetrics.connection_pool = Math.max(
            10,
            Math.min(
              500,
              customMetrics.connection_pool + (Math.random() - 0.5) * 20
            )
          );
        }
        break;

      case 'cache':
        if (customMetrics.cache_hit_ratio !== undefined) {
          // 부하가 높을수록 캐시 히트율 감소
          const loadPenalty = Math.max(0, (server.metrics.cpu - 50) * 0.1);
          customMetrics.cache_hit_ratio = Math.max(
            60,
            Math.min(
              99,
              customMetrics.cache_hit_ratio -
                loadPenalty +
                (Math.random() - 0.5) * 2
            )
          );
        }
        break;

      case 'gpu':
        if (customMetrics.gpu_utilization !== undefined) {
          customMetrics.gpu_utilization = Math.max(
            0,
            Math.min(
              100,
              customMetrics.gpu_utilization * multiplier +
                (Math.random() - 0.5) * 15
            )
          );
        }
        break;

      case 'storage':
        if (customMetrics.storage_iops !== undefined) {
          customMetrics.storage_iops = Math.max(
            100,
            customMetrics.storage_iops * (0.8 + multiplier * 0.4) +
              (Math.random() - 0.5) * 500
          );
        }
        break;

      case 'api':
      case 'web':
        if (customMetrics.container_count !== undefined) {
          // 오토스케일링 시뮬레이션
          const targetContainers = Math.ceil(server.metrics.cpu / 10);
          const currentContainers = customMetrics.container_count;
          const diff = targetContainers - currentContainers;

          if (Math.abs(diff) > 0) {
            customMetrics.container_count +=
              Math.sign(diff) * Math.min(Math.abs(diff), 2);
            customMetrics.container_count = Math.max(
              1,
              Math.min(50, customMetrics.container_count)
            );
          }
        }
        break;
    }
  }

  /**
   * 실제 메트릭 적용 (Prometheus 등에서)
   */
  private applyRealMetrics(server: ServerInstance, realMetrics: any): void {
    // 실제 메트릭의 일부를 가중 평균으로 적용
    const weight = 0.3; // 30% 가중치

    if (realMetrics.cpu !== undefined) {
      server.metrics.cpu =
        server.metrics.cpu * (1 - weight) + realMetrics.cpu * weight;
    }

    if (realMetrics.memory !== undefined) {
      server.metrics.memory =
        server.metrics.memory * (1 - weight) + realMetrics.memory * weight;
    }

    if (realMetrics.network) {
      server.metrics.network.in =
        server.metrics.network.in * (1 - weight) +
        realMetrics.network.in * weight;
      server.metrics.network.out =
        server.metrics.network.out * (1 - weight) +
        realMetrics.network.out * weight;
    }
  }

  /**
   * 기준선 가져오기 또는 생성
   */
  private getOrCreateBaseline(serverId: string, serverType: string): any {
    if (!this.serverBaselines.has(serverId)) {
      this.serverBaselines.set(
        serverId,
        this.generateBaselineProfile(serverType)
      );
    }
    return this.serverBaselines.get(serverId);
  }

  /**
   * 기준선 프로필 생성
   */
  private generateBaselineProfile(serverType: string): any {
    const profiles = {
      web: {
        cpu: 25,
        memory: 40,
        disk: 60,
        network: { in: 150, out: 100 },
        requests: 800,
      },
      api: {
        cpu: 35,
        memory: 50,
        disk: 30,
        network: { in: 300, out: 200 },
        requests: 1500,
      },
      database: {
        cpu: 45,
        memory: 70,
        disk: 80,
        network: { in: 500, out: 300 },
        requests: 2000,
      },
      cache: {
        cpu: 20,
        memory: 80,
        disk: 10,
        network: { in: 800, out: 400 },
        requests: 5000,
      },
      queue: {
        cpu: 30,
        memory: 35,
        disk: 40,
        network: { in: 200, out: 150 },
        requests: 1000,
      },
      cdn: {
        cpu: 15,
        memory: 25,
        disk: 90,
        network: { in: 2000, out: 1500 },
        requests: 10000,
      },
      gpu: {
        cpu: 60,
        memory: 85,
        disk: 50,
        network: { in: 400, out: 200 },
        requests: 500,
      },
      storage: {
        cpu: 25,
        memory: 45,
        disk: 95,
        network: { in: 600, out: 400 },
        requests: 300,
      },
    };

    const profile =
      profiles[serverType as keyof typeof profiles] || profiles.web;

    // 약간의 변동성 추가
    return {
      cpu: profile.cpu * (0.8 + Math.random() * 0.4),
      memory: profile.memory * (0.8 + Math.random() * 0.4),
      disk: profile.disk * (0.9 + Math.random() * 0.2),
      network: {
        in: profile.network.in * (0.7 + Math.random() * 0.6),
        out: profile.network.out * (0.7 + Math.random() * 0.6),
      },
      requests: profile.requests * (0.5 + Math.random() * 1.0),
    };
  }

  /**
   * 시간대별 멀티플라이어
   */
  private getTimeMultiplier(hour: number): number {
    // 피크 시간대 체크
    if (this.simulationConfig.peakHours.includes(hour)) {
      return 1.5 + Math.random() * 0.5; // 1.5x ~ 2.0x
    }

    // 심야 시간대 (새벽 2-6시)
    if (hour >= 2 && hour <= 6) {
      return 0.3 + Math.random() * 0.2; // 0.3x ~ 0.5x
    }

    // 일반 시간대
    return 0.8 + Math.random() * 0.4; // 0.8x ~ 1.2x
  }

  /**
   * 기준선 새로고침
   */
  refreshBaselines(): void {
    this.serverBaselines.clear();
    console.log('🔄 서버 기준선 데이터 새로고침 완료');
  }

  /**
   * 시뮬레이션 설정 업데이트
   */
  updateSimulationConfig(config: Partial<SimulationConfig>): void {
    this.simulationConfig = { ...this.simulationConfig, ...config };
  }

  /**
   * 현재 인시던트 상태
   */
  getActiveIncidents(): Array<{
    serverId: string;
    type: string;
    duration: number;
  }> {
    const now = Date.now();
    const incidents: Array<{
      serverId: string;
      type: string;
      duration: number;
    }> = [];

    this.incidentStates.forEach((state, serverId) => {
      if (state.active) {
        incidents.push({
          serverId,
          type: state.type,
          duration: now - state.startTime,
        });
      }
    });

    return incidents;
  }
}
