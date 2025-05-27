/**
 * 🏗️ Service Registry
 * 
 * 서비스 등록 및 초기화 시스템
 * - 모든 서비스를 DI 컨테이너에 등록
 * - 서비스 간 의존성 관리
 * - 애플리케이션 라이프사이클 관리
 */

import { container, SERVICE_TOKENS, registerService, registerFactory } from './di-container';
import { LoggingService } from '@/services/LoggingService';
import { ErrorHandlingService } from '@/services/ErrorHandlingService';
import { VirtualServerManager } from '@/services/VirtualServerManager';
import { AlertSystem } from '@/services/AlertSystem';
import { VirtualServerDataAdapter } from '@/services/ai/VirtualServerDataAdapter';
import { UnifiedDataCollectionService } from '@/services/UnifiedDataCollectionService';
import { SmartCacheService } from '@/services/SmartCacheService';
import { TestFramework } from '@/testing/TestFramework';
import { ConfigLoader } from '@/config';
import { 
  ILogger, 
  IErrorHandler, 
  IVirtualServerManager, 
  IAlertSystem, 
  IVirtualServerDataAdapter,
  IConfigLoader 
} from '@/interfaces/services';

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private isInitialized = false;
  private initializationPromise?: Promise<void>;

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * 모든 서비스 등록
   */
  async registerServices(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doRegisterServices();
    await this.initializationPromise;
  }

  /**
   * 실제 서비스 등록 로직
   */
  private async doRegisterServices(): Promise<void> {
    console.log('🏗️ Registering services...');

    try {
      // 1. 기본 서비스들 (의존성 없음)
      this.registerCoreServices();

      // 2. 로깅 서비스 (기본 서비스)
      this.registerLoggingService();

      // 3. 에러 처리 서비스 (로깅 서비스 의존)
      this.registerErrorHandlingService();

      // 4. 설정 서비스
      this.registerConfigService();

      // 5. 데이터 서비스들
      this.registerDataServices();

      // 6. 알림 서비스
      this.registerAlertService();

      // 7. AI 서비스들
      this.registerAIServices();

      // 8. 추가 서비스들
      this.registerAdditionalServices();

      this.isInitialized = true;
      console.log('✅ All services registered successfully');

    } catch (error) {
      console.error('❌ Service registration failed:', error);
      throw error;
    }
  }

  /**
   * 핵심 서비스 등록
   */
  private registerCoreServices(): void {
    // 설정 로더 (팩토리 방식)
    registerFactory(
      SERVICE_TOKENS.CONFIG_LOADER,
      () => ConfigLoader.getInstance(),
      'singleton'
    );
  }

  /**
   * 로깅 서비스 등록
   */
  private registerLoggingService(): void {
    registerService(
      SERVICE_TOKENS.LOGGER,
      LoggingService,
      'singleton'
    );
  }

  /**
   * 에러 처리 서비스 등록
   */
  private registerErrorHandlingService(): void {
    registerFactory(
      SERVICE_TOKENS.ERROR_HANDLER,
      () => {
        const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
        return new ErrorHandlingService(logger);
      },
      'singleton',
      [SERVICE_TOKENS.LOGGER]
    );
  }

  /**
   * 설정 서비스 등록
   */
  private registerConfigService(): void {
    // ConfigLoader는 이미 등록됨
  }

  /**
   * 데이터 서비스 등록
   */
  private registerDataServices(): void {
    // Unified Data Collection Service (새로운 통합 서비스)
    registerFactory(
      SERVICE_TOKENS.UNIFIED_DATA_COLLECTION,
      () => {
        const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
        const errorHandler = container.resolve<IErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
        return new UnifiedDataCollectionService(logger, errorHandler);
      },
      'singleton',
      [SERVICE_TOKENS.LOGGER, SERVICE_TOKENS.ERROR_HANDLER]
    );

    // Virtual Server Manager (레거시 - 점진적 마이그레이션)
    registerService(
      SERVICE_TOKENS.VIRTUAL_SERVER_MANAGER,
      VirtualServerManager,
      'singleton'
    );

    // Virtual Server Data Adapter (레거시 - 점진적 마이그레이션)
    registerFactory(
      SERVICE_TOKENS.VIRTUAL_SERVER_DATA_ADAPTER,
      () => VirtualServerDataAdapter.getInstance(),
      'singleton'
    );
  }

  /**
   * 알림 서비스 등록
   */
  private registerAlertService(): void {
    registerFactory(
      SERVICE_TOKENS.ALERT_SYSTEM,
      () => AlertSystem.getInstance(),
      'singleton'
    );
  }

  /**
   * AI 서비스 등록
   */
  private registerAIServices(): void {
    // AI Analysis Service (향후 구현)
    registerFactory(
      SERVICE_TOKENS.AI_ANALYSIS_SERVICE,
      () => {
        // 임시 구현
        return {
          analyze: async () => ({ id: 'temp', type: 'temp', timestamp: new Date(), status: 'success' }),
          getAnalysisHistory: async () => [],
          getAnalysisById: async () => null,
          cancelAnalysis: async () => {},
          isAnalyzing: () => false
        };
      },
      'singleton'
    );

    // AI Agent Engine (향후 구현)
    registerFactory(
      SERVICE_TOKENS.AI_AGENT_ENGINE,
      () => {
        // 임시 구현
        return {
          processQuery: async () => ({ response: 'AI response' }),
          startLearning: () => {},
          stopLearning: () => {},
          getCapabilities: () => ['analysis', 'prediction'],
          getStatus: () => ({ status: 'ready' }),
          configure: () => {}
        };
      },
      'singleton'
    );
  }

  /**
   * 추가 서비스 등록
   */
  private registerAdditionalServices(): void {
    // Smart Cache Service
    registerFactory(
      SERVICE_TOKENS.CACHE_SERVICE,
      () => {
        const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
        return new SmartCacheService(logger, {
          maxSize: 2000,
          defaultTtl: 300000, // 5분
          evictionStrategy: 'lru',
          enableCompression: true,
          compressionThreshold: 1024,
          enableStats: true,
          cleanupInterval: 60000 // 1분
        });
      },
      'singleton',
      [SERVICE_TOKENS.LOGGER]
    );

    // Storage Service (향후 구현)
    registerFactory(
      SERVICE_TOKENS.STORAGE_SERVICE,
      () => {
        // 임시 localStorage 기반 구현
        return {
          get: async (key: string) => {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
          },
          set: async (key: string, value: any) => {
            localStorage.setItem(key, JSON.stringify(value));
          },
          delete: async (key: string) => {
            localStorage.removeItem(key);
          },
          exists: async (key: string) => {
            return localStorage.getItem(key) !== null;
          },
          clear: async () => {
            localStorage.clear();
          },
          keys: async () => {
            return Object.keys(localStorage);
          },
          size: async () => {
            return Object.keys(localStorage).length;
          }
        };
      },
      'singleton'
    );

    // Health Check Service (향후 구현)
    registerFactory(
      SERVICE_TOKENS.HEALTH_CHECK_SERVICE,
      () => {
        const checks = new Map<string, () => Promise<any>>();
        
        return {
          check: async () => ({
            status: 'healthy' as const,
            checks: {},
            timestamp: new Date(),
            uptime: Date.now(),
            version: '1.0.0'
          }),
          addCheck: (name: string, checkFn: () => Promise<any>) => {
            checks.set(name, checkFn);
          },
          removeCheck: (name: string) => {
            checks.delete(name);
          },
          getChecks: () => Array.from(checks.keys()),
          isHealthy: async () => true,
          startPeriodicCheck: () => {},
          stopPeriodicCheck: () => {}
        };
      },
      'singleton'
    );

    // Test Framework
    registerFactory(
      SERVICE_TOKENS.TEST_FRAMEWORK,
      () => {
        const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
        const errorHandler = container.resolve<IErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
        const testFramework = new TestFramework(logger, errorHandler);
        
        // 서비스 테스트 스위트 자동 생성
        testFramework.createServiceTestSuites();
        
        return testFramework;
      },
      'singleton',
      [SERVICE_TOKENS.LOGGER, SERVICE_TOKENS.ERROR_HANDLER]
    );

    // Metrics Collector (향후 구현)
    registerFactory(
      SERVICE_TOKENS.METRICS_COLLECTOR,
      () => {
        return {
          collect: async () => ({
            server_id: 'temp',
            timestamp: new Date(),
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 0,
            network_in: 0,
            network_out: 0,
            response_time: 0,
            active_connections: 0,
            status: 'healthy' as const,
            alerts: []
          }),
          collectBatch: async () => [],
          startCollection: () => {},
          stopCollection: () => {},
          isCollecting: () => false
        };
      },
      'singleton'
    );

    // Metrics Bridge (향후 구현)
    registerFactory(
      SERVICE_TOKENS.METRICS_BRIDGE,
      () => {
        return {
          sendMetrics: async () => {},
          getMetrics: async () => [],
          isConnected: () => false,
          connect: async () => {},
          disconnect: () => {}
        };
      },
      'singleton'
    );
  }

  /**
   * 서비스 초기화
   */
  async initializeServices(): Promise<void> {
    console.log('🚀 Initializing services...');

    try {
      // 1. 로깅 서비스 초기화
      const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
      logger.info('Logging service initialized');

      // 2. 에러 처리 서비스 초기화
      const errorHandler = container.resolve<IErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
      logger.info('Error handling service initialized');

      // 3. Unified Data Collection Service 초기화
      const unifiedDataCollection = container.resolve<any>(SERVICE_TOKENS.UNIFIED_DATA_COLLECTION);
      await unifiedDataCollection.initialize();
      logger.info('Unified Data Collection Service initialized');

      // 4. Virtual Server Manager 초기화 (레거시)
      const virtualServerManager = container.resolve<IVirtualServerManager>(SERVICE_TOKENS.VIRTUAL_SERVER_MANAGER);
      await virtualServerManager.initialize();
      logger.info('Virtual Server Manager initialized');

      // 5. Alert System 초기화
      const alertSystem = container.resolve<IAlertSystem>(SERVICE_TOKENS.ALERT_SYSTEM);
      alertSystem.startMonitoring();
      logger.info('Alert System initialized');

      // 6. 추가 서비스들 초기화
      logger.info('Additional services initialized');

      console.log('✅ All services initialized successfully');

    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * 서비스 정리
   */
  async cleanupServices(): Promise<void> {
    console.log('🧹 Cleaning up services...');

    try {
      // Unified Data Collection Service 정리
      if (container.isRegistered(SERVICE_TOKENS.UNIFIED_DATA_COLLECTION)) {
        const unifiedDataCollection = container.resolve<any>(SERVICE_TOKENS.UNIFIED_DATA_COLLECTION);
        await unifiedDataCollection.cleanup();
      }

      // Alert System 정리
      if (container.isRegistered(SERVICE_TOKENS.ALERT_SYSTEM)) {
        const alertSystem = container.resolve<IAlertSystem>(SERVICE_TOKENS.ALERT_SYSTEM);
        alertSystem.stopMonitoring();
      }

      // Virtual Server Manager 정리 (레거시)
      if (container.isRegistered(SERVICE_TOKENS.VIRTUAL_SERVER_MANAGER)) {
        const virtualServerManager = container.resolve<IVirtualServerManager>(SERVICE_TOKENS.VIRTUAL_SERVER_MANAGER);
        virtualServerManager.stopRealtimeGeneration();
      }

      // 로그 정리
      if (container.isRegistered(SERVICE_TOKENS.LOGGER)) {
        const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
        logger.info('Services cleanup completed');
      }

      console.log('✅ Services cleanup completed');

    } catch (error) {
      console.error('❌ Service cleanup failed:', error);
    }
  }

  /**
   * 서비스 상태 확인
   */
  getServiceStatus(): {
    registered: string[];
    initialized: boolean;
    healthy: boolean;
  } {
    return {
      registered: container.getRegisteredServices().map(token => String(token)),
      initialized: this.isInitialized,
      healthy: this.isInitialized && container.getRegisteredServices().length > 0
    };
  }

  /**
   * 특정 서비스 해결
   */
  resolve<T>(token: string | symbol): T {
    return container.resolve<T>(token);
  }

  /**
   * 서비스 등록 여부 확인
   */
  isRegistered(token: string | symbol): boolean {
    return container.isRegistered(token);
  }
}

// 편의 함수들
export const serviceRegistry = ServiceRegistry.getInstance();

export async function initializeApplication(): Promise<void> {
  await serviceRegistry.registerServices();
  await serviceRegistry.initializeServices();
}

export async function cleanupApplication(): Promise<void> {
  await serviceRegistry.cleanupServices();
}

export function getService<T>(token: string | symbol): T {
  return serviceRegistry.resolve<T>(token);
}

// 타입 안전한 서비스 접근자들
export const getLogger = (): ILogger => getService<ILogger>(SERVICE_TOKENS.LOGGER);
export const getErrorHandler = (): IErrorHandler => getService<IErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);
export const getVirtualServerManager = (): IVirtualServerManager => getService<IVirtualServerManager>(SERVICE_TOKENS.VIRTUAL_SERVER_MANAGER);
export const getAlertSystem = (): IAlertSystem => getService<IAlertSystem>(SERVICE_TOKENS.ALERT_SYSTEM);
export const getVirtualServerDataAdapter = (): IVirtualServerDataAdapter => getService<IVirtualServerDataAdapter>(SERVICE_TOKENS.VIRTUAL_SERVER_DATA_ADAPTER);
export const getConfigLoader = (): IConfigLoader => getService<IConfigLoader>(SERVICE_TOKENS.CONFIG_LOADER); 