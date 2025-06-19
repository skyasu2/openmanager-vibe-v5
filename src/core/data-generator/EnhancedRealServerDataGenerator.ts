/**
 * 🚀 Enhanced Real Server Data Generator v2.0
 *
 * 모든 데이터 생성기 기능을 통합한 완전한 서버 데이터 생성기
 * - RealServerDataGenerator: Redis 연동, 8개 서버 아키텍처
 * - OptimizedDataGenerator: 24시간 베이스라인 최적화
 * - AdvancedServerDataGenerator: 고급 메트릭, 시계열 데이터
 * - RealisticDataGenerator: 5가지 데모 시나리오
 */

import {
  ServerInstance,
  ServerCluster,
  ApplicationMetrics,
} from '@/types/data-generator';
import {
  EnhancedServerMetrics,
  ServerEnvironment,
  ServerRole,
  ServerStatus,
} from '@/types/server';
import Redis from 'ioredis';

// 베이스라인 데이터 인터페이스 (OptimizedDataGenerator에서)
interface BaselineDataPoint {
  timestamp: number;
  cpu_baseline: number;
  memory_baseline: number;
  disk_baseline: number;
  network_in_baseline: number;
  network_out_baseline: number;
  response_time_baseline: number;
  pattern_multiplier: number;
}

interface ServerBaselineData {
  server_id: string;
  hostname: string;
  environment: string;
  role: string;
  baseline_status: string;
  daily_pattern: BaselineDataPoint[];
  last_generated: number;
}

interface RealTimeVariation {
  cpu_variation: number;
  memory_variation: number;
  disk_variation: number;
  network_variation: number;
  response_variation: number;
  burst_active: boolean;
  anomaly_factor: number;
}

// 고급 메트릭 인터페이스 (AdvancedServerDataGenerator에서)
interface ServerMetadata {
  id: string;
  name: string;
  serverType: 'K8s' | 'Host' | 'Cloud' | 'Container' | 'VM' | 'Edge';
  location: {
    region: string;
    zone: string;
    datacenter: string;
    cloud: 'AWS' | 'GCP' | 'Azure' | 'On-Premise';
  };
  resources: {
    cpu: { cores: number; model: string; clockSpeed: number };
    memory: { total: number; type: string };
    storage: { total: number; type: string };
    network: { bandwidth: number; type: string };
  };
  tags: Record<string, string>;
  created: Date;
  lastUpdate: Date;
}

interface TimeSeriesMetrics {
  timestamp: Date;
  serverId: string;
  system: {
    cpu: { usage: number; load1: number; load5: number; load15: number };
    memory: {
      used: number;
      available: number;
      buffers: number;
      cached: number;
    };
    disk: { io: { read: number; write: number }; utilization: number };
    network: {
      io: { rx: number; tx: number };
      packets: { rx: number; tx: number };
    };
  };
}

// 시나리오 인터페이스 (RealisticDataGenerator에서)
export type DemoScenario =
  | 'normal'
  | 'spike'
  | 'memory_leak'
  | 'ddos'
  | 'performance_degradation';

interface ScenarioConfig {
  name: string;
  description: string;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedMetrics: string[];
  triggerEvents: string[];
}

export interface EnhancedGeneratorConfig {
  // 기본 설정 (RealServerDataGenerator)
  maxServers?: number;
  updateInterval?: number;
  enableRealtime?: boolean;
  serverArchitecture?:
    | 'single'
    | 'master-slave'
    | 'load-balanced'
    | 'microservices';
  enableRedis?: boolean;

  // 최적화 설정 (OptimizedDataGenerator)
  usePregenerated?: boolean;
  realTimeVariationIntensity?: number;
  memoryOptimizationEnabled?: boolean;

  // 고급 설정 (AdvancedServerDataGenerator)
  enableAdvancedMetrics?: boolean;
  regions?: string[];
  serverTypes?: string[];

  // 시나리오 설정 (RealisticDataGenerator)
  enableDemoMode?: boolean;
  defaultScenario?: DemoScenario;
}

export class EnhancedRealServerDataGenerator {
  private static instance: EnhancedRealServerDataGenerator | null = null;

  // 기본 데이터 (RealServerDataGenerator)
  private servers: Map<string, ServerInstance> = new Map();
  private clusters: Map<string, ServerCluster> = new Map();
  private applications: Map<string, ApplicationMetrics> = new Map();

  // 최적화 데이터 (OptimizedDataGenerator)
  private baselineStorage = new Map<string, ServerBaselineData>();
  private currentVariations = new Map<string, RealTimeVariation>();
  private lastPatternUpdate: number = 0;

  // 고급 데이터 (AdvancedServerDataGenerator)
  private serverMetadata = new Map<string, ServerMetadata>();
  private timeSeriesBuffer: TimeSeriesMetrics[] = [];

  // 시나리오 데이터 (RealisticDataGenerator)
  private currentScenario: DemoScenario = 'normal';
  private scenarioStartTime: Date = new Date();
  private scenarios: Record<DemoScenario, ScenarioConfig>;

  // 공통 설정
  private config: EnhancedGeneratorConfig;
  private redis: Redis | null = null;
  private isInitialized = false;
  private isGenerating = false;
  private intervalId?: NodeJS.Timeout;

  // Redis 키 프리픽스
  private readonly REDIS_PREFIX = 'openmanager:enhanced:servers:';
  private readonly REDIS_CLUSTERS_PREFIX = 'openmanager:enhanced:clusters:';
  private readonly REDIS_BASELINE_PREFIX = 'openmanager:enhanced:baseline:';

  constructor(config: EnhancedGeneratorConfig = {}) {
    this.config = {
      maxServers: parseInt(process.env.SERVER_COUNT || '15'),
      updateInterval: 20000, // 🎯 20초로 통일
      enableRealtime: true,
      serverArchitecture: 'load-balanced',
      enableRedis: true,
      usePregenerated: true,
      realTimeVariationIntensity: 0.15,
      memoryOptimizationEnabled: true,
      enableAdvancedMetrics: true,
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      serverTypes: ['K8s', 'Host', 'Cloud', 'Container'],
      enableDemoMode: true,
      defaultScenario: 'normal',
      ...config,
    };

    this.initializeScenarios();
    this.initializeRedis();
  }

  public static getInstance(): EnhancedRealServerDataGenerator {
    if (!EnhancedRealServerDataGenerator.instance) {
      EnhancedRealServerDataGenerator.instance =
        new EnhancedRealServerDataGenerator();
    }
    return EnhancedRealServerDataGenerator.instance;
  }

  /**
   * 🎭 시나리오 초기화 (RealisticDataGenerator에서)
   */
  private initializeScenarios(): void {
    this.scenarios = {
      normal: {
        name: '정상 운영 상태',
        description: '일반적인 업무 시간 중 정상 서버 운영',
        duration: 30,
        severity: 'low',
        affectedMetrics: [],
        triggerEvents: ['daily_backup', 'routine_maintenance'],
      },
      spike: {
        name: '갑작스런 트래픽 증가',
        description: '마케팅 이벤트나 뉴스로 인한 급격한 사용자 증가',
        duration: 15,
        severity: 'medium',
        affectedMetrics: [
          'cpu',
          'memory',
          'network',
          'responseTime',
          'connections',
        ],
        triggerEvents: ['viral_content', 'marketing_campaign', 'news_mention'],
      },
      memory_leak: {
        name: '메모리 누수 발생',
        description: '애플리케이션 버그로 인한 점진적 메모리 증가',
        duration: 45,
        severity: 'high',
        affectedMetrics: ['memory', 'responseTime', 'cpu'],
        triggerEvents: ['code_deployment', 'memory_allocation_bug'],
      },
      ddos: {
        name: 'DDoS 공격 시뮬레이션',
        description: '분산 서비스 거부 공격으로 인한 시스템 부하',
        duration: 20,
        severity: 'critical',
        affectedMetrics: ['network', 'cpu', 'connections', 'responseTime'],
        triggerEvents: ['security_breach', 'malicious_traffic'],
      },
      performance_degradation: {
        name: '점진적 성능 저하',
        description: '디스크 공간 부족이나 데이터베이스 성능 저하',
        duration: 60,
        severity: 'high',
        affectedMetrics: ['disk', 'responseTime', 'cpu'],
        triggerEvents: ['database_slowdown', 'disk_fragmentation'],
      },
    };
  }

  /**
   * 🔴 Redis 연결 초기화 (RealServerDataGenerator에서)
   */
  private async initializeRedis(): Promise<void> {
    if (!this.config.enableRedis) {
      console.log('📊 Enhanced Generator: Redis 비활성화 - 메모리 모드로 실행');
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
      const redisHost =
        process.env.REDIS_HOST || 'charming-condor-46598.upstash.io';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisPassword =
        process.env.REDIS_PASSWORD ||
        process.env.KV_REST_API_TOKEN ||
        'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA';

      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      } else {
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          tls: {},
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      }

      await this.redis.ping();
      console.log('✅ Enhanced Generator: Redis 연결 성공');
    } catch (error) {
      console.warn(
        '⚠️ Enhanced Generator: Redis 연결 실패, 메모리 모드로 폴백:',
        error
      );
      this.redis = null;
      this.config.enableRedis = false;
    }
  }

  /**
   * 🚀 초기화 (모든 기능 통합)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Enhanced Real Server Data Generator 초기화 시작...');

    try {
      // 1. 기본 서버 초기화 (RealServerDataGenerator)
      this.initializeServers();

      // 2. 베이스라인 데이터 생성 (OptimizedDataGenerator)
      if (this.config.usePregenerated) {
        await this.generateBaselineData();
      }

      // 3. 고급 메타데이터 초기화 (AdvancedServerDataGenerator)
      if (this.config.enableAdvancedMetrics) {
        this.initializeServerMetadata();
      }

      // 4. 클러스터 및 애플리케이션 초기화
      this.createClusters();
      this.createApplications();

      this.isInitialized = true;
      console.log('✅ Enhanced Real Server Data Generator 초기화 완료');
    } catch (error) {
      console.error(
        '❌ Enhanced Real Server Data Generator 초기화 실패:',
        error
      );
      throw error;
    }
  }

  /**
   * 🏗️ 기본 서버 초기화 (RealServerDataGenerator에서)
   */
  private initializeServers(): void {
    const serverTypes = [
      'web',
      'api',
      'database',
      'cache',
      'queue',
      'cdn',
      'gpu',
      'storage',
    ];
    const serverRoles = [
      'master',
      'slave',
      'primary',
      'replica',
      'worker',
      'standalone',
    ];
    const environments = ['production', 'staging', 'development', 'test'];

    for (let i = 0; i < this.config.maxServers!; i++) {
      const serverType = serverTypes[i % serverTypes.length] as any;
      const serverRole = serverRoles[i % serverRoles.length] as any;
      const environment = environments[i % environments.length] as any;

      const server: ServerInstance = {
        id: `enhanced-server-${i.toString().padStart(3, '0')}`,
        name: `${serverType}-${environment}-${i}`,
        type: serverType,
        role: serverRole,
        location: this.config.regions![i % this.config.regions!.length],
        status: 'running',
        environment,
        specs: {
          cpu: {
            cores: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
            model: 'Intel Xeon',
          },
          memory: {
            total:
              [8, 16, 32, 64][Math.floor(Math.random() * 4)] *
              1024 *
              1024 *
              1024,
            type: 'DDR4',
          },
          disk: {
            total:
              [100, 500, 1000][Math.floor(Math.random() * 3)] *
              1024 *
              1024 *
              1024,
            type: 'SSD',
          },
          network: { bandwidth: [1, 10, 25][Math.floor(Math.random() * 3)] },
        },
        metrics: {
          cpu: 25 + Math.random() * 20,
          memory: 40 + Math.random() * 20,
          disk: 60 + Math.random() * 15,
          network: {
            in: 1000 + Math.random() * 500,
            out: 800 + Math.random() * 400,
          },
          requests: Math.floor(100 + Math.random() * 500),
          errors: Math.floor(Math.random() * 10),
          uptime: 99.5 + Math.random() * 0.5,
        },
        health: {
          score: 85 + Math.random() * 15,
          issues: [],
          lastCheck: new Date().toISOString(),
        },
      };

      this.servers.set(server.id, server);
    }

    console.log(`🏗️ ${this.servers.size}개 서버 초기화 완료`);
  }

  /**
   * 🏗️ 24시간 베이스라인 데이터 생성 (OptimizedDataGenerator에서)
   */
  private async generateBaselineData(): Promise<void> {
    console.log('🏗️ 24시간 베이스라인 데이터 생성 시작...');

    for (const [serverId, server] of this.servers) {
      const baseline = await this.createServerBaseline(server);
      this.baselineStorage.set(serverId, baseline);
      this.currentVariations.set(serverId, this.generateInitialVariation());
    }

    this.lastPatternUpdate = Date.now();
    console.log(`🏗️ ${this.baselineStorage.size}개 서버 베이스라인 생성 완료`);
  }

  /**
   * 📊 서버별 베이스라인 생성
   */
  private async createServerBaseline(
    server: ServerInstance
  ): Promise<ServerBaselineData> {
    const dailyPattern: BaselineDataPoint[] = [];

    // 24시간 = 1440분, 15분 간격으로 96개 포인트
    for (let minute = 0; minute < 1440; minute += 15) {
      const hour = Math.floor(minute / 60);
      const timePattern = this.calculateTimePattern(hour, minute % 60);

      dailyPattern.push({
        timestamp: minute,
        cpu_baseline: 25 + timePattern * 30,
        memory_baseline: 40 + timePattern * 25,
        disk_baseline: 60 + timePattern * 15,
        network_in_baseline: 1000 + timePattern * 2000,
        network_out_baseline: 800 + timePattern * 1500,
        response_time_baseline: 100 + timePattern * 200,
        pattern_multiplier: timePattern,
      });
    }

    return {
      server_id: server.id,
      hostname: server.name,
      environment: server.environment,
      role: server.role,
      baseline_status: server.status,
      daily_pattern: dailyPattern,
      last_generated: Date.now(),
    };
  }

  /**
   * ⏰ 시간대별 패턴 계산
   */
  private calculateTimePattern(hour: number, minute: number): number {
    // 업무시간 패턴 (9-18시 높음)
    if (hour >= 9 && hour <= 18) {
      return 1.0 + Math.sin(((hour - 9) / 9) * Math.PI) * 0.3;
    } else if (hour >= 19 && hour <= 23) {
      return 0.7 + Math.sin(((hour - 19) / 4) * Math.PI) * 0.2;
    } else {
      return 0.3 + Math.sin((hour / 24) * Math.PI) * 0.1;
    }
  }

  /**
   * 🎲 초기 변동값 생성
   */
  private generateInitialVariation(): RealTimeVariation {
    return {
      cpu_variation: (Math.random() - 0.5) * 0.2,
      memory_variation: (Math.random() - 0.5) * 0.15,
      disk_variation: (Math.random() - 0.5) * 0.1,
      network_variation: (Math.random() - 0.5) * 0.3,
      response_variation: (Math.random() - 0.5) * 0.4,
      burst_active: Math.random() < 0.1,
      anomaly_factor: Math.random() < 0.05 ? Math.random() * 0.5 : 0,
    };
  }

  /**
   * 🏗️ 고급 서버 메타데이터 초기화 (AdvancedServerDataGenerator에서)
   */
  private initializeServerMetadata(): void {
    const serverTypes: Array<ServerMetadata['serverType']> = [
      'K8s',
      'Host',
      'Cloud',
      'Container',
      'VM',
      'Edge',
    ];

    for (const [serverId, server] of this.servers) {
      const serverType =
        serverTypes[Math.floor(Math.random() * serverTypes.length)];

      const metadata: ServerMetadata = {
        id: serverId,
        name: server.name,
        serverType,
        location: {
          region: server.location,
          zone: `${server.location}-${Math.floor(Math.random() * 3) + 1}`,
          datacenter: `DC-${Math.floor(Math.random() * 5) + 1}`,
          cloud:
            serverType === 'Cloud'
              ? (['AWS', 'GCP', 'Azure'][Math.floor(Math.random() * 3)] as any)
              : 'On-Premise',
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
          environment: server.environment,
          role: server.role,
          owner: 'ops-team',
          cost_center: `cc-${Math.floor(Math.random() * 100) + 1}`,
        },
        created: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ),
        lastUpdate: new Date(),
      };

      this.serverMetadata.set(serverId, metadata);
    }

    console.log(`🏗️ ${this.serverMetadata.size}개 서버 메타데이터 초기화 완료`);
  }

  /**
   * 🏗️ 클러스터 생성 (RealServerDataGenerator에서)
   */
  private createClusters(): void {
    const clusterCount = Math.ceil(this.servers.size / 3);

    for (let i = 0; i < clusterCount; i++) {
      const clusterId = `cluster-${i}`;
      const clusterServers = Array.from(this.servers.values()).slice(
        i * 3,
        (i + 1) * 3
      );

      if (clusterServers.length > 0) {
        const cluster: ServerCluster = {
          id: clusterId,
          name: `Cluster ${i + 1}`,
          servers: clusterServers,
          loadBalancer: {
            algorithm: 'round-robin',
            activeConnections: Math.floor(Math.random() * 1000),
            totalRequests: Math.floor(Math.random() * 10000),
          },
          scaling: {
            current: clusterServers.length,
            min: 1,
            max: 10,
            target: clusterServers.length,
            policy: 'cpu',
          },
        };

        this.clusters.set(clusterId, cluster);
      }
    }

    console.log(`🏗️ ${this.clusters.size}개 클러스터 생성 완료`);
  }

  /**
   * 🏗️ 애플리케이션 생성 (RealServerDataGenerator에서)
   */
  private createApplications(): void {
    const appNames = [
      'Frontend',
      'API Gateway',
      'User Service',
      'Payment Service',
      'Analytics',
    ];

    appNames.forEach((name, index) => {
      const app: ApplicationMetrics = {
        name,
        version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        deployments: {
          production: {
            servers: Math.floor(Math.random() * 5) + 1,
            health: 85 + Math.random() * 15,
          },
          staging: {
            servers: Math.floor(Math.random() * 3) + 1,
            health: 80 + Math.random() * 20,
          },
          development: {
            servers: Math.floor(Math.random() * 2) + 1,
            health: 75 + Math.random() * 25,
          },
        },
        performance: {
          responseTime: Math.floor(Math.random() * 200) + 50,
          throughput: Math.floor(Math.random() * 1000) + 100,
          errorRate: Math.random() * 5,
          availability: 99.0 + Math.random() * 1.0,
        },
        resources: {
          totalCpu: Math.random() * 80 + 10,
          totalMemory: Math.random() * 70 + 20,
          totalDisk: Math.random() * 60 + 30,
          cost: Math.floor(Math.random() * 10000) + 1000,
        },
      };

      this.applications.set(`app-${index}`, app);
    });

    console.log(`🏗️ ${this.applications.size}개 애플리케이션 생성 완료`);
  }

  /**
   * 📊 실시간 데이터 생성 (모든 기능 통합)
   */
  public async generateRealTimeData(): Promise<EnhancedServerMetrics[]> {
    const enhancedMetrics: EnhancedServerMetrics[] = [];

    for (const [serverId, server] of this.servers) {
      let metrics: EnhancedServerMetrics;

      if (this.config.usePregenerated && this.baselineStorage.has(serverId)) {
        // 베이스라인 + 실시간 변동 방식
        metrics = await this.generateOptimizedMetrics(serverId, server);
      } else {
        // 기본 실시간 생성 방식
        metrics = this.generateBasicMetrics(serverId, server);
      }

      // 시나리오 적용
      if (this.config.enableDemoMode) {
        metrics = this.applyScenarioModifier(metrics);
      }

      enhancedMetrics.push(metrics);
    }

    // Redis 저장
    if (this.redis) {
      await this.saveMetricsToRedis(enhancedMetrics);
    }

    return enhancedMetrics;
  }

  /**
   * 📊 최적화된 메트릭 생성 (베이스라인 + 변동)
   */
  private async generateOptimizedMetrics(
    serverId: string,
    server: ServerInstance
  ): Promise<EnhancedServerMetrics> {
    const baseline = this.baselineStorage.get(serverId)!;
    const variation = this.currentVariations.get(serverId)!;

    // 현재 시간에 해당하는 베이스라인 찾기
    const now = new Date();
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    const baselineIndex = Math.floor(currentMinute / 15);
    const currentBaseline =
      baseline.daily_pattern[baselineIndex] || baseline.daily_pattern[0];

    // 베이스라인 + 실시간 변동 적용
    const cpu = this.applyVariation(
      currentBaseline.cpu_baseline,
      variation.cpu_variation,
      variation.anomaly_factor
    );
    const memory = this.applyVariation(
      currentBaseline.memory_baseline,
      variation.memory_variation,
      variation.anomaly_factor
    );
    const disk = this.applyVariation(
      currentBaseline.disk_baseline,
      variation.disk_variation,
      variation.anomaly_factor
    );

    return {
      id: serverId,
      hostname: server.name,
      environment: server.environment as any,
      role: server.role as any,
      status: this.calculateCurrentStatus(currentBaseline, variation) as any,
      cpu_usage: Math.max(1, Math.min(100, cpu)),
      memory_usage: Math.max(10, Math.min(100, memory)),
      disk_usage: Math.max(20, Math.min(100, disk)),
      network_in: Math.max(
        0,
        this.applyVariation(
          currentBaseline.network_in_baseline,
          variation.network_variation,
          variation.anomaly_factor
        )
      ),
      network_out: Math.max(
        0,
        this.applyVariation(
          currentBaseline.network_out_baseline,
          variation.network_variation,
          variation.anomaly_factor
        )
      ),
      response_time: Math.max(
        50,
        this.applyVariation(
          currentBaseline.response_time_baseline,
          variation.response_variation,
          variation.anomaly_factor
        )
      ),
      uptime: this.calculateUptime(
        this.calculateCurrentStatus(currentBaseline, variation) as any
      ),
      last_updated: new Date().toISOString(),
      alerts: [],
      name: server.name,
    };
  }

  /**
   * 📊 기본 메트릭 생성
   */
  private generateBasicMetrics(
    serverId: string,
    server: ServerInstance
  ): EnhancedServerMetrics {
    return {
      id: serverId,
      hostname: server.name,
      environment: server.environment as any,
      role: server.role as any,
      status: 'online' as any,
      cpu_usage: 25 + Math.random() * 50,
      memory_usage: 40 + Math.random() * 40,
      disk_usage: 60 + Math.random() * 25,
      network_in: 1000 + Math.random() * 2000,
      network_out: 800 + Math.random() * 1500,
      response_time: 100 + Math.random() * 200,
      uptime: 99.5 + Math.random() * 0.5,
      last_updated: new Date().toISOString(),
      alerts: [],
      name: server.name,
    };
  }

  /**
   * 🎭 시나리오 수정자 적용 (RealisticDataGenerator에서)
   */
  private applyScenarioModifier(
    metrics: EnhancedServerMetrics
  ): EnhancedServerMetrics {
    const scenario = this.scenarios[this.currentScenario];
    const timeSinceStart = Date.now() - this.scenarioStartTime.getTime();
    const progress = Math.min(
      timeSinceStart / (scenario.duration * 60 * 1000),
      1
    );

    let modifier = { cpu: 1, memory: 1, disk: 1, network: 1, responseTime: 1 };

    switch (this.currentScenario) {
      case 'spike':
        modifier = {
          cpu: 1 + Math.sin(progress * Math.PI) * 2.5,
          memory: 1 + Math.sin(progress * Math.PI) * 1.8,
          disk: 1 + Math.sin(progress * Math.PI) * 0.5,
          network: 1 + Math.sin(progress * Math.PI) * 3.0,
          responseTime: 1 + Math.sin(progress * Math.PI) * 4.0,
        };
        break;
      case 'memory_leak':
        modifier = {
          cpu: 1 + progress * 0.8,
          memory: 1 + progress * 2.5,
          disk: 1,
          network: 1,
          responseTime: 1 + progress * 1.5,
        };
        break;
      case 'ddos':
        modifier = {
          cpu: 1 + Math.sin(progress * Math.PI * 2) * 3.0,
          memory: 1 + Math.sin(progress * Math.PI * 2) * 1.5,
          disk: 1,
          network: 1 + Math.sin(progress * Math.PI * 2) * 5.0,
          responseTime: 1 + Math.sin(progress * Math.PI * 2) * 6.0,
        };
        break;
      case 'performance_degradation':
        modifier = {
          cpu: 1 + progress * 1.2,
          memory: 1 + progress * 0.8,
          disk: 1 + progress * 1.8,
          network: 1,
          responseTime: 1 + progress * 2.0,
        };
        break;
      default: // normal
        break;
    }

    return {
      ...metrics,
      cpu_usage: Math.max(1, Math.min(100, metrics.cpu_usage * modifier.cpu)),
      memory_usage: Math.max(
        10,
        Math.min(100, metrics.memory_usage * modifier.memory)
      ),
      disk_usage: Math.max(
        20,
        Math.min(100, metrics.disk_usage * modifier.disk)
      ),
      network_in: Math.max(0, metrics.network_in * modifier.network),
      network_out: Math.max(0, metrics.network_out * modifier.network),
      response_time: Math.max(
        50,
        metrics.response_time * modifier.responseTime
      ),
    };
  }

  /**
   * 💾 Redis에 메트릭 저장
   */
  private async saveMetricsToRedis(
    metrics: EnhancedServerMetrics[]
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const pipeline = this.redis.pipeline();

      for (const metric of metrics) {
        const key = `${this.REDIS_PREFIX}${metric.id}`;
        const data = JSON.stringify({
          ...metric,
          lastUpdated: new Date().toISOString(),
        });

        pipeline.setex(key, 3600, data); // 1시간 TTL
      }

      // 메트릭 목록 업데이트
      pipeline.sadd(`${this.REDIS_PREFIX}list`, ...metrics.map(m => m.id));

      await pipeline.exec();
    } catch (error) {
      console.warn('⚠️ Redis 메트릭 저장 실패:', error);
    }
  }

  /**
   * 🚀 자동 생성 시작
   */
  public startAutoGeneration(): void {
    if (this.isGenerating) return;

    this.isGenerating = true;
    this.intervalId = setInterval(async () => {
      try {
        await this.generateRealTimeData();
        this.updateVariations();
      } catch (error) {
        console.error('❌ 자동 생성 중 오류:', error);
      }
    }, this.config.updateInterval);

    console.log(
      `🚀 Enhanced Generator: 자동 생성 시작 (${this.config.updateInterval}ms 간격)`
    );
  }

  /**
   * ⏹️ 자동 생성 중지
   */
  public stopAutoGeneration(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isGenerating = false;
    console.log('⏹️ Enhanced Generator: 자동 생성 중지');
  }

  /**
   * 🔄 변동값 업데이트
   */
  private updateVariations(): void {
    for (const [serverId, variation] of this.currentVariations) {
      const newVariation: RealTimeVariation = {
        cpu_variation: variation.cpu_variation + (Math.random() - 0.5) * 0.05,
        memory_variation:
          variation.memory_variation + (Math.random() - 0.5) * 0.03,
        disk_variation: variation.disk_variation + (Math.random() - 0.5) * 0.02,
        network_variation:
          variation.network_variation + (Math.random() - 0.5) * 0.1,
        response_variation:
          variation.response_variation + (Math.random() - 0.5) * 0.15,
        burst_active: Math.random() < 0.05,
        anomaly_factor:
          Math.random() < 0.02
            ? Math.random() * 0.3
            : variation.anomaly_factor * 0.9,
      };

      // 변동값 제한
      newVariation.cpu_variation = Math.max(
        -0.3,
        Math.min(0.3, newVariation.cpu_variation)
      );
      newVariation.memory_variation = Math.max(
        -0.2,
        Math.min(0.2, newVariation.memory_variation)
      );
      newVariation.disk_variation = Math.max(
        -0.1,
        Math.min(0.1, newVariation.disk_variation)
      );
      newVariation.network_variation = Math.max(
        -0.5,
        Math.min(0.5, newVariation.network_variation)
      );
      newVariation.response_variation = Math.max(
        -0.6,
        Math.min(0.6, newVariation.response_variation)
      );

      this.currentVariations.set(serverId, newVariation);
    }
  }

  // 유틸리티 메서드들
  private applyVariation(
    baseline: number,
    variation: number,
    anomaly: number
  ): number {
    return baseline * (1 + variation + anomaly);
  }

  private calculateCurrentStatus(
    baseline: BaselineDataPoint,
    variation: RealTimeVariation
  ): string {
    const totalLoad =
      baseline.cpu_baseline *
      (1 + variation.cpu_variation + variation.anomaly_factor);

    if (totalLoad > 90 || variation.anomaly_factor > 0.3) return 'warning';
    if (totalLoad > 75 || variation.burst_active) return 'warning';
    return 'online';
  }

  private calculateUptime(status: string): number {
    switch (status) {
      case 'online':
        return 99.5 + Math.random() * 0.5;
      case 'warning':
        return 98.0 + Math.random() * 1.5;
      case 'offline':
        return 95.0 + Math.random() * 3.0;
      default:
        return 99.0;
    }
  }

  // 공개 API 메서드들
  public getAllServers(): ServerInstance[] {
    return Array.from(this.servers.values());
  }

  public getServerById(id: string): ServerInstance | undefined {
    return this.servers.get(id);
  }

  public getAllClusters(): ServerCluster[] {
    return Array.from(this.clusters.values());
  }

  public getAllApplications(): ApplicationMetrics[] {
    return Array.from(this.applications.values());
  }

  public setScenario(scenario: DemoScenario): void {
    this.currentScenario = scenario;
    this.scenarioStartTime = new Date();
    console.log(`🎭 시나리오 변경: ${this.scenarios[scenario].name}`);
  }

  public getCurrentScenario(): DemoScenario {
    return this.currentScenario;
  }

  public getScenarios(): Record<DemoScenario, ScenarioConfig> {
    return this.scenarios;
  }

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isGenerating: this.isGenerating,
      serversCount: this.servers.size,
      clustersCount: this.clusters.size,
      applicationsCount: this.applications.size,
      baselineDataCount: this.baselineStorage.size,
      currentScenario: this.currentScenario,
      redisConnected: this.redis !== null,
      config: this.config,
      lastPatternUpdate: new Date(this.lastPatternUpdate).toISOString(),
    };
  }

  public dispose(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.redis) {
      this.redis.disconnect();
    }
    this.servers.clear();
    this.clusters.clear();
    this.applications.clear();
    this.baselineStorage.clear();
    this.currentVariations.clear();
    this.serverMetadata.clear();
    this.timeSeriesBuffer.length = 0;
    this.isInitialized = false;
    this.isGenerating = false;
    console.log('🧹 Enhanced Real Server Data Generator 정리 완료');
  }
}

// 싱글톤 인스턴스 export
export const enhancedRealServerDataGenerator =
  EnhancedRealServerDataGenerator.getInstance();
