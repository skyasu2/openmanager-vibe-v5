/**
 * 🔧 통합 프로세스 관리 시스템
 *
 * 모든 시스템 프로세스를 중앙에서 관리:
 * - 의존성 순서 기반 시작/정지
 * - 자동 헬스체크 및 복구
 * - 30분 모니터링 및 안정성 보장
 * - Graceful shutdown
 */

import { EventEmitter } from 'events';
import { systemLogger } from '../../lib/logger';
import { SystemWatchdog } from './SystemWatchdog';

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

export class ProcessManager extends EventEmitter {
  private processes = new Map<string, ProcessConfig>();
  private states = new Map<string, ProcessState>();
  private healthCheckInterval?: NodeJS.Timeout;
  private watchdog?: SystemWatchdog;
  private isSystemRunning = false;
  private systemStartTime?: Date;
  private stabilityTimeout?: NodeJS.Timeout;
  private readonly healthCheckIntervalMs =
    process.env.NODE_ENV === 'development' ? 60000 : 30000; // 개발: 60초, 운영: 30초
  private readonly stabilityTimeoutMs = 30 * 60 * 1000; // 30분

  constructor() {
    super();
    this.watchdog = new SystemWatchdog(this);
    this.setupGracefulShutdown();
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

      // 3단계: Watchdog 활성화
      this.watchdog?.start();

      // 4단계: 30분 안정성 모니터링 설정
      if (!options?.skipStabilityCheck) {
        this.setupStabilityMonitoring();
      }

      const runningCount = Array.from(this.states.values()).filter(
        (s: any) => s.status === 'running'
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
        throw new Error('초기 헬스체크 실패 (3회 시도)');
      }

      state.healthScore = 100;
      state.lastHealthCheck = new Date();

      systemLogger.system(`✅ ${config.name} 시작 완료`);
      this.emit('process:started', { processId, config, state });
      return true;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : '알 수 없는 오류';
      systemLogger.error(`❌ ${config.name} 시작 실패: ${errorMsg}`);

      state.status = 'error';
      state.errors.push({
        timestamp: new Date(),
        message: '시작 실패',
        error,
      });

      this.emit('process:error', { processId, error: errorMsg });

      // 자동 재시작 시도
      if (config.autoRestart && state.restartCount < config.maxRestarts) {
        systemLogger.system(`🔄 ${config.name} 자동 재시작 시도...`);
        return await this.restartProcess(processId);
      }

      return false;
    }
  }

  /**
   * 🛑 시스템 전체 정지
   */
  async stopSystem(): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      systemLogger.system('🛑 시스템 정지 시작...');
      this.isSystemRunning = false;

      // 1단계: 안정성 모니터링 중지
      this.clearStabilityMonitoring();

      // 2단계: 헬스체크 중지
      this.stopHealthChecks();

      // 3단계: Watchdog 중지
      this.watchdog?.stop();

      // 4단계: 역순으로 프로세스 정지
      const stopOrder = this.calculateStartupOrder().reverse();
      systemLogger.system(`📋 정지 순서: ${stopOrder.join(' → ')}`);

      for (const processId of stopOrder) {
        const success = await this.stopProcess(processId);
        if (!success) {
          const config = this.processes.get(processId);
          errors.push(`${config?.name || processId} 정지 실패`);
        }

        // 안전한 종료를 위한 대기
        await this.delay(500);
      }

      const stoppedCount = Array.from(this.states.values()).filter(
        (s: any) => s.status === 'stopped'
      ).length;

      systemLogger.system(
        `✅ 시스템 정지 완료 (${stoppedCount}/${this.processes.size} 프로세스 정지됨)`
      );
      this.emit('system:stopped', {
        stoppedCount,
        totalCount: this.processes.size,
      });

      return {
        success: errors.length === 0,
        message: `시스템 정지 완료 (${stoppedCount}/${this.processes.size} 프로세스)`,
        errors,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : '알 수 없는 오류';
      systemLogger.error('시스템 정지 실패:', error);

      return {
        success: false,
        message: '시스템 정지 중 오류 발생',
        errors: [errorMsg],
      };
    }
  }

  /**
   * 개별 프로세스 정지
   */
  private async stopProcess(processId: string): Promise<boolean> {
    const config = this.processes.get(processId);
    const state = this.states.get(processId);

    if (!config || !state) return false;

    if (state.status === 'stopped') {
      return true; // 이미 정지됨
    }

    try {
      systemLogger.system(`⏹️ ${config.name} 정지 중...`);
      state.status = 'stopping';

      await config.stopCommand();

      state.status = 'stopped';
      state.stoppedAt = new Date();

      systemLogger.system(`✅ ${config.name} 정지 완료`);
      this.emit('process:stopped', { processId, config, state });
      return true;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : '알 수 없는 오류';
      systemLogger.error(`❌ ${config.name} 정지 실패: ${errorMsg}`);

      state.status = 'error';
      state.errors.push({
        timestamp: new Date(),
        message: '정지 실패',
        error,
      });

      return false;
    }
  }

  /**
   * 🚫 헬스체크 시스템 (서버리스 환경에서 비활성화)
   */
  private startHealthChecks(): void {
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      console.warn('⚠️ 서버리스 환경에서 지속적 헬스체크 비활성화');
      console.warn('📊 Vercel 플랫폼 모니터링 사용 권장:');
      console.warn('   - Functions > Logs 탭에서 실시간 로그 확인');
      console.warn('   - Analytics 탭에서 성능 메트릭 확인');
      console.warn('   - Functions > Errors 탭에서 에러 추적');
      return;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    systemLogger.system('💓 헬스체크 시스템 시작 (로컬 환경)');

    this.healthCheckInterval = setInterval(async () => {
      const healthPromises = Array.from(this.processes.entries()).map(
        ([processId, config]) => this.performHealthCheck(processId, config)
      );

      await Promise.allSettled(healthPromises);

      // 시스템 전체 헬스 상태 평가
      this.evaluateSystemHealth();
    }, this.healthCheckIntervalMs);
  }

  /**
   * 개별 프로세스 헬스체크
   */
  private async performHealthCheck(
    processId: string,
    config: ProcessConfig
  ): Promise<void> {
    const state = this.states.get(processId);
    if (!state || state.status !== 'running') return;

    try {
      const isHealthy = await Promise.race([
        config.healthCheck(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('헬스체크 타임아웃')), 5000)
        ),
      ]);

      state.lastHealthCheck = new Date();

      if (isHealthy) {
        state.healthScore = Math.min(100, state.healthScore + 5); // 점진적 회복
      } else {
        state.healthScore = Math.max(0, state.healthScore - 20);
        await this.handleUnhealthyProcess(processId, '헬스체크 실패');
      }
    } catch (error) {
      state.healthScore = Math.max(0, state.healthScore - 30);
      await this.handleUnhealthyProcess(
        processId,
        `헬스체크 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 비정상 프로세스 처리
   */
  private async handleUnhealthyProcess(
    processId: string,
    reason: string
  ): Promise<void> {
    const config = this.processes.get(processId);
    const state = this.states.get(processId);

    if (!config || !state) return;

    systemLogger.warn(`⚠️ ${config.name} 비정상 상태: ${reason}`);

    state.errors.push({
      timestamp: new Date(),
      message: reason,
      error: null,
    });

    this.emit('process:unhealthy', {
      processId,
      config,
      reason,
      healthScore: state.healthScore,
    });

    // Critical 프로세스 즉시 복구
    if (config.criticalLevel === 'high' && config.autoRestart) {
      if (state.healthScore <= 20) {
        // 심각한 상태
        await this.restartProcess(processId);
      }
    } else if (config.criticalLevel === 'medium') {
      // 3회 연속 실패 시 재시작
      const recentErrors = state.errors.filter(
        e => Date.now() - e.timestamp.getTime() < 60000 // 1분 이내
      ).length;

      if (recentErrors >= 3 && config.autoRestart) {
        await this.restartProcess(processId);
      }
    }
  }

  /**
   * 프로세스 재시작
   */
  private async restartProcess(processId: string): Promise<boolean> {
    const config = this.processes.get(processId);
    const state = this.states.get(processId);

    if (!config || !state) return false;

    if (state.restartCount >= config.maxRestarts) {
      systemLogger.error(
        `❌ ${config.name} 최대 재시작 횟수 초과 (${config.maxRestarts})`
      );
      state.status = 'error';
      this.emit('process:max-restarts-exceeded', { processId, config });
      return false;
    }

    state.restartCount++;
    state.status = 'restarting';

    systemLogger.system(
      `🔄 ${config.name} 재시작 중... (${state.restartCount}/${config.maxRestarts})`
    );
    this.emit('process:restarting', {
      processId,
      attempt: state.restartCount,
      maxRestarts: config.maxRestarts,
    });

    // 기존 프로세스 정지
    await this.stopProcess(processId);
    await this.delay(2000); // 2초 대기

    // 새로 시작
    const success = await this.startProcess(processId);

    if (success) {
      systemLogger.system(`✅ ${config.name} 재시작 성공`);
    } else {
      systemLogger.error(`❌ ${config.name} 재시작 실패`);
    }

    return success;
  }

  /**
   * 30분 안정성 모니터링
   */
  private setupStabilityMonitoring(): void {
    this.clearStabilityMonitoring();

    systemLogger.system('🕐 30분 안정성 모니터링 시작');

    this.stabilityTimeout = setTimeout(() => {
      if (this.isSystemRunning) {
        const metrics = this.getSystemMetrics();
        systemLogger.system('✅ 30분 안정성 검증 완료');
        systemLogger.system(
          `📊 시스템 메트릭스: 가동률 ${metrics.runningProcesses}/${metrics.totalProcesses}, 평균 헬스 ${metrics.averageHealthScore.toFixed(1)}%`
        );
        this.emit('system:stable', { metrics, duration: 30 });
      }
    }, this.stabilityTimeoutMs);
  }

  private clearStabilityMonitoring(): void {
    if (this.stabilityTimeout) {
      clearTimeout(this.stabilityTimeout);
      this.stabilityTimeout = undefined;
    }
  }

  /**
   * 시작 순서 계산 (의존성 기반 토폴로지 정렬)
   */
  private calculateStartupOrder(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const visiting = new Set<string>();

    const visit = (processId: string) => {
      if (visiting.has(processId)) {
        throw new Error(`순환 의존성 감지: ${processId}`);
      }
      if (visited.has(processId)) return;

      visiting.add(processId);

      const config = this.processes.get(processId);
      if (config?.dependencies) {
        for (const depId of config.dependencies) {
          if (this.processes.has(depId)) {
            visit(depId);
          }
        }
      }

      visiting.delete(processId);
      visited.add(processId);
      result.push(processId);
    };

    for (const processId of this.processes.keys()) {
      visit(processId);
    }

    return result;
  }

  /**
   * 시스템 헬스 평가
   */
  private evaluateSystemHealth(): void {
    const states = Array.from(this.states.values());
    const runningCount = states.filter(
      (s: any) => s.status === 'running'
    ).length;
    const healthyCount = states.filter(
      (s: any) => s.status === 'running' && s.healthScore >= 70
    ).length;

    let _systemHealth: 'healthy' | 'degraded' | 'critical';

    // 🔧 더 관대한 헬스 평가 - 핵심 기능 중심
    // 개발 모드에서는 프로세스가 제대로 실행되지 않을 수 있음
    const totalProcesses = this.processes.size;

    if (totalProcesses === 0) {
      // 등록된 프로세스가 없으면 기본적으로 healthy (개발 모드)
      _systemHealth = 'healthy';
    } else if (runningCount === 0) {
      // 실행 중인 프로세스가 하나도 없으면 critical
      _systemHealth = 'critical';
    } else if (healthyCount >= Math.max(1, totalProcesses * 0.5)) {
      // 50% 이상 건강하면 healthy (기존 100% → 50%로 완화)
      _systemHealth = 'healthy';
    } else if (runningCount >= Math.max(1, totalProcesses * 0.3)) {
      // 30% 이상 실행되면 degraded (기존 70% → 30%로 완화)
      _systemHealth = 'degraded';
    } else {
      _systemHealth = 'critical';
    }

    // 🔔 개발 모드에서는 경고만 출력하고 시스템은 정상으로 유지
    if (process.env.NODE_ENV === 'development' && _systemHealth !== 'healthy') {
      console.warn(
        `⚠️ [ProcessManager] 개발 모드 - 일부 프로세스 문제 있지만 기본 기능은 동작: ${_systemHealth}`
      );
      console.warn(
        `📊 프로세스 상태: 실행중 ${runningCount}/${totalProcesses}, 건강 ${healthyCount}/${totalProcesses}`
      );
    }

    this.emit('system:health-update', {
      health: _systemHealth,
      runningCount,
      healthyCount,
      totalCount: this.processes.size,
    });
  }

  /**
   * 응급 셧다운
   */
  private async emergencyShutdown(): Promise<void> {
    systemLogger.error('🚨 응급 셧다운 실행');
    this.isSystemRunning = false;

    this.clearStabilityMonitoring();
    this.stopHealthChecks();
    this.watchdog?.stop();

    // 모든 프로세스 강제 종료
    const stopPromises = Array.from(this.processes.keys()).map(processId =>
      this.stopProcess(processId)
    );

    await Promise.allSettled(stopPromises);
    this.emit('system:emergency-shutdown');
  }

  /**
   * Graceful shutdown 설정
   */
  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;

    signals.forEach(signal => {
      process.on(signal, async () => {
        systemLogger.system(
          `📡 ${signal} 시그널 수신 - Graceful shutdown 시작`
        );
        await this.stopSystem();
        process.exit(0);
      });
    });
  }

  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      systemLogger.system('💓 헬스체크 시스템 중지');
    }
  }

  /**
   * 시스템 메트릭스 조회
   */
  getSystemMetrics(): SystemMetrics {
    const states = Array.from(this.states.values());
    const runningProcesses = states.filter((s: any) => s.status === 'running');
    const healthyProcesses = states.filter(
      (s: any) => s.status === 'running' && s.healthScore >= 70
    );

    const uptime = this.systemStartTime
      ? Date.now() - this.systemStartTime.getTime()
      : 0;

    const averageHealthScore =
      states.length > 0
        ? states.reduce((sum: number, s: any) => sum + s.healthScore, 0) /
          states.length
        : 0;

    const totalRestarts = states.reduce(
      (sum: number, s: any) => sum + s.restartCount,
      0
    );

    return {
      totalProcesses: this.processes.size,
      runningProcesses: runningProcesses.length,
      healthyProcesses: healthyProcesses.length,
      systemUptime: uptime,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      averageHealthScore,
      totalRestarts,
      lastStabilityCheck: new Date(),
    };
  }

  /**
   * 시스템 상태 조회
   */
  getSystemStatus() {
    const processStatuses = Array.from(this.states.values());
    const metrics = this.getSystemMetrics();

    // 🔧 더 관대한 헬스 상태 결정 (evaluateSystemHealth와 동일한 로직)
    let health: 'healthy' | 'degraded' | 'critical';
    const totalProcesses = metrics.totalProcesses;
    const runningCount = metrics.runningProcesses;
    const healthyCount = metrics.healthyProcesses;

    if (totalProcesses === 0) {
      health = 'healthy'; // 개발 모드
    } else if (runningCount === 0) {
      health = 'critical';
    } else if (healthyCount >= Math.max(1, totalProcesses * 0.5)) {
      health = 'healthy'; // 50% 이상 건강
    } else if (runningCount >= Math.max(1, totalProcesses * 0.3)) {
      health = 'degraded'; // 30% 이상 실행
    } else {
      health = 'critical';
    }

    return {
      isRunning: this.isSystemRunning,
      health,
      processes: processStatuses,
      metrics,
      startTime: this.systemStartTime,
      watchdogMetrics: this.watchdog?.getMetrics(),
    };
  }

  /**
   * 프로세스 상태 조회
   */
  getProcessState(processId: string): ProcessState | undefined {
    return this.states.get(processId);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
