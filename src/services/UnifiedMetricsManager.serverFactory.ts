/**
 * 🏗️ Unified Metrics Manager Server Factory
 *
 * Server creation and initialization functionality:
 * - Server generation with realistic metrics
 * - Architecture-based server allocation
 * - Role-specific metric calculation
 * - Error state server generation
 */

import type {
  ArchitectureType,
  ServerEnvironment,
  ServerInitConfig,
  ServerRole,
  ServerStatus,
  UnifiedServerMetrics,
} from './UnifiedMetricsManager.types';

export class ServerFactory {
  private static roleMultipliers = {
    database: 1.3, // DB servers have higher load
    api: 1.1, // API servers also slightly higher
    web: 1.0, // Web servers baseline
    cache: 0.8, // Cache servers optimized
    worker: 1.2, // Worker servers variable load
  };

  /**
   * 🏗️ Initialize servers based on architecture
   */
  static initializeServers(
    targetServerCount: number = 15,
    architecture: ArchitectureType = 'standard'
  ): Map<string, UnifiedServerMetrics> {
    const servers = new Map<string, UnifiedServerMetrics>();

    console.log(`🏗️ 서버 초기화 시작: ${architecture} 아키텍처`);

    const maxServers = Math.min(targetServerCount, 50); // 최대 50개 제한
    let serverConfigs: ServerInitConfig[] = [];

    // 아키텍처별 서버 구성
    if (architecture === 'minimal') {
      // 최소 구성 (개발/테스트용)
      const baseCount = Math.max(1, Math.floor(maxServers / 6));
      serverConfigs = [
        { environment: 'development', role: 'web', count: baseCount },
        { environment: 'development', role: 'api', count: baseCount },
        { environment: 'development', role: 'database', count: 1 },
      ];
    } else if (architecture === 'enterprise') {
      // 엔터프라이즈 구성 (고가용성)
      const baseCount = Math.max(2, Math.floor(maxServers / 8));
      serverConfigs = [
        { environment: 'production', role: 'web', count: baseCount * 3 },
        { environment: 'production', role: 'api', count: baseCount * 3 },
        { environment: 'production', role: 'database', count: baseCount * 3 },
        { environment: 'production', role: 'cache', count: baseCount * 2 },
        { environment: 'staging', role: 'web', count: baseCount },
        { environment: 'staging', role: 'api', count: baseCount },
      ];
    } else {
      // 표준 구성 (균형 잡힌 구성)
      const baseCount = Math.max(1, Math.floor(maxServers / 6));
      serverConfigs = [
        { environment: 'production', role: 'web', count: baseCount * 3 },
        { environment: 'production', role: 'api', count: baseCount * 2 },
        { environment: 'production', role: 'database', count: baseCount * 2 },
        { environment: 'production', role: 'cache', count: baseCount * 1 },
      ];
    }

    // 📊 Actual server creation
    let serverIndex = 1;
    let totalGenerated = 0;

    serverConfigs.forEach(({ environment, role, count }) => {
      for (let i = 0; i < count && totalGenerated < maxServers; i++) {
        const server = ServerFactory.createServer(
          `server-${environment.slice(0, 4)}-${role}-${String(serverIndex).padStart(2, '0')}`,
          environment,
          role
        );
        servers.set(server.id, server);
        serverIndex++;
        totalGenerated++;
      }
    });

    // 🔄 Fill remaining servers (default to web servers)
    while (totalGenerated < maxServers) {
      const server = ServerFactory.createServer(
        `server-auto-web-${String(serverIndex).padStart(2, '0')}`,
        'production',
        'web'
      );
      servers.set(server.id, server);
      serverIndex++;
      totalGenerated++;
    }

    console.log(`📊 초기 서버 ${servers.size}개 생성 완료`);
    console.log(`🏗️ 아키텍처: ${architecture}`);
    console.log(`🎯 목표: ${maxServers}개, 실제 생성: ${totalGenerated}개`);

    return servers;
  }

  /**
   * 🏗️ Create server with realistic metrics
   */
  static createServer(
    id: string,
    environment: ServerEnvironment,
    role: ServerRole
  ): UnifiedServerMetrics {
    const now = Date.now();

    return {
      id,
      name: id,
      hostname: id,
      environment,
      role,
      status: 'healthy',

      // Basic metrics (realistic ranges)
      node_cpu_usage_percent: ServerFactory.generateRealisticValue(
        20,
        80,
        role
      ),
      node_memory_usage_percent: ServerFactory.generateRealisticValue(
        30,
        85,
        role
      ),
      node_disk_usage_percent: ServerFactory.generateRealisticValue(
        10,
        70,
        role
      ),
      node_network_receive_rate_mbps: ServerFactory.generateRealisticValue(
        1,
        100,
        role
      ),
      node_network_transmit_rate_mbps: ServerFactory.generateRealisticValue(
        1,
        100,
        role
      ),
      node_uptime_seconds: Math.floor(Math.random() * 30 * 24 * 3600), // Max 30 days

      // Application metrics
      http_request_duration_seconds:
        ServerFactory.generateRealisticValue(0.1, 2.0, role) / 1000,
      http_requests_total: Math.floor(Math.random() * 10000),
      http_requests_errors_total: Math.floor(Math.random() * 100),

      timestamp: now,
      labels: {
        environment,
        role,
        cluster: 'openmanager-v5',
        version: '5.11.0',
      },
    };
  }

  /**
   * 📊 Generate realistic metric values based on server role
   */
  private static generateRealisticValue(
    min: number,
    max: number,
    role: string
  ): number {
    const baseValue = min + Math.random() * (max - min);

    // Apply role-specific multipliers
    const multiplier =
      ServerFactory.roleMultipliers[
        role as keyof typeof this.roleMultipliers
      ] || 1.0;

    return Math.min(100, Math.max(0, baseValue * multiplier));
  }

  /**
   * 🚨 Generate error state servers (fallback)
   */
  static generateErrorStateServers(): UnifiedServerMetrics[] {
    console.log('🚨 에러 상태 서버 데이터 생성 중...');

    const errorServers: UnifiedServerMetrics[] = Array.from(
      { length: 3 },
      (_, i) => {
        return {
          id: `ERROR_SERVER_${i + 1}`,
          name: `🚨 ERROR_${i + 1}`,
          hostname: `ERROR: 실제 데이터 연결 실패`,
          environment: 'error' as ServerEnvironment,
          role: 'error' as ServerRole,
          status: 'offline' as ServerStatus,
          node_cpu_usage_percent: 0,
          node_memory_usage_percent: 0,
          node_disk_usage_percent: 0,
          node_network_receive_rate_mbps: 0,
          node_network_transmit_rate_mbps: 0,
          node_uptime_seconds: 0,
          http_requests_total: 0,
          http_request_duration_seconds: 0,
          http_requests_errors_total: 0,
          timestamp: Date.now(),
          labels: {
            error: 'true',
            source: 'error-state',
          },
        };
      }
    );

    console.log(`🚨 에러 상태 서버 데이터 생성 완료: ${errorServers.length}개`);
    return errorServers;
  }

  /**
   * 🔧 Update server status based on metrics
   */
  static updateServerStatus(
    server: UnifiedServerMetrics
  ): UnifiedServerMetrics {
    let status: ServerStatus = 'healthy';

    // Determine status based on metrics
    if (
      server.node_cpu_usage_percent > 90 ||
      server.node_memory_usage_percent > 95 ||
      server.http_request_duration_seconds > 5.0
    ) {
      status = 'critical';
    } else if (
      server.node_cpu_usage_percent > 75 ||
      server.node_memory_usage_percent > 85 ||
      server.http_request_duration_seconds > 2.0
    ) {
      status = 'warning';
    }

    return {
      ...server,
      status,
      timestamp: Date.now(),
    };
  }

  /**
   * 🎲 Apply realistic fluctuations to server metrics
   */
  static applyRealisticFluctuations(
    server: UnifiedServerMetrics
  ): UnifiedServerMetrics {
    const fluctuation = 0.1; // 10% fluctuation

    return {
      ...server,
      node_cpu_usage_percent: ServerFactory.applyFluctuation(
        server.node_cpu_usage_percent,
        fluctuation
      ),
      node_memory_usage_percent: ServerFactory.applyFluctuation(
        server.node_memory_usage_percent,
        fluctuation
      ),
      node_network_receive_rate_mbps: ServerFactory.applyFluctuation(
        server.node_network_receive_rate_mbps,
        fluctuation * 2 // Network is more variable
      ),
      node_network_transmit_rate_mbps: ServerFactory.applyFluctuation(
        server.node_network_transmit_rate_mbps,
        fluctuation * 2
      ),
      http_requests_total:
        server.http_requests_total + Math.floor(Math.random() * 100),
      timestamp: Date.now(),
    };
  }

  /**
   * 📊 Apply fluctuation to a metric value
   */
  private static applyFluctuation(value: number, fluctuation: number): number {
    const change = (Math.random() - 0.5) * 2 * fluctuation * value;
    return Math.min(100, Math.max(0, value + change));
  }

  /**
   * 📋 Format servers for dashboard compatibility
   */
  static formatServersForDashboard(
    servers: UnifiedServerMetrics[]
  ): UnifiedServerMetrics[] {
    if (servers.length === 0) {
      console.log('📋 서버 목록이 비어있음, 에러 상태 서버 반환');
      return ServerFactory.generateErrorStateServers();
    }

    const formattedServers = servers.map((server) => ({
      ...server,
      environment: server.environment || 'development',
      // ServerDashboard 호환성을 위한 추가 필드
      cpu_usage: server.node_cpu_usage_percent,
      memory_usage: server.node_memory_usage_percent,
      disk_usage: server.node_disk_usage_percent,
      response_time: server.http_request_duration_seconds * 1000,
      uptime: server.node_uptime_seconds / 3600, // 시간 단위로 변환
      last_updated: new Date(server.timestamp).toISOString(),
    }));

    console.log(`📋 서버 목록 포맷팅 완료: ${formattedServers.length}개 서버`);
    return formattedServers;
  }
}
