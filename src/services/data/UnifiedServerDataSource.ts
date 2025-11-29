/**
 * 🎯 통합 서버 데이터 소스 관리자
 * 단일 진실 소스(Single Source of Truth) 원칙 적용
 * 모든 API가 동일한 데이터 소스를 사용하도록 보장
 */

import { SystemConfigurationManager } from '@/config/SystemConfiguration';
import type { Server, ServerRole, ServerEnvironment } from '@/types/server';

// 🎯 Scenario-based failure data (Single Source of Truth)
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';

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
    if (!this.instance) {
      this.instance = new UnifiedServerDataSource();
    }
    return this.instance;
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
   * @returns {Promise<Server[]>} 10개 서버 데이터 (8개 JSON + 2개 자동 생성)
   *
   * @description
   * - 데이터 소스: `scenario-loader` → `hourly-metrics/*.json`
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
   * @see {@link docs/architecture/DATA_ARCHITECTURE.md} 아키텍처 가이드
   */
  public async getServers(): Promise<Server[]> {
    // 캐시 확인
    if (this.isCacheValid() && this.cachedServers) {
      return this.cachedServers;
    }

    // 데이터 소스별 로드
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
   * 🔄 서버 데이터 로드 (scenario-loader 사용)
   */
  private async loadServersFromSource(): Promise<Server[]> {
    // 🎯 Single Source of Truth: scenario-loader만 사용
    return this.loadFromCustomSource();
  }

  /**
   * 🎛️ 데이터 소스 로드 (Scenario-based failure data)
   * 🎯 Single Source of Truth: scenario-loader를 사용하여 UI/ML Provider 데이터 통합
   */
  private async loadFromCustomSource(): Promise<Server[]> {
    console.log('🔄 Loading from scenario-based data (scenario-loader)...');

    // scenario-loader에서 장애 시나리오 데이터 로드
    const scenarioMetrics = await loadHourlyScenarioData();

    // EnhancedServerMetrics[] → Server[] 변환
    const servers: Server[] = scenarioMetrics.map((metric: any) => ({
      id: metric.id,
      name: metric.name,
      hostname: metric.hostname,
      status: metric.status as 'online' | 'warning' | 'critical',
      cpu: metric.cpu,
      memory: metric.memory,
      disk: metric.disk,
      network: metric.network,
      uptime: metric.uptime / 1000 / 60 / 60 / 24, // ms → days (uptime은 일수)
      responseTime: metric.responseTime,
      lastUpdate: new Date(metric.last_updated),
      ip: metric.ip,
      os: metric.os,
      type: metric.type as ServerRole, // type을 ServerRole로 변환
      role: metric.role as ServerRole,
      environment: metric.environment as ServerEnvironment,
      location: metric.location,
      alerts: metric.alerts as never[],
      provider: metric.provider,
      specs: {
        cpu_cores: metric.specs.cpu_cores,
        memory_gb: metric.specs.memory_gb,
        disk_gb: metric.specs.disk_gb,
        network_speed: metric.specs.network_speed,
      },
    }));

    console.log(`✅ Loaded ${servers.length} servers from scenario-loader`);
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
