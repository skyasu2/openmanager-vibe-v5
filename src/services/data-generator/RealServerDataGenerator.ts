/**
 * 🚀 Real Server Data Generator - Complete Implementation with Redis
 *
 * 완전한 기능을 갖춘 서버 데이터 생성기 (Redis 연동)
 */

import {
  ServerInstance,
  ServerCluster,
  ApplicationMetrics,
} from '@/types/data-generator';

// Redis 클라이언트 import
import Redis from 'ioredis';

// 중앙 서버 설정 import
import {
  ACTIVE_SERVER_CONFIG,
  logServerConfig,
  type ServerGenerationConfig,
} from '@/config/serverConfig';

export interface GeneratorConfig {
  maxServers?: number;
  updateInterval?: number;
  enableRealtime?: boolean;
  serverArchitecture?:
    | 'single'
    | 'master-slave'
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

  // 🔴 Redis 연결
  private redis: Redis | null = null;
  private readonly REDIS_PREFIX = 'openmanager:servers:';
  private readonly REDIS_CLUSTERS_PREFIX = 'openmanager:clusters:';
  private readonly REDIS_APPS_PREFIX = 'openmanager:apps:';

  constructor(config: GeneratorConfig = {}) {
    // 🎯 중앙 설정에서 기본값 가져오기
    const centralConfig = ACTIVE_SERVER_CONFIG;

    this.config = {
      maxServers: centralConfig.maxServers, // 🎯 중앙 설정에서 서버 개수 가져오기 (기본 20개)
      updateInterval: centralConfig.cache.updateInterval, // 🎯 중앙 설정에서 업데이트 간격 가져오기
      enableRealtime: true,
      serverArchitecture: 'load-balanced',
      enableRedis: true,
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

    // Redis 초기화
    this.initializeRedis();
  }

  public static getInstance(): RealServerDataGenerator {
    if (!RealServerDataGenerator.instance) {
      RealServerDataGenerator.instance = new RealServerDataGenerator();
    }
    return RealServerDataGenerator.instance;
  }

  /**
   * 🔴 Redis 연결 초기화
   */
  private async initializeRedis(): Promise<void> {
    if (!this.config.enableRedis) {
      console.log('📊 Redis 비활성화 - 메모리 모드로 실행');
      return;
    }

    try {
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
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      } else {
        // 개별 설정으로 연결
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          tls: {},
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      }

      // 연결 테스트
      await this.redis.ping();
      console.log('✅ Redis 연결 성공 - 서버 데이터 저장 활성화');
    } catch (error) {
      console.warn('⚠️ Redis 연결 실패, 메모리 모드로 폴백:', error);
      this.redis = null;
      this.config.enableRedis = false;
    }
  }

  /**
   * 🔴 Redis에 서버 데이터 저장
   */
  private async saveServerToRedis(server: ServerInstance): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `${this.REDIS_PREFIX}${server.id}`;
      const data = JSON.stringify({
        ...server,
        lastUpdated: new Date().toISOString(),
      });

      await this.redis.setex(key, 3600, data); // 1시간 TTL

      // 서버 목록에도 추가
      await this.redis.sadd(`${this.REDIS_PREFIX}list`, server.id);
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

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 RealServerDataGenerator 초기화 시작...');

    this.initializeServers();
    this.createClusters();
    this.createApplications();

    this.isInitialized = true;
    console.log('✅ RealServerDataGenerator 초기화 완료');

    // 실시간 업데이트 자동 시작 (설정이 활성화된 경우)
    if (this.config.enableRealtime && !this.isGenerating) {
      this.startAutoGeneration();
      console.log('🔄 실시간 데이터 업데이트 자동 시작됨');
    }
  }

  private initializeServers(): void {
    this.servers.clear();

    const serverTypes: (
      | 'web'
      | 'api'
      | 'database'
      | 'cache'
      | 'queue'
      | 'cdn'
      | 'gpu'
      | 'storage'
    )[] = ['web', 'api', 'database', 'cache', 'queue'];
    const roles: (
      | 'master'
      | 'slave'
      | 'primary'
      | 'replica'
      | 'worker'
      | 'standalone'
    )[] = ['primary', 'replica', 'worker', 'standalone'];
    const environments: ('production' | 'staging' | 'development' | 'test')[] =
      ['production', 'staging', 'development'];
    const locations = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

    const totalServers = this.config.maxServers || 30;

    for (let i = 1; i <= totalServers; i++) {
      const serverType =
        serverTypes[Math.floor(Math.random() * serverTypes.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const environment =
        environments[Math.floor(Math.random() * environments.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      const server: ServerInstance = {
        id: `server-${i}`,
        name: `${serverType}-${i}`,
        type: serverType,
        role,
        environment,
        location,
        status:
          Math.random() > 0.1
            ? 'running'
            : Math.random() > 0.5
              ? 'warning'
              : 'error',
        specs: {
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
        },
        metrics: {
          cpu: Math.random() * 80 + 10,
          memory: Math.random() * 70 + 20,
          disk: Math.random() * 60 + 30,
          network: {
            in: Math.random() * 100,
            out: Math.random() * 100,
          },
          requests: Math.random() * 1000 + 100,
          errors: Math.random() * 10,
          uptime: Math.random() * 8760 * 3600, // 최대 1년
          customMetrics: {},
        },
        health: {
          score: Math.random() * 40 + 60, // 60-100점
          lastCheck: new Date().toISOString(),
          issues: [],
        },
      };

      // 건강 상태에 따른 이슈 생성
      if (server.health.score < 80) {
        server.health.issues = ['High CPU usage', 'Memory leak detected'];
      }

      this.servers.set(server.id, server);
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

    const apps = [
      { name: 'Frontend App', type: 'web' },
      { name: 'API Gateway', type: 'api' },
      { name: 'User Service', type: 'api' },
      { name: 'Database Service', type: 'database' },
      { name: 'Cache Service', type: 'cache' },
    ];

    apps.forEach((app, index) => {
      const relatedServers = Array.from(this.servers.values())
        .filter(s => s.type === app.type)
        .slice(0, 3);

      const application: ApplicationMetrics = {
        name: app.name,
        version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.0`,
        deployments: {
          production: { servers: relatedServers.length, health: 90 },
          staging: {
            servers: Math.floor(relatedServers.length / 2),
            health: 85,
          },
          development: { servers: 1, health: 80 },
        },
        performance: {
          responseTime: Math.random() * 200 + 50,
          throughput: Math.random() * 1000 + 100,
          errorRate: Math.random() * 5,
          availability: Math.random() * 10 + 90,
        },
        resources: {
          totalCpu: relatedServers.reduce(
            (sum, s) => sum + s.specs.cpu.cores,
            0
          ),
          totalMemory: relatedServers.reduce(
            (sum, s) => sum + s.specs.memory.total,
            0
          ),
          totalDisk: relatedServers.reduce(
            (sum, s) => sum + s.specs.disk.total,
            0
          ),
          cost: Math.random() * 5000 + 1000,
        },
      };

      this.applications.set(`app-${index + 1}`, application);
    });
  }

  public startAutoGeneration(): void {
    if (this.isGenerating) {
      console.log(
        '⚠️ 실시간 데이터 생성이 이미 실행 중입니다 (중복 실행 방지)'
      );
      return;
    }

    this.isGenerating = true;
    this.intervalId = setInterval(() => {
      this.generateRealtimeData();
    }, this.config.updateInterval);

    console.log(
      `🔄 실시간 데이터 생성 시작 (${this.config.updateInterval}ms 주기)`
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

  private generateRealtimeData(): void {
    this.servers.forEach(server => {
      // ✅ 현실적인 변화량으로 제한 (기존 값 기준 ±5% 변화)
      const cpuChange = (Math.random() - 0.5) * 10; // ±5% 변화
      const memoryChange = (Math.random() - 0.5) * 8; // ±4% 변화
      const diskChange = (Math.random() - 0.5) * 2; // ±1% 변화 (디스크는 천천히 변함)

      server.metrics.cpu = Math.max(
        0,
        Math.min(100, server.metrics.cpu + cpuChange)
      );
      server.metrics.memory = Math.max(
        0,
        Math.min(100, server.metrics.memory + memoryChange)
      );
      server.metrics.disk = Math.max(
        0,
        Math.min(100, server.metrics.disk + diskChange)
      );

      // ✅ 네트워크 트래픽: 기존 값 기준 ±20% 변화 (더 현실적)
      const networkInChange =
        server.metrics.network.in * (Math.random() - 0.5) * 0.4; // ±20%
      const networkOutChange =
        server.metrics.network.out * (Math.random() - 0.5) * 0.4; // ±20%

      server.metrics.network.in = Math.max(
        0,
        server.metrics.network.in + networkInChange
      );
      server.metrics.network.out = Math.max(
        0,
        server.metrics.network.out + networkOutChange
      );

      // ✅ 요청 수: 기존 값 기준 ±15% 변화
      const requestsChange =
        server.metrics.requests * (Math.random() - 0.5) * 0.3; // ±15%
      server.metrics.requests = Math.max(
        0,
        server.metrics.requests + requestsChange
      );

      // ✅ 에러 수: 기존 값 기준 ±10% 변화 (에러는 급격히 변하지 않음)
      const errorsChange = server.metrics.errors * (Math.random() - 0.5) * 0.2; // ±10%
      server.metrics.errors = Math.max(0, server.metrics.errors + errorsChange);

      // ✅ 업타임: 점진적 증가 (현실적)
      server.metrics.uptime += this.config.updateInterval! / 1000; // 초 단위 증가

      // ✅ 헬스 스코어: 기존 값 기준 ±3% 변화 (안정적)
      const healthChange = (Math.random() - 0.5) * 6; // ±3% 변화
      server.health.score = Math.max(
        0,
        Math.min(100, server.health.score + healthChange)
      );
      server.health.lastCheck = new Date().toISOString();

      // ✅ 서버 상태 변경 확률 대폭 감소: 2% → 0.1% (200배 안정화)
      if (Math.random() < 0.001) {
        const statuses: ('running' | 'warning' | 'error')[] = [
          'running',
          'warning',
          'error',
        ];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        console.log(
          `🔄 서버 ${server.id} 상태 변경: ${server.status} → ${newStatus}`
        );
        server.status = newStatus;
      }
    });

    // 클러스터 메트릭 업데이트 (필요시)
    // this.updateClusterMetrics();
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
      isRunning: this.isGenerating,
      serverCount: this.servers.size,
      clusterCount: this.clusters.size,
      applicationCount: this.applications.size,
      config: this.config,
    };
  }

  public dispose(): void {
    this.stopAutoGeneration();
    this.servers.clear();
    this.clusters.clear();
    this.applications.clear();
    this.isInitialized = false;
  }
}

// 싱글톤 인스턴스
export const realServerDataGenerator = RealServerDataGenerator.getInstance();
