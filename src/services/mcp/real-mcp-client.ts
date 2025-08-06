/**
 * 🎯 실제 MCP 표준 클라이언트 v4.1 (목적별 서버 분리)
 *
 * ✅ 컴포넌트 기반 아키텍처
 * ✅ 목적별 MCP 서버 분리:
 *    - AI 기능: 로컬 MCP 서버로 컨텍스트 분석
 *    - 개발/모니터링: 로컬 MCP 서버 활용
 * ✅ MCPServerManager: 서버 관리
 * ✅ MCPPerformanceMonitor: 성능 모니터링
 * ✅ MCPToolHandler: 도구 호출
 * ✅ MCPContextManager: 컨텍스트 관리
 */

import { MCPContextManager } from './components/MCPContextManager';
import { MCPPerformanceMonitor } from './components/MCPPerformanceMonitor';
import type { MCPServerConfig } from './components/MCPServerManager';
import { MCPServerManager } from './components/MCPServerManager';
import { MCPToolHandler } from './components/MCPToolHandler';
import type {
  MCPClient,
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPConnectionInfo,
  MCPToolResult,
  MCPQueryContext,
} from '@/types/mcp';

// MCPClient interface는 이제 @/types/mcp에서 가져옴
// ExtendedMCPClient는 더 이상 필요하지 않음 (MCPClient에 close가 옵셔널로 추가됨)

// RealMCP용 검색 결과 타입 (내부 사용)
interface RealMCPSearchResult {
  success: boolean;
  results: Array<{
    path: string;
    content: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>;
  source: string;
  tools_used: string[];
  responseTime?: number;
  serverUsed?: string;
}

export type MCPUsagePurpose =
  | 'ai-production'
  | 'development'
  | 'monitoring'
  | 'testing';

export class RealMCPClient {
  private static aiInstance: RealMCPClient | null = null;
  private static devToolsInstance: RealMCPClient | null = null;

  // 🎯 컴포넌트 인스턴스들
  private serverManager: MCPServerManager;
  private performanceMonitor: MCPPerformanceMonitor;
  private toolHandler: MCPToolHandler;
  private contextManager: MCPContextManager;
  private purpose: MCPUsagePurpose;

  // 기본 클라이언트 관리
  private clients: Map<string, MCPClient> = new Map();
  private isInitialized = false;

  private constructor(purpose: MCPUsagePurpose) {
    this.purpose = purpose;

    // 컴포넌트 초기화
    this.serverManager = new MCPServerManager();
    this.performanceMonitor = new MCPPerformanceMonitor();
    this.toolHandler = new MCPToolHandler();
    this.contextManager = new MCPContextManager();

    console.log(`🎯 RealMCPClient v4.1 초기화 완료 (용도: ${purpose})`);
  }

  /**
   * 🎯 AI 기능용 싱글톤 인스턴스 반환 (로컬 MCP 서버로 컨텍스트 분석)
   */
  public static getAIInstance(): RealMCPClient {
    if (!RealMCPClient.aiInstance) {
      RealMCPClient.aiInstance = new RealMCPClient('ai-production');
      console.log(
        '🤖 AI 전용 MCP 클라이언트 생성 (로컬 MCP 서버로 컨텍스트 분석)'
      );
    }
    return RealMCPClient.aiInstance;
  }

  /**
   * 🛠️ 개발 도구용 싱글톤 인스턴스 반환 (로컬 MCP 서버)
   */
  public static getDevToolsInstance(): RealMCPClient {
    if (!RealMCPClient.devToolsInstance) {
      RealMCPClient.devToolsInstance = new RealMCPClient('development');
      console.log('🛠️ 개발 도구 전용 MCP 클라이언트 생성 (로컬 MCP 서버)');
    }
    return RealMCPClient.devToolsInstance;
  }

  /**
   * 🎯 범용 싱글톤 인스턴스 반환 (호환성용 - AI 인스턴스 반환)
   * AI 엔진의 컨텍스트 보조 역할을 수행하는 MCP 클라이언트
   */
  public static getInstance(): RealMCPClient {
    return RealMCPClient.getAIInstance();
  }

  /**
   * 🚀 클라이언트 초기화
   */
  async _initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log(`✅ MCP 클라이언트 이미 초기화됨 (용도: ${this.purpose})`);
      return;
    }

    console.log(`🚀 MCP 클라이언트 초기화 시작 (용도: ${this.purpose})...`);

    try {
      // 용도별 설정 로그
      switch (this.purpose) {
        case 'ai-production':
          console.log(
            '🤖 AI 프로덕션 MCP 설정 로드 (로컬 MCP 서버 - 컨텍스트 분석)'
          );
          break;
        case 'development':
        case 'monitoring':
        case 'testing':
          console.log('🛠️ 개발 도구 MCP 설정 로드 (로컬 MCP 서버)');
          break;
        default:
          console.log('🔧 기본 MCP 설정 로드');
      }

      await this.serverManager._initialize();
      const serverNames = this.serverManager.getAvailableServers();

      for (const serverName of serverNames) {
        const serverConfig = this.serverManager.getServerConfig(serverName);
        if (serverConfig && serverConfig.enabled) {
          try {
            const client = await this.connectToServer(serverName);
            this.clients.set(serverName, client);
            console.log(`✅ ${serverName} 서버 연결 성공 (${this.purpose})`);
          } catch (error) {
            console.warn(
              `⚠️ ${serverName} 서버 연결 실패, 목업 모드로 대체:`,
              error
            );
            this.clients.set(serverName, this.createMockClient(serverName));
          }
        }
      }

      this.isInitialized = true;
      console.log(`✅ MCP 클라이언트 초기화 완료 (용도: ${this.purpose})`);
    } catch (error) {
      console.error(
        `❌ MCP 클라이언트 초기화 실패 (용도: ${this.purpose}):`,
        error
      );
      throw error;
    }
  }

  private async connectToServer(serverName: string): Promise<MCPClient> {
    const config = this.serverManager.getServerConfig(serverName);
    if (!config) {
      throw new Error(`서버 설정을 찾을 수 없습니다: ${serverName}`);
    }
    return this.serverManager.connectToServer(serverName);
  }

  private createMockClient(serverName: string): MCPClient {
    const toolHandler = this.toolHandler; // this 컨텍스트 저장
    return {
      async connect(): Promise<void> {
        console.log(`🎭 ${serverName} 목업 클라이언트 연결됨`);
      },
      async request(request: MCPRequest): Promise<MCPResponse> {
        console.log(`🎭 ${serverName} 목업 요청:`, request.method);
        if (request.method === 'tools/list') {
          const tools = await toolHandler.getAvailableTools();
          return {
            success: true,
            result: { tools: (tools.tools || []) as any[], data: {} },
          };
        }
        if (request.method === 'tools/call' && request.params?.toolName) {
          return {
            success: true,
            result: {
              content: `목업 응답: ${request.params.toolName}`,
              data: {},
            },
          };
        }
        return {
          success: true,
          result: { content: 'mock_response', data: {} },
        };
      },
      async disconnect(): Promise<void> {
        console.log(`🎭 ${serverName} 목업 클라이언트 연결 종료`);
      },
      close: async (): Promise<void> => {
        console.log(`🎭 ${serverName} 목업 클라이언트 연결 종료`);
      },
      isConnected(): boolean {
        return true;
      },
    };
  }

  async listTools(serverName: string): Promise<MCPTool[]> {
    return await this.toolHandler.listTools(serverName, this.clients);
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const startTime = Date.now();

    try {
      const result = await this.toolHandler.callTool(
        serverName,
        toolName,
        args,
        this.clients
      );
      const responseTime = Date.now() - startTime;
      const servers = this.getServersMap();
      this.performanceMonitor.updateServerStats(
        serverName,
        responseTime,
        true,
        servers
      );
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const servers = this.getServersMap();
      this.performanceMonitor.updateServerStats(
        serverName,
        responseTime,
        false,
        servers
      );
      throw error;
    }
  }

  private getServersMap(): Map<string, MCPServerConfig> {
    const servers = new Map();
    const serverNames = this.serverManager.getAvailableServers();
    for (const name of serverNames) {
      const config = this.serverManager.getServerConfig(name);
      if (config) {
        servers.set(name, config);
      }
    }
    return servers;
  }

  async searchDocuments(query: string): Promise<RealMCPSearchResult> {
    const startTime = Date.now();

    try {
      const servers = this.getServersMap();
      const serverName = this.performanceMonitor.selectOptimalServer(
        servers,
        this.clients
      );
      const result = await this.toolHandler.searchDocuments(query);

      return {
        success: result.success ?? false,
        results: Array.isArray(result.results) ? result.results.map(item => ({
          path: typeof item === 'object' && item !== null && 'path' in item ? String(item.path) : '',
          content: typeof item === 'object' && item !== null && 'content' in item ? String(item.content) : '',
          score: typeof item === 'object' && item !== null && 'score' in item ? Number(item.score) : undefined,
          metadata: typeof item === 'object' && item !== null && 'metadata' in item ? 
            (item.metadata as Record<string, unknown>) : undefined
        })) : [],
        source: result.source || 'unknown',
        tools_used: Array.isArray(result.tools_used) ? result.tools_used : [],
        responseTime: Date.now() - startTime,
        serverUsed: serverName || 'local',
      };
    } catch (error) {
      console.error('❌ 문서 검색 실패:', error);
      return {
        success: false,
        results: [],
        source: 'error',
        tools_used: [],
        responseTime: Date.now() - startTime,
      };
    }
  }

  async searchWeb(query: string): Promise<RealMCPSearchResult> {
    const result = await this.toolHandler.searchWeb(query);
    
    return {
      success: result.success ?? false,
      results: Array.isArray(result.results) ? result.results.map(item => ({
        path: typeof item === 'object' && item !== null && 'path' in item ? String(item.path) : '',
        content: typeof item === 'object' && item !== null && 'content' in item ? String(item.content) : '',
        score: typeof item === 'object' && item !== null && 'score' in item ? Number(item.score) : undefined,
        metadata: typeof item === 'object' && item !== null && 'metadata' in item ? 
          (item.metadata as Record<string, unknown>) : undefined
      })) : [],
      source: result.source || 'web',
      tools_used: Array.isArray(result.tools_used) ? result.tools_used : [],
      responseTime: result.responseTime || 0,
      serverUsed: result.serverUsed || 'web-search',
    };
  }

  async storeContext(
    sessionId: string,
    context: MCPQueryContext
  ): Promise<boolean> {
    return await this.contextManager.storeContext(sessionId, context);
  }

  async retrieveContext(sessionId: string): Promise<MCPQueryContext | null> {
    return (await this.contextManager.retrieveContext(sessionId)) as MCPQueryContext | null;
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const result = await this.toolHandler.callTool(
        'filesystem',
        'read_file',
        { path: filePath },
        this.clients
      );

      if (result.success && result.content) {
        return result.content;
      } else {
        throw new Error(result.error || '파일 읽기 실패');
      }
    } catch (error) {
      console.error(`❌ 파일 읽기 실패: ${filePath}`, error);
      throw error;
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      const result = await this.toolHandler.callTool(
        'filesystem',
        'list_directory',
        { path: dirPath },
        this.clients
      );

      if (result.success && result.metadata) {
        const items = result.metadata.items;
        if (Array.isArray(items)) {
          return items
            .filter((item): item is { name: string } => 
              typeof item === 'object' && item !== null && 'name' in item && typeof item.name === 'string'
            )
            .map((item) => item.name);
        }
        return [];
      } else {
        throw new Error(result.error || '디렉토리 목록 조회 실패');
      }
    } catch (error) {
      console.error(`❌ 디렉토리 목록 조회 실패: ${dirPath}`, error);
      throw error;
    }
  }

  async getServerStatus(): Promise<
    Record<
      string,
      {
        enabled: boolean;
        connected: boolean;
        stats: {
          totalRequests: number;
          successfulRequests: number;
          failedRequests: number;
          averageResponseTime: number;
          healthScore: number;
        };
      }
    >
  > {
    const serverNames = this.serverManager.getAvailableServers();
    const status: Record<
      string,
      {
        enabled: boolean;
        connected: boolean;
        stats: {
          totalRequests: number;
          successfulRequests: number;
          failedRequests: number;
          averageResponseTime: number;
          healthScore: number;
        };
      }
    > = {};

    for (const serverName of serverNames) {
      const config = this.serverManager.getServerConfig(serverName);
      const isConnected = this.clients.has(serverName);

      status[serverName] = {
        enabled: config?.enabled || false,
        connected: isConnected,
        stats: config?.stats || {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          healthScore: 100,
        },
      };
    }

    return status;
  }

  async performComplexQuery(
    query: string,
    context: MCPQueryContext = {}
  ): Promise<{
    query: string;
    timestamp: string;
    responseTime: number;
    sources: {
      documents: RealMCPSearchResult;
      web: RealMCPSearchResult;
    };
    context: MCPQueryContext;
  }> {
    const startTime = Date.now();

    try {
      console.log(`🔍 복합 쿼리 처리: "${query}"`);

      const docResults = await this.searchDocuments(query);
      const webResults = await this.searchWeb(query);

      const combinedResults = {
        query,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        sources: {
          documents: docResults,
          web: webResults,
        },
        context,
      };

      if (context.sessionId && typeof context.sessionId === 'string') {
        await this.storeContext(context.sessionId, context);
      }

      return combinedResults;
    } catch (error) {
      console.error('❌ 복합 쿼리 처리 실패:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    console.log('🔌 MCP 클라이언트 연결 종료 시작...');

    for (const [serverName, client] of this.clients.entries()) {
      try {
        if (client.close) {
          await client.close();
        } else {
          await client.disconnect();
        }
        console.log(`✅ ${serverName} 연결 종료됨`);
      } catch (error) {
        console.warn(`⚠️ ${serverName} 연결 종료 실패:`, error);
      }
    }

    this.clients.clear();
    this.isInitialized = false;
    this.contextManager.stopCleanupScheduler();

    console.log('✅ MCP 클라이언트 완전 종료됨');
  }

  getConnectionInfo(): MCPConnectionInfo {
    const serverNames = this.serverManager.getAvailableServers();

    const servers: MCPConnectionInfo['servers'] = Array.from(
      this.clients.entries()
    ).map(([name, _client]) => ({
      name,
      status: 'connected' as const,
      lastConnected: new Date(),
    }));

    // 연결되지 않은 서버들도 추가
    serverNames.forEach((serverName) => {
      if (!this.clients.has(serverName)) {
        servers.push({
          name: serverName,
          status: 'disconnected' as const,
        });
      }
    });

    return {
      connected: this.isInitialized,
      servers,
      stats: {
        totalRequests: 0, // 실제 통계는 performanceMonitor에서 가져와야 함
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
      },
    };
  }
}

export default RealMCPClient;
