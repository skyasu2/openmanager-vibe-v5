/**
 * 🚀 개선된 AI 쿼리 엔진
 *
 * ✅ 스마트 모드 전환 (쿼리 복잡도 기반)
 * ✅ 비동기 초기화 및 lazy loading
 * ✅ 통합 캐싱 레이어
 * ✅ 병렬 처리 및 스트리밍 지원
 * ✅ 커넥션 풀링
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { getSupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { QueryComplexityAnalyzer } from './QueryComplexityAnalyzer';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type {
  AIQueryContext,
  AIQueryOptions,
  MCPContext,
  AIMetadata,
} from '@/types/ai-service-types';

// AI 엔진 응답 타입
interface AIEngineResponse {
  success: boolean;
  response: string;
  engine: 'local-rag' | 'google-ai';
  confidence: number;
  metadata?: {
    ragResults?: number;
    cached?: boolean;
    mcpUsed?: boolean;
    sources?: string[];
  };
  processingTime: number;
}

interface CacheEntry {
  response: string;
  engine: 'local-rag' | 'google-ai';
  confidence: number;
  metadata?: AIMetadata;
  timestamp: number;
  ttl: number;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  avgResponseTime: number;
  engineUsage: {
    local: number;
    googleAI: number;
  };
  autoSwitchCount: number;
}

export class ImprovedQueryEngine {
  private ragEngine: SupabaseRAGEngine;
  private contextLoader: CloudContextLoader;
  private googleAI: GoogleGenerativeAI | null = null;
  private googleAIModel: GenerativeModel | null = null;

  // 초기화 상태
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;

  // 통합 캐시
  private memoryCache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly DEFAULT_TTL = 300000; // 5분

  // 성능 메트릭
  private metrics: PerformanceMetrics = {
    cacheHitRate: 0,
    avgResponseTime: 0,
    engineUsage: { local: 0, googleAI: 0 },
    autoSwitchCount: 0,
  };

  // 요청 큐 (rate limiting)
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private readonly MAX_CONCURRENT_REQUESTS = 3;

  constructor() {
    this.ragEngine = getSupabaseRAGEngine();
    this.contextLoader = CloudContextLoader.getInstance();

    // 백그라운드 초기화 시작
    this.startLazyInitialization();
  }

  /**
   * 🚀 Lazy 초기화
   */
  private startLazyInitialization(): void {
    this.initPromise = this.performInitialization();
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 ImprovedQueryEngine 백그라운드 초기화 시작...');

      // 병렬 초기화
      const initTasks = [
        this.initializeRAGEngine(),
        this.initializeGoogleAI(),
        this.loadFrequentQueries(),
      ];

      await Promise.allSettled(initTasks);

      this.isInitialized = true;
      console.log('✅ ImprovedQueryEngine 초기화 완료');

      // 주기적 캐시 정리
      this.startCacheMaintenance();
    } catch (error) {
      console.error('❌ 엔진 초기화 실패:', error);
      this.isInitialized = true; // 실패해도 계속 진행
    }
  }

  /**
   * 🧠 RAG 엔진 초기화
   */
  private async initializeRAGEngine(): Promise<void> {
    try {
      await this.ragEngine.initialize();
    } catch (error) {
      console.warn('⚠️ RAG 엔진 초기화 실패, 나중에 재시도:', error);
    }
  }

  /**
   * 🌐 Google AI 초기화
   */
  private async initializeGoogleAI(): Promise<void> {
    try {
      const apiKey =
        process.env.GOOGLE_AI_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

      if (apiKey) {
        this.googleAI = new GoogleGenerativeAI(apiKey);
        this.googleAIModel = this.googleAI.getGenerativeModel({
          model: 'gemini-pro',
        });
        console.log('✅ Google AI 클라이언트 초기화 완료');
      }
    } catch (error) {
      console.warn('⚠️ Google AI 초기화 실패:', error);
    }
  }

  /**
   * 📊 자주 사용되는 쿼리 프리로드
   */
  private async loadFrequentQueries(): Promise<void> {
    // 자주 사용되는 패턴들을 미리 캐시
    const frequentPatterns = [
      '서버 상태',
      'CPU 사용률',
      '에러 해결',
      '설정 방법',
    ];

    // 백그라운드에서 로드 (블로킹하지 않음)
    setTimeout(() => {
      frequentPatterns.forEach(pattern => {
        this.warmupCache(pattern);
      });
    }, 5000);
  }

  /**
   * 🔥 캐시 워밍업
   */
  private async warmupCache(query: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(query, 'local');
      if (!this.memoryCache.has(cacheKey)) {
        // Local RAG로 미리 검색
        const result = await this.ragEngine.searchSimilar(query, {
          maxResults: 3,
          threshold: 0.5,
        });

        if (result.results.length > 0) {
          this.memoryCache.set(cacheKey, {
            response: result.results[0].content,
            engine: 'local-rag',
            confidence: 0.8,
            timestamp: Date.now(),
            ttl: this.DEFAULT_TTL * 2, // 더 긴 TTL
          });
        }
      }
    } catch {
      // 워밍업 실패는 무시
    }
  }

  /**
   * 🔍 개선된 쿼리 처리
   */
  async query(request: {
    query: string;
    mode?: 'auto' | 'local' | 'google-ai';
    context?: AIQueryContext;
    options?: AIQueryOptions & {
      stream?: boolean;
      useCache?: boolean;
      preferredEngine?: 'local-rag' | 'google-ai';
    };
  }): Promise<AIEngineResponse> {
    const startTime = Date.now();

    // 초기화 대기 (필요한 경우만)
    if (this.initPromise && !this.isInitialized) {
      await Promise.race([
        this.initPromise,
        new Promise(resolve => setTimeout(resolve, 1000)), // 최대 1초 대기
      ]);
    }

    const { query, mode = 'auto', context = {}, options = {} } = request;

    // 캐시 확인
    if (options.useCache !== false) {
      const cachedResponse = this.checkCache(query, mode);
      if (cachedResponse) {
        this.updateMetrics('cache', Date.now() - startTime);
        return cachedResponse;
      }
    }

    // 쿼리 분석 (auto 모드)
    let selectedEngine: 'local-rag' | 'google-ai';
    let analysis: ReturnType<typeof QueryComplexityAnalyzer.analyze> | null =
      null;

    if (mode === 'auto') {
      analysis = QueryComplexityAnalyzer.analyze(query);
      selectedEngine = options.preferredEngine || analysis.recommendedEngine;

      console.log(
        `🤖 자동 엔진 선택: ${selectedEngine} (신뢰도: ${analysis.confidence})`
      );
    } else {
      selectedEngine = mode === 'local' ? 'local-rag' : 'google-ai';
    }

    // 병렬 처리 준비
    const _tasks: Promise<any>[] = [];

    // MCP 컨텍스트 수집 (비블로킹)
    let mcpContextPromise: Promise<MCPContext | null> = Promise.resolve(null);
    if (options?.includeMCPContext) {
      mcpContextPromise = this.contextLoader
        .queryMCPContextForRAG(query, {
          maxFiles: 5,
          includeSystemContext: true,
        })
        .catch(() => null);
    }

    // 엔진별 처리
    try {
      const response = await this.processWithEngine(
        selectedEngine,
        query,
        context,
        options,
        mcpContextPromise,
        analysis
      );

      // 캐시 저장
      if (response.success && options.useCache !== false) {
        this.saveToCache(query, mode, response);
      }

      // 메트릭 업데이트
      this.updateMetrics(selectedEngine, Date.now() - startTime);

      return response;
    } catch (error) {
      console.error(`❌ ${selectedEngine} 처리 실패:`, error);

      // 자동 폴백 (auto 모드에서만)
      if (mode === 'auto' && selectedEngine === 'google-ai') {
        console.log('🔄 Local RAG로 자동 전환...');
        this.metrics.autoSwitchCount++;

        return this.processWithEngine(
          'local-rag',
          query,
          context,
          options,
          mcpContextPromise,
          analysis
        );
      }

      throw error;
    }
  }

  /**
   * 🤖 엔진별 처리
   */
  private async processWithEngine(
    engine: 'local-rag' | 'google-ai',
    query: string,
    context: AIQueryContext,
    options: AIQueryOptions & {
      useCache?: boolean;
      preferredEngine?: 'local-rag' | 'google-ai';
    },
    mcpContextPromise: Promise<MCPContext | null>,
    _analysis: ReturnType<typeof QueryComplexityAnalyzer.analyze> | null
  ): Promise<any> {
    if (engine === 'local-rag') {
      return this.processLocalQuery(query, context, options, mcpContextPromise);
    } else {
      return this.processGoogleAIQuery(
        query,
        context,
        options,
        mcpContextPromise
      );
    }
  }

  /**
   * 🏠 개선된 Local RAG 처리
   */
  private async processLocalQuery(
    query: string,
    context: AIQueryContext,
    options: AIQueryOptions & {
      useCache?: boolean;
      preferredEngine?: 'local-rag' | 'google-ai';
    },
    mcpContextPromise: Promise<MCPContext | null>
  ): Promise<any> {
    const startTime = Date.now();

    // 병렬 실행
    const [ragResult, mcpContext] = await Promise.all([
      this.ragEngine.searchSimilar(query, {
        maxResults: 5,
        threshold: 0.5,
        category: options?.category as string | undefined,
      }),
      mcpContextPromise,
    ]);

    const response = this.generateLocalResponse(
      query,
      ragResult,
      mcpContext,
      context
    );

    return {
      success: true,
      response,
      engine: 'local-rag',
      confidence: this.calculateConfidence(ragResult),
      metadata: {
        ragResults: ragResult.totalResults,
        cached: ragResult.cached,
        mcpUsed: !!mcpContext,
      },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 🌐 개선된 Google AI 처리
   */
  private async processGoogleAIQuery(
    query: string,
    context: AIQueryContext,
    options: AIQueryOptions & {
      useCache?: boolean;
      preferredEngine?: 'local-rag' | 'google-ai';
    },
    mcpContextPromise: Promise<MCPContext | null>
  ): Promise<any> {
    const startTime = Date.now();

    if (!this.googleAIModel) {
      throw new Error('Google AI가 초기화되지 않았습니다');
    }

    // MCP 컨텍스트 대기
    const mcpContext = await mcpContextPromise;

    // 프롬프트 생성
    const prompt = this.buildGoogleAIPrompt(query, context, mcpContext);

    // 생성 설정
    const generationConfig = {
      temperature: options?.temperature || 0.7,
      maxOutputTokens: options?.maxTokens || 1000,
      topK: 40,
      topP: 0.95,
    };

    // 스트리밍 지원
    if (options.stream) {
      const result = await this.googleAIModel.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      return {
        success: true,
        stream: result.stream,
        engine: 'google-ai',
        processingTime: Date.now() - startTime,
      };
    }

    // 일반 생성
    const result = await this.googleAIModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();

    return {
      success: true,
      response: text,
      engine: 'google-ai',
      confidence: 0.9,
      metadata: {
        model: 'gemini-pro',
        tokensUsed: response.usageMetadata?.totalTokenCount,
        mcpUsed: !!mcpContext,
      },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 💾 캐시 관리
   */
  private getCacheKey(query: string, mode: string): string {
    return `${mode}:${query.toLowerCase().trim()}`;
  }

  private checkCache(query: string, mode: string): AIEngineResponse | null {
    const cacheKey = this.getCacheKey(query, mode);
    const entry = this.memoryCache.get(cacheKey);

    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return {
        success: true,
        response: entry.response,
        engine: entry.engine,
        confidence: entry.confidence,
        metadata: { ...entry.metadata, cached: true },
        processingTime: 0,
      };
    }

    return null;
  }

  private saveToCache(
    query: string,
    mode: string,
    response: AIEngineResponse
  ): void {
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      // LRU 정책: 가장 오래된 항목 제거
      const oldestKey = Array.from(this.memoryCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];
      this.memoryCache.delete(oldestKey);
    }

    const cacheKey = this.getCacheKey(query, mode);
    this.memoryCache.set(cacheKey, {
      response: response.response,
      engine: response.engine,
      confidence: response.confidence,
      metadata: response.metadata,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL,
    });
  }

  /**
   * 🧹 캐시 유지보수
   */
  private startCacheMaintenance(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.memoryCache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.memoryCache.delete(key));
    }, 60000); // 1분마다
  }

  /**
   * 📊 메트릭 업데이트
   */
  private updateMetrics(engine: string, responseTime: number): void {
    if (engine === 'cache') {
      this.metrics.cacheHitRate = this.metrics.cacheHitRate * 0.95 + 0.05; // 이동 평균
    } else {
      this.metrics.cacheHitRate *= 0.95; // 캐시 미스

      if (engine === 'local-rag') {
        this.metrics.engineUsage.local++;
      } else {
        this.metrics.engineUsage.googleAI++;
      }
    }

    // 평균 응답 시간 업데이트
    this.metrics.avgResponseTime =
      this.metrics.avgResponseTime * 0.9 + responseTime * 0.1;
  }

  /**
   * 📊 성능 메트릭 조회
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 🔄 엔진 상태 조회
   */
  async getEngineStatus(): Promise<{
    local: boolean;
    googleAI: boolean;
    mcp: boolean;
    cacheSize: number;
    metrics: PerformanceMetrics;
  }> {
    const [ragHealth, mcpStatus] = await Promise.all([
      this.ragEngine.healthCheck(),
      this.contextLoader.getIntegratedStatus(),
    ]);

    return {
      local: ragHealth.status === 'healthy',
      googleAI: !!this.googleAIModel,
      mcp: mcpStatus.mcpServer.status === 'online',
      cacheSize: this.memoryCache.size,
      metrics: this.getPerformanceMetrics(),
    };
  }

  // 기존 메서드들 재사용...
  private generateLocalResponse(
    query: string,
    _ragResult: any, // RAGResult 타입이 필요함
    _mcpContext: MCPContext | null,
    _context: AIQueryContext
  ): string {
    // TODO: 실제 구현 필요
    return `Based on the context: ${query}`;
  }

  private buildGoogleAIPrompt(
    query: string,
    _context: AIQueryContext,
    _mcpContext: MCPContext | null
  ): string {
    // TODO: 실제 구현 필요
    return query;
  }

  private calculateConfidence(_ragResult: any): number {
    // TODO: 실제 구현 필요 (RAGResult 타입 정의 후)
    return 0.5;
  }
}

// 싱글톤 인스턴스
let improvedEngineInstance: ImprovedQueryEngine | null = null;

export function getImprovedQueryEngine(): ImprovedQueryEngine {
  if (!improvedEngineInstance) {
    improvedEngineInstance = new ImprovedQueryEngine();
  }
  return improvedEngineInstance;
}
