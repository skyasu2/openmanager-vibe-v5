/**
 * 🚀 Real Server Data Generator - Complete Implementation with Redis
 *
 * 완전한 기능을 갖춘 서버 데이터 생성기 (Redis 연동) - 실제 기업 환경 기반
 */

import {
  ApplicationMetrics,
  ServerCluster,
  ServerInstance,
} from '@/types/data-generator';

// 🎭 AI 분석 가능한 장애 시나리오 매니저 import
import { DemoScenarioManager } from '@/services/DemoScenarioManager';

// Redis 타입 정의 (동적 import용)
type RedisType = any;

// 중앙 서버 설정 import
import { ACTIVE_SERVER_CONFIG, logServerConfig } from '@/config/serverConfig';

// 🏗️ 실제 기업 환경 기반 서버 타입 정의
interface RealWorldServerType {
  id: string;
  name: string;
  category: 'web' | 'app' | 'database' | 'infrastructure';
  os: string;
  service: string;
  port: number;
  version?: string;
  runtime?: string;
}

// 🎯 실제 기술 스택 기반 서버 타입들
const REALISTIC_SERVER_TYPES: RealWorldServerType[] = [
  // 웹서버 (25%)
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'web',
    os: 'ubuntu-22.04',
    service: 'web-server',
    port: 80,
    version: '1.22.0',
  },
  {
    id: 'apache',
    name: 'Apache HTTP',
    category: 'web',
    os: 'centos-8',
    service: 'web-server',
    port: 80,
    version: '2.4.54',
  },
  {
    id: 'iis',
    name: 'IIS',
    category: 'web',
    os: 'windows-2022',
    service: 'web-server',
    port: 80,
    version: '10.0',
  },

  // 애플리케이션 서버 (30%)
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'app',
    os: 'alpine-3.16',
    service: 'app-server',
    port: 3000,
    runtime: 'node-18',
  },
  {
    id: 'springboot',
    name: 'Spring Boot',
    category: 'app',
    os: 'ubuntu-22.04',
    service: 'app-server',
    port: 8080,
    runtime: 'openjdk-17',
  },
  {
    id: 'django',
    name: 'Django',
    category: 'app',
    os: 'ubuntu-20.04',
    service: 'app-server',
    port: 8000,
    runtime: 'python-3.9',
  },
  {
    id: 'dotnet',
    name: '.NET Core',
    category: 'app',
    os: 'windows-2022',
    service: 'app-server',
    port: 5000,
    runtime: 'dotnet-6',
  },
  {
    id: 'php',
    name: 'PHP-FPM',
    category: 'app',
    os: 'debian-11',
    service: 'app-server',
    port: 9000,
    runtime: 'php-8.1',
  },

  // 데이터베이스 (20%)
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    os: 'ubuntu-20.04',
    service: 'database',
    port: 3306,
    version: '8.0.30',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    os: 'debian-11',
    service: 'database',
    port: 5432,
    version: '14.5',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    os: 'rhel-8',
    service: 'database',
    port: 27017,
    version: '5.0.12',
  },
  {
    id: 'oracle',
    name: 'Oracle DB',
    category: 'database',
    os: 'oracle-linux-8',
    service: 'database',
    port: 1521,
    version: '19c',
  },
  {
    id: 'mssql',
    name: 'SQL Server',
    category: 'database',
    os: 'windows-2019',
    service: 'database',
    port: 1433,
    version: '2019',
  },

  // 인프라 서비스 (25%)
  {
    id: 'redis',
    name: 'Redis',
    category: 'infrastructure',
    os: 'alpine-3.15',
    service: 'cache',
    port: 6379,
    version: '7.0.5',
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    category: 'infrastructure',
    os: 'ubuntu-20.04',
    service: 'message-queue',
    port: 5672,
    version: '3.10.7',
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    category: 'infrastructure',
    os: 'centos-7',
    service: 'search',
    port: 9200,
    version: '8.4.3',
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    category: 'infrastructure',
    os: 'ubuntu-22.04',
    service: 'ci-cd',
    port: 8080,
    version: '2.361.4',
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    category: 'infrastructure',
    os: 'ubuntu-22.04',
    service: 'monitoring',
    port: 9090,
    version: '2.38.0',
  },
  {
    id: 'kafka',
    name: 'Apache Kafka',
    category: 'infrastructure',
    os: 'ubuntu-20.04',
    service: 'message-queue',
    port: 9092,
    version: '3.2.3',
  },
];

// 🎯 현실적인 서버 분포 비율 (기업 환경 기준)
const SERVER_DISTRIBUTION = {
  web: 0.25, // 웹서버 25%
  app: 0.3, // 애플리케이션 30%
  database: 0.2, // 데이터베이스 20%
  infrastructure: 0.25, // 인프라 25%
};

// 🏷️ 호스트네임 생성 패턴: {service}-{tech}-{env}-{number}
const HOSTNAME_PATTERNS = {
  web: 'web',
  app: 'app',
  database: 'db',
  infrastructure: 'infra',
};

// 🧮 동적 서버 분포 계산
function calculateServerDistribution(
  totalServers: number
): Record<string, number> {
  const distribution: Record<string, number> = {};
  let allocated = 0;

  // 각 카테고리별 서버 수 계산
  for (const [category, percentage] of Object.entries(SERVER_DISTRIBUTION)) {
    const count = Math.max(1, Math.round(totalServers * percentage));
    distribution[category] = count;
    allocated += count;
  }

  // 나머지는 웹서버에 할당 (반올림 오차 보정)
  if (allocated !== totalServers) {
    distribution.web += totalServers - allocated;
  }

  return distribution;
}

// 🎲 카테고리별 서버 타입 선택
function getServerTypesForCategory(category: string): RealWorldServerType[] {
  return REALISTIC_SERVER_TYPES.filter(type => type.category === category);
}

// 🏷️ 직관적인 호스트네임 생성
function generateHostname(
  serverType: RealWorldServerType,
  environment: string,
  index: number
): string {
  const servicePrefix = HOSTNAME_PATTERNS[serverType.category] || 'srv';
  const envCode =
    environment === 'production'
      ? 'prod'
      : environment === 'staging'
        ? 'stg'
        : environment === 'development'
          ? 'dev'
          : 'dev';
  const paddedIndex = String(index).padStart(2, '0');

  return `${servicePrefix}-${serverType.id}-${envCode}-${paddedIndex}`;
}

// 🎯 서버 타입별 특화 메트릭 생성
function generateSpecializedMetrics(serverType: RealWorldServerType): any {
  const baseMetrics = {
    cpu: parseFloat((Math.random() * 80 + 10).toFixed(2)),
    memory: parseFloat((Math.random() * 70 + 20).toFixed(2)),
    disk: parseFloat((Math.random() * 60 + 30).toFixed(2)),
    network: {
      in: Math.random() * 100,
      out: Math.random() * 100,
    },
    requests: Math.random() * 1000 + 100,
    errors: Math.random() * 10,
    uptime: Math.random() * 8760 * 3600, // 최대 1년
    customMetrics: {},
  };

  // 서버 타입별 특화 메트릭 조정
  switch (serverType.category) {
    case 'database':
      // 데이터베이스: 높은 메모리 사용률, 디스크 I/O 집약적
      baseMetrics.memory = parseFloat((Math.random() * 30 + 60).toFixed(2)); // 60-90%
      baseMetrics.disk = parseFloat((Math.random() * 40 + 50).toFixed(2)); // 50-90%
      baseMetrics.customMetrics = {
        connection_pool: Math.floor(Math.random() * 100 + 50),
        query_time: parseFloat((Math.random() * 50 + 10).toFixed(2)),
        active_connections: Math.floor(Math.random() * 200 + 50),
      };
      break;

    case 'web':
      // 웹서버: 높은 네트워크 I/O, 적은 메모리 사용
      baseMetrics.network.in = Math.random() * 200 + 100; // 높은 네트워크 입력
      baseMetrics.network.out = Math.random() * 150 + 75; // 높은 네트워크 출력
      baseMetrics.memory = parseFloat((Math.random() * 40 + 20).toFixed(2)); // 20-60%
      baseMetrics.requests = Math.random() * 2000 + 500; // 높은 요청 수
      baseMetrics.customMetrics = {
        concurrent_connections: Math.floor(Math.random() * 1000 + 200),
        response_time: parseFloat((Math.random() * 100 + 50).toFixed(2)),
        ssl_handshakes: Math.floor(Math.random() * 500 + 100),
      };
      break;

    case 'app':
      // 애플리케이션: 균형잡힌 CPU/메모리, 높은 처리량
      baseMetrics.cpu = parseFloat((Math.random() * 50 + 40).toFixed(2)); // 40-90%
      baseMetrics.memory = parseFloat((Math.random() * 50 + 35).toFixed(2)); // 35-85%
      baseMetrics.requests = Math.random() * 1500 + 300;
      baseMetrics.customMetrics = {
        thread_pool: Math.floor(Math.random() * 50 + 10),
        heap_usage: parseFloat((Math.random() * 60 + 30).toFixed(2)),
        gc_time: parseFloat((Math.random() * 10 + 2).toFixed(2)),
      };
      break;

    case 'infrastructure':
      // 인프라: 특수 목적별 메트릭
      if (serverType.id === 'redis') {
        baseMetrics.memory = parseFloat((Math.random() * 40 + 50).toFixed(2)); // 캐시용 높은 메모리
        baseMetrics.customMetrics = {
          cache_hit_ratio: parseFloat((Math.random() * 20 + 80).toFixed(2)), // 80-100%
          evicted_keys: Math.floor(Math.random() * 1000),
          connected_clients: Math.floor(Math.random() * 100 + 20),
        };
      } else if (serverType.service === 'message-queue') {
        baseMetrics.customMetrics = {
          queue_depth: Math.floor(Math.random() * 10000 + 1000),
          message_rate: Math.floor(Math.random() * 1000 + 100),
          consumer_count: Math.floor(Math.random() * 20 + 5),
        };
      }
      break;
  }

  return baseMetrics;
}

export interface GeneratorConfig {
  maxServers?: number;
  updateInterval?: number;
  enableRealtime?: boolean;
  serverArchitecture?:
    | 'single'
    | 'primary-replica'
    | 'load-balanced'
    | 'microservices';
  enableRedis?: boolean;
  /**
   * ⚙️ 시나리오 기반 상태 분포 설정
   *  - criticalCount: 절대 개수(서버 심각)
   *  - warningPercent: 전체 서버 대비 경고 상태 비율 (0~1)
   *  - tolerancePercent: 퍼센트 오차 허용 범위 (0~1)
   */
  scenario?: {
    criticalCount: number;
    warningPercent: number; // e.g. 0.2 → 20%
    tolerancePercent?: number; // e.g. 0.03 → ±3%
  };
}

export class RealServerDataGenerator {
  private static instance: RealServerDataGenerator | null = null;
  private servers: Map<string, ServerInstance> = new Map();
  private clusters: Map<string, ServerCluster> = new Map();
  private applications: Map<string, ApplicationMetrics> = new Map();
  private config: GeneratorConfig;
  private intervalId?: NodeJS.Timeout;
  private isInitialized = false;
  private isGenerating = false;

  // 🎭 AI 분석 가능한 장애 시나리오 매니저
  private scenarioManager: DemoScenarioManager;

  // 🔴 Redis 연결
  private redis: RedisType | null = null;
  private readonly REDIS_PREFIX = 'openmanager:servers:';
  private readonly REDIS_CLUSTERS_PREFIX = 'openmanager:clusters:';
  private readonly REDIS_APPS_PREFIX = 'openmanager:apps:';

  // 🛡️ 안전 장치: 과도한 갱신 방지
  private lastSaveTime = 0;
  private readonly MIN_SAVE_INTERVAL = 5000; // 최소 5초 간격
  private saveThrottleCount = 0;
  private readonly MAX_SAVES_PER_MINUTE = 10; // 분당 최대 10회 저장
  private lastMinuteTimestamp = 0;

  // 🎭 목업 모드 관리
  private isMockMode = false;
  private isHealthCheckContext = false;
  private isTestContext = false;

  // 🏷️ 호스트네임 중복 방지용 카운터
  private hostnameCounters: Map<string, number> = new Map();

  constructor(config: GeneratorConfig = {}) {
    // 🎯 중앙 설정에서 기본값 가져오기
    const centralConfig = ACTIVE_SERVER_CONFIG;

    // 🔍 컨텍스트 감지
    this.detectExecutionContext();

    this.config = {
      maxServers: centralConfig.maxServers, // 🎯 중앙 설정에서 서버 개수 가져오기 (기본 20개)
      updateInterval: centralConfig.cache.updateInterval, // 🎯 중앙 설정에서 업데이트 간격 가져오기
      enableRealtime: true,
      serverArchitecture: 'load-balanced',
      enableRedis: !this.shouldUseMockRedis(), // 🎭 목업 모드 결정
      scenario: {
        criticalCount: centralConfig.scenario.criticalCount,
        warningPercent: centralConfig.scenario.warningPercent,
        tolerancePercent: centralConfig.scenario.tolerancePercent,
      },
      ...config, // 사용자 설정으로 오버라이드
    };

    // 🎯 서버 설정 정보 로깅
    logServerConfig(centralConfig);

    // 초기 상태 설정
    this.isGenerating = false;

    // Redis 초기화 (목업 모드 고려)
    this.initializeRedis();

    // 🎭 AI 분석 가능한 장애 시나리오 매니저 초기화
    this.scenarioManager = DemoScenarioManager.getInstance();
  }

  public static getInstance(): RealServerDataGenerator {
    if (!RealServerDataGenerator.instance) {
      RealServerDataGenerator.instance = new RealServerDataGenerator();
    }
    return RealServerDataGenerator.instance;
  }

  /**
   * 🔍 실행 컨텍스트 감지
   */
  private detectExecutionContext(): void {
    const stack = new Error().stack || '';

    // 헬스체크 컨텍스트 감지
    this.isHealthCheckContext =
      stack.includes('health') ||
      stack.includes('performHealthCheck') ||
      process.env.NODE_ENV === 'test' ||
      process.argv.some(arg => arg.includes('health'));

    // 테스트 컨텍스트 감지
    this.isTestContext =
      process.env.NODE_ENV === 'test' ||
      stack.includes('test') ||
      stack.includes('jest') ||
      stack.includes('vitest') ||
      process.argv.some(arg => arg.includes('test'));

    if (this.isHealthCheckContext || this.isTestContext) {
      console.log('🎭 목업 모드 활성화: 헬스체크/테스트 컨텍스트 감지');
    }
  }

  /**
   * 🎭 목업 레디스 사용 여부 결정
   */
  private shouldUseMockRedis(): boolean {
    // 1. 헬스체크나 테스트 컨텍스트에서는 목업 사용
    if (this.isHealthCheckContext || this.isTestContext) {
      this.isMockMode = true;
      return true;
    }

    // 2. 환경변수로 강제 목업 모드 설정
    if (process.env.FORCE_MOCK_REDIS === 'true') {
      this.isMockMode = true;
      return true;
    }

    // 3. 레디스 환경변수가 없으면 목업 사용
    const hasRedisConfig =
      process.env.REDIS_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.REDIS_HOST;

    if (!hasRedisConfig) {
      this.isMockMode = true;
      return true;
    }

    return false;
  }

  /**
   * 🔴 Redis 연결 초기화 (목업 모드 지원)
   */
  private async initializeRedis(): Promise<void> {
    if (!this.config.enableRedis || this.shouldUseMockRedis()) {
      console.log('🎭 목업 Redis 모드로 실행 - 실제 Redis 연결 건너뜀');
      this.isMockMode = true;
      return;
    }

    try {
      // 동적 import로 Redis 클래스 로드
      const { default: Redis } = await import('ioredis');

      // 환경변수에서 Redis 설정 가져오기 (다중 소스 지원)
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
      const redisHost =
        process.env.REDIS_HOST || 'charming-condor-46598.upstash.io';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisPassword =
        process.env.REDIS_PASSWORD ||
        process.env.KV_REST_API_TOKEN ||
        'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA';

      // Redis URL이 있으면 우선 사용
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 2, // 3에서 2로 감소 (과도한 재시도 방지)
          lazyConnect: true,
          connectTimeout: 5000, // 5초로 단축
          commandTimeout: 3000, // 3초로 단축
        });
      } else {
        // 개별 설정으로 연결
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          tls: {},
          maxRetriesPerRequest: 2, // 과도한 재시도 방지
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 3000,
        });
      }

      // 연결 테스트 (타임아웃 설정)
      const pingPromise = this.redis.ping();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis 연결 타임아웃')), 3000)
      );

      await Promise.race([pingPromise, timeoutPromise]);
      console.log('✅ Redis 연결 성공 - 서버 데이터 저장 활성화');
    } catch (error) {
      console.warn('⚠️ Redis 연결 실패, 목업 모드로 폴백:', error);
      this.redis = null;
      this.config.enableRedis = false;
      this.isMockMode = true;
    }
  }

  /**
   * 🛡️ 과도한 저장 방지 체크
   */
  private canSaveToRedis(): boolean {
    const now = Date.now();

    // 1. 최소 간격 체크 (5초)
    if (now - this.lastSaveTime < this.MIN_SAVE_INTERVAL) {
      return false;
    }

    // 2. 분당 저장 횟수 체크
    if (now - this.lastMinuteTimestamp > 60000) {
      // 새로운 분 시작
      this.lastMinuteTimestamp = now;
      this.saveThrottleCount = 0;
    }

    if (this.saveThrottleCount >= this.MAX_SAVES_PER_MINUTE) {
      console.warn('⚠️ 분당 최대 저장 횟수 초과 - Redis 저장 건너뜀');
      return false;
    }

    return true;
  }

  /**
   * 🔴 Redis에 서버 데이터 저장 (목업 모드 지원)
   */
  private async saveServerToRedis(server: ServerInstance): Promise<void> {
    if (this.isMockMode) {
      // 목업 모드에서는 메모리에만 저장
      return;
    }

    if (!this.redis || !this.canSaveToRedis()) return;

    try {
      const key = `${this.REDIS_PREFIX}${server.id}`;
      const data = JSON.stringify({
        ...server,
        lastUpdated: new Date().toISOString(),
      });

      await this.redis.setex(key, 3600, data); // 1시간 TTL

      // 서버 목록에도 추가
      await this.redis.sadd(`${this.REDIS_PREFIX}list`, server.id);

      this.lastSaveTime = Date.now();
      this.saveThrottleCount++;
    } catch (error) {
      console.warn(`⚠️ Redis 서버 저장 실패 (${server.id}):`, error);
    }
  }

  /**
   * 🔴 Redis에서 서버 데이터 조회
   */
  private async loadServerFromRedis(
    serverId: string
  ): Promise<ServerInstance | null> {
    if (!this.redis) return null;

    try {
      const key = `${this.REDIS_PREFIX}${serverId}`;
      const data = await this.redis.get(key);

      if (data) {
        return JSON.parse(data) as ServerInstance;
      }
    } catch (error) {
      console.warn(`⚠️ Redis 서버 조회 실패 (${serverId}):`, error);
    }

    return null;
  }

  /**
   * 🔴 Redis에서 모든 서버 데이터 조회
   */
  private async loadAllServersFromRedis(): Promise<ServerInstance[]> {
    if (!this.redis) return [];

    try {
      const serverIds = await this.redis.smembers(`${this.REDIS_PREFIX}list`);
      const servers: ServerInstance[] = [];

      for (const serverId of serverIds) {
        const server = await this.loadServerFromRedis(serverId);
        if (server) {
          servers.push(server);
        }
      }

      console.log(`📊 Redis에서 ${servers.length}개 서버 데이터 로드됨`);
      return servers;
    } catch (error) {
      console.warn('⚠️ Redis 전체 서버 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🔴 Redis에 클러스터 데이터 저장
   */
  private async saveClusterToRedis(cluster: ServerCluster): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `${this.REDIS_CLUSTERS_PREFIX}${cluster.id}`;
      const data = JSON.stringify({
        ...cluster,
        lastUpdated: new Date().toISOString(),
      });

      await this.redis.setex(key, 3600, data);
      await this.redis.sadd(`${this.REDIS_CLUSTERS_PREFIX}list`, cluster.id);
    } catch (error) {
      console.warn(`⚠️ Redis 클러스터 저장 실패 (${cluster.id}):`, error);
    }
  }

  /**
   * 🔴 Redis에 서버 데이터 배치 저장 (성능 개선)
   */
  private async batchSaveServersToRedis(
    servers: ServerInstance[]
  ): Promise<void> {
    if (this.isMockMode) {
      console.log(`🎭 목업 모드: ${servers.length}개 서버 메모리 저장 완료`);
      return;
    }

    if (!this.redis || !this.canSaveToRedis()) {
      return;
    }

    try {
      const pipeline = this.redis.pipeline();

      for (const server of servers) {
        const key = `${this.REDIS_PREFIX}${server.id}`;
        const data = JSON.stringify({
          ...server,
          lastUpdated: new Date().toISOString(),
        });

        pipeline.setex(key, 3600, data); // 1시간 TTL
        pipeline.sadd(`${this.REDIS_PREFIX}list`, server.id);
      }

      await pipeline.exec();

      this.lastSaveTime = Date.now();
      this.saveThrottleCount++;

      console.log(`📊 Redis 배치 저장 완료: ${servers.length}개 서버`);
    } catch (error) {
      console.warn(`⚠️ Redis 배치 저장 실패:`, error);
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 이전의 복잡한 빌드 환경 감지 로직을 삭제하고,
    // 환경변수 `BUILD_SKIP_GENERATOR` 를 사용하여, 초기화를 스킵하는지 여부를 명시적으로 제어합니다.
    // 이에 따라, Vercel 의 본 런타임에서 데이터 생성이 오류 없이 스킵되는 문제를 해결합니다.
    if (process.env.BUILD_SKIP_GENERATOR === 'true') {
      console.log(
        '⏭️ BUILD_SKIP_GENERATOR=true 가 설정되어 있는 데, RealServerDataGenerator 의 초기화를 스킵합니다.'
      );
      this.isInitialized = true;
      return;
    }

    console.log('🚀 RealServerDataGenerator 초기화 시작...');

    this.initializeServers();
    this.createClusters();
    this.createApplications();

    this.isInitialized = true;
    console.log('✅ RealServerDataGenerator 초기화 완료');

    // 실시간 업데이트 자동 시작 (설정이 활성화된 경우 + 빌드 시 제외)
    if (this.config.enableRealtime && !this.isGenerating) {
      // 🔨 빌드 환경에서는 실시간 업데이트 건너뛰기
      if (
        process.env.NODE_ENV === 'production' &&
        (process.env.VERCEL === '1' || process.env.BUILD_TIME === 'true')
      ) {
        console.log('🔨 빌드 환경 감지 - 실시간 업데이트 건너뜀');
      } else {
        this.startAutoGeneration();
        console.log('🔄 실시간 데이터 업데이트 자동 시작됨');
      }
    }
  }

  private initializeServers(): void {
    this.servers.clear();
    this.hostnameCounters.clear();

    const roles: ('primary' | 'replica' | 'worker' | 'standalone')[] = [
      'primary',
      'replica',
      'worker',
      'standalone',
    ];
    const environments: ('production' | 'staging' | 'development')[] = [
      'production',
      'staging',
      'development',
    ];
    // 위치는 동적으로 생성하도록 변경

    const totalServers = this.config.maxServers || 15;

    // 🎯 동적 서버 분포 계산
    const distribution = calculateServerDistribution(totalServers);

    console.log('🎯 서버 분포 계획:');
    console.log(`  📊 총 서버 수: ${totalServers}개`);
    console.log(
      `  🌐 웹서버: ${distribution.web}개 (${Math.round((distribution.web / totalServers) * 100)}%)`
    );
    console.log(
      `  🚀 앱서버: ${distribution.app}개 (${Math.round((distribution.app / totalServers) * 100)}%)`
    );
    console.log(
      `  🗄️  데이터베이스: ${distribution.database}개 (${Math.round((distribution.database / totalServers) * 100)}%)`
    );
    console.log(
      `  ⚙️  인프라: ${distribution.infrastructure}개 (${Math.round((distribution.infrastructure / totalServers) * 100)}%)`
    );

    let serverIndex = 1;

    // 🏗️ 카테고리별 서버 생성
    for (const [category, count] of Object.entries(distribution)) {
      const availableTypes = getServerTypesForCategory(category);

      for (let i = 0; i < count; i++) {
        // 서버 타입 선택 (균등 분배 + 랜덤)
        const serverType = availableTypes[i % availableTypes.length];
        const role = roles[Math.floor(Math.random() * roles.length)];
        const environment =
          environments[Math.floor(Math.random() * environments.length)];
        // 동적 위치 생성: 한국 데이터센터 기반
        const locations = [
          'Seoul-DC-1',
          'Seoul-DC-2',
          'Busan-DC-1',
          'Daegu-DC-1',
          'Incheon-DC-1',
        ];
        const location =
          locations[Math.floor(Math.random() * locations.length)];

        // 🏷️ 직관적인 호스트네임 생성
        const hostnameKey = `${serverType.id}-${environment}`;
        const currentCount = this.hostnameCounters.get(hostnameKey) || 0;
        this.hostnameCounters.set(hostnameKey, currentCount + 1);
        const hostname = generateHostname(
          serverType,
          environment,
          currentCount + 1
        );

        // 🎯 서버 타입별 특화 메트릭 생성
        const specializedMetrics = generateSpecializedMetrics(serverType);

        // 🏗️ 서버 타입별 특화 사양 생성
        const specs = this.generateSpecializedSpecs(serverType);

        const server: ServerInstance = {
          id: `${serverType.id}-${serverIndex}`,
          name: hostname,
          type: serverType.id as any, // 실제 기술명 사용
          role,
          environment,
          location,
          status: 'running', // 초기값은 모두 running, 나중에 시나리오 적용
          specs,
          metrics: specializedMetrics,
          health: {
            score: Math.random() * 40 + 60, // 60-100점
            lastCheck: new Date().toISOString(),
            issues: [],
          },
        };

        // 건강 상태에 따른 이슈 생성
        if (server.health.score < 80) {
          const issues = this.generateRealisticIssues(
            serverType,
            server.metrics
          );
          server.health.issues = issues;
        }

        this.servers.set(server.id, server);
        serverIndex++;
      }
    }

    /**
     * 🎯 시나리오 분포 적용
     *  - critical: 고정 개수
     *  - warning: 비율 ± 오차
     */
    try {
      const scenario = this.config.scenario;
      if (scenario) {
        const serversArray = Array.from(this.servers.values());
        // 무작위 섞기
        const shuffled = serversArray.sort(() => Math.random() - 0.5);

        const criticalTarget = Math.min(
          scenario.criticalCount,
          shuffled.length
        );

        const baseWarning = Math.round(
          shuffled.length * scenario.warningPercent
        );
        const tol = Math.round(
          shuffled.length * (scenario.tolerancePercent || 0)
        );
        const warningTarget = Math.max(
          0,
          Math.min(
            shuffled.length - criticalTarget,
            baseWarning + (Math.floor(Math.random() * (tol * 2 + 1)) - tol)
          )
        );

        // 상태 초기화
        shuffled.forEach(s => {
          s.status = 'running';
        });

        // critical 상태 설정
        for (let i = 0; i < criticalTarget; i++) {
          const srv = shuffled[i];
          srv.status = 'error';
          srv.health.score = Math.min(srv.health.score, 40);
        }

        // warning 상태 설정
        for (let i = criticalTarget; i < criticalTarget + warningTarget; i++) {
          const srv = shuffled[i];
          srv.status = 'warning';
          srv.health.score = Math.min(srv.health.score, 70);
        }

        // Map 에 반영
        shuffled.forEach(s => this.servers.set(s.id, s));

        console.log(
          `📊 시나리오 적용 완료: critical ${criticalTarget}개, warning ${warningTarget}개, total ${shuffled.length}`
        );
      }
    } catch (e) {
      console.warn('⚠️ 시나리오 분포 적용 중 오류:', e);
    }
  }

  private createClusters(): void {
    this.clusters.clear();

    const serverGroups = this.groupServersByType();

    Object.entries(serverGroups).forEach(([type, servers], index) => {
      if (servers.length > 1) {
        const cluster: ServerCluster = {
          id: `cluster-${type}-${index + 1}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Cluster`,
          servers: servers, // ServerInstance[] 배열을 직접 사용
          loadBalancer: {
            algorithm: 'round-robin',
            activeConnections: Math.floor(Math.random() * 100),
            totalRequests: Math.floor(Math.random() * 10000),
          },
          scaling: {
            current: servers.length,
            min: 1,
            max: servers.length * 2,
            target: servers.length,
            policy: 'cpu',
          },
        };

        this.clusters.set(cluster.id, cluster);
      }
    });
  }

  private createApplications(): void {
    this.applications.clear();

    // 🚀 실제 기업 환경 기반 애플리케이션 정의
    const apps = [
      { name: 'Frontend Web App', type: 'nginx', category: 'web' },
      { name: 'API Gateway', type: 'nginx', category: 'web' },
      { name: 'User Management Service', type: 'nodejs', category: 'app' },
      { name: 'Order Processing Service', type: 'springboot', category: 'app' },
      { name: 'Payment Service', type: 'django', category: 'app' },
      { name: 'User Database', type: 'mysql', category: 'database' },
      { name: 'Analytics Database', type: 'postgresql', category: 'database' },
      { name: 'Session Cache', type: 'redis', category: 'infrastructure' },
      { name: 'Message Queue', type: 'rabbitmq', category: 'infrastructure' },
      {
        name: 'Search Engine',
        type: 'elasticsearch',
        category: 'infrastructure',
      },
    ];

    // 🏗️ 각 애플리케이션별 메트릭 생성
    apps.forEach(app => {
      // 해당 타입의 서버들 찾기
      const relatedServers = Array.from(this.servers.values()).filter(
        server => server.type === app.type
      );

      if (relatedServers.length === 0) return;

      // 애플리케이션 성능 메트릭 계산
      const avgCpu =
        relatedServers.reduce((sum, s) => sum + s.metrics.cpu, 0) /
        relatedServers.length;
      const avgMemory =
        relatedServers.reduce((sum, s) => sum + s.metrics.memory, 0) /
        relatedServers.length;
      const totalRequests = relatedServers.reduce(
        (sum, s) => sum + s.metrics.requests,
        0
      );
      const totalErrors = relatedServers.reduce(
        (sum, s) => sum + s.metrics.errors,
        0
      );

      // 카테고리별 특화 메트릭
      let responseTime = 50 + Math.random() * 200; // 기본 50-250ms
      let throughput = totalRequests;
      let availability = 99.5 + Math.random() * 0.5; // 99.5-100%

      switch (app.category) {
        case 'web':
          responseTime = 20 + Math.random() * 80; // 웹서버는 빠른 응답
          throughput = totalRequests * 1.5; // 높은 처리량
          break;
        case 'database':
          responseTime = 10 + Math.random() * 50; // DB는 매우 빠른 응답
          availability = 99.8 + Math.random() * 0.2; // 높은 가용성
          break;
        case 'app':
          responseTime = 100 + Math.random() * 300; // 앱은 상대적으로 느림
          break;
        case 'infrastructure':
          if (app.type === 'redis') {
            responseTime = 1 + Math.random() * 5; // 캐시는 매우 빠름
            availability = 99.9 + Math.random() * 0.1;
          }
          break;
      }

      const application: ApplicationMetrics = {
        name: app.name,
        version: this.generateRealisticVersion(app.type),
        deployments: {
          production: {
            servers: relatedServers.filter(s => s.environment === 'production')
              .length,
            health: Math.max(60, 100 - avgCpu * 0.3 - avgMemory * 0.2),
          },
          staging: {
            servers: relatedServers.filter(s => s.environment === 'staging')
              .length,
            health: Math.max(70, 100 - avgCpu * 0.2 - avgMemory * 0.1),
          },
          development: {
            servers: relatedServers.filter(s => s.environment === 'development')
              .length,
            health: Math.max(80, 100 - avgCpu * 0.1),
          },
        },
        performance: {
          responseTime: parseFloat(responseTime.toFixed(2)),
          throughput: Math.floor(throughput),
          errorRate: parseFloat(
            ((totalErrors / totalRequests) * 100 || 0).toFixed(3)
          ),
          availability: parseFloat(availability.toFixed(2)),
        },
        resources: {
          totalCpu: parseFloat(avgCpu.toFixed(2)),
          totalMemory: parseFloat(avgMemory.toFixed(2)),
          totalDisk:
            relatedServers.reduce((sum, s) => sum + s.metrics.disk, 0) /
            relatedServers.length,
          cost: this.calculateApplicationCost(relatedServers, app.category),
        },
      };

      this.applications.set(app.name, application);
    });

    console.log(`🚀 생성된 애플리케이션: ${this.applications.size}개`);
  }

  /**
   * 🏷️ 실제 버전 번호 생성
   */
  private generateRealisticVersion(serverType: string): string {
    const versionMap: Record<string, string[]> = {
      nginx: ['1.22.0', '1.21.6', '1.20.2'],
      apache: ['2.4.54', '2.4.53', '2.4.52'],
      mysql: ['8.0.30', '8.0.29', '5.7.38'],
      postgresql: ['14.5', '13.8', '12.12'],
      mongodb: ['5.0.12', '4.4.16', '4.2.22'],
      nodejs: ['18.7.0', '16.17.0', '14.20.0'],
      springboot: ['2.7.2', '2.6.11', '2.5.14'],
      django: ['4.1.0', '4.0.6', '3.2.15'],
      redis: ['7.0.5', '6.2.7', '6.0.16'],
      rabbitmq: ['3.10.7', '3.9.22', '3.8.34'],
      elasticsearch: ['8.4.3', '7.17.6', '6.8.23'],
      jenkins: ['2.361.4', '2.361.3', '2.361.2'],
      prometheus: ['2.38.0', '2.37.1', '2.36.2'],
    };

    const versions = versionMap[serverType] || ['1.0.0', '1.1.0', '1.2.0'];
    return versions[Math.floor(Math.random() * versions.length)];
  }

  /**
   * 💰 애플리케이션 비용 계산
   */
  private calculateApplicationCost(servers: any[], category: string): number {
    const baseCostPerServer = {
      web: 50, // 웹서버: $50/월
      app: 100, // 앱서버: $100/월
      database: 200, // DB서버: $200/월
      infrastructure: 75, // 인프라: $75/월
    };

    const costPerServer = baseCostPerServer[category] || 100;
    const totalServers = servers.length;
    const avgCpu =
      servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length;

    // CPU 사용률에 따른 비용 조정 (높은 사용률 = 높은 비용)
    const utilizationMultiplier = 1 + (avgCpu / 100) * 0.5;

    return parseFloat(
      (costPerServer * totalServers * utilizationMultiplier).toFixed(2)
    );
  }

  public startAutoGeneration(): void {
    if (this.isGenerating) {
      console.log('🔄 실시간 데이터 생성이 이미 실행 중입니다.');
      return;
    }

    // 🔨 빌드 환경에서는 타이머 생성 금지
    if (
      process.env.NODE_ENV === 'production' &&
      (process.env.VERCEL === '1' || process.env.BUILD_TIME === 'true')
    ) {
      console.log(
        '🔨 빌드 환경 감지 - 실시간 데이터 생성 건너뜀 (타이머 차단)'
      );
      return;
    }

    this.isGenerating = true;

    // 즉시 한 번 실행
    this.generateRealtimeData().catch(error => {
      console.error('❌ 실시간 데이터 생성 오류:', error);
    });

    this.intervalId = setInterval(async () => {
      try {
        await this.generateRealtimeData();
      } catch (error) {
        console.error('❌ 실시간 데이터 생성 오류:', error);
      }
    }, this.config.updateInterval);

    console.log(
      `🚀 실시간 데이터 생성 시작됨 (${this.config.updateInterval}ms 간격)`
    );
  }

  public stopAutoGeneration(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isGenerating = false;
    console.log('⏹️ 실시간 데이터 생성 중지');
  }

  private async generateRealtimeData(): Promise<void> {
    const updatedServers: ServerInstance[] = [];
    let hasSignificantChange = false;

    // 🎭 1단계: AI 분석 가능한 장애 시나리오 정보 수집
    const currentScenario = this.scenarioManager.getCurrentScenario();
    let scenarioIntensity = 1.0; // 기본 강도
    let scenarioAffectedTypes: string[] = [];

    if (currentScenario && this.scenarioManager.getStatus().isActive) {
      // 시나리오 정보에서 강도와 영향받는 서버 타입 추출
      scenarioIntensity =
        currentScenario.phase === 'critical_state'
          ? 2.5
          : currentScenario.phase === 'cascade_failure'
            ? 2.0
            : currentScenario.phase === 'failure_start'
              ? 1.5
              : 1.0;

      // 시나리오 변경사항에서 영향받는 서버 타입 추출
      if (currentScenario.changes?.serverTypes) {
        scenarioAffectedTypes = currentScenario.changes.serverTypes;
      }

      if (!this.isMockMode) {
        console.log(
          `🎭 장애 시나리오 활성: ${currentScenario.description} (단계: ${currentScenario.phase}, 강도: ${scenarioIntensity})`
        );
      }
    }

    for (const [serverId, server] of this.servers) {
      // 🎯 2단계: 원본 메트릭 수집
      const rawMetrics = {
        cpu: server.metrics.cpu,
        memory: server.metrics.memory,
        disk: server.metrics.disk,
        network: { ...server.metrics.network },
        timestamp: Date.now(),
      };

      // 🎯 3단계: 데이터 전처리 (장애 시나리오 반영)
      const variation = Math.sin(Date.now() / 60000) * 0.3 + 0.7; // 시간에 따른 변화 패턴

      // 🎭 장애 시나리오 기반 메트릭 변동 계산
      const isAffectedByScenario =
        scenarioAffectedTypes.includes(server.role) ||
        currentScenario?.changes?.targetServers?.includes(server.id);
      const effectiveIntensity = isAffectedByScenario ? scenarioIntensity : 1.0;

      const processedMetrics = {
        cpu: parseFloat(
          Math.max(
            0,
            Math.min(
              100,
              rawMetrics.cpu + (Math.random() - 0.5) * 20 * effectiveIntensity
            )
          ).toFixed(2)
        ),
        memory: parseFloat(
          Math.max(
            0,
            Math.min(
              100,
              rawMetrics.memory +
                (Math.random() - 0.5) * 15 * effectiveIntensity
            )
          ).toFixed(2)
        ),
        disk: parseFloat(
          Math.max(
            0,
            Math.min(
              100,
              rawMetrics.disk + (Math.random() - 0.5) * 10 * effectiveIntensity
            )
          ).toFixed(2)
        ),
        network: {
          in: Math.max(
            0,
            rawMetrics.network.in +
              (Math.random() - 0.5) * 50 * effectiveIntensity
          ),
          out: Math.max(
            0,
            rawMetrics.network.out +
              (Math.random() - 0.5) * 30 * effectiveIntensity
          ),
        },
      };

      // 🎭 장애 시나리오 기반 추가 메트릭 조정
      if (isAffectedByScenario && currentScenario) {
        // 시나리오 단계별 특별한 메트릭 패턴 적용
        switch (currentScenario.phase) {
          case 'failure_start':
            // 장애 시작: CPU와 메모리 급증
            processedMetrics.cpu = Math.min(100, processedMetrics.cpu + 15);
            processedMetrics.memory = Math.min(
              100,
              processedMetrics.memory + 10
            );
            break;
          case 'cascade_failure':
            // 연쇄 장애: 모든 리소스에 부하
            processedMetrics.cpu = Math.min(100, processedMetrics.cpu + 25);
            processedMetrics.memory = Math.min(
              100,
              processedMetrics.memory + 20
            );
            processedMetrics.disk = Math.min(100, processedMetrics.disk + 15);
            break;
          case 'critical_state':
            // 임계 상태: 극심한 부하
            processedMetrics.cpu = Math.min(100, processedMetrics.cpu + 35);
            processedMetrics.memory = Math.min(
              100,
              processedMetrics.memory + 30
            );
            break;
          case 'auto_recovery':
            // 복구 중: 점진적 개선
            processedMetrics.cpu = Math.max(0, processedMetrics.cpu - 10);
            processedMetrics.memory = Math.max(0, processedMetrics.memory - 8);
            break;
        }

        if (!this.isMockMode) {
          console.log(
            `🎯 서버 ${server.id} (${server.role}) 장애 영향: CPU ${processedMetrics.cpu}%, Memory ${processedMetrics.memory}%`
          );
        }
      }

      // 🎯 4단계: 유의미한 변화 감지 (10% 이상 변화 시에만 저장 - 임계값 상향 조정)
      const cpuChange = Math.abs(processedMetrics.cpu - server.metrics.cpu);
      const memoryChange = Math.abs(
        processedMetrics.memory - server.metrics.memory
      );

      if (cpuChange > 10 || memoryChange > 10) {
        // 5%에서 10%로 상향 조정
        hasSignificantChange = true;
      }

      // 🎯 5단계: 서버 상태 업데이트 (메모리)
      server.metrics = {
        ...server.metrics,
        ...processedMetrics,
        uptime: server.metrics.uptime + this.config.updateInterval / 1000,
        requests: server.metrics.requests + Math.floor(Math.random() * 100),
        errors: server.metrics.errors + (Math.random() > 0.95 ? 1 : 0),
      };

      // 🎯 6단계: 메트릭 기반 서버 상태 동적 업데이트
      const previousStatus = server.status;
      const newStatus = this.determineServerStatusFromMetrics(server.metrics);

      // 상태가 변경된 경우에만 업데이트
      if (newStatus !== previousStatus) {
        server.status = newStatus;
        hasSignificantChange = true;

        if (!this.isMockMode) {
          console.log(
            `🔄 서버 ${server.id} 상태 변경: ${previousStatus} → ${newStatus}`
          );
        }
      }

      // 🎯 7단계: 건강 점수 재계산
      server.health.score = this.calculateHealthScore(server.metrics);
      server.health.lastCheck = new Date().toISOString();

      updatedServers.push(server);
    }

    // 🎯 8단계: 유의미한 변화가 있을 때만 저장 (성능 최적화 + 과도한 갱신 방지)
    if (hasSignificantChange && updatedServers.length > 0) {
      await this.batchSaveServersToRedis(updatedServers);

      if (!this.isMockMode) {
        console.log(
          `📊 유의미한 변화 감지 - Redis 저장 완료: ${updatedServers.length}개 서버`
        );
      }
    }
  }

  /**
   * 🎯 메트릭 기반 서버 상태 결정
   */
  private determineServerStatusFromMetrics(
    metrics: any
  ): 'running' | 'warning' | 'error' {
    const { cpu, memory, disk } = metrics;

    // Critical 조건 (error 상태)
    if (cpu > 90 || memory > 95 || disk > 95) {
      return 'error';
    }

    // Warning 조건
    if (cpu > 75 || memory > 85 || disk > 85) {
      return 'warning';
    }

    // 정상 상태
    return 'running';
  }

  private updateClusterMetrics(): void {
    // ServerCluster 타입에는 metrics가 없으므로 제거하거나 다른 방식으로 처리
    // 현재는 주석 처리
  }

  // 필수 메서드들
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
    return Array.from(this.applications.values()).find(
      app => app.name === name
    );
  }

  public getDashboardSummary() {
    const servers = this.getAllServers();
    const clusters = this.getAllClusters();
    const applications = this.getAllApplications();

    return {
      servers: {
        total: servers.length,
        online: servers.filter(s => s.status === 'running').length, // running → online 매핑
        running: servers.filter(s => s.status === 'running').length, // 테스트 호환성을 위해 추가
        warning: servers.filter(s => s.status === 'warning').length,
        offline: servers.filter(s => s.status === 'error').length, // error → offline 매핑
        error: servers.filter(s => s.status === 'error').length, // 테스트 호환성을 위해 추가
        avgCpu:
          servers.length > 0
            ? servers.reduce((sum, s) => sum + s.metrics.cpu, 0) /
              servers.length
            : 0,
        avgMemory:
          servers.length > 0
            ? servers.reduce((sum, s) => sum + s.metrics.memory, 0) /
              servers.length
            : 0,
      },
      clusters: {
        total: clusters.length,
        healthy: clusters.filter(
          c =>
            c.servers.filter(s => s.status === 'running').length >=
            c.servers.length * 0.8
        ).length,
        warning: clusters.filter(c => {
          const healthyRatio =
            c.servers.filter(s => s.status === 'running').length /
            c.servers.length;
          return healthyRatio >= 0.5 && healthyRatio < 0.8;
        }).length,
        critical: clusters.filter(
          c =>
            c.servers.filter(s => s.status === 'running').length <
            c.servers.length * 0.5
        ).length,
      },
      applications: {
        total: applications.length,
        healthy: applications.filter(a => a.performance.availability >= 95)
          .length,
        warning: applications.filter(
          a =>
            a.performance.availability >= 90 && a.performance.availability < 95
        ).length,
        critical: applications.filter(a => a.performance.availability < 90)
          .length,
        avgResponseTime:
          applications.length > 0
            ? applications.reduce(
                (sum, a) => sum + a.performance.responseTime,
                0
              ) / applications.length
            : 0,
      },
      timestamp: Date.now(),
    };
  }

  public getEnvironmentConfig() {
    return {
      serverArchitecture: this.config.serverArchitecture,
      maxServers: this.config.maxServers,
      updateInterval: this.config.updateInterval,
      enableRealtime: this.config.enableRealtime,
    };
  }

  public getAdvancedFeaturesStatus() {
    return {
      networkTopology: { enabled: false, nodes: 0, connections: 0 },
      baselineOptimizer: { enabled: false, dataPoints: 0 },
      demoScenarios: { enabled: false, currentScenario: 'normal' },
    };
  }

  public async healthCheck() {
    return {
      status: 'healthy',
      timestamp: Date.now(),
      generator: {
        isInitialized: this.isInitialized,
        isGenerating: this.isGenerating,
        serverCount: this.servers.size,
        clusterCount: this.clusters.size,
        applicationCount: this.applications.size,
      },
      metrics: {
        avgCpu:
          this.getAllServers().reduce((sum, s) => sum + s.metrics.cpu, 0) /
          this.servers.size,
        avgMemory:
          this.getAllServers().reduce((sum, s) => sum + s.metrics.memory, 0) /
          this.servers.size,
        healthyServers: this.getAllServers().filter(s => s.status === 'running')
          .length,
      },
    };
  }

  // 헬퍼 메서드들
  private groupServersByType(): { [key: string]: ServerInstance[] } {
    const groups: { [key: string]: ServerInstance[] } = {};

    this.servers.forEach(server => {
      const type = server.type || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(server);
    });

    return groups;
  }

  private calculateClusterHealth(
    servers: ServerInstance[]
  ): 'healthy' | 'warning' | 'critical' {
    const healthyCount = servers.filter(s => s.status === 'running').length;
    const healthPercentage = healthyCount / servers.length;

    if (healthPercentage >= 0.8) return 'healthy';
    if (healthPercentage >= 0.5) return 'warning';
    return 'critical';
  }

  private calculateApplicationHealth(
    servers: ServerInstance[]
  ): 'healthy' | 'warning' | 'critical' {
    if (servers.length === 0) return 'critical';

    const healthyCount = servers.filter(s => s.status === 'running').length;
    const healthPercentage = healthyCount / servers.length;

    if (healthPercentage >= 0.7) return 'healthy';
    if (healthPercentage >= 0.4) return 'warning';
    return 'critical';
  }

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isGenerating: this.isGenerating,
      isRunning: this.isGenerating,
      serverCount: this.servers.size,
      clusterCount: this.clusters.size,
      applicationCount: this.applications.size,
      config: this.config,
      isMockMode: this.isMockMode,
      isHealthCheckContext: this.isHealthCheckContext,
      isTestContext: this.isTestContext,
      redisStatus: {
        connected: this.redis !== null && !this.isMockMode,
        lastSaveTime: this.lastSaveTime,
        saveThrottleCount: this.saveThrottleCount,
        canSave: this.canSaveToRedis(),
      },
    };
  }

  public dispose(): void {
    this.stopAutoGeneration();
    this.servers.clear();
    this.clusters.clear();
    this.applications.clear();
    this.isInitialized = false;
  }

  /**
   * 🔍 서버 건강 점수 계산
   */
  private calculateHealthScore(metrics: any): number {
    const cpuScore = Math.max(0, 100 - metrics.cpu);
    const memoryScore = Math.max(0, 100 - metrics.memory);
    const diskScore = Math.max(0, 100 - metrics.disk);

    // 가중 평균으로 건강 점수 계산
    return Math.round(cpuScore * 0.4 + memoryScore * 0.4 + diskScore * 0.2);
  }

  /**
   * 🏗️ 서버 타입별 특화 사양 생성
   */
  private generateSpecializedSpecs(serverType: RealWorldServerType): any {
    const baseSpecs = {
      cpu: {
        cores: Math.floor(Math.random() * 16) + 4,
        model: 'Intel Xeon',
        architecture: Math.random() > 0.7 ? 'arm64' : 'x86_64',
      },
      memory: {
        total: Math.pow(2, Math.floor(Math.random() * 4) + 3) * 1024,
        type: 'DDR4',
        speed: 3200,
      },
      disk: {
        total: Math.pow(2, Math.floor(Math.random() * 3) + 8) * 1024,
        type: 'SSD',
        iops: 3000,
      },
      network: {
        bandwidth: 1000,
        latency: Math.random() * 10 + 1,
      },
    };

    // 서버 타입별 사양 특화
    switch (serverType.category) {
      case 'database':
        // 데이터베이스: 높은 메모리, 빠른 디스크
        baseSpecs.memory.total =
          Math.pow(2, Math.floor(Math.random() * 3) + 5) * 1024; // 32-128GB
        baseSpecs.disk.total =
          Math.pow(2, Math.floor(Math.random() * 4) + 10) * 1024; // 1-16TB
        baseSpecs.disk.iops = 5000 + Math.floor(Math.random() * 5000); // 5000-10000 IOPS
        baseSpecs.cpu.cores = Math.floor(Math.random() * 16) + 8; // 8-24 코어
        break;

      case 'web':
        // 웹서버: 높은 네트워크, 적은 메모리
        baseSpecs.network.bandwidth = 1000 + Math.floor(Math.random() * 9000); // 1-10Gbps
        baseSpecs.memory.total =
          Math.pow(2, Math.floor(Math.random() * 2) + 3) * 1024; // 8-32GB
        baseSpecs.cpu.cores = Math.floor(Math.random() * 8) + 4; // 4-12 코어
        break;

      case 'app':
        // 애플리케이션: 균형잡힌 사양
        baseSpecs.cpu.cores = Math.floor(Math.random() * 12) + 8; // 8-20 코어
        baseSpecs.memory.total =
          Math.pow(2, Math.floor(Math.random() * 3) + 4) * 1024; // 16-64GB
        break;

      case 'infrastructure':
        // 인프라: 목적별 특화
        if (serverType.id === 'redis') {
          baseSpecs.memory.total =
            Math.pow(2, Math.floor(Math.random() * 4) + 5) * 1024; // 32-256GB
        } else if (serverType.service === 'search') {
          baseSpecs.cpu.cores = Math.floor(Math.random() * 20) + 12; // 12-32 코어
          baseSpecs.memory.total =
            Math.pow(2, Math.floor(Math.random() * 3) + 6) * 1024; // 64-256GB
        }
        break;
    }

    return baseSpecs;
  }

  /**
   * 🚨 서버 타입별 현실적인 이슈 생성
   */
  private generateRealisticIssues(
    serverType: RealWorldServerType,
    metrics: any
  ): string[] {
    const issues: string[] = [];

    // 공통 이슈
    if (metrics.cpu > 80) {
      issues.push(`High CPU usage (${metrics.cpu.toFixed(1)}%)`);
    }
    if (metrics.memory > 85) {
      issues.push(`High memory usage (${metrics.memory.toFixed(1)}%)`);
    }
    if (metrics.disk > 90) {
      issues.push(`Disk space critical (${metrics.disk.toFixed(1)}%)`);
    }

    // 서버 타입별 특화 이슈
    switch (serverType.category) {
      case 'database':
        if (metrics.customMetrics?.query_time > 30) {
          issues.push('Slow query performance detected');
        }
        if (metrics.customMetrics?.active_connections > 150) {
          issues.push('High database connection count');
        }
        if (serverType.id === 'mysql') {
          issues.push('InnoDB buffer pool optimization needed');
        }
        break;

      case 'web':
        if (metrics.customMetrics?.response_time > 120) {
          issues.push('High response time detected');
        }
        if (metrics.customMetrics?.concurrent_connections > 800) {
          issues.push('Connection limit approaching');
        }
        if (serverType.id === 'nginx') {
          issues.push('Worker process optimization required');
        }
        break;

      case 'app':
        if (metrics.customMetrics?.heap_usage > 80) {
          issues.push('Memory leak suspected');
        }
        if (metrics.customMetrics?.gc_time > 8) {
          issues.push('Garbage collection overhead high');
        }
        if (serverType.id === 'nodejs') {
          issues.push('Event loop lag detected');
        }
        break;

      case 'infrastructure':
        if (
          serverType.id === 'redis' &&
          metrics.customMetrics?.cache_hit_ratio < 85
        ) {
          issues.push('Low cache hit ratio');
        }
        if (
          serverType.service === 'message-queue' &&
          metrics.customMetrics?.queue_depth > 5000
        ) {
          issues.push('Message queue backlog detected');
        }
        break;
    }

    return issues.slice(0, 3); // 최대 3개 이슈만 표시
  }
}

// 싱글톤 인스턴스
export const realServerDataGenerator = RealServerDataGenerator.getInstance();
