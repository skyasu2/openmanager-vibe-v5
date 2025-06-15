/**
 * 🚀 고급 서버 데이터 생성기 v2.0
 *
 * 독립적으로 사용 가능한 고급 서버 메트릭 생성 모듈
 * - 6가지 서버 타입 지원 (K8s, Host, Cloud, Container, VM, Edge)
 * - 실시간 메트릭 생성 및 Redis 캐싱
 * - 시간대별 로드 패턴 시뮬레이션
 * - 서버 타입별 특화 메트릭
 *
 * @version 2.0.0
 * @author OpenManager Vibe Team
 * @standalone true
 */

import {
  ServerMetadata,
  TimeSeriesMetrics,
  LogEntry,
  TraceData,
  DataGenerationConfig,
  AIAnalysisDataset,
} from '@/types/ai-agent-input-schema';
import { setRealtime, setBatch } from '@/lib/cache/redis';

// 🎯 모듈 메타데이터
export const MODULE_INFO = {
  name: 'AdvancedServerDataGenerator',
  version: '2.0.0',
  description: '고급 서버 메트릭 생성 및 시뮬레이션',
  features: [
    '6가지 서버 타입 지원',
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

export class AdvancedServerDataGenerator implements IDataGenerator {
  private config: DataGenerationConfig;
  private servers: ServerMetadata[] = [];
  private isRunning: boolean = false;
  private intervals: NodeJS.Timeout[] = [];
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
          K8s: 2,
          Host: 2,
          Cloud: 2,
          Container: 2,
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
      'K8s',
      'Host',
      'Cloud',
      'Container',
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
      };

      this.servers.push(server);
    }
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
    const currentLoad = Math.min(baseLoad * timeMultiplier, 0.95);

    return {
      timestamp: now,
      serverId: server.id,
      system: {
        cpu: {
          usage: Math.max(5, currentLoad * 100 + (Math.random() - 0.5) * 10),
          load1: currentLoad * server.resources.cpu.cores + Math.random() * 0.5,
          load5:
            currentLoad * server.resources.cpu.cores * 0.8 +
            Math.random() * 0.3,
          load15:
            currentLoad * server.resources.cpu.cores * 0.6 +
            Math.random() * 0.2,
          processes: Math.floor(50 + currentLoad * 200 + Math.random() * 50),
          threads: Math.floor(200 + currentLoad * 800 + Math.random() * 100),
        },
        memory: {
          used: Math.floor(
            server.resources.memory.total * (0.2 + currentLoad * 0.6)
          ),
          available: Math.floor(
            server.resources.memory.total * (0.8 - currentLoad * 0.6)
          ),
          buffers: Math.floor(server.resources.memory.total * 0.05),
          cached: Math.floor(server.resources.memory.total * 0.15),
          swap: {
            used: Math.floor(server.resources.memory.total * 0.1 * currentLoad),
            total: Math.floor(server.resources.memory.total * 0.1),
          },
        },
        disk: {
          io: {
            read: Math.floor(100 + currentLoad * 500 + Math.random() * 100),
            write: Math.floor(50 + currentLoad * 300 + Math.random() * 50),
          },
          throughput: {
            read: Math.floor(10 + currentLoad * 100 + Math.random() * 20),
            write: Math.floor(5 + currentLoad * 50 + Math.random() * 10),
          },
          utilization: Math.max(1, currentLoad * 80 + Math.random() * 10),
          queue: Math.floor(currentLoad * 10 + Math.random() * 5),
        },
        network: {
          io: {
            rx: Math.floor(
              1024 * 1024 * (1 + currentLoad * 10) + Math.random() * 1024 * 1024
            ),
            tx: Math.floor(
              1024 * 1024 * (0.5 + currentLoad * 5) + Math.random() * 1024 * 512
            ),
          },
          packets: {
            rx: Math.floor(1000 + currentLoad * 5000 + Math.random() * 1000),
            tx: Math.floor(800 + currentLoad * 4000 + Math.random() * 800),
          },
          errors: {
            rx: Math.floor(Math.random() * 10),
            tx: Math.floor(Math.random() * 5),
          },
          connections: {
            active: Math.floor(10 + currentLoad * 100 + Math.random() * 50),
            established: Math.floor(
              50 + currentLoad * 500 + Math.random() * 100
            ),
          },
        },
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
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`고급 데이터 생성기 시작: ${this.servers.length}개 서버`);

    // 메트릭 생성 (20초 간격으로 조정)
    const metricsInterval = setInterval(() => {
      this.servers.forEach(server => {
        const metrics = this.generateMetrics(server);
        this.dataBuffer.metrics.push(metrics);

        // 실시간 데이터 저장
        setRealtime(server.id, {
          timestamp: metrics.timestamp,
          cpu: metrics.system.cpu.usage,
          memory:
            (metrics.system.memory.used /
              (metrics.system.memory.used + metrics.system.memory.available)) *
            100,
          status: 'healthy',
        }).catch(console.error);
      });
    }, 20000); // 🎯 성능 최적화: 10초 → 20초로 변경 (서버 부하 50% 감소)

    this.intervals.push(metricsInterval);
  }

  // 데이터 생성 중지
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    console.log('고급 데이터 생성기 중지됨');
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

  // 🔍 샘플 메트릭 생성 (데이터가 없을 때)
  private generateSampleMetrics(): TimeSeriesMetrics[] {
    const metrics: TimeSeriesMetrics[] = [];
    const now = Date.now();

    for (const server of this.servers) {
      for (let i = 0; i < 60; i++) {
        // 1시간 분량 (1분 간격)
        const timestamp = new Date(now - (60 - i) * 60 * 1000);
        metrics.push(this.generateMetrics(server));
      }
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
