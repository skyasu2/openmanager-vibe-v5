/**
 * 🧠 Official MCP Client Implementation
 * 
 * ✅ Model Context Protocol 표준 기반
 * ✅ TypeScript 완전 지원
 * ✅ 멀티 서버 연결 관리
 * ✅ 에러 핸들링 & 재연결
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { 
  CallToolRequest, 
  CallToolResult, 
  ListToolsRequest, 
  Tool 
} from '@modelcontextprotocol/sdk/types.js';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface MCPStandardConfig {
  servers: {
    filesystem: MCPServerConfig;
    git: MCPServerConfig;
    postgres: MCPServerConfig;
    custom?: MCPServerConfig;
  };
  options: {
    timeout: number;
    retryAttempts: number;
    keepAlive: boolean;
  };
}

export class OfficialMCPClient {
  private clients: Map<string, Client> = new Map();
  private config: MCPStandardConfig;
  private isConnected = false;
  private reconnectAttempts = new Map<string, number>();

  constructor(config: MCPStandardConfig) {
    this.config = config;
  }

  /**
   * 🚀 모든 MCP 서버에 연결
   */
  async connect(): Promise<void> {
    console.log('🔌 [MCP] 공식 MCP 서버들에 연결 중...');
    
    const connectionPromises = Object.entries(this.config.servers).map(
      async ([serverName, serverConfig]) => {
        try {
          await this.connectToServer(serverName, serverConfig);
          console.log(`✅ [MCP] ${serverName} 서버 연결 성공`);
        } catch (error) {
          console.error(`❌ [MCP] ${serverName} 서버 연결 실패:`, error);
          throw error;
        }
      }
    );

    await Promise.all(connectionPromises);
    this.isConnected = true;
    console.log('🎉 [MCP] 모든 서버 연결 완료');
  }

  /**
   * 🔗 개별 서버 연결
   */
  private async connectToServer(name: string, config: MCPServerConfig): Promise<void> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
      cwd: config.cwd || process.cwd()
    });

    const client = new Client(
      {
        name: `openmanager-${name}-client`,
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );

    await client.connect(transport);
    this.clients.set(name, client);
    this.reconnectAttempts.set(name, 0);
  }

  /**
   * 🛠️ 사용 가능한 모든 도구 조회
   */
  async listAllTools(): Promise<Map<string, Tool[]>> {
    const toolsMap = new Map<string, Tool[]>();

    for (const [serverName, client] of this.clients) {
      try {
        const request: ListToolsRequest = {
          method: 'tools/list',
          params: {}
        };
        
        const response = await client.request(request);
        toolsMap.set(serverName, response.tools || []);
        
        console.log(`📋 [MCP] ${serverName}: ${response.tools?.length || 0}개 도구 발견`);
      } catch (error) {
        console.error(`❌ [MCP] ${serverName} 도구 목록 조회 실패:`, error);
        toolsMap.set(serverName, []);
      }
    }

    return toolsMap;
  }

  /**
   * ⚡ 도구 실행
   */
  async callTool(
    serverName: string, 
    toolName: string, 
    arguments_: Record<string, any>
  ): Promise<CallToolResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`🚫 [MCP] ${serverName} 서버가 연결되지 않음`);
    }

    try {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_
        }
      };

      console.log(`🔧 [MCP] ${serverName}/${toolName} 실행 중...`);
      const result = await client.request(request);
      
      console.log(`✅ [MCP] ${serverName}/${toolName} 실행 완료`);
      return result;
    } catch (error) {
      console.error(`❌ [MCP] ${serverName}/${toolName} 실행 실패:`, error);
      
      // 재연결 시도
      await this.handleReconnection(serverName);
      throw error;
    }
  }

  /**
   * 🔄 연결 재시도
   */
  private async handleReconnection(serverName: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(serverName) || 0;
    
    if (attempts < this.config.options.retryAttempts) {
      console.log(`🔄 [MCP] ${serverName} 재연결 시도 ${attempts + 1}/${this.config.options.retryAttempts}`);
      
      try {
        const serverConfig = this.config.servers[serverName as keyof typeof this.config.servers];
        if (serverConfig) {
          await this.connectToServer(serverName, serverConfig);
          this.reconnectAttempts.set(serverName, 0);
          console.log(`✅ [MCP] ${serverName} 재연결 성공`);
        }
      } catch (error) {
        this.reconnectAttempts.set(serverName, attempts + 1);
        console.error(`❌ [MCP] ${serverName} 재연결 실패:`, error);
      }
    }
  }

  /**
   * 📊 연결 상태 확인
   */
  getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const [serverName] of this.clients) {
      status[serverName] = true; // 클라이언트가 존재하면 연결된 것으로 간주
    }
    
    return status;
  }

  /**
   * 🔌 모든 연결 종료
   */
  async disconnect(): Promise<void> {
    console.log('🔌 [MCP] 모든 서버 연결 종료 중...');
    
    const disconnectPromises = Array.from(this.clients.entries()).map(
      async ([serverName, client]) => {
        try {
          await client.close();
          console.log(`✅ [MCP] ${serverName} 연결 종료 완료`);
        } catch (error) {
          console.error(`❌ [MCP] ${serverName} 연결 종료 실패:`, error);
        }
      }
    );

    await Promise.all(disconnectPromises);
    this.clients.clear();
    this.isConnected = false;
    console.log('🎉 [MCP] 모든 연결 종료 완료');
  }

  /**
   * 🔍 서버별 도구 검색
   */
  async findToolByName(toolName: string): Promise<{ server: string; tool: Tool } | null> {
    const allTools = await this.listAllTools();
    
    for (const [serverName, tools] of allTools) {
      const foundTool = tools.find(tool => tool.name === toolName);
      if (foundTool) {
        return { server: serverName, tool: foundTool };
      }
    }
    
    return null;
  }

  /**
   * 🎯 스마트 도구 실행 (자동 서버 선택)
   */
  async smartCallTool(toolName: string, arguments_: Record<string, any>): Promise<CallToolResult> {
    const toolInfo = await this.findToolByName(toolName);
    
    if (!toolInfo) {
      throw new Error(`🚫 [MCP] 도구 '${toolName}'을 찾을 수 없음`);
    }
    
    return this.callTool(toolInfo.server, toolName, arguments_);
  }

  /**
   * 📈 헬스체크
   */
  async healthCheck(): Promise<Record<string, { status: 'healthy' | 'error'; latency?: number }>> {
    const health: Record<string, { status: 'healthy' | 'error'; latency?: number }> = {};
    
    for (const [serverName] of this.clients) {
      const startTime = Date.now();
      try {
        await this.listAllTools();
        const latency = Date.now() - startTime;
        health[serverName] = { status: 'healthy', latency };
      } catch (error) {
        health[serverName] = { status: 'error' };
      }
    }
    
    return health;
  }
} 