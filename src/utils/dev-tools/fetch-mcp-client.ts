/**
 * 🔧 Fetch MCP Client - 개발자 도구
 *
 * MCP 서버와의 통신을 위한 fetch 기반 클라이언트
 * 개발 중 MCP API를 쉽게 테스트하고 활용할 수 있는 도구
 *
 * 🌐 공식 Fetch MCP Server 연동 지원
 */

export interface MCPClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  // 공식 Fetch MCP Server 설정
  fetchMcpUrl?: string;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  responseTime: number;
  timestamp: string;
}

export interface MCPHealthResponse {
  status: 'operational' | 'degraded' | 'down';
  servers: Array<{
    name: string;
    status: string;
    uptime?: string;
    lastHeartbeat?: string;
    metrics?: {
      requestCount: number;
      errorRate: number;
      averageResponseTime: number;
      memoryUsage: number;
    };
  }>;
  summary: {
    totalServers: number;
    connectedServers: number;
    healthyServers: number;
    totalRequests: number;
    averageErrorRate: number;
    systemLoad: string;
  };
}

export interface MCPQueryRequest {
  query: string;
  sessionId?: string;
  mcpServerUrl?: string;
  context?: any;
}

export interface MCPQueryResponse {
  response: string;
  confidence: number;
  source: string;
  processingTime: number;
  sessionId: string;
  toolsAvailable?: number;
}

// 🌐 공식 Fetch MCP Server 도구 타입
export interface FetchMCPTool {
  name: 'fetch_html' | 'fetch_json' | 'fetch_txt' | 'fetch_markdown';
  arguments: {
    url: string;
    headers?: Record<string, string>;
    timeout?: number;
  };
}

export interface FetchMCPResponse {
  success: boolean;
  content?: string;
  contentType?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  error?: string;
}

export class FetchMCPClient {
  private config: Required<MCPClientConfig>;
  private baseUrl: string;
  private fetchMcpUrl: string;

  constructor(config: MCPClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      fetchMcpUrl: config.fetchMcpUrl || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FetchMCPClient/1.0',
        ...config.headers,
      },
    };
    this.baseUrl = this.config.baseUrl;
    this.fetchMcpUrl = this.config.fetchMcpUrl;
  }

  /**
   * 🏥 MCP 서버 헬스 체크
   */
  async checkHealth(): Promise<MCPResponse<MCPHealthResponse>> {
    return this.makeRequest<MCPHealthResponse>('GET', '/api/mcp/health');
  }

  /**
   * 🔥 MCP 서버 웜업
   */
  async warmup(): Promise<MCPResponse<any>> {
    return this.makeRequest('POST', '/api/mcp/warmup', {
      action: 'warmup',
    });
  }

  /**
   * 💬 MCP 질의응답
   */
  async query(
    request: MCPQueryRequest
  ): Promise<MCPResponse<MCPQueryResponse>> {
    return this.makeRequest<MCPQueryResponse>(
      'POST',
      '/api/mcp/query',
      request
    );
  }

  /**
   * 📊 MCP 모니터링 상태 조회
   */
  async getMonitoringStatus(
    type: string = 'status',
    server: string = 'all'
  ): Promise<MCPResponse<any>> {
    const params = new URLSearchParams({ type, server });
    return this.makeRequest('GET', `/api/mcp/monitoring?${params}`);
  }

  /**
   * ⚡ MCP 모니터링 액션 실행
   */
  async executeMonitoringAction(
    action: string,
    server?: string,
    config?: any
  ): Promise<MCPResponse<any>> {
    return this.makeRequest('POST', '/api/mcp/monitoring', {
      action,
      server,
      config,
    });
  }

  /**
   * 🤖 AI MCP 상태 조회
   */
  async getAIMCPStatus(): Promise<MCPResponse<any>> {
    return this.makeRequest('GET', '/api/ai/mcp');
  }

  /**
   * 🤖 AI MCP 쿼리 실행
   */
  async executeAIMCPQuery(
    query: string,
    context?: any,
    useHybrid: boolean = false
  ): Promise<MCPResponse<any>> {
    return this.makeRequest('POST', '/api/ai/mcp', {
      query,
      context,
      use_hybrid: useHybrid,
    });
  }

  /**
   * 🧠 AI Agent MCP 쿼리
   */
  async executeAIAgentQuery(
    question: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    category: string = 'general',
    context?: any
  ): Promise<MCPResponse<any>> {
    return this.makeRequest('POST', '/api/ai/mcp/query', {
      question,
      priority,
      category,
      context,
    });
  }

  /**
   * 📁 MCP 파일 읽기
   */
  async readFile(filePath: string): Promise<MCPResponse<any>> {
    return this.makeRequest('POST', '/api/mcp/tools/read_file', {
      path: filePath,
    });
  }

  /**
   * 📂 MCP 디렉토리 목록
   */
  async listDirectory(dirPath: string): Promise<MCPResponse<any>> {
    return this.makeRequest('POST', '/api/mcp/tools/list_directory', {
      path: dirPath,
    });
  }

  /**
   * 🔍 MCP 파일 검색
   */
  async searchFiles(query: string, path?: string): Promise<MCPResponse<any>> {
    return this.makeRequest('POST', '/api/mcp/tools/search_files', {
      query,
      path,
    });
  }

  // 🌐 공식 Fetch MCP Server 연동 메서드들

  /**
   * 🌐 공식 Fetch MCP Server 헬스 체크
   */
  async checkFetchMCPHealth(): Promise<MCPResponse<any>> {
    return this.makeFetchMCPRequest('GET', '/health');
  }

  /**
   * 🛠️ 공식 Fetch MCP Server 도구 목록
   */
  async getFetchMCPTools(): Promise<MCPResponse<any>> {
    return this.makeFetchMCPRequest('GET', '/tools');
  }

  /**
   * 🌐 HTML 페이지 가져오기
   */
  async fetchHTML(
    url: string,
    headers?: Record<string, string>
  ): Promise<MCPResponse<FetchMCPResponse>> {
    return this.callFetchMCPTool('fetch_html', { url, headers });
  }

  /**
   * 📄 JSON 데이터 가져오기
   */
  async fetchJSON(
    url: string,
    headers?: Record<string, string>
  ): Promise<MCPResponse<FetchMCPResponse>> {
    return this.callFetchMCPTool('fetch_json', { url, headers });
  }

  /**
   * 📝 텍스트 파일 가져오기
   */
  async fetchText(
    url: string,
    headers?: Record<string, string>
  ): Promise<MCPResponse<FetchMCPResponse>> {
    return this.callFetchMCPTool('fetch_txt', { url, headers });
  }

  /**
   * 📋 Markdown 파일 가져오기
   */
  async fetchMarkdown(
    url: string,
    headers?: Record<string, string>
  ): Promise<MCPResponse<FetchMCPResponse>> {
    return this.callFetchMCPTool('fetch_markdown', { url, headers });
  }

  /**
   * 🔧 공식 Fetch MCP Server 도구 호출
   */
  private async callFetchMCPTool(
    toolName: FetchMCPTool['name'],
    args: FetchMCPTool['arguments']
  ): Promise<MCPResponse<FetchMCPResponse>> {
    return this.makeFetchMCPRequest('POST', '/call-tool', {
      name: toolName,
      arguments: args,
    });
  }

  /**
   * 🌐 Raw fetch 요청 (커스텀 요청용)
   */
  async rawFetch(
    endpoint: string,
    options?: RequestInit
  ): Promise<MCPResponse<any>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...options?.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json().catch(() => ({}));

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok
          ? undefined
          : `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 📊 배치 요청 실행
   */
  async batchRequest(
    requests: Array<{
      name: string;
      method: 'GET' | 'POST';
      endpoint: string;
      body?: any;
    }>
  ): Promise<Record<string, MCPResponse<any>>> {
    const results: Record<string, MCPResponse<any>> = {};

    await Promise.allSettled(
      requests.map(async req => {
        const result = await this.makeRequest(
          req.method,
          req.endpoint,
          req.body
        );
        results[req.name] = result;
      })
    );

    return results;
  }

  /**
   * 🌐 공식 Fetch MCP Server 배치 요청
   */
  async batchFetch(
    requests: Array<{
      name: string;
      tool: FetchMCPTool['name'];
      url: string;
      headers?: Record<string, string>;
    }>
  ): Promise<Record<string, MCPResponse<FetchMCPResponse>>> {
    const results: Record<string, MCPResponse<FetchMCPResponse>> = {};

    await Promise.allSettled(
      requests.map(async req => {
        const result = await this.callFetchMCPTool(req.tool, {
          url: req.url,
          headers: req.headers,
        });
        results[req.name] = result;
      })
    );

    return results;
  }

  /**
   * 🔄 주기적 헬스 체크 시작
   */
  startPeriodicHealthCheck(
    intervalMs: number = 30000,
    callback?: (health: MCPResponse<MCPHealthResponse>) => void
  ): () => void {
    const interval = setInterval(async () => {
      try {
        const health = await this.checkHealth();
        callback?.(health);

        if (health.success) {
          console.log('🟢 MCP 헬스 체크 성공:', health.data?.summary);
        } else {
          console.log('🔴 MCP 헬스 체크 실패:', health.error);
        }
      } catch (error) {
        console.error('❌ MCP 헬스 체크 오류:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }

  /**
   * 🔧 내부 요청 메서드 (기본 MCP 서버용)
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any
  ): Promise<MCPResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: this.config.headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.config.timeout),
        });

        const responseTime = Date.now() - startTime;
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          return {
            success: true,
            data: data as T,
            responseTime,
            timestamp: new Date().toISOString(),
          };
        } else {
          const error = `HTTP ${response.status}: ${data.error || response.statusText}`;

          if (attempt === this.config.retries) {
            return {
              success: false,
              error,
              responseTime,
              timestamp: new Date().toISOString(),
            };
          }

          console.warn(
            `🔄 MCP 요청 재시도 ${attempt}/${this.config.retries}: ${error}`
          );
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        if (attempt === this.config.retries) {
          return {
            success: false,
            error: errorMessage,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          };
        }

        console.warn(
          `🔄 MCP 네트워크 재시도 ${attempt}/${this.config.retries}: ${errorMessage}`
        );
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🌐 공식 Fetch MCP Server 요청 메서드
   */
  private async makeFetchMCPRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any
  ): Promise<MCPResponse<T>> {
    const url = `${this.fetchMcpUrl}${endpoint}`;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: this.config.headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.config.timeout),
        });

        const responseTime = Date.now() - startTime;
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          return {
            success: true,
            data: data as T,
            responseTime,
            timestamp: new Date().toISOString(),
          };
        } else {
          const error = `HTTP ${response.status}: ${data.error || response.statusText}`;

          if (attempt === this.config.retries) {
            return {
              success: false,
              error,
              responseTime,
              timestamp: new Date().toISOString(),
            };
          }

          console.warn(
            `🔄 Fetch MCP 요청 재시도 ${attempt}/${this.config.retries}: ${error}`
          );
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        if (attempt === this.config.retries) {
          return {
            success: false,
            error: errorMessage,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          };
        }

        console.warn(
          `🔄 Fetch MCP 네트워크 재시도 ${attempt}/${this.config.retries}: ${errorMessage}`
        );
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

// 🚀 전역 MCP 클라이언트 인스턴스
export const mcpClient = new FetchMCPClient();

// 🔧 개발자 편의 함수들
export const mcp = {
  // 기본 작업
  health: () => mcpClient.checkHealth(),
  warmup: () => mcpClient.warmup(),
  query: (q: string, sessionId?: string) =>
    mcpClient.query({ query: q, sessionId }),

  // 모니터링
  status: (type?: string, server?: string) =>
    mcpClient.getMonitoringStatus(type, server),
  restart: (server?: string) =>
    mcpClient.executeMonitoringAction('restart', server),
  healthcheck: (server?: string) =>
    mcpClient.executeMonitoringAction('healthcheck', server),

  // AI 기능
  ai: {
    status: () => mcpClient.getAIMCPStatus(),
    query: (q: string, context?: any, hybrid?: boolean) =>
      mcpClient.executeAIMCPQuery(q, context, hybrid),
    agent: (
      question: string,
      priority?: 'low' | 'medium' | 'high',
      category?: string
    ) => mcpClient.executeAIAgentQuery(question, priority, category),
  },

  // 파일 시스템
  fs: {
    read: (path: string) => mcpClient.readFile(path),
    list: (path: string) => mcpClient.listDirectory(path),
    search: (query: string, path?: string) =>
      mcpClient.searchFiles(query, path),
  },

  // 🌐 공식 Fetch MCP Server 기능
  fetch: {
    health: () => mcpClient.checkFetchMCPHealth(),
    tools: () => mcpClient.getFetchMCPTools(),
    html: (url: string, headers?: Record<string, string>) =>
      mcpClient.fetchHTML(url, headers),
    json: (url: string, headers?: Record<string, string>) =>
      mcpClient.fetchJSON(url, headers),
    text: (url: string, headers?: Record<string, string>) =>
      mcpClient.fetchText(url, headers),
    markdown: (url: string, headers?: Record<string, string>) =>
      mcpClient.fetchMarkdown(url, headers),
    batch: (
      requests: Array<{
        name: string;
        tool: FetchMCPTool['name'];
        url: string;
        headers?: Record<string, string>;
      }>
    ) => mcpClient.batchFetch(requests),
  },

  // 유틸리티
  batch: (
    requests: Array<{
      name: string;
      method: 'GET' | 'POST';
      endpoint: string;
      body?: any;
    }>
  ) => mcpClient.batchRequest(requests),
  watch: (
    intervalMs?: number,
    callback?: (health: MCPResponse<MCPHealthResponse>) => void
  ) => mcpClient.startPeriodicHealthCheck(intervalMs, callback),
  raw: (endpoint: string, options?: RequestInit) =>
    mcpClient.rawFetch(endpoint, options),
};

// 타입들은 위에서 이미 export interface로 내보내졌습니다.
