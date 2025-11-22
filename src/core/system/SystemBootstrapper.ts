/**
 * 🚀 시스템 부트스트래퍼
 *
 * ProcessManager와 SystemWatchdog를 이벤트 버스로 연결하여
 * 순환 의존성 없이 시스템을 초기화합니다.
 */

import { systemLogger } from '../../lib/logger';
import { ProcessManager } from './ProcessManager.refactored';
import { SystemWatchdog } from './SystemWatchdog.refactored';
import { SystemEventBus } from '../events/SystemEventHandler';
import type {
  ProcessConfig,
  ProcessState,
  SystemMetrics,
} from './ProcessManager.refactored';
import type {
  SystemEventType,
  ProcessEventPayload as _ProcessEventPayload,
  WatchdogEventPayload,
  SystemStatusPayload as _SystemStatusPayload,
} from '../interfaces/SystemEventBus';

export interface SystemBootstrapConfig {
  enableWatchdog?: boolean;
  enableDebugLogging?: boolean;
  watchdogInterval?: number;
  healthCheckInterval?: number;
  stabilityTimeout?: number;
}

/**
 * 시스템 부트스트래퍼 - 시스템 컴포넌트 초기화 및 연결
 */
export class SystemBootstrapper {
  private processManager: ProcessManager;
  private watchdog?: SystemWatchdog;
  private eventBus: SystemEventBus;
  private config: SystemBootstrapConfig;
  private isInitialized = false;

  constructor(config: SystemBootstrapConfig = {}) {
    this.config = {
      enableWatchdog: true,
      enableDebugLogging: false,
      watchdogInterval: 30000,
      healthCheckInterval: 30000,
      stabilityTimeout: 30 * 60 * 1000,
      ...config,
    };

    // 이벤트 버스 생성
    this.eventBus = new SystemEventBus({
      enableHistory: true,
      historyLimit: 100,
      enableDebugLogging: this.config.enableDebugLogging,
    });

    // ProcessManager 생성 및 이벤트 버스 연결
    this.processManager = new ProcessManager(this.eventBus);

    // Watchdog 생성 및 이벤트 버스 연결
    if (this.config.enableWatchdog) {
      this.watchdog = new SystemWatchdog(this.eventBus);
      this.setupWatchdogEventHandlers();
    }

    // 이벤트 핸들러 설정
    this.setupEventHandlers();
  }

  /**
   * 시스템 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      systemLogger.warn('시스템이 이미 초기화되었습니다');
      return;
    }

    systemLogger.system('🚀 시스템 부트스트래퍼 초기화 시작...');

    try {
      // 이벤트 버스 활성화
      this.eventBus.emit({
        type: 'SYSTEM_INITIALIZING' as SystemEventType,
        timestamp: Date.now(),
        source: 'SystemBootstrapper',
        payload: {
          message: '시스템 초기화 시작',
        },
      });

      // Watchdog 시작
      if (this.watchdog && this.config.enableWatchdog) {
        this.watchdog.start();
        systemLogger.system('✅ SystemWatchdog 활성화 완료');
      }

      this.isInitialized = true;
      systemLogger.system('✅ 시스템 부트스트래퍼 초기화 완료');
    } catch (error) {
      systemLogger.error('시스템 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 프로세스 등록
   */
  registerProcess(config: ProcessConfig): void {
    this.processManager.registerProcess(config);
  }

  /**
   * 시스템 시작
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
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.processManager.startSystem(options);
  }

  /**
   * 시스템 정지
   */
  async stopSystem(): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> {
    // Watchdog 정지
    if (this.watchdog) {
      this.watchdog.stop();
    }

    // ProcessManager 정지
    return this.processManager.stopSystem();
  }

  /**
   * 시스템 상태 조회
   */
  getSystemStatus(): {
    running: boolean;
    processes: Map<string, ProcessState>;
    metrics: SystemMetrics;
    watchdogReport?: unknown;
  } {
    const status = this.processManager.getSystemStatus();

    return {
      ...status,
      ...(this.watchdog && { watchdogReport: this.watchdog.generateReport() }),
    };
  }

  /**
   * 시스템 메트릭스 조회
   */
  getSystemMetrics(): SystemMetrics & { watchdog?: unknown } {
    const metrics = this.processManager.getSystemMetrics();

    if (this.watchdog) {
      const watchdogMetrics = this.watchdog.getMetrics();
      return {
        ...metrics,
        watchdog: watchdogMetrics,
      };
    }

    return metrics;
  }

  /**
   * 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    // 프로세스 시작 이벤트
    this.processManager.on('process:started', (data) => {
      systemLogger.system(`🟢 프로세스 시작: ${data.config.name}`);
    });

    // 프로세스 정지 이벤트
    this.processManager.on('process:stopped', (data) => {
      systemLogger.system(`🔴 프로세스 정지: ${data.config.name}`);
    });

    // 프로세스 오류 이벤트
    this.processManager.on('process:error', (data) => {
      systemLogger.error(`⚠️ 프로세스 오류: ${data.processId}`, data.error);
    });

    // 시스템 안정성 달성 이벤트
    this.processManager.on('system:stable', (data) => {
      systemLogger.system('🏆 시스템 안정성 달성!', data);
    });

    // 긴급 종료 이벤트
    this.processManager.on('system:emergency-shutdown', () => {
      systemLogger.error('🚨 시스템 긴급 종료 수행됨');
      if (this.watchdog) {
        this.watchdog.stop();
      }
    });
  }

  /**
   * Watchdog 이벤트 핸들러 설정
   */
  private setupWatchdogEventHandlers(): void {
    if (!this.watchdog) return;

    // Watchdog 알림을 이벤트 버스를 통해 수신
    this.eventBus.on<WatchdogEventPayload>(
      'WATCHDOG_ALERT' as SystemEventType,
      (event) => {
        const { alertType, message, metrics } = event.payload;

        switch (alertType) {
          case 'memory-leak':
            systemLogger.error('🚨 메모리 누수 감지:', message);
            this.handleMemoryLeak(metrics);
            break;

          case 'high-error-rate':
            systemLogger.warn('⚠️ 높은 오류율:', message);
            this.handleHighErrorRate(metrics);
            break;

          case 'performance-degradation':
            systemLogger.warn('⚠️ 성능 저하:', message);
            this.handlePerformanceDegradation(metrics);
            break;

          case 'frequent-restarts':
            systemLogger.warn('⚠️ 빈번한 재시작:', message);
            this.handleFrequentRestarts(metrics);
            break;
        }
      }
    );
  }

  /**
   * 메모리 누수 처리
   */
  private handleMemoryLeak(metrics?: WatchdogEventPayload['metrics']): void {
    // 메모리 사용량이 임계값을 초과하면 GC 강제 실행
    if (metrics?.memoryUsage && metrics.memoryUsage > 1000) {
      systemLogger.system('🧹 강제 가비지 컬렉션 실행...');
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * 높은 오류율 처리
   */
  private handleHighErrorRate(metrics?: WatchdogEventPayload['metrics']): void {
    // 오류율이 50% 이상이면 시스템 재시작 고려
    if (metrics?.errorRate && metrics.errorRate > 50) {
      systemLogger.error(
        '❌ 오류율이 50%를 초과했습니다. 시스템 점검이 필요합니다.'
      );
    }
  }

  /**
   * 성능 저하 처리
   */
  private handlePerformanceDegradation(
    metrics?: WatchdogEventPayload['metrics']
  ): void {
    // 성능 점수가 30 미만이면 경고
    if (metrics?.performanceScore && metrics.performanceScore < 30) {
      systemLogger.error('⚠️ 심각한 성능 저하. 즉시 조치가 필요합니다.');
    }
  }

  /**
   * 빈번한 재시작 처리
   */
  private handleFrequentRestarts(
    metrics?: WatchdogEventPayload['metrics']
  ): void {
    // 재시작 횟수가 10회를 초과하면 경고
    if (metrics?.restartCount && metrics.restartCount > 10) {
      systemLogger.error(
        '⚠️ 과도한 프로세스 재시작. 안정성 문제를 확인하세요.'
      );
    }
  }

  /**
   * 정리 작업
   */
  async cleanup(): Promise<void> {
    systemLogger.system('🧹 시스템 정리 시작...');

    // 시스템 정지
    await this.stopSystem();

    // 이벤트 버스 정리
    this.eventBus.removeAllListeners();

    this.isInitialized = false;
    systemLogger.system('✅ 시스템 정리 완료');
  }

  /**
   * ProcessManager 인스턴스 반환
   */
  getProcessManager(): ProcessManager {
    return this.processManager;
  }

  /**
   * SystemWatchdog 인스턴스 반환
   */
  getWatchdog(): SystemWatchdog | undefined {
    return this.watchdog;
  }

  /**
   * EventBus 인스턴스 반환
   */
  getEventBus(): SystemEventBus {
    return this.eventBus;
  }
}

// 싱글톤 인스턴스
let systemBootstrapper: SystemBootstrapper | null = null;

/**
 * 시스템 부트스트래퍼 싱글톤 인스턴스 반환
 */
export function getSystemBootstrapper(
  config?: SystemBootstrapConfig
): SystemBootstrapper {
  if (!systemBootstrapper) {
    systemBootstrapper = new SystemBootstrapper(config);
  }
  return systemBootstrapper;
}

/**
 * 시스템 부트스트래퍼 리셋
 */
export async function resetSystemBootstrapper(): Promise<void> {
  if (systemBootstrapper) {
    await systemBootstrapper.cleanup();
    systemBootstrapper = null;
  }
}
