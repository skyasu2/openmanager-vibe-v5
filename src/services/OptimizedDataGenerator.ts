/**
 * 🚀 최적화된 서버 데이터 생성기 v3.0.0
 *
 * 주요 최적화:
 * - 24시간 베이스라인 데이터 미리 생성
 * - 실시간으로는 변동사항만 계산
 * - 메모리 및 CPU 사용량 최소화
 * - 프로메테우스 메트릭 실시간 전달
 * - 레디스/DB 효율적 활용
 * - 중앙 버전 관리 시스템 통합
 */

import type { EnhancedServerMetrics } from '../types/server';
import { ServerEnvironment, ServerRole, ServerStatus } from '../types/server';
import { timerManager } from '../utils/TimerManager';
import { memoryOptimizer } from '../utils/MemoryOptimizer';
import { SmartCache } from '../utils/smart-cache';
import { DATA_GENERATOR_VERSIONS, VersionManager } from '../config/versions';
import { DemoScenarioManager } from './DemoScenarioManager';

interface BaselineDataPoint {
  timestamp: number;
  cpu_baseline: number;
  memory_baseline: number;
  disk_baseline: number;
  network_in_baseline: number;
  network_out_baseline: number;
  response_time_baseline: number;
  pattern_multiplier: number; // 시간대별 패턴 적용값
}

interface ServerBaselineData {
  server_id: string;
  hostname: string;
  environment: ServerEnvironment;
  role: ServerRole;
  baseline_status: ServerStatus;
  daily_pattern: BaselineDataPoint[]; // 24시간 = 1440분
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

interface OptimizedGeneratorConfig {
  usePregenerated: boolean;
  realTimeVariationIntensity: number; // 0.1 = 10% 변동
  patternUpdateInterval: number; // 베이스라인 패턴 업데이트 주기 (ms)
  memoryOptimizationEnabled: boolean;
  prometheusEnabled: boolean;
}

interface BaseLoadConfig {
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  responseTime: number;
}

const HIGH_LOAD_CONFIGS: Record<ServerRole, BaseLoadConfig> = {
  web: {
    cpu: 85,
    memory: 75,
    disk: 50,
    networkIn: 300,
    networkOut: 280,
    responseTime: 250,
  },
  api: {
    cpu: 90,
    memory: 85,
    disk: 45,
    networkIn: 250,
    networkOut: 200,
    responseTime: 350,
  },
  database: {
    cpu: 70,
    memory: 80,
    disk: 60,
    networkIn: 80,
    networkOut: 60,
    responseTime: 50,
  },
  cache: {
    cpu: 30,
    memory: 85,
    disk: 20,
    networkIn: 200,
    networkOut: 180,
    responseTime: 30,
  },
  'k8s-worker': {
    cpu: 80,
    memory: 60,
    disk: 45,
    networkIn: 50,
    networkOut: 40,
    responseTime: 200,
  },
  'k8s-control': {
    cpu: 25,
    memory: 40,
    disk: 70,
    networkIn: 60,
    networkOut: 80,
    responseTime: 100,
  },
  storage: {
    cpu: 40,
    memory: 50,
    disk: 85,
    networkIn: 120,
    networkOut: 100,
    responseTime: 150,
  },
  'load-balancer': {
    cpu: 50,
    memory: 45,
    disk: 30,
    networkIn: 300,
    networkOut: 350,
    responseTime: 60,
  },
  backup: {
    cpu: 35,
    memory: 40,
    disk: 90,
    networkIn: 30,
    networkOut: 150,
    responseTime: 120,
  },
};

export class OptimizedDataGenerator {
  private static instance: OptimizedDataGenerator;
  private isRunning: boolean = false;
  private config: OptimizedGeneratorConfig = {
    usePregenerated: true,
    realTimeVariationIntensity: 0.15, // 15% 변동
    patternUpdateInterval: 3600000, // 1시간마다 패턴 업데이트
    memoryOptimizationEnabled: true,
    prometheusEnabled: true,
  };

  // 베이스라인 데이터 스토리지
  private baselineStorage = new Map<string, ServerBaselineData>();
  private currentVariations = new Map<string, RealTimeVariation>();
  private lastPatternUpdate: number = 0;

  // 🎭 경연대회용 데모 시나리오 관리자
  private demoManager = DemoScenarioManager.getInstance();

  // 성능 최적화 및 경연대회 설정
  private cache = SmartCache.getInstance();
  private updateCounter: number = 0;
  private readonly CACHE_TTL = 30000; // 30초
  private readonly UPDATE_INTERVAL = 10000; // 10초 (Vercel 최적화)

  // 🎯 실시간 데이터 30분 자동 종료
  private readonly MAX_DURATION = 30 * 60 * 1000; // 🔥 30분 고정
  private startTime: Date | null = null;
  private autoStopTimer: NodeJS.Timeout | null = null;

  static getInstance(): OptimizedDataGenerator {
    if (!OptimizedDataGenerator.instance) {
      OptimizedDataGenerator.instance = new OptimizedDataGenerator();
    }
    return OptimizedDataGenerator.instance;
  }

  private constructor() {
    console.log('🚀 OptimizedDataGenerator 초기화');
  }

  /**
   * 🏗️ 24시간 베이스라인 데이터 미리 생성
   */
  async generateBaselineData(servers: EnhancedServerMetrics[]): Promise<void> {
    console.log('🏗️ 24시간 베이스라인 데이터 생성 시작...');

    for (const server of servers) {
      const baseline = await this.createServerBaseline(server);
      this.baselineStorage.set(server.id, baseline);

      // 초기 변동값 설정
      this.currentVariations.set(server.id, this.generateInitialVariation());
    }

    this.lastPatternUpdate = Date.now();
    console.log(
      `✅ ${servers.length}개 서버의 24시간 베이스라인 데이터 생성 완료`
    );

    // 베이스라인 데이터를 캐시에 저장
    await this.cacheBaselineData();
  }

  /**
   * 📊 개별 서버 베이스라인 생성
   */
  private async createServerBaseline(
    server: EnhancedServerMetrics
  ): Promise<ServerBaselineData> {
    const dailyPattern: BaselineDataPoint[] = [];
    const currentTime = Date.now();

    // 24시간 (1440분) 데이터 포인트 생성
    for (let minute = 0; minute < 1440; minute++) {
      const hourOfDay = Math.floor(minute / 60);
      const minuteOfHour = minute % 60;

      // 시간대별 패턴 적용
      const patternMultiplier = this.calculateTimePattern(
        hourOfDay,
        minuteOfHour
      );

      // 서버 역할별 기본 부하 설정
      const baseLoad = this.getServerBaseLoad(
        server.role as ServerRole,
        server.status as ServerStatus
      );

      const dataPoint: BaselineDataPoint = {
        timestamp: currentTime + minute * 60 * 1000,
        cpu_baseline: baseLoad.cpu * patternMultiplier,
        memory_baseline: baseLoad.memory * patternMultiplier,
        disk_baseline: baseLoad.disk + minute * 0.001, // 디스크는 시간에 따라 점진적 증가
        network_in_baseline: baseLoad.networkIn * patternMultiplier,
        network_out_baseline: baseLoad.networkOut * patternMultiplier,
        response_time_baseline: baseLoad.responseTime / patternMultiplier, // 부하가 높을수록 응답시간 증가
        pattern_multiplier: patternMultiplier,
      };

      dailyPattern.push(dataPoint);
    }

    return {
      server_id: server.id,
      hostname: server.hostname,
      environment: server.environment as ServerEnvironment,
      role: server.role,
      baseline_status: server.status,
      daily_pattern: dailyPattern,
      last_generated: currentTime,
    };
  }

  /**
   * ⏰ 시간대별 패턴 계산
   */
  private calculateTimePattern(hour: number, minute: number): number {
    // 업무시간 패턴 (09:00-18:00 높은 부하)
    if (hour >= 9 && hour <= 18) {
      return 0.8 + 0.4 * Math.sin(((hour - 9) * Math.PI) / 9); // 0.8 ~ 1.2
    }

    // 야간시간 (22:00-06:00 낮은 부하)
    if (hour >= 22 || hour <= 6) {
      return 0.3 + 0.2 * Math.random(); // 0.3 ~ 0.5
    }

    // 전환시간 (중간 부하)
    return 0.5 + 0.3 * Math.random(); // 0.5 ~ 0.8
  }

  /**
   * 🏗️ 서버 역할별 기본 부하 설정
   */
  private getServerBaseLoad(
    role: ServerRole,
    status: ServerStatus
  ): BaseLoadConfig {
    const statusMultiplier =
      status === 'critical' ? 1.5 : status === 'warning' ? 1.2 : 1.0;

    const baseLoads: Record<ServerRole, BaseLoadConfig> = {
      web: {
        cpu: 45,
        memory: 50,
        disk: 40,
        networkIn: 150,
        networkOut: 200,
        responseTime: 120,
      },
      api: {
        cpu: 60,
        memory: 65,
        disk: 35,
        networkIn: 100,
        networkOut: 120,
        responseTime: 80,
      },
      database: {
        cpu: 70,
        memory: 80,
        disk: 60,
        networkIn: 80,
        networkOut: 60,
        responseTime: 50,
      },
      cache: {
        cpu: 30,
        memory: 85,
        disk: 20,
        networkIn: 200,
        networkOut: 180,
        responseTime: 30,
      },
      'k8s-worker': {
        cpu: 80,
        memory: 60,
        disk: 45,
        networkIn: 50,
        networkOut: 40,
        responseTime: 200,
      },
      'k8s-control': {
        cpu: 25,
        memory: 40,
        disk: 70,
        networkIn: 60,
        networkOut: 80,
        responseTime: 100,
      },
      storage: {
        cpu: 40,
        memory: 50,
        disk: 85,
        networkIn: 120,
        networkOut: 100,
        responseTime: 150,
      },
      'load-balancer': {
        cpu: 50,
        memory: 45,
        disk: 30,
        networkIn: 300,
        networkOut: 350,
        responseTime: 60,
      },
      backup: {
        cpu: 35,
        memory: 40,
        disk: 90,
        networkIn: 30,
        networkOut: 150,
        responseTime: 120,
      },
    };

    const base = baseLoads[role];

    return {
      cpu: base.cpu * statusMultiplier,
      memory: base.memory * statusMultiplier,
      disk: base.disk * statusMultiplier,
      networkIn: base.networkIn * statusMultiplier,
      networkOut: base.networkOut * statusMultiplier,
      responseTime: base.responseTime * statusMultiplier,
    };
  }

  /**
   * 🎲 실시간 변동값 생성
   */
  private generateInitialVariation(): RealTimeVariation {
    return {
      cpu_variation:
        (Math.random() - 0.5) * this.config.realTimeVariationIntensity,
      memory_variation:
        (Math.random() - 0.5) * this.config.realTimeVariationIntensity,
      disk_variation:
        (Math.random() - 0.5) * (this.config.realTimeVariationIntensity * 0.5), // 디스크는 변동 적음
      network_variation:
        (Math.random() - 0.5) * this.config.realTimeVariationIntensity * 2, // 네트워크는 변동 큼
      response_variation:
        (Math.random() - 0.5) * this.config.realTimeVariationIntensity,
      burst_active: Math.random() < 0.1, // 10% 확률로 버스트
      anomaly_factor: Math.random() < 0.05 ? Math.random() * 0.3 : 0, // 5% 확률로 이상치
    };
  }

  /**
   * 🔄 실시간 데이터 생성 (베이스라인 + 변동)
   */
  async generateRealTimeData(): Promise<EnhancedServerMetrics[]> {
    const currentTime = Date.now();
    const servers: EnhancedServerMetrics[] = [];

    // 캐시에서 베이스라인 데이터 확인
    const cachedBaseline = await this.cache.query(
      'baseline-data',
      () => Promise.resolve(this.getBaselineDataFromStorage()),
      { staleTime: this.CACHE_TTL }
    );

    for (const [serverId, baseline] of this.baselineStorage) {
      const currentMinute =
        Math.floor((currentTime - baseline.last_generated) / 60000) % 1440;
      const baselinePoint = baseline.daily_pattern[currentMinute];
      const variation =
        this.currentVariations.get(serverId) || this.generateInitialVariation();

      // 베이스라인 + 실시간 변동 적용
      const server: EnhancedServerMetrics = {
        id: serverId,
        name: baseline.hostname, // name 속성 추가
        hostname: baseline.hostname,
        environment: baseline.environment,
        role: baseline.role,
        status: this.calculateCurrentStatus(baselinePoint, variation),
        cpu_usage: this.applyVariation(
          baselinePoint.cpu_baseline,
          variation.cpu_variation,
          variation.anomaly_factor
        ),
        memory_usage: this.applyVariation(
          baselinePoint.memory_baseline,
          variation.memory_variation,
          variation.anomaly_factor
        ),
        disk_usage: this.applyVariation(
          baselinePoint.disk_baseline,
          variation.disk_variation,
          0
        ), // 디스크는 이상치 없음
        network_in: this.applyVariation(
          baselinePoint.network_in_baseline,
          variation.network_variation,
          variation.anomaly_factor
        ),
        network_out: this.applyVariation(
          baselinePoint.network_out_baseline,
          variation.network_variation,
          variation.anomaly_factor
        ),
        response_time: this.applyVariation(
          baselinePoint.response_time_baseline,
          variation.response_variation,
          variation.anomaly_factor
        ),
        uptime: this.calculateUptime(baseline.baseline_status),
        last_updated: new Date(currentTime).toISOString(),
        alerts: [],
      };

      servers.push(server);

      // 변동값 조금씩 업데이트 (자연스러운 변화)
      this.updateVariation(serverId, variation);
    }

    // 🎭 경연대회용 데모 시나리오 적용
    this.demoManager.applyToServers(servers);

    return servers;
  }

  /**
   * 📊 베이스라인 값에 변동 적용
   */
  private applyVariation(
    baseline: number,
    variation: number,
    anomaly: number
  ): number {
    const varied = baseline * (1 + variation);
    const withAnomaly = varied * (1 + anomaly);
    return Math.max(0, Math.min(100, withAnomaly)); // 0-100% 범위 제한
  }

  /**
   * 📈 현재 상태 계산
   */
  private calculateCurrentStatus(
    baseline: BaselineDataPoint,
    variation: RealTimeVariation
  ): ServerStatus {
    const avgLoad = (baseline.cpu_baseline + baseline.memory_baseline) / 2;
    const variationImpact =
      Math.abs(variation.cpu_variation) + Math.abs(variation.memory_variation);

    if (
      avgLoad > 80 ||
      variationImpact > 0.3 ||
      variation.anomaly_factor > 0.2
    ) {
      return 'critical';
    }
    if (avgLoad > 60 || variationImpact > 0.2) {
      return 'warning';
    }
    return 'normal';
  }

  /**
   * 🔄 변동값 부드럽게 업데이트
   */
  private updateVariation(
    serverId: string,
    currentVariation: RealTimeVariation
  ): void {
    const smoothingFactor = 0.95; // 95% 이전값 + 5% 새값
    const newVariation = this.generateInitialVariation();

    const smoothedVariation: RealTimeVariation = {
      cpu_variation:
        currentVariation.cpu_variation * smoothingFactor +
        newVariation.cpu_variation * (1 - smoothingFactor),
      memory_variation:
        currentVariation.memory_variation * smoothingFactor +
        newVariation.memory_variation * (1 - smoothingFactor),
      disk_variation:
        currentVariation.disk_variation * smoothingFactor +
        newVariation.disk_variation * (1 - smoothingFactor),
      network_variation:
        currentVariation.network_variation * smoothingFactor +
        newVariation.network_variation * (1 - smoothingFactor),
      response_variation:
        currentVariation.response_variation * smoothingFactor +
        newVariation.response_variation * (1 - smoothingFactor),
      burst_active: Math.random() < 0.1,
      anomaly_factor: currentVariation.anomaly_factor * 0.9, // 이상치는 점진적으로 감소
    };

    this.currentVariations.set(serverId, smoothedVariation);
  }

  /**
   * ⏱️ 업타임 계산
   */
  private calculateUptime(status: ServerStatus): number {
    switch (status) {
      case 'critical':
        return Math.random() * 72 + 24; // 1-3일
      case 'warning':
        return Math.random() * 168 + 72; // 3일-1주
      default:
        return Math.random() * 8760 + 168; // 1주-1년
    }
  }

  /**
   * 🚀 최적화된 데이터 생성기 시작
   */
  async start(initialServers: EnhancedServerMetrics[]): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ OptimizedDataGenerator가 이미 실행 중입니다');
      return;
    }

    console.log('🚀 OptimizedDataGenerator 시작...');

    // 🎯 경연대회용 시작 시간 기록
    this.startTime = new Date();

    // 베이스라인 데이터 생성
    await this.generateBaselineData(initialServers);

    this.isRunning = true;

    // 🎯 20분 후 자동 종료 설정
    this.autoStopTimer = setTimeout(() => {
      console.log('🏁 20분 시나리오 완료 - 자동 종료');
      this.stop();
    }, this.MAX_DURATION);

    // 실시간 업데이트 타이머 등록
    timerManager.register({
      id: 'optimized-data-generator',
      callback: async () => {
        const servers = await this.generateRealTimeData();
        this.updateCounter++;

        // 메모리 최적화 (100회마다)
        if (
          this.config.memoryOptimizationEnabled &&
          this.updateCounter % 100 === 0
        ) {
          await this.optimizeMemory();
        }

        // 패턴 업데이트 체크
        if (
          Date.now() - this.lastPatternUpdate >
          this.config.patternUpdateInterval
        ) {
          await this.refreshPatterns();
        }

        console.log(
          `📊 실시간 데이터 생성: ${servers.length}개 서버 (업데이트 #${this.updateCounter})`
        );
      },
      interval: this.UPDATE_INTERVAL,
      priority: 'medium',
      enabled: true,
    });

    console.log(
      `✅ OptimizedDataGenerator 시작 완료 (${this.UPDATE_INTERVAL / 1000}초 간격)`
    );
  }

  /**
   * 🛑 데이터 생성기 중지
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    timerManager.unregister('optimized-data-generator');

    // 🎯 자동 종료 타이머 정리
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    console.log('🛑 OptimizedDataGenerator 정지');
  }

  /**
   * 🧠 메모리 최적화
   */
  private async optimizeMemory(): Promise<void> {
    const memoryStats = memoryOptimizer.getCurrentMemoryStats();

    if (memoryStats.usagePercent > 75) {
      // 베이스라인 데이터 압축
      await this.compressBaselineData();

      // 캐시 정리
      await this.cache.removeQueries('baseline-');

      console.log('🧠 OptimizedDataGenerator 메모리 최적화 실행');
    }
  }

  /**
   * 🔄 패턴 새로고침
   */
  private async refreshPatterns(): Promise<void> {
    console.log('🔄 베이스라인 패턴 새로고침 시작...');

    // 기존 서버 목록 유지하면서 패턴만 업데이트
    const serverList: EnhancedServerMetrics[] = [];
    for (const baseline of this.baselineStorage.values()) {
      serverList.push({
        id: baseline.server_id,
        name: baseline.hostname, // name 속성 추가
        hostname: baseline.hostname,
        environment: baseline.environment,
        role: baseline.role,
        status: baseline.baseline_status,
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        network_in: 0,
        network_out: 0,
        response_time: 0,
        uptime: 0,
        last_updated: '',
        alerts: [],
      });
    }

    await this.generateBaselineData(serverList);
    console.log('✅ 베이스라인 패턴 새로고침 완료');
  }

  /**
   * 💾 베이스라인 데이터 캐싱
   */
  private async cacheBaselineData(): Promise<void> {
    const data = Array.from(this.baselineStorage.values());
    await this.cache.query(
      'baseline-data',
      () => Promise.resolve(data),
      { staleTime: 3600000 } // 1시간
    );
  }

  /**
   * 📊 베이스라인 데이터 압축
   */
  private async compressBaselineData(): Promise<void> {
    for (const [serverId, baseline] of this.baselineStorage) {
      // 1시간 단위로 압축 (1440분 → 24시간)
      const compressedPattern: BaselineDataPoint[] = [];

      for (let hour = 0; hour < 24; hour++) {
        const hourlyPoints = baseline.daily_pattern.slice(
          hour * 60,
          (hour + 1) * 60
        );
        const avgPoint: BaselineDataPoint = {
          timestamp: hourlyPoints[0].timestamp,
          cpu_baseline:
            hourlyPoints.reduce((sum, p) => sum + p.cpu_baseline, 0) /
            hourlyPoints.length,
          memory_baseline:
            hourlyPoints.reduce((sum, p) => sum + p.memory_baseline, 0) /
            hourlyPoints.length,
          disk_baseline:
            hourlyPoints.reduce((sum, p) => sum + p.disk_baseline, 0) /
            hourlyPoints.length,
          network_in_baseline:
            hourlyPoints.reduce((sum, p) => sum + p.network_in_baseline, 0) /
            hourlyPoints.length,
          network_out_baseline:
            hourlyPoints.reduce((sum, p) => sum + p.network_out_baseline, 0) /
            hourlyPoints.length,
          response_time_baseline:
            hourlyPoints.reduce((sum, p) => sum + p.response_time_baseline, 0) /
            hourlyPoints.length,
          pattern_multiplier:
            hourlyPoints.reduce((sum, p) => sum + p.pattern_multiplier, 0) /
            hourlyPoints.length,
        };

        compressedPattern.push(avgPoint);
      }

      baseline.daily_pattern = compressedPattern;
      this.baselineStorage.set(serverId, baseline);
    }

    console.log('📊 베이스라인 데이터 압축 완료 (1440분 → 24시간)');
  }

  /**
   * 📈 스토리지에서 베이스라인 데이터 조회
   */
  private getBaselineDataFromStorage(): ServerBaselineData[] {
    return Array.from(this.baselineStorage.values());
  }

  /**
   * 📊 현재 상태 조회
   */
  getStatus(): {
    version: string;
    isRunning: boolean;
    serversCount: number;
    updateCounter: number;
    memoryUsage: string;
    lastPatternUpdate: string;
    config: OptimizedGeneratorConfig;
    version_info: any;
  } {
    const memoryStats = memoryOptimizer.getCurrentMemoryStats();

    return {
      version: DATA_GENERATOR_VERSIONS.optimized,
      isRunning: this.isRunning,
      serversCount: this.baselineStorage.size,
      updateCounter: this.updateCounter,
      memoryUsage: `${memoryStats.usagePercent.toFixed(1)}%`,
      lastPatternUpdate: new Date(this.lastPatternUpdate).toLocaleTimeString(),
      config: { ...this.config },
      version_info: {
        optimized: DATA_GENERATOR_VERSIONS.optimized,
        modules: DATA_GENERATOR_VERSIONS.modules,
        compatibility: VersionManager.checkCompatibility(
          'data_generator',
          DATA_GENERATOR_VERSIONS.optimized
        ),
      },
    };
  }

  /**
   * ⚙️ 설정 업데이트
   */
  updateConfig(newConfig: Partial<OptimizedGeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ OptimizedDataGenerator 설정 업데이트:', newConfig);
  }

  /**
   * 🎭 데모 시나리오 상태 조회
   */
  getDemoStatus() {
    return this.demoManager.getStatus();
  }

  /**
   * 🔄 데모 시나리오 제어
   */
  toggleDemo(enabled: boolean): void {
    this.demoManager.toggle(enabled);
  }

  /**
   * 🔄 데모 시나리오 재시작
   */
  restartDemo(): void {
    this.demoManager.restart();
  }
}
