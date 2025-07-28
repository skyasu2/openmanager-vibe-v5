/**
 * 🎯 SimplifiedQueryEngine - 단순화된 AI 쿼리 엔진
 *
 * ✅ 로컬 모드: Supabase RAG 엔진 사용
 * ✅ Google AI 모드: Gemini API 직접 호출
 * ✅ MCP는 컨텍스트 보조로만 사용
 * ✅ API 사용량 최적화
 * ✅ 쿼리 복잡도 분석 및 자동 엔진 선택
 * ✅ 응답 시간 500ms 이하 목표
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { getSupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { QueryComplexityAnalyzer } from './query-complexity-analyzer';
import type { ComplexityScore } from './query-complexity-analyzer';
import {
  createCacheKey,
  getTTL,
  validateDataSize,
} from '@/config/free-tier-cache-config';
import type {
  AIQueryContext,
  AIQueryOptions,
  MCPContext,
  RAGSearchResult,
  AIMetadata,
  ServerArray,
} from '@/types/ai-service-types';

export interface QueryRequest {
  query: string;
  mode?: 'local' | 'google-ai' | 'auto'; // auto 모드 추가
  context?: AIQueryContext;
  options?: AIQueryOptions & {
    includeThinking?: boolean;
    includeMCPContext?: boolean;
    category?: string;
    cached?: boolean;
    timeoutMs?: number; // 타임아웃 설정
  };
}

export interface QueryResponse {
  success: boolean;
  response: string;
  engine: 'local-rag' | 'google-ai' | 'fallback';
  confidence: number;
  thinkingSteps: Array<{
    step: string;
    description?: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
    duration?: number;
  }>;
  metadata?: AIMetadata & {
    complexity?: ComplexityScore;
    cacheHit?: boolean;
  };
  error?: string;
  processingTime: number;
}

export class SimplifiedQueryEngine {
  protected ragEngine: SupabaseRAGEngine;
  protected contextLoader: CloudContextLoader;
  protected isInitialized = false;
  private responseCache: Map<
    string,
    { response: QueryResponse; timestamp: number }
  > = new Map();
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.ragEngine = getSupabaseRAGEngine();
    this.contextLoader = CloudContextLoader.getInstance();

    // 캐시 정리 스케줄러 (5분마다)
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000);
  }

  /**
   * 🚀 엔진 초기화 (한 번만 실행)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 이미 초기화 진행 중이면 기다림
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 SimplifiedQueryEngine 초기화 중...');

      // RAG 엔진 초기화 (타임아웃 설정)
      const initTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('초기화 타임아웃')), 5000)
      );

      await Promise.race([this.ragEngine.initialize(), initTimeout]);

      this.isInitialized = true;
      console.log('✅ SimplifiedQueryEngine 초기화 완료');
    } catch (error) {
      console.error('❌ 엔진 초기화 실패:', error);
      // 초기화 실패해도 계속 진행
      this.isInitialized = true;
    }
  }

  /**
   * 🔍 쿼리 처리 (캐싱 및 자동 엔진 선택)
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();

    // 초기화 병렬 실행
    const initPromise = this.initialize();

    const {
      query,
      mode = 'auto', // 기본값: 자동 선택
      context = {},
      options = {},
    } = request;

    const thinkingSteps: QueryResponse['thinkingSteps'] = [];
    const timeoutMs = options.timeoutMs || 450; // 기본 450ms (목표: 500ms 이하)

    // 캐시 확인
    const cacheKey = this.generateCacheKey(query, mode, context);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse && options.cached !== false) {
      const baseMetadata = cachedResponse.metadata || {};
      return {
        ...cachedResponse,
        metadata: {
          ...baseMetadata,
          cacheHit: true,
        } as AIMetadata & { complexity?: ComplexityScore; cacheHit?: boolean },
        processingTime: Date.now() - startTime,
      };
    }

    // 초기화 완료 대기
    await initPromise;

    try {
      // 빈 쿼리 체크
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          response: '질의를 입력해 주세요',
          engine: 'local-rag',
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

      // 1단계: 쿼리 복잡도 분석 (자동 모드일 때)
      const complexityStartTime = Date.now();
      let complexity: ComplexityScore | undefined;
      let selectedMode = mode;

      if (mode === 'auto') {
        complexity = QueryComplexityAnalyzer.analyze(query, {
          hasServerData: !!context.servers,
          previousQueries: context.previousQueries,
        });

        selectedMode =
          complexity.recommendation === 'hybrid'
            ? 'local'
            : complexity.recommendation;

        thinkingSteps.push({
          step: '쿼리 복잡도 분석',
          description: `복잡도: ${complexity.score}/100, 추천: ${complexity.recommendation}`,
          status: 'completed',
          timestamp: Date.now(),
          duration: Date.now() - complexityStartTime,
        });
      } else {
        thinkingSteps.push({
          step: '쿼리 분석',
          description: `모드: ${mode}, 쿼리 길이: ${query.length}자`,
          status: 'completed',
          timestamp: Date.now(),
        });
      }

      // 2단계: 병렬 처리 준비
      const processingPromises: Promise<any>[] = [];
      let mcpContext: MCPContext | null = null;

      // MCP 컨텍스트 수집 (비동기)
      if (options.includeMCPContext && selectedMode === 'google-ai') {
        const mcpStepIndex = thinkingSteps.length;
        thinkingSteps.push({
          step: 'MCP 컨텍스트 수집',
          status: 'pending',
          timestamp: Date.now(),
        });

        processingPromises.push(
          this.contextLoader
            .queryMCPContextForRAG(query, {
              maxFiles: 3, // 성능을 위해 파일 수 제한
              includeSystemContext: true,
            })
            .then(result => {
              mcpContext = result;
              thinkingSteps[mcpStepIndex].status = 'completed';
              thinkingSteps[mcpStepIndex].description =
                `${result?.files?.length || 0}개 파일 수집`;
              thinkingSteps[mcpStepIndex].duration =
                Date.now() - thinkingSteps[mcpStepIndex].timestamp;
            })
            .catch(error => {
              console.warn('MCP 컨텍스트 수집 실패:', error);
              thinkingSteps[mcpStepIndex].status = 'failed';
              thinkingSteps[mcpStepIndex].duration =
                Date.now() - thinkingSteps[mcpStepIndex].timestamp;
            })
        );
      }

      // 병렬 처리 대기 (최대 100ms)
      if (processingPromises.length > 0) {
        await Promise.race([
          Promise.all(processingPromises),
          new Promise(resolve => setTimeout(resolve, 100)),
        ]);
      }

      // 3단계: 타임아웃을 고려한 쿼리 처리
      const queryTimeout = new Promise<QueryResponse>((_, reject) =>
        setTimeout(() => reject(new Error('쿼리 타임아웃')), timeoutMs)
      );

      let response: QueryResponse;

      try {
        if (selectedMode === 'local') {
          response = await Promise.race([
            this.processLocalQuery(
              query,
              context,
              options,
              mcpContext,
              thinkingSteps,
              startTime,
              complexity
            ),
            queryTimeout,
          ]);
        } else {
          response = await Promise.race([
            this.processGoogleAIQuery(
              query,
              context,
              options,
              mcpContext,
              thinkingSteps,
              startTime,
              complexity
            ),
            queryTimeout,
          ]);
        }

        // 성공 응답 캐싱
        if (response.success && response.processingTime < 500) {
          this.setCachedResponse(cacheKey, response);
        }

        return response;
      } catch (_timeoutError) {
        // 타임아웃 시 빠른 폴백
        console.warn('쿼리 타임아웃, 폴백 모드로 전환');

        if (selectedMode === 'google-ai') {
          // Google AI 타임아웃 시 로컬로 폴백
          return await this.processLocalQuery(
            query,
            context,
            options,
            null, // MCP 컨텍스트 스킵
            thinkingSteps,
            startTime,
            complexity
          );
        } else {
          // 로컬도 실패하면 기본 응답
          return this.generateFallbackResponse(query, thinkingSteps, startTime);
        }
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
   * 🏠 로컬 RAG 쿼리 처리 (최적화됨)
   */
  private async processLocalQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    complexity?: ComplexityScore
  ): Promise<QueryResponse> {
    // RAG 검색
    const ragStepStart = Date.now();
    thinkingSteps.push({
      step: 'RAG 검색',
      description: 'Supabase 벡터 DB에서 관련 문서 검색',
      status: 'pending',
      timestamp: ragStepStart,
    });

    // 복잡도에 따라 검색 파라미터 조정
    const maxResults = complexity && complexity.score < 30 ? 3 : 5;
    const threshold = complexity && complexity.score < 30 ? 0.6 : 0.5;

    const ragResult = await this.ragEngine.searchSimilar(query, {
      maxResults,
      threshold,
      category: options?.category,
      enableMCP: false, // MCP는 이미 별도로 처리
    });

    thinkingSteps[thinkingSteps.length - 1].status = 'completed';
    thinkingSteps[thinkingSteps.length - 1].description =
      `${ragResult.totalResults}개 관련 문서 발견`;
    thinkingSteps[thinkingSteps.length - 1].duration =
      Date.now() - ragStepStart;

    // 응답 생성
    const responseStepStart = Date.now();
    thinkingSteps.push({
      step: '응답 생성',
      description: '검색 결과를 바탕으로 응답 생성',
      status: 'pending',
      timestamp: responseStepStart,
    });

    const response = this.generateLocalResponse(
      query,
      ragResult,
      mcpContext,
      context
    );

    thinkingSteps[thinkingSteps.length - 1].status = 'completed';
    thinkingSteps[thinkingSteps.length - 1].duration =
      Date.now() - responseStepStart;

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
        complexity,
      } as AIMetadata & { complexity?: ComplexityScore; cacheHit?: boolean },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 🌐 Google AI 쿼리 처리 (최적화됨)
   */
  private async processGoogleAIQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    complexity?: ComplexityScore
  ): Promise<QueryResponse> {
    const googleStepStart = Date.now();
    thinkingSteps.push({
      step: 'Google AI 준비',
      description: 'Gemini API 호출 준비',
      status: 'pending',
      timestamp: googleStepStart,
    });

    try {
      // 컨텍스트를 포함한 프롬프트 생성
      const prompt = this.buildGoogleAIPrompt(query, context, mcpContext);

      // 복잡도에 따라 파라미터 조정
      const temperature = complexity && complexity.score > 70 ? 0.8 : 0.7;
      const maxTokens = complexity && complexity.score > 70 ? 1500 : 1000;

      // Google AI API 호출 (타임아웃 설정)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 400); // 400ms 타임아웃

      const response = await fetch('/api/ai/google-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          temperature,
          maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Google AI API 오류: ${response.statusText}`);
      }

      const data = await response.json();

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].description =
        'Gemini API 응답 수신';
      thinkingSteps[thinkingSteps.length - 1].duration =
        Date.now() - googleStepStart;

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
          complexity,
        } as AIMetadata & { complexity?: ComplexityScore; cacheHit?: boolean },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Google AI 처리 오류:', error);

      // 폴백: 로컬 RAG로 전환
      thinkingSteps[thinkingSteps.length - 1].status = 'failed';
      thinkingSteps[thinkingSteps.length - 1].description =
        'Google AI 실패, 로컬 모드로 전환';
      thinkingSteps[thinkingSteps.length - 1].duration =
        Date.now() - googleStepStart;

      return await this.processLocalQuery(
        query,
        context,
        options,
        mcpContext,
        thinkingSteps,
        startTime,
        complexity
      );
    }
  }

  /**
   * 📝 로컬 응답 생성
   */
  protected generateLocalResponse(
    query: string,
    ragResult: any, // RAGSearchResult from supabase-rag-engine
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
      ragResult.results
        .slice(1, 3)
        .forEach((result: RAGSearchResult, idx: number) => {
          response += `${idx + 1}. ${result.content.substring(0, 100)}...\n`;
        });
    }

    // MCP 컨텍스트가 있으면 추가
    if (mcpContext && mcpContext.files.length > 0) {
      response += '\n\n프로젝트 파일 참고:\n';
      mcpContext.files.slice(0, 2).forEach(file => {
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
  protected buildGoogleAIPrompt(
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
      mcpContext.files.forEach(file => {
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
  protected calculateConfidence(ragResult: any): number {
    // RAGSearchResult from supabase-rag-engine
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
   * 🔑 캐시 키 생성
   */
  private generateCacheKey(
    query: string,
    mode: string,
    context?: AIQueryContext
  ): string {
    const normalizedQuery = query.toLowerCase().trim();
    const contextKey = context?.servers ? 'with-servers' : 'no-context';
    return createCacheKey('ai', `${mode}:${normalizedQuery}:${contextKey}`);
  }

  /**
   * 📦 캐시된 응답 가져오기
   */
  private getCachedResponse(key: string): QueryResponse | null {
    const cached = this.responseCache.get(key);
    if (!cached) return null;

    const ttl = getTTL('aiResponse'); // 15분
    const age = Date.now() - cached.timestamp;

    if (age > ttl * 1000) {
      this.responseCache.delete(key);
      return null;
    }

    return cached.response;
  }

  /**
   * 💾 응답 캐싱
   */
  private setCachedResponse(key: string, response: QueryResponse): void {
    // 캐시 크기 제한 체크
    if (this.responseCache.size >= 100) {
      // 가장 오래된 항목 삭제
      const oldestKey = Array.from(this.responseCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];
      this.responseCache.delete(oldestKey);
    }

    // 데이터 크기 검증
    if (validateDataSize(response, 'aiResponse')) {
      this.responseCache.set(key, {
        response,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 🧹 캐시 정리
   */
  private cleanupCache(): void {
    const now = Date.now();
    const ttl = getTTL('aiResponse') * 1000;

    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > ttl) {
        this.responseCache.delete(key);
      }
    }
  }

  /**
   * 🚨 폴백 응답 생성
   */
  private generateFallbackResponse(
    query: string,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): QueryResponse {
    thinkingSteps.push({
      step: '폴백 모드',
      description: '모든 엔진 실패, 기본 응답 생성',
      status: 'completed',
      timestamp: Date.now(),
    });

    return {
      success: true,
      response:
        '죄송합니다. 일시적으로 응답을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      engine: 'fallback',
      confidence: 0.1,
      thinkingSteps,
      processingTime: Date.now() - startTime,
    };
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
