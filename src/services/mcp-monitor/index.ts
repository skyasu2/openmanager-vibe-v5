/**
 * MCP 서버 모니터링 시스템 메인 진입점
 * 10개 MCP 서버의 실시간 상태 추적 및 관리
 */

import { MCPMetricsCollector } from './collector';
import { MCPHealthChecker } from './health-checker';
import { MCP_SERVERS } from './config';

export { MCPMetricsCollector, MCPHealthChecker };
export {
  MCP_SERVERS,
  MONITORING_CONFIG,
  SERVER_GROUPS,
  ENV_DEPENDENCIES,
} from './config';

export type {
  MCPServerConfig,
  MCPMonitoringConfig,
  MCPServerName,
  ServerPriority,
  ServerStatus,
  CircuitBreakerState,
} from './config';

export type {
  MCPServerMetrics,
  HealthCheckResult,
  MCPServerConnection,
  MonitoringEvent,
  SystemHealthSummary,
  PerformanceTrend,
  AlertRule,
  CircuitBreakerStats,
  RecoveryAction,
  MonitoringDashboard,
  MetricsCollectorOptions,
  MonitoringConfiguration,
  MonitoringStream,
  BenchmarkResult,
} from './types';

/**
 * MCP 모니터링 시스템 통합 클래스
 */
export class MCPMonitoringSystem {
  private collector: MCPMetricsCollector;
  private healthChecker: MCPHealthChecker;
  private isInitialized = false;

  constructor() {
    this.collector = new MCPMetricsCollector();
    this.healthChecker = new MCPHealthChecker();
    this.setupEventHandlers();
  }

  /**
   * 시스템 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('MCP Monitoring System is already initialized');
      return;
    }

    console.log('🚀 Initializing MCP Monitoring System...');

    try {
      // 초기 헬스체크 수행
      const initialHealthCheck =
        await this.healthChecker.performSystemHealthCheck();
      console.log(
        `📊 Initial health check: ${initialHealthCheck.summary.healthyCount}/${initialHealthCheck.summary.totalServers} servers healthy`
      );

      if (initialHealthCheck.summary.issues.length > 0) {
        console.warn('⚠️ Initial issues detected:');
        initialHealthCheck.summary.issues.forEach((issue) =>
          console.warn(`  - ${issue}`)
        );
      }

      // 메트릭 수집기 시작
      this.collector.start();

      this.isInitialized = true;
      console.log('✅ MCP Monitoring System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MCP Monitoring System:', error);
      throw error;
    }
  }

  /**
   * 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    // 메트릭 이벤트 처리
    this.collector.on('metrics', (metrics) => {
      this.handleMetricsEvent(metrics);
    });

    // 모니터링 이벤트 처리
    this.collector.on('event', (event) => {
      this.handleMonitoringEvent(event);
    });

    // 시스템 시작/중지 이벤트
    this.collector.on('started', () => {
      console.log('📈 MCP metrics collection started');
    });

    this.collector.on('stopped', () => {
      console.log('📉 MCP metrics collection stopped');
    });
  }

  /**
   * 메트릭 이벤트 처리
   */
  private handleMetricsEvent(
    metrics: import('./types').MCPServerMetrics
  ): void {
    // 성능 임계값 검사
    const config = MCP_SERVERS[metrics.serverId];
    if (metrics.responseTime > config.thresholds.responseTime) {
      console.warn(
        `⚠️ High latency detected for ${metrics.serverId}: ${metrics.responseTime}ms`
      );
    }

    // 에러율 검사
    if (metrics.errorRate > config.thresholds.errorRate) {
      console.warn(
        `⚠️ High error rate detected for ${metrics.serverId}: ${metrics.errorRate}%`
      );
    }

    // Circuit Breaker 상태 변경 로깅
    if (metrics.circuitBreakerState === 'open') {
      console.error(`🔴 Circuit breaker OPEN for ${metrics.serverId}`);
    } else if (metrics.circuitBreakerState === 'half-open') {
      console.warn(`🟡 Circuit breaker HALF-OPEN for ${metrics.serverId}`);
    }
  }

  /**
   * 모니터링 이벤트 처리
   */
  private handleMonitoringEvent(
    event: import('./types').MonitoringEvent
  ): void {
    const timestamp = new Date(event.timestamp).toISOString();

    switch (event.severity) {
      case 'critical':
        console.error(`🔴 [${timestamp}] CRITICAL: ${event.message}`);
        break;
      case 'error':
        console.error(`❌ [${timestamp}] ERROR: ${event.message}`);
        break;
      case 'warning':
        console.warn(`⚠️ [${timestamp}] WARNING: ${event.message}`);
        break;
      case 'info':
        console.log(`ℹ️ [${timestamp}] INFO: ${event.message}`);
        break;
    }

    // 자동 복구 시도 (에러 이벤트의 경우)
    if (event.severity === 'error' && event.type === 'status_change') {
      this.attemptAutoRecovery(event.serverId);
    }
  }

  /**
   * 자동 복구 시도
   */
  private async attemptAutoRecovery(
    serverId: import('./config').MCPServerName
  ): Promise<void> {
    const config = MCP_SERVERS[serverId];

    // Critical 서버만 자동 복구 시도
    if (config.priority !== 'critical') {
      return;
    }

    console.log(`🔄 Attempting auto-recovery for critical server: ${serverId}`);

    try {
      const result = await this.healthChecker.attemptServerRestart(serverId);

      if (result.success) {
        console.log(
          `✅ Auto-recovery successful for ${serverId}: ${result.message}`
        );
      } else {
        console.error(
          `❌ Auto-recovery failed for ${serverId}: ${result.message}`
        );
      }
    } catch (error) {
      console.error(`❌ Auto-recovery error for ${serverId}:`, error);
    }
  }

  /**
   * 시스템 상태 조회
   */
  getSystemStatus(): import('./types').SystemHealthSummary {
    return this.collector.getSystemHealthSummary();
  }

  /**
   * 최신 메트릭 조회
   */
  getLatestMetrics(): import('./types').MCPServerMetrics[] {
    return this.collector.getLatestMetrics();
  }

  /**
   * Circuit Breaker 통계 조회
   */
  getCircuitBreakerStats(): import('./types').CircuitBreakerStats[] {
    return this.collector.getCircuitBreakerStats();
  }

  /**
   * 개별 서버 헬스체크
   */
  async checkServerHealth(
    serverId: import('./config').MCPServerName
  ): Promise<import('./types').HealthCheckResult> {
    return await this.healthChecker.checkServer(serverId);
  }

  /**
   * 모든 서버 헬스체크
   */
  async checkAllServersHealth(): Promise<
    import('./types').HealthCheckResult[]
  > {
    return await this.healthChecker.checkAllServers();
  }

  /**
   * 서버 재시작
   */
  async restartServer(
    serverId: import('./config').MCPServerName
  ): Promise<boolean> {
    console.log(`🔄 Manual restart requested for server: ${serverId}`);

    try {
      // Health checker를 통한 재시작
      const result = await this.healthChecker.attemptServerRestart(serverId);

      if (result.success) {
        // Collector의 Circuit Breaker도 리셋
        await this.collector.restartServer(serverId);
        console.log(`✅ Server ${serverId} restarted successfully`);
        return true;
      } else {
        console.error(
          `❌ Failed to restart server ${serverId}: ${result.message}`
        );
        return false;
      }
    } catch (error) {
      console.error(`❌ Error restarting server ${serverId}:`, error);
      return false;
    }
  }

  /**
   * 모니터링 시스템 중지
   */
  stop(): void {
    console.log('⏹️ Stopping MCP Monitoring System...');
    this.collector.stop();
    this.isInitialized = false;
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    this.stop();
    this.collector.destroy();
    console.log('🗑️ MCP Monitoring System destroyed');
  }

  /**
   * 모니터링 상태 확인
   */
  isRunning(): boolean {
    return this.isInitialized;
  }
}

/**
 * 싱글톤 인스턴스 (선택적 사용)
 */
let globalMonitoringSystem: MCPMonitoringSystem | null = null;

export const getGlobalMonitoringSystem = (): MCPMonitoringSystem => {
  if (!globalMonitoringSystem) {
    globalMonitoringSystem = new MCPMonitoringSystem();
  }
  return globalMonitoringSystem;
};

export const destroyGlobalMonitoringSystem = (): void => {
  if (globalMonitoringSystem) {
    globalMonitoringSystem.destroy();
    globalMonitoringSystem = null;
  }
};
