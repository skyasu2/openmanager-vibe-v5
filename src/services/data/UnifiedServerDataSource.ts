/**
 * 🎯 Unified Server Data Source
 *
 * Single Source of Truth for all server-related data in the application.
 * Manages caching, validation, and data synchronization between client/server.
 *
 * @created 2025-12-01
 * @author AI Assistant
 * @version 2.0.0 (SSOT Architecture Implemented)
 */

import { SystemConfigurationManager } from '@/config/SystemConfiguration';
// 🎯 Scenario-based failure data (Single Source of Truth)
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';
import type { Server } from '@/types/server';

export interface ServerDataSourceConfig {
  totalServers: number;
  dataSource: 'basic' | 'expanded' | 'custom';
  enableValidation: boolean;
  enableCaching: boolean;
  cacheTtl: number;
}

export interface ServerDataMetrics {
  totalServers: number;
  onlineServers: number;
  warningServers: number;
  criticalServers: number;
  lastUpdated: string;
  dataSource: string;
}

/**
 * 🔄 통합 서버 데이터 소스 클래스 (싱글톤)
 */
export class UnifiedServerDataSource {
  private static instance: UnifiedServerDataSource;
  private config: ServerDataSourceConfig;
  private cachedServers: Server[] | null = null;
  private cacheTimestamp: number = 0;
  private systemConfig: SystemConfigurationManager;

  private constructor() {
    this.systemConfig = SystemConfigurationManager.getInstance();
    this.config = this.loadDataSourceConfig();

    if (process.env.NODE_ENV !== 'production') {
      console.log('🎯 UnifiedServerDataSource initialized:', {
        totalServers: this.config.totalServers,
        dataSource: this.config.dataSource,
        cacheTtl: `${this.config.cacheTtl / 1000}s`,
      });
    }
  }

  public static getInstance(): UnifiedServerDataSource {
    if (!UnifiedServerDataSource.instance) {
      UnifiedServerDataSource.instance = new UnifiedServerDataSource();
    }
    return UnifiedServerDataSource.instance;
  }

  /**
   * 📋 데이터 소스 설정 로드
   */
  private loadDataSourceConfig(): ServerDataSourceConfig {
    const systemConfig = this.systemConfig.getAll();

    return {
      totalServers: systemConfig.totalServers,
      dataSource: systemConfig.mockSystem.dataSource,
      enableValidation: systemConfig.environment.mode !== 'production',
      enableCaching: systemConfig.performance.enableCache,
      cacheTtl: systemConfig.performance.cacheTtlMs,
    };
  }

  /**
   * 🎯 서버 데이터 조회 (메인 인터페이스)
   *
   * **Single Source of Truth**: 모든 서버 데이터는 scenario-loader를 통해 제공됩니다.
   *
   * @returns {Promise<Server[]>} 15개 서버 데이터 (24시간 회전 JSON)
   *
   * @description
   * - 서버 사이드: `scenario-loader` → `hourly-data/hour-*.json` (fs 모듈 사용)
   * - 클라이언트 사이드: `/api/servers-unified` API 사용 (브라우저 호환)
   * - 캐싱: 5분 TTL (성능 최적화)
   * - 검증: 서버 수 및 필수 필드 확인
   *
   * @example
   * // ✅ 올바른 사용 (싱글톤 패턴)
   * const dataSource = UnifiedServerDataSource.getInstance();
   * const servers = await dataSource.getServers();
   *
   * @example
   * // ✅ 올바른 사용 (편의 함수)
   * import { getServersFromUnifiedSource } from '@/services/data/UnifiedServerDataSource';
   * const servers = await getServersFromUnifiedSource();
   *
   * @see {@link loadHourlyScenarioData} 실제 데이터 소스
   * @see {@link docs/core/architecture/data-architecture.md} 아키텍처 가이드
   */
  public async getServers(): Promise<Server[]> {
    // 캐시 확인
    if (this.isCacheValid() && this.cachedServers) {
      return this.cachedServers;
    }

    // 🚀 클라이언트 사이드 감지: 브라우저에서는 API 사용 (fs 모듈 없음)
    if (typeof window !== 'undefined') {
      return this.loadServersFromAPI();
    }

    // 서버 사이드: 파일 시스템 직접 접근
    const servers = await this.loadServersFromSource();

    // 검증
    if (this.config.enableValidation) {
      this.validateServers(servers);
    }

    // 캐싱
    if (this.config.enableCaching) {
      this.cachedServers = servers;
      this.cacheTimestamp = Date.now();
    }

    return servers;
  }

  /**
   * 🌐 클라이언트 사이드 API 호출 (브라우저 환경용)
   *
   * 브라우저에서는 fs 모듈을 사용할 수 없으므로 API를 통해 데이터 로드
   */
  private async loadServersFromAPI(): Promise<Server[]> {
    try {
      const response = await fetch('/api/servers-unified?limit=50');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch data from API');
      }

      const servers = result.data as Server[];

      // 캐싱
      if (this.config.enableCaching) {
        this.cachedServers = servers;
        this.cacheTimestamp = Date.now();
      }

      console.log(
        `✅ [Client] Loaded ${servers.length} servers from /api/servers-unified`
      );
      return servers;
    } catch (error) {
      console.error('❌ [Client] API fetch failed:', error);
      // 캐시된 데이터가 있으면 반환
      if (this.cachedServers && this.cachedServers.length > 0) {
        console.warn('⚠️ [Client] Using stale cache due to API error');
        return this.cachedServers;
      }
      throw error;
    }
  }

  /**
   * 📊 서버 메트릭 조회
   */
  public async getServerMetrics(): Promise<ServerDataMetrics> {
    const servers = await this.getServers();

    const metrics: ServerDataMetrics = {
      totalServers: servers.length,
      onlineServers: servers.filter((s) => s.status === 'online').length,
      warningServers: servers.filter((s) => s.status === 'warning').length,
      criticalServers: servers.filter((s) => s.status === 'critical').length,
      lastUpdated: new Date().toISOString(),
      dataSource: `${this.config.dataSource}-${this.config.totalServers}`,
    };

    return metrics;
  }

  /**
   * 🔄 동기 래퍼: 캐시된 서버 데이터 반환 (MockContextLoader용)
   *
   * Single Source of Truth: scenario-loader 기반 캐시 데이터 동기 접근
   *
   * @returns 캐시된 서버 데이터 또는 빈 배열 (캐시 미준비 시)
   */
  public getCachedServersSync(): Server[] {
    if (
      !this.isCacheValid() ||
      !this.cachedServers ||
      this.cachedServers.length === 0
    ) {
      console.warn('⚠️ getCachedServersSync(): Cache not ready or empty');
      return [];
    }
    return this.cachedServers;
  }

  /**
   * 🔄 서버 데이터 로드 (scenario-loader 사용 -> fixed-24h-metrics로 변경)
   */
  private async loadServersFromSource(): Promise<Server[]> {
    // 🎯 Single Source of Truth: fixed-24h-metrics 사용
    return this.loadFromFixedSource();
  }

  /**
   * 🎛️ 데이터 소스 로드 (Fixed 24h Metrics)
   * 🎯 Single Source of Truth: scenario-loader를 대체하여 `src/data/fixed-24h-metrics.ts` 사용
   */
  private async loadFromFixedSource(): Promise<Server[]> {
    const { getDataAtMinute, FIXED_24H_DATASETS } = await import(
      '@/data/fixed-24h-metrics'
    );

    // 현재 시간 계산 (KST 기준 분)
    const now = new Date();
    // KST 시간 보정 (UTC+9)
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const kstGap = 9 * 60 * 60 * 1000;
    const kstDate = new Date(utc + kstGap);

    const currentHour = kstDate.getHours();
    const currentMinute = kstDate.getMinutes();
    const minuteOfDay = currentHour * 60 + currentMinute; // 0 ~ 1439

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `🔄 Loading fixed metrics for minute: ${minuteOfDay} (${currentHour}:${currentMinute})`
      );
    }

    // 고정 데이터셋을 Server 타입으로 변환
    const servers: Server[] = FIXED_24H_DATASETS.map((dataset) => {
      // 해당 분(minute)의 데이터 가져오기
      const dataPoint = getDataAtMinute(dataset, minuteOfDay);

      // 데이터가 없으면 기본값 (0)
      const cpu = dataPoint?.cpu ?? 0;
      const memory = dataPoint?.memory ?? 0;
      const disk = dataPoint?.disk ?? 0;
      const network = dataPoint?.network ?? 0;
      const logs = dataPoint?.logs ?? [];

      // Status 결정 (CPU 기준 단순화)
      let status: 'online' | 'warning' | 'critical' = 'online';
      if (cpu >= 80) status = 'critical';
      else if (cpu >= 60) status = 'warning';

      return {
        id: dataset.serverId,
        name: dataset.serverId, // 이름이 없으면 ID 사용
        hostname: `${dataset.serverId.toLowerCase()}.internal`,
        type: dataset.serverType,
        status,
        cpu,
        memory,
        disk,
        network,
        uptime: 86400 * 30, // 30일 가동 중으로 고정
        responseTime: 50 + cpu * 2, // CPU 부하에 비례한 응답 시간 시뮬레이션
        lastUpdate: new Date(),
        location: dataset.location,
        provider: 'On-Premise', // 고정값
        environment: 'production', // 고정값
        // logs 필드 매핑
        logs: logs.map((msg) => ({
          timestamp: new Date().toISOString(),
          level:
            msg.includes('[CRITICAL]') || msg.includes('[ERROR]')
              ? 'ERROR'
              : msg.includes('[WARN]')
                ? 'WARN'
                : 'INFO',
          message: msg,
        })),
        services: [],
        alerts: [],
        specs: {
          cpu_cores: 8,
          memory_gb: 32,
          disk_gb: 512,
          network_speed: '1Gbps',
        },
        // 호환성을 위한 추가 필드 (server.ts와 일치)
        role: dataset.serverType,
        ip: `10.0.1.${Math.floor(Math.random() * 255)}`,
        os: 'Ubuntu 22.04 LTS',
      } as unknown as Server;
    });

    return servers;
  }

  /**
   * ✅ 서버 데이터 검증
   */
  private validateServers(servers: Server[]): void {
    if (servers.length !== this.config.totalServers) {
      console.warn(
        `⚠️ Server count mismatch: expected ${this.config.totalServers}, got ${servers.length}`
      );
    }

    const invalidServers = servers.filter(
      (s) => !s.id || !s.name || !s.hostname
    );
    if (invalidServers.length > 0) {
      console.error('❌ Invalid servers found:', invalidServers.length);
    }
  }

  /**
   * 💾 캐시 유효성 검증
   */
  private isCacheValid(): boolean {
    if (!this.config.enableCaching || !this.cachedServers) {
      return false;
    }

    const cacheAge = Date.now() - this.cacheTimestamp;
    return cacheAge < this.config.cacheTtl;
  }

  /**
   * 🗑️ 캐시 무효화
   */
  public invalidateCache(): void {
    this.cachedServers = null;
    this.cacheTimestamp = 0;
    console.log('🗑️ Server data cache invalidated');
  }

  /**
   * 📊 상태 리포트
   */
  public getStatusReport() {
    return {
      config: this.config,
      cacheStatus: {
        enabled: this.config.enableCaching,
        isValid: this.isCacheValid(),
        lastUpdated: new Date(this.cacheTimestamp).toISOString(),
      },
      systemStatus: this.systemConfig.getStatusReport(),
    };
  }
}

// 🌟 편의 함수들
export const getUnifiedServerDataSource = () =>
  UnifiedServerDataSource.getInstance();
export const getServersFromUnifiedSource = () =>
  UnifiedServerDataSource.getInstance().getServers();
export const getServerMetricsFromUnifiedSource = () =>
  UnifiedServerDataSource.getInstance().getServerMetrics();

// 기본 인스턴스 생성
export const serverDataSource = UnifiedServerDataSource.getInstance();

export default serverDataSource;
