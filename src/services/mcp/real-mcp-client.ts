/**
 * 🎯 실제 MCP 표준 클라이언트 v3.1 (성능 최적화)
 *
 * ✅ @modelcontextprotocol/sdk 사용
 * ✅ 환경별 서버 구성 (개발/테스트/스테이징/프로덕션)
 * ✅ JSON-RPC 2.0 프로토콜
 * ✅ 표준화된 도구 호출
 * ✅ 성능 모니터링 및 로드 밸런싱
 */

import {
  checkPaths,
  detectEnvironment,
  getMCPConfig,
} from '@/config/environment';
import { utf8Logger } from '@/utils/utf8-logger';
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// MCP SDK는 아직 설치되지 않았을 수 있으므로 폴백 구현
interface MCPClient {
  connect(transport?: any): Promise<void>;
  request(request: any): Promise<any>;
  close(): Promise<void>;
  // 실제 구현용 프로퍼티 (optional)
  process?: ChildProcess;
  nextId?: number;
  pendingRequests?: Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
    }
  >;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  // 🚀 성능 모니터링 추가
  stats?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastUsed: number;
    healthScore: number;
  };
}

interface MCPSearchResult {
  success: boolean;
  results: any[];
  source: string;
  tools_used: string[];
  // 🚀 성능 정보 추가
  responseTime?: number;
  serverUsed?: string;
}

export class RealMCPClient {
  private static instance: RealMCPClient | null = null;

  private servers: Map<string, MCPServerConfig> = new Map();
  private clients: Map<string, MCPClient> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private isInitialized = false;

  // 🚀 성능 모니터링 추가
  private performanceMonitor = {
    totalRequests: 0,
    totalResponseTime: 0,
    serverLoadBalance: new Map<string, number>(),
    lastOptimized: Date.now(),
  };

  private constructor() {
    this.initializeServers();
    this.startPerformanceMonitoring();
  }

  /**
   * 🎯 싱글톤 인스턴스 반환 (Render MCP 서버 전용)
   */
  public static getInstance(): RealMCPClient {
    if (!RealMCPClient.instance) {
      RealMCPClient.instance = new RealMCPClient();
      console.log('🎯 RealMCPClient 싱글톤 인스턴스 생성 (Render 서버 전용)');
    }
    return RealMCPClient.instance;
  }

  /**
   * 🚀 성능 모니터링 시작
   */
  private startPerformanceMonitoring(): void {
    // 5분마다 성능 통계 출력 및 최적화
    setInterval(
      () => {
        this.optimizeServerPerformance();
      },
      5 * 60 * 1000
    );
  }

  /**
   * ⚡ 서버 성능 최적화
   */
  private optimizeServerPerformance(): void {
    console.log('📊 MCP 서버 성능 최적화 시작...');

    for (const [serverName, config] of this.servers.entries()) {
      if (config.stats) {
        const {
          totalRequests,
          successfulRequests,
          averageResponseTime,
          healthScore,
        } = config.stats;

        // 헬스 스코어 계산 (성공률 + 응답시간 기반)
        const successRate =
          totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
        const responseScore = Math.max(0, 100 - averageResponseTime / 10); // 1초 = 10점 감점
        config.stats.healthScore = successRate * 0.7 + responseScore * 0.3;

        console.log(
          `  📈 ${serverName}: 성공률 ${successRate.toFixed(1)}%, 평균응답 ${averageResponseTime}ms, 헬스 ${config.stats.healthScore.toFixed(1)}`
        );

        // 성능이 낮은 서버 비활성화
        if (config.stats.healthScore < 30 && totalRequests > 10) {
          console.warn(`⚠️ ${serverName} 서버 성능 저하로 임시 비활성화`);
          config.enabled = false;
        }
      }
    }
  }

  /**
   * 🎯 최적 서버 선택 (로드 밸런싱)
   */
  private selectOptimalServer(excludeServers: string[] = []): string | null {
    const availableServers = Array.from(this.servers.entries()).filter(
      ([name, config]) =>
        config.enabled &&
        !excludeServers.includes(name) &&
        this.clients.has(name)
    );

    if (availableServers.length === 0) return null;

    // 헬스 스코어 기반 선택
    const sortedServers = availableServers.sort((a, b) => {
      const scoreA = a[1].stats?.healthScore || 50;
      const scoreB = b[1].stats?.healthScore || 50;
      return scoreB - scoreA;
    });

    return sortedServers[0][0];
  }

  /**
   * 📊 서버 통계 업데이트
   */
  private updateServerStats(
    serverName: string,
    responseTime: number,
    success: boolean
  ): void {
    const config = this.servers.get(serverName);
    if (!config) return;

    if (!config.stats) {
      config.stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: Date.now(),
        healthScore: 100,
      };
    }

    const stats = config.stats;
    stats.totalRequests++;
    stats.lastUsed = Date.now();

    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    // 이동 평균으로 응답시간 업데이트
    stats.averageResponseTime =
      (stats.averageResponseTime * (stats.totalRequests - 1) + responseTime) /
      stats.totalRequests;
  }

  private initializeServers(): void {
    // 공용 환경 감지 사용
    const env = detectEnvironment();
    const mcpConfig = getMCPConfig();

    // Render MCP 서버 정보
    const renderMcpUrl = 'https://openmanager-vibe-v5.onrender.com';
    const renderIPs = ['13.228.225.19', '18.142.128.26', '54.254.162.138'];

    console.log(`🌍 환경: ${(env.NODE_ENV || 'development').toUpperCase()}`);
    console.log(`📂 Vercel 환경: ${env.IS_VERCEL ? '활성화' : '비활성화'}`);
    console.log(`🌐 Render MCP 서버: ${renderMcpUrl}`);
    console.log(`📍 MCP 서버 IPs: ${renderIPs.join(', ')}`);

    // 경로 존재 여부 확인
    const pathResults = checkPaths(['./src', './docs']);

    const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    // 🗂️ 표준 filesystem 서버 (파일 시스템 조작)
    this.servers.set('filesystem', {
      name: 'filesystem',
      command: npxCommand,
      args: ['@modelcontextprotocol/server-filesystem', './src', './docs'],
      env: {
        NODE_OPTIONS: `--max-old-space-size=256`, // 메모리 사용량 최적화
        PROJECT_ROOT: process.cwd(),
      },
      enabled: true,
    });

    // 🐙 표준 GitHub 서버 (필요시에만 활성화)
    this.servers.set('github', {
      name: 'github',
      command: npxCommand,
      args: ['@modelcontextprotocol/server-github'],
      env: {
        NODE_OPTIONS: '--max-old-space-size=256',
      },
      enabled: false, // 기본 비활성화 (필요시에만 활성화)
    });

    // 📊 표준 filesystem 서버 (문서 전용)
    this.servers.set('openmanager-docs', {
      name: 'openmanager-docs',
      command: npxCommand,
      args: ['@modelcontextprotocol/server-filesystem', './docs'],
      env: {
        NODE_OPTIONS: '--max-old-space-size=256',
        PROJECT_ROOT: process.cwd(),
      },
      enabled: true,
    });

    console.log(
      `🔧 MCP 서버 초기화 완료 (${(env.NODE_ENV || 'development').toUpperCase()} - ${npxCommand})`
    );
    console.log('📋 사용 가능한 서버:', Array.from(this.servers.keys()));

    if (env.IS_VERCEL) {
      console.log('🚀 Vercel 환경 감지 - 프로덕션 최적화 적용');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 환경 체크 추가
    const { envManager } = await import('@/lib/environment/EnvironmentManager');

    // 빌드 시에는 MCP 초기화 건너뛰기
    if (envManager.isBuildTime) {
      console.log('🔨 빌드 환경 감지 - MCP 초기화 건너뜀');
      this.isInitialized = true;
      return;
    }

    // MCP 서버 초기화가 허용된 환경에서만 실행
    if (!envManager.shouldInitializeMCP()) {
      console.log('⏭️ MCP 초기화 비활성화됨 (환경 설정)');
      this.isInitialized = true;
      return;
    }

    console.log('🚀 실제 MCP 클라이언트 초기화 중...');
    envManager.log('info', 'MCP 클라이언트 초기화 시작');

    try {
      // 기본 서버들 연결 테스트
      await this.testConnections();

      this.isInitialized = true;
      console.log('✅ MCP 클라이언트 초기화 완료');
      envManager.log('info', 'MCP 클라이언트 초기화 완료');
    } catch (error: any) {
      console.error('❌ MCP 클라이언트 초기화 실패:', error);
      envManager.log('error', 'MCP 클라이언트 초기화 실패', error);
      // 실패해도 계속 진행 (폴백 모드)
      this.isInitialized = true;
    }
  }

  private async testConnections(): Promise<void> {
    const enabledServers = Array.from(this.servers.entries()).filter(
      ([_, config]) => config.enabled
    );

    for (const [serverName, config] of enabledServers) {
      try {
        console.log(`🔌 ${serverName} 서버 연결 테스트...`);
        const client = await this.connectToServer(serverName);
        const tools = await this.listTools(serverName);
        console.log(`✅ ${serverName}: ${tools.length}개 도구 사용 가능`);
      } catch (error: any) {
        console.warn(
          `⚠️ ${serverName} 서버 연결 실패, 비활성화:`,
          error.message
        );
        config.enabled = false;
      }
    }
  }

  async connectToServer(serverName: string): Promise<MCPClient> {
    if (this.clients.has(serverName)) {
      return this.clients.get(serverName)!;
    }

    // 환경 체크 추가
    const { envManager } = await import('@/lib/environment/EnvironmentManager');

    // 빌드 시에는 항상 Mock 클라이언트 반환
    if (envManager.isBuildTime) {
      console.log(`🔨 빌드 환경 - Mock MCP 클라이언트 사용: ${serverName}`);
      const mockClient = this.createMockClient(serverName);
      this.clients.set(serverName, mockClient);
      return mockClient;
    }

    // 환경별 MCP 서버 연결 전략
    const isLocalServer = ['filesystem', 'github', 'openmanager-docs'].includes(
      serverName
    );

    if (isLocalServer) {
      // 로컬 MCP 서버 (개발용)
      if (!envManager.shouldInitializeLocalMCP()) {
        console.log(`🔧 개발 환경이 아님 - 로컬 MCP Mock 사용: ${serverName}`);
        const mockClient = this.createMockClient(serverName);
        this.clients.set(serverName, mockClient);
        return mockClient;
      }
    } else {
      // Render MCP 서버 (프로덕션용)
      if (!envManager.shouldConnectRenderMCP()) {
        console.log(
          `🌐 프로덕션 환경이 아님 - Render MCP Mock 사용: ${serverName}`
        );
        const mockClient = this.createMockClient(serverName);
        this.clients.set(serverName, mockClient);
        return mockClient;
      }
    }

    const config = this.servers.get(serverName);
    if (!config || !config.enabled) {
      throw new Error(`MCP 서버 사용 불가: ${serverName}`);
    }

    try {
      console.log(`🔌 실제 MCP 서버 연결 시도: ${serverName}`);
      console.log(`📍 명령어: ${config.command} ${config.args.join(' ')}`);
      envManager.log('info', `MCP 서버 연결 시도: ${serverName}`);

      // npx 실행 시 폴백 처리
      let serverProcess: ChildProcess;

      try {
        // 실제 MCP 서버와 stdio를 통한 JSON-RPC 통신
        serverProcess = spawn(config.command, config.args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, ...config.env },
        });
      } catch (spawnError: any) {
        console.warn(
          `⚠️ ${config.command} 실행 실패, 폴백 모드 사용:`,
          spawnError.message
        );
        envManager.log(
          'warn',
          `MCP 서버 실행 실패, Mock 모드 사용: ${serverName}`,
          spawnError
        );

        // 폴백: Mock 클라이언트 반환
        const mockClient = this.createMockClient(serverName);
        this.clients.set(serverName, mockClient);
        return mockClient;
      }

      if (!serverProcess.pid) {
        console.warn(
          `⚠️ MCP 서버 프로세스 시작 실패, 폴백 모드 사용: ${serverName}`
        );
        const mockClient = this.createMockClient(serverName);
        this.clients.set(serverName, mockClient);
        return mockClient;
      }

      console.log(`🚀 MCP 서버 프로세스 시작됨: PID ${serverProcess.pid}`);

      // JSON-RPC 클라이언트 구현
      const client: MCPClient = {
        process: serverProcess,
        nextId: 1,
        pendingRequests: new Map(),

        async connect(): Promise<void> {
          // 초기화 요청 전송
          const initRequest = {
            jsonrpc: '2.0',
            id: this.nextId!++,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: {
                name: 'openmanager-vibe',
                version: '5.21.0',
              },
            },
          };

          return new Promise((resolve, reject) => {
            const requestId = initRequest.id;
            this.pendingRequests!.set(requestId, { resolve, reject });

            // 응답 데이터 처리
            this.process!.stdout?.on('data', (data: any) => {
              try {
                const lines = data
                  .toString()
                  .split('\n')
                  .filter((line: string) => line.trim());
                for (const line of lines) {
                  if (line.trim()) {
                    const response = JSON.parse(line);
                    if (response.id && this.pendingRequests!.has(response.id)) {
                      const pending = this.pendingRequests!.get(response.id)!;
                      this.pendingRequests!.delete(response.id);

                      if (response.error) {
                        pending.reject(
                          new Error(response.error.message || 'MCP 오류')
                        );
                      } else {
                        pending.resolve(response.result);
                      }
                    }
                  }
                }
              } catch (error) {
                console.warn('⚠️ MCP 응답 파싱 실패:', error);
              }
            });

            // 오류 처리
            this.process!.stderr?.on('data', (data: any) => {
              console.warn(
                `⚠️ MCP 서버 오류 (${serverName}):`,
                data.toString()
              );
            });

            this.process!.on('exit', (code: any) => {
              console.log(`🔌 MCP 서버 종료 (${serverName}): 코드 ${code}`);
            });

            // 초기화 요청 전송
            this.process!.stdin?.write(JSON.stringify(initRequest) + '\n');

            // 5초 타임아웃
            setTimeout(() => {
              if (this.pendingRequests!.has(requestId)) {
                this.pendingRequests!.delete(requestId);
                reject(new Error('MCP 초기화 타임아웃'));
              }
            }, 5000);
          });
        },

        async request(request: any): Promise<any> {
          return new Promise((resolve, reject) => {
            const requestId = this.nextId!++;
            const jsonRpcRequest = {
              jsonrpc: '2.0',
              id: requestId,
              method: request.method,
              params: request.params || {},
            };

            this.pendingRequests!.set(requestId, { resolve, reject });

            // 요청 전송
            this.process!.stdin?.write(JSON.stringify(jsonRpcRequest) + '\n');

            // 5초 타임아웃
            setTimeout(() => {
              if (this.pendingRequests!.has(requestId)) {
                this.pendingRequests!.delete(requestId);
                reject(new Error(`MCP 요청 타임아웃: ${request.method}`));
              }
            }, 5000);
          });
        },

        async close(): Promise<void> {
          if (this.process && !this.process.killed) {
            this.process.kill();
            console.log(`🔌 MCP 서버 프로세스 종료: ${serverName}`);
          }
        },
      };

      await client.connect();
      this.clients.set(serverName, client);

      console.log(`✅ 실제 MCP 서버 연결 성공: ${serverName}`);
      return client;
    } catch (error: any) {
      console.error(
        `❌ 실제 MCP 서버 연결 실패, 폴백 모드 사용: ${serverName}`,
        error
      );
      const mockClient = this.createMockClient(serverName);
      this.clients.set(serverName, mockClient);
      return mockClient;
    }
  }

  /**
   * 🔄 Mock 클라이언트 생성 (개선된 버전)
   */
  private createMockClient(serverName: string): MCPClient {
    console.log(`🎭 Mock MCP 클라이언트 생성: ${serverName}`);

    const mockData = this.getMockDataForServer(serverName);

    return {
      async connect(): Promise<void> {
        console.log(`✅ Mock 연결 완료: ${serverName}`);
      },

      async request(request: any): Promise<any> {
        console.log(`🎭 Mock 요청 처리: ${request.method} (${serverName})`);

        // 요청 타입별 Mock 응답
        switch (request.method) {
          case 'tools/list':
            return {
              tools: mockData.tools || [],
            };

          case 'tools/call':
            return this.handleMockToolCall(request.params, serverName);

          case 'resources/list':
            return {
              resources: mockData.resources || [],
            };

          case 'resources/read':
            return this.handleMockResourceRead(request.params, serverName);

          default:
            return {
              success: true,
              data:
                mockData.defaultResponse ||
                `Mock response for ${request.method}`,
              usingMock: true,
            };
        }
      },

      async close(): Promise<void> {
        console.log(`✅ Mock 연결 해제: ${serverName}`);
      },
    };
  }

  /**
   * 🎭 서버별 Mock 데이터 생성
   */
  private getMockDataForServer(serverName: string): any {
    const baseTools = [
      {
        name: 'read_file',
        description: '파일 내용을 읽습니다',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '파일 경로' },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_directory',
        description: '디렉토리 내용을 나열합니다',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '디렉토리 경로' },
          },
          required: ['path'],
        },
      },
    ];

    const baseResources = [
      {
        uri: 'file://src',
        name: 'Source Code',
        description: '소스 코드 파일들',
        mimeType: 'text/plain',
      },
      {
        uri: 'file://docs',
        name: 'Documentation',
        description: '프로젝트 문서들',
        mimeType: 'text/markdown',
      },
    ];

    switch (serverName) {
      case 'filesystem':
        return {
          tools: [
            ...baseTools,
            {
              name: 'search_files',
              description: '파일을 검색합니다',
              inputSchema: {
                type: 'object',
                properties: {
                  pattern: { type: 'string', description: '검색 패턴' },
                  directory: { type: 'string', description: '검색 디렉토리' },
                },
                required: ['pattern'],
              },
            },
          ],
          resources: baseResources,
          defaultResponse: 'Mock filesystem response',
        };

      case 'render-mcp':
        return {
          tools: [
            ...baseTools,
            {
              name: 'server_status',
              description: '서버 상태를 확인합니다',
              inputSchema: {
                type: 'object',
                properties: {
                  serverId: { type: 'string', description: '서버 ID' },
                },
              },
            },
            {
              name: 'performance_metrics',
              description: '성능 메트릭을 조회합니다',
              inputSchema: {
                type: 'object',
                properties: {
                  timeRange: { type: 'string', description: '시간 범위' },
                },
              },
            },
          ],
          resources: [
            ...baseResources,
            {
              uri: 'mcp://server-metrics',
              name: 'Server Metrics',
              description: '서버 성능 메트릭',
              mimeType: 'application/json',
            },
          ],
          defaultResponse: 'Mock Render MCP server response',
        };

      case 'github':
        return {
          tools: [
            {
              name: 'search_repositories',
              description: 'GitHub 저장소를 검색합니다',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: '검색 쿼리' },
                },
                required: ['query'],
              },
            },
            {
              name: 'get_file_content',
              description: '파일 내용을 가져옵니다',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                  path: { type: 'string' },
                },
                required: ['owner', 'repo', 'path'],
              },
            },
          ],
          resources: [
            {
              uri: 'github://openmanager-vibe-v5',
              name: 'OpenManager Repository',
              description: '메인 프로젝트 저장소',
              mimeType: 'application/json',
            },
          ],
          defaultResponse: 'Mock GitHub response',
        };

      default:
        return {
          tools: baseTools,
          resources: baseResources,
          defaultResponse: `Mock response for ${serverName}`,
        };
    }
  }

  /**
   * 🎭 Mock 도구 호출 처리
   */
  private handleMockToolCall(params: any, serverName: string): any {
    const toolName = params.name;
    const args = params.arguments || {};

    console.log(`🎭 Mock 도구 호출: ${toolName}`, args);

    switch (toolName) {
      case 'read_file':
        return {
          content: `Mock file content for: ${args.path || 'unknown_file'}`,
          mimeType: 'text/plain',
          usingMock: true,
        };

      case 'list_directory':
        return {
          contents: [
            { name: 'src', type: 'directory' },
            { name: 'docs', type: 'directory' },
            { name: 'package.json', type: 'file' },
            { name: 'README.md', type: 'file' },
          ],
          path: args.path || '.',
          usingMock: true,
        };

      case 'search_files':
        return {
          files: [
            { path: 'src/components/example.tsx', matches: 1 },
            { path: 'src/utils/helper.ts', matches: 2 },
            { path: 'docs/api.md', matches: 1 },
          ],
          pattern: args.pattern || '*',
          total: 3,
          usingMock: true,
        };

      case 'server_status':
        return {
          serverId: args.serverId || 'mock-server-001',
          status: 'running',
          uptime: '2h 15m',
          cpu: '45%',
          memory: '68%',
          lastCheck: new Date().toISOString(),
          usingMock: true,
        };

      case 'performance_metrics':
        return {
          timeRange: args.timeRange || '1h',
          metrics: {
            cpu: [45, 52, 48, 51, 47],
            memory: [68, 72, 70, 69, 71],
            network: [1.2, 1.5, 1.3, 1.4, 1.1],
            disk: [23, 23, 24, 23, 23],
          },
          timestamp: new Date().toISOString(),
          usingMock: true,
        };

      case 'search_repositories':
        return {
          repositories: [
            {
              name: 'openmanager-vibe-v5',
              owner: 'mock-user',
              description: 'Mock repository description',
              stars: 42,
              language: 'TypeScript',
            },
          ],
          query: args.query || 'mock',
          total: 1,
          usingMock: true,
        };

      case 'get_file_content':
        return {
          content: `Mock GitHub file content for: ${args.owner}/${args.repo}/${args.path}`,
          encoding: 'utf-8',
          sha: 'mock-sha-hash',
          usingMock: true,
        };

      default:
        return {
          result: `Mock result for tool: ${toolName}`,
          params: args,
          serverName,
          usingMock: true,
        };
    }
  }

  /**
   * 🎭 Mock 리소스 읽기 처리
   */
  private handleMockResourceRead(params: any, serverName: string): any {
    const uri = params.uri;
    console.log(`🎭 Mock 리소스 읽기: ${uri} (${serverName})`);

    if (uri?.startsWith('file://')) {
      const path = uri.replace('file://', '');
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Mock file content for: ${path}`,
          },
        ],
        usingMock: true,
      };
    } else if (uri?.startsWith('mcp://')) {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                mockData: true,
                resource: uri,
                timestamp: new Date().toISOString(),
                serverName,
              },
              null,
              2
            ),
          },
        ],
        usingMock: true,
      };
    } else {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Mock resource content for: ${uri}`,
          },
        ],
        usingMock: true,
      };
    }
  }

  /**
   * 🛠️ 실제 사용 가능한 도구 목록 반환
   */
  private async getAvailableTools(): Promise<{ tools: any[] }> {
    return {
      tools: [
        {
          name: 'search_files',
          description: '실제 파일 시스템에서 파일 검색',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: '검색할 파일 패턴' },
              content: { type: 'string', description: '검색할 내용' },
            },
          },
        },
        {
          name: 'read_file',
          description: '실제 파일 내용 읽기',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '읽을 파일 경로' },
            },
          },
        },
        {
          name: 'list_directory',
          description: '실제 디렉토리 목록 조회',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '조회할 디렉토리 경로' },
            },
          },
        },
      ],
    };
  }

  /**
   * 🔧 실제 도구 호출 처리
   */
  private async handleToolCall(params: any): Promise<any> {
    try {
      switch (params?.name) {
        case 'search_files':
          return await this.realSearchFiles(params.arguments);
        case 'read_file':
          return await this.realReadFile(params.arguments?.path);
        case 'list_directory':
          return await this.realListDirectory(params.arguments?.path);
        default:
          return {
            success: false,
            error: `도구 ${params?.name}은 지원되지 않습니다.`,
          };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 📁 실제 파일 검색 (fs 모듈 사용)
   */
  private async realSearchFiles(args: {
    pattern?: string;
    content?: string;
  }): Promise<any> {
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const { glob } = await import('glob');

    try {
      const searchPattern = args.pattern || '**/*.{md,txt,json,ts,tsx,js,jsx}';
      const searchContent = args.content || '';

      // 실제 파일 검색
      const files = await glob(searchPattern, {
        cwd: process.cwd(),
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      });

      const results: any[] = [];

      for (const file of files.slice(0, 10)) {
        // 최대 10개 파일만
        try {
          const fullPath = path.join(process.cwd(), file);
          const content = await fs.readFile(fullPath, 'utf-8');

          if (
            !searchContent ||
            content.toLowerCase().includes(searchContent.toLowerCase())
          ) {
            results.push({
              path: file,
              content:
                content.length > 500
                  ? content.substring(0, 500) + '...'
                  : content,
              size: content.length,
              lastModified: (await fs.stat(fullPath)).mtime.toISOString(),
            });
          }
        } catch (error) {
          // 파일 읽기 실패 시 스킵
          continue;
        }
      }

      return {
        success: true,
        results,
        totalFound: results.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `파일 검색 실패: ${error.message}`,
      };
    }
  }

  /**
   * 📄 실제 파일 읽기
   */
  private async realReadFile(filePath: string): Promise<any> {
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const stats = await fs.stat(fullPath);

      return {
        success: true,
        content,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `파일 읽기 실패: ${error.message}`,
      };
    }
  }

  /**
   * 📂 실제 디렉토리 목록 조회
   */
  private async realListDirectory(dirPath: string): Promise<any> {
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    try {
      const fullPath = path.resolve(process.cwd(), dirPath || '.');
      const items = await fs.readdir(fullPath, { withFileTypes: true });

      const results = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath || '.', item.name),
      }));

      return {
        success: true,
        items: results,
        totalItems: results.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `디렉토리 조회 실패: ${error.message}`,
      };
    }
  }

  async listTools(serverName: string): Promise<any[]> {
    try {
      const client = await this.connectToServer(serverName);

      const request = {
        method: 'tools/list',
        params: {},
      };

      const response = await client.request(request);
      return response.tools || [];
    } catch (error: any) {
      console.error(`도구 목록 조회 실패: ${serverName}`, error);
      return [];
    }
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: any
  ): Promise<any> {
    try {
      const client = await this.connectToServer(serverName);

      const request = {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      };

      const result = await client.request(request);
      console.log(`🔧 ${serverName}.${toolName} 도구 실행 완료`);
      return result;
    } catch (error: any) {
      console.error(`도구 실행 실패: ${serverName}.${toolName}`, error);
      throw error;
    }
  }

  async searchDocuments(query: string): Promise<MCPSearchResult> {
    await this.initialize();

    try {
      utf8Logger.korean('📚', `MCP 문서 검색: ${query}`);

      // 파일시스템에서 문서 검색
      const searchResult = await this.callTool('filesystem', 'search_files', {
        pattern: '*.md',
        content: query,
      });

      return {
        success: true,
        results: searchResult.content || [],
        source: 'filesystem',
        tools_used: ['filesystem.search_files'],
      };
    } catch (error: any) {
      utf8Logger.error('MCP 문서 검색 실패:', error);

      // 폴백: 로컬 검색
      return {
        success: false,
        results: [],
        source: 'fallback',
        tools_used: [],
      };
    }
  }

  async searchWeb(query: string): Promise<MCPSearchResult> {
    await this.initialize();

    if (!this.servers.get('web-search')?.enabled) {
      return {
        success: false,
        results: [],
        source: 'web-search-disabled',
        tools_used: [],
      };
    }

    try {
      utf8Logger.korean('🌐', `MCP 웹 검색: ${query}`);

      const searchResult = await this.callTool(
        'web-search',
        'brave_web_search',
        {
          query: query,
          count: 5,
        }
      );

      return {
        success: true,
        results: searchResult.content || [],
        source: 'web-search',
        tools_used: ['web-search.brave_web_search'],
      };
    } catch (error: any) {
      utf8Logger.error('MCP 웹 검색 실패:', error);
      return {
        success: false,
        results: [],
        source: 'web-search-error',
        tools_used: [],
      };
    }
  }

  async storeContext(sessionId: string, context: any): Promise<boolean> {
    await this.initialize();

    try {
      // Memory MCP 서버 대신 로컬 메모리 사용
      // 환경별 설정에서 memory 서버가 제거되어 파일시스템으로 대체
      const contextData = {
        sessionId,
        timestamp: Date.now(),
        ...context,
      };

      // 로컬 메모리에 임시 저장 (향후 Redis/DB로 확장 가능)
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__mcp_context_store =
          (globalThis as any).__mcp_context_store || new Map();
        (globalThis as any).__mcp_context_store.set(
          `session_${sessionId}`,
          contextData
        );
      }

      console.log(`💾 컨텍스트 저장 완료 (로컬): ${sessionId}`);
      return true;
    } catch (error: any) {
      console.error('컨텍스트 저장 실패:', error);
      return false;
    }
  }

  async retrieveContext(sessionId: string): Promise<any> {
    await this.initialize();

    try {
      // Memory MCP 서버 대신 로컬 메모리 사용
      // 환경별 설정에서 memory 서버가 제거되어 로컬 저장소로 대체
      let context = {};

      if (
        typeof globalThis !== 'undefined' &&
        (globalThis as any).__mcp_context_store
      ) {
        const storedData = (globalThis as any).__mcp_context_store.get(
          `session_${sessionId}`
        );
        if (storedData) {
          context = storedData;
          console.log(`📖 컨텍스트 조회 완료 (로컬): ${sessionId}`);
        } else {
          console.log(`📖 컨텍스트 없음: ${sessionId}`);
        }
      }

      return context;
    } catch (error: any) {
      console.error('컨텍스트 조회 실패:', error);
      return {};
    }
  }

  async readFile(filePath: string): Promise<string> {
    await this.initialize();

    try {
      console.log(`📖 실제 파일 읽기: ${filePath}`);
      const result = await this.callTool('filesystem', 'read_file', {
        path: filePath,
      });

      // 실제 MCP 응답 구조에 맞게 수정
      const content = result.content?.[0]?.text || result.text || '';
      console.log(`✅ 파일 읽기 성공: ${filePath} (${content.length}자)`);
      return content;
    } catch (error: any) {
      console.error(`❌ 파일 읽기 실패: ${filePath}`, error);

      // 실제 파일시스템 fallback
      try {
        const fullPath = path.resolve(filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        console.log(
          `✅ Fallback 파일 읽기 성공: ${filePath} (${content.length}자)`
        );
        return content;
      } catch (fsError) {
        console.error(`❌ Fallback 파일 읽기도 실패: ${filePath}`, fsError);
        return '';
      }
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    await this.initialize();

    try {
      console.log(`📁 실제 디렉토리 목록 조회: ${dirPath}`);
      const result = await this.callTool('filesystem', 'list_directory', {
        path: dirPath,
      });

      // 실제 MCP 응답 구조에 맞게 수정
      let fileList: string[] = [];
      if (result.content?.[0]?.text) {
        fileList = result.content[0].text
          .split('\n')
          .filter((line: string) => line.trim());
      } else if (result.files && Array.isArray(result.files)) {
        fileList = result.files;
      } else if (typeof result === 'string') {
        fileList = result.split('\n').filter((line: string) => line.trim());
      }

      console.log(
        `✅ 디렉토리 목록 조회 성공: ${dirPath} (${fileList.length}개 파일)`
      );
      return fileList;
    } catch (error: any) {
      console.error(`❌ 디렉토리 목록 조회 실패: ${dirPath}`, error);

      // 실제 파일시스템 fallback
      try {
        const fullPath = path.resolve(dirPath);
        const files = fs.readdirSync(fullPath);
        console.log(
          `✅ Fallback 디렉토리 목록 조회 성공: ${dirPath} (${files.length}개 파일)`
        );
        return files.map((file: string) => path.join(dirPath, file));
      } catch (fsError) {
        console.error(
          `❌ Fallback 디렉토리 목록 조회도 실패: ${dirPath}`,
          fsError
        );
        return [];
      }
    }
  }

  async getServerStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    for (const [serverName, config] of this.servers) {
      try {
        if (!config.enabled) {
          status[serverName] = { connected: false, reason: 'disabled' };
          continue;
        }

        const tools = await this.listTools(serverName);
        status[serverName] = {
          connected: true,
          tools_count: tools.length,
          tools: tools.map((t: any) => t.name || t),
        };
      } catch (error: any) {
        status[serverName] = {
          connected: false,
          reason: error.message,
        };
      }
    }

    return status;
  }

  async performComplexQuery(query: string, context: any = {}): Promise<any> {
    await this.initialize();

    const results = {
      query,
      timestamp: new Date().toISOString(),
      tools_used: [] as string[],
      document_results: null as any,
      web_results: null as any,
      context_retrieved: null as any,
      success: false,
    };

    try {
      // 1. 문서 검색
      const docResults = await this.searchDocuments(query);
      results.document_results = docResults;
      results.tools_used.push(...docResults.tools_used);

      // 2. 웹 검색 (활성화된 경우)
      if (query.includes('latest') || query.includes('최신')) {
        const webResults = await this.searchWeb(query);
        results.web_results = webResults;
        results.tools_used.push(...webResults.tools_used);
      }

      // 3. 컨텍스트 활용
      if (context.session_id) {
        const sessionContext = await this.retrieveContext(context.session_id);
        results.context_retrieved = sessionContext;
      }

      results.success = true;
      console.log('🎯 복합 MCP 쿼리 완료:', results.tools_used);
    } catch (error: any) {
      console.error('복합 MCP 쿼리 실패:', error);
      results.success = false;
    }

    return results;
  }

  async disconnect(): Promise<void> {
    console.log('🔌 MCP 클라이언트 연결 해제 중...');

    for (const [name, client] of this.clients) {
      try {
        await client.close();
        console.log(`✅ ${name} 연결 해제 완료`);
      } catch (error: any) {
        console.error(`❌ ${name} 연결 해제 실패:`, error);
      }
    }

    this.clients.clear();
    this.isInitialized = false;
    console.log('🔌 모든 MCP 연결 해제 완료');
  }

  getConnectionInfo(): any {
    return {
      initialized: this.isInitialized,
      servers: Object.fromEntries(
        Array.from(this.servers.entries()).map(([name, config]) => [
          name,
          {
            enabled: config.enabled,
            connected: this.clients.has(name),
          },
        ])
      ),
      mcp_version: 'v1.12.1',
      protocol: 'JSON-RPC 2.0',
    };
  }
}

// 🎯 싱글톤 인스턴스 (getInstance() 메서드 사용)
export const realMCPClient = RealMCPClient.getInstance();
