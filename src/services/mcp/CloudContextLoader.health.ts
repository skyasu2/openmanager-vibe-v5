/**
 * 🏥 MCP Server Health Check Module - CloudContextLoader
 *
 * Dedicated health monitoring for Google Cloud VM AI Backend:
 * - Periodic health checks (30s intervals)
 * - Status tracking and response time monitoring
 * - Automatic failover detection
 * - Connection timeout handling
 * - Health metrics collection
 */

import type {
  MCPServerInfo,
  CloudContextLoaderConfig,
} from './CloudContextLoader.types';

/**
 * MCP 서버 헬스체크 관리자
 */
export class MCPHealthChecker {
  private config: CloudContextLoaderConfig;
  private mcpServerInfo: MCPServerInfo;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: CloudContextLoaderConfig) {
    this.config = config;
    this.mcpServerInfo = {
      url: this.config.mcpServerUrl,
      status: 'offline',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
    };
  }

  /**
   * 🔗 Google Cloud VM AI 백엔드 헬스체크 시작 (MCP와 무관)
   */
  startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      void (async () => {
        await this.performHealthCheck();
      })();
    }, this.config.mcpHealthCheckInterval);

    // 즉시 첫 헬스체크 수행
    void this.performHealthCheck();
    console.log('🏥 MCP 서버 헬스체크 시작');
  }

  /**
   * 🏥 MCP 서버 상태 확인
   */
  async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.mcpServerUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-CloudContextLoader/1.0',
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const healthData = await response.json();

        this.mcpServerInfo = {
          url: this.config.mcpServerUrl,
          status: 'online',
          lastChecked: new Date().toISOString(),
          responseTime,
          version: healthData.version,
          capabilities: healthData.capabilities,
        };

        console.log(`✅ MCP 서버 정상 (응답시간: ${responseTime}ms)`);
      } else {
        this.mcpServerInfo.status = 'degraded';
        this.mcpServerInfo.lastChecked = new Date().toISOString();
        this.mcpServerInfo.responseTime = responseTime;
        console.log(`⚠️ MCP 서버 응답 이상: ${response.status}`);
      }
    } catch (error) {
      this.mcpServerInfo.status = 'offline';
      this.mcpServerInfo.lastChecked = new Date().toISOString();
      this.mcpServerInfo.responseTime = -1;
      console.warn(`❌ MCP 서버 연결 실패: ${error}`);
    }
  }

  /**
   * 📊 현재 서버 상태 반환
   */
  getServerInfo(): MCPServerInfo {
    return { ...this.mcpServerInfo };
  }

  /**
   * 🔍 서버 온라인 여부 확인
   */
  isServerOnline(): boolean {
    return this.mcpServerInfo.status === 'online';
  }

  /**
   * 🔍 서버 사용 가능 여부 확인 (온라인 또는 성능 저하)
   */
  isServerAvailable(): boolean {
    return (
      this.mcpServerInfo.status === 'online' ||
      this.mcpServerInfo.status === 'degraded'
    );
  }

  /**
   * 📈 응답 시간 반환
   */
  getResponseTime(): number {
    return this.mcpServerInfo.responseTime;
  }

  /**
   * 🔄 수동 헬스체크 실행
   */
  async forceHealthCheck(): Promise<MCPServerInfo> {
    await this.performHealthCheck();
    return this.getServerInfo();
  }

  /**
   * 🛑 헬스체크 중지
   */
  stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('🛑 MCP 헬스체크 중지됨');
    }
  }

  /**
   * 🧹 리소스 정리
   */
  destroy(): void {
    this.stopHealthCheck();
  }
}
