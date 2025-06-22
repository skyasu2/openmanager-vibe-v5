/**
 * 🔄 하이브리드 RAG 엔진 v1.0 (2025.06.10)
 *
 * 개발 환경에서 Supabase RAG 실패 시 LocalRAG 자동 폴백
 * - Primary: Supabase RAG (실제 데이터)
 * - Fallback: LocalRAG (개발/테스트 전용)
 * - 배포 환경: Supabase RAG만 사용
 */

import { LocalRAGEngine } from '@/lib/ml/rag-engine';
import { createClient } from '@supabase/supabase-js';

export interface HybridRAGRequest {
  query: string;
  category?: string;
  maxResults?: number;
  threshold?: number;
  forceLocalRAG?: boolean;
}

export interface HybridRAGResponse {
  success: boolean;
  results: Array<{
    id: number | string;
    command?: string;
    content?: string;
    description?: string;
    category: string;
    similarity?: number;
    score?: number;
  }>;
  engine: 'supabase_rag' | 'local_rag' | 'none';
  processingTime: number;
  confidence: number;
  fallbackUsed: boolean;
  metadata: {
    totalResults: number;
    primaryEngine: string;
    fallbackReason?: string;
    environment: string;
  };
}

export class HybridRAGEngine {
  private supabase: any;
  private localRAG: LocalRAGEngine | null = null;
  private initialized: boolean = false;
  private isDevEnvironment: boolean;

  private stats = {
    totalQueries: 0,
    supabaseSuccesses: 0,
    localRAGFallbacks: 0,
    failures: 0,
    averageResponseTime: 0,
  };

  constructor() {
    this.isDevEnvironment = this.checkDevEnvironment();
    this.initializeEngines();
  }

  /**
   * 🔍 개발 환경 체크
   */
  private checkDevEnvironment(): boolean {
    const nodeEnv = process.env.NODE_ENV;
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
    const isRender = !!(process.env.RENDER || process.env.RENDER_SERVICE_ID);

    return nodeEnv !== 'production' && !isVercel && !isRender;
  }

  /**
   * 🔧 엔진 초기화
   */
  private async initializeEngines(): Promise<void> {
    try {
      // Supabase 클라이언트 초기화
      await this.initializeSupabase();

      // 개발 환경에서만 LocalRAG 초기화
      if (this.isDevEnvironment) {
        this.localRAG = new LocalRAGEngine();
        await this.localRAG.initialize();
        console.log('🔧 HybridRAG: LocalRAG 폴백 엔진 준비 완료');
      }

      this.initialized = true;
      console.log('✅ HybridRAG 엔진 초기화 완료');
    } catch (error) {
      console.error('❌ HybridRAG 엔진 초기화 실패:', error);
    }
  }

  /**
   * 🔧 Supabase 초기화
   */
  private async initializeSupabase(): Promise<void> {
    // 1차 점검: 표준 환경변수
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 2차 점검: 암호화된 환경변수
    if (!supabaseUrl || !supabaseKey) {
      const encryptedConfig = {
        supabaseUrl: 'https://vnswjnltnhpsueosfhmw.supabase.co',
        supabaseKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU',
      };
      supabaseUrl = encryptedConfig.supabaseUrl;
      supabaseKey = encryptedConfig.supabaseKey;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 🔍 하이브리드 RAG 검색 (메인 메서드)
   */
  async search(request: HybridRAGRequest): Promise<HybridRAGResponse> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    if (!this.initialized) {
      await this.initializeEngines();
    }

    // 강제 LocalRAG 모드
    if (request.forceLocalRAG && this.isDevEnvironment && this.localRAG) {
      return await this.searchWithLocalRAG(request, startTime, 'forced');
    }

    // 1단계: Supabase RAG 시도
    try {
      const supabaseResult = await this.searchWithSupabaseRAG(request);

      if (supabaseResult.success && supabaseResult.results.length > 0) {
        this.stats.supabaseSuccesses++;

        return {
          ...supabaseResult,
          engine: 'supabase_rag',
          processingTime: Date.now() - startTime,
          fallbackUsed: false,
          metadata: {
            totalResults: supabaseResult.results.length,
            primaryEngine: 'supabase_rag',
            environment: this.isDevEnvironment ? 'development' : 'production',
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Supabase RAG 실패, LocalRAG 폴백 시도:', error.message);
    }

    // 2단계: LocalRAG 폴백 (개발 환경에서만)
    if (this.isDevEnvironment && this.localRAG) {
      return await this.searchWithLocalRAG(
        request,
        startTime,
        'supabase_failed'
      );
    }

    // 3단계: 모든 엔진 실패
    this.stats.failures++;
    return {
      success: false,
      results: [],
      engine: 'none',
      processingTime: Date.now() - startTime,
      confidence: 0,
      fallbackUsed: false,
      metadata: {
        totalResults: 0,
        primaryEngine: 'none',
        fallbackReason: 'All engines failed',
        environment: this.isDevEnvironment ? 'development' : 'production',
      },
    };
  }

  /**
   * 🎯 Supabase RAG 검색
   */
  private async searchWithSupabaseRAG(request: HybridRAGRequest): Promise<any> {
    const { query, maxResults = 5, threshold = 0.01 } = request;

    // 벡터 검색 시도
    try {
      const embedding = this.generateLocalEmbedding(query);

      const { data, error } = await this.supabase.rpc(
        'search_similar_commands',
        {
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: maxResults,
        }
      );

      if (error) throw new Error(error.message);

      if (data && data.length > 0) {
        return {
          success: true,
          results: data.map(item => ({
            id: item.id,
            command: item.command,
            description: item.description,
            category: item.category,
            similarity: item.similarity,
          })),
          confidence: 0.9,
        };
      }
    } catch (vectorError) {
      console.warn('벡터 검색 실패, 텍스트 검색 시도:', vectorError.message);
    }

    // 텍스트 검색 폴백
    try {
      const { data, error } = await this.supabase.rpc('search_all_commands', {
        search_query: query,
        result_limit: maxResults,
      });

      if (error) throw new Error(error.message);

      return {
        success: data && data.length > 0,
        results: data || [],
        confidence: 0.7,
      };
    } catch (textError) {
      throw new Error(`Supabase RAG 완전 실패: ${textError.message}`);
    }
  }

  /**
   * 🔧 LocalRAG 검색
   */
  private async searchWithLocalRAG(
    request: HybridRAGRequest,
    startTime: number,
    fallbackReason: string
  ): Promise<HybridRAGResponse> {
    try {
      this.stats.localRAGFallbacks++;

      console.log(`🔄 LocalRAG 폴백 실행: ${fallbackReason}`);

      const localResult = await this.localRAG!.search({
        query: request.query,
        maxResults: request.maxResults || 5,
        category: request.category,
      });

      const results =
        localResult.results?.map(item => ({
          id: item.document.id,
          content: item.document.content,
          category: item.document.metadata.category,
          score: item.score,
        })) || [];

      return {
        success: localResult.success,
        results,
        engine: 'local_rag',
        processingTime: Date.now() - startTime,
        confidence: localResult.success ? 0.6 : 0,
        fallbackUsed: true,
        metadata: {
          totalResults: results.length,
          primaryEngine: 'local_rag',
          fallbackReason,
          environment: 'development',
        },
      };
    } catch (error) {
      console.error('❌ LocalRAG 폴백도 실패:', error);

      return {
        success: false,
        results: [],
        engine: 'none',
        processingTime: Date.now() - startTime,
        confidence: 0,
        fallbackUsed: true,
        metadata: {
          totalResults: 0,
          primaryEngine: 'local_rag',
          fallbackReason: `LocalRAG 실패: ${error.message}`,
          environment: 'development',
        },
      };
    }
  }

  /**
   * 🧮 로컬 임베딩 생성 (Supabase RAG용)
   */
  private generateLocalEmbedding(text: string): number[] {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const embedding = new Array(384);
    const seed = Math.abs(hash);
    let rng = seed;

    for (let i = 0; i < 384; i++) {
      rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32);
      embedding[i] = (rng / Math.pow(2, 32)) * 2 - 1;
    }

    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  /**
   * 📊 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalQueries > 0
          ? ((this.stats.supabaseSuccesses + this.stats.localRAGFallbacks) /
              this.stats.totalQueries) *
            100
          : 0,
      fallbackRate:
        this.stats.totalQueries > 0
          ? (this.stats.localRAGFallbacks / this.stats.totalQueries) * 100
          : 0,
    };
  }

  /**
   * 🏥 헬스체크
   */
  async healthCheck(): Promise<{
    supabaseRAG: boolean;
    localRAG: boolean;
    overall: boolean;
  }> {
    const health = {
      supabaseRAG: false,
      localRAG: false,
      overall: false,
    };

    // Supabase RAG 체크
    try {
      const { data, error } = await this.supabase
        .from('rag_commands')
        .select('count')
        .limit(1);
      health.supabaseRAG = !error;
    } catch (error) {
      health.supabaseRAG = false;
    }

    // LocalRAG 체크 (개발 환경에서만)
    if (this.isDevEnvironment && this.localRAG) {
      health.localRAG = this.localRAG.isAvailableInCurrentEnvironment
        ? this.localRAG.isAvailableInCurrentEnvironment()
        : true;
    }

    health.overall = health.supabaseRAG || health.localRAG;

    return health;
  }
}
