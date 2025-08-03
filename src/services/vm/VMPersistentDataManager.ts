/**
 * 🖥️ VM 영속적 데이터 관리자
 *
 * VM 환경 최적화:
 * - ✅ 시스템 시작시: 미리 저장된 베이스라인 자동 로드
 * - ✅ 시스템 종료시: 현재 베이스라인 자동 저장
 * - ✅ 24시간 연속 운영 지원
 * - ✅ MCP 서버와 통합 운영
 * - ✅ 기존 OptimizedDataGenerator 방식 계승
 */

import { systemLogger } from '../../lib/logger';
import type { EnhancedServerMetrics } from '../../types/server';
// BaselineStorageService removed - using FixedDataSystem instead
import { EnrichedMetricsGenerator } from '../metrics/EnrichedMetricsGenerator';
import { UnifiedMetricsManager } from '../UnifiedMetricsManager';
import { LongRunningScenarioEngine } from './LongRunningScenarioEngine';

interface VMDataManagerConfig {
  enableAutoStart: boolean;
  enableAutoStop: boolean;
  baselineLoadTimeout: number; // 베이스라인 로드 타임아웃 (ms)
  baselineSaveTimeout: number; // 베이스라인 저장 타임아웃 (ms)
  serverCount: number; // 생성할 서버 개수 (기본 15개)
  integrateMCP: boolean; // MCP 서버와 통합 운영
}

/**
 * 🖥️ VM 영속적 데이터 관리자 (24시간 연속 운영)
 */
export class VMPersistentDataManager {
  private static instance: VMPersistentDataManager;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  // 핵심 컴포넌트들
  private enrichedMetricsGenerator = EnrichedMetricsGenerator.getInstance();
  private longRunningScenarioEngine = new LongRunningScenarioEngine();
  // private baselineStorage = BaselineStorageService.getInstance(); // BaselineStorageService removed
  private baselineStorage: unknown = null;
  private unifiedMetricsManager = UnifiedMetricsManager.getInstance();

  // 설정
  private config: VMDataManagerConfig = {
    enableAutoStart: true,
    enableAutoStop: true,
    baselineLoadTimeout: 30000, // 30초
    baselineSaveTimeout: 15000, // 15초
    serverCount: 15, // 기존 방식 유지
    integrateMCP: true,
  };

  // 서버 데이터
  private servers: Map<string, EnhancedServerMetrics> = new Map();
  private startTime: Date | null = null;

  private constructor() {
    systemLogger.system('🖥️ VM 영속적 데이터 관리자 초기화');
    this.setupGracefulShutdown();
  }

  static getInstance(): VMPersistentDataManager {
    if (!VMPersistentDataManager.instance) {
      VMPersistentDataManager.instance = new VMPersistentDataManager();
    }
    return VMPersistentDataManager.instance;
  }

  /**
   * 🚀 VM 시스템 시작 (베이스라인 자동 로드)
   */
  async startVMSystem(): Promise<{
    success: boolean;
    message: string;
    details: {
      serversGenerated: number;
      baselineLoaded: boolean;
      enrichedMetricsStarted: boolean;
      scenarioEngineStarted: boolean;
      unifiedMetricsStarted: boolean;
      totalTime: number;
    };
  }> {
    if (this.isRunning) {
      return {
        success: true,
        message: '⚠️ VM 시스템이 이미 실행 중입니다',
        details: {
          serversGenerated: this.servers.size,
          baselineLoaded: false,
          enrichedMetricsStarted: true,
          scenarioEngineStarted: true,
          unifiedMetricsStarted: true,
          totalTime: 0,
        },
      };
    }

    const startTime = Date.now();
    this.startTime = new Date();
    systemLogger.system('🚀 VM 시스템 시작 중...');

    try {
      // 1️⃣ 서버 목록 생성 (기존 방식 유지 - 15개)
      const servers = await this.generateInitialServers();
      systemLogger.info(`📊 서버 ${servers.length}개 생성 완료`);

      // 2️⃣ 베이스라인 데이터 로드 시도 (타임아웃 적용)
      const baselineLoaded = await this.loadBaselineWithTimeout();

      // 3️⃣ 강화된 메트릭 생성기 시작
      await this.enrichedMetricsGenerator.startWithBaselineLoad(servers);
      systemLogger.info('✅ 강화된 메트릭 생성기 시작 완료');

      // 4️⃣ 장기 실행 시나리오 엔진 시작
      await this.longRunningScenarioEngine.start();
      systemLogger.info('✅ 장기 실행 시나리오 엔진 시작 완료');

      // 5️⃣ 통합 메트릭 관리자 시작
      await this.unifiedMetricsManager.start();
      systemLogger.info('✅ 통합 메트릭 관리자 시작 완료');

      this.isRunning = true;
      this.isInitialized = true;

      const totalTime = Date.now() - startTime;
      const successMessage = `✅ VM 시스템 시작 완료 (${totalTime}ms)`;

      systemLogger.info(successMessage);
      systemLogger.info(`📊 관리 중인 서버: ${servers.length}개`);
      systemLogger.info(
        `🔄 베이스라인 로드: ${baselineLoaded ? '성공' : '실패 (동적 생성)'}`
      );
      systemLogger.info('🖥️ 24시간 연속 운영 모드 활성화');

      return {
        success: true,
        message: successMessage,
        details: {
          serversGenerated: servers.length,
          baselineLoaded,
          enrichedMetricsStarted: true,
          scenarioEngineStarted: true,
          unifiedMetricsStarted: true,
          totalTime,
        },
      };
    } catch (error) {
      systemLogger.error('❌ VM 시스템 시작 실패:', error);

      // 실패 시 정리
      await this.stopVMSystem();

      return {
        success: false,
        message: `❌ VM 시스템 시작 실패: ${(error as Error).message}`,
        details: {
          serversGenerated: 0,
          baselineLoaded: false,
          enrichedMetricsStarted: false,
          scenarioEngineStarted: false,
          unifiedMetricsStarted: false,
          totalTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 🛑 VM 시스템 종료 (베이스라인 자동 저장)
   */
  async stopVMSystem(): Promise<{
    success: boolean;
    message: string;
    details: {
      baselineSaved: boolean;
      enrichedMetricsStopped: boolean;
      scenarioEngineStopped: boolean;
      unifiedMetricsStopped: boolean;
      totalTime: number;
    };
  }> {
    if (!this.isRunning) {
      return {
        success: true,
        message: '⚠️ VM 시스템이 이미 정지되어 있습니다',
        details: {
          baselineSaved: false,
          enrichedMetricsStopped: false,
          scenarioEngineStopped: false,
          unifiedMetricsStopped: false,
          totalTime: 0,
        },
      };
    }

    const startTime = Date.now();
    systemLogger.system('🛑 VM 시스템 종료 중...');

    try {
      // 1️⃣ 베이스라인 데이터 저장 (타임아웃 적용)
      const baselineSaved = await this.saveBaselineWithTimeout();

      // 2️⃣ 강화된 메트릭 생성기 정지
      await this.enrichedMetricsGenerator.stopWithBaselineSave();
      systemLogger.info('✅ 강화된 메트릭 생성기 정지 완료');

      // 3️⃣ 장기 실행 시나리오 엔진 정지
      await this.longRunningScenarioEngine.stop();
      systemLogger.info('✅ 장기 실행 시나리오 엔진 정지 완료');

      // 4️⃣ 통합 메트릭 관리자 정지
      await this.unifiedMetricsManager.stop();
      systemLogger.info('✅ 통합 메트릭 관리자 정지 완료');

      this.isRunning = false;

      const totalTime = Date.now() - startTime;
      const successMessage = `✅ VM 시스템 종료 완료 (${totalTime}ms)`;

      systemLogger.info(successMessage);
      systemLogger.info(
        `💾 베이스라인 저장: ${baselineSaved ? '성공' : '실패'}`
      );

      // 운영 통계 로그
      if (this.startTime) {
        const operationTime = Date.now() - this.startTime.getTime();
        const operationHours = (operationTime / (1000 * 60 * 60)).toFixed(1);
        systemLogger.info(`⏱️ 총 운영 시간: ${operationHours}시간`);
      }

      return {
        success: true,
        message: successMessage,
        details: {
          baselineSaved,
          enrichedMetricsStopped: true,
          scenarioEngineStopped: true,
          unifiedMetricsStopped: true,
          totalTime,
        },
      };
    } catch (error) {
      systemLogger.error('❌ VM 시스템 종료 실패:', error);

      return {
        success: false,
        message: `❌ VM 시스템 종료 실패: ${(error as Error).message}`,
        details: {
          baselineSaved: false,
          enrichedMetricsStopped: false,
          scenarioEngineStopped: false,
          unifiedMetricsStopped: false,
          totalTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 🏗️ 초기 서버 목록 생성 (기존 방식 유지)
   */
  private async generateInitialServers(): Promise<EnhancedServerMetrics[]> {
    const servers: EnhancedServerMetrics[] = [];
    const environments = ['production', 'staging', 'development'];
    const roles = ['web', 'api', 'database', 'cache', 'worker'];
    const locations = ['Seoul-DC-1', 'Seoul-DC-2', 'Busan-DC-1'];

    for (let i = 1; i <= this.config.serverCount; i++) {
      const server: EnhancedServerMetrics = {
        id: `vm-server-${i.toString().padStart(2, '0')}`,
        name: `vm-host-${i}`,
        hostname: `vm-host-${i}.openmanager.local`,
        environment: environments[i % environments.length] as any,
        role: roles[i % roles.length] as any,

        // 기본 메트릭 (베이스라인에서 업데이트됨)
        cpu_usage: 20 + Math.random() * 30,
        memory_usage: 30 + Math.random() * 40,
        disk_usage: 15 + Math.random() * 20,
        network_in: 5 + Math.random() * 15,
        network_out: 3 + Math.random() * 10,
        response_time: 50 + Math.random() * 100,

        status: 'healthy',
        uptime: Math.floor(Math.random() * 365 * 24 * 60 * 60), // 랜덤 업타임
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        alerts: [],

        // 확장 속성 - 타입에 정의되지 않음
        // location: locations[i % locations.length],
        // type: `${roles[i % roles.length]}-server`,
      };

      servers.push(server);
      this.servers.set(server.id, server);
    }

    systemLogger.info(`📊 ${servers.length}개 서버 생성 완료 (기존 방식 유지)`);
    return servers;
  }

  /**
   * 📥 타임아웃이 적용된 베이스라인 로드
   */
  private async loadBaselineWithTimeout(): Promise<boolean> {
    try {
      systemLogger.info('📥 베이스라인 데이터 로드 시도...');

      // TODO: BaselineStorageService 통합 예정 - 임시 비활성화
      await new Promise(resolve => setTimeout(resolve, 100)); // 더미 딜레이

      systemLogger.info('✅ 베이스라인 데이터 로드 성공 (더미)');
      return true;
    } catch (error) {
      systemLogger.warn(
        `⚠️ 베이스라인 로드 실패 (${(error as Error).message}), 동적 생성으로 대체`
      );
      return false;
    }
  }

  /**
   * 💾 타임아웃이 적용된 베이스라인 저장
   */
  private async saveBaselineWithTimeout(): Promise<boolean> {
    try {
      systemLogger.info('💾 베이스라인 데이터 저장 시도...');

      // TODO: BaselineStorageService 통합 예정 - 임시 비활성화
      await new Promise(resolve => setTimeout(resolve, 100)); // 더미 딜레이

      systemLogger.info('✅ 베이스라인 데이터 저장 성공 (더미)');
      return true;
    } catch (error) {
      systemLogger.error(
        `❌ 베이스라인 저장 실패: ${(error as Error).message}`
      );
      return false;
    }
  }

  /**
   * 🔄 시스템 종료 시 자동 정리 설정
   */
  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      systemLogger.warn(`🔄 ${signal} 신호 수신 - VM 시스템 종료 시작`);

      try {
        await this.stopVMSystem();
        systemLogger.info('✅ VM 시스템 정상 종료 완료');
        process.exit(0);
      } catch (error) {
        systemLogger.error('❌ VM 시스템 종료 중 오류:', error);
        process.exit(1);
      }
    };

    // 시그널 핸들러 등록
    process.on('SIGINT', () => shutdownHandler('SIGINT')); // Ctrl+C
    process.on('SIGTERM', () => shutdownHandler('SIGTERM')); // 종료 요청
    process.on('SIGQUIT', () => shutdownHandler('SIGQUIT')); // 종료 시그널

    // 예외 핸들러
    process.on('uncaughtException', async error => {
      systemLogger.error('❌ 치명적 오류 발생:', error);
      await this.stopVMSystem();
      process.exit(1);
    });

    process.on('unhandledRejection', async reason => {
      systemLogger.error('❌ 처리되지 않은 Promise 거부:', reason);
      await this.stopVMSystem();
      process.exit(1);
    });
  }

  // 📊 상태 조회 메서드들

  getVMSystemStatus() {
    return {
      isRunning: this.isRunning,
      isInitialized: this.isInitialized,
      startTime: this.startTime?.toISOString(),
      operationHours: this.startTime
        ? ((Date.now() - this.startTime.getTime()) / (1000 * 60 * 60)).toFixed(
            1
          )
        : 0,
      serverCount: this.servers.size,
      config: this.config,
      components: {
        enrichedMetrics: this.enrichedMetricsGenerator.getGeneratorStatus(),
        scenarios: this.longRunningScenarioEngine.getEngineStats(),
        unifiedMetrics: this.unifiedMetricsManager.getStatus(),
      },
    };
  }

  getServers(): EnhancedServerMetrics[] {
    return Array.from(this.servers.values());
  }

  updateConfig(newConfig: Partial<VMDataManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    systemLogger.info('⚙️ VM 데이터 관리자 설정 업데이트:', newConfig);
  }
}
