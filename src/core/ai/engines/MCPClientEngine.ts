/**
 * MCP Client 엔진 (20% 가중치)
 * 🎯 Render MCP 서버 전용 (중복 제거)
 * ✅ RealMCPClient 싱글톤 사용
 * ✅ 개발용 MCP는 별도 분리
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
  error?: string;
  data?: any;
  confidence: number;
}

export class MCPClientEngine {
  private static instance: MCPClientEngine | null = null;
  private mcpClient: RealMCPClient;
  private initialized = false;

  private constructor() {
    // 🎯 RealMCPClient 싱글톤 사용 (중복 방지)
    this.mcpClient = RealMCPClient.getInstance();
  }

  public static getInstance(): MCPClientEngine {
    if (!MCPClientEngine.instance) {
      MCPClientEngine.instance = new MCPClientEngine();
    }
    return MCPClientEngine.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 🎯 Render MCP 서버만 초기화 (개발용 제외)
      await this.mcpClient.initialize();
      this.initialized = true;
      console.log('✅ MCP Client 엔진 초기화 완료 (Render 서버 전용)');
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
      // 🎯 Render MCP 서버를 통한 쿼리 처리
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
      console.error('MCP Client 엔진 처리 실패 (Render 서버):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Render MCP 연결 실패',
        confidence: 0,
      };
    }
  }

  public isReady(): boolean {
    return this.initialized;
  }
}
