/**
 * 🚀 통합 데이터 생성기 모듈 v6.0
 *
 * Strategy Pattern으로 4개 생성기 통합:
 * - RealServerDataGenerator: 실제 서버 데이터
 * - OptimizedDataGenerator: 최적화된 베이스라인
 * - AdvancedDataStrategy: 고급 메트릭 (내장 구현)
 * - RealisticDataStrategy: 시연용 시나리오 (내장 구현)
 *
 * 🎯 특징:
 * - 공통 Redis 연결 풀
 * - 공통 타이머 관리
 * - 공통 메모리 캐시
 * - 환경변수 기반 온오프
 * - Vercel 최적화
 */

import type { EnhancedServerMetrics } from '@/types/server';
import {
  ServerInstance,
  ServerCluster,
  ApplicationMetrics,
} from '@/types/data-generator';
import Redis from 'ioredis';

// 기존 타입들 재사용 (중복 제거)
import { BaselineDataPoint } from '@/types/data-generator';
import { OptimizedDataGenerator } from '@/services/OptimizedDataGenerator';
import { BaselineOptimizer } from '@/modules/advanced-features/baseline-optimizer';

// 통합 설정 인터페이스
export interface UnifiedGeneratorConfig {
  enabled: boolean;
  strategy: 'real' | 'optimized' | 'advanced' | 'realistic';
  maxServers: number;
  updateInterval: number;
  enableRedis: boolean;
  enableCache: boolean;
  // Strategy별 설정
  realConfig?: {
    serverArchitecture:
      | 'single'
      | 'master-slave'
      | 'load-balanced'
      | 'microservices';
  };
  optimizedConfig?: {
    usePregenerated: boolean;
    realTimeVariationIntensity: number;
  };
  advancedConfig?: {
    regions: string[];
    serverTypes: string[];
  };
  realisticConfig?: {
    scenario:
      | 'normal'
      | 'spike'
      | 'memory_leak'
      | 'ddos'
      | 'performance_degradation';
  };
}

// 생성기 전략 인터페이스
export interface DataGeneratorStrategy {
  name: string;
  initialize(): Promise<void>;
  generateData(): Promise<any[]>;
  start(): Promise<void>;
  stop(): void;
  getStatus(): any;
  dispose(): void;
}

// Real 전략 구현
class RealDataStrategy implements DataGeneratorStrategy {
  name = 'real';
  private servers: Map<string, ServerInstance> = new Map();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private config: UnifiedGeneratorConfig;

  constructor(config: UnifiedGeneratorConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('🔧 Real Data Strategy 초기화...');
    this.initializeServers();
  }

  private initializeServers(): void {
    for (let i = 1; i <= this.config.maxServers; i++) {
      const serverTypes = ['web', 'api', 'database', 'cache', 'queue'];
      const environments = ['production', 'staging', 'development'];
      const roles = ['primary', 'replica', 'worker', 'standalone'];

      const serverType =
        serverTypes[Math.floor(Math.random() * serverTypes.length)];
      const environment =
        environments[Math.floor(Math.random() * environments.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];

      const server: ServerInstance = {
        id: `server-${i}`,
        name: `${serverType}-${i}`,
        type: serverType as any,
        role: role as any,
        environment: environment as any,
        location: ['us-east-1', 'us-west-2', 'eu-west-1'][
          Math.floor(Math.random() * 3)
        ],
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
          uptime: Math.random() * 8760 * 3600,
          customMetrics: {},
        },
        health: {
          score: Math.random() * 40 + 60,
          lastCheck: new Date().toISOString(),
          issues: [],
        },
      };

      this.servers.set(server.id, server);
    }
  }

  async generateData(): Promise<ServerInstance[]> {
    const servers: ServerInstance[] = [];

    for (const [id, server] of this.servers) {
      // 메트릭 업데이트
      server.metrics.cpu = Math.max(
        5,
        Math.min(95, server.metrics.cpu + (Math.random() - 0.5) * 10)
      );
      server.metrics.memory = Math.max(
        10,
        Math.min(90, server.metrics.memory + (Math.random() - 0.5) * 8)
      );
      server.metrics.disk = Math.max(
        20,
        Math.min(85, server.metrics.disk + (Math.random() - 0.5) * 3)
      );

      servers.push(server);
    }

    return servers;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.generateData().catch(console.error);
    }, this.config.updateInterval);

    console.log('✅ Real Data Strategy 시작됨');
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('🛑 Real Data Strategy 중지됨');
  }

  getStatus(): any {
    return {
      strategy: 'real',
      isRunning: this.isRunning,
      serversCount: this.servers.size,
      architecture: this.config.realConfig?.serverArchitecture,
    };
  }

  dispose(): void {
    this.stop();
    this.servers.clear();
  }
}

// Optimized 전략 구현 (기존 OptimizedDataGenerator 재사용)
class OptimizedDataStrategy implements DataGeneratorStrategy {
  name = 'optimized';
  private isRunning = false;
  private config: UnifiedGeneratorConfig;
  private optimizedGenerator: OptimizedDataGenerator;

  constructor(config: UnifiedGeneratorConfig) {
    this.config = config;
    this.optimizedGenerator = OptimizedDataGenerator.getInstance();
  }

  async initialize(): Promise<void> {
    console.log(
      '🔧 Optimized Data Strategy 초기화 (기존 OptimizedDataGenerator 재사용)...'
    );

    // 기존 OptimizedDataGenerator 설정 적용
    this.optimizedGenerator.updateConfig({
      usePregenerated: true,
      realTimeVariationIntensity:
        this.config.optimizedConfig?.realTimeVariationIntensity || 0.15,
      patternUpdateInterval: 3600000, // 1시간
      memoryOptimizationEnabled: true,
      prometheusEnabled: false,
    });
  }

  async generateData(): Promise<EnhancedServerMetrics[]> {
    // 기존 OptimizedDataGenerator의 generateRealTimeData 메서드 사용
    return await this.optimizedGenerator.generateRealTimeData();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // 임시 서버 데이터 생성 (기존 방식 유지)
    const initialServers: EnhancedServerMetrics[] = [];
    for (let i = 1; i <= this.config.maxServers; i++) {
      initialServers.push({
        id: `opt-server-${i}`,
        name: `opt-host-${i}`,
        hostname: `opt-host-${i}`,
        environment: 'production',
        role: 'web',
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        network_in: 0,
        network_out: 0,
        response_time: 0,
        status: 'healthy',
        uptime: 0,
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        alerts: [],
      });
    }

    // 기존 OptimizedDataGenerator 시작
    await this.optimizedGenerator.start(initialServers);
    console.log(
      '🚀 Optimized Data Strategy 시작됨 (기존 OptimizedDataGenerator 활용)'
    );
  }

  stop(): void {
    this.isRunning = false;
    this.optimizedGenerator.stop();
    console.log('🛑 Optimized Data Strategy 중지됨');
  }

  getStatus(): any {
    const optimizedStatus = this.optimizedGenerator.getStatus();
    return {
      strategy: 'optimized',
      isRunning: this.isRunning,
      ...optimizedStatus,
      reuseExistingCode:
        '✅ 기존 OptimizedDataGenerator 완전 재사용 (중복 제거)',
    };
  }

  dispose(): void {
    this.stop();
  }
}

// Advanced 전략 구현
class AdvancedDataStrategy implements DataGeneratorStrategy {
  name = 'advanced';
  private isRunning = false;
  private config: UnifiedGeneratorConfig;
  private servers: any[] = [];

  constructor(config: UnifiedGeneratorConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('🔧 Advanced Data Strategy 초기화...');
    this.initializeAdvancedServers();
  }

  private initializeAdvancedServers(): void {
    const regions = this.config.advancedConfig?.regions || [
      'us-east-1',
      'us-west-2',
      'eu-west-1',
    ];
    const serverTypes = this.config.advancedConfig?.serverTypes || [
      'K8s',
      'Host',
      'Cloud',
      'Container',
    ];

    for (let i = 0; i < this.config.maxServers; i++) {
      const server = {
        id: `adv-server-${i}`,
        name: `${serverTypes[i % serverTypes.length]}-${i}`,
        serverType: serverTypes[i % serverTypes.length],
        location: {
          region: regions[i % regions.length],
          zone: `${regions[i % regions.length]}-${Math.floor(i / regions.length) + 1}`,
        },
        resources: {
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
        },
      };

      this.servers.push(server);
    }
  }

  async generateData(): Promise<any[]> {
    return this.servers.map(server => ({
      ...server,
      metrics: {
        cpu: {
          usage: 10 + Math.random() * 80,
          load1: Math.random() * 4,
        },
        memory: {
          used: Math.floor(
            server.resources.memory.total * (0.2 + Math.random() * 0.6)
          ),
          available: Math.floor(
            server.resources.memory.total * (0.4 + Math.random() * 0.4)
          ),
        },
        timestamp: new Date(),
      },
    }));
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('✅ Advanced Data Strategy 시작됨');
  }

  stop(): void {
    this.isRunning = false;
    console.log('🛑 Advanced Data Strategy 중지됨');
  }

  getStatus(): any {
    return {
      strategy: 'advanced',
      isRunning: this.isRunning,
      serversCount: this.servers.length,
      regions: this.config.advancedConfig?.regions,
    };
  }

  dispose(): void {
    this.stop();
    this.servers = [];
  }
}

// Realistic 전략 구현
class RealisticDataStrategy implements DataGeneratorStrategy {
  name = 'realistic';
  private isRunning = false;
  private config: UnifiedGeneratorConfig;
  private scenario: string = 'normal';

  constructor(config: UnifiedGeneratorConfig) {
    this.config = config;
    this.scenario = config.realisticConfig?.scenario || 'normal';
  }

  async initialize(): Promise<void> {
    console.log('🔧 Realistic Data Strategy 초기화...');
  }

  async generateData(): Promise<any[]> {
    const count = this.config.maxServers;
    const metrics: any[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i) * 60000);
      const dataPoint = this.generateRealisticDataPoint(timestamp, i);
      metrics.push(dataPoint);
    }

    return metrics;
  }

  private generateRealisticDataPoint(timestamp: Date, index: number): any {
    const hour = timestamp.getHours();
    const timePattern = hour >= 9 && hour <= 18 ? 1.0 : 0.5;

    let cpu = 25 * timePattern + Math.random() * 20;
    let memory = 40 * timePattern + Math.random() * 30;

    // 시나리오별 수정
    switch (this.scenario) {
      case 'spike':
        cpu *= 2.5;
        memory *= 1.8;
        break;
      case 'memory_leak':
        memory += index * 2; // 점진적 증가
        break;
      case 'ddos':
        cpu *= 3;
        break;
    }

    return {
      id: `real-server-${index}`,
      timestamp: timestamp.toISOString(),
      cpu: Math.min(95, Math.max(5, cpu)),
      memory: Math.min(90, Math.max(10, memory)),
      disk: 60 + Math.random() * 20,
      networkIn: Math.random() * 2000,
      networkOut: Math.random() * 1500,
      responseTime: 150 + Math.random() * 200,
      scenario: this.scenario,
    };
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log(
      `✅ Realistic Data Strategy 시작됨 (시나리오: ${this.scenario})`
    );
  }

  stop(): void {
    this.isRunning = false;
    console.log('🛑 Realistic Data Strategy 중지됨');
  }

  getStatus(): any {
    return {
      strategy: 'realistic',
      isRunning: this.isRunning,
      scenario: this.scenario,
    };
  }

  dispose(): void {
    this.stop();
  }
}

/**
 * 🎯 통합 데이터 생성기 모듈 (메인 클래스)
 */
export class UnifiedDataGeneratorModule {
  private static instance: UnifiedDataGeneratorModule;

  // 공통 리소스
  private redis: Redis | null = null;
  private cache = new Map<string, any>();
  private config: UnifiedGeneratorConfig;

  // 전략들
  private strategies = new Map<string, DataGeneratorStrategy>();
  private currentStrategy: DataGeneratorStrategy | null = null;

  // 상태 관리
  private isInitialized = false;
  private lastDataUpdate = 0;
  private stats = {
    totalGenerations: 0,
    totalErrors: 0,
    startTime: Date.now(),
  };

  private constructor() {
    this.config = this.loadConfiguration();
    console.log('🚀 UnifiedDataGeneratorModule 생성됨');
  }

  public static getInstance(): UnifiedDataGeneratorModule {
    if (!UnifiedDataGeneratorModule.instance) {
      UnifiedDataGeneratorModule.instance = new UnifiedDataGeneratorModule();
    }
    return UnifiedDataGeneratorModule.instance;
  }

  /**
   * 🔧 설정 로드
   */
  private loadConfiguration(): UnifiedGeneratorConfig {
    return {
      enabled: process.env.ENABLE_DATA_GENERATOR !== 'false',
      strategy: (process.env.DATA_GENERATOR_STRATEGY as any) || 'real',
      maxServers: parseInt(process.env.MAX_SERVERS || '8'),
      updateInterval: parseInt(process.env.UPDATE_INTERVAL || '15000'),
      enableRedis: process.env.ENABLE_REDIS !== 'false',
      enableCache: process.env.ENABLE_CACHE !== 'false',
      realConfig: {
        serverArchitecture:
          (process.env.SERVER_ARCHITECTURE as any) || 'load-balanced',
      },
      optimizedConfig: {
        usePregenerated: process.env.USE_PREGENERATED !== 'false',
        realTimeVariationIntensity: parseFloat(
          process.env.VARIATION_INTENSITY || '0.15'
        ),
      },
      advancedConfig: {
        regions: (process.env.REGIONS || 'us-east-1,us-west-2,eu-west-1').split(
          ','
        ),
        serverTypes: (
          process.env.SERVER_TYPES || 'K8s,Host,Cloud,Container'
        ).split(','),
      },
      realisticConfig: {
        scenario: (process.env.DEMO_SCENARIO as any) || 'normal',
      },
    };
  }

  /**
   * 🚀 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.config.enabled) {
      console.log('⚠️ 데이터 생성기가 비활성화되어 있습니다.');
      return;
    }

    console.log('🔧 UnifiedDataGeneratorModule 초기화 시작...');

    try {
      // 공통 Redis 연결
      if (this.config.enableRedis) {
        await this.initializeRedis();
      }

      // 전략들 초기화
      await this.initializeStrategies();

      // 현재 전략 설정
      await this.setStrategy(this.config.strategy);

      this.isInitialized = true;
      console.log(
        `✅ UnifiedDataGeneratorModule 초기화 완료 (전략: ${this.config.strategy})`
      );
    } catch (error) {
      console.error('❌ UnifiedDataGeneratorModule 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🔗 공통 Redis 연결 초기화
   */
  private async initializeRedis(): Promise<void> {
    try {
      // 환경변수에서 Redis 설정 가져오기
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
      const redisHost =
        process.env.REDIS_HOST || 'charming-condor-46598.upstash.io';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisPassword =
        process.env.REDIS_PASSWORD || process.env.KV_REST_API_TOKEN;

      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      } else if (redisPassword) {
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          tls: {},
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      }

      if (this.redis) {
        await this.redis.ping();
        console.log('✅ 공통 Redis 연결 성공');
      }
    } catch (error) {
      console.warn('⚠️ Redis 연결 실패, 메모리 캐시 사용:', error);
      this.redis = null;
    }
  }

  /**
   * 🏗️ 전략들 초기화
   */
  private async initializeStrategies(): Promise<void> {
    const strategies = [
      new RealDataStrategy(this.config),
      new OptimizedDataStrategy(this.config),
      new AdvancedDataStrategy(this.config),
      new RealisticDataStrategy(this.config),
    ];

    for (const strategy of strategies) {
      await strategy.initialize();
      this.strategies.set(strategy.name, strategy);
    }

    console.log(`🏗️ ${strategies.length}개 전략 초기화 완료`);
  }

  /**
   * 🎯 전략 변경
   */
  async setStrategy(strategyName: string): Promise<void> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`알 수 없는 전략: ${strategyName}`);
    }

    // 기존 전략 중지
    if (this.currentStrategy) {
      this.currentStrategy.stop();
    }

    // 새 전략 시작
    this.currentStrategy = strategy;
    await this.currentStrategy.start();

    console.log(`🎯 전략 변경: ${strategyName}`);
  }

  /**
   * 📊 데이터 생성 (메인 메서드)
   */
  async generateData(): Promise<any[]> {
    if (!this.currentStrategy) {
      throw new Error('활성화된 전략이 없습니다.');
    }

    try {
      const startTime = Date.now();
      const data = await this.currentStrategy.generateData();

      // 캐시 저장
      if (this.config.enableCache) {
        this.cache.set('lastData', {
          data,
          timestamp: startTime,
          strategy: this.currentStrategy.name,
        });
      }

      // Redis 저장
      if (this.redis) {
        await this.saveToRedis(data);
      }

      this.stats.totalGenerations++;
      this.lastDataUpdate = startTime;

      return data;
    } catch (error) {
      this.stats.totalErrors++;
      console.error('❌ 데이터 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 💾 Redis 저장
   */
  private async saveToRedis(data: any[]): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `unified_data_generator:${this.currentStrategy?.name}`;
      await this.redis.setex(
        key,
        300,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          strategy: this.currentStrategy?.name,
        })
      );
    } catch (error) {
      console.warn('⚠️ Redis 저장 실패:', error);
    }
  }

  /**
   * 🔄 자동 생성 시작
   */
  async startAutoGeneration(): Promise<void> {
    if (!this.currentStrategy) {
      throw new Error('활성화된 전략이 없습니다.');
    }

    // 주기적 데이터 생성
    setInterval(async () => {
      try {
        await this.generateData();
      } catch (error) {
        console.error('❌ 자동 생성 오류:', error);
      }
    }, this.config.updateInterval);

    console.log('🔄 자동 데이터 생성 시작됨');
  }

  /**
   * 📊 상태 조회
   */
  getStatus(): any {
    return {
      module: 'UnifiedDataGeneratorModule',
      version: '6.0.0',
      enabled: this.config.enabled,
      isInitialized: this.isInitialized,
      currentStrategy: this.currentStrategy?.name,
      config: this.config,
      stats: {
        ...this.stats,
        uptime: Date.now() - this.stats.startTime,
        lastDataUpdate: this.lastDataUpdate,
      },
      strategies: Array.from(this.strategies.keys()).map(name => ({
        name,
        status: this.strategies.get(name)?.getStatus(),
      })),
      resources: {
        redis: !!this.redis,
        cache: this.config.enableCache,
        cacheSize: this.cache.size,
      },
    };
  }

  /**
   * 🧹 정리
   */
  dispose(): void {
    // 모든 전략 정리
    for (const strategy of this.strategies.values()) {
      strategy.dispose();
    }
    this.strategies.clear();

    // 캐시 정리
    this.cache.clear();

    // Redis 연결 정리
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }

    console.log('🧹 UnifiedDataGeneratorModule 정리 완료');
  }
}

// 싱글톤 인스턴스 export
export const unifiedDataGenerator = UnifiedDataGeneratorModule.getInstance();
