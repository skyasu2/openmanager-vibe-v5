/**
 * 🎯 MCP Processor - 컨텍스트 보조 도구
 *
 * ⚠️ AI 기능 제거, 순수 컨텍스트 제공자로 변경
 * ✅ 파일 시스템 접근
 * ✅ 문서 검색
 * ✅ 컨텍스트 수집
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

export interface MCPContextRequest {
  query: string;
  paths?: string[];
  maxFiles?: number;
  includeSystemContext?: boolean;
}

export interface MCPContextResponse {
  success: boolean;
  files: Array<{
    path: string;
    content: string;
    type: 'file' | 'directory';
  }>;
  systemContext?: any;
  error?: string;
}

/**
 * 🎯 MCPProcessor - 컨텍스트 보조 도구
 */
export class MCPProcessor {
  private static instance: MCPProcessor;
  private realClient: RealMCPClient;
  private isInitialized: boolean = false;

  private constructor() {
    // 🎯 RealMCPClient 싱글톤 사용
    this.realClient = RealMCPClient.getInstance();
    console.log('🎯 MCPProcessor - 컨텍스트 보조 도구 생성');
  }

  public static getInstance(): MCPProcessor {
    if (!MCPProcessor.instance) {
      MCPProcessor.instance = new MCPProcessor();
    }
    return MCPProcessor.instance;
  }

  /**
   * MCP 프로세서 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.realClient.initialize();
      this.isInitialized = true;
      console.log('✅ MCP Processor 초기화 완료 (컨텍스트 모드)');
    } catch (error) {
      console.error('❌ MCP Processor 초기화 실패:', error);
      this.isInitialized = true;
    }
  }

  /**
   * 🔍 컨텍스트 수집 (AI 기능 제거)
   */
  async collectContext(
    request: MCPContextRequest
  ): Promise<MCPContextResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const {
        query,
        paths = [],
        maxFiles = 10,
        includeSystemContext = true,
      } = request;

      // 파일 시스템에서 관련 파일 수집
      const files: MCPContextResponse['files'] = [];

      // 문서 검색
      const searchResults = await this.realClient.searchDocuments(query);
      if (searchResults.success && searchResults.results) {
        searchResults.results.forEach((result: any) => {
          if (result.path && result.content) {
            files.push({
              path: result.path,
              content: result.content,
              type: 'file',
            });
          }
        });
      }

      // 지정된 경로의 파일 읽기
      for (const path of paths.slice(0, maxFiles)) {
        try {
          const content = await this.realClient.readFile(path);
          if (content) {
            files.push({ path, content, type: 'file' });
          }
        } catch (error) {
          console.warn(`파일 읽기 실패: ${path}`);
        }
      }

      // 시스템 컨텍스트
      let systemContext = null;
      if (includeSystemContext) {
        systemContext = await this.realClient.getServerStatus();
      }

      return {
        success: true,
        files: files.slice(0, maxFiles),
        systemContext,
      };
    } catch (error) {
      console.error('컨텍스트 수집 실패:', error);
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : '컨텍스트 수집 실패',
      };
    }
  }

  /**
   * MCP 쿼리 처리 - Deprecated (하위 호환성용)
   * @deprecated SimplifiedQueryEngine을 사용하세요
   */
  async processQuery(request: MCPRequest): Promise<MCPResponse> {
    console.warn(
      '⚠️ MCPProcessor.processQuery는 deprecated됩니다. SimplifiedQueryEngine을 사용하세요.'
    );

    // 컨텍스트만 수집하여 반환
    const contextResult = await this.collectContext({
      query: request.query,
      maxFiles: 5,
    });

    return {
      success: contextResult.success,
      response:
        '이 메서드는 더 이상 AI 응답을 생성하지 않습니다. SimplifiedQueryEngine을 사용하세요.',
      data: contextResult,
      confidence: 0,
    };
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
      return {
        category: 'filesystem',
        confidence: 0.8,
        keywords: ['파일', 'file'],
      };
    }

    if (lowerText.includes('서버') || lowerText.includes('server')) {
      return {
        category: 'system',
        confidence: 0.8,
        keywords: ['서버', 'server'],
      };
    }

    if (lowerText.includes('데이터베이스') || lowerText.includes('database')) {
      return {
        category: 'database',
        confidence: 0.8,
        keywords: ['데이터베이스', 'database'],
      };
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
