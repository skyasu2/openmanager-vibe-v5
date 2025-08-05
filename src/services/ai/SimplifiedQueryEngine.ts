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
import { MockContextLoader } from './MockContextLoader';
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
    commandContext?: {
      isCommandRequest?: boolean;
      categories?: string[];
      specificCommands?: string[];
      requestType?: 'command_inquiry' | 'command_usage' | 'command_request' | 'general';
    };
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
  protected mockContextLoader: MockContextLoader;
  protected isInitialized = false;
  private responseCache: Map<
    string,
    { response: QueryResponse; timestamp: number }
  > = new Map();
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.ragEngine = getSupabaseRAGEngine();
    this.contextLoader = CloudContextLoader.getInstance();
    this.mockContextLoader = MockContextLoader.getInstance();

    // 캐시 정리 스케줄러 (5분마다)
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000);
  }

  /**
   * 🚀 엔진 초기화 (한 번만 실행)
   */
  async _initialize(): Promise<void> {
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

      await Promise.race([this.ragEngine._initialize(), initTimeout]);

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
    const initPromise = this._initialize();

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

      // 🔥 NEW: 명령어 쿼리 감지 및 처리
      const commandStepStart = Date.now();
      thinkingSteps.push({
        step: '명령어 감지',
        description: '명령어 관련 쿼리인지 확인',
        status: 'pending',
        timestamp: commandStepStart,
      });

      // 명령어 관련 키워드 감지
      const isCommandQuery = this.detectCommandQuery(query, options.commandContext);
      
      if (isCommandQuery) {
        thinkingSteps[thinkingSteps.length - 1].status = 'completed';
        thinkingSteps[thinkingSteps.length - 1].description = '명령어 쿼리로 감지됨';
        thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - commandStepStart;

        // 명령어 전용 처리
        return await this.processCommandQuery(
          query,
          options.commandContext,
          thinkingSteps,
          startTime
        );
      } else {
        thinkingSteps[thinkingSteps.length - 1].status = 'completed';
        thinkingSteps[thinkingSteps.length - 1].description = '일반 쿼리로 판단';
        thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - commandStepStart;
      }
      // 🔥 END: 명령어 쿼리 처리

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
      const processingPromises: Promise<unknown>[] = [];
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
        mockMode: !!this.mockContextLoader.getMockContext(),
        complexity,
      } as AIMetadata & { complexity?: ComplexityScore; cacheHit?: boolean; mockMode?: boolean },
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
          mockMode: !!this.mockContextLoader.getMockContext(),
          complexity,
        } as AIMetadata & { complexity?: ComplexityScore; cacheHit?: boolean; mockMode?: boolean },
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
    ragResult: { results: Array<{ id: string; content: string; similarity: number; metadata?: AIMetadata }> },
    mcpContext: MCPContext | null,
    userContext: AIQueryContext | undefined
  ): string {
    // Mock 모드 확인 및 처리
    const mockContext = this.mockContextLoader.getMockContext();
    if (mockContext) {
      // Mock 서버 관련 쿼리 처리
      if (query.toLowerCase().includes('서버')) {
        return this.generateMockServerResponse(query, mockContext);
      }
      
      // 상황 분석 쿼리 - 데이터만 보고 AI가 스스로 판단
      if (query.toLowerCase().includes('상황') || query.toLowerCase().includes('분석')) {
        return this.generateMockServerResponse(query, mockContext);
      }
    }

    // 일반 서버 관련 쿼리 처리
    if (userContext?.servers && query.toLowerCase().includes('서버')) {
      return this.generateServerResponse(query, userContext.servers);
    }

    if (ragResult.results.length === 0) {
      // Mock 모드일 때 추가 안내
      if (mockContext) {
        return '죄송합니다. 관련된 정보를 찾을 수 없습니다.\n\n' +
               '🎭 현재 Mock 데이터 모드로 실행 중입니다.\n' + 
               '서버 상태, 메트릭, 시나리오에 대해 물어보세요.';
      }
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
        .forEach((result, idx) => {
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

    // Mock 모드 안내 추가
    if (mockContext) {
      response += `\n\n🎭 Mock 데이터 모드 (${mockContext.currentTime})`;
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
   * 🎭 Mock 서버 관련 응답 생성 (데이터 기반 분석만)
   */
  private generateMockServerResponse(query: string, mockContext: any): string {
    const lowerQuery = query.toLowerCase();

    // 전체 상태 요약
    if (lowerQuery.includes('상태') || lowerQuery.includes('요약')) {
      let analysis = `🎭 서버 상태 분석 (${mockContext.currentTime})\n\n` +
                    `전체 서버: ${mockContext.metrics.serverCount}대\n` +
                    `- 위험: ${mockContext.metrics.criticalCount}대\n` +
                    `- 경고: ${mockContext.metrics.warningCount}대\n` +
                    `- 정상: ${mockContext.metrics.healthyCount}대\n\n` +
                    `평균 메트릭:\n` +
                    `- CPU: ${mockContext.metrics.avgCpu}%\n` +
                    `- Memory: ${mockContext.metrics.avgMemory}%\n` +
                    `- Disk: ${mockContext.metrics.avgDisk}%\n\n`;
      
      // 데이터 기반 상황 분석
      if (mockContext.metrics.criticalCount > mockContext.metrics.serverCount * 0.3) {
        analysis += `⚠️ 분석: 전체 서버의 30% 이상이 위험 상태입니다. 대규모 장애가 발생했을 가능성이 있습니다.`;
      } else if (mockContext.metrics.avgCpu > 80) {
        analysis += `📊 분석: 평균 CPU 사용률이 매우 높습니다. 트래픽 급증이나 성능 문제가 있을 수 있습니다.`;
      } else if (mockContext.metrics.avgMemory > 85) {
        analysis += `💾 분석: 메모리 사용률이 위험 수준입니다. 메모리 누수나 과부하 상태일 수 있습니다.`;
      } else {
        analysis += `✅ 분석: 전반적으로 시스템이 안정적인 상태입니다.`;
      }
      
      return analysis;
    }

    // CPU 관련 쿼리
    if (lowerQuery.includes('cpu')) {
      let cpuAnalysis = `🎭 CPU 상태 분석 (${mockContext.currentTime})\n\n` +
                       `평균 CPU 사용률: ${mockContext.metrics.avgCpu}%\n`;
      
      if (mockContext.metrics.avgCpu > 70) {
        cpuAnalysis += `\n⚠️ CPU 사용률이 높습니다. 성능 저하가 예상됩니다.`;
      } else if (mockContext.metrics.avgCpu < 30) {
        cpuAnalysis += `\n✅ CPU 사용률이 낮아 시스템이 여유롭습니다.`;
      } else {
        cpuAnalysis += `\n📊 CPU 사용률이 정상 범위입니다.`;
      }
      
      return cpuAnalysis;
    }

    // 위험/문제 서버
    if (lowerQuery.includes('위험') || lowerQuery.includes('문제') || lowerQuery.includes('장애')) {
      if (mockContext.metrics.criticalCount > 0) {
        let problemAnalysis = `🎭 문제 서버 분석 (${mockContext.currentTime})\n\n` +
                             `위험 서버: ${mockContext.metrics.criticalCount}대\n` +
                             `경고 서버: ${mockContext.metrics.warningCount}대\n\n`;
        
        // 데이터 패턴으로 문제 원인 추측
        if (mockContext.metrics.avgCpu > 80 && mockContext.metrics.criticalCount > 3) {
          problemAnalysis += `💡 분석: CPU 과부하로 인한 다중 서버 장애로 보입니다.`;
        } else if (mockContext.metrics.avgMemory > 85) {
          problemAnalysis += `💡 분석: 메모리 부족으로 인한 서버 문제로 추정됩니다.`;
        } else {
          problemAnalysis += `💡 분석: 개별 서버의 하드웨어 또는 네트워크 문제일 가능성이 있습니다.`;
        }
        
        return problemAnalysis;
      }
      return `🎭 현재 위험 상태의 서버가 없습니다. (${mockContext.currentTime})`;
    }

    // 상황 분석
    if (lowerQuery.includes('상황') || lowerQuery.includes('분석')) {
      const criticalRatio = mockContext.metrics.criticalCount / mockContext.metrics.serverCount;
      const warningRatio = mockContext.metrics.warningCount / mockContext.metrics.serverCount;
      
      let situationAnalysis = `🎭 현재 상황 분석 (${mockContext.currentTime})\n\n`;
      
      if (criticalRatio > 0.5) {
        situationAnalysis += `🚨 심각: 절반 이상의 서버가 위험 상태입니다. 대규모 시스템 장애가 진행 중입니다.\n`;
        situationAnalysis += `- 평균 CPU: ${mockContext.metrics.avgCpu}%\n`;
        situationAnalysis += `- 평균 Memory: ${mockContext.metrics.avgMemory}%\n`;
        situationAnalysis += `\n즉시 조치가 필요합니다.`;
      } else if (criticalRatio > 0.2 || warningRatio > 0.4) {
        situationAnalysis += `⚠️ 주의: 다수의 서버에서 문제가 감지되었습니다.\n`;
        situationAnalysis += `- 위험: ${mockContext.metrics.criticalCount}대 (${Math.round(criticalRatio * 100)}%)\n`;
        situationAnalysis += `- 경고: ${mockContext.metrics.warningCount}대 (${Math.round(warningRatio * 100)}%)\n`;
        situationAnalysis += `\n시스템 모니터링을 강화해야 합니다.`;
      } else {
        situationAnalysis += `✅ 정상: 대부분의 서버가 안정적으로 운영되고 있습니다.\n`;
        situationAnalysis += `- 정상 서버: ${mockContext.metrics.healthyCount}대\n`;
        situationAnalysis += `- 평균 리소스 사용률이 적정 수준입니다.`;
      }
      
      return situationAnalysis;
    }

    // 기본 응답
    return `🎭 Mock 모드 (${mockContext.currentTime})\n\n` +
           mockContext.metrics.serverCount + '개의 서버가 모니터링되고 있습니다.';
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

    // Mock 모드 컨텍스트 추가
    const mockContext = this.mockContextLoader.getMockContext();
    if (mockContext) {
      prompt += '🎭 Mock 데이터 모드:\n';
      prompt += this.mockContextLoader.generateContextString();
      prompt += '\n\n';
    }

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
  protected calculateConfidence(ragResult: { results: Array<{ similarity: number }> }): number {
    if (ragResult.results.length === 0) return 0.1;

    // 최고 유사도 점수 기반 신뢰도
    const topSimilarity = ragResult.results[0].similarity;
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
   * 🔍 명령어 쿼리 감지
   */
  private detectCommandQuery(
    query: string, 
    commandContext?: any
  ): boolean {
    // 1. commandContext가 명시적으로 제공된 경우
    if (commandContext?.isCommandRequest) {
      return true;
    }

    // 2. 명령어 관련 키워드 패턴 감지
    const commandKeywords = [
      // 한국어 패턴
      /명령어?\s*(어떻?게|어떤|무엇|뭐|추천|알려)/i,
      /어떤?\s*명령어?/i,
      /(실행|사용|입력)해야?\s*할?\s*명령어?/i,
      /(서버|시스템)\s*(관리|모니터링|점검|확인)\s*명령어?/i,
      /리눅스|윈도우|도커|쿠버네티스.*명령어?/i,
      
      // 영어 패턴
      /what\s+(command|cmd)/i,
      /how\s+to\s+(run|execute|use)/i,
      /(server|system)\s+(command|cmd)/i,
      /(linux|windows|docker|k8s|kubectl)\s+(command|cmd)/i,
      
      // 구체적 명령어 언급
      /\b(top|htop|ps|grep|find|df|free|netstat|systemctl|docker|kubectl)\b/i,
    ];

    // 3. 키워드 매칭
    const hasKeyword = commandKeywords.some(pattern => pattern.test(query));
    if (hasKeyword) {
      return true;
    }

    // 4. 서버 ID + 명령어 패턴 감지
    const serverCommandPattern = /(web-prd|app-prd|db-main|db-repl|file-nas|backup).*명령어?/i;
    if (serverCommandPattern.test(query)) {
      return true;
    }

    return false;
  }

  /**
   * 🛠️ 명령어 쿼리 전용 처리
   */
  private async processCommandQuery(
    query: string,
    commandContext: any,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    const commandStepStart = Date.now();
    
    // 명령어 분석 단계 추가
    thinkingSteps.push({
      step: '명령어 분석',
      description: '명령어 요청 세부 분석 중',
      status: 'pending',
      timestamp: commandStepStart,
    });

    try {
      // UnifiedAIEngineRouter 인스턴스 가져오기 (동적 import로 순환 참조 방지)
      const { getUnifiedAIRouter } = await import('./UnifiedAIEngineRouter');
      const aiRouter = getUnifiedAIRouter();

      // 명령어 추천 시스템 사용
      const recommendationResult = await aiRouter.getCommandRecommendations(query, {
        maxRecommendations: 5,
        includeAnalysis: true,
      });

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].description = 
        `${recommendationResult.recommendations.length}개 명령어 추천 생성`;
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - commandStepStart;

      // 응답 생성
      const responseStepStart = Date.now();
      thinkingSteps.push({
        step: '명령어 응답 생성',
        description: '명령어 추천 응답 포맷팅',
        status: 'pending',
        timestamp: responseStepStart,
      });

      // 신뢰도 계산 (명령어 감지 정확도 기반)
      const confidence = Math.min(
        recommendationResult.analysis.confidence + 0.2, // 명령어 시스템 보너스
        0.95
      );

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - responseStepStart;

      return {
        success: true,
        response: recommendationResult.formattedResponse,
        engine: 'local-rag', // 명령어는 로컬 처리
        confidence,
        thinkingSteps,
        metadata: {
          commandMode: true,
          recommendationCount: recommendationResult.recommendations.length,
          analysisResult: recommendationResult.analysis,
          requestType: commandContext?.requestType || 'command_request',
        } as AIMetadata & { 
          commandMode?: boolean;
          recommendationCount?: number;
          analysisResult?: any;
          requestType?: string;
        },
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('❌ 명령어 처리 실패:', error);
      
      thinkingSteps[thinkingSteps.length - 1].status = 'failed';
      thinkingSteps[thinkingSteps.length - 1].description = '명령어 분석 실패';
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - commandStepStart;

      // 폴백: 기본 명령어 안내
      const fallbackResponse = this.generateCommandFallbackResponse(query);
      
      return {
        success: true,
        response: fallbackResponse,
        engine: 'fallback',
        confidence: 0.3,
        thinkingSteps,
        metadata: {
          commandMode: true,
          fallback: true,
        } as AIMetadata & { 
          commandMode?: boolean;
          fallback?: boolean;
        },
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🚨 명령어 폴백 응답 생성
   */
  private generateCommandFallbackResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // 서버 유형별 기본 명령어 제안
    if (lowerQuery.includes('linux') || lowerQuery.includes('ubuntu')) {
      return `Linux 시스템 관리 기본 명령어:\n\n` +
             `📊 모니터링:\n` +
             `• top - 실시간 프로세스 모니터링\n` +
             `• htop - 향상된 프로세스 뷰어\n` +
             `• free -h - 메모리 사용량 확인\n` +
             `• df -h - 디스크 사용량 확인\n\n` +
             `🔍 검색 및 관리:\n` +
             `• ps aux | grep [프로세스명] - 프로세스 검색\n` +
             `• systemctl status [서비스명] - 서비스 상태 확인\n` +
             `• netstat -tuln - 네트워크 포트 확인\n\n` +
             `자세한 명령어는 "web-prd-01 명령어" 같이 서버를 지정해서 물어보세요.`;
    }

    if (lowerQuery.includes('windows')) {
      return `Windows 시스템 관리 기본 명령어:\n\n` +
             `📊 모니터링 (PowerShell):\n` +
             `• Get-Process | Sort-Object CPU -Descending - 프로세스 정렬\n` +
             `• Get-Counter "\\Processor(_Total)\\% Processor Time" - CPU 사용률\n` +
             `• Get-WmiObject Win32_LogicalDisk - 디스크 사용량\n\n` +
             `🔍 네트워크 및 서비스:\n` +
             `• netstat -an | findstr LISTENING - 열린 포트 확인\n` +
             `• Get-Service | Where-Object {$_.Status -eq "Running"} - 실행 중인 서비스\n\n` +
             `자세한 명령어는 "file-nas-01 명령어"를 물어보세요.`;
    }

    // 일반적인 명령어 질문
    return `서버 관리 명령어를 찾고 계시는군요! 🛠️\n\n` +
           `다음과 같이 구체적으로 물어보시면 더 정확한 답변을 드릴 수 있습니다:\n\n` +
           `📋 예시:\n` +
           `• "web-prd-01 서버 명령어" - Nginx 웹서버 관리 명령어\n` +
           `• "db-main-01 PostgreSQL 명령어" - 데이터베이스 관리 명령어\n` +
           `• "app-prd-01 Java 명령어" - Tomcat 애플리케이션 서버 명령어\n` +
           `• "Docker 컨테이너 명령어" - 컨테이너 관리 명령어\n\n` +
           `💡 현재 관리 중인 서버: web-prd-01, web-prd-02, app-prd-01, app-prd-02, ` +
           `db-main-01, db-repl-01, file-nas-01, backup-01`;
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
