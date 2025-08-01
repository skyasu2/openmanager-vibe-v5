/**
 * MCP 서버 메트릭 수집기
 * 15초 간격으로 10개 MCP 서버의 상태를 실시간 모니터링
 */

import { EventEmitter } from 'events';
import { MCP_SERVERS, MONITORING_CONFIG, SERVER_GROUPS } from './config';
import type {
  MCPServerMetrics,
  HealthCheckResult,
  MCPServerConnection,
  MonitoringEvent,
  SystemHealthSummary,
  CircuitBreakerStats,
  MCPServerName,
  ServerStatus,
  CircuitBreakerState,
} from './types';

/**
 * Circuit Breaker 클래스
 */
class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private nextRetryTime?: number;

  constructor(
    private readonly serverId: MCPServerName,
    private readonly config = MONITORING_CONFIG.global.circuitBreakerConfig
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < (this.nextRetryTime || 0)) {
        throw new Error(`Circuit breaker is OPEN for ${this.serverId}`);
      }
      this.state = 'half-open';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;

    if (this.state === 'half-open') {
      if (this.successCount >= this.config.halfOpenMaxCalls) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.state === 'closed' &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.state = 'open';
      this.nextRetryTime = Date.now() + this.config.resetTimeout;
    } else if (this.state === 'half-open') {
      this.state = 'open';
      this.nextRetryTime = Date.now() + this.config.resetTimeout;
      this.successCount = 0;
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      serverId: this.serverId,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextRetryTime: this.nextRetryTime,
      stateChanges: [], // 실제 구현에서는 상태 변경 이력 추적
    };
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextRetryTime = undefined;
  }
}

/**
 * MCP 메트릭 수집기
 */
export class MCPMetricsCollector extends EventEmitter {
  private readonly connections = new Map<MCPServerName, MCPServerConnection>();
  private readonly circuitBreakers = new Map<MCPServerName, CircuitBreaker>();
  private readonly metrics = new Map<MCPServerName, MCPServerMetrics[]>();
  private readonly healthCheckTimers = new Map<MCPServerName, NodeJS.Timeout>();

  private isRunning = false;
  private startTime = 0;

  constructor() {
    super();
    this.initializeServers();
  }

  /**
   * 서버 초기화
   */
  private initializeServers(): void {
    Object.keys(MCP_SERVERS).forEach((serverId) => {
      const serverName = serverId as MCPServerName;

      // 연결 상태 초기화
      this.connections.set(serverName, {
        serverId: serverName,
        status: 'unknown',
        lastConnected: 0,
        connectionAttempts: 0,
        consecutiveFailures: 0,
        circuitBreaker: {
          state: 'closed',
        },
      });

      // Circuit Breaker 초기화
      this.circuitBreakers.set(serverName, new CircuitBreaker(serverName));

      // 메트릭 배열 초기화
      this.metrics.set(serverName, []);
    });
  }

  /**
   * 모니터링 시작
   */
  start(): void {
    if (this.isRunning) {
      console.warn('MCP Metrics Collector is already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();

    console.log('🚀 MCP 서버 모니터링 시작');

    // 모든 서버에 대해 헬스체크 타이머 설정
    Object.keys(MCP_SERVERS).forEach((serverId) => {
      const serverName = serverId as MCPServerName;
      this.startHealthCheck(serverName);
    });

    this.emit('started');
  }

  /**
   * 모니터링 중지
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // 모든 타이머 정리
    this.healthCheckTimers.forEach((timer) => {
      clearInterval(timer);
    });
    this.healthCheckTimers.clear();

    console.log('⏹️ MCP 서버 모니터링 중지');
    this.emit('stopped');
  }

  /**
   * 개별 서버 헬스체크 시작
   */
  private startHealthCheck(serverId: MCPServerName): void {
    const config = MCP_SERVERS[serverId];
    const interval = config.healthCheck.interval;

    // 즉시 첫 번째 체크 실행
    this.performHealthCheck(serverId);

    // 주기적 헬스체크 설정
    const timer = setInterval(() => {
      if (this.isRunning) {
        this.performHealthCheck(serverId);
      }
    }, interval);

    this.healthCheckTimers.set(serverId, timer);
  }

  /**
   * 헬스체크 수행
   */
  private async performHealthCheck(serverId: MCPServerName): Promise<void> {
    const config = MCP_SERVERS[serverId];
    const circuitBreaker = this.circuitBreakers.get(serverId)!;
    const connection = this.connections.get(serverId)!;

    try {
      const result = await circuitBreaker.execute(async () => {
        return await this.checkServerHealth(serverId);
      });

      // 성공 처리
      this.handleHealthCheckSuccess(serverId, result);
    } catch (error) {
      // 실패 처리
      this.handleHealthCheckFailure(serverId, error as Error);
    }
  }

  /**
   * 실제 서버 헬스체크 로직
   */
  private async checkServerHealth(
    serverId: MCPServerName
  ): Promise<HealthCheckResult> {
    const config = MCP_SERVERS[serverId];
    const startTime = Date.now();

    try {
      // Claude CLI를 통한 MCP 서버 상태 확인 시뮬레이션
      // 실제로는 MCP 프로토콜을 통해 서버 상태를 확인해야 함
      const isHealthy = await this.simulateHealthCheck(serverId);
      const responseTime = Date.now() - startTime;

      return {
        serverId,
        timestamp: Date.now(),
        success: isHealthy,
        responseTime,
        metadata: {
          version: 'latest',
          capabilities: ['read', 'write', 'tools'],
        },
      };
    } catch (error) {
      return {
        serverId,
        timestamp: Date.now(),
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 헬스체크 시뮬레이션 (실제 구현에서는 MCP 클라이언트 사용)
   */
  private async simulateHealthCheck(serverId: MCPServerName): Promise<boolean> {
    const config = MCP_SERVERS[serverId];

    // 의도적 지연 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    // Serena 서버는 현재 연결 실패 상태로 시뮬레이션
    if (serverId === 'serena') {
      return Math.random() > 0.8; // 20% 성공률
    }

    // 다른 서버들은 높은 성공률로 시뮬레이션
    return Math.random() > 0.05; // 95% 성공률
  }

  /**
   * 헬스체크 성공 처리
   */
  private handleHealthCheckSuccess(
    serverId: MCPServerName,
    result: HealthCheckResult
  ): void {
    const connection = this.connections.get(serverId)!;
    const circuitBreakerStats = this.circuitBreakers.get(serverId)!.getStats();

    // 연결 상태 업데이트
    connection.status = 'healthy';
    connection.lastConnected = result.timestamp;
    connection.consecutiveFailures = 0;
    connection.circuitBreaker = {
      state: circuitBreakerStats.state,
    };

    // 메트릭 생성
    const metrics: MCPServerMetrics = {
      serverId,
      timestamp: result.timestamp,
      status: 'healthy',
      responseTime: result.responseTime,
      successRate: this.calculateSuccessRate(serverId),
      errorRate: this.calculateErrorRate(serverId),
      requestCount: this.getRequestCount(serverId),
      errorCount: this.getErrorCount(serverId),
      uptime: Date.now() - this.startTime,
      circuitBreakerState: circuitBreakerStats.state,
    };

    this.storeMetrics(serverId, metrics);
    this.emit('metrics', metrics);

    // 복구 이벤트 생성 (이전에 실패했던 경우)
    if (connection.connectionAttempts > 0) {
      const event: MonitoringEvent = {
        id: `recovery-${serverId}-${Date.now()}`,
        serverId,
        type: 'recovery',
        severity: 'info',
        message: `Server ${serverId} recovered after ${connection.connectionAttempts} failed attempts`,
        timestamp: Date.now(),
        metadata: { responseTime: result.responseTime },
      };

      this.emit('event', event);
      connection.connectionAttempts = 0;
    }
  }

  /**
   * 헬스체크 실패 처리
   */
  private handleHealthCheckFailure(
    serverId: MCPServerName,
    error: Error
  ): void {
    const connection = this.connections.get(serverId)!;
    const config = MCP_SERVERS[serverId];
    const circuitBreakerStats = this.circuitBreakers.get(serverId)!.getStats();

    // 연결 상태 업데이트
    connection.connectionAttempts++;
    connection.consecutiveFailures++;
    connection.circuitBreaker = {
      state: circuitBreakerStats.state,
      lastFailure: circuitBreakerStats.lastFailureTime,
      nextRetry: circuitBreakerStats.nextRetryTime,
    };

    // 상태 결정
    let status: ServerStatus = 'degraded';
    if (connection.consecutiveFailures >= config.thresholds.maxRetries) {
      status = 'unhealthy';
    }
    connection.status = status;

    // 메트릭 생성
    const metrics: MCPServerMetrics = {
      serverId,
      timestamp: Date.now(),
      status,
      responseTime: 0,
      successRate: this.calculateSuccessRate(serverId),
      errorRate: this.calculateErrorRate(serverId),
      requestCount: this.getRequestCount(serverId),
      errorCount: this.getErrorCount(serverId) + 1,
      lastError: error.message,
      uptime: Date.now() - this.startTime,
      circuitBreakerState: circuitBreakerStats.state,
    };

    this.storeMetrics(serverId, metrics);
    this.emit('metrics', metrics);

    // 알림 이벤트 생성
    const severity = status === 'unhealthy' ? 'error' : 'warning';
    const event: MonitoringEvent = {
      id: `failure-${serverId}-${Date.now()}`,
      serverId,
      type: 'status_change',
      severity,
      message: `Server ${serverId} ${status}: ${error.message}`,
      timestamp: Date.now(),
      metadata: {
        consecutiveFailures: connection.consecutiveFailures,
        circuitBreakerState: circuitBreakerStats.state,
      },
    };

    this.emit('event', event);
  }

  /**
   * 메트릭 저장
   */
  private storeMetrics(
    serverId: MCPServerName,
    metrics: MCPServerMetrics
  ): void {
    const serverMetrics = this.metrics.get(serverId)!;
    serverMetrics.push(metrics);

    // 메트릭 보존 기간 적용 (최근 1시간 분량만 유지)
    const retentionTime = Date.now() - 60 * 60 * 1000;
    const filteredMetrics = serverMetrics.filter(
      (m) => m.timestamp > retentionTime
    );
    this.metrics.set(serverId, filteredMetrics);
  }

  /**
   * 성공률 계산
   */
  private calculateSuccessRate(serverId: MCPServerName): number {
    const serverMetrics = this.metrics.get(serverId) || [];
    if (serverMetrics.length === 0) return 100;

    const recentMetrics = serverMetrics.slice(-20); // 최근 20개
    const successCount = recentMetrics.filter(
      (m) => m.status === 'healthy'
    ).length;
    return (successCount / recentMetrics.length) * 100;
  }

  /**
   * 에러율 계산
   */
  private calculateErrorRate(serverId: MCPServerName): number {
    return 100 - this.calculateSuccessRate(serverId);
  }

  /**
   * 요청 수 조회
   */
  private getRequestCount(serverId: MCPServerName): number {
    const serverMetrics = this.metrics.get(serverId) || [];
    return serverMetrics.length;
  }

  /**
   * 에러 수 조회
   */
  private getErrorCount(serverId: MCPServerName): number {
    const serverMetrics = this.metrics.get(serverId) || [];
    return serverMetrics.filter((m) => m.status !== 'healthy').length;
  }

  /**
   * 시스템 상태 요약 생성
   */
  getSystemHealthSummary(): SystemHealthSummary {
    const allConnections = Array.from(this.connections.values());
    const totalServers = allConnections.length;
    const healthyServers = allConnections.filter(
      (c) => c.status === 'healthy'
    ).length;
    const degradedServers = allConnections.filter(
      (c) => c.status === 'degraded'
    ).length;
    const unhealthyServers = allConnections.filter(
      (c) => c.status === 'unhealthy'
    ).length;

    // 평균 응답시간 계산
    const recentMetrics = Array.from(this.metrics.values())
      .flat()
      .filter((m) => m.timestamp > Date.now() - 5 * 60 * 1000) // 최근 5분
      .filter((m) => m.responseTime > 0);

    const averageResponseTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
          recentMetrics.length
        : 0;

    // 시스템 전체 상태 결정
    let systemStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyServers > 0) {
      systemStatus = 'unhealthy';
    } else if (degradedServers > 0) {
      systemStatus = 'degraded';
    }

    // 중요한 이슈들 수집
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    allConnections.forEach((connection) => {
      if (connection.status === 'unhealthy') {
        const serverConfig = MCP_SERVERS[connection.serverId];
        if (serverConfig.priority === 'critical') {
          criticalIssues.push(`Critical server ${connection.serverId} is down`);
        } else {
          warnings.push(`Server ${connection.serverId} is unhealthy`);
        }
      } else if (connection.status === 'degraded') {
        warnings.push(`Server ${connection.serverId} is degraded`);
      }
    });

    return {
      timestamp: Date.now(),
      totalServers,
      healthyServers,
      degradedServers,
      unhealthyServers,
      averageResponseTime,
      systemStatus,
      criticalIssues,
      warnings,
    };
  }

  /**
   * 서버별 최신 메트릭 조회
   */
  getLatestMetrics(): MCPServerMetrics[] {
    return Array.from(this.metrics.entries()).map(([serverId, metrics]) => {
      const latest = metrics[metrics.length - 1];
      if (!latest) {
        // 메트릭이 없는 경우 기본값 반환
        return {
          serverId,
          timestamp: Date.now(),
          status: 'unknown',
          responseTime: 0,
          successRate: 0,
          errorRate: 0,
          requestCount: 0,
          errorCount: 0,
          uptime: 0,
          circuitBreakerState: 'closed',
        };
      }
      return latest;
    });
  }

  /**
   * Circuit Breaker 통계 조회
   */
  getCircuitBreakerStats(): CircuitBreakerStats[] {
    return Array.from(this.circuitBreakers.values()).map((cb) => cb.getStats());
  }

  /**
   * 서버 재시작
   */
  async restartServer(serverId: MCPServerName): Promise<boolean> {
    console.log(`🔄 Restarting MCP server: ${serverId}`);

    // Circuit Breaker 리셋
    this.circuitBreakers.get(serverId)?.reset();

    // 연결 상태 리셋
    const connection = this.connections.get(serverId)!;
    connection.consecutiveFailures = 0;
    connection.connectionAttempts = 0;
    connection.status = 'unknown';

    // 즉시 헬스체크 수행
    this.performHealthCheck(serverId);

    return true;
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.connections.clear();
    this.circuitBreakers.clear();
    this.metrics.clear();
  }
}
