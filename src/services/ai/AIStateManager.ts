/**
 * 🤖 AI 상태 관리자 v1.0
 *
 * 모든 AI 엔진의 상태를 중앙에서 통합 관리:
 * - MasterAIEngine, UnifiedAIEngine, OpenSourceEngines 등
 * - 실시간 헬스 체크
 * - 상태 동기화
 * - 성능 메트릭 통합
 * - 장애 감지 및 복구
 */

import { MasterAIEngine } from './MasterAIEngine';
import { UnifiedAIEngine } from '@/core/ai/UnifiedAIEngine';
import { OpenSourceEngines } from './engines/OpenSourceEngines';
import { unifiedNotificationService } from '@/services/notifications/UnifiedNotificationService';

// AI 엔진 상태 타입
export interface AIEngineState {
  id: string;
  name: string;
  type: 'master' | 'unified' | 'opensource' | 'custom';
  status: 'active' | 'inactive' | 'error' | 'initializing' | 'maintenance';
  health: {
    healthy: boolean;
    responseTime: number;
    errorRate: number;
    lastHealthCheck: Date;
    consecutiveFailures: number;
  };
  performance: {
    totalRequests: number;
    successfulRequests: number;
    averageResponseTime: number;
    throughput: number; // requests per minute
    memoryUsage?: number;
  };
  capabilities: string[];
  version?: string;
  lastUsed?: Date;
  uptime: number;
  configuration?: Record<string, any>;
}

// 통합 AI 시스템 상태
export interface AISystemState {
  overall: {
    status: 'healthy' | 'degraded' | 'critical' | 'maintenance';
    totalEngines: number;
    activeEngines: number;
    errorEngines: number;
    lastUpdate: Date;
  };
  engines: AIEngineState[];
  performance: {
    systemThroughput: number;
    averageResponseTime: number;
    overallSuccessRate: number;
    totalMemoryUsage: number;
  };
  alerts: {
    active: number;
    recent: string[];
  };
}

// 헬스 체크 설정
export interface HealthCheckConfig {
  intervalMs: number;
  timeoutMs: number;
  maxConsecutiveFailures: number;
  enableAutoRecovery: boolean;
  alertThresholds: {
    responseTimeMs: number;
    errorRate: number;
    memoryUsageMB: number;
  };
}

/**
 * 🤖 AI 상태 관리자
 */
export class AIStateManager {
  private static instance: AIStateManager;

  // AI 엔진 인스턴스들
  private masterEngine: MasterAIEngine;
  private unifiedEngine: UnifiedAIEngine;
  private openSourceEngines: OpenSourceEngines;

  // 상태 관리
  private engineStates: Map<string, AIEngineState> = new Map();
  private systemState: AISystemState;
  private healthCheckConfig: HealthCheckConfig;

  // 스케줄러
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // 통계
  private stats = {
    totalHealthChecks: 0,
    totalRecoveries: 0,
    totalFailures: 0,
    uptime: Date.now(),
  };

  private constructor() {
    // AI 엔진 초기화
    this.masterEngine = new MasterAIEngine();
    this.unifiedEngine = UnifiedAIEngine.getInstance();
    this.openSourceEngines = new OpenSourceEngines();

    // 설정 초기화
    this.healthCheckConfig = this.loadDefaultConfig();
    this.systemState = this.initializeSystemState();

    // 초기 상태 설정
    this.initializeEngineStates();

    console.log('🤖 AI 상태 관리자 초기화 완료');
  }

  /**
   * 🏭 싱글톤 인스턴스 획득
   */
  static getInstance(): AIStateManager {
    if (!AIStateManager.instance) {
      AIStateManager.instance = new AIStateManager();
    }
    return AIStateManager.instance;
  }

  /**
   * 🚀 모니터링 시작
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ AI 상태 모니터링이 이미 실행 중입니다.');
      return;
    }

    console.log('🚀 AI 상태 모니터링 시작...');
    this.isMonitoring = true;

    // 초기 헬스 체크 실행
    await this.performHealthCheck();

    // 주기적 헬스 체크 스케줄링
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheckConfig.intervalMs);

    // 시작 알림
    await unifiedNotificationService.sendSystemAlert(
      'AI 상태 모니터링 시작',
      `${this.engineStates.size}개 AI 엔진 모니터링을 시작했습니다.`,
      'info'
    );

    console.log('✅ AI 상태 모니터링 시작 완료');
  }

  /**
   * 🛑 모니터링 중지
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('⚠️ AI 상태 모니터링이 실행 중이 아닙니다.');
      return;
    }

    console.log('🛑 AI 상태 모니터링 중지...');
    this.isMonitoring = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // 중지 알림
    await unifiedNotificationService.sendSystemAlert(
      'AI 상태 모니터링 중지',
      'AI 엔진 모니터링을 중지했습니다.',
      'info'
    );

    console.log('✅ AI 상태 모니터링 중지 완료');
  }

  /**
   * 🔍 헬스 체크 수행
   */
  async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    console.log('🔍 AI 엔진 헬스 체크 시작...');

    try {
      this.stats.totalHealthChecks++;

      // 모든 엔진 상태 체크
      const checkPromises = Array.from(this.engineStates.keys()).map(engineId =>
        this.checkEngineHealth(engineId)
      );

      await Promise.allSettled(checkPromises);

      // 시스템 상태 업데이트
      this.updateSystemState();

      // 알림 처리
      await this.processHealthAlerts();

      const duration = Date.now() - startTime;
      console.log(`✅ AI 엔진 헬스 체크 완료 (${duration}ms)`);
    } catch (error) {
      console.error('❌ AI 헬스 체크 실패:', error);
      this.stats.totalFailures++;
    }
  }

  /**
   * 🔍 개별 엔진 헬스 체크
   */
  private async checkEngineHealth(engineId: string): Promise<void> {
    const state = this.engineStates.get(engineId);
    if (!state) return;

    const startTime = Date.now();

    try {
      let isHealthy = false;
      let responseTime = 0;
      let errorRate = 0;
      let memoryUsage = 0;

      // 엔진 타입별 헬스 체크
      switch (state.type) {
        case 'master':
          const masterStatus = await this.masterEngine.getEngineStatuses();
          isHealthy = masterStatus.length > 0;
          responseTime =
            masterStatus.reduce((sum, s) => sum + s.avg_response_time, 0) /
            masterStatus.length;
          errorRate =
            1 -
            masterStatus.reduce((sum, s) => sum + s.success_rate, 0) /
              masterStatus.length;
          break;

        case 'unified':
          const unifiedStatus = await this.unifiedEngine.getSystemStatus();
          isHealthy = unifiedStatus.status === 'ready';
          responseTime = unifiedStatus.performance?.averageResponseTime || 0;
          errorRate = 1 - (unifiedStatus.performance?.successRate || 0);
          break;

        case 'opensource':
          const osStatus = this.openSourceEngines.getEngineStatus();
          isHealthy = osStatus.initialized;
          responseTime = 50; // 추정값
          errorRate = 0.05; // 추정값
          memoryUsage = 43; // 추정값 (MB)
          break;

        default:
          isHealthy = false;
          responseTime = 0;
          errorRate = 1;
      }

      // 상태 업데이트
      state.health = {
        healthy: isHealthy,
        responseTime,
        errorRate,
        lastHealthCheck: new Date(),
        consecutiveFailures: isHealthy
          ? 0
          : state.health.consecutiveFailures + 1,
      };

      // 성능 메트릭 업데이트
      state.performance = {
        ...state.performance,
        averageResponseTime: responseTime,
        memoryUsage,
      };

      // 상태 결정
      if (isHealthy) {
        state.status = 'active';
      } else if (
        state.health.consecutiveFailures >=
        this.healthCheckConfig.maxConsecutiveFailures
      ) {
        state.status = 'error';
      } else {
        state.status = 'inactive';
      }

      // 마지막 사용 시간 업데이트
      if (isHealthy) {
        state.lastUsed = new Date();
      }

      // 업타임 계산
      state.uptime = Date.now() - this.stats.uptime;

      console.log(
        `🔍 ${state.name} 헬스 체크: ${isHealthy ? '✅' : '❌'} (${responseTime.toFixed(0)}ms)`
      );
    } catch (error) {
      console.error(`❌ ${state.name} 헬스 체크 실패:`, error);

      state.health.consecutiveFailures++;
      state.health.lastHealthCheck = new Date();
      state.status = 'error';
    }
  }

  /**
   * 🔄 시스템 상태 업데이트
   */
  private updateSystemState(): void {
    const engines = Array.from(this.engineStates.values());

    // 전체 통계 계산
    const totalEngines = engines.length;
    const activeEngines = engines.filter(e => e.status === 'active').length;
    const errorEngines = engines.filter(e => e.status === 'error').length;

    // 시스템 전체 상태 결정
    let overallStatus: 'healthy' | 'degraded' | 'critical' | 'maintenance' =
      'healthy';

    if (errorEngines > 0) {
      if (errorEngines === totalEngines) {
        overallStatus = 'critical';
      } else if (errorEngines / totalEngines > 0.5) {
        overallStatus = 'degraded';
      }
    }

    if (activeEngines === 0) {
      overallStatus = 'critical';
    }

    // 성능 메트릭 계산
    const totalResponseTime = engines.reduce(
      (sum, e) => sum + e.health.responseTime,
      0
    );
    const averageResponseTime =
      totalEngines > 0 ? totalResponseTime / totalEngines : 0;

    const totalRequests = engines.reduce(
      (sum, e) => sum + e.performance.totalRequests,
      0
    );
    const successfulRequests = engines.reduce(
      (sum, e) => sum + e.performance.successfulRequests,
      0
    );
    const overallSuccessRate =
      totalRequests > 0 ? successfulRequests / totalRequests : 0;

    const totalMemoryUsage = engines.reduce(
      (sum, e) => sum + (e.performance.memoryUsage || 0),
      0
    );
    const systemThroughput = engines.reduce(
      (sum, e) => sum + e.performance.throughput,
      0
    );

    // 상태 업데이트
    this.systemState = {
      overall: {
        status: overallStatus,
        totalEngines,
        activeEngines,
        errorEngines,
        lastUpdate: new Date(),
      },
      engines,
      performance: {
        systemThroughput,
        averageResponseTime,
        overallSuccessRate,
        totalMemoryUsage,
      },
      alerts: {
        active: this.getActiveAlertsCount(),
        recent: this.getRecentAlerts(),
      },
    };
  }

  /**
   * 🚨 헬스 알림 처리
   */
  private async processHealthAlerts(): Promise<void> {
    const engines = Array.from(this.engineStates.values());

    for (const engine of engines) {
      // 엔진 장애 알림
      if (
        engine.status === 'error' &&
        engine.health.consecutiveFailures ===
          this.healthCheckConfig.maxConsecutiveFailures
      ) {
        await unifiedNotificationService.sendAIAlert(
          `${engine.name} 엔진 장애`,
          `연속 ${engine.health.consecutiveFailures}회 헬스 체크 실패`,
          engine.name,
          'critical'
        );
      }

      // 성능 저하 알림
      if (
        engine.health.responseTime >
        this.healthCheckConfig.alertThresholds.responseTimeMs
      ) {
        await unifiedNotificationService.sendAIAlert(
          `${engine.name} 성능 저하`,
          `응답 시간 ${engine.health.responseTime.toFixed(0)}ms 초과`,
          engine.name,
          'warning'
        );
      }

      // 메모리 사용량 알림
      if (
        engine.performance.memoryUsage &&
        engine.performance.memoryUsage >
          this.healthCheckConfig.alertThresholds.memoryUsageMB
      ) {
        await unifiedNotificationService.sendAIAlert(
          `${engine.name} 메모리 사용량 초과`,
          `메모리 사용량 ${engine.performance.memoryUsage}MB`,
          engine.name,
          'warning'
        );
      }

      // 복구 알림
      if (
        engine.status === 'active' &&
        engine.health.consecutiveFailures === 0
      ) {
        const previousState = this.engineStates.get(engine.id);
        if (previousState && previousState.status === 'error') {
          await unifiedNotificationService.sendAIAlert(
            `${engine.name} 엔진 복구`,
            '정상 상태로 복구되었습니다.',
            engine.name,
            'info'
          );
          this.stats.totalRecoveries++;
        }
      }
    }

    // 시스템 전체 상태 변경 알림
    const currentStatus = this.systemState.overall.status;
    if (currentStatus === 'critical') {
      await unifiedNotificationService.sendSystemAlert(
        'AI 시스템 위험',
        `${this.systemState.overall.errorEngines}개 엔진에서 장애 발생`,
        'critical'
      );
    } else if (currentStatus === 'degraded') {
      await unifiedNotificationService.sendSystemAlert(
        'AI 시스템 성능 저하',
        `일부 엔진에서 문제가 감지되었습니다.`,
        'warning'
      );
    }
  }

  /**
   * 🔧 초기화 메서드들
   */
  private initializeEngineStates(): void {
    // Master AI Engine
    this.engineStates.set('master', {
      id: 'master',
      name: 'Master AI Engine',
      type: 'master',
      status: 'initializing',
      health: {
        healthy: false,
        responseTime: 0,
        errorRate: 0,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
      },
      performance: {
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        throughput: 0,
      },
      capabilities: ['integration', 'routing', 'fallback', 'logging'],
      version: '1.0.0',
      uptime: 0,
    });

    // Unified AI Engine
    this.engineStates.set('unified', {
      id: 'unified',
      name: 'Unified AI Engine',
      type: 'unified',
      status: 'initializing',
      health: {
        healthy: false,
        responseTime: 0,
        errorRate: 0,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
      },
      performance: {
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        throughput: 0,
      },
      capabilities: ['mcp', 'google-ai', 'rag', 'context-management'],
      version: '1.0.0',
      uptime: 0,
    });

    // OpenSource Engines
    this.engineStates.set('opensource', {
      id: 'opensource',
      name: 'OpenSource Engines',
      type: 'opensource',
      status: 'initializing',
      health: {
        healthy: false,
        responseTime: 0,
        errorRate: 0,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
      },
      performance: {
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        throughput: 0,
        memoryUsage: 0,
      },
      capabilities: [
        'anomaly',
        'prediction',
        'autoscaling',
        'korean-nlp',
        'enhanced-search',
      ],
      version: '1.0.0',
      uptime: 0,
    });
  }

  private initializeSystemState(): AISystemState {
    return {
      overall: {
        status: 'maintenance',
        totalEngines: 0,
        activeEngines: 0,
        errorEngines: 0,
        lastUpdate: new Date(),
      },
      engines: [],
      performance: {
        systemThroughput: 0,
        averageResponseTime: 0,
        overallSuccessRate: 0,
        totalMemoryUsage: 0,
      },
      alerts: {
        active: 0,
        recent: [],
      },
    };
  }

  private loadDefaultConfig(): HealthCheckConfig {
    return {
      intervalMs: 30000, // 30초마다 헬스 체크
      timeoutMs: 5000, // 5초 타임아웃
      maxConsecutiveFailures: 3, // 3회 연속 실패 시 에러 상태
      enableAutoRecovery: true,
      alertThresholds: {
        responseTimeMs: 2000, // 2초 초과 시 경고
        errorRate: 0.1, // 10% 초과 시 경고
        memoryUsageMB: 100, // 100MB 초과 시 경고
      },
    };
  }

  /**
   * 📊 공개 API 메서드들
   */

  /**
   * 🔍 시스템 상태 조회
   */
  getSystemState(): AISystemState {
    return { ...this.systemState };
  }

  /**
   * 🔍 특정 엔진 상태 조회
   */
  getEngineState(engineId: string): AIEngineState | null {
    return this.engineStates.get(engineId) || null;
  }

  /**
   * 🔍 모든 엔진 상태 조회
   */
  getAllEngineStates(): AIEngineState[] {
    return Array.from(this.engineStates.values());
  }

  /**
   * ⚙️ 설정 업데이트
   */
  updateConfig(newConfig: Partial<HealthCheckConfig>): void {
    this.healthCheckConfig = { ...this.healthCheckConfig, ...newConfig };
    console.log('⚙️ AI 상태 관리 설정 업데이트:', newConfig);
  }

  /**
   * 🔄 특정 엔진 재시작
   */
  async restartEngine(engineId: string): Promise<boolean> {
    const state = this.engineStates.get(engineId);
    if (!state) {
      console.error(`❌ 엔진 '${engineId}'를 찾을 수 없습니다.`);
      return false;
    }

    console.log(`🔄 ${state.name} 엔진 재시작 중...`);

    try {
      state.status = 'maintenance';

      // 마스터 엔진 재시작
      if (
        this.masterEngine &&
        'restart' in this.masterEngine &&
        typeof (this.masterEngine as any).restart === 'function'
      ) {
        await (this.masterEngine as any).restart();
      }

      // 통합 엔진 재시작
      if (
        this.unifiedEngine &&
        'restart' in this.unifiedEngine &&
        typeof (this.unifiedEngine as any).restart === 'function'
      ) {
        await (this.unifiedEngine as any).restart();
      }

      // 오픈소스 엔진 재시작
      if (
        this.openSourceEngines &&
        'restart' in this.openSourceEngines &&
        typeof (this.openSourceEngines as any).restart === 'function'
      ) {
        await (this.openSourceEngines as any).restart();
      }

      // 상태 초기화
      state.health.consecutiveFailures = 0;
      state.status = 'initializing';

      // 즉시 헬스 체크
      await this.checkEngineHealth(engineId);

      await unifiedNotificationService.sendAIAlert(
        `${state.name} 재시작 완료`,
        '엔진이 성공적으로 재시작되었습니다.',
        state.name,
        'info'
      );

      console.log(`✅ ${state.name} 엔진 재시작 완료`);
      return true;
    } catch (error) {
      console.error(`❌ ${state.name} 엔진 재시작 실패:`, error);
      state.status = 'error';

      await unifiedNotificationService.sendAIAlert(
        `${state.name} 재시작 실패`,
        `재시작 중 오류가 발생했습니다: ${error}`,
        state.name,
        'critical'
      );

      return false;
    }
  }

  /**
   * 📈 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      monitoringStatus: this.isMonitoring,
      config: this.healthCheckConfig,
      systemUptime: Date.now() - this.stats.uptime,
    };
  }

  /**
   * 🚨 활성 알림 수 조회
   */
  private getActiveAlertsCount(): number {
    return this.engineStates.size; // 임시 구현
  }

  /**
   * 📜 최근 알림 조회
   */
  private getRecentAlerts(): string[] {
    return []; // 임시 구현
  }

  /**
   * 🔄 전체 시스템 재시작
   */
  async restartSystem(): Promise<void> {
    console.log('🔄 AI 시스템 전체 재시작 중...');

    // 모니터링 중지
    await this.stopMonitoring();

    // 모든 엔진 재시작
    const engineIds = Array.from(this.engineStates.keys());
    const restartPromises = engineIds.map(id => this.restartEngine(id));

    await Promise.allSettled(restartPromises);

    // 모니터링 재시작
    await this.startMonitoring();

    await unifiedNotificationService.sendSystemAlert(
      'AI 시스템 재시작 완료',
      '전체 AI 시스템이 재시작되었습니다.',
      'info'
    );

    console.log('✅ AI 시스템 전체 재시작 완료');
  }

  /**
   * 🧹 정리 및 종료
   */
  async shutdown(): Promise<void> {
    console.log('🛑 AI 상태 관리자 종료 중...');

    await this.stopMonitoring();
    this.engineStates.clear();

    console.log('✅ AI 상태 관리자 종료 완료');
  }
}

// 싱글톤 인스턴스 export
export const aiStateManager = AIStateManager.getInstance();

// 기본 export
export default aiStateManager;
