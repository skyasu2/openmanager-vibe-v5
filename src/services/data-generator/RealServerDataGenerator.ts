/**
 * 🎰 실제 서버 데이터 생성기 v3 - 독립적 3단계 모드
 *
 * 기능:
 * - 환경별 3단계 모드: local(고성능) → premium(최적화) → basic(기본)
 * - 공용 환경 감지 사용으로 중복 제거
 * - 실제 시스템 메트릭 기반 데이터 생성
 * - 현실적인 서버 부하 시뮬레이션
 * - 🆕 고급 기능 플러그인 지원 (network-topology, baseline-optimizer, demo-scenarios)
 */

import { realPrometheusCollector } from '../collectors/RealPrometheusCollector';
import { smartRedis } from '@/lib/redis';
import {
  detectEnvironment,
  env,
  getDataGeneratorConfig,
  isPluginEnabled,
  getPluginConfig,
  getVercelOptimizedConfig,
} from '@/config/environment';
import { VercelCache } from '@/lib/cache/redis';

// 🆕 고급 기능 모듈들 (플러그인 활성화시에만 사용)
import {
  generateNetworkTopology,
  type NetworkNode,
  type NetworkConnection,
} from '../../modules/advanced-features/network-topology';
import {
  baselineOptimizer,
  getCurrentBaseline,
  type BaselineDataPoint,
} from '../../modules/advanced-features/baseline-optimizer';
import {
  demoScenariosGenerator,
  generateScenarioMetrics,
  setDemoScenario,
  type DemoScenario,
  type ScenarioMetrics,
} from '../../modules/advanced-features/demo-scenarios';

// 커스텀 환경 설정 인터페이스
export interface CustomEnvironmentConfig {
  serverArchitecture:
    | 'single'
    | 'master-slave'
    | 'load-balanced'
    | 'microservices';
  databaseType: 'single' | 'replica' | 'sharded' | 'distributed';
  networkTopology: 'simple' | 'dmz' | 'multi-cloud' | 'hybrid';
  specialWorkload: 'standard' | 'gpu' | 'storage' | 'container';
  scalingPolicy: 'manual' | 'auto' | 'predictive';
  securityLevel: 'basic' | 'enhanced' | 'enterprise';
}

// 확장된 서버 인터페이스
export interface ServerInstance {
  id: string;
  name: string;
  type:
    | 'web'
    | 'api'
    | 'database'
    | 'cache'
    | 'queue'
    | 'cdn'
    | 'gpu'
    | 'storage';
  role: 'master' | 'slave' | 'primary' | 'replica' | 'worker' | 'standalone';
  location: string;
  status: 'running' | 'stopped' | 'warning' | 'error' | 'maintenance';
  environment: 'production' | 'staging' | 'development' | 'test';
  specs: {
    cpu: { cores: number; model: string; architecture?: string };
    memory: { total: number; type: string; speed?: number };
    disk: { total: number; type: string; iops?: number };
    network: { bandwidth: number; latency?: number };
    gpu?: { count: number; model: string; memory: number };
  };
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: { in: number; out: number };
    requests: number;
    errors: number;
    uptime: number;
    // 특화 메트릭
    customMetrics?: {
      replication_lag?: number;
      connection_pool?: number;
      cache_hit_ratio?: number;
      gpu_utilization?: number;
      storage_iops?: number;
      container_count?: number;
    };
  };
  health: {
    score: number;
    issues: string[];
    lastCheck: string;
  };
  security?: {
    level: 'basic' | 'enhanced' | 'enterprise';
    lastSecurityScan: string;
    vulnerabilities: number;
    patchLevel: string;
  };
}

export interface ServerCluster {
  id: string;
  name: string;
  servers: ServerInstance[];
  loadBalancer: {
    algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
    activeConnections: number;
    totalRequests: number;
  };
  scaling: {
    current: number;
    min: number;
    max: number;
    target: number;
    policy: 'cpu' | 'memory' | 'requests';
  };
}

export interface ApplicationMetrics {
  name: string;
  version: string;
  deployments: {
    production: { servers: number; health: number };
    staging: { servers: number; health: number };
    development: { servers: number; health: number };
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
  };
  resources: {
    totalCpu: number;
    totalMemory: number;
    totalDisk: number;
    cost: number;
  };
}

/**
 * 🚀 OpenManager 7.0 제품 수준 서버 데이터 생성기
 * 
 * Vercel 환경 최적화:
 * - 메모리 효율적 배치 처리
 * - Redis fallback 메커니즘
 * - 환경별 설정 분리
 */

export class RealServerDataGenerator {
  private static instance: RealServerDataGenerator | null = null;
  private redis: any;
  private isGenerating = false;
  private generationInterval: NodeJS.Timeout | null = null;

  // 환경별 설정
  private environmentConfig: CustomEnvironmentConfig;
  private dataGeneratorConfig: ReturnType<typeof getDataGeneratorConfig>;

  // 서버 인스턴스들
  private servers: Map<string, ServerInstance> = new Map();
  private clusters: Map<string, ServerCluster> = new Map();
  private applications: Map<string, ApplicationMetrics> = new Map();

  // 🆕 고급 기능 데이터
  private networkTopology: {
    nodes: NetworkNode[];
    connections: NetworkConnection[];
  } | null = null;
  private currentDemoScenario: DemoScenario = 'normal';
  private baselineDataInitialized = false;

  // 시뮬레이션 설정 (환경별 동적 조정)
  private simulationConfig = {
    baseLoad: 0.3, // 기본 부하 30%
    peakHours: [9, 10, 11, 14, 15, 16], // 피크 시간
    incidents: {
      probability: 0.02, // 2% 확률로 문제 발생
      duration: 300000, // 5분간 지속
    },
    scaling: {
      enabled: true,
      threshold: 0.8, // 80% 이상시 스케일링
      cooldown: 180000, // 3분 대기
    },
  };

  private isRunning = false;
  private config = getVercelOptimizedConfig();
  private intervalId: NodeJS.Timeout | null = null;
  
  // 24시간 베이스라인 데이터 (메모리 최적화)
  private serverBaselines = new Map<string, any>();
  
  // 현재 서버 상태 (Vercel 메모리 제한 고려)
  private currentStates = new Map<string, any>();
  
  // 변화 패턴 (경량화)
  private patterns = new Map<string, any>();

  private constructor() {
    // 공용 환경 감지 사용
    const env = detectEnvironment();
    this.dataGeneratorConfig = getDataGeneratorConfig();

    console.log(
      `🎰 서버 데이터 생성기 모드: ${(this.dataGeneratorConfig.mode || 'basic').toUpperCase()}`
    );
    console.log(`📊 최대 서버 수: ${this.dataGeneratorConfig.maxServers}`);
    console.log(`⏰ 갱신 주기: ${this.dataGeneratorConfig.refreshInterval}ms`);
    console.log(
      `🚀 활성 기능: ${(this.dataGeneratorConfig.features || []).join(', ')}`
    );

    // 환경별 기본 설정
    this.environmentConfig = this.getEnvironmentSpecificConfig();
    this.applyModeOptimizations();
    this.initializeServers();

    this.initializeBaselines();
    console.log('🎯 RealServerDataGenerator 초기화 완료');
    console.log(`🌍 환경: ${this.config.NODE_ENV}`);
    console.log(`☁️ Vercel 모드: ${this.config.IS_VERCEL}`);
  }

  public static getInstance(): RealServerDataGenerator {
    if (!RealServerDataGenerator.instance) {
      RealServerDataGenerator.instance = new RealServerDataGenerator();
    }
    return RealServerDataGenerator.instance;
  }

  /**
   * 🎯 환경별 특화 설정
   */
  private getEnvironmentSpecificConfig(): CustomEnvironmentConfig {
    const mode = this.dataGeneratorConfig.mode || 'basic';
    const features = this.dataGeneratorConfig.features || [];

    const baseConfig: CustomEnvironmentConfig = {
      serverArchitecture: 'load-balanced',
      databaseType: 'replica',
      networkTopology: 'simple',
      specialWorkload: 'standard',
      scalingPolicy: 'auto',
      securityLevel: 'enhanced',
    };

    // 모드별 최적화
    switch (mode) {
      case 'local':
        return {
          ...baseConfig,
          serverArchitecture: 'microservices',
          databaseType: 'distributed',
          networkTopology: 'multi-cloud',
          specialWorkload: features.includes('gpu-metrics')
            ? 'gpu'
            : 'container',
          scalingPolicy: 'predictive',
          securityLevel: 'enterprise',
        };

      case 'premium':
        return {
          ...baseConfig,
          serverArchitecture: 'load-balanced',
          databaseType: 'sharded',
          networkTopology: 'hybrid',
          specialWorkload: 'container',
          scalingPolicy: 'auto',
          securityLevel: 'enhanced',
        };

      case 'basic':
      default:
        return baseConfig;
    }
  }

  /**
   * ⚡ 모드별 최적화 적용
   */
  private applyModeOptimizations(): void {
    const mode = this.dataGeneratorConfig.mode || 'basic';

    switch (mode) {
      case 'local':
        // 로컬 모드: 최고 성능
        this.simulationConfig.incidents.probability = 0.05; // 더 많은 시나리오
        this.simulationConfig.scaling.threshold = 0.7; // 더 민감한 스케일링
        break;

      case 'premium':
        // 프리미엄 모드: 균형 잡힌 성능
        this.simulationConfig.incidents.probability = 0.03;
        this.simulationConfig.scaling.threshold = 0.75;
        break;

      case 'basic':
        // 기본 모드: 리소스 절약
        this.simulationConfig.incidents.probability = 0.01; // 최소한의 시나리오
        this.simulationConfig.scaling.threshold = 0.85; // 보수적인 스케일링
        break;
    }

    console.log(`⚡ ${(mode || 'basic').toUpperCase()} 모드 최적화 적용 완료`);
  }

  /**
   * 🚀 초기화
   */
  public async initialize(): Promise<void> {
    try {
      // 스마트 Redis 사용 (실제 Redis가 없을 때 메모리 캐시 동작)
      this.redis = smartRedis;

      await realPrometheusCollector.initialize();

      // 🆕 고급 기능 초기화
      await this.initializeAdvancedFeatures();

      console.log('✅ 실제 서버 데이터 생성기 초기화 완료');
    } catch (error) {
      console.warn('⚠️ 서버 데이터 생성기 초기화 실패:', error);

      // 초기화 실패 시에도 스마트 Redis 적용
      this.redis = smartRedis;
    }

    // 실패 여부와 관계없이 자동 생성 루프 시작
    this.startAutoGeneration();
  }

  /**
   * 🆕 고급 기능 초기화
   */
  private async initializeAdvancedFeatures(): Promise<void> {
    console.log('🔌 고급 기능 플러그인 확인 중...');

    // Network Topology 플러그인
    if (isPluginEnabled('network-topology')) {
      const config = getPluginConfig('network-topology');
      const nodeCount = Math.min(
        config.maxNodes || 20,
        this.dataGeneratorConfig.maxServers
      );

      this.networkTopology = generateNetworkTopology(nodeCount);
      console.log(
        `🌐 네트워크 토폴로지 생성: ${this.networkTopology.nodes.length}개 노드, ${this.networkTopology.connections.length}개 연결`
      );
    }

    // Baseline Optimizer 플러그인
    if (isPluginEnabled('baseline-optimizer')) {
      const servers = Array.from(this.servers.values());
      if (servers.length > 0) {
        await baselineOptimizer.generateBaselineData(servers);
        this.baselineDataInitialized = true;
        console.log('📊 베이스라인 최적화 시스템 활성화');
      }
    }

    // Demo Scenarios 플러그인
    if (isPluginEnabled('demo-scenarios')) {
      const config = getPluginConfig('demo-scenarios');
      this.currentDemoScenario = 'normal';

      if (config.autoRotate) {
        console.log('🎭 자동 시나리오 순환 활성화');
      }
      console.log('🎭 시연 시나리오 시스템 활성화');
    }
  }

  /**
   * 🏗️ 초기 서버 구성 (모드별 맞춤 구성)
   */
  private initializeServers(): void {
    const maxServers = this.dataGeneratorConfig.maxServers || 30;

    // 서버 수 제한 적용
    const adjustedArchitecture =
      maxServers < 10
        ? 'single'
        : maxServers < 20
          ? 'load-balanced'
          : this.environmentConfig.serverArchitecture;

    switch (adjustedArchitecture) {
      case 'single':
        this.createSingleServerEnvironment();
        break;
      case 'master-slave':
        this.createMasterSlaveEnvironment();
        break;
      case 'load-balanced':
        this.createLoadBalancedEnvironment();
        break;
      case 'microservices':
        this.createMicroservicesEnvironment();
        break;
      default:
        this.createLoadBalancedEnvironment();
    }

    // 서버 수 제한 확인
    if (this.servers.size > maxServers) {
      console.log(`⚠️ 서버 수 제한 적용: ${this.servers.size} → ${maxServers}`);
      this.limitServerCount(maxServers);
    }
  }

  /**
   * 🔒 서버 수 제한 적용
   */
  private limitServerCount(maxCount: number): void {
    const serverArray = Array.from(this.servers.entries());

    // 중요도 순으로 정렬 (database > api > web > cache > queue)
    const priorityOrder = [
      'database',
      'api',
      'web',
      'cache',
      'queue',
      'cdn',
      'gpu',
      'storage',
    ];
    serverArray.sort(([, a], [, b]) => {
      const aPriority = priorityOrder.indexOf(a.type);
      const bPriority = priorityOrder.indexOf(b.type);
      return aPriority - bPriority;
    });

    // 상위 maxCount 개만 유지
    this.servers.clear();
    serverArray.slice(0, maxCount).forEach(([id, server]) => {
      this.servers.set(id, server);
    });

    console.log(`✅ 서버 수 제한 완료: ${this.servers.size}개 서버 유지`);
  }

  /**
   * 🔧 단일 서버 환경 구성
   */
  private createSingleServerEnvironment(): void {
    this.createServer(
      'single-01',
      'All-in-One Server',
      'web',
      'Seoul-1A',
      'standalone',
      'production'
    );
    console.log('✅ 단일 서버 환경 구성 완료');
  }

  /**
   * 🔧 마스터-슬레이브 환경 구성
   */
  private createMasterSlaveEnvironment(): void {
    // 마스터 서버들
    this.createServer(
      'web-master',
      'Web Master',
      'web',
      'Seoul-1A',
      'master',
      'production'
    );
    this.createServer(
      'api-master',
      'API Master',
      'api',
      'Seoul-1A',
      'master',
      'production'
    );
    this.createServer(
      'db-master',
      'DB Master',
      'database',
      'Seoul-1A',
      'primary',
      'production'
    );

    // 슬레이브 서버들
    this.createServer(
      'web-slave',
      'Web Slave',
      'web',
      'Busan-2A',
      'slave',
      'production'
    );
    this.createServer(
      'api-slave',
      'API Slave',
      'api',
      'Busan-2A',
      'slave',
      'production'
    );
    this.createServer(
      'db-slave',
      'DB Replica',
      'database',
      'Busan-2A',
      'replica',
      'production'
    );

    console.log('✅ 마스터-슬레이브 환경 구성 완료');
  }

  /**
   * 🔧 로드밸런싱 환경 구성
   */
  private createLoadBalancedEnvironment(): void {
    // Web 서버들
    this.createServer(
      'web-01',
      'Frontend Server 1',
      'web',
      'Seoul-1A',
      'worker',
      'production'
    );
    this.createServer(
      'web-02',
      'Frontend Server 2',
      'web',
      'Seoul-1B',
      'worker',
      'production'
    );
    this.createServer(
      'web-03',
      'Frontend Server 3',
      'web',
      'Busan-2A',
      'worker',
      'production'
    );

    // API 서버들
    this.createServer(
      'api-01',
      'API Gateway 1',
      'api',
      'Seoul-1A',
      'worker',
      'production'
    );
    this.createServer(
      'api-02',
      'API Gateway 2',
      'api',
      'Seoul-1B',
      'worker',
      'production'
    );
    this.createServer(
      'api-03',
      'Microservice API',
      'api',
      'Seoul-1C',
      'worker',
      'production'
    );

    // 데이터베이스
    this.createServer(
      'db-01',
      'PostgreSQL Primary',
      'database',
      'Seoul-1A',
      'primary',
      'production'
    );
    this.createServer(
      'db-02',
      'PostgreSQL Replica',
      'database',
      'Busan-2A',
      'replica',
      'production'
    );
    this.createServer(
      'cache-01',
      'Redis Cache',
      'cache',
      'Seoul-1B',
      'standalone',
      'production'
    );

    // 특수 워크로드 서버 추가
    if (this.environmentConfig.specialWorkload === 'gpu') {
      this.createServer(
        'gpu-01',
        'GPU Compute Node',
        'gpu',
        'Seoul-1A',
        'worker',
        'production'
      );
    }
    if (this.environmentConfig.specialWorkload === 'storage') {
      this.createServer(
        'storage-01',
        'High-Performance Storage',
        'storage',
        'Seoul-1A',
        'standalone',
        'production'
      );
    }

    // 큐 서버
    this.createServer(
      'queue-01',
      'Message Queue',
      'queue',
      'Seoul-1C',
      'standalone',
      'production'
    );
    this.createServer(
      'cdn-01',
      'CDN Edge',
      'cdn',
      'Global',
      'standalone',
      'production'
    );

    // 클러스터 구성
    this.createCluster('web-cluster', '웹 서버 클러스터', [
      'web-01',
      'web-02',
      'web-03',
    ]);
    this.createCluster('api-cluster', 'API 서버 클러스터', [
      'api-01',
      'api-02',
      'api-03',
    ]);

    // 애플리케이션 메트릭
    this.createApplication('openmanager-vibe', 'OpenManager Vibe v5');

    console.log('✅ 로드밸런싱 환경 구성 완료');
  }

  /**
   * 🔧 마이크로서비스 환경 구성
   */
  private createMicroservicesEnvironment(): void {
    // 게이트웨이
    this.createServer(
      'gateway-01',
      'API Gateway',
      'api',
      'Seoul-1A',
      'master',
      'production'
    );

    // 마이크로서비스들
    this.createServer(
      'user-service',
      'User Service',
      'api',
      'Seoul-1A',
      'worker',
      'production'
    );
    this.createServer(
      'auth-service',
      'Auth Service',
      'api',
      'Seoul-1B',
      'worker',
      'production'
    );
    this.createServer(
      'monitor-service',
      'Monitor Service',
      'api',
      'Seoul-1C',
      'worker',
      'production'
    );
    this.createServer(
      'notification-service',
      'Notification Service',
      'api',
      'Busan-2A',
      'worker',
      'production'
    );

    // 전용 데이터베이스
    this.createServer(
      'user-db',
      'User Database',
      'database',
      'Seoul-1A',
      'standalone',
      'production'
    );
    this.createServer(
      'auth-db',
      'Auth Database',
      'database',
      'Seoul-1B',
      'standalone',
      'production'
    );
    this.createServer(
      'monitor-db',
      'Monitor Database',
      'database',
      'Seoul-1C',
      'standalone',
      'production'
    );

    // 공유 캐시 및 큐
    this.createServer(
      'redis-shared',
      'Shared Cache',
      'cache',
      'Seoul-1A',
      'standalone',
      'production'
    );
    this.createServer(
      'message-queue',
      'Message Queue',
      'queue',
      'Seoul-1B',
      'standalone',
      'production'
    );

    console.log('✅ 마이크로서비스 환경 구성 완료');
  }

  /**
   * 🖥️ 서버 생성
   */
  private createServer(
    id: string,
    name: string,
    type: ServerInstance['type'],
    location: string,
    role: ServerInstance['role'] = 'standalone',
    environment: ServerInstance['environment'] = 'production'
  ): void {
    const specs = this.generateServerSpecs(type);

    const server: ServerInstance = {
      id,
      name,
      type,
      role,
      location,
      environment,
      status: 'running',
      specs,
      metrics: {
        cpu: 20 + Math.random() * 30,
        memory: 30 + Math.random() * 40,
        disk: 40 + Math.random() * 30,
        network: { in: Math.random() * 100, out: Math.random() * 80 },
        requests: Math.floor(Math.random() * 1000),
        errors: Math.floor(Math.random() * 10),
        uptime: Math.random() * 2592000000, // 최대 30일
        customMetrics: this.generateCustomMetrics(type, role),
      },
      health: {
        score: 85 + Math.random() * 15,
        issues: [],
        lastCheck: new Date().toISOString(),
      },
      security: {
        level: this.environmentConfig.securityLevel,
        lastSecurityScan: new Date().toISOString(),
        vulnerabilities: Math.floor(Math.random() * 5),
        patchLevel: 'current',
      },
    };

    this.servers.set(id, server);
  }

  /**
   * 🔧 서버 스펙 생성
   */
  private generateServerSpecs(type: ServerInstance['type']) {
    const specTemplates = {
      web: {
        cpu: {
          cores: 4,
          model: 'Intel Xeon E5-2686v4',
          architecture: 'x86_64',
        },
        memory: { total: 8 * 1024 * 1024 * 1024, type: 'DDR4', speed: 2400 },
        disk: { total: 100 * 1024 * 1024 * 1024, type: 'SSD', iops: 3000 },
        network: { bandwidth: 1000, latency: 1 },
      },
      api: {
        cpu: {
          cores: 8,
          model: 'Intel Xeon E5-2686v4',
          architecture: 'x86_64',
        },
        memory: { total: 16 * 1024 * 1024 * 1024, type: 'DDR4', speed: 2400 },
        disk: { total: 200 * 1024 * 1024 * 1024, type: 'SSD', iops: 3000 },
        network: { bandwidth: 1000, latency: 1 },
      },
      database: {
        cpu: {
          cores: 16,
          model: 'Intel Xeon Platinum 8175M',
          architecture: 'x86_64',
        },
        memory: { total: 64 * 1024 * 1024 * 1024, type: 'DDR4', speed: 2666 },
        disk: {
          total: 1 * 1024 * 1024 * 1024 * 1024,
          type: 'NVMe SSD',
          iops: 50000,
        },
        network: { bandwidth: 10000, latency: 0.5 },
      },
      cache: {
        cpu: {
          cores: 8,
          model: 'Intel Xeon E5-2686v4',
          architecture: 'x86_64',
        },
        memory: { total: 32 * 1024 * 1024 * 1024, type: 'DDR4', speed: 2400 },
        disk: { total: 100 * 1024 * 1024 * 1024, type: 'SSD', iops: 3000 },
        network: { bandwidth: 1000, latency: 1 },
      },
      queue: {
        cpu: {
          cores: 4,
          model: 'Intel Xeon E5-2686v4',
          architecture: 'x86_64',
        },
        memory: { total: 8 * 1024 * 1024 * 1024, type: 'DDR4', speed: 2400 },
        disk: { total: 200 * 1024 * 1024 * 1024, type: 'SSD', iops: 3000 },
        network: { bandwidth: 1000, latency: 1 },
      },
      cdn: {
        cpu: {
          cores: 2,
          model: 'Intel Xeon E5-2686v4',
          architecture: 'x86_64',
        },
        memory: { total: 4 * 1024 * 1024 * 1024, type: 'DDR4', speed: 2400 },
        disk: { total: 500 * 1024 * 1024 * 1024, type: 'SSD', iops: 5000 },
        network: { bandwidth: 10000, latency: 0.5 },
      },
      gpu: {
        cpu: {
          cores: 32,
          model: 'Intel Xeon Gold 6248',
          architecture: 'x86_64',
        },
        memory: { total: 256 * 1024 * 1024 * 1024, type: 'DDR4', speed: 2933 },
        disk: {
          total: 2 * 1024 * 1024 * 1024 * 1024,
          type: 'NVMe SSD',
          iops: 100000,
        },
        network: { bandwidth: 25000, latency: 0.2 },
        gpu: {
          count: 8,
          model: 'NVIDIA A100',
          memory: 40 * 1024 * 1024 * 1024,
        },
      },
      storage: {
        cpu: {
          cores: 16,
          model: 'Intel Xeon Silver 4214',
          architecture: 'x86_64',
        },
        memory: { total: 128 * 1024 * 1024 * 1024, type: 'DDR4', speed: 2400 },
        disk: {
          total: 100 * 1024 * 1024 * 1024 * 1024,
          type: 'NVMe SSD',
          iops: 500000,
        },
        network: { bandwidth: 100000, latency: 0.1 },
      },
    };

    return specTemplates[type];
  }

  /**
   * 🎯 커스텀 메트릭 생성
   */
  private generateCustomMetrics(
    type: ServerInstance['type'],
    role: ServerInstance['role']
  ) {
    const customMetrics: any = {};

    switch (type) {
      case 'database':
        customMetrics.replication_lag =
          role === 'replica' ? Math.random() * 5 : 0;
        customMetrics.connection_pool = 50 + Math.floor(Math.random() * 50);
        break;
      case 'cache':
        customMetrics.cache_hit_ratio = 85 + Math.random() * 15;
        customMetrics.connection_pool = 100 + Math.floor(Math.random() * 100);
        break;
      case 'gpu':
        customMetrics.gpu_utilization = Math.random() * 100;
        break;
      case 'storage':
        customMetrics.storage_iops = 1000 + Math.floor(Math.random() * 50000);
        break;
      default:
        break;
    }

    return customMetrics;
  }

  /**
   * 🏗️ 클러스터 생성
   */
  private createCluster(id: string, name: string, serverIds: string[]): void {
    const servers = serverIds.map(id => this.servers.get(id)!).filter(Boolean);

    const cluster: ServerCluster = {
      id,
      name,
      servers,
      loadBalancer: {
        algorithm: 'round-robin',
        activeConnections: Math.floor(Math.random() * 1000),
        totalRequests: Math.floor(Math.random() * 100000),
      },
      scaling: {
        current: servers.length,
        min: Math.max(1, servers.length - 2),
        max: servers.length + 5,
        target: servers.length,
        policy: 'cpu',
      },
    };

    this.clusters.set(id, cluster);
  }

  /**
   * 📱 애플리케이션 생성
   */
  private createApplication(name: string, displayName: string): void {
    const app: ApplicationMetrics = {
      name: displayName,
      version: '5.21.0',
      deployments: {
        production: { servers: 8, health: 95 + Math.random() * 5 },
        staging: { servers: 3, health: 90 + Math.random() * 10 },
        development: { servers: 2, health: 80 + Math.random() * 20 },
      },
      performance: {
        responseTime: 150 + Math.random() * 100,
        throughput: 1000 + Math.random() * 2000,
        errorRate: Math.random() * 2,
        availability: 99.8 + Math.random() * 0.2,
      },
      resources: {
        totalCpu: 0,
        totalMemory: 0,
        totalDisk: 0,
        cost: 0,
      },
    };

    // 리소스 합계 계산
    Array.from(this.servers.values()).forEach(server => {
      app.resources.totalCpu += server.metrics.cpu;
      app.resources.totalMemory += server.metrics.memory;
      app.resources.totalDisk += server.metrics.disk;
    });

    app.resources.cost =
      app.resources.totalCpu * 0.1 + app.resources.totalMemory * 0.05;

    this.applications.set(name, app);
  }

  /**
   * 🔄 자동 데이터 생성 시작 (모드별 주기 적용)
   */
  public startAutoGeneration(): void {
    if (this.isGenerating) return;

    this.isGenerating = true;
    const { refreshInterval } = this.dataGeneratorConfig;

    const loop = async () => {
      if (!this.isGenerating) return;
      try {
        await this.generateRealtimeData();
      } catch (error) {
        console.error('❌ 실시간 데이터 생성 실패:', error);
      } finally {
        if (this.isGenerating) {
          this.generationInterval = setTimeout(loop, refreshInterval);
        }
      }
    };

    loop();
    console.log(`🔄 실시간 서버 데이터 생성 시작 (${refreshInterval}ms 주기)`);
  }

  /**
   * 📊 실시간 데이터 생성
   */
  private async generateRealtimeData(): Promise<void> {
    const currentHour = new Date().getHours();
    const isPeakHour = this.simulationConfig.peakHours.includes(currentHour);
    const loadMultiplier = isPeakHour ? 1.8 : 1.0;

    // 실제 시스템 메트릭 수집
    const realMetrics = await realPrometheusCollector.collectMetrics();

    // 각 서버 메트릭 업데이트
    for (const [id, server] of this.servers.entries()) {
      this.updateServerMetrics(server, loadMultiplier, realMetrics);

      // 장애 시뮬레이션
      this.simulateIncidents(server);

      // 건강도 계산
      this.calculateServerHealth(server);
    }

    // 클러스터 상태 업데이트
    for (const cluster of this.clusters.values()) {
      this.updateClusterMetrics(cluster);

      // 자동 스케일링 시뮬레이션
      if (this.simulationConfig.scaling.enabled) {
        this.simulateAutoScaling(cluster);
      }
    }

    // 애플리케이션 메트릭 업데이트
    for (const app of this.applications.values()) {
      this.updateApplicationMetrics(app);
    }

    // Redis에 캐시
    await this.cacheGeneratedData();
  }

  /**
   * 📈 서버 메트릭 업데이트
   */
  private updateServerMetrics(
    server: ServerInstance,
    loadMultiplier: number,
    realMetrics: any
  ): void {
    // 실제 시스템 메트릭을 기반으로 하되, 서버별 특성 적용
    const baseLoad = this.simulationConfig.baseLoad * loadMultiplier;

    // CPU: 실제 + 시뮬레이션
    const realCpuBase = realMetrics.cpu?.usage || 20;
    server.metrics.cpu = Math.min(
      95,
      realCpuBase + baseLoad * 50 + (Math.random() - 0.5) * 20
    );

    // Memory: 서버 타입별 패턴
    const memoryPattern =
      server.type === 'database' ? 0.7 : server.type === 'cache' ? 0.8 : 0.4;
    server.metrics.memory = Math.min(
      95,
      memoryPattern * 100 + (Math.random() - 0.5) * 30
    );

    // Disk: 점진적 증가 패턴
    server.metrics.disk = Math.min(
      95,
      server.metrics.disk + (Math.random() - 0.3) * 0.1
    );

    // Network
    server.metrics.network.in = baseLoad * 100 + Math.random() * 50;
    server.metrics.network.out = baseLoad * 80 + Math.random() * 40;

    // Requests (API/Web 서버만)
    if (server.type === 'api' || server.type === 'web') {
      server.metrics.requests = Math.floor(
        baseLoad * 1000 + Math.random() * 500
      );
      server.metrics.errors = Math.floor(
        server.metrics.requests * 0.01 * Math.random()
      );
    }

    // Uptime 증가
    server.metrics.uptime += 5000; // 5초 추가
  }

  /**
   * ⚠️ 장애 시뮬레이션
   */
  private simulateIncidents(server: ServerInstance): void {
    if (Math.random() < this.simulationConfig.incidents.probability) {
      const incidents = [
        'High CPU usage detected',
        'Memory leak suspected',
        'Disk space running low',
        'Network latency spike',
        'Database connection timeout',
        'Cache miss rate increased',
      ];

      const incident = incidents[Math.floor(Math.random() * incidents.length)];
      server.health.issues.push(incident);

      // 상태 변경
      if (server.health.issues.length > 2) {
        server.status = 'error';
      } else if (server.health.issues.length > 0) {
        server.status = 'warning';
      }

      // 일정 시간 후 복구
      setTimeout(() => {
        server.health.issues = server.health.issues.filter(i => i !== incident);
        if (server.health.issues.length === 0) {
          server.status = 'running';
        }
      }, this.simulationConfig.incidents.duration);
    }
  }

  /**
   * 💊 서버 건강도 계산
   */
  private calculateServerHealth(server: ServerInstance): void {
    let score = 100;

    // CPU 기반 감점
    if (server.metrics.cpu > 80) score -= 20;
    else if (server.metrics.cpu > 60) score -= 10;

    // Memory 기반 감점
    if (server.metrics.memory > 85) score -= 20;
    else if (server.metrics.memory > 70) score -= 10;

    // Disk 기반 감점
    if (server.metrics.disk > 90) score -= 15;
    else if (server.metrics.disk > 80) score -= 5;

    // 에러율 기반 감점
    if (server.metrics.errors > 0) {
      const errorRate =
        server.metrics.errors / Math.max(1, server.metrics.requests);
      score -= errorRate * 1000; // 1% 에러율 = 10점 감점
    }

    // 이슈 기반 감점
    score -= server.health.issues.length * 10;

    server.health.score = Math.max(0, Math.min(100, score));
    server.health.lastCheck = new Date().toISOString();
  }

  /**
   * 🏗️ 클러스터 메트릭 업데이트
   */
  private updateClusterMetrics(cluster: ServerCluster): void {
    cluster.loadBalancer.activeConnections =
      cluster.servers.reduce(
        (sum, server) => sum + server.metrics.requests,
        0
      ) / cluster.servers.length;

    cluster.loadBalancer.totalRequests +=
      cluster.loadBalancer.activeConnections;
  }

  /**
   * 📏 자동 스케일링 시뮬레이션
   */
  private simulateAutoScaling(cluster: ServerCluster): void {
    const avgCpu =
      cluster.servers.reduce((sum, s) => sum + s.metrics.cpu, 0) /
      cluster.servers.length;

    if (
      avgCpu > this.simulationConfig.scaling.threshold * 100 &&
      cluster.scaling.current < cluster.scaling.max
    ) {
      console.log(
        `🚀 클러스터 ${cluster.name} 스케일 아웃 (CPU: ${avgCpu.toFixed(1)}%)`
      );
      cluster.scaling.current++;
      cluster.scaling.target = cluster.scaling.current;
    } else if (avgCpu < 30 && cluster.scaling.current > cluster.scaling.min) {
      console.log(
        `📉 클러스터 ${cluster.name} 스케일 인 (CPU: ${avgCpu.toFixed(1)}%)`
      );
      cluster.scaling.current--;
      cluster.scaling.target = cluster.scaling.current;
    }
  }

  /**
   * 📱 애플리케이션 메트릭 업데이트
   */
  private updateApplicationMetrics(app: ApplicationMetrics): void {
    const allServers = Array.from(this.servers.values());

    // 성능 메트릭 계산
    app.performance.responseTime = 100 + Math.random() * 200;
    app.performance.throughput = allServers.reduce(
      (sum, s) => sum + s.metrics.requests,
      0
    );
    app.performance.errorRate =
      (allServers.reduce((sum, s) => sum + s.metrics.errors, 0) /
        Math.max(1, app.performance.throughput)) *
      100;

    // 가용성 계산
    const healthyServers = allServers.filter(
      s => s.status === 'running'
    ).length;
    app.performance.availability = (healthyServers / allServers.length) * 100;

    // 리소스 재계산
    app.resources.totalCpu = allServers.reduce(
      (sum, s) => sum + s.metrics.cpu,
      0
    );
    app.resources.totalMemory = allServers.reduce(
      (sum, s) => sum + s.metrics.memory,
      0
    );
    app.resources.cost =
      app.resources.totalCpu * 0.1 + app.resources.totalMemory * 0.05;
  }

  /**
   * 💾 생성된 데이터 캐시
   */
  private async cacheGeneratedData(): Promise<void> {
    try {
      // Redis 인스턴스가 없더라도 스마트 Redis 사용
      if (!this.redis) {
        this.redis = smartRedis;
      }

      const data = {
        servers: Array.from(this.servers.values()),
        clusters: Array.from(this.clusters.values()),
        applications: Array.from(this.applications.values()),
        timestamp: new Date().toISOString(),
      };

      await this.redis.set('server:generated:data', JSON.stringify(data), {
        ex: 60,
      });
    } catch (error) {
      console.warn('⚠️ 생성된 데이터 캐시 실패:', error);
    }
  }

  /**
   * 📊 공개 API 메서드들
   */
  public getAllServers(): ServerInstance[] {
    return Array.from(this.servers.values());
  }

  public getServerById(id: string): ServerInstance | undefined {
    return this.servers.get(id);
  }

  public getAllClusters(): ServerCluster[] {
    return Array.from(this.clusters.values());
  }

  public getClusterById(id: string): ServerCluster | undefined {
    return this.clusters.get(id);
  }

  public getAllApplications(): ApplicationMetrics[] {
    return Array.from(this.applications.values());
  }

  public getApplicationByName(name: string): ApplicationMetrics | undefined {
    return this.applications.get(name);
  }

  /**
   * 📈 대시보드용 요약 데이터
   */
  public getDashboardSummary() {
    const servers = this.getAllServers();
    const clusters = this.getAllClusters();
    const apps = this.getAllApplications();
    const serverCount = servers.length;
    const appCount = apps.length;

    return {
      overview: {
        totalServers: servers.length,
        runningServers: servers.filter(s => s.status === 'running').length,
        totalClusters: clusters.length,
        totalApplications: apps.length,
      },
      health: {
        averageScore: servers.length
          ? servers.reduce((sum, s) => sum + s.health.score, 0) / servers.length
          : 0,
        criticalIssues: servers.reduce(
          (sum, s) => sum + s.health.issues.length,
          0
        ),
        availability: apps.length
          ? apps.reduce((sum, a) => sum + a.performance.availability, 0) /
            apps.length
          : 0,
      },
      performance: {
        avgCpu: servers.length
          ? servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length
          : 0,
        avgMemory: servers.length
          ? servers.reduce((sum, s) => sum + s.metrics.memory, 0) /
            servers.length
          : 0,
        avgDisk: servers.length
          ? servers.reduce((sum, s) => sum + s.metrics.disk, 0) / servers.length
          : 0,
        totalRequests: servers.reduce((sum, s) => sum + s.metrics.requests, 0),
        totalErrors: servers.reduce((sum, s) => sum + s.metrics.errors, 0),
      },
      cost: {
        total: apps.reduce((sum, a) => sum + a.resources.cost, 0),
        monthly: apps.reduce((sum, a) => sum + a.resources.cost, 0) * 24 * 30,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🏥 헬스체크
   */
  public async healthCheck() {
    return {
      status: 'healthy',
      isGenerating: this.isGenerating,
      totalServers: this.servers.size,
      totalClusters: this.clusters.size,
      totalApplications: this.applications.size,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * ⏹️ 자동 데이터 생성 중지
   */
  public stopAutoGeneration(): void {
    this.isGenerating = false;
    if (this.generationInterval) {
      clearTimeout(this.generationInterval);
      this.generationInterval = null;
    }
    console.log('⏹️ 실시간 서버 데이터 생성 중지');
  }

  /**
   * 🔧 환경 설정 변경 (하위 호환성)
   */
  public updateEnvironmentConfig(
    config: Partial<CustomEnvironmentConfig>
  ): void {
    this.environmentConfig = { ...this.environmentConfig, ...config };
    console.log('🔧 환경 설정 업데이트:', this.environmentConfig);

    // 기존 서버 정리 후 새로운 환경으로 재구성
    this.servers.clear();
    this.clusters.clear();
    this.applications.clear();
    this.initializeServers();
  }

  /**
   * 📋 현재 환경 설정 조회 (하위 호환성)
   */
  public getEnvironmentConfig(): CustomEnvironmentConfig {
    return { ...this.environmentConfig };
  }

  /**
   * 🆕 고급 기능 - 네트워크 토폴로지 조회
   */
  public getNetworkTopology(): {
    nodes: NetworkNode[];
    connections: NetworkConnection[];
  } | null {
    return this.networkTopology;
  }

  /**
   * 🆕 고급 기능 - 현재 시연 시나리오 설정
   */
  public setDemoScenario(scenario: DemoScenario): void {
    if (isPluginEnabled('demo-scenarios')) {
      this.currentDemoScenario = scenario;
      setDemoScenario(scenario);
      console.log(`🎭 시연 시나리오 변경: ${scenario}`);
    } else {
      console.warn('⚠️ demo-scenarios 플러그인이 비활성화됨');
    }
  }

  /**
   * 🆕 고급 기능 - 현재 시연 시나리오 조회
   */
  public getCurrentDemoScenario(): DemoScenario {
    return this.currentDemoScenario;
  }

  /**
   * 🆕 고급 기능 - 베이스라인 데이터 새로고침
   */
  public async refreshBaselineData(): Promise<void> {
    if (isPluginEnabled('baseline-optimizer') && this.baselineDataInitialized) {
      const servers = Array.from(this.servers.values());
      await baselineOptimizer.generateBaselineData(servers);
      console.log('📊 베이스라인 데이터 새로고침 완료');
    }
  }

  /**
   * 🆕 고급 기능 상태 조회
   */
  public getAdvancedFeaturesStatus() {
    return {
      networkTopology: {
        enabled: isPluginEnabled('network-topology'),
        nodes: this.networkTopology?.nodes.length || 0,
        connections: this.networkTopology?.connections.length || 0,
      },
      baselineOptimizer: {
        enabled: isPluginEnabled('baseline-optimizer'),
        initialized: this.baselineDataInitialized,
        stats: this.baselineDataInitialized
          ? baselineOptimizer.getBaselineStats()
          : null,
      },
      demoScenarios: {
        enabled: isPluginEnabled('demo-scenarios'),
        currentScenario: this.currentDemoScenario,
        scenarioInfo: isPluginEnabled('demo-scenarios')
          ? demoScenariosGenerator.getCurrentScenarioInfo()
          : null,
      },
    };
  }

  /**
   * 🔄 베이스라인 초기화 (메모리 효율성)
   */
  private initializeBaselines() {
    const serverCount = this.config.IS_VERCEL ? 6 : 9; // Vercel에서 서버 수 제한
    
    for (let i = 1; i <= serverCount; i++) {
      const serverId = `server-${i.toString().padStart(2, '0')}`;
      
      // 24시간 베이스라인 생성 (경량화)
      this.serverBaselines.set(serverId, this.generateBaselineProfile(serverId));
      
      // 초기 상태 설정
      this.currentStates.set(serverId, this.generateInitialState(serverId));
    }
  }

  /**
   * 📊 베이스라인 프로필 생성 (Vercel 최적화)
   */
  private generateBaselineProfile(serverId: string): any {
    const serverTypes = ['web', 'api', 'database', 'cache', 'queue', 'storage'];
    const architectures = ['x86_64', 'arm64', 'hybrid', 'kubernetes'];
    
    const type = serverTypes[Math.floor(Math.random() * serverTypes.length)];
    const arch = architectures[Math.floor(Math.random() * architectures.length)];
    
    return {
      serverId,
      type,
      architecture: arch,
      location: this.getServerLocation(),
      baseline: this.generate24HourBaseline(type),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 🌍 서버 위치 선택 (Vercel 글로벌 최적화)
   */
  private getServerLocation(): string {
    const locations = [
      'us-east-1', 'us-west-2', 'eu-west-1', 
      'ap-northeast-1', 'ap-southeast-1'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * 📈 24시간 베이스라인 생성 (경량화)
   */
  private generate24HourBaseline(serverType: string): any {
    const baseline = {
      cpu: this.generateCPUBaseline(serverType),
      memory: this.generateMemoryBaseline(serverType),
      network: this.generateNetworkBaseline(serverType),
      disk: this.generateDiskBaseline(serverType),
    };
    
    return baseline;
  }

  /**
   * 🎯 상태별 서버 생성 확률 조정
   */
  private generateServerStatus(): 'healthy' | 'warning' | 'critical' {
    const random = Math.random();
    
    // 🚨 심각: 15% 확률
    if (random < 0.15) return 'critical';
    
    // ⚠️ 경고: 25% 확률 
    if (random < 0.4) return 'warning';
    
    // ✅ 정상: 60% 확률
    return 'healthy';
  }

  // 🔄 상태에 맞는 메트릭 생성
  private generateStatusBasedMetrics(status: string) {
    switch (status) {
      case 'critical':
        return {
          cpu: Math.random() * 30 + 85, // 85-100%
          memory: Math.random() * 25 + 90, // 90-100%
          disk: Math.random() * 35 + 75, // 75-100%
          uptime_hours: Math.random() * 24, // 0-24 시간 (최근 재시작)
        };
      
      case 'warning':
        return {
          cpu: Math.random() * 25 + 65, // 65-90%
          memory: Math.random() * 25 + 70, // 70-95%
          disk: Math.random() * 30 + 50, // 50-80%
          uptime_hours: Math.random() * 168 + 24, // 1-7일
        };
      
      default: // healthy
        return {
          cpu: Math.random() * 40 + 10, // 10-50%
          memory: Math.random() * 45 + 20, // 20-65%
          disk: Math.random() * 35 + 15, // 15-50%
          uptime_hours: Math.random() * 720 + 168, // 7-30일
        };
    }
  }

  // 📊 서버 인스턴스 생성 (개선)
  private createServerInstance(baseServer: any): ServerInstance {
    const status = this.generateServerStatus();
    const metrics = this.generateStatusBasedMetrics(status);
    
    return {
      id: baseServer.id,
      serverId: baseServer.id,
      name: baseServer.name,
      hostname: baseServer.hostname || baseServer.name,
      status,
      environment: baseServer.environment,
      location: baseServer.location,
      ip: baseServer.ip,
      cpu_usage: Math.round(metrics.cpu),
      memory_usage: Math.round(metrics.memory),
      disk_usage: Math.round(metrics.disk),
      uptime_hours: Math.round(metrics.uptime_hours),
      // 🎯 업타임 문자열 생성
      uptime: this.formatUptime(metrics.uptime_hours),
      last_updated: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      // 🚨 알림 개수 (상태별)
      alerts: status === 'critical' ? Math.floor(Math.random() * 5) + 3 : 
              status === 'warning' ? Math.floor(Math.random() * 3) + 1 : 0,
      // 서비스 상태도 메인 상태와 연동
      services: this.generateServicesForStatus(baseServer.type, status),
    };
  }

  // ⏰ 업타임 포맷팅
  private formatUptime(hours: number): string {
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${Math.floor(hours)}시간`;
    
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    
    if (days > 0 && remainingHours > 0) {
      return `${days}일 ${remainingHours}시간`;
    }
    return `${days}일`;
  }

  // 🔧 상태별 서비스 생성
  private generateServicesForStatus(serverType: string, status: string) {
    const baseServices = {
      web: ['nginx', 'nodejs', 'pm2'],
      api: ['gunicorn', 'python', 'nginx'],
      database: ['postgresql', 'redis'],
      cache: ['redis', 'memcached'],
      queue: ['celery', 'rabbitmq'],
      storage: ['minio', 'nginx'],
    };

    const services = baseServices[serverType as keyof typeof baseServices] || baseServices.web;
    
    return services.map((serviceName, index) => {
      let serviceStatus = 'running';
      
      // 상태에 따른 서비스 장애 확률
      if (status === 'critical') {
        // 심각 상태: 50% 확률로 서비스 정지
        serviceStatus = Math.random() < 0.5 ? 'stopped' : 'running';
      } else if (status === 'warning') {
        // 경고 상태: 20% 확률로 서비스 정지
        serviceStatus = Math.random() < 0.2 ? 'stopped' : 'running';
      }
      
      return {
        name: serviceName,
        status: serviceStatus,
        port: this.getDefaultPort(serviceName),
      };
    });
  }

  // 🔌 기본 포트 번호
  private getDefaultPort(serviceName: string): number {
    const portMap: { [key: string]: number } = {
      nginx: 80,
      nodejs: 3000,
      pm2: 0,
      gunicorn: 8000,
      python: 3000,
      postgresql: 5432,
      redis: 6379,
      memcached: 11211,
      celery: 0,
      rabbitmq: 5672,
      minio: 9000,
    };
    
    return portMap[serviceName] || 8080;
  }

  /**
   * 📊 현재 상태 조회
   */
  getCurrentState(): any {
    return {
      isRunning: this.isRunning,
      serverCount: this.serverBaselines.size,
      config: {
        environment: this.config.NODE_ENV,
        isVercel: this.config.IS_VERCEL,
        cacheEnabled: this.config.database.redis.enabled,
      },
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * 📈 서버별 메트릭 조회
   */
  getServerMetrics(serverId?: string): any {
    if (serverId) {
      return this.currentStates.get(serverId) || null;
    }
    
    return Array.from(this.currentStates.values());
  }
}

// 싱글톤 인스턴스
export const realServerDataGenerator = RealServerDataGenerator.getInstance();
