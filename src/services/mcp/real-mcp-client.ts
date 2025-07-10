/**
 * 🎯 실제 MCP 표준 클라이언트 v4.1 (목적별 서버 분리)
 *
 * ✅ 컴포넌트 기반 아키텍처
 * ✅ 목적별 MCP 서버 분리:
 *    - AI 기능: GCP VM MCP 서버 (컨텍스트 분석) 전용
 *    - 개발/모니터링: Vercel 내장 MCP
 * ✅ MCPServerManager: 서버 관리
 * ✅ MCPPerformanceMonitor: 성능 모니터링
 * ✅ MCPToolHandler: 도구 호출
 * ✅ MCPContextManager: 컨텍스트 관리
 */

import { MCPContextManager } from './components/MCPContextManager';
import { MCPPerformanceMonitor } from './components/MCPPerformanceMonitor';
import {
  MCPServerConfig,
  MCPServerManager,
} from './components/MCPServerManager';
import { MCPToolHandler } from './components/MCPToolHandler';

interface MCPClient {
  connect(transport?: any): Promise<void>;
  request(request: any): Promise<any>;
  close(): Promise<void>;
  process?: any;
  nextId?: number;
  pendingRequests?: Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
    }
  >;
}

interface MCPSearchResult {
  success: boolean;
  results: any[];
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
   * 🎯 AI 기능용 싱글톤 인스턴스 반환 (GCP VM MCP 서버 - 컨텍스트 분석 전용)
   */
  public static getAIInstance(): RealMCPClient {
    if (!RealMCPClient.aiInstance) {
      RealMCPClient.aiInstance = new RealMCPClient('ai-production');
      console.log('🤖 AI 전용 MCP 클라이언트 생성 (GCP VM MCP 서버 - 컨텍스트 분석 전용)');
    }
    return RealMCPClient.aiInstance;
  }

  /**
   * 🛠️ 개발 도구용 싱글톤 인스턴스 반환 (Vercel 내장 MCP)
   */
  public static getDevToolsInstance(): RealMCPClient {
    if (!RealMCPClient.devToolsInstance) {
      RealMCPClient.devToolsInstance = new RealMCPClient('development');
      console.log('🛠️ 개발 도구 전용 MCP 클라이언트 생성 (Vercel 내장 MCP)');
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
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log(`✅ MCP 클라이언트 이미 초기화됨 (용도: ${this.purpose})`);
      return;
    }

    console.log(`🚀 MCP 클라이언트 초기화 시작 (용도: ${this.purpose})...`);

    try {
      // 용도별 설정 로그
      switch (this.purpose) {
        case 'ai-production':
          console.log('🤖 AI 프로덕션 MCP 설정 로드 (GCP VM MCP 서버 - 컨텍스트 분석)');
          break;
        case 'development':
        case 'monitoring':
        case 'testing':
          console.log('🛠️ 개발 도구 MCP 설정 로드 (Vercel 내장)');
          break;
        default:
          console.log('🔧 기본 MCP 설정 로드');
      }

      await this.serverManager.initialize();
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
    return {
      async connect(): Promise<void> {
        console.log(`🎭 ${serverName} 목업 클라이언트 연결됨`);
      },
      async request(request: any): Promise<any> {
        console.log(`🎭 ${serverName} 목업 요청:`, request.method);
        if (request.method === 'tools/list') {
          return await (this as any).toolHandler.getAvailableTools();
        }
        if (request.method === 'tools/call') {
          return {
            content: [
              { type: 'text', text: `목업 응답: ${request.params.name}` },
            ],
          };
        }
        return { result: 'mock_response' };
      },
      async close(): Promise<void> {
        console.log(`🎭 ${serverName} 목업 클라이언트 연결 종료`);
      },
    };
  }

  async listTools(serverName: string): Promise<any[]> {
    return await this.toolHandler.listTools(serverName, this.clients);
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: any
  ): Promise<any> {
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

  async searchDocuments(query: string): Promise<MCPSearchResult> {
    const startTime = Date.now();

    try {
      const servers = this.getServersMap();
      const serverName = this.performanceMonitor.selectOptimalServer(
        servers,
        this.clients
      );
      const result = await this.toolHandler.searchDocuments(query);

      return {
        ...result,
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

  async searchWeb(query: string): Promise<MCPSearchResult> {
    return await this.toolHandler.searchWeb(query);
  }

  async storeContext(sessionId: string, context: any): Promise<boolean> {
    return await this.contextManager.storeContext(sessionId, context);
  }

  async retrieveContext(sessionId: string): Promise<any> {
    return await this.contextManager.retrieveContext(sessionId);
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const result = await this.toolHandler.callTool(
        'filesystem',
        'read_file',
        { path: filePath },
        this.clients
      );

      if (result.success) {
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

      if (result.success) {
        return result.items.map((item: any) => item.name);
      } else {
        throw new Error(result.error || '디렉토리 목록 조회 실패');
      }
    } catch (error) {
      console.error(`❌ 디렉토리 목록 조회 실패: ${dirPath}`, error);
      throw error;
    }
  }

  async getServerStatus(): Promise<Record<string, any>> {
    const serverNames = this.serverManager.getAvailableServers();
    const status: Record<string, any> = {};

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

  async performComplexQuery(query: string, context: any = {}): Promise<any> {
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

      if (context.sessionId) {
        await this.storeContext(context.sessionId, combinedResults);
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
        await client.close();
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

  getConnectionInfo(): any {
    const serverNames = this.serverManager.getAvailableServers();
    const performanceReport = this.performanceMonitor.generatePerformanceReport(
      new Map()
    );
    const contextStats = this.contextManager.getContextStats();

    return {
      isInitialized: this.isInitialized,
      totalServers: serverNames.length,
      connectedClients: this.clients.size,
      availableServers: serverNames,
      connectedServers: Array.from(this.clients.keys()),
      performance: performanceReport,
      context: contextStats,
      timestamp: new Date().toISOString(),
    };
  }
}

export default RealMCPClient;
