/**
 * 🏗️ 고정 데이터 시스템 메인 클래스
 * 
 * 실시간 → 고정 데이터 + 타임스탬프 시스템 통합 관리
 * TDD Green 단계: 테스트를 통과하는 최소한의 구현
 */

import { 
  FixedDataSystemConfig, 
  SystemState, 
  ServerStatus, 
  ActiveScenario, 
  FailureScenario, 
  DashboardApiResponse,
  FixedServerTemplate,
  ServerMetrics,
  Alert
} from '../types/fixed-data-system';

import { FailureScenarioEngine } from './failure-scenario-engine';
import { DynamicTimestampManager } from './dynamic-timestamp-manager';
import { redisTemplateCache } from './redis-template-cache';

// ==============================================
// 🔧 기본 설정
// ==============================================

const DEFAULT_CONFIG: FixedDataSystemConfig = {
  enableScenarios: true,
  maxConcurrentScenarios: 3,
  scenarioRotationInterval: 30, // 30분
  cascadeFailureEnabled: true,
  redisPrefix: 'openmanager:fixed:',
  backupToSupabase: true
};

// ==============================================
// 📊 서버 템플릿 데이터
// ==============================================

const SERVER_TEMPLATES: FixedServerTemplate[] = [
  {
    id: 'web-01',
    name: 'Web Server 1',
    type: 'web',
    baselineMetrics: {
      cpu: { min: 10, max: 70, normal: 35 },
      memory: { min: 20, max: 80, normal: 45 },
      disk: { min: 30, max: 90, normal: 55 },
      network: { 
        latency: { min: 50, max: 200, normal: 80 },
        throughput: { min: 100, max: 1000, normal: 500 }
      },
      response_time: { min: 100, max: 2000, normal: 300 }
    },
    failurePatterns: {
      cpu_overload: {
        enabled: true,
        metrics: { cpu: 90 },
        progressionCurve: 'exponential',
        recoveryTime: 15,
        cascadeRisk: 0.3
      },
      memory_leak: {
        enabled: true,
        metrics: { memory: 95 },
        progressionCurve: 'linear',
        recoveryTime: 30,
        cascadeRisk: 0.4
      },
      storage_full: {
        enabled: true,
        metrics: { disk: 92 },
        progressionCurve: 'step',
        recoveryTime: 45,
        cascadeRisk: 0.2
      },
      network_issue: {
        enabled: true,
        metrics: { 
          network: { latency: 2000, throughput: 50, in: 10, out: 20 },
          response_time: 5000
        },
        progressionCurve: 'random',
        recoveryTime: 20,
        cascadeRisk: 0.5
      },
      database_slow: {
        enabled: true,
        metrics: { 
          response_time: 8000,
          error_rate: 15
        },
        progressionCurve: 'exponential',
        recoveryTime: 60,
        cascadeRisk: 0.8
      }
    },
    dependencies: ['database-01'],
    location: 'Seoul-DC1',
    environment: 'production',
    priority: 'high'
  },
  {
    id: 'database-01',
    name: 'Database Server 1',
    type: 'database',
    baselineMetrics: {
      cpu: { min: 15, max: 80, normal: 40 },
      memory: { min: 30, max: 90, normal: 60 },
      disk: { min: 40, max: 95, normal: 70 },
      network: { 
        latency: { min: 20, max: 100, normal: 40 },
        throughput: { min: 200, max: 2000, normal: 800 }
      },
      response_time: { min: 50, max: 1000, normal: 150 }
    },
    failurePatterns: {
      cpu_overload: {
        enabled: true,
        metrics: { cpu: 85 },
        progressionCurve: 'exponential',
        recoveryTime: 20,
        cascadeRisk: 0.4
      },
      memory_leak: {
        enabled: true,
        metrics: { memory: 90 },
        progressionCurve: 'linear',
        recoveryTime: 45,
        cascadeRisk: 0.5
      },
      storage_full: {
        enabled: true,
        metrics: { disk: 95 },
        progressionCurve: 'step',
        recoveryTime: 60,
        cascadeRisk: 0.3
      },
      network_issue: {
        enabled: true,
        metrics: { 
          network: { latency: 1500, throughput: 100, in: 20, out: 30 },
          response_time: 3000
        },
        progressionCurve: 'random',
        recoveryTime: 25,
        cascadeRisk: 0.6
      },
      database_slow: {
        enabled: true,
        metrics: { 
          response_time: 5000,
          error_rate: 20
        },
        progressionCurve: 'exponential',
        recoveryTime: 90,
        cascadeRisk: 0.9
      }
    },
    dependencies: [],
    location: 'Seoul-DC1',
    environment: 'production',
    priority: 'critical'
  }
];

// ==============================================
// 🏗️ 고정 데이터 시스템 클래스
// ==============================================

export class FixedDataSystem {
  private config: FixedDataSystemConfig;
  private scenarioEngine: FailureScenarioEngine;
  private timestampManager: DynamicTimestampManager;
  private systemState: SystemState;
  private updateInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: Partial<FixedDataSystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.scenarioEngine = new FailureScenarioEngine(SERVER_TEMPLATES);
    this.timestampManager = new DynamicTimestampManager();
    
    // 초기 시스템 상태
    this.systemState = {
      servers: new Map<string, ServerStatus>(),
      activeScenarios: new Map<string, ActiveScenario[]>(),
      lastUpdate: new Date(),
      systemHealth: 'healthy',
      totalAlerts: 0,
      config: this.config
    };
  }

  /**
   * 🚀 시스템 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 1. Redis 템플릿 캐시 초기화
      await redisTemplateCache.initialize();
      
      // 2. 서버 상태 초기화
      await this.initializeServers();
      
      // 3. 자동 업데이트 시작
      this.startAutoUpdate();
      
      this.isInitialized = true;
      console.log('✅ 고정 데이터 시스템 초기화 완료');
    } catch (error) {
      console.error('❌ 고정 데이터 시스템 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🧹 시스템 정리
   */
  async cleanup(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Redis 캐시 정리
    await redisTemplateCache.clearCache();
    
    this.isInitialized = false;
    console.log('🧹 고정 데이터 시스템 정리 완료');
  }

  /**
   * 🎭 시나리오 트리거
   */
  async triggerScenario(serverId: string, scenario: FailureScenario): Promise<void> {
    if (!this.config.enableScenarios) {
      console.warn('⚠️ 시나리오 기능이 비활성화되어 있습니다');
      return;
    }

    await this.scenarioEngine.triggerScenario(serverId, scenario);
    
    // 연쇄 장애 처리
    if (this.config.cascadeFailureEnabled) {
      const cascadeFailures = await this.scenarioEngine.getCascadeFailures();
      
      for (const [cascadeServerId, cascadeScenarios] of cascadeFailures) {
        for (const cascadeScenario of cascadeScenarios) {
          await this.scenarioEngine.triggerScenario(cascadeServerId, cascadeScenario);
        }
      }
    }

    // 시스템 상태 업데이트
    await this.updateSystemState();
  }

  /**
   * 📊 서버 데이터 조회
   */
  async getServerData(): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Redis Template Cache에서 데이터 조회
      const cacheData = await redisTemplateCache.getServerData();
      
      // 활성 시나리오 효과 적용
      if (this.config.enableScenarios) {
        await this.applyActiveScenarios(cacheData.data);
      }
      
      // 응답 시간 계산
      const responseTime = Date.now() - startTime;
      
      return {
        ...cacheData,
        metadata: {
          ...cacheData.metadata,
          responseTime,
          systemHealth: this.systemState.systemHealth,
          activeScenarios: this.systemState.activeScenarios.size
        }
      };
    } catch (error) {
      console.error('❌ 서버 데이터 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 🏥 시스템 상태 조회
   */
  async getSystemState(): Promise<SystemState> {
    return { ...this.systemState };
  }

  /**
   * 🚨 활성 시나리오 조회
   */
  async getActiveScenarios(): Promise<ActiveScenario[]> {
    const activeScenarios: ActiveScenario[] = [];
    
    for (const [serverId, scenarios] of this.systemState.activeScenarios) {
      activeScenarios.push(...scenarios);
    }
    
    return activeScenarios;
  }

  /**
   * 📋 대시보드 API 응답 생성
   */
  async getDashboardApiResponse(): Promise<DashboardApiResponse> {
    const serverData = await this.getServerData();
    
    return {
      success: true,
      data: {
        servers: serverData.data.reduce((acc: any, server: any) => {
          acc[server.id] = server;
          return acc;
        }, {}),
        stats: this.calculateServerStats(serverData.data),
        lastUpdate: this.timestampManager.generateRealtimeTimestamp(),
        dataSource: 'fixed-data-system'
      },
      metadata: {
        responseTime: serverData.metadata?.responseTime || 0,
        cacheHit: serverData.metadata?.cacheHit || false,
        redisKeys: serverData.metadata?.redisKeys || 0,
        serversLoaded: serverData.data.length,
        activeScenarios: this.systemState.activeScenarios.size,
        systemHealth: this.systemState.systemHealth
      }
    };
  }

  /**
   * 🔄 서버 메트릭 조회
   */
  async getServerMetrics(serverId: string): Promise<ServerMetrics> {
    return await this.scenarioEngine.getServerMetrics(serverId);
  }

  // ==============================================
  // 🛠️ 내부 메서드
  // ==============================================

  /**
   * 서버 상태 초기화
   */
  private async initializeServers(): Promise<void> {
    for (const template of SERVER_TEMPLATES) {
      const serverStatus: ServerStatus = {
        id: template.id,
        name: template.name,
        status: 'healthy',
        metrics: {
          cpu: template.baselineMetrics.cpu.normal,
          memory: template.baselineMetrics.memory.normal,
          disk: template.baselineMetrics.disk.normal,
          network: {
            latency: template.baselineMetrics.network.latency.normal,
            throughput: template.baselineMetrics.network.throughput.normal,
            in: 100,
            out: 150
          },
          response_time: template.baselineMetrics.response_time.normal,
          request_count: 1000,
          error_rate: 0.5,
          uptime: 86400
        },
        activeScenarios: [],
        lastUpdate: new Date(),
        alerts: []
      };
      
      this.systemState.servers.set(template.id, serverStatus);
      this.systemState.activeScenarios.set(template.id, []);
    }
  }

  /**
   * 자동 업데이트 시작
   */
  private startAutoUpdate(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateSystemState();
        await this.updateTimestamps();
      } catch (error) {
        console.error('❌ 자동 업데이트 실패:', error);
      }
    }, 30000); // 30초마다 업데이트
  }

  /**
   * 시스템 상태 업데이트
   */
  private async updateSystemState(): Promise<void> {
    this.systemState.lastUpdate = new Date();
    
    // 시스템 건강도 계산
    const healthyServers = Array.from(this.systemState.servers.values())
      .filter(server => server.status === 'healthy').length;
    
    const totalServers = this.systemState.servers.size;
    const healthRatio = healthyServers / totalServers;
    
    if (healthRatio >= 0.8) {
      this.systemState.systemHealth = 'healthy';
    } else if (healthRatio >= 0.5) {
      this.systemState.systemHealth = 'degraded';
    } else {
      this.systemState.systemHealth = 'critical';
    }
    
    // 총 알림 수 계산
    this.systemState.totalAlerts = Array.from(this.systemState.servers.values())
      .reduce((total, server) => total + server.alerts.length, 0);
  }

  /**
   * 타임스탬프 업데이트
   */
  private async updateTimestamps(): Promise<void> {
    const currentTime = new Date();
    
    for (const [serverId, serverStatus] of this.systemState.servers) {
      // 시간대별 가중치 적용
      const weightedMetrics = this.timestampManager.applyTimeBasedWeights(
        serverStatus.metrics,
        currentTime
      );
      
      // 실시간 변동 적용
      const variatedMetrics = this.timestampManager.applyRealtimeVariation(weightedMetrics);
      
      // 서버 상태 업데이트
      serverStatus.metrics = variatedMetrics;
      serverStatus.lastUpdate = currentTime;
      
      // 서버 상태 결정
      serverStatus.status = this.determineServerStatus(variatedMetrics);
    }
  }

  /**
   * 활성 시나리오 효과 적용
   */
  private async applyActiveScenarios(servers: any[]): Promise<void> {
    for (const server of servers) {
      const activeScenarios = this.systemState.activeScenarios.get(server.id) || [];
      
      if (activeScenarios.length > 0) {
        // 시나리오 효과 적용
        let currentMetrics = server.metrics || this.getDefaultMetrics();
        
        for (const scenario of activeScenarios) {
          currentMetrics = await this.scenarioEngine.applyScenario(
            server.id,
            scenario.scenario,
            currentMetrics
          );
        }
        
        server.metrics = currentMetrics;
        server.status = this.determineServerStatus(currentMetrics);
      }
    }
  }

  /**
   * 서버 통계 계산
   */
  private calculateServerStats(servers: any[]): any {
    if (servers.length === 0) {
      return {
        total: 0,
        healthy: 0,
        warning: 0,
        critical: 0,
        avgCpu: 0,
        avgMemory: 0,
        avgDisk: 0
      };
    }

    const healthy = servers.filter(s => s.status === 'healthy').length;
    const warning = servers.filter(s => s.status === 'warning').length;
    const critical = servers.filter(s => s.status === 'critical').length;

    const totalCpu = servers.reduce((sum, s) => sum + (s.cpu || 0), 0);
    const totalMemory = servers.reduce((sum, s) => sum + (s.memory || 0), 0);
    const totalDisk = servers.reduce((sum, s) => sum + (s.disk || 0), 0);

    return {
      total: servers.length,
      healthy,
      warning,
      critical,
      avgCpu: Math.round(totalCpu / servers.length),
      avgMemory: Math.round(totalMemory / servers.length),
      avgDisk: Math.round(totalDisk / servers.length)
    };
  }

  /**
   * 서버 상태 결정
   */
  private determineServerStatus(metrics: ServerMetrics): 'healthy' | 'warning' | 'critical' | 'offline' {
    if (metrics.cpu > 90 || metrics.memory > 90 || metrics.disk > 95 || metrics.error_rate > 10) {
      return 'critical';
    } else if (metrics.cpu > 80 || metrics.memory > 80 || metrics.disk > 85 || metrics.error_rate > 5) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * 기본 메트릭 생성
   */
  private getDefaultMetrics(): ServerMetrics {
    return {
      cpu: 35,
      memory: 45,
      disk: 55,
      network: { latency: 80, throughput: 500, in: 100, out: 150 },
      response_time: 300,
      request_count: 1000,
      error_rate: 0.5,
      uptime: 86400
    };
  }

  /**
   * 디버깅 정보 조회
   */
  getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      systemState: {
        serversCount: this.systemState.servers.size,
        activeScenariosCount: this.systemState.activeScenarios.size,
        systemHealth: this.systemState.systemHealth,
        totalAlerts: this.systemState.totalAlerts
      },
      scenarioEngine: this.scenarioEngine.getDebugInfo(),
      timestampManager: this.timestampManager.getPerformanceMetrics()
    };
  }
}