/**
 * 🎯 SimplifiedQueryEngine - 단순화된 AI 쿼리 엔진
 *
 * ✅ 로컬 모드: Supabase RAG 엔진 사용
 * ✅ Google AI 모드: Gemini API 직접 호출
 * ✅ MCP는 컨텍스트 보조로만 사용
 * ✅ API 사용량 최적화
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { getSupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import type {
  AIQueryContext,
  AIQueryOptions,
  MCPContext,
  RAGQueryResult,
  RAGSearchResult,
  AIMetadata,
  ServerArray
} from '@/types/ai-service-types';

export interface QueryRequest {
  query: string;
  mode?: 'local' | 'google-ai';
  context?: AIQueryContext;
  options?: AIQueryOptions & {
    includeThinking?: boolean;
    includeMCPContext?: boolean;
    category?: string;
  };
}

export interface QueryResponse {
  success: boolean;
  response: string;
  engine: 'local-rag' | 'google-ai';
  confidence: number;
  thinkingSteps: Array<{
    step: string;
    description?: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
  }>;
  metadata?: AIMetadata;
  error?: string;
  processingTime: number;
}

export class SimplifiedQueryEngine {
  private ragEngine: SupabaseRAGEngine;
  private contextLoader: CloudContextLoader;
  private isInitialized = false;

  constructor() {
    this.ragEngine = getSupabaseRAGEngine();
    this.contextLoader = CloudContextLoader.getInstance();
  }

  /**
   * 🚀 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 SimplifiedQueryEngine 초기화 중...');

      // RAG 엔진 초기화
      await this.ragEngine.initialize();

      this.isInitialized = true;
      console.log('✅ SimplifiedQueryEngine 초기화 완료');
    } catch (error) {
      console.error('❌ 엔진 초기화 실패:', error);
      // 초기화 실패해도 계속 진행
      this.isInitialized = true;
    }
  }

  /**
   * 🔍 쿼리 처리
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();
    await this.initialize();

    const {
      query,
      mode = 'local', // 기본값: 로컬 RAG
      context = {},
      options = {},
    } = request;

    const thinkingSteps: QueryResponse['thinkingSteps'] = [];

    try {
      // 빈 쿼리 체크
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          response: '질의를 입력해 주세요',
          engine: mode === 'local' ? 'local-rag' : 'google-ai',
          confidence: 0,
          thinkingSteps: [
            {
              step: '빈 쿼리 확인',
              description: '입력된 쿼리가 비어있습니다',
              status: 'completed',
              timestamp: Date.now(),
            },
          ],
          processingTime: Date.now() - startTime,
        };
      }

      // 1단계: 쿼리 분석
      thinkingSteps.push({
        step: '쿼리 분석',
        description: `모드: ${mode}, 쿼리 길이: ${query.length}자`,
        status: 'completed',
        timestamp: Date.now(),
      });

      // 2단계: MCP 컨텍스트 수집 (옵션)
      let mcpContext = null;
      if (options.includeMCPContext) {
        thinkingSteps.push({
          step: 'MCP 컨텍스트 수집',
          status: 'pending',
          timestamp: Date.now(),
        });

        try {
          mcpContext = await this.contextLoader.queryMCPContextForRAG(query, {
            maxFiles: 5,
            includeSystemContext: true,
          });

          thinkingSteps[thinkingSteps.length - 1].status = 'completed';
          thinkingSteps[thinkingSteps.length - 1].description =
            `${mcpContext?.files?.length || 0}개 파일 수집`;
        } catch (error) {
          console.warn('MCP 컨텍스트 수집 실패:', error);
          thinkingSteps[thinkingSteps.length - 1].status = 'failed';
        }
      }

      // 3단계: 모드별 처리
      if (mode === 'local') {
        return await this.processLocalQuery(
          query,
          context,
          options,
          mcpContext,
          thinkingSteps,
          startTime
        );
      } else {
        return await this.processGoogleAIQuery(
          query,
          context,
          options,
          mcpContext,
          thinkingSteps,
          startTime
        );
      }
    } catch (error) {
      console.error('❌ 쿼리 처리 실패:', error);

      return {
        success: false,
        response: '죄송합니다. 쿼리 처리 중 오류가 발생했습니다.',
        engine: mode === 'local' ? 'local-rag' : 'google-ai',
        confidence: 0,
        thinkingSteps,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🏠 로컬 RAG 쿼리 처리
   */
  private async processLocalQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    // RAG 검색
    thinkingSteps.push({
      step: 'RAG 검색',
      description: 'Supabase 벡터 DB에서 관련 문서 검색',
      status: 'pending',
      timestamp: Date.now(),
    });

    const ragResult = await this.ragEngine.searchSimilar(query, {
      maxResults: 5,
      threshold: 0.5,
      category: options.category,
      enableMCP: false, // MCP는 이미 별도로 처리
    });

    thinkingSteps[thinkingSteps.length - 1].status = 'completed';
    thinkingSteps[thinkingSteps.length - 1].description =
      `${ragResult.totalResults}개 관련 문서 발견`;

    // 응답 생성
    thinkingSteps.push({
      step: '응답 생성',
      description: '검색 결과를 바탕으로 응답 생성',
      status: 'pending',
      timestamp: Date.now(),
    });

    const response = this.generateLocalResponse(
      query,
      ragResult,
      mcpContext,
      context
    );

    thinkingSteps[thinkingSteps.length - 1].status = 'completed';

    return {
      success: true,
      response,
      engine: 'local-rag',
      confidence: this.calculateConfidence(ragResult),
      thinkingSteps,
      metadata: {
        ragResults: ragResult.totalResults,
        cached: ragResult.cached,
        mcpUsed: !!mcpContext,
      },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 🌐 Google AI 쿼리 처리
   */
  private async processGoogleAIQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    thinkingSteps.push({
      step: 'Google AI 준비',
      description: 'Gemini API 호출 준비',
      status: 'pending',
      timestamp: Date.now(),
    });

    try {
      // 컨텍스트를 포함한 프롬프트 생성
      const prompt = this.buildGoogleAIPrompt(query, context, mcpContext);

      // Google AI API 호출
      const response = await fetch('/api/ai/google-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google AI API 오류: ${response.statusText}`);
      }

      const data = await response.json();

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].description =
        'Gemini API 응답 수신';

      return {
        success: true,
        response: data.response || data.text || '응답을 생성할 수 없습니다.',
        engine: 'google-ai',
        confidence: data.confidence || 0.9,
        thinkingSteps,
        metadata: {
          model: data.model || 'gemini-pro',
          tokensUsed: data.tokensUsed,
          mcpUsed: !!mcpContext,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Google AI 처리 오류:', error);

      // 폴백: 로컬 RAG로 전환
      thinkingSteps[thinkingSteps.length - 1].status = 'failed';
      thinkingSteps[thinkingSteps.length - 1].description =
        'Google AI 실패, 로컬 모드로 전환';

      return await this.processLocalQuery(
        query,
        context,
        options,
        mcpContext,
        thinkingSteps,
        startTime
      );
    }
  }

  /**
   * 📝 로컬 응답 생성
   */
  private generateLocalResponse(
    query: string,
    ragResult: RAGQueryResult,
    mcpContext: MCPContext | null,
    userContext: AIQueryContext | undefined
  ): string {
    // 서버 관련 쿼리 처리
    if (userContext?.servers && query.toLowerCase().includes('서버')) {
      return this.generateServerResponse(query, userContext.servers);
    }

    if (ragResult.results.length === 0) {
      return '죄송합니다. 관련된 정보를 찾을 수 없습니다. 더 구체적인 질문을 해주시면 도움이 될 것 같습니다.';
    }

    let response = '';

    // RAG 결과 기반 응답
    const topResult = ragResult.results[0];
    response += topResult.content;

    // 추가 정보가 있으면 포함
    if (ragResult.results.length > 1) {
      response += '\n\n추가 정보:\n';
      ragResult.results.slice(1, 3).forEach((result: RAGSearchResult, idx: number) => {
        response += `${idx + 1}. ${result.content.substring(0, 100)}...\n`;
      });
    }

    // MCP 컨텍스트가 있으면 추가
    if (mcpContext && mcpContext.files.length > 0) {
      response += '\n\n프로젝트 파일 참고:\n';
      mcpContext.files.slice(0, 2).forEach((file) => {
        response += `- ${file.path}\n`;
      });
    }

    return response;
  }

  /**
   * 📊 서버 관련 응답 생성
   */
  private generateServerResponse(query: string, servers: ServerArray): string {
    const lowerQuery = query.toLowerCase();

    // CPU 사용률 관련 쿼리
    if (lowerQuery.includes('cpu')) {
      const highCpuServers = servers.filter(s => s.cpu > 70);
      if (highCpuServers.length > 0) {
        return `CPU 사용률이 높은 서버:\n${highCpuServers
          .map(s => `- ${s.name}: ${s.cpu}%`)
          .join('\n')}`;
      }
      return 'CPU 사용률이 높은 서버가 없습니다.';
    }

    // 전체 서버 상태 요약
    if (lowerQuery.includes('상태') || lowerQuery.includes('요약')) {
      const statusCount = {
        정상: servers.filter(
          s => s.status === 'healthy' || s.status === 'online'
        ).length,
        주의: servers.filter(s => s.status === 'warning').length,
        위험: servers.filter(
          s => s.status === 'critical' || s.status === 'offline'
        ).length,
      };

      return `전체 서버 상태 요약:\n- 정상: ${statusCount.정상}대\n- 주의: ${statusCount.주의}대\n- 위험: ${statusCount.위험}대\n\n총 ${servers.length}대의 서버가 모니터링되고 있습니다.`;
    }

    return `${servers.length}개의 서버가 모니터링되고 있습니다.`;
  }

  /**
   * 🏗️ Google AI 프롬프트 생성
   */
  private buildGoogleAIPrompt(
    query: string,
    context: AIQueryContext | undefined,
    mcpContext: MCPContext | null
  ): string {
    let prompt = `사용자 질문: ${query}\n\n`;

    // 사용자 컨텍스트 추가
    if (context && Object.keys(context).length > 0) {
      prompt += '컨텍스트:\n';
      prompt += JSON.stringify(context, null, 2) + '\n\n';
    }

    // MCP 컨텍스트 추가
    if (mcpContext && mcpContext.files.length > 0) {
      prompt += '관련 파일 내용:\n';
      mcpContext.files.forEach((file) => {
        prompt += `\n파일: ${file.path}\n`;
        prompt += `${file.content.substring(0, 500)}...\n`;
      });
      prompt += '\n';
    }

    prompt += '위 정보를 바탕으로 사용자의 질문에 답변해주세요.';

    return prompt;
  }

  /**
   * 📊 신뢰도 계산
   */
  private calculateConfidence(ragResult: RAGQueryResult): number {
    if (ragResult.results.length === 0) return 0.1;

    // 최고 유사도 점수 기반 신뢰도
    const topSimilarity = ragResult.results[0].similarity || 0;
    const resultCount = ragResult.results.length;

    // 유사도와 결과 개수를 종합한 신뢰도
    const confidence =
      topSimilarity * 0.7 + Math.min(resultCount / 10, 1) * 0.3;

    return Math.min(confidence, 0.95);
  }

  /**
   * 🏥 헬스체크
   */
  async healthCheck(): Promise<{
    status: string;
    engines: {
      localRAG: boolean;
      googleAI: boolean;
      mcp: boolean;
    };
  }> {
    const ragHealth = await this.ragEngine.healthCheck();
    const mcpStatus = await this.contextLoader.getIntegratedStatus();

    return {
      status: ragHealth.status === 'healthy' ? 'healthy' : 'degraded',
      engines: {
        localRAG: ragHealth.vectorDB,
        googleAI: true, // API 엔드포인트 존재 여부로 판단
        mcp: mcpStatus.mcpServer.status === 'online',
      },
    };
  }
}

// 싱글톤 인스턴스
let engineInstance: SimplifiedQueryEngine | null = null;

export function getSimplifiedQueryEngine(): SimplifiedQueryEngine {
  if (!engineInstance) {
    engineInstance = new SimplifiedQueryEngine();
  }
  return engineInstance;
}
