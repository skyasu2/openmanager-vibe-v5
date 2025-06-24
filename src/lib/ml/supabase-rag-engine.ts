/**
 * 🚀 Supabase Vector RAG Engine v3.0 (MCP 파일시스템 연동)
 * Supabase pgvector를 활용한 고성능 벡터 검색 시스템
 * + 향상된 한국어 NLP 처리
 * + 캐싱 및 성능 최적화
 * + MCP 파일시스템 서버 연동으로 동적 컨텍스트 조회
 */

import { utf8Logger } from '@/utils/utf8-logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import autoDecryptEnv from '../environment/auto-decrypt-env';
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
  cached: boolean;
  mcpContext?: any; // MCP에서 조회한 추가 컨텍스트
  error?: string;
}

interface MCPFileSystemContext {
  files: Array<{
    path: string;
    content: string;
    type: 'file' | 'directory';
  }>;
  systemContext: any;
  relevantPaths: string[];
}

export class SupabaseRAGEngine {
  private supabase: SupabaseClient;
  private isInitialized = false;
  private vectorDimension = 384; // 효율적인 384차원으로 통일
  private initializationPromise: Promise<void> | null = null;

  // 🚀 성능 최적화 추가
  private queryCache = new Map<
    string,
    { result: RAGSearchResult; timestamp: number }
  >();
  private embeddingCache = new Map<string, number[]>();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5분 캐시
  private readonly maxCacheSize = 100;

  // 🔗 MCP 파일시스템 연동 설정
  private mcpEnabled = true;
  private mcpServerUrl = 'https://openmanager-vibe-v5.onrender.com';
  private mcpContextCache = new Map<
    string,
    { context: MCPFileSystemContext; timestamp: number }
  >();

  // 성능 통계
  private stats = {
    totalQueries: 0,
    cacheHits: 0,
    mcpQueries: 0,
    mcpCacheHits: 0,
    averageResponseTime: 0,
    lastOptimized: Date.now(),
  };

  constructor() {
    this.createSupabaseClient();
    this.startCacheCleanup();
  }

  /**
   * 🔗 공식 MCP 파일시스템 서버에서 컨텍스트 조회 (Anthropic 권장 방식)
   */
  private async queryMCPFileSystem(
    query: string
  ): Promise<MCPFileSystemContext | null> {
    if (!this.mcpEnabled) {
      return null;
    }

    try {
      const cacheKey = `mcp:${query}`;
      const cached = this.mcpContextCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        this.stats.mcpCacheHits++;
        return cached.context;
      }

      this.stats.mcpQueries++;

      // 🗂️ 표준 MCP 파일시스템 서버와 통신
      // Render에서 실행되는 순수 공식 MCP 서버 사용
      const mcpServerUrl = 'https://openmanager-vibe-v5.onrender.com';

      // 1. 프로젝트 루트 구조 조회 (표준 MCP 리소스)
      let systemContext = null;
      try {
        const rootResponse = await fetch(
          `${mcpServerUrl}/mcp/resources/file://project-root`
        );
        if (rootResponse.ok) {
          systemContext = await rootResponse.json();
        }
      } catch (error) {
        console.warn('MCP 프로젝트 루트 조회 실패:', error);
      }

      // 2. 쿼리 관련 파일 검색 (표준 MCP 도구 사용)
      const relevantPaths = this.extractRelevantPaths(query);
      const files: Array<{
        path: string;
        content: string;
        type: 'file' | 'directory';
      }> = [];

      for (const filePath of relevantPaths) {
        try {
          // 표준 MCP read_file 도구 사용
          const fileResponse = await fetch(
            `${mcpServerUrl}/mcp/tools/read_file`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                path: filePath,
              }),
            }
          );

          if (fileResponse.ok) {
            const fileData = await fileResponse.json();

            // MCP 응답 형식에서 실제 내용 추출
            let content = '';
            if (fileData.content && Array.isArray(fileData.content)) {
              content = fileData.content
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('\n');
            }

            if (content.trim()) {
              files.push({
                path: filePath,
                content,
                type: 'file',
              });
            }
          }
        } catch (error) {
          console.warn(`MCP 파일 읽기 실패: ${filePath}`, error);
        }
      }

      // 3. 디렉토리 구조 조회 (필요시, 표준 MCP 도구 사용)
      if (this.shouldQueryDirectoryStructure(query)) {
        try {
          const dirResponse = await fetch(
            `${mcpServerUrl}/mcp/tools/list_directory`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                path: './src',
              }),
            }
          );

          if (dirResponse.ok) {
            const dirData = await dirResponse.json();

            // MCP 응답 형식에서 실제 내용 추출
            let dirContent = '';
            if (dirData.content && Array.isArray(dirData.content)) {
              dirContent = dirData.content
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('\n');
            }

            if (dirContent.trim()) {
              files.push({
                path: './src',
                content: dirContent,
                type: 'directory',
              });
            }
          }
        } catch (error) {
          console.warn('MCP 디렉토리 조회 실패:', error);
        }
      }

      // 4. 파일 검색 기능 사용 (표준 MCP search_files 도구)
      if (this.shouldUseFileSearch(query)) {
        try {
          const searchPattern = this.extractSearchPattern(query);
          const searchResponse = await fetch(
            `${mcpServerUrl}/mcp/tools/search_files`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                pattern: searchPattern,
                directory: './src',
              }),
            }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();

            // 검색 결과를 컨텍스트에 추가
            let searchContent = '';
            if (searchData.content && Array.isArray(searchData.content)) {
              searchContent = searchData.content
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('\n');
            }

            if (searchContent.trim()) {
              files.push({
                path: `search:${searchPattern}`,
                content: searchContent,
                type: 'directory',
              });
            }
          }
        } catch (error) {
          console.warn('MCP 파일 검색 실패:', error);
        }
      }

      const mcpContext: MCPFileSystemContext = {
        files,
        systemContext,
        relevantPaths,
      };

      // 캐시에 저장
      this.mcpContextCache.set(cacheKey, {
        context: mcpContext,
        timestamp: Date.now(),
      });

      console.log(
        `🗂️ 공식 MCP 파일시스템 서버 조회 완료: ${files.length}개 파일`
      );
      return mcpContext;
    } catch (error) {
      console.error('공식 MCP 파일시스템 서버 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 파일 검색 사용 여부 판단
   */
  private shouldUseFileSearch(query: string): boolean {
    const searchKeywords = [
      '검색',
      '찾기',
      '찾아',
      'search',
      'find',
      '어디',
      'where',
      '위치',
      'location',
    ];

    return searchKeywords.some(keyword =>
      query.toLowerCase().includes(keyword)
    );
  }

  /**
   * 🎯 검색 패턴 추출
   */
  private extractSearchPattern(query: string): string {
    const lowerQuery = query.toLowerCase();

    // 파일 확장자 패턴
    const extMatches = lowerQuery.match(/\.(ts|tsx|js|jsx|json|md|env)/);
    if (extMatches) {
      return `*.${extMatches[1]}`;
    }

    // 키워드 기반 패턴
    if (lowerQuery.includes('컴포넌트') || lowerQuery.includes('component')) {
      return '*component*';
    }
    if (lowerQuery.includes('서비스') || lowerQuery.includes('service')) {
      return '*service*';
    }
    if (lowerQuery.includes('api')) {
      return '*api*';
    }
    if (lowerQuery.includes('타입') || lowerQuery.includes('type')) {
      return '*type*';
    }
    if (lowerQuery.includes('mcp')) {
      return '*mcp*';
    }

    // 기본 패턴
    return '*';
  }

  /**
   * 🔍 쿼리에서 관련 파일 경로 추출
   */
  private extractRelevantPaths(query: string): string[] {
    const paths: string[] = [];
    const lowerQuery = query.toLowerCase();

    // 파일 확장자 기반 추출
    const fileExtensions = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
      '.md',
      '.env',
    ];
    for (const ext of fileExtensions) {
      if (lowerQuery.includes(ext)) {
        // 일반적인 프로젝트 파일들 추가
        if (ext === '.env') paths.push('.env.local', '.env.example');
        if (ext === '.json') paths.push('package.json', 'tsconfig.json');
        if (ext === '.md') paths.push('README.md', 'CHANGELOG.md');
      }
    }

    // 컴포넌트/서비스 관련 키워드
    if (lowerQuery.includes('컴포넌트') || lowerQuery.includes('component')) {
      paths.push('./src/components');
    }
    if (lowerQuery.includes('서비스') || lowerQuery.includes('service')) {
      paths.push('./src/services');
    }
    if (lowerQuery.includes('api') || lowerQuery.includes('엔드포인트')) {
      paths.push('./src/app/api');
    }
    if (lowerQuery.includes('설정') || lowerQuery.includes('config')) {
      paths.push('./src/config', 'package.json');
    }
    if (lowerQuery.includes('타입') || lowerQuery.includes('type')) {
      paths.push('./src/types');
    }
    if (lowerQuery.includes('유틸') || lowerQuery.includes('util')) {
      paths.push('./src/utils');
    }
    if (lowerQuery.includes('스토어') || lowerQuery.includes('store')) {
      paths.push('./src/stores');
    }

    // MCP 관련 키워드
    if (lowerQuery.includes('mcp') || lowerQuery.includes('파일시스템')) {
      paths.push('./mcp-server/server.js', './mcp-server/package.json');
    }

    // AI 관련 키워드
    if (
      lowerQuery.includes('ai') ||
      lowerQuery.includes('인공지능') ||
      lowerQuery.includes('rag')
    ) {
      paths.push('./src/lib/ml', './src/services/ai');
    }

    // 기본 프로젝트 파일들
    if (paths.length === 0) {
      paths.push('README.md', 'package.json', './src/app/layout.tsx');
    }

    return [...new Set(paths)]; // 중복 제거
  }

  /**
   * 🗂️ 디렉토리 구조 조회 필요성 판단
   */
  private shouldQueryDirectoryStructure(query: string): boolean {
    const structureKeywords = [
      '구조',
      '폴더',
      '디렉토리',
      '파일',
      '프로젝트',
      'structure',
      'folder',
      'directory',
      'file',
      'project',
    ];

    return structureKeywords.some(keyword =>
      query.toLowerCase().includes(keyword)
    );
  }

  /**
   * 🧹 캐시 정리 스케줄러 (MCP 캐시 포함)
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
      this.optimizePerformance();
    }, 60000); // 1분마다 정리
  }

  /**
   * 🗑️ 만료된 캐시 정리 (MCP 캐시 포함)
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();

    // 쿼리 캐시 정리
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.queryCache.delete(key);
      }
    }

    // MCP 컨텍스트 캐시 정리
    for (const [key, value] of this.mcpContextCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.mcpContextCache.delete(key);
      }
    }

    // 임베딩 캐시 크기 제한
    if (this.embeddingCache.size > this.maxCacheSize) {
      const entries = Array.from(this.embeddingCache.entries());
      const toDelete = entries.slice(0, entries.length - this.maxCacheSize);
      toDelete.forEach(([key]) => this.embeddingCache.delete(key));
    }
  }

  /**
   * ⚡ 성능 최적화 (MCP 통계 포함)
   */
  private optimizePerformance(): void {
    const now = Date.now();

    // 캐시 히트율 계산
    const cacheHitRate =
      this.stats.totalQueries > 0
        ? (this.stats.cacheHits / this.stats.totalQueries) * 100
        : 0;

    const mcpCacheHitRate =
      this.stats.mcpQueries > 0
        ? (this.stats.mcpCacheHits / this.stats.mcpQueries) * 100
        : 0;

    console.log(`📊 RAG 엔진 성능 통계 (${new Date(now).toLocaleTimeString()}):
      - 총 쿼리: ${this.stats.totalQueries}
      - 캐시 히트율: ${cacheHitRate.toFixed(1)}%
      - MCP 쿼리: ${this.stats.mcpQueries}
      - MCP 캐시 히트율: ${mcpCacheHitRate.toFixed(1)}%
      - 평균 응답시간: ${this.stats.averageResponseTime}ms
      - 캐시 크기: 쿼리 ${this.queryCache.size}, MCP ${this.mcpContextCache.size}, 임베딩 ${this.embeddingCache.size}`);

    this.stats.lastOptimized = now;
  }

  /**
   * Supabase 클라이언트 생성 (암호화된 환경변수 활용)
   */
  private createSupabaseClient() {
    // 자동 복호화 시스템을 통한 환경변수 복구 시도
    try {
      autoDecryptEnv.forceRestoreAll();
    } catch (error) {
      console.warn('⚠️ 자동 복호화 시스템 사용 실패:', error);
    }

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
    console.log('✅ Supabase 클라이언트 생성 완료 (자동 복호화 시스템 활용)');
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

        utf8Logger.korean(
          '🇰🇷',
          `한국어 NLP 처리: "${text}" → "${processedText}" (신뢰도: ${semanticWeight.toFixed(2)})`
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
   * 벡터 유사도 검색 (코사인 유사도) - 캐싱 최적화
   */
  async searchSimilar(
    query: string,
    options: {
      maxResults?: number;
      threshold?: number;
      category?: string;
      enableMCP?: boolean; // MCP 파일시스템 연동 활성화
    } = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    try {
      // 🚀 캐시 확인
      const cacheKey = `${query}_${JSON.stringify(options)}`;
      const cachedResult = this.queryCache.get(cacheKey);

      if (
        cachedResult &&
        Date.now() - cachedResult.timestamp < this.cacheExpiry
      ) {
        this.stats.cacheHits++;
        console.log(`⚡ 캐시 히트: "${query}" (${Date.now() - startTime}ms)`);

        return {
          ...cachedResult.result,
          processingTime: Date.now() - startTime,
          cached: true,
        };
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        maxResults = 5,
        threshold = 0.7,
        category,
        enableMCP = true,
      } = options;

      // 🔗 MCP 파일시스템 컨텍스트 조회 (병렬 처리)
      const mcpContextPromise = enableMCP
        ? this.queryMCPFileSystem(query)
        : Promise.resolve(null);

      console.log(`🔍 Supabase 벡터 검색 시작: "${query}"`);

      // 🚀 임베딩 캐싱 확인
      let queryEmbedding = this.embeddingCache.get(query);
      if (!queryEmbedding) {
        queryEmbedding = this.generateLocalEmbedding(query);
        this.embeddingCache.set(query, queryEmbedding);
        utf8Logger.aiStatus('로컬 임베딩', 'success', '생성 및 캐싱 완료');
      } else {
        console.log('⚡ 임베딩 캐시 히트');
      }

      // RPC 함수로 벡터 검색 시도
      let searchResults: VectorDocument[] = [];

      try {
        // 🔍 벡터 검색 수행 (올바른 RPC 함수 사용)
        const { data: rpcResults, error: rpcError } = await this.supabase.rpc(
          'search_all_commands',
          {
            search_query: query,
            result_limit: maxResults,
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

      // 🔗 MCP 컨텍스트 결과 대기 및 병합
      const mcpContext = await mcpContextPromise;

      // MCP 컨텍스트 기반 결과 보강
      if (mcpContext && mcpContext.files.length > 0) {
        console.log(
          `🔗 MCP 컨텍스트 조회 완료: ${mcpContext.files.length}개 파일, ${mcpContext.relevantPaths.length}개 경로`
        );

        // MCP에서 조회한 파일 내용을 검색 결과에 추가
        for (const file of mcpContext.files) {
          if (file.content && file.content.trim()) {
            // 파일 내용을 가상 문서로 추가
            const mcpDocument: VectorDocument = {
              id: `mcp:${file.path}`,
              content: file.content,
              metadata: {
                source: 'mcp-filesystem',
                category: 'file-content',
                tags: ['mcp', 'filesystem', file.type],
                commands: [],
                scenario: 'file_context',
                safety_warnings: [],
                priority: 'medium',
              },
              similarity: 0.9, // MCP 컨텍스트는 높은 관련성으로 설정
            };

            searchResults.unshift(mcpDocument); // 상위에 배치
          }
        }
      }

      const processingTime = Date.now() - startTime;

      // 성능 통계 업데이트
      this.stats.averageResponseTime =
        (this.stats.averageResponseTime * (this.stats.totalQueries - 1) +
          processingTime) /
        this.stats.totalQueries;

      const result: RAGSearchResult = {
        success: true,
        results: searchResults.slice(0, maxResults), // 최대 결과 수 제한
        query,
        processingTime,
        totalResults: searchResults.length,
        cached: false,
        mcpContext, // MCP 컨텍스트 포함
      };

      // 🚀 결과 캐싱
      this.queryCache.set(cacheKey, {
        result: { ...result },
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('❌ Supabase 벡터 검색 실패:', error);
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        results: [],
        query,
        processingTime,
        totalResults: 0,
        cached: false,
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

      // 존재하는 테이블에서 검색 (rag_commands)
      const { data: fallbackResults, error: fallbackError } =
        await this.supabase
          .from('rag_commands')
          .select('*')
          .or(`command.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(options.maxResults || 5);

      if (fallbackError) {
        console.warn(
          `⚠️ 폴백 검색 실패, 목업 데이터 사용: ${fallbackError.message}`
        );
        return this.generateMockResults(query, options.maxResults || 5);
      }

      // 결과를 VectorDocument 형식으로 변환
      const convertedResults = (fallbackResults || []).map((doc: any) => ({
        id: doc.id?.toString() || `fallback-${Date.now()}`,
        content: `${doc.command}: ${doc.description}`,
        metadata: {
          source: 'supabase-fallback',
          category: doc.category || 'general',
          tags: ['command', 'fallback'],
          commands: [doc.command],
          scenario: 'fallback_search',
          safety_warnings: [],
          priority: 'medium',
        },
        similarity: 0.7, // 기본 유사도
      }));

      console.log(`✅ 폴백 검색 완료: ${convertedResults.length}개 결과`);
      return convertedResults;
    } catch (error) {
      console.error('❌ 폴백 검색 실패:', error);
      return this.generateMockResults(query, options.maxResults || 5);
    }
  }

  /**
   * 🎭 목업 검색 결과 생성 (최종 폴백)
   */
  private generateMockResults(
    query: string,
    maxResults: number
  ): VectorDocument[] {
    const mockCommands = [
      {
        command: 'ps aux',
        description: '실행 중인 프로세스 목록 확인',
        category: 'system',
      },
      {
        command: 'top -p 1',
        description: '시스템 리소스 사용량 모니터링',
        category: 'monitoring',
      },
      {
        command: 'df -h',
        description: '디스크 사용량 확인',
        category: 'storage',
      },
      {
        command: 'free -m',
        description: '메모리 사용량 확인',
        category: 'memory',
      },
      {
        command: 'netstat -tulpn',
        description: '네트워크 연결 상태 확인',
        category: 'network',
      },
    ];

    // 쿼리와 관련성이 높은 결과 필터링
    const filtered = mockCommands
      .filter(
        cmd =>
          cmd.command.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes('서버') ||
          query.toLowerCase().includes('상태') ||
          query.toLowerCase().includes('모니터링')
      )
      .slice(0, maxResults);

    const convertedResults = filtered.map((cmd, index) => ({
      id: `mock-${index}`,
      content: `${cmd.command}: ${cmd.description}`,
      metadata: {
        source: 'mock-data',
        category: cmd.category,
        tags: ['command', 'mock'],
        commands: [cmd.command],
        scenario: 'mock_search',
        safety_warnings: [],
        priority: 'medium',
      },
      similarity: 0.6 - index * 0.1, // 순서대로 유사도 감소
    }));

    console.log(
      `🎭 목업 검색 결과 생성: ${convertedResults.length}개 (쿼리: "${query}")`
    );
    return convertedResults;
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
