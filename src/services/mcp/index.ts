/**
 * 🎯 MCP Processor - RealMCPClient 래퍼 (중복 제거)
 * 
 * ⚠️ 기존 MCPProcessor는 RealMCPClient 싱글톤의 래퍼로 변경됨
 * ✅ 하위 호환성 유지
 * ✅ Render MCP 서버 전용
 * ✅ 중복 코드 제거
 */

import { RealMCPClient } from './real-mcp-client';

export interface MCPRequest {
  query: string;
  context?: any;
}

export interface MCPResponse {
  success: boolean;
  response?: string;
  data?: any;
  error?: string;
  confidence: number;
}

/**
 * 🎯 MCPProcessor -> RealMCPClient 래퍼 (중복 제거)
 */
export class MCPProcessor {
  private static instance: MCPProcessor;
  private realClient: RealMCPClient;
  private isInitialized: boolean = false;

  private constructor() {
    // 🎯 RealMCPClient 싱글톤 사용 (중복 방지)
    this.realClient = RealMCPClient.getInstance();
    console.log('🎯 MCPProcessor -> RealMCPClient 래퍼 생성');
  }

  public static getInstance(): MCPProcessor {
    if (!MCPProcessor.instance) {
      MCPProcessor.instance = new MCPProcessor();
    }
    return MCPProcessor.instance;
  }

  /**
   * MCP 프로세서 초기화 (RealMCPClient 위임)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 🎯 Render MCP 서버만 초기화 (개발용 제외)
      await this.realClient.initialize();
      this.isInitialized = true;
      console.log('✅ MCP Processor 초기화 완료 (RealMCPClient 위임)');
    } catch (error) {
      console.error('❌ MCP Processor 초기화 실패:', error);
      // MCP 실패해도 계속 진행 (폴백 시스템)
      this.isInitialized = true;
    }
  }

  /**
   * MCP 쿼리 처리 (RealMCPClient 위임)
   */
  async processQuery(request: MCPRequest): Promise<MCPResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 🎯 Render MCP 서버를 통한 복합 쿼리 처리
      const result = await this.realClient.performComplexQuery(
        request.query,
        request.context
      );

      return {
        success: result.success || true,
        response: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        data: result,
        confidence: 0.8, // 중간-높은 신뢰도
      };
    } catch (error) {
      console.error('MCP Processor 처리 실패 (Render 서버):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Render MCP 연결 실패',
        confidence: 0,
      };
    }
  }

  /**
   * 간단한 의도 분석 (기본 패턴 매칭)
   */
  async analyzeIntent(text: string): Promise<{
    category: string;
    confidence: number;
    keywords: string[];
  }> {
    const lowerText = text.toLowerCase();

    // 간소화된 의도 분석
    if (lowerText.includes('파일') || lowerText.includes('file')) {
      return { category: 'filesystem', confidence: 0.8, keywords: ['파일', 'file'] };
    }

    if (lowerText.includes('서버') || lowerText.includes('server')) {
      return { category: 'system', confidence: 0.8, keywords: ['서버', 'server'] };
    }

    if (lowerText.includes('데이터베이스') || lowerText.includes('database')) {
      return { category: 'database', confidence: 0.8, keywords: ['데이터베이스', 'database'] };
    }

    return { category: 'general', confidence: 0.5, keywords: [] };
  }

  /**
   * 상태 확인 (RealMCPClient 위임)
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 연결 정보 (RealMCPClient 위임)
   */
  getConnectionInfo(): any {
    return this.realClient.getConnectionInfo();
  }
}

// 🎯 싱글톤 인스턴스 (하위 호환성 유지)
export const mcpProcessor = MCPProcessor.getInstance();
