/**
 * 🔥 MCP 서버 웜업 서비스
 * Render 무료 티어 MCP 서버들을 사전에 깨워놓는 서비스
 */

// 🔄 중복 제거: 웜업 전용 설정 인터페이스 (기본 MCPServerConfig와 다름)
export interface MCPWarmupServerConfig {
  name: string;
  url: string;
  healthEndpoint?: string;
  timeout?: number;
  retries?: number;
}

export interface WarmupResult {
  server: string;
  success: boolean;
  responseTime: number;
  error?: string;
  attempts: number;
}

export class MCPWarmupService {
  private static instance: MCPWarmupService | null = null;

  // Render에 배포된 MCP 서버들
  private readonly MCP_SERVERS: MCPWarmupServerConfig[] = [
    {
      name: 'openmanager-render-ai',
      url: 'https://openmanager-vibe-v5.onrender.com',
      healthEndpoint: '/health',
      timeout: 30000, // Render 웜업은 시간이 걸림
      retries: 3,
    },
    {
      name: 'openmanager-docs-server',
      url: 'https://openmanager-vibe-v5.onrender.com',
      healthEndpoint: '/status',
      timeout: 25000,
      retries: 2,
    },
    {
      name: 'openmanager-filesystem-mcp',
      url: 'https://openmanager-vibe-v5.onrender.com',
      healthEndpoint: '/health',
      timeout: 20000,
      retries: 2,
    },
  ];

  private warmupHistory: Map<
    string,
    { lastWarmup: number; successCount: number }
  > = new Map();
  private readonly WARMUP_COOLDOWN = 300000; // 5분마다 웜업 가능

  public static getInstance(): MCPWarmupService {
    if (!MCPWarmupService.instance) {
      MCPWarmupService.instance = new MCPWarmupService();
    }
    return MCPWarmupService.instance;
  }

  /**
   * 🔥 모든 MCP 서버 웜업
   */
  async warmupAllServers(): Promise<WarmupResult[]> {
    console.log('🔥 MCP 서버 웜업 시작...');

    const results = await Promise.all(
      this.MCP_SERVERS.map(server => this.warmupServer(server))
    );

    const successCount = results.filter(r => r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);

    console.log(
      `🔥 MCP 웜업 완료: ${successCount}/${results.length} 서버 성공 (총 ${totalTime}ms)`
    );

    return results;
  }

  /**
   * 🔥 개별 서버 웜업
   */
  async warmupServer(config: MCPWarmupServerConfig): Promise<WarmupResult> {
    const startTime = Date.now();
    const serverHistory = this.warmupHistory.get(config.name);

    // 쿨다운 체크
    if (
      serverHistory &&
      Date.now() - serverHistory.lastWarmup < this.WARMUP_COOLDOWN
    ) {
      return {
        server: config.name,
        success: true,
        responseTime: 0,
        attempts: 0,
        error: '쿨다운 중 (최근에 웜업됨)',
      };
    }

    let attempts = 0;
    const maxRetries = config.retries || 3;

    for (attempts = 1; attempts <= maxRetries; attempts++) {
      try {
        console.log(`🔥 ${config.name} 웜업 시도 ${attempts}/${maxRetries}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          config.timeout || 30000
        );

        const response = await fetch(
          config.url + (config.healthEndpoint || '/'),
          {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'OpenManager-Warmup-Service/1.0',
              Accept: 'application/json, text/plain, */*',
            },
          }
        );

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          // 성공 기록
          this.warmupHistory.set(config.name, {
            lastWarmup: Date.now(),
            successCount: (serverHistory?.successCount || 0) + 1,
          });

          console.log(
            `✅ ${config.name} 웜업 성공 (${responseTime}ms, ${attempts}번째 시도)`
          );

          return {
            server: config.name,
            success: true,
            responseTime,
            attempts,
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        const responseTime = Date.now() - startTime;

        if (attempts === maxRetries) {
          console.error(
            `❌ ${config.name} 웜업 실패 (${attempts}번 시도): ${error.message}`
          );

          return {
            server: config.name,
            success: false,
            responseTime,
            attempts,
            error: error.message,
          };
        } else {
          console.warn(
            `⚠️ ${config.name} 웜업 시도 ${attempts} 실패, 재시도 중... (${error.message})`
          );
          // 재시도 전 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        }
      }
    }

    // 이 코드에 도달하면 안됨
    return {
      server: config.name,
      success: false,
      responseTime: Date.now() - startTime,
      attempts: maxRetries,
      error: '알 수 없는 오류',
    };
  }

  /**
   * 🧪 테스트 환경용 웜업 (더 적극적)
   */
  async warmupForTesting(): Promise<WarmupResult[]> {
    console.log('🧪 테스트 환경용 MCP 서버 웜업 시작...');

    // 테스트용으로는 더 많은 재시도와 긴 타임아웃
    const testConfigs: MCPWarmupServerConfig[] = this.MCP_SERVERS.map(
      server => ({
        ...server,
        timeout: 45000, // 45초
        retries: 5, // 5번 재시도
      })
    );

    const results = await Promise.all(
      testConfigs.map(server => this.warmupServer(server))
    );

    // 실패한 서버들에 대해 추가 웜업 시도
    const failedServers = results.filter(r => !r.success);
    if (failedServers.length > 0) {
      console.log(
        `🔄 실패한 서버 ${failedServers.length}개에 대해 추가 웜업 시도...`
      );

      await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기

      const retryResults = await Promise.all(
        failedServers.map(failed => {
          const config = this.MCP_SERVERS.find(s => s.name === failed.server);
          return config ? this.warmupServer({ ...config, retries: 2 }) : failed;
        })
      );

      // 결과 업데이트
      retryResults.forEach((retryResult, index) => {
        const originalIndex = results.findIndex(
          r => r.server === retryResult.server
        );
        if (originalIndex !== -1) {
          results[originalIndex] = retryResult;
        }
      });
    }

    const finalSuccessCount = results.filter(r => r.success).length;
    console.log(
      `🧪 테스트용 웜업 완료: ${finalSuccessCount}/${results.length} 서버 준비됨`
    );

    return results;
  }

  /**
   * 📊 웜업 상태 조회
   */
  getWarmupStatus(): {
    server: string;
    lastWarmup: Date | null;
    successCount: number;
  }[] {
    return this.MCP_SERVERS.map(server => {
      const history = this.warmupHistory.get(server.name);
      return {
        server: server.name,
        lastWarmup: history ? new Date(history.lastWarmup) : null,
        successCount: history?.successCount || 0,
      };
    });
  }

  /**
   * 🔄 주기적 웜업 시작 (선택사항)
   */
  startPeriodicWarmup(intervalMinutes: number = 15): void {
    console.log(`🔄 ${intervalMinutes}분마다 MCP 서버 주기적 웜업 시작`);

    setInterval(
      async () => {
        try {
          await this.warmupAllServers();
        } catch (error) {
          console.error('🔄 주기적 웜업 실패:', error);
        }
      },
      intervalMinutes * 60 * 1000
    );
  }

  /**
   * 🧹 히스토리 정리
   */
  clearHistory(): void {
    this.warmupHistory.clear();
    console.log('🧹 웜업 히스토리 정리 완료');
  }
}
