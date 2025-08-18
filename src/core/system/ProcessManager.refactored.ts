/**
 * 🔧 통합 프로세스 관리 시스템 (리팩토링 버전)
 *
 * 순환 의존성 제거를 위해 이벤트 버스 패턴 적용
 * SystemWatchdog와의 직접 의존성을 제거하고 이벤트 기반 통신 사용
 */

import { EventEmitter } from 'events';
import { systemLogger } from '../../lib/logger';
import {
  ISystemEventBus,
  ISystemEventEmitter,
  SystemEventType,
  ProcessEventPayload,
  SystemStatusPayload,
} from '../interfaces/SystemEventBus';

export interface ProcessConfig {
  id: string;
  name: string;
  startCommand: () => Promise<void>;
  stopCommand: () => Promise<void>;
  healthCheck: () => Promise<boolean>;
  criticalLevel: 'high' | 'medium' | 'low';
  autoRestart: boolean;
  maxRestarts: number;
  dependencies?: string[]; // 의존하는 프로세스들
  startupDelay?: number; // 시작 후 대기 시간 (ms)
}

export interface ProcessState {
  id: string;
  status:
    | 'stopped'
    | 'starting'
    | 'running'
    | 'stopping'
    | 'error'
    | 'restarting';
  startedAt?: Date;
  stoppedAt?: Date;
  lastHealthCheck?: Date;
  restartCount: number;
  errors: Array<{ timestamp: Date; message: string; error: Error | unknown }>;
  uptime: number;
  healthScore: number; // 0-100
}

export interface SystemMetrics {
  totalProcesses: number;
  runningProcesses: number;
  healthyProcesses: number;
  systemUptime: number;
  memoryUsage: number;
  averageHealthScore: number;
  totalRestarts: number;
  lastStabilityCheck: Date;
}

/**
 * 리팩토링된 ProcessManager
 * 이벤트 버스를 통해 SystemWatchdog와 통신
 */
export class ProcessManager
  extends EventEmitter
  implements ISystemEventEmitter
{
  private processes = new Map<string, ProcessConfig>();
  private states = new Map<string, ProcessState>();
  private healthCheckInterval?: NodeJS.Timeout;
  private eventBus?: ISystemEventBus; // SystemWatchdog 대신 이벤트 버스 사용
  private isSystemRunning = false;
  private systemStartTime?: Date;
  private stabilityTimeout?: NodeJS.Timeout;
  private readonly healthCheckIntervalMs =
    process.env.NODE_ENV === 'development' ? 60000 : 30000; // 개발: 60초, 운영: 30초
  private readonly stabilityTimeoutMs = 30 * 60 * 1000; // 30분

  constructor(eventBus?: ISystemEventBus) {
    super();
    if (eventBus) {
      this.setEventBus(eventBus);
    }
    this.setupGracefulShutdown();
  }

  /**
   * 이벤트 버스 설정
   */
  setEventBus(eventBus: ISystemEventBus): void {
    this.eventBus = eventBus;
    // SystemWatchdog 시작 이벤트 발행
    this.eventBus.emit({
      type: SystemEventType.SYSTEM_HEALTHY,
      timestamp: Date.now(),
      source: 'ProcessManager',
      payload: {
        status: 'healthy',
        services: [],
        metrics: {
          uptime: 0,
          totalProcesses: this.processes.size,
          activeConnections: 0,
        },
      },
    });
  }

  /**
   * 이벤트 버스 반환
   */
  getEventBus(): ISystemEventBus {
    if (!this.eventBus) {
      throw new Error('Event bus not set');
    }
    return this.eventBus;
  }

  /**
   * 프로세스 등록
   */
  registerProcess(config: ProcessConfig): void {
    this.processes.set(config.id, config);
    this.states.set(config.id, {
      id: config.id,
      status: 'stopped',
      restartCount: 0,
      errors: [],
      uptime: 0,
      healthScore: 100,
    });

    systemLogger.system(`✅ 프로세스 등록: ${config.name} (${config.id})`);
    this.emit('process:registered', { processId: config.id, config });
  }

  /**
   * 🚀 시스템 전체 시작 - 30분 모니터링 포함
   */
  async startSystem(options?: {
    mode?: 'fast' | 'full';
    skipStabilityCheck?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.isSystemRunning) {
      return {
        success: false,
        message: '시스템이 이미 실행 중입니다',
        errors: ['ALREADY_RUNNING'],
        warnings: [],
      };
    }

    try {
      systemLogger.system('🚀 통합 프로세스 관리 시스템 시작...');
      this.isSystemRunning = true;
      this.systemStartTime = new Date();

      // 1단계: 의존성 순서로 프로세스 시작
      const startOrder = this.calculateStartupOrder();
      systemLogger.system(`📋 시작 순서: ${startOrder.join(' → ')}`);

      for (const processId of startOrder) {
        const success = await this.startProcess(processId);
        if (!success) {
          const config = this.processes.get(processId);
          const errorMsg = `${config?.name || processId} 시작 실패`;
          errors.push(errorMsg);
          systemLogger.error(errorMsg);

          // Critical 프로세스 실패 시 전체 시스템 롤백
          if (config?.criticalLevel === 'high') {
            await this.emergencyShutdown();
            return {
              success: false,
              message: `Critical 프로세스 ${config.name} 실패로 시스템 시작 중단`,
              errors,
              warnings,
            };
          } else {
            warnings.push(`Non-critical 프로세스 ${config?.name} 시작 실패`);
          }
        }

        // 프로세스 간 안정화 대기
        const config = this.processes.get(processId);
        const delay = config?.startupDelay || 1000;
        await this.delay(delay);
      }

      // 2단계: 헬스체크 시스템 시작
      this.startHealthChecks();

      // 3단계: 이벤트 버스를 통해 Watchdog 시작 요청
      if (this.eventBus) {
        this.eventBus.emit({
          type: SystemEventType.SYSTEM_HEALTHY,
          timestamp: Date.now(),
          source: 'ProcessManager',
          payload: {
            status: 'healthy',
            services: this.getServiceStatuses(),
            metrics: {
              uptime: 0,
              totalProcesses: this.processes.size,
              activeConnections: 0,
            },
          },
        });
      }

      // 4단계: 30분 안정성 모니터링 설정
      if (!options?.skipStabilityCheck) {
        this.setupStabilityMonitoring();
      }

      const runningCount = Array.from(this.states.values()).filter(
        (s: ProcessState) => s.status === 'running'
      ).length;

      systemLogger.system(
        `✅ 시스템 시작 완료 (${runningCount}/${this.processes.size} 프로세스 실행 중)`
      );
      this.emit('system:started', {
        runningCount,
        totalCount: this.processes.size,
      });

      return {
        success: true,
        message: `시스템 시작 완료 (${runningCount}/${this.processes.size} 프로세스)`,
        errors,
        warnings,
      };
    } catch (error) {
      systemLogger.error('시스템 시작 실패:', error);
      await this.emergencyShutdown();

      return {
        success: false,
        message: '시스템 시작 중 치명적 오류 발생',
        errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
        warnings,
      };
    }
  }

  /**
   * 개별 프로세스 시작
   */
  private async startProcess(processId: string): Promise<boolean> {
    const config = this.processes.get(processId);
    const state = this.states.get(processId);

    if (!config || !state) {
      systemLogger.warn(`프로세스 설정을 찾을 수 없음: ${processId}`);
      return false;
    }

    if (state.status === 'running') {
      systemLogger.system(`프로세스 이미 실행 중: ${config.name}`);
      return true;
    }

    try {
      systemLogger.system(`🔄 ${config.name} 시작 중...`);
      state.status = 'starting';
      state.startedAt = new Date();

      // 의존성 프로세스 확인
      if (config.dependencies) {
        for (const depId of config.dependencies) {
          const depState = this.states.get(depId);
          if (!depState || depState.status !== 'running') {
            throw new Error(`의존성 프로세스 ${depId}가 실행되지 않음`);
          }
        }
      }

      // 프로세스 시작 명령 실행
      await config.startCommand();

      state.status = 'running';
      state.errors = []; // 성공 시 오류 기록 초기화

      // 초기 헬스체크 (3회 시도)
      let isHealthy = false;
      for (let i = 0; i < 3; i++) {
        try {
          isHealthy = await config.healthCheck();
          if (isHealthy) break;
          await this.delay(1000); // 1초 대기 후 재시도
        } catch (error) {
          systemLogger.warn(
            `${config.name} 헬스체크 시도 ${i + 1} 실패:`,
            error
          );
        }
      }

      if (!isHealthy) {
        throw new Error('초기 헬스체크 실패');
      }

      state.healthScore = 100;
      state.lastHealthCheck = new Date();

      systemLogger.system(`✅ ${config.name} 시작 완료`);

      // 이벤트 버스를 통해 프로세스 시작 알림
      if (this.eventBus) {
        this.eventBus.emit<ProcessEventPayload>({
          type: SystemEventType.PROCESS_STARTED,
          timestamp: Date.now(),
          source: 'ProcessManager',
          payload: {
            processId: config.id,
            processName: config.name,
            status: 'running',
          },
        });
      }

      this.emit('process:started', { processId, config, state });
      return true;
    } catch (error) {
      state.status = 'error';
      state.stoppedAt = new Date();
      const errorMsg =
        error instanceof Error ? error.message : '알 수 없는 오류';

      state.errors.push({
        timestamp: new Date(),
        message: errorMsg,
        error,
      });

      systemLogger.error(`${config.name} 시작 실패:`, error);

      // 이벤트 버스를 통해 프로세스 오류 알림
      if (this.eventBus) {
        this.eventBus.emit<ProcessEventPayload>({
          type: SystemEventType.PROCESS_ERROR,
          timestamp: Date.now(),
          source: 'ProcessManager',
          payload: {
            processId: config.id,
            processName: config.name,
            status: 'error',
            error: error instanceof Error ? error : new Error(errorMsg),
          },
        });
      }

      this.emit('process:error', { processId, error: errorMsg });

      // Auto-restart 시도
      if (config.autoRestart && state.restartCount < config.maxRestarts) {
        await this.restartProcess(processId);
      }

      return false;
    }
  }

  /**
   * 헬스체크 수행
   */
  private async performHealthCheck(processId: string): Promise<void> {
    const config = this.processes.get(processId);
    const state = this.states.get(processId);

    if (!config || !state || state.status !== 'running') {
      return;
    }

    try {
      const isHealthy = await config.healthCheck();
      state.lastHealthCheck = new Date();

      if (isHealthy) {
        state.healthScore = Math.min(100, state.healthScore + 5);
      } else {
        state.healthScore = Math.max(0, state.healthScore - 20);

        if (state.healthScore < 50) {
          systemLogger.warn(
            `⚠️ ${config.name} 건강도 낮음: ${state.healthScore}%`
          );

          // 이벤트 버스를 통해 헬스체크 결과 알림
          if (this.eventBus) {
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();

            this.eventBus.emit<ProcessEventPayload>({
              type: SystemEventType.PROCESS_HEALTH_CHECK,
              timestamp: Date.now(),
              source: 'ProcessManager',
              payload: {
                processId: config.id,
                processName: config.name,
                status: 'running',
                resources: {
                  cpu: cpuUsage.user / 1000000, // microseconds to seconds
                  memory: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
                },
              },
            });
          }

          this.emit('process:unhealthy', {
            processId,
            healthScore: state.healthScore,
          });
        }
      }
    } catch (error) {
      state.healthScore = Math.max(0, state.healthScore - 30);
      systemLogger.error(`${config.name} 헬스체크 오류:`, error);
    }
  }

  /**
   * 시스템 정지
   */
  async stopSystem(): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!this.isSystemRunning) {
      return {
        success: false,
        message: '시스템이 실행 중이 아닙니다',
        errors: ['NOT_RUNNING'],
      };
    }

    try {
      systemLogger.system('🛑 시스템 정지 시작...');

      // 1단계: 안정성 모니터링 중지
      if (this.stabilityTimeout) {
        clearTimeout(this.stabilityTimeout);
        this.stabilityTimeout = undefined;
      }

      // 2단계: 헬스체크 중지
      this.stopHealthChecks();

      // 3단계: 이벤트 버스를 통해 시스템 정지 알림
      if (this.eventBus) {
        this.eventBus.emit<SystemStatusPayload>({
          type: SystemEventType.SYSTEM_DEGRADED,
          timestamp: Date.now(),
          source: 'ProcessManager',
          payload: {
            status: 'degraded',
            services: this.getServiceStatuses(),
            metrics: {
              uptime: this.calculateUptime(),
              totalProcesses: this.processes.size,
              activeConnections: 0,
            },
          },
        });
      }

      // 4단계: 역순으로 프로세스 정지
      const stopOrder = this.calculateStartupOrder().reverse();
      for (const processId of stopOrder) {
        const success = await this.stopProcess(processId);
        if (!success) {
          const config = this.processes.get(processId);
          errors.push(`${config?.name || processId} 정지 실패`);
        }
      }

      this.isSystemRunning = false;
      const stoppedCount = Array.from(this.states.values()).filter(
        (s: ProcessState) => s.status === 'stopped'
      ).length;

      systemLogger.system(
        `✅ 시스템 정지 완료 (${stoppedCount}/${this.processes.size} 프로세스 정지)`
      );

      this.emit('system:stopped', {
        stoppedCount,
        totalCount: this.processes.size,
      });

      return {
        success: true,
        message: `시스템 정지 완료 (${stoppedCount}/${this.processes.size} 프로세스)`,
        errors,
      };
    } catch (error) {
      systemLogger.error('시스템 정지 실패:', error);
      return {
        success: false,
        message: '시스템 정지 중 오류 발생',
        errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
      };
    }
  }

  /**
   * 프로세스 재시작
   */
  private async restartProcess(processId: string): Promise<boolean> {
    const config = this.processes.get(processId);
    const state = this.states.get(processId);

    if (!config || !state) {
      return false;
    }

    state.restartCount++;

    if (state.restartCount > config.maxRestarts) {
      systemLogger.error(
        `${config.name} 최대 재시작 횟수 초과 (${config.maxRestarts}회)`
      );
      state.status = 'error';
      this.emit('process:max-restarts-exceeded', { processId, config });
      return false;
    }

    systemLogger.system(
      `🔄 ${config.name} 재시작 중... (시도 ${state.restartCount}/${config.maxRestarts})`
    );

    this.emit('process:restarting', {
      processId,
      attempt: state.restartCount,
      maxAttempts: config.maxRestarts,
    });

    // 정지 후 재시작
    await this.stopProcess(processId);
    await this.delay(2000); // 2초 대기
    return await this.startProcess(processId);
  }

  /**
   * 서비스 상태 목록 반환
   */
  private getServiceStatuses(): Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
  }> {
    return Array.from(this.processes.entries()).map(([id, config]) => {
      const state = this.states.get(id);
      let status: 'up' | 'down' | 'degraded' = 'down';

      if (state?.status === 'running') {
        status = state.healthScore >= 70 ? 'up' : 'degraded';
      }

      return {
        name: config.name,
        status,
        responseTime: state?.lastHealthCheck
          ? Date.now() - state.lastHealthCheck.getTime()
          : undefined,
      };
    });
  }

  /**
   * 업타임 계산
   */
  private calculateUptime(): number {
    if (!this.systemStartTime) return 0;
    return Date.now() - this.systemStartTime.getTime();
  }

  /**
   * 기타 기존 메서드들...
   */
  private calculateStartupOrder(): string[] {
    // 의존성 순서 계산 로직
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const config = this.processes.get(id);
      if (config?.dependencies) {
        for (const depId of config.dependencies) {
          visit(depId);
        }
      }

      order.push(id);
    };

    for (const id of this.processes.keys()) {
      visit(id);
    }

    return order;
  }

  private async stopProcess(processId: string): Promise<boolean> {
    const config = this.processes.get(processId);
    const state = this.states.get(processId);

    if (!config || !state) {
      return false;
    }

    if (state.status === 'stopped') {
      return true;
    }

    try {
      state.status = 'stopping';
      await config.stopCommand();
      state.status = 'stopped';
      state.stoppedAt = new Date();

      // 업타임 계산
      if (state.startedAt) {
        state.uptime = state.stoppedAt.getTime() - state.startedAt.getTime();
      }

      systemLogger.system(`✅ ${config.name} 정지 완료`);
      this.emit('process:stopped', { processId, config, state });
      return true;
    } catch (error) {
      systemLogger.error(`${config.name} 정지 실패:`, error);
      return false;
    }
  }

  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      for (const processId of this.processes.keys()) {
        await this.performHealthCheck(processId);
      }
    }, this.healthCheckIntervalMs);
  }

  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  private setupStabilityMonitoring(): void {
    this.stabilityTimeout = setTimeout(() => {
      const metrics = this.getSystemMetrics();
      if (metrics.healthyProcesses === metrics.totalProcesses) {
        systemLogger.system('🏆 시스템 30분 안정성 달성!');
        this.emit('system:stable', { metrics, duration: 30 });
      }
    }, this.stabilityTimeoutMs);
  }

  private async emergencyShutdown(): Promise<void> {
    systemLogger.error('🚨 긴급 시스템 종료 시작...');
    this.isSystemRunning = false;

    this.stopHealthChecks();

    const stopPromises = Array.from(this.processes.keys()).map((id) =>
      this.stopProcess(id).catch((error) =>
        systemLogger.error(`프로세스 ${id} 종료 실패:`, error)
      )
    );

    await Promise.allSettled(stopPromises);
    this.emit('system:emergency-shutdown');
  }

  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      systemLogger.system(`📥 ${signal} 신호 수신, Graceful shutdown 시작...`);
      await this.stopSystem();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getSystemStatus(): {
    running: boolean;
    processes: Map<string, ProcessState>;
    metrics: SystemMetrics;
  } {
    return {
      running: this.isSystemRunning,
      processes: new Map(this.states),
      metrics: this.getSystemMetrics(),
    };
  }

  getSystemMetrics(): SystemMetrics {
    const states = Array.from(this.states.values());
    const runningStates = states.filter((s) => s.status === 'running');
    const healthyStates = runningStates.filter((s) => s.healthScore >= 70);

    const totalRestarts = states.reduce(
      (sum, state) => sum + state.restartCount,
      0
    );

    const averageHealthScore =
      runningStates.length > 0
        ? runningStates.reduce((sum, state) => sum + state.healthScore, 0) /
          runningStates.length
        : 0;

    return {
      totalProcesses: this.processes.size,
      runningProcesses: runningStates.length,
      healthyProcesses: healthyStates.length,
      systemUptime: this.calculateUptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      averageHealthScore,
      totalRestarts,
      lastStabilityCheck: new Date(),
    };
  }
}
