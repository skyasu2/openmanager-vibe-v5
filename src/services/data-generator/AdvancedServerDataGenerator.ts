/**
 * 🚀 고급 서버 데이터 생성기 v2.0
 *
 * 독립적으로 사용 가능한 고급 서버 메트릭 생성 모듈
 * - 5가지 서버 타입 지원 (K8s, Host, Cloud, VM, Edge)
 * - 실시간 메트릭 생성 및 Redis 캐싱
 * - 시간대별 로드 패턴 시뮬레이션
 * - 서버 타입별 특화 메트릭
 *
 * @version 2.0.0
 * @author OpenManager Vibe Team
 * @standalone true
 */

import { setRealtime } from '@/lib/redis';
import {
  AIAnalysisDataset,
  DataGenerationConfig,
  LogEntry,
  ProcessInfo,
  ServerMetadata,
  TimeSeriesMetrics,
  TraceData,
} from '@/types/ai-agent-input-schema';

// 🎯 모듈 메타데이터
export const MODULE_INFO = {
  name: 'AdvancedServerDataGenerator',
  version: '2.0.0',
  description: '고급 서버 메트릭 생성 및 시뮬레이션',
  features: [
    '5가지 서버 타입 지원',
    '실시간 메트릭 생성',
    'Redis 캐싱 통합',
    '시간대별 로드 패턴',
    '서버 타입별 특화 메트릭',
  ],
  standalone: true,
  dependencies: ['redis', 'ai-agent-input-schema'],
} as const;

// 🔧 표준 인터페이스
export interface IDataGenerator {
  start(): void;
  stop(): void;
  isGenerating(): boolean;
  getServers(): ServerMetadata[];
  generateDataset(): AIAnalysisDataset;
}

// 서버 타입별 기본 프로세스 목록 정의
const BASE_PROCESSES: Record<string, string[]> = {
  Web: ['nginx', 'httpd', 'varnish', 'traefik'],
  API: ['node', 'gunicorn', 'uvicorn', 'pm2'],
  Database: ['postgres', 'mysqld', 'mongod', 'clickhouse-server'],
  Cache: ['redis-server', 'memcached'],
  ML: ['python', 'jupyter-notebook', 'tensorflow-serving'],
  Analytics: ['kafka', 'spark-worker', 'flink-taskmanager'],
  Gateway: ['kong', 'envoy', 'istiod'],
  Default: ['systemd', 'sshd', 'cron', 'postgresql', 'journald'],
};

export class AdvancedServerDataGenerator implements IDataGenerator {
  private config: DataGenerationConfig;
  private servers: ServerMetadata[] = [];
  private isRunning: boolean = false;
  private timeouts: NodeJS.Timeout[] = [];
  private dataBuffer: {
    metrics: TimeSeriesMetrics[];
    logs: LogEntry[];
    traces: TraceData[];
  } = { metrics: [], logs: [], traces: [] };

  constructor(config: DataGenerationConfig) {
    this.config = config;
    this.initializeServers();
  }

  // 🏗️ 정적 팩토리 메서드 (독립 실행용)
  public static createStandalone(
    serverCount: number = 10
  ): AdvancedServerDataGenerator {
    const config: DataGenerationConfig = {
      servers: {
        count: serverCount,
        types: {
          Host: 1,
          Cloud: 1,
          VM: 1,
          Edge: 1,
        },
        regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      },
      patterns: {
        dailyCycle: true,
        weeklyCycle: true,
        anomalyRate: 0.05,
        correlationStrength: 0.7,
      },
      performance: {
        batchSize: 100,
        intervalMs: 60000, // 1분
        bufferSize: 1000,
      },
      ai: {
        analysisInterval: 5, // 5분
        modelType: 'hybrid',
        features: ['cpu', 'memory', 'disk', 'network', 'response_time'],
      },
    };

    return new AdvancedServerDataGenerator(config);
  }

  // 서버 메타데이터 초기화
  private initializeServers(): void {
    this.servers = [];

    const serverTypes: Array<ServerMetadata['serverType']> = [
      'Host',
      'Cloud',
      'VM',
      'Edge',
    ];
    const regions = this.config.servers.regions;
    const usageProfiles = [
      'Web',
      'API',
      'Database',
      'Cache',
      'ML',
      'Analytics',
      'CDN',
      'Gateway',
    ] as const;
    const tiers = ['Development', 'Staging', 'Production', 'Testing'] as const;

    for (let i = 0; i < this.config.servers.count; i++) {
      const serverType =
        serverTypes[Math.floor(Math.random() * serverTypes.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const usageProfile =
        usageProfiles[Math.floor(Math.random() * usageProfiles.length)];
      const tier = tiers[Math.floor(Math.random() * tiers.length)];

      const server: ServerMetadata = {
        id: `server-${i.toString().padStart(3, '0')}`,
        name: `${serverType}-${usageProfile}-${i}`,
        serverType,
        location: {
          region,
          zone: `${region}-${Math.floor(Math.random() * 3) + 1}`,
          datacenter: `DC-${Math.floor(Math.random() * 5) + 1}`,
          cloud:
            serverType === 'Cloud'
              ? (['AWS', 'GCP', 'Azure'][Math.floor(Math.random() * 3)] as any)
              : 'On-Premise',
        },
        os: {
          type: ['Linux', 'Windows'][Math.floor(Math.random() * 2)] as any,
          distribution: 'Ubuntu 22.04',
          version: '22.04.3',
          architecture: 'x64',
        },
        usageProfile: {
          type: usageProfile,
          tier,
          criticality: tier === 'Production' ? 'High' : 'Medium',
          scalingType: ['Manual', 'Auto', 'Scheduled'][
            Math.floor(Math.random() * 3)
          ] as any,
        },
        resources: {
          cpu: {
            cores: [2, 4, 8, 16, 32][Math.floor(Math.random() * 5)],
            model: 'Intel Xeon E5-2686 v4',
            clockSpeed: 2.3,
          },
          memory: {
            total:
              [8, 16, 32, 64, 128][Math.floor(Math.random() * 5)] *
              1024 *
              1024 *
              1024,
            type: 'DDR4',
          },
          storage: {
            total:
              [100, 500, 1000, 2000][Math.floor(Math.random() * 4)] *
              1024 *
              1024 *
              1024,
            type: 'SSD',
          },
          network: {
            bandwidth: [1, 10, 25][Math.floor(Math.random() * 3)],
            type: '10G',
          },
        },
        tags: {
          environment: tier.toLowerCase(),
          role: usageProfile.toLowerCase(),
          owner: 'ops-team',
          cost_center: `cc-${Math.floor(Math.random() * 100) + 1}`,
        },
        created: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ),
        lastUpdate: new Date(),
        processes: this.generateInitialProcesses(usageProfile),
      };

      this.servers.push(server);
    }
  }

  // 초기 프로세스 목록 생성 메서드
  private generateInitialProcesses(usageProfile: string): ProcessInfo[] {
    const coreProcesses = BASE_PROCESSES[usageProfile] || [];
    const defaultProcesses = BASE_PROCESSES['Default'];
    const allProcessNames = [
      ...new Set([...coreProcesses, ...defaultProcesses]),
    ];

    return allProcessNames.map((name, index) => ({
      pid: 1000 + index * 10 + Math.floor(Math.random() * 10),
      name: name,
      cpuUsage: 0,
      memoryUsage: 0,
      status: 'running',
      user: name === 'systemd' ? 'root' : 'www-data',
      startTime: new Date(
        Date.now() - Math.random() * 3600 * 1000
      ).toISOString(),
    }));
  }

  // 실시간 메트릭 생성
  private generateMetrics(server: ServerMetadata): TimeSeriesMetrics {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // 시간대별 로드 패턴
    const timeMultiplier = this.getTimeMultiplier(hour, dayOfWeek);

    // 서버 타입별 기본 부하
    const baseLoad = this.getBaseLoad(server.usageProfile.type);

    // 현재 부하 계산
    const currentLoad =
      baseLoad * timeMultiplier * (1 + (Math.random() - 0.5) * 0.1);

    // 실시간 프로세스 메트릭 생성
    const currentProcesses = this.generateProcessMetrics(server, currentLoad);

    return {
      timestamp: now,
      serverId: server.id,
      system: {
        cpu: {
          usage: Math.min(99.9, currentLoad * 50 + Math.random() * 5),
          load1: currentLoad * 2,
          load5: currentLoad * 1.5,
          load15: currentLoad * 1,
          processes: server.processes.length + Math.floor(Math.random() * 5),
          threads: server.processes.length * 3 + Math.floor(Math.random() * 20),
        },
        memory: {
          used:
            server.resources.memory.total * (0.3 + currentLoad * 0.5) +
            Math.random() * 1024 * 1024 * 100,
          available: server.resources.memory.total * (0.7 - currentLoad * 0.5),
          buffers: Math.random() * 1024 * 1024 * 50,
          cached: Math.random() * 1024 * 1024 * 500,
          swap: { used: 0, total: 1024 * 1024 * 1024 },
        },
        disk: {
          io: { read: Math.random() * 1000, write: Math.random() * 500 },
          throughput: { read: Math.random() * 100, write: Math.random() * 50 },
          utilization: Math.min(95, 20 + currentLoad * 60 + Math.random() * 10),
          queue: Math.floor(Math.random() * 5),
        },
        network: {
          io: { rx: Math.random() * 1e6, tx: Math.random() * 5e5 },
          packets: { rx: Math.random() * 10000, tx: Math.random() * 5000 },
          errors: { rx: 0, tx: 0 },
          connections: {
            active: Math.floor(currentLoad * 100),
            established: Math.floor(currentLoad * 80),
          },
        },
        processes: currentProcesses,
      },
      application: {
        requests: {
          total: Math.floor(100 + currentLoad * 1000 + Math.random() * 200),
          success: Math.floor(95 + currentLoad * 950 + Math.random() * 50),
          errors: Math.floor(5 + currentLoad * 50 + Math.random() * 10),
          latency: {
            p50: 50 + currentLoad * 200 + Math.random() * 50,
            p95: 100 + currentLoad * 500 + Math.random() * 100,
            p99: 200 + currentLoad * 1000 + Math.random() * 200,
          },
        },
        database: {
          connections: {
            active: Math.floor(5 + currentLoad * 50 + Math.random() * 10),
            idle: Math.floor(10 + currentLoad * 20 + Math.random() * 5),
          },
          queries: {
            total: Math.floor(50 + currentLoad * 500 + Math.random() * 100),
            slow: Math.floor(currentLoad * 10 + Math.random() * 5),
          },
          locks: Math.floor(currentLoad * 20 + Math.random() * 10),
          deadlocks: Math.floor(Math.random() * 3),
        },
        cache: {
          hits: Math.floor(80 + Math.random() * 20),
          misses: Math.floor(10 + Math.random() * 10),
          evictions: Math.floor(Math.random() * 5),
          memory: Math.floor(1024 * 1024 * 100 * currentLoad),
        },
      },
      infrastructure: {},
    };
  }

  // 실시간 프로세스 메트릭 생성 헬퍼
  private generateProcessMetrics(
    server: ServerMetadata,
    currentLoad: number
  ): ProcessInfo[] {
    return server.processes.map(p => {
      const cpuUsage =
        Math.random() *
        currentLoad *
        10 *
        (p.name.includes('sql') || p.name.includes('node') ? 2 : 1);
      const memoryUsage =
        p.memoryUsage + (Math.random() - 0.5) * 1024 * 1024 * 5; // 5MB 내외 변동

      return {
        ...p,
        cpuUsage: parseFloat(cpuUsage.toFixed(2)),
        memoryUsage: Math.max(1024 * 1024, memoryUsage), // 최소 1MB 보장
        status:
          p.status === 'running' && Math.random() < 0.001
            ? 'sleeping'
            : p.status,
      };
    });
  }

  // 시간대별 부하 계수
  private getTimeMultiplier(hour: number, dayOfWeek: number): number {
    if (!this.config.patterns.dailyCycle && !this.config.patterns.weeklyCycle) {
      return 1;
    }

    let multiplier = 1;

    if (this.config.patterns.dailyCycle) {
      // 일일 패턴: 오전 9시-오후 6시 피크
      if (hour >= 9 && hour <= 18) {
        multiplier *= 1.5;
      } else if (hour >= 6 && hour <= 22) {
        multiplier *= 1.2;
      } else {
        multiplier *= 0.7;
      }
    }

    if (this.config.patterns.weeklyCycle) {
      // 주간 패턴: 평일 vs 주말
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        multiplier *= 1.3;
      } else {
        multiplier *= 0.8;
      }
    }

    // 이상 현상 시뮬레이션
    if (Math.random() < this.config.patterns.anomalyRate) {
      multiplier *= 1.5 + Math.random(); // 1.5x ~ 2.5x spike
    }

    return multiplier;
  }

  // 서버 타입별 기본 부하
  private getBaseLoad(type: string): number {
    const loadMap: Record<string, number> = {
      Web: 0.3,
      API: 0.4,
      Database: 0.6,
      Cache: 0.2,
      ML: 0.8,
      Analytics: 0.7,
      CDN: 0.3,
      Gateway: 0.4,
    };

    return loadMap[type] || 0.4;
  }

  // 데이터 생성 시작
  public start(): void {
    if (this.isRunning) {
      console.warn('Advanced Server Data Generator는 이미 실행 중입니다.');
      return;
    }
    this.isRunning = true;
    console.log(
      `🚀 Advanced Server Data Generator 시작... ${this.servers.length}개 서버에 대한 데이터 생성을 시작합니다.`
    );

    this.servers.forEach(server => {
      this.scheduleNextGeneration(server.id);
    });
  }

  private scheduleNextGeneration(serverId: string): void {
    const server = this.servers.find(s => s.id === serverId);
    if (!this.isRunning || !server) return;

    // 38초에서 48초 사이의 랜덤한 지연 시간 계산 (38000ms + 0~10000ms)
    const delay = 38000 + Math.random() * 10000;

    const timeout = setTimeout(async () => {
      try {
        const metrics = this.generateMetrics(server);

        // Redis에 실시간 메트릭 저장
        await setRealtime(`server:${server.id}:metrics:latest`, metrics);

        console.log(
          `[DataGen] 서버 ${server.name}(${server.id}) 데이터 생성 완료. 다음 생성까지 약 ${Math.round(delay / 1000)}초 후.`
        );
      } catch (error) {
        console.error(
          `[DataGen] 서버 ${serverId} 데이터 생성 중 오류 발생:`,
          error
        );
      } finally {
        // 다음 생성을 재귀적으로 스케줄링
        if (this.isRunning) {
          this.scheduleNextGeneration(serverId);
        }
      }
    }, delay);

    this.timeouts.push(timeout);
  }

  // 데이터 생성 중지
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    console.log(
      '🔌 Advanced Server Data Generator 중지 중... 모든 생성 작업을 취소합니다.'
    );
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
    console.log('✅ Advanced Server Data Generator가 안전하게 중지되었습니다.');
  }

  // 서버 목록 조회
  public getServers(): ServerMetadata[] {
    return this.servers;
  }

  // 실행 상태 조회
  public isGenerating(): boolean {
    return this.isRunning;
  }

  // 🎯 AI 분석용 데이터셋 생성 (표준 인터페이스 구현)
  public generateDataset(): AIAnalysisDataset {
    const now = new Date();
    const dataset: AIAnalysisDataset = {
      metadata: {
        generationTime: now,
        timeRange: {
          start: new Date(now.getTime() - 60 * 60 * 1000), // 1시간 전
          end: now,
        },
        serverCount: this.servers.length,
        dataPoints: this.dataBuffer.metrics.length || 60 * this.servers.length,
        version: MODULE_INFO.version,
      },
      servers: this.servers,
      metrics:
        this.dataBuffer.metrics.length > 0
          ? this.dataBuffer.metrics
          : this.generateSampleMetrics(),
      logs:
        this.dataBuffer.logs.length > 0
          ? this.dataBuffer.logs
          : this.generateSampleLogs(),
      traces:
        this.dataBuffer.traces.length > 0
          ? this.dataBuffer.traces
          : this.generateSampleTraces(),
      patterns: {
        anomalies: [],
        correlations: [],
        trends: [],
      },
    };

    return dataset;
  }

  // 샘플 데이터 생성 (내부 테스트 및 디버깅용)
  private generateSampleMetrics(): TimeSeriesMetrics[] {
    const metrics: TimeSeriesMetrics[] = [];
    for (const server of this.servers) {
      metrics.push({
        ...this.generateMetrics(server),
        // 샘플 데이터용으로 추가적인 가공이 필요하다면 여기에
      });
    }
    return metrics;
  }

  // 📝 샘플 로그 생성
  private generateSampleLogs(): LogEntry[] {
    const logs: LogEntry[] = [];
    const now = Date.now();

    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(now - Math.random() * 60 * 60 * 1000);
      const server =
        this.servers[Math.floor(Math.random() * this.servers.length)];

      logs.push({
        timestamp,
        serverId: server.id,
        level: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)] as any,
        component: server.usageProfile.type,
        message: this.generateLogMessage(),
        metadata: {
          requestId: `req-${i.toString().padStart(6, '0')}`,
          method: 'GET',
          endpoint: '/api/health',
        },
        structured: {
          category: ['System', 'Application', 'Security'][
            Math.floor(Math.random() * 3)
          ] as any,
          tags: [server.serverType, server.location.region],
          context: {
            serverId: server.id,
            serverType: server.serverType,
            region: server.location.region,
          },
        },
        analysis: {
          anomaly: Math.random() < 0.1,
          sentiment: 'Neutral',
          pattern: 'normal_operation',
        },
      });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // 🔗 샘플 트레이스 생성
  private generateSampleTraces(): TraceData[] {
    const traces: TraceData[] = [];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now - Math.random() * 60 * 60 * 1000);
      const server =
        this.servers[Math.floor(Math.random() * this.servers.length)];

      traces.push({
        traceId: `trace-${i.toString().padStart(6, '0')}`,
        spanId: `span-${i.toString().padStart(6, '0')}`,
        serverId: server.id,
        serviceName: server.usageProfile.type,
        operationName: this.generateOperationName(),
        timestamp,
        duration: Math.floor(Math.random() * 1000) + 10,
        status: 'OK',
        tags: {
          serverId: server.id,
          region: server.location.region,
          environment: server.tags.environment,
        },
        logs: [],
        dependencies: {
          upstream: [],
          downstream: [],
        },
        performance: {
          dbQueries: Math.floor(Math.random() * 10),
          apiCalls: Math.floor(Math.random() * 5),
          cacheHits: Math.floor(Math.random() * 20),
          cacheMisses: Math.floor(Math.random() * 5),
        },
      });
    }

    return traces.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // 🔧 헬퍼 메서드들
  private generateLogMessage(): string {
    const messages = [
      'System health check completed successfully',
      'Database connection pool optimized',
      'Cache hit ratio improved to 95%',
      'Memory usage within normal parameters',
      'Network latency spike detected',
      'Auto-scaling triggered due to high load',
      'Backup process completed',
      'Security scan finished - no threats detected',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private generateOperationName(): string {
    const operations = [
      'GET /api/users',
      'POST /api/orders',
      'PUT /api/products',
      'DELETE /api/cache',
      'database.query',
      'cache.get',
      'auth.validate',
      'file.upload',
    ];
    return operations[Math.floor(Math.random() * operations.length)];
  }
}
