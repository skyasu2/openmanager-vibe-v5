/**
 * 🏗️ Service Registry
 *
 * 서비스 등록 및 초기화 시스템
 * - 모든 서비스를 DI 컨테이너에 등록
 * - 서비스 간 의존성 관리
 * - 애플리케이션 라이프사이클 관리
 */

import { ConfigLoader } from '@/config';
import { getCacheService } from '@/lib/cache/cache-helper';
import type { IConfigLoader, ILogger } from '@/lib/interfaces/services';
import { logger } from '@/lib/logging';
import { LoggingService } from '@/services/LoggingService';
import {
  container,
  registerFactory,
  registerService,
  SERVICE_TOKENS,
} from './di-container';

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private isInitialized = false;
  private _initializationPromise?: Promise<void>;

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

    if (
      this._initializationPromise !== null &&
      this._initializationPromise !== undefined
    ) {
      return this._initializationPromise;
    }

    this._initializationPromise = this.doRegisterServices();
    await this._initializationPromise;
  }

  /**
   * 실제 서비스 등록 로직
   */
  private async doRegisterServices(): Promise<void> {
    logger.info('🏗️ Registering services...');

    try {
      // 1. 기본 서비스들 (의존성 없음)
      this.registerCoreServices();

      // 2. 로깅 서비스 (기본 서비스)
      this.registerLoggingService();

      // 3. 설정 서비스
      this.registerConfigService();

      // 5. 추가 서비스들
      this.registerAdditionalServices();

      this.isInitialized = true;
      logger.info('✅ All services registered successfully');
    } catch (error) {
      logger.error('❌ Service registration failed:', error);
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
    registerService(SERVICE_TOKENS.LOGGER, LoggingService, 'singleton');
  }

  /**
   * 설정 서비스 등록
   */
  private registerConfigService(): void {
    // ConfigLoader는 이미 등록됨
  }

  /**
   * 추가 서비스 등록
   */
  private registerAdditionalServices(): void {
    // Memory Cache Service (Redis 제거 후 메모리 기반 캐시 사용)
    registerFactory(
      SERVICE_TOKENS.CACHE_SERVICE,
      () => {
        // MemoryCacheService 인스턴스 반환
        return getCacheService();
      },
      'singleton'
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
          set: async (key: string, value: unknown) => {
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
          },
        };
      },
      'singleton'
    );

    // Health Check Service (향후 구현)
    registerFactory(
      SERVICE_TOKENS.HEALTH_CHECK_SERVICE,
      () => {
        const checks = new Map<string, () => Promise<unknown>>();

        return {
          check: async () => ({
            status: 'healthy' as const,
            checks: {},
            timestamp: new Date(),
            uptime: Date.now(),
            version: '1.0.0',
          }),
          addCheck: (name: string, checkFn: () => Promise<unknown>) => {
            checks.set(name, checkFn);
          },
          removeCheck: (name: string) => {
            checks.delete(name);
          },
          getChecks: () => Array.from(checks.keys()),
          isHealthy: async () => true,
          startPeriodicCheck: () => {},
          stopPeriodicCheck: () => {},
        };
      },
      'singleton'
    );

    // Metrics Collector (향후 구현)
    registerFactory(
      SERVICE_TOKENS.METRICS_COLLECTOR,
      () => {
        return {
          collect: async (): Promise<unknown> => ({
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
            alerts: [],
          }),
          collectBatch: async (): Promise<unknown[]> => [],
          startCollection: () => {},
          stopCollection: () => {},
          isCollecting: () => false,
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
          getMetrics: async (): Promise<unknown[]> => [],
          isConnected: () => false,
          connect: async () => {},
          disconnect: () => {},
        };
      },
      'singleton'
    );
  }

  /**
   * 서비스 초기화
   */
  async _initializeServices(): Promise<void> {
    logger.info('🚀 Initializing services...');

    try {
      // 1. 로깅 서비스 초기화
      const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
      logger.info('Logging service _initialized');

      // 2. 추가 서비스들 초기화
      logger.info('Additional services _initialized');

      logger.info('✅ All services _initialized successfully');
    } catch (error) {
      logger.error('❌ Service _initialization failed:', error);
      throw error;
    }
  }

  /**
   * 서비스 정리
   */
  async cleanupServices(): Promise<void> {
    logger.info('🧹 Cleaning up services...');

    try {
      // 로그 정리
      if (container.isRegistered(SERVICE_TOKENS.LOGGER)) {
        const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
        logger.info('Services cleanup completed');
      }

      logger.info('✅ Services cleanup completed');
    } catch (error) {
      logger.error('❌ Service cleanup failed:', error);
    }
  }

  /**
   * 서비스 상태 확인
   */
  getServiceStatus(): {
    registered: string[];
    _initialized: boolean;
    healthy: boolean;
  } {
    return {
      registered: container
        .getRegisteredServices()
        .map((token) => String(token)),
      _initialized: this.isInitialized,
      healthy:
        this.isInitialized && container.getRegisteredServices().length > 0,
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

export async function _initializeApplication(): Promise<void> {
  await serviceRegistry.registerServices();
  await serviceRegistry._initializeServices();
}

export async function cleanupApplication(): Promise<void> {
  await serviceRegistry.cleanupServices();
}

export function getService<T>(token: string | symbol): T {
  return serviceRegistry.resolve<T>(token);
}

// 타입 안전한 서비스 접근자들
export const getLogger = (): ILogger =>
  getService<ILogger>(SERVICE_TOKENS.LOGGER);
export const getConfigLoader = (): IConfigLoader =>
  getService<IConfigLoader>(SERVICE_TOKENS.CONFIG_LOADER);
