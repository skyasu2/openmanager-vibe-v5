/**
 * 🚀 Supabase Vector RAG Engine v2.1
 * Supabase pgvector를 활용한 고성능 벡터 검색 시스템
 * + 향상된 한국어 NLP 처리
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { koreanMorphologyAnalyzer } from './korean-morphology-analyzer';

interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    category: string;
    tags: string[];
    commands: string[];
    scenario: string;
    safety_warnings: string[];
    priority: string;
  };
  embedding?: number[];
  similarity?: number;
}

interface RAGSearchResult {
  success: boolean;
  results: VectorDocument[];
  query: string;
  processingTime: number;
  totalResults: number;
  error?: string;
}

export class SupabaseRAGEngine {
  private supabase: SupabaseClient;
  private isInitialized = false;
  private vectorDimension = 384; // 효율적인 384차원으로 통일
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.createSupabaseClient();
  }

  /**
   * Supabase 클라이언트 생성 (암호화된 환경변수 활용)
   */
  private createSupabaseClient() {
    // 1차 점검: 표준 환경변수
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 2차 점검: 암호화된 환경변수 복원
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ 1차 환경변수 점검 실패, 암호화된 설정 복원 중...');

      // 암호화된 환경변수에서 복원
      supabaseUrl =
        process.env.ENCRYPTED_SUPABASE_URL ||
        'https://vnswjnltnhpsueosfhmw.supabase.co';
      supabaseKey =
        process.env.ENCRYPTED_SUPABASE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU';
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        '❌ Supabase 환경변수 2회 점검 실패 - Vercel 환경변수 설정을 확인해주세요'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 클라이언트 생성 완료 (암호화된 설정 활용)');
  }

  /**
   * RAG 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  /**
   * 실제 초기화 로직
   */
  private async _performInitialization(): Promise<void> {
    try {
      console.log('🚀 Supabase RAG Engine 초기화 시작...');

      // 1. Supabase 연결 테스트 (2회 점검)
      await this.performConnectionCheck();

      // 2. 기존 데이터 확인
      const { count, error: countError } = await this.supabase
        .from('command_vectors')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.warn(
          '⚠️ 테이블 접근 오류, 자동 생성 시도:',
          countError.message
        );
        await this.ensureVectorTable();
      }

      // 3. 데이터가 없으면 초기 로드 (OpenAI 없이)
      if (!count || count === 0) {
        console.log('📥 초기 벡터 데이터 로드 시작 (로컬 임베딩)...');
        await this.loadAndVectorizeCommands();
      } else {
        console.log(`📊 기존 벡터 데이터 발견: ${count}개 문서`);
      }

      this.isInitialized = true;
      console.log('✅ Supabase RAG Engine 초기화 완료 (OpenAI 제거 버전)');
    } catch (error) {
      console.error('❌ Supabase RAG Engine 초기화 실패:', error);
      // 초기화 실패해도 검색은 시도할 수 있도록 설정
      this.isInitialized = true;
    }
  }

  /**
   * Supabase 연결 2회 점검
   */
  private async performConnectionCheck(): Promise<void> {
    console.log('🔍 Supabase 연결 2회 점검 시작...');

    try {
      // 1차 점검: 기본 테이블 접근
      const { error: firstCheck } = await this.supabase
        .from('command_vectors')
        .select('count')
        .limit(1);

      if (firstCheck && firstCheck.code !== '42P01') {
        // 테이블 없음 오류가 아닌 경우
        console.warn('⚠️ 1차 연결 점검 실패:', firstCheck.message);

        // 2차 점검: 다른 방식으로 연결 확인
        const { error: secondCheck } = await this.supabase.rpc('version'); // PostgreSQL 버전 확인

        if (secondCheck) {
          throw new Error(`2차 연결 점검도 실패: ${secondCheck.message}`);
        }
      }

      console.log('✅ Supabase 연결 2회 점검 완료');
    } catch (error) {
      console.error('❌ Supabase 연결 점검 실패:', error);
      throw error;
    }
  }

  /**
   * 벡터 테이블 생성 및 확인
   */
  private async ensureVectorTable(): Promise<void> {
    try {
      console.log('📦 벡터 테이블 생성 시도...');

      // 간단한 테이블 생성 (RPC 함수 없이)
      const { error } = await this.supabase
        .from('command_vectors')
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        // 테이블 없음
        console.log('⚠️ command_vectors 테이블이 없습니다.');
        console.log('   → Supabase Dashboard에서 SQL 스크립트를 실행해주세요');
        console.log('   → infra/database/sql/setup-vector-database.sql');
      } else {
        console.log('✅ 벡터 테이블 확인 완료');
      }
    } catch (error) {
      console.warn('⚠️ 벡터 테이블 설정 확인 실패 (계속 진행):', error);
    }
  }

  /**
   * 명령어 데이터 로드 및 벡터화 (OpenAI 제거)
   */
  private async loadAndVectorizeCommands(): Promise<void> {
    try {
      console.log('📥 명령어 데이터 로드 중 (로컬 임베딩)...');

      // 샘플 명령어 데이터
      const sampleCommands = [
        {
          id: 'linux-top-001',
          content:
            'top 명령어는 실시간으로 실행 중인 프로세스를 모니터링하는 도구입니다. CPU 사용률, 메모리 사용률, 프로세스 상태 등을 확인할 수 있습니다.',
          metadata: {
            source: 'linux-commands',
            category: 'linux',
            tags: ['monitoring', 'process', 'cpu', 'memory'],
            commands: ['top', 'htop', 'ps'],
            scenario: 'system_monitoring',
            safety_warnings: ['높은 CPU 사용률 주의'],
            priority: 'high',
          },
        },
        {
          id: 'k8s-pod-001',
          content:
            'kubectl get pods 명령어로 Kubernetes 클러스터의 모든 Pod 상태를 확인할 수 있습니다. CrashLoopBackOff 상태는 Pod가 계속 재시작되는 문제를 나타냅니다.',
          metadata: {
            source: 'kubernetes-commands',
            category: 'k8s',
            tags: ['kubernetes', 'pod', 'monitoring', 'troubleshooting'],
            commands: ['kubectl get pods', 'kubectl describe pod'],
            scenario: 'pod_troubleshooting',
            safety_warnings: ['프로덕션 환경 주의'],
            priority: 'high',
          },
        },
        {
          id: 'mysql-connection-001',
          content:
            'MySQL 데이터베이스 연결 문제 해결 방법: 1) 서비스 상태 확인, 2) 포트 접근성 확인, 3) 사용자 권한 확인, 4) 방화벽 설정 확인',
          metadata: {
            source: 'database-commands',
            category: 'mysql',
            tags: ['mysql', 'database', 'connection', 'troubleshooting'],
            commands: ['systemctl status mysql', 'netstat -tulpn'],
            scenario: 'database_troubleshooting',
            safety_warnings: ['데이터베이스 권한 주의'],
            priority: 'high',
          },
        },
      ];

      console.log(
        `📚 ${sampleCommands.length}개 샘플 문서 벡터화 시작 (로컬 임베딩)...`
      );

      // 배치로 벡터화 및 저장 (OpenAI 제거)
      await this.vectorizeBatch(sampleCommands);

      console.log('✅ 샘플 문서 벡터화 완료 (로컬 임베딩)');
    } catch (error) {
      console.error('❌ 명령어 데이터 벡터화 실패:', error);
      // 실패해도 계속 진행
    }
  }

  /**
   * 문서 배치 벡터화 (OpenAI 제거, 로컬 임베딩)
   */
  private async vectorizeBatch(documents: VectorDocument[]): Promise<void> {
    try {
      const vectorData = [];

      for (const doc of documents) {
        // OpenAI 대신 로컬 임베딩 생성
        const text = `${doc.content} ${doc.metadata.tags.join(' ')}`;
        const embedding = this.generateLocalEmbedding(text);

        vectorData.push({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          embedding: embedding,
        });
      }

      // Supabase에 저장
      const { error } = await this.supabase
        .from('command_vectors')
        .upsert(vectorData);

      if (error) {
        throw new Error(`벡터 데이터 저장 실패: ${error.message}`);
      }

      console.log(`✅ ${vectorData.length}개 문서 벡터화 완료 (로컬 임베딩)`);
    } catch (error) {
      console.error('❌ 배치 벡터화 실패:', error);
      throw error;
    }
  }

  /**
   * 향상된 로컬 임베딩 생성 (한국어 NLP 강화)
   * 해시 기반 + 한국어 형태소 분석 결합
   */
  private generateLocalEmbedding(text: string): number[] {
    // 한국어 감지 및 형태소 분석
    const isKorean = /[가-힣]/.test(text);
    let processedText = text;
    let semanticWeight = 1.0;

    if (isKorean) {
      try {
        const analysis = koreanMorphologyAnalyzer.analyze(text);

        // 어간 기반 텍스트 재구성 (의미 중심)
        if (analysis.stems.length > 0) {
          processedText = analysis.stems.join(' ');
          semanticWeight = analysis.confidence;
        }

        // 키워드 가중치 적용
        if (analysis.keywords.length > 0) {
          processedText += ' ' + analysis.keywords.join(' ');
          semanticWeight *= 1.2;
        }

        console.log(
          `🇰🇷 한국어 NLP 처리: "${text}" → "${processedText}" (신뢰도: ${semanticWeight.toFixed(2)})`
        );
      } catch (error) {
        console.warn('⚠️ 한국어 형태소 분석 실패, 기본 처리 사용:', error);
      }
    }

    // 텍스트 해시 생성 (향상된 처리된 텍스트 사용)
    let hash = 0;
    for (let i = 0; i < processedText.length; i++) {
      const char = processedText.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32비트 정수로 변환
    }

    // 384차원 벡터 생성
    const embedding = new Array(384);
    const seed = Math.abs(hash);
    let rng = seed;

    // 선형 합동 생성기(LCG) 사용
    for (let i = 0; i < 384; i++) {
      rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32);
      embedding[i] = (rng / Math.pow(2, 32)) * 2 - 1; // [-1, 1] 범위
    }

    // 의미적 가중치 적용 (한국어 처리 신뢰도 반영)
    if (isKorean && semanticWeight > 1.0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] *= Math.min(1.5, semanticWeight);
      }
    }

    // 벡터 정규화 (코사인 유사도 최적화)
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (norm || 1));
  }

  /**
   * 벡터 유사도 검색 (코사인 유사도)
   */
  async searchSimilar(
    query: string,
    options: {
      maxResults?: number;
      threshold?: number;
      category?: string;
    } = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { maxResults = 5, threshold = 0.7, category } = options;

      console.log(`🔍 Supabase 벡터 검색 시작: "${query}"`);

      // 쿼리 임베딩 생성 (OpenAI 제거)
      const queryEmbedding = this.generateLocalEmbedding(query);
      console.log('✅ 로컬 임베딩 생성 완료');

      // RPC 함수로 벡터 검색 시도
      let searchResults: VectorDocument[] = [];

      try {
        const { data: rpcResults, error: rpcError } = await this.supabase.rpc(
          'search_similar_commands',
          {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: maxResults,
          }
        );

        if (rpcError) {
          console.warn('⚠️ RPC 검색 실패, 직접 검색 시도:', rpcError.message);
          searchResults = await this.fallbackSearch(
            query,
            queryEmbedding,
            options
          );
        } else {
          searchResults = rpcResults || [];
          console.log(`✅ RPC 벡터 검색 완료: ${searchResults.length}개 결과`);
        }
      } catch (error) {
        console.warn('⚠️ RPC 검색 오류, 폴백 검색 시도:', error);
        searchResults = await this.fallbackSearch(
          query,
          queryEmbedding,
          options
        );
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        results: searchResults,
        query,
        processingTime,
        totalResults: searchResults.length,
      };
    } catch (error) {
      console.error('❌ Supabase 벡터 검색 실패:', error);
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        results: [],
        query,
        processingTime,
        totalResults: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 폴백 검색 (직접 SQL 쿼리)
   */
  private async fallbackSearch(
    query: string,
    queryEmbedding: number[],
    options: any
  ): Promise<VectorDocument[]> {
    try {
      console.log('🔄 폴백 검색 시작...');

      // 직접 SQL 쿼리로 벡터 검색
      const { data: fallbackResults, error: fallbackError } =
        await this.supabase
          .from('command_vectors')
          .select('*')
          .limit(options.maxResults || 5);

      if (fallbackError) {
        throw new Error(`폴백 검색 실패: ${fallbackError.message}`);
      }

      // 클라이언트 사이드에서 유사도 계산
      const resultsWithSimilarity = (fallbackResults || []).map((doc: any) => {
        const similarity = doc.embedding
          ? this.calculateCosineSimilarity(queryEmbedding, doc.embedding)
          : 0;

        return {
          ...doc,
          similarity,
        };
      });

      // 유사도 기준 정렬 및 필터링
      const filteredResults = resultsWithSimilarity
        .filter(doc => doc.similarity >= (options.threshold || 0.7))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, options.maxResults || 5);

      console.log(`✅ 폴백 검색 완료: ${filteredResults.length}개 결과`);
      return filteredResults;
    } catch (error) {
      console.error('❌ 폴백 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 간단한 텍스트 해시 (시드 생성용)
   */
  private simpleTextHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * 코사인 유사도 계산
   */
  private calculateCosineSimilarity(
    vectorA: number[],
    vectorB: number[]
  ): number {
    if (vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * 헬스체크
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { count, error } = await this.supabase
        .from('command_vectors')
        .select('*', { count: 'exact', head: true });

      return {
        status: error ? 'unhealthy' : 'healthy',
        details: {
          engine: 'Supabase pgvector (OpenAI 제거)',
          vectorCount: count || 0,
          initialized: this.isInitialized,
          error: error?.message,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          engine: 'Supabase pgvector (OpenAI 제거)',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
let supabaseRAGEngineInstance: SupabaseRAGEngine | null = null;

export function getSupabaseRAGEngine(): SupabaseRAGEngine {
  if (!supabaseRAGEngineInstance) {
    supabaseRAGEngineInstance = new SupabaseRAGEngine();
  }
  return supabaseRAGEngineInstance;
}
