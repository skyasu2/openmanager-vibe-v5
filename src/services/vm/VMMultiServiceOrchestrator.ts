/**
 * 🖥️ VM MCP 서버 오케스트레이터
 *
 * VM 환경에서 운영되는 서비스:
 * - ✅ MCP 서버 (Anthropic 표준 파일시스템 서버)
 * - ❌ 서버데이터 생성 기능 제거됨 (GCP Functions로 이전)
 */

import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { systemLogger } from '../../lib/logger';

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
  mcpPort: number;
  healthCheckInterval: number; // 서비스 헬스체크 간격 (ms)
  maxRestartAttempts: number;
  gracefulShutdownTimeout: number;
}

/**
 * 🖥️ VM MCP 서버 오케스트레이터 (파일시스템 서버만)
 */
export class VMMultiServiceOrchestrator extends EventEmitter {
  private static instance: VMMultiServiceOrchestrator;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  // 서비스 관리
  private services: Map<string, ServiceStatus> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // 설정
  private config: VMServiceConfig = {
    enableMCP: true,
    mcpPort: 10000, // VM에서 사용 중인 포트
    healthCheckInterval: 30000, // 30초
    maxRestartAttempts: 3,
    gracefulShutdownTimeout: 15000, // 15초
  };

  private constructor() {
    super();
    systemLogger.system('🖥️ VM MCP 서버 오케스트레이터 초기화');
    this.initializeServices();
    this.setupGracefulShutdown();
  }

  static getInstance(): VMMultiServiceOrchestrator {
    if (!VMMultiServiceOrchestrator.instance) {
      VMMultiServiceOrchestrator.instance = new VMMultiServiceOrchestrator();
    }
    return VMMultiServiceOrchestrator.instance;
  }

  /**
   * 🚀 MCP 서버 시작
   */
  async startAllServices(): Promise<{
    success: boolean;
    message: string;
    services: {
      mcp: boolean;
    };
    totalTime: number;
  }> {
    if (this.isRunning) {
      return {
        success: true,
        message: '⚠️ MCP 서버가 이미 실행 중입니다',
        services: {
          mcp: this.getServiceStatus('mcp')?.status === 'running',
        },
        totalTime: 0,
      };
    }

    const startTime = Date.now();
    systemLogger.system('🚀 MCP 서버 시작 중...');

    try {
      let mcpStarted = false;

      // MCP 서버 시작 (기존 서버 확인 후 필요시 시작)
      if (this.config.enableMCP) {
        mcpStarted = await this.startMCPServer();
        systemLogger.info(
          `📡 MCP 서버: ${mcpStarted ? '시작 완료' : '이미 실행 중 또는 실패'}`
        );
      }

      // 헬스체크 시작
      this.startHealthCheck();

      this.isRunning = true;
      this.isInitialized = true;

      const totalTime = Date.now() - startTime;
      const successMessage = `✅ MCP 서버 시작 완료 (${totalTime}ms)`;

      systemLogger.info(successMessage);
      systemLogger.info('📡 MCP 파일시스템 서버 활성화');
      this.logServicesSummary();

      // 이벤트 발신
      this.emit('servicesStarted', {
        mcp: mcpStarted,
      });

      return {
        success: true,
        message: successMessage,
        services: {
          mcp: mcpStarted,
        },
        totalTime,
      };
    } catch (error) {
      systemLogger.error('❌ MCP 서버 시작 실패:', error);

      // 실패 시 정리
      await this.stopAllServices();

      return {
        success: false,
        message: `❌ MCP 서버 시작 실패: ${error.message}`,
        services: {
          mcp: false,
        },
        totalTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🛑 MCP 서버 종료
   */
  async stopAllServices(): Promise<{
    success: boolean;
    message: string;
    services: {
      mcp: boolean;
    };
    totalTime: number;
  }> {
    if (!this.isRunning) {
      return {
        success: true,
        message: '⚠️ MCP 서버가 이미 정지되어 있습니다',
        services: { mcp: true },
        totalTime: 0,
      };
    }

    const startTime = Date.now();
    systemLogger.system('🛑 MCP 서버 종료 중...');

    try {
      // 헬스체크 중지
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // MCP 서버 종료 (graceful shutdown 시도)
      let mcpStopped = false;
      if (this.getServiceStatus('mcp')?.status === 'running') {
        systemLogger.info('📡 MCP 서버 종료 중...');
        await this.terminateAllProcesses();
        this.updateServiceStatus('mcp', 'stopped');
        mcpStopped = true;
        systemLogger.info('✅ MCP 서버 정상 종료');
      } else {
        mcpStopped = true; // 이미 정지됨
      }

      this.isRunning = false;

      const totalTime = Date.now() - startTime;
      const successMessage = `✅ MCP 서버 종료 완료 (${totalTime}ms)`;

      systemLogger.info(successMessage);

      // 이벤트 발신
      this.emit('servicesStopped', {
        mcp: mcpStopped,
      });

      return {
        success: true,
        message: successMessage,
        services: {
          mcp: mcpStopped,
        },
        totalTime,
      };
    } catch (error) {
      systemLogger.error('❌ MCP 서버 종료 실패:', error);

      return {
        success: false,
        message: `❌ MCP 서버 종료 실패: ${error.message}`,
        services: {
          mcp: false,
        },
        totalTime: Date.now() - startTime,
      };
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
   * 🔄 헬스체크 시작
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        // MCP 서버 헬스체크
        if (this.config.enableMCP) {
          await this.checkMCPServerStatus();
        }

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
      `🔄 헬스체크 시작 (${this.config.healthCheckInterval / 1000}초 간격)`
    );
  }

  /**
   * 🏗️ 서비스 목록 초기화
   */
  private initializeServices(): void {
    this.services.set('mcp', {
      name: 'MCP 서버',
      status: 'stopped',
      port: this.config.mcpPort,
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
      services: Array.from(this.services.entries()).map(([name, status]) => ({
        name,
        status: status.status,
        port: status.port,
        uptime: status.startTime ? Date.now() - status.startTime.getTime() : 0,
        restartCount: status.restartCount,
      })),
      isRunning: this.isRunning,
      lastUpdate: new Date().toISOString(),
    };

    // 상태별 카운트
    this.services.forEach(service => {
      if (service.status === 'running') summary.running++;
      else if (service.status === 'stopped') summary.stopped++;
      else if (service.status === 'error') summary.error++;
    });

    return summary;
  }

  private logServicesSummary(): void {
    const summary = this.getServicesSummary();
    systemLogger.info(
      `📊 서비스 현황: 총 ${summary.total}개, 실행 중 ${summary.running}개, 정지 ${summary.stopped}개, 오류 ${summary.error}개`
    );

    summary.services.forEach(service => {
      const uptimeStr =
        service.uptime > 0
          ? `(업타임: ${Math.round(service.uptime / 1000)}초)`
          : '';
      systemLogger.info(
        `  - ${service.name}: ${service.status} ${service.port ? `포트 ${service.port}` : ''} ${uptimeStr}`
      );
    });
  }

  updateConfig(newConfig: Partial<VMServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    systemLogger.info('⚙️ VM 다중 서비스 설정 업데이트:', newConfig);
  }

  private async startMCPServer(): Promise<boolean> {
    try {
      this.updateServiceStatus('mcp', 'starting');

      // 기존 MCP 서버 확인
      const isAlreadyRunning = await this.checkMCPServerStatus();
      if (isAlreadyRunning) {
        this.updateServiceStatus('mcp', 'running', {
          port: this.config.mcpPort,
          startTime: new Date(),
        });
        systemLogger.info(
          `📡 MCP 서버가 이미 포트 ${this.config.mcpPort}에서 실행 중입니다`
        );
        return true;
      }

      // 새로운 MCP 서버 시작은 여기서 구현하지 않음
      // VM 환경에서는 별도로 관리되는 MCP 서버를 사용
      systemLogger.info('📡 VM 환경의 기존 MCP 서버를 사용합니다');

      this.updateServiceStatus('mcp', 'running', {
        port: this.config.mcpPort,
        startTime: new Date(),
      });

      return true;
    } catch (error) {
      systemLogger.error('❌ MCP 서버 시작 실패:', error);
      this.updateServiceStatus('mcp', 'error');
      return false;
    }
  }
}
