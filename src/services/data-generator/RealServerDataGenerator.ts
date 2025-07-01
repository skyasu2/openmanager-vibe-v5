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

// 시스템 상태 확인 유틸리티 import
import { validateSystemForOperation } from '@/utils/systemStateChecker';

// Redis 타입 정의 (동적 import용)
type RedisType = any;

// 중앙 서버 설정 import
import { ACTIVE_SERVER_CONFIG, logServerConfig } from '@/config/serverConfig';

// 🏗️ 분리된 타입 정의 import (TDD Green 단계)
import {
  GeneratorConfig,
  calculateServerDistribution,
  generateHostname,
  generateSpecializedMetrics,
  getServerTypesForCategory,
} from './types/NewServerTypes';

// 🔴 분리된 Redis 서비스 import (TDD Green 단계)
import { RedisService } from './services/RedisService';

// 🏭 분리된 ServerInstanceFactory import (TDD Green 단계)
import { ServerInstanceFactory } from './factories/ServerInstanceFactory';

// ✅ 중복 코드 제거 완료 - NewServerTypes 모듈 함수 사용:
// - SERVER_DISTRIBUTION → calculateServerDistribution() 함수 사용
// - HOSTNAME_PATTERNS → generateHostname() 함수 사용
// - Redis 연동 로직 → RedisService 모듈 사용
// - 기타 중복 타입 정의들 → NewServerTypes 에서 import

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

  // 🔴 Redis 서비스 (분리된 모듈)
  private redisService: RedisService;

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

    // 🔴 Redis 서비스 초기화 (분리된 모듈)
    this.redisService = new RedisService({
      enableRedis: this.config.enableRedis || false,
      isMockMode: this.isMockMode,
      isHealthCheckContext: this.isHealthCheckContext,
      isTestContext: this.isTestContext,
    });

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
    // 명시적 환경변수/프로세스 인자 기반 컨텍스트 감지 (스택 분석 제거)
    this.isHealthCheckContext =
      process.env.IS_HEALTH_CHECK === 'true' ||
      (process.argv &&
        process.argv.some(arg => arg.includes('health-check-script')));

    this.isTestContext =
      process.env.NODE_ENV === 'test' ||
      (process.argv &&
        process.argv.some(
          arg => arg.includes('jest') || arg.includes('vitest')
        ));

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
   * 🛡️ Redis 저장 가능 여부 체크 (RedisService로 위임)
   */
  private canSaveToRedis(): boolean {
    return this.redisService.isConnected();
  }

  /**
   * 🔴 Redis에 서버 데이터 저장 (RedisService로 위임)
   */
  private async saveServerToRedis(server: ServerInstance): Promise<void> {
    await this.redisService.saveServer(server);
  }

  /**
   * 🔴 Redis에서 서버 데이터 조회 (RedisService로 위임)
   */
  private async loadServerFromRedis(
    serverId: string
  ): Promise<ServerInstance | null> {
    return await this.redisService.loadServer(serverId);
  }

  /**
   * 🔴 Redis에서 모든 서버 데이터 조회 (RedisService로 위임)
   */
  private async loadAllServersFromRedis(): Promise<ServerInstance[]> {
    return await this.redisService.loadAllServers();
  }

  /**
   * 🔴 Redis에 클러스터 데이터 저장 (RedisService로 위임)
   */
  private async saveClusterToRedis(cluster: ServerCluster): Promise<void> {
    await this.redisService.saveCluster(cluster);
  }

  /**
   * 🔴 Redis에 서버 데이터 배치 저장 (RedisService로 위임)
   */
  private async batchSaveServersToRedis(
    servers: ServerInstance[]
  ): Promise<void> {
    await this.redisService.batchSaveServers(servers);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (process.env.BUILD_SKIP_GENERATOR === 'true') {
      console.log(
        '⏭️ BUILD_SKIP_GENERATOR=true 설정으로 RealServerDataGenerator 초기화 스킵'
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

    // 실시간 업데이트 자동 시작
    if (this.config.enableRealtime && !this.isGenerating) {
      this.startAutoGeneration();
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

    let serverIndex = 1;
    let createdServers = 0;

    try {
      // 🏗️ 카테고리별 서버 생성
      for (const [category, count] of Object.entries(distribution)) {
        const availableTypes = getServerTypesForCategory(category);

        for (let i = 0; i < count; i++) {
          try {
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

            // 🏗️ 서버 타입별 특화 사양 생성 (ServerInstanceFactory로 위임)
            const specs =
              ServerInstanceFactory.generateSpecializedSpecs(serverType);

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

            // 건강 상태에 따른 이슈 생성 (ServerInstanceFactory로 위임)
            if (server.health.score < 80) {
              const issues = ServerInstanceFactory.generateRealisticIssues(
                serverType,
                server.metrics
              );
              server.health.issues = issues;
            }

            this.servers.set(server.id, server);
            createdServers++;

            serverIndex++;
          } catch (serverError) {
            console.error(
              `❌ 개별 서버 생성 실패 (카테고리: ${category}, 인덱스: ${i}):`,
              serverError
            );
          }
        }
      }

      console.log(
        `🎉 서버 생성 완료: 총 ${createdServers}개 서버가 Map에 저장됨`
      );
      console.log(`📊 현재 servers Map 크기: ${this.servers.size}`);

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
          for (
            let i = criticalTarget;
            i < criticalTarget + warningTarget;
            i++
          ) {
            const srv = shuffled[i];
            srv.status = 'warning';
            srv.health.score = Math.min(srv.health.score, 70);
          }

          // Map 에 반영
          shuffled.forEach(s => this.servers.set(s.id, s));
        }
      } catch (scenarioError) {
        console.warn('⚠️ 시나리오 분포 적용 중 오류:', scenarioError);
      }
    } catch (error) {
      console.error('❌ initializeServers 전체 실행 중 오류:', error);
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

    // 🛑 시스템 온오프 상태 확인 - "오프일 때는 무동작 원칙"
    this.validateAndStartGeneration();
  }

  private async validateAndStartGeneration(): Promise<void> {
    try {
      const systemValidation = await validateSystemForOperation(
        'Server Data Generation'
      );

      if (!systemValidation.canProceed) {
        console.log(`🛑 서버 데이터 생성 중단: ${systemValidation.reason}`);
        this.isGenerating = false;
        return;
      }

      console.log(`✅ 서버 데이터 생성 시작: ${systemValidation.reason}`);

      // 즉시 한 번 실행
      this.generateRealtimeData().catch(error => {
        console.error('❌ 실시간 데이터 생성 오류:', error);
      });

      this.intervalId = setInterval(async () => {
        try {
          // 매번 시스템 상태 확인
          const validation = await validateSystemForOperation(
            'Server Data Generation'
          );
          if (!validation.canProceed) {
            console.log(`🛑 서버 데이터 생성 중단됨: ${validation.reason}`);
            this.stopAutoGeneration();
            return;
          }

          await this.generateRealtimeData();
        } catch (error) {
          console.error('❌ 실시간 데이터 생성 오류:', error);
        }
      }, this.config.updateInterval);

      console.log(
        `🚀 실시간 데이터 생성 시작됨 (${this.config.updateInterval}ms 간격)`
      );
    } catch (error) {
      console.error('❌ 서버 데이터 생성 시작 실패:', error);
      this.isGenerating = false;
    }
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

    const scenarioStatus = this.scenarioManager?.getStatus();
    if (currentScenario && this.scenarioManager && scenarioStatus?.isActive) {
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
      if (currentScenario?.changes?.serverTypes) {
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
        (currentScenario?.changes?.targetServers?.includes(server.id) ?? false);
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

      // 🔧 Generated metrics 디버깅 로그 (요청된 추가)
      console.log('🔧 Generated metrics:', {
        serverId: server.id,
        cpu: processedMetrics.cpu,
        memory: processedMetrics.memory,
        disk: processedMetrics.disk,
        timestamp: new Date().toISOString(),
      });

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
      const updateInterval = this.config.updateInterval ?? 30000; // 기본값 30초
      server.metrics = {
        ...server.metrics,
        ...processedMetrics,
        uptime: server.metrics.uptime + updateInterval / 1000,
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

      // 🎯 7단계: 건강 점수 재계산 (ServerInstanceFactory로 위임)
      server.health.score = ServerInstanceFactory.calculateHealthScore(
        server.metrics
      );
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
      redisStatus: this.redisService?.getStatus() || {
        connected: false,
        mockMode: true,
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
}

// 싱글톤 인스턴스
export const realServerDataGenerator = RealServerDataGenerator.getInstance();
