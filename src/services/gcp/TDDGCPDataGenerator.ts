/**
 * 🟢 TDD Green 단계: GCP 데이터 생성기 최소 구현
 *
 * 테스트를 통과하는 최소한의 코드만 작성
 */

export interface BaselineDataset {
  servers: ServerData[];
  scenarios: ScenarioConfig;
  generated_at: string;
  dataset_version: string;
}

export interface ServerData {
  id: string;
  name: string;
  type: string;
  specs: ServerSpecs;
  baseline_metrics: BaselineMetrics;
}

export interface ServerSpecs {
  cpu: { cores: number; model: string };
  memory: { total: number; type: string };
  disk: { total: number; type: string };
  network: { bandwidth: number; type: string };
}

export interface BaselineMetrics {
  cpu: { usage: number; load1: number };
  memory: { used: number; available: number };
  disk: { utilization: number; io: { read: number; write: number } };
  network: { io: { rx: number; tx: number } };
}

export interface ScenarioConfig {
  normal: { probability: number; load_multiplier: number };
  warning: { probability: number; load_multiplier: number };
  critical: { probability: number; load_multiplier: number };
}

export interface ServerMetric {
  timestamp: Date;
  serverId: string;
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
  applicationMetrics: {
    requestCount: number;
    errorRate: number;
    responseTime: number;
  };
}

export interface SystemMetrics {
  cpu: { usage: number; load1: number; processes: number };
  memory: { used: number; available: number };
  disk: { utilization: number; io: { read: number; write: number } };
  network: { io: { rx: number; tx: number }; connections: { active: number } };
}

export interface ApplicationMetrics {
  requests: { total: number; success: number; errors: number };
  latency: { p50: number; p95: number; p99: number };
}

export interface HistoricalDataPoint {
  date: string;
  servers: ServerData[];
  metrics: {
    averageCpuUsage: number;
    averageMemoryUsage: number;
    totalRequests: number;
    averageResponseTime: number;
  };
}

export class TDDGCPDataGenerator {
  private firestore: any;
  private cloudStorage: any;
  private baselineDataset: BaselineDataset | null = null;
  private batchBuffer: Map<string, ServerMetric[]> = new Map();
  private activeSessions: Map<
    string,
    { startTime: Date; autoStopTimer?: NodeJS.Timeout }
  > = new Map();
  private autoFlushedSessions: Set<string> = new Set();
  private readonly BATCH_SIZE = 40; // 20분 * 2회/분
  private readonly SESSION_DURATION_MS = 20 * 60 * 1000; // 20분

  constructor(firestore?: any, cloudStorage?: any) {
    this.firestore = firestore;
    this.cloudStorage = cloudStorage;
  }

  /**
   * 🟢 GREEN: 10개 서버 기본 데이터셋 생성 (최소 구현)
   */
  generateBaselineDataset(): BaselineDataset {
    // 최소 구현: 정확히 10개 서버 생성
    const servers: ServerData[] = [];

    // 서버 타입 정의
    const serverConfigs = [
      { id: 'srv-web-01', name: 'Web Server 01', type: 'nginx' },
      { id: 'srv-web-02', name: 'Web Server 02', type: 'apache' },
      { id: 'srv-web-03', name: 'Load Balancer', type: 'nginx' },
      { id: 'srv-app-01', name: 'API Server 01', type: 'nodejs' },
      { id: 'srv-app-02', name: 'API Server 02', type: 'springboot' },
      { id: 'srv-db-01', name: 'Primary Database', type: 'postgresql' },
      { id: 'srv-db-02', name: 'Replica Database', type: 'postgresql' },
      { id: 'srv-cache-01', name: 'Redis Cache', type: 'redis' },
      { id: 'srv-search-01', name: 'Elasticsearch', type: 'elasticsearch' },
      { id: 'srv-queue-01', name: 'Message Queue', type: 'rabbitmq' },
    ];

    for (const config of serverConfigs) {
      servers.push({
        id: config.id,
        name: config.name,
        type: config.type,
        specs: this.getServerSpecs(config.type),
        baseline_metrics: this.getBaselineMetrics(config.type),
      });
    }

    const dataset: BaselineDataset = {
      servers,
      scenarios: {
        normal: { probability: 0.5, load_multiplier: 1.0 },
        warning: { probability: 0.3, load_multiplier: 1.4 },
        critical: { probability: 0.2, load_multiplier: 1.8 },
      },
      generated_at: new Date().toISOString(),
      dataset_version: '1.0',
    };

    this.baselineDataset = dataset;
    return dataset;
  }

  /**
   * 🟢 GREEN: 실시간 메트릭 생성 (최소 구현)
   */
  async generateRealtimeMetrics(sessionId: string): Promise<ServerMetric[]> {
    const dataset = await this.generateBaselineDataset();
    const metrics: ServerMetric[] = [];
    const timestamp = new Date();

    // 각 서버별 메트릭 생성
    for (const server of dataset.servers) {
      const metric: ServerMetric = {
        timestamp,
        serverId: server.id,
        systemMetrics: {
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          diskUsage: Math.random() * 100,
          networkUsage: Math.random() * 100,
        },
        applicationMetrics: {
          requestCount: Math.floor(Math.random() * 1000),
          errorRate: Math.random() * 10,
          responseTime: 50 + Math.random() * 200,
        },
      };
      metrics.push(metric);
    }

    // 배치 버퍼에 추가
    if (!this.batchBuffer.has(sessionId)) {
      this.batchBuffer.set(sessionId, []);
    }
    this.batchBuffer.get(sessionId)!.push(...metrics);

    return metrics;
  }

  /**
   * 🟢 GREEN: 배치 플러시 (최소 구현)
   */
  async flushBatchToCloudStorage(sessionId: string): Promise<void> {
    const buffer = this.batchBuffer.get(sessionId);
    if (!buffer || buffer.length === 0) return;

    // Cloud Storage 저장 시뮬레이션
    await this.cloudStorage.file().save(
      JSON.stringify({
        sessionId,
        metrics: buffer,
        timestamp: new Date().toISOString(),
        count: buffer.length,
      })
    );

    // 버퍼 클리어
    this.batchBuffer.delete(sessionId);
  }

  /**
   * 서버 타입별 스펙 (테스트 통과용)
   */
  private getServerSpecs(type: string): ServerSpecs {
    const specs: Record<string, ServerSpecs> = {
      nginx: {
        cpu: { cores: 4, model: 'Intel Xeon E5-2680' },
        memory: { total: 8 * 1024 * 1024 * 1024, type: 'DDR4' },
        disk: { total: 100 * 1024 * 1024 * 1024, type: 'SSD' },
        network: { bandwidth: 1000, type: '1G' },
      },
      apache: {
        cpu: { cores: 4, model: 'Intel Xeon E5-2680' },
        memory: { total: 8 * 1024 * 1024 * 1024, type: 'DDR4' },
        disk: { total: 100 * 1024 * 1024 * 1024, type: 'SSD' },
        network: { bandwidth: 1000, type: '1G' },
      },
      nodejs: {
        cpu: { cores: 8, model: 'Intel Xeon Gold 6154' },
        memory: { total: 16 * 1024 * 1024 * 1024, type: 'DDR4' },
        disk: { total: 200 * 1024 * 1024 * 1024, type: 'SSD' },
        network: { bandwidth: 1000, type: '1G' },
      },
      springboot: {
        cpu: { cores: 8, model: 'Intel Xeon Gold 6154' },
        memory: { total: 16 * 1024 * 1024 * 1024, type: 'DDR4' },
        disk: { total: 200 * 1024 * 1024 * 1024, type: 'SSD' },
        network: { bandwidth: 1000, type: '1G' },
      },
      postgresql: {
        cpu: { cores: 16, model: 'Intel Xeon Platinum 8175M' },
        memory: { total: 64 * 1024 * 1024 * 1024, type: 'DDR4' }, // 16GB 이상
        disk: { total: 1024 * 1024 * 1024 * 1024, type: 'NVMe' },
        network: { bandwidth: 10000, type: '10G' },
      },
      redis: {
        cpu: { cores: 4, model: 'Intel Xeon E5-2680' },
        memory: { total: 32 * 1024 * 1024 * 1024, type: 'DDR4' },
        disk: { total: 100 * 1024 * 1024 * 1024, type: 'SSD' },
        network: { bandwidth: 1000, type: '1G' },
      },
      elasticsearch: {
        cpu: { cores: 8, model: 'Intel Xeon Gold 6154' },
        memory: { total: 32 * 1024 * 1024 * 1024, type: 'DDR4' },
        disk: { total: 500 * 1024 * 1024 * 1024, type: 'SSD' },
        network: { bandwidth: 1000, type: '1G' },
      },
      rabbitmq: {
        cpu: { cores: 4, model: 'Intel Xeon E5-2680' },
        memory: { total: 8 * 1024 * 1024 * 1024, type: 'DDR4' },
        disk: { total: 200 * 1024 * 1024 * 1024, type: 'SSD' },
        network: { bandwidth: 1000, type: '1G' },
      },
    };

    return specs[type] || specs.nginx;
  }

  /**
   * 서버 타입별 기본 메트릭
   */
  private getBaselineMetrics(type: string): BaselineMetrics {
    const metrics: Record<string, BaselineMetrics> = {
      nginx: {
        cpu: { usage: 25, load1: 0.8 },
        memory: {
          used: 2 * 1024 * 1024 * 1024,
          available: 6 * 1024 * 1024 * 1024,
        },
        disk: { utilization: 40, io: { read: 50, write: 25 } },
        network: { io: { rx: 1024 * 1024, tx: 512 * 1024 } },
      },
      postgresql: {
        cpu: { usage: 60, load1: 4.0 },
        memory: {
          used: 48 * 1024 * 1024 * 1024,
          available: 16 * 1024 * 1024 * 1024,
        },
        disk: { utilization: 70, io: { read: 500, write: 300 } },
        network: { io: { rx: 5120 * 1024, tx: 2560 * 1024 } },
      },
      // 다른 타입들은 nginx 기본값 사용
    };

    return metrics[type] || metrics.nginx;
  }

  /**
   * 시나리오별 메트릭 생성
   * @param scenario 시나리오 타입 ('normal' | 'warning' | 'critical')
   * @returns 시나리오에 맞는 메트릭 배열
   */
  generateScenarioMetrics(
    scenario: 'normal' | 'warning' | 'critical'
  ): ServerMetric[] {
    if (!this.baselineDataset) {
      this.baselineDataset = this.generateBaselineDataset();
    }

    return this.baselineDataset.servers.map(server => {
      const timestamp = new Date();
      let cpuUsage = Math.random() * 100;
      let memoryUsage = Math.random() * 100;

      // 시나리오별 메트릭 조정
      switch (scenario) {
        case 'critical':
          // 심각 시나리오: 90% 이상 확률로 높은 사용률
          cpuUsage = Math.random() > 0.1 ? 90 + Math.random() * 10 : cpuUsage;
          memoryUsage =
            Math.random() > 0.1 ? 95 + Math.random() * 5 : memoryUsage;
          break;

        case 'warning':
          // 경고 시나리오: 70% 확률로 중간 사용률
          cpuUsage = Math.random() > 0.3 ? 80 + Math.random() * 15 : cpuUsage;
          memoryUsage =
            Math.random() > 0.3 ? 85 + Math.random() * 12 : memoryUsage;
          break;

        case 'normal':
        default:
          // 정상 시나리오: 낮은 사용률로 제한
          cpuUsage = Math.min(cpuUsage, 65);
          memoryUsage = Math.min(memoryUsage, 75);
          break;
      }

      return {
        timestamp,
        serverId: server.id,
        systemMetrics: {
          cpuUsage,
          memoryUsage,
          diskUsage: Math.random() * 100,
          networkUsage: Math.random() * 100,
        },
        applicationMetrics: {
          requestCount: Math.floor(Math.random() * 1000),
          errorRate: Math.random() * 10,
          responseTime: 50 + Math.random() * 200,
        },
      };
    });
  }

  /**
   * 세션 시작
   */
  async startSession(sessionId: string): Promise<void> {
    const startTime = new Date();

    // 자동 정지 타이머 설정
    const autoStopTimer = setTimeout(() => {
      this.stopSession(sessionId, true); // 자동 정지
    }, this.SESSION_DURATION_MS);

    this.activeSessions.set(sessionId, { startTime, autoStopTimer });
    this.batchBuffer.set(sessionId, []);
  }

  /**
   * 세션 활성 상태 확인
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  /**
   * 세션 정지
   */
  async stopSession(
    sessionId: string,
    isAutoStop: boolean = false
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // 타이머 정리
    if (session.autoStopTimer) {
      clearTimeout(session.autoStopTimer);
    }

    // 배치 플러시
    await this.flushBatchToCloudStorage(sessionId);

    // 자동 정지 기록
    if (isAutoStop) {
      this.autoFlushedSessions.add(sessionId);
    }

    // 세션 정리
    this.activeSessions.delete(sessionId);
  }

  /**
   * 자동 플러시 여부 확인
   */
  wasSessionAutoFlushed(sessionId: string): boolean {
    return this.autoFlushedSessions.has(sessionId);
  }

  /**
   * 시간 경과 시뮬레이션 (테스트용)
   */
  async simulateTimeElapse(
    sessionId: string,
    milliseconds: number
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // 타이머 정리
    if (session.autoStopTimer) {
      clearTimeout(session.autoStopTimer);
    }

    // 즉시 자동 정지 실행
    if (milliseconds >= this.SESSION_DURATION_MS) {
      await this.stopSession(sessionId, true);
    }
  }

  /**
   * 히스토리컬 패턴 생성
   * @param startDate 시작 날짜 (YYYY-MM-DD)
   * @param endDate 종료 날짜 (YYYY-MM-DD)
   * @param interval 간격 ('daily' | 'hourly')
   * @returns 히스토리컬 데이터 배열
   */
  async generateHistoricalPattern(
    startDate: string,
    endDate: string,
    interval: 'daily' | 'hourly'
  ): Promise<HistoricalDataPoint[]> {
    if (!this.baselineDataset) {
      this.baselineDataset = this.generateBaselineDataset();
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const historicalData: HistoricalDataPoint[] = [];

    // 일별 데이터 생성
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0=일요일, 6=토요일
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // 주말/평일 패턴 적용
      const baseLoad = isWeekend ? 0.25 : 0.7; // 주말 25%, 평일 70%
      const variability = isWeekend ? 0.1 : 0.2; // 주말은 변동성도 낮게

      const dayData: HistoricalDataPoint = {
        date: currentDate.toISOString().split('T')[0],
        servers: this.baselineDataset.servers,
        metrics: {
          averageCpuUsage: this.generateHistoricalMetric(
            baseLoad,
            variability,
            100
          ),
          averageMemoryUsage: this.generateHistoricalMetric(
            baseLoad,
            variability,
            100
          ),
          totalRequests: Math.floor(
            this.generateHistoricalMetric(baseLoad, variability, 10000)
          ),
          averageResponseTime:
            this.generateHistoricalMetric(0.5, 0.3, 200) + 50, // 50-250ms
        },
      };

      historicalData.push(dayData);

      // 다음 날로 이동
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return historicalData;
  }

  /**
   * 히스토리컬 메트릭 생성 헬퍼
   */
  private generateHistoricalMetric(
    baseLoad: number,
    variability: number,
    maxValue: number
  ): number {
    const variation = (Math.random() - 0.5) * 2 * variability; // -variability ~ +variability
    const finalLoad = Math.max(0, Math.min(1, baseLoad + variation));
    return finalLoad * maxValue;
  }
}
