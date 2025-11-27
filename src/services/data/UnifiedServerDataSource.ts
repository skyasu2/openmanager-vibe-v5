/**
 * 🎯 통합 서버 데이터 소스 관리자
 * 단일 진실 소스(Single Source of Truth) 원칙 적용
 * 모든 API가 동일한 데이터 소스를 사용하도록 보장
 */

import { SystemConfigurationManager } from '@/config/SystemConfiguration';
import type { Server, ServerRole, ServerEnvironment } from '@/types/server';

// 기존 Mock 설정들 (조건부 import)
import { mockServersExpanded } from '@/mock/mockServerConfigExpanded';
import { getMockSystem } from '@/mock';

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
   * 🔄 데이터 소스별 서버 로드
   */
  private async loadServersFromSource(): Promise<Server[]> {
    switch (this.config.dataSource) {
      case 'expanded':
        return this.loadFromExpandedMock();

      case 'basic':
        return this.loadFromBasicMock();

      case 'custom':
        return this.loadFromCustomSource();

      default:
        console.warn(`⚠️ Unknown data source, falling back to expanded`);
        return this.loadFromExpandedMock();
    }
  }

  /**
   * 📊 확장된 Mock 데이터 로드 (15개 서버)
   */
  private async loadFromExpandedMock(): Promise<Server[]> {
    try {
      // @ts-expect-error - Server type mismatch
      // mockServersExpanded를 기반으로 서버 생성
      const servers: Server[] = mockServersExpanded
        .slice(0, this.config.totalServers)
        .map((mockServer, index) => ({
          id: mockServer.id,
          name:
            mockServer.hostname ||
            `${mockServer.type.toUpperCase()}-${index + 1}`,
          hostname: mockServer.hostname || `${mockServer.id}.example.com`,
          status: this.generateServerStatus(mockServer.id),
          cpu: this.generateMetric('cpu', mockServer.type),
          memory: this.generateMetric('memory', mockServer.type),
          disk: this.generateMetric('disk', mockServer.type),
          network: this.generateMetric('network', mockServer.type),
          uptime: 99.95,
          responseTime: this.generateResponseTime(mockServer.type),
          lastUpdate: new Date(),
          ip: `192.168.1.${100 + index}`,
          os: 'Ubuntu 22.04 LTS',
          type: mockServer.type,
          role: (mockServer as { role?: string }).role || mockServer.type,
          environment: 'production',
          location:
            mockServer.location ||
            `us-east-1${String.fromCharCode(97 + index)}`,
          alerts: [],
          // cpu_usage: 0, // 하위 호환성을 위해 제거 (Server 타입에 없음)
          // memory_usage: 0,
          // disk_usage: 0,
          // network_in: 0,
          // network_out: 0,
          provider: 'DataCenter-0222',
          specs: {
            cpu_cores: this.getServerSpecs(mockServer.type).cpu_cores,
            memory_gb: this.getServerSpecs(mockServer.type).memory_gb,
            disk_gb: this.getServerSpecs(mockServer.type).disk_gb,
            network_speed: '1Gbps',
          },
        }));

      // 부족한 서버 자동 생성
      if (servers.length < this.config.totalServers) {
        const additionalServers = this.generateAdditionalServers(
          this.config.totalServers - servers.length,
          servers.length
        );
        servers.push(...additionalServers);
      }

      return servers;
    } catch (error) {
      console.error('❌ Failed to load expanded mock data:', error);
      return this.generateFallbackServers();
    }
  }

  /**
   * 📋 기본 Mock 데이터 로드 (8개 서버)
   */
  private async loadFromBasicMock(): Promise<Server[]> {
    try {
      const mockSystem = getMockSystem();
      const servers = mockSystem.getServers();

      // 설정된 서버 수만큼 조정
      if (servers.length < this.config.totalServers) {
        const additionalServers = this.generateAdditionalServers(
          this.config.totalServers - servers.length,
          servers.length
        );
        return [...servers, ...additionalServers];
      }

      return servers.slice(0, this.config.totalServers);
    } catch (error) {
      console.error('❌ Failed to load basic mock data:', error);
      return this.generateFallbackServers();
    }
  }

  /**
   * 🎛️ 커스텀 데이터 소스 로드 (Scenario-based failure data)
   * 🎯 Single Source of Truth: scenario-loader를 사용하여 UI/ML Provider 데이터 통합
   */
  private async loadFromCustomSource(): Promise<Server[]> {
    try {
      console.log('🔄 Loading from scenario-based failure data...');

      // scenario-loader에서 장애 시나리오 데이터 로드
      const scenarioMetrics = await loadHourlyScenarioData();

      // EnhancedServerMetrics[] → Server[] 변환
      const servers: Server[] = scenarioMetrics.map((metric) => ({
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

      console.log(`✅ Loaded ${servers.length} servers from scenario data`);
      return servers;
    } catch (error) {
      console.error(
        '❌ Failed to load scenario data, falling back to expanded mock:',
        error
      );
      return this.loadFromExpandedMock();
    }
  }

  /**
   * 🔧 부족한 서버 자동 생성
   */
  private generateAdditionalServers(
    count: number,
    startIndex: number
  ): Server[] {
    const serverTypes = [
      'web',
      'api',
      'database',
      'cache',
      'storage',
      'monitoring',
      'security',
      'backup',
    ];
    const additionalServers: Server[] = [];

    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const serverType = serverTypes[i % serverTypes.length] || 'web';

      additionalServers.push({
        id: `auto-generated-${index + 1}`,
        name: `${serverType.toUpperCase()}-${index + 1}`,
        hostname: `${serverType}-${index + 1}.auto.example.com`,
        status: this.generateServerStatus(`auto-${index}`),
        cpu: this.generateMetric('cpu', serverType),
        memory: this.generateMetric('memory', serverType),
        disk: this.generateMetric('disk', serverType),
        network: this.generateMetric('network', serverType),
        uptime: 99.9,
        responseTime: this.generateResponseTime(serverType),
        lastUpdate: new Date(),
        ip: `192.168.2.${100 + i}`,
        os: 'Ubuntu 22.04 LTS',
        role: serverType as ServerRole,
        environment: 'production' as ServerEnvironment,
        location: `us-west-${1 + (i % 3)}`,
        alerts: [],
        // cpu_usage: 0, // 하위 호환성을 위해 제거 (Server 타입에 없음)
        // memory_usage: 0,
        // disk_usage: 0,
        // network_in: 0,
        // network_out: 0,
        provider: 'Auto-Generated',
        specs: this.getServerSpecs(serverType),
      });
    }

    return additionalServers;
  }

  /**
   * 🔄 메트릭 생성 (타입별 특성 반영)
   */
  private generateMetric(
    type: 'cpu' | 'memory' | 'disk' | 'network',
    serverType: string
  ): number {
    const baseValues = {
      cpu: { web: 35, api: 45, database: 60, cache: 25, default: 40 },
      memory: { web: 40, api: 50, database: 70, cache: 80, default: 45 },
      disk: { web: 30, api: 25, database: 15, storage: 85, default: 30 },
      network: { web: 50, api: 60, database: 40, cache: 30, default: 45 },
    };

    const base =
      baseValues[type][serverType as keyof (typeof baseValues)[typeof type]] ||
      baseValues[type].default;

    // ±20% 변동성 추가
    const variation = (Math.random() - 0.5) * 0.4;
    return Math.max(5, Math.min(95, Math.round(base * (1 + variation))));
  }

  /**
   * 🌐 네트워크 메트릭 생성 (Dashboard API 호환 object 형태)
   */
  private generateNetworkMetric(serverType: string) {
    const baseValues = {
      web: 50,
      api: 60,
      database: 40,
      cache: 30,
      default: 45,
    };

    const base =
      baseValues[serverType as keyof typeof baseValues] || baseValues.default;
    const variation = (Math.random() - 0.5) * 0.4;
    const usage = Math.max(5, Math.min(95, Math.round(base * (1 + variation))));

    // Dashboard API가 요구하는 완전한 object 형태로 생성
    return {
      usage: usage,
      in: Math.round(usage * 0.6), // 60% inbound
      out: Math.round(usage * 0.4), // 40% outbound
      total: 1000, // 1Gbps 기준
    };
  }

  /**
   * 🎯 서버 상태 생성
   */
  private generateServerStatus(
    serverId: string
  ): 'online' | 'warning' | 'critical' {
    const hash = this.simpleHash(serverId);

    // 🚨 장애 시나리오: 경고/심각 상태 서버 비율 증가
    // online: 45% | warning: 35% | critical: 20%
    if (hash < 0.45) return 'online';
    if (hash < 0.8) return 'warning';
    return 'critical';
  }

  /**
   * ⏱️ 응답시간 생성
   */
  private generateResponseTime(serverType: string): number {
    const baseTimes = {
      web: 150,
      api: 200,
      database: 100,
      cache: 50,
      default: 150,
    };

    const base =
      baseTimes[serverType as keyof typeof baseTimes] || baseTimes.default;
    return Math.round(base + (Math.random() - 0.5) * 100);
  }

  /**
   * ⚙️ 서버 스펙 정의
   */
  private getServerSpecs(serverType: string) {
    const specs = {
      web: { cpu_cores: 4, memory_gb: 8, disk_gb: 200 },
      api: { cpu_cores: 6, memory_gb: 16, disk_gb: 300 },
      database: { cpu_cores: 8, memory_gb: 32, disk_gb: 500 },
      cache: { cpu_cores: 4, memory_gb: 16, disk_gb: 100 },
      storage: { cpu_cores: 4, memory_gb: 8, disk_gb: 2000 },
      default: { cpu_cores: 4, memory_gb: 8, disk_gb: 200 },
    };

    return specs[serverType as keyof typeof specs] || specs.default;
  }

  /**
   * 🔄 간단한 해시 함수
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  }

  /**
   * 🚨 폴백 서버 생성
   */
  private generateFallbackServers(): Server[] {
    console.warn('⚠️ Using fallback server generation');
    return this.generateAdditionalServers(this.config.totalServers, 0);
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
