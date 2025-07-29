/**
 * 🖥️ VM 다중 서비스 오케스트레이터
 *
 * VM 환경에서 통합 운영되는 서비스들:
 * - ✅ MCP 서버 (Anthropic 표준 파일시스템 서버)
 * - ✅ 강화된 메트릭 생성기 (10배 풍부한 메트릭)
 * - ✅ 장기 실행 시나리오 엔진 (연속 장애 시뮬레이션)
 * - ✅ 베이스라인 저장소 (GCP Cloud Storage)
 * - ✅ 24시간 연속 운영 (Vercel 제약 없음)
 */

import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { systemLogger } from '../../lib/logger';
import { VMPersistentDataManager } from './VMPersistentDataManager';

interface ServiceStatus {
  name: string;
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  pid?: number;
  port?: number;
  startTime?: Date;
  lastHealthCheck?: Date;
  restartCount: number;
  memoryUsage?: number;
}

interface VMServiceConfig {
  enableMCP: boolean;
  enableDataGenerator: boolean;
  enableScenarioEngine: boolean;
  mcpPort: number;
  healthCheckInterval: number; // 서비스 헬스체크 간격 (ms)
  maxRestartAttempts: number;
  gracefulShutdownTimeout: number;
}

/**
 * 🖥️ VM 다중 서비스 오케스트레이터 (24시간 통합 운영)
 */
export class VMMultiServiceOrchestrator extends EventEmitter {
  private static instance: VMMultiServiceOrchestrator;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  // 서비스 관리
  private services: Map<string, ServiceStatus> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // 핵심 컴포넌트
  private vmDataManager = VMPersistentDataManager.getInstance();

  // 설정
  private config: VMServiceConfig = {
    enableMCP: true,
    enableDataGenerator: true,
    enableScenarioEngine: true,
    mcpPort: 10000, // VM에서 사용 중인 포트
    healthCheckInterval: 30000, // 30초
    maxRestartAttempts: 3,
    gracefulShutdownTimeout: 15000, // 15초
  };

  private constructor() {
    super();
    systemLogger.system('🖥️ VM 다중 서비스 오케스트레이터 초기화');
    this._initializeServices();
    this.setupGracefulShutdown();
  }

  static getInstance(): VMMultiServiceOrchestrator {
    if (!VMMultiServiceOrchestrator.instance) {
      VMMultiServiceOrchestrator.instance = new VMMultiServiceOrchestrator();
    }
    return VMMultiServiceOrchestrator.instance;
  }

  /**
   * 🚀 VM 다중 서비스 시작
   */
  async startAllServices(): Promise<{
    success: boolean;
    message: string;
    services: {
      mcp: boolean;
      dataGenerator: boolean;
      scenarioEngine: boolean;
    };
    totalTime: number;
  }> {
    if (this.isRunning) {
      return {
        success: true,
        message: '⚠️ VM 서비스들이 이미 실행 중입니다',
        services: {
          mcp: this.getServiceStatus('mcp')?.status === 'running',
          dataGenerator:
            this.getServiceStatus('dataGenerator')?.status === 'running',
          scenarioEngine:
            this.getServiceStatus('scenarioEngine')?.status === 'running',
        },
        totalTime: 0,
      };
    }

    const startTime = Date.now();
    systemLogger.system('🚀 VM 다중 서비스 시작 중...');

    try {
      let mcpStarted = false;
      let dataGeneratorStarted = false;
      let scenarioEngineStarted = false;

      // 1️⃣ MCP 서버 시작 (기존 서버 확인 후 필요시 시작)
      if (this.config.enableMCP) {
        mcpStarted = await this.startMCPServer();
        systemLogger.info(
          `📡 MCP 서버: ${mcpStarted ? '시작 완료' : '이미 실행 중 또는 실패'}`
        );
      }

      // 2️⃣ VM 데이터 관리자 시작 (메트릭 생성기 + 시나리오 엔진 포함)
      if (this.config.enableDataGenerator || this.config.enableScenarioEngine) {
        const vmResult = await this.vmDataManager.startVMSystem();
        dataGeneratorStarted = vmResult.details.enrichedMetricsStarted;
        scenarioEngineStarted = vmResult.details.scenarioEngineStarted;

        systemLogger.info(
          `📊 데이터 생성기: ${dataGeneratorStarted ? '시작 완료' : '실패'}`
        );
        systemLogger.info(
          `🎭 시나리오 엔진: ${scenarioEngineStarted ? '시작 완료' : '실패'}`
        );
      }

      // 3️⃣ 헬스체크 시작
      this.startHealthCheck();

      this.isRunning = true;
      this.isInitialized = true;

      const totalTime = Date.now() - startTime;
      const successMessage = `✅ VM 다중 서비스 시작 완료 (${totalTime}ms)`;

      systemLogger.info(successMessage);
      systemLogger.info('🖥️ VM 통합 운영 모드 활성화');
      this.logServicesSummary();

      // 이벤트 발신
      this.emit('servicesStarted', {
        mcp: mcpStarted,
        dataGenerator: dataGeneratorStarted,
        scenarioEngine: scenarioEngineStarted,
      });

      return {
        success: true,
        message: successMessage,
        services: {
          mcp: mcpStarted,
          dataGenerator: dataGeneratorStarted,
          scenarioEngine: scenarioEngineStarted,
        },
        totalTime,
      };
    } catch (error) {
      systemLogger.error('❌ VM 다중 서비스 시작 실패:', error);

      // 실패 시 정리
      await this.stopAllServices();

      return {
        success: false,
        message: `❌ VM 다중 서비스 시작 실패: ${(error as Error).message}`,
        services: {
          mcp: false,
          dataGenerator: false,
          scenarioEngine: false,
        },
        totalTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🛑 VM 다중 서비스 종료
   */
  async stopAllServices(): Promise<{
    success: boolean;
    message: string;
    services: {
      mcp: boolean;
      dataGenerator: boolean;
      scenarioEngine: boolean;
    };
    totalTime: number;
  }> {
    if (!this.isRunning) {
      return {
        success: true,
        message: '⚠️ VM 서비스들이 이미 정지되어 있습니다',
        services: { mcp: true, dataGenerator: true, scenarioEngine: true },
        totalTime: 0,
      };
    }

    const startTime = Date.now();
    systemLogger.system('🛑 VM 다중 서비스 종료 중...');

    try {
      // 1️⃣ 헬스체크 중지
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      let mcpStopped = false;
      let dataGeneratorStopped = false;
      let scenarioEngineStopped = false;

      // 2️⃣ VM 데이터 관리자 종료 (베이스라인 저장 포함)
      const vmResult = await this.vmDataManager.stopVMSystem();
      dataGeneratorStopped = vmResult.details.enrichedMetricsStopped;
      scenarioEngineStopped = vmResult.details.scenarioEngineStopped;

      systemLogger.info(
        `📊 데이터 생성기: ${dataGeneratorStopped ? '정지 완료' : '실패'}`
      );
      systemLogger.info(
        `🎭 시나리오 엔진: ${scenarioEngineStopped ? '정지 완료' : '실패'}`
      );

      // 3️⃣ MCP 서버는 별도 VM 프로세스이므로 상태만 확인
      mcpStopped = await this.checkMCPServerStatus();
      systemLogger.info(
        `📡 MCP 서버: ${mcpStopped ? '정상 운영 중' : '상태 확인 필요'}`
      );

      // 4️⃣ 모든 내부 프로세스 정리
      await this.terminateAllProcesses();

      this.isRunning = false;

      const totalTime = Date.now() - startTime;
      const successMessage = `✅ VM 다중 서비스 종료 완료 (${totalTime}ms)`;

      systemLogger.info(successMessage);

      // 이벤트 발신
      this.emit('servicesStopped', {
        mcp: mcpStopped,
        dataGenerator: dataGeneratorStopped,
        scenarioEngine: scenarioEngineStopped,
      });

      return {
        success: true,
        message: successMessage,
        services: {
          mcp: mcpStopped,
          dataGenerator: dataGeneratorStopped,
          scenarioEngine: scenarioEngineStopped,
        },
        totalTime,
      };
    } catch (error) {
      systemLogger.error('❌ VM 다중 서비스 종료 실패:', error);

      return {
        success: false,
        message: `❌ VM 다중 서비스 종료 실패: ${(error as Error).message}`,
        services: { mcp: false, dataGenerator: false, scenarioEngine: false },
        totalTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 📡 MCP 서버 시작 (기존 서버 확인)
   */
  private async startMCPServer(): Promise<boolean> {
    try {
      // 기존 MCP 서버 상태 확인
      const isRunning = await this.checkMCPServerStatus();

      if (isRunning) {
        this.updateServiceStatus('mcp', 'running');
        systemLogger.info(
          '📡 MCP 서버가 이미 실행 중입니다 (VM 외부 프로세스)'
        );
        return true;
      }

      // MCP 서버가 없다면 경고만 표시 (VM에서 별도 관리되므로)
      this.updateServiceStatus('mcp', 'error');
      systemLogger.warn(
        '⚠️ MCP 서버가 감지되지 않습니다. VM에서 별도로 시작해야 합니다.'
      );
      return false;
    } catch (error) {
      systemLogger.error('❌ MCP 서버 시작 확인 실패:', error);
      this.updateServiceStatus('mcp', 'error');
      return false;
    }
  }

  /**
   * 🔍 MCP 서버 상태 확인
   */
  private async checkMCPServerStatus(): Promise<boolean> {
    try {
      // HTTP 헬스체크로 MCP 서버 상태 확인
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `http://localhost:${this.config.mcpPort}/health`,
        {
          method: 'GET',
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const isHealthy = response.ok;

      if (isHealthy) {
        this.updateServiceStatus('mcp', 'running');
      } else {
        this.updateServiceStatus('mcp', 'error');
      }

      return isHealthy;
    } catch (error) {
      this.updateServiceStatus('mcp', 'error');
      return false;
    }
  }

  /**
   * 🔄 서비스 상태 업데이트
   */
  private updateServiceStatus(
    serviceName: string,
    status: ServiceStatus['status'],
    additionalData?: Partial<ServiceStatus>
  ): void {
    const current = this.services.get(serviceName) || {
      name: serviceName,
      status: 'stopped',
      restartCount: 0,
    };

    const updated: ServiceStatus = {
      ...current,
      status,
      lastHealthCheck: new Date(),
      ...additionalData,
    };

    this.services.set(serviceName, updated);
  }

  /**
   * 🔄 헬스체크 시작 (서버리스 환경에서 비활성화)
   */
  private startHealthCheck(): void {
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      console.warn('⚠️ 서버리스 환경에서 VM 헬스체크 비활성화');
      console.warn('📊 Vercel 플랫폼 모니터링 사용 권장:');
      console.warn('   - Functions > Health 탭에서 함수 상태 확인');
      console.warn('   - Analytics 탭에서 성능 메트릭 확인');
      console.warn('   - Edge Network 탭에서 네트워크 상태 확인');
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        // MCP 서버 헬스체크
        if (this.config.enableMCP) {
          await this.checkMCPServerStatus();
        }

        // VM 데이터 관리자 상태 확인
        const vmStatus = this.vmDataManager.getVMSystemStatus();
        this.updateServiceStatus(
          'dataGenerator',
          vmStatus.isRunning ? 'running' : 'error'
        );
        this.updateServiceStatus(
          'scenarioEngine',
          vmStatus.isRunning ? 'running' : 'error'
        );

        // 이벤트 발신 (매 5분마다)
        const now = Date.now();
        if (now % (5 * 60 * 1000) < this.config.healthCheckInterval) {
          this.emit('healthCheck', this.getServicesSummary());
        }
      } catch (error) {
        systemLogger.error('❌ 헬스체크 실행 오류:', error);
      }
    }, this.config.healthCheckInterval);

    systemLogger.info(
      `🔄 헬스체크 시작 (${this.config.healthCheckInterval / 1000}초 간격) - 로컬 환경`
    );
  }

  /**
   * 🏗️ 서비스 목록 초기화
   */
  private _initializeServices(): void {
    this.services.set('mcp', {
      name: 'MCP 서버',
      status: 'stopped',
      port: this.config.mcpPort,
      restartCount: 0,
    });

    this.services.set('dataGenerator', {
      name: '강화된 메트릭 생성기',
      status: 'stopped',
      restartCount: 0,
    });

    this.services.set('scenarioEngine', {
      name: '장기 실행 시나리오 엔진',
      status: 'stopped',
      restartCount: 0,
    });

    systemLogger.info('🏗️ VM 서비스 목록 초기화 완료');
  }

  /**
   * 🛑 모든 프로세스 종료
   */
  private async terminateAllProcesses(): Promise<void> {
    const terminationPromises: Promise<void>[] = [];

    for (const [serviceName, process] of this.processes) {
      terminationPromises.push(
        new Promise<void>(resolve => {
          const timeout = setTimeout(() => {
            systemLogger.warn(`⚠️ ${serviceName} 강제 종료`);
            process.kill('SIGKILL');
            resolve();
          }, this.config.gracefulShutdownTimeout);

          process.on('exit', () => {
            clearTimeout(timeout);
            systemLogger.info(`✅ ${serviceName} 정상 종료`);
            resolve();
          });

          process.kill('SIGTERM');
        })
      );
    }

    await Promise.all(terminationPromises);
    this.processes.clear();
  }

  /**
   * 🔄 시스템 종료 시 자동 정리 설정
   */
  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      systemLogger.warn(`🔄 ${signal} 신호 수신 - VM 다중 서비스 종료 시작`);

      try {
        await this.stopAllServices();
        systemLogger.info('✅ VM 다중 서비스 정상 종료 완료');
        process.exit(0);
      } catch (error) {
        systemLogger.error('❌ VM 다중 서비스 종료 중 오류:', error);
        process.exit(1);
      }
    };

    // 시그널 핸들러 등록 (중복 방지)
    if (!process.listenerCount('SIGINT')) {
      process.on('SIGINT', () => shutdownHandler('SIGINT'));
      process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
      process.on('SIGQUIT', () => shutdownHandler('SIGQUIT'));
    }
  }

  // 📊 상태 조회 메서드들

  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.services.get(serviceName);
  }

  getServicesSummary() {
    const summary = {
      total: this.services.size,
      running: 0,
      stopped: 0,
      error: 0,
      services: Array.from(this.services.values()),
      isRunning: this.isRunning,
      lastUpdate: new Date().toISOString(),
    };

    this.services.forEach(service => {
      switch (service.status) {
        case 'running':
          summary.running++;
          break;
        case 'stopped':
          summary.stopped++;
          break;
        case 'error':
          summary.error++;
          break;
      }
    });

    return summary;
  }

  private logServicesSummary(): void {
    const summary = this.getServicesSummary();
    systemLogger.info(
      `📊 서비스 현황: 실행 중 ${summary.running}개, 정지 ${summary.stopped}개, 오류 ${summary.error}개`
    );

    this.services.forEach(service => {
      const statusIcon =
        service.status === 'running'
          ? '✅'
          : service.status === 'error'
            ? '❌'
            : '⏸️';
      systemLogger.info(`${statusIcon} ${service.name}: ${service.status}`);
    });
  }

  updateConfig(newConfig: Partial<VMServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    systemLogger.info('⚙️ VM 다중 서비스 설정 업데이트:', newConfig);
  }
}
