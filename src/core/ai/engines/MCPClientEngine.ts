/**
 * MCP Client 엔진 (20% 가중치)
 * Render 공식 MCP 서버 활용
 */

import { RealMCPClient } from '../../../services/mcp/real-mcp-client';

export interface MCPRequest {
  query: string;
  category?: string;
  context?: any;
}

export interface MCPResponse {
  success: boolean;
  response?: string;
  data?: any;
  confidence: number;
  error?: string;
}

export class MCPClientEngine {
  private mcpClient: RealMCPClient;
  private initialized = false;

  constructor() {
    this.mcpClient = new RealMCPClient();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.mcpClient.initialize();
      this.initialized = true;
      console.log('✅ MCP Client 엔진 초기화 완료');
    } catch (error) {
      console.error('❌ MCP Client 엔진 초기화 실패:', error);
      // MCP 실패해도 계속 진행 (폴백 시스템)
      this.initialized = true;
    }
  }

  public async processQuery(request: MCPRequest): Promise<MCPResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = await this.mcpClient.performComplexQuery(
        request.query,
        request.context
      );

      return {
        success: true,
        response: result.response || result.data || JSON.stringify(result),
        data: result,
        confidence: 0.7, // MCP는 중간 신뢰도
      };
    } catch (error) {
      console.error('MCP Client 엔진 처리 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MCP 연결 실패',
        confidence: 0,
      };
    }
  }

  public isReady(): boolean {
    return this.initialized;
  }
}
