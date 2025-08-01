/**
 * 🎯 Official MCP Client - RealMCPClient 래퍼 (중복 제거)
 *
 * ⚠️ 기존 OfficialMCPClient는 RealMCPClient 싱글톤의 래퍼로 변경됨
 * ✅ 하위 호환성 유지
 * ✅ GCP VM MCP 서버 (컨텍스트 분석) 전용
 * ✅ AI 엔진의 컨텍스트 보조 역할
 * ✅ 중복 코드 제거
 */

import { RealMCPClient } from './real-mcp-client';
import type { MCPTool } from '@/types/mcp';

export interface CallToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * 🎯 OfficialMCPClient -> RealMCPClient 래퍼 (중복 제거)
 * AI 엔진의 컨텍스트 보조를 위한 MCP 클라이언트
 */
export class OfficialMCPClient {
  private realClient: RealMCPClient;
  private isConnected = false;

  constructor() {
    // 🎯 RealMCPClient 싱글톤 사용 (중복 방지)
    this.realClient = RealMCPClient.getInstance();
    console.log('🎯 OfficialMCPClient -> RealMCPClient 래퍼 생성');
  }

  /**
   * 🔌 연결 (RealMCPClient 위임)
   */
  async connect(): Promise<void> {
    console.log('🔗 Official MCP Client 연결 (RealMCPClient 위임)...');

    try {
      await this.realClient._initialize();
      this.isConnected = true;
      console.log(
        '✅ Official MCP Client 연결 완료 (GCP VM MCP 서버 - 컨텍스트 분석 전용)'
      );
    } catch (error) {
      console.warn('⚠️ Official MCP Client 연결 실패:', error);
      // 실패해도 폴백 모드로 연결 상태 유지
      this.isConnected = true;
    }
  }

  /**
   * 🔧 도구 목록 조회 (RealMCPClient 위임)
   */
  async listTools(serverName?: string): Promise<MCPTool[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      if (serverName) {
        return await this.realClient.listTools(serverName);
      } else {
        // 모든 서버의 도구 목록 통합
        const servers = ['filesystem', 'github', 'web-search', 'database'];
        const allTools: MCPTool[] = [];

        for (const server of servers) {
          try {
            const tools = await this.realClient.listTools(server);
            allTools.push(...tools.map((tool) => ({ ...tool, server })));
          } catch (error) {
            console.warn(`⚠️ ${server} 도구 목록 조회 실패:`, error);
          }
        }

        return allTools;
      }
    } catch (error) {
      console.error('도구 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🔧 도구 실행 (RealMCPClient 위임)
   */
  async callTool(
    serverName: string,
    toolName: string,
    arguments_: Record<string, unknown>
  ): Promise<CallToolResult> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.realClient.callTool(
        serverName,
        toolName,
        arguments_
      );

      console.log(`✅ 도구 실행 성공: ${serverName}/${toolName}`);

      // CallToolResult 형식으로 변환
      return {
        content: [
          {
            type: 'text',
            text:
              typeof result === 'string'
                ? result
                : JSON.stringify(result, null, 2),
          },
        ],
        isError: false,
        metadata: {
          toolsUsed: [`${serverName}/${toolName}`],
          success: true,
        },
      };
    } catch (error) {
      console.error(`❌ 도구 실행 실패: ${serverName}/${toolName}`, error);

      return {
        content: [
          {
            type: 'text',
            text: `❌ ${serverName}/${toolName} 실행 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          },
        ],
        isError: true,
        metadata: {
          toolsUsed: [`${serverName}/${toolName}`],
          success: false,
        },
      };
    }
  }

  /**
   * 📊 연결 상태 확인 (RealMCPClient 위임)
   */
  getConnectionStatus(): Record<string, boolean> {
    const connectionInfo = this.realClient.getConnectionInfo();
    const status: Record<string, boolean> = {};

    if (connectionInfo.servers) {
      for (const server of connectionInfo.servers) {
        status[server.name] = server.status === 'connected';
      }
    }

    return status;
  }

  /**
   * 🔌 연결 해제 (RealMCPClient 위임)
   */
  async disconnect(): Promise<void> {
    console.log('🔌 Official MCP Client 연결 해제 (RealMCPClient 위임)...');
    // RealMCPClient는 싱글톤이므로 연결 해제하지 않음 (다른 곳에서 사용 중일 수 있음)
    this.isConnected = false;
    console.log('✅ Official MCP Client 연결 해제 완료');
  }
}

// 🎯 싱글톤 인스턴스 (하위 호환성 유지)
let mcpClientInstance: OfficialMCPClient | null = null;

export function getMCPClient(): OfficialMCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new OfficialMCPClient();
  }
  return mcpClientInstance;
}
