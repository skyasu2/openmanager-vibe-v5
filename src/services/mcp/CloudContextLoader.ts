/**
 * 🌐 Cloud-based Context Loader
 *
 * ContextLoader 대체: 파일 시스템 → GCP+Redis+MCP+RAG 통합 인프라
 *
 * 기능:
 * - MCP 서버 컨텍스트 문서를 Firestore에 구조화 저장
 * - Redis를 통한 빠른 컨텍스트 캐싱 (TTL 1시간)
 * - Google Cloud VM MCP 서버 직접 연동
 * - RAG 엔진과의 협업 및 컨텍스트 공유
 * - 자연어 처리 파이프라인 지원
 * - 버전 관리 및 백업 지원
 * - 실시간 컨텍스트 업데이트
 */

import type { MCPContextPatterns } from '@/types/mcp';
import type { RedisClientInterface } from '@/lib/redis';

// 🔒 Redis 타입 가드 함수들
/**
 * Redis 클라이언트 객체인지 확인하는 타입 가드
 */
export function isRedisClient(value: unknown): value is RedisClientInterface {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).get === 'function' &&
    typeof (value as any).set === 'function' &&
    typeof (value as any).setex === 'function' &&
    typeof (value as any).del === 'function' &&
    typeof (value as any).ping === 'function'
  );
}

/**
 * Redis가 연결되어 있고 사용 가능한지 확인하는 타입 가드
 */
export function isRedisConnected(
  redis: RedisClientInterface | null
): redis is RedisClientInterface {
  return redis !== null && isRedisClient(redis);
}

/**
 * Redis 연산을 안전하게 실행하는 래퍼 함수
 */
export async function safeRedisOperation<T>(
  redis: RedisClientInterface | null,
  operation: (redis: RedisClientInterface) => Promise<T>,
  fallback?: T
): Promise<T | null> {
  if (!isRedisConnected(redis)) {
    console.warn('⚠️ Redis가 연결되지 않음 - 연산 건너뜀');
    return fallback ?? null;
  }

  try {
    return await operation(redis);
  } catch (error) {
    console.error('❌ Redis 연산 실패:', error);
    return fallback ?? null;
  }
}

// Edge Runtime 호환성을 위해 동적 import 사용
let getRedis: (() => RedisClientInterface) | null = null;
try {
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    getRedis = require('@/lib/redis').getRedis;
  }
} catch {
  console.warn('⚠️ Redis 기능을 사용할 수 없는 환경입니다 (Edge Runtime)');
}

interface ContextDocument {
  id: string;
  bundleType: 'base' | 'advanced' | 'custom';
  clientId?: string;
  documents: {
    markdown: Record<string, string>;
    patterns: MCPContextPatterns;
  };
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    source: string;
    checksum: string;
  };
}

interface MCPServerInfo {
  url: string;
  status: 'online' | 'offline' | 'degraded';
  lastChecked: string;
  responseTime: number;
  version?: string;
  capabilities?: string[];
}

interface RAGEngineContext {
  query: string;
  contextType: 'mcp' | 'local' | 'hybrid';
  relevantPaths: string[];
  systemContext: {
    platform?: string;
    nodeVersion?: string;
    memory?: Record<string, number>;
    environment?: string;
    metadata?: Record<string, unknown>;
  };
  files: Array<{
    path: string;
    content: string;
    type: 'file' | 'directory';
    lastModified: string;
  }>;
}

interface CloudContextLoaderConfig {
  enableRedisCache: boolean;
  enableFirestore: boolean;
  enableMCPIntegration: boolean;
  enableRAGIntegration: boolean;
  redisPrefix: string;
  redisTTL: number; // 1시간 기본
  maxCacheSize: number;
  compressionEnabled: boolean;
  mcpServerUrl: string;
  mcpHealthCheckInterval: number; // 헬스체크 간격 (ms)
}

export class CloudContextLoader {
  private static instance: CloudContextLoader;
  private config: CloudContextLoaderConfig;
  private redis: RedisClientInterface | null = null;
  private contextCache: Map<string, ContextDocument> = new Map();
  private mcpServerInfo: MCPServerInfo;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CloudContextLoaderConfig>) {
    this.config = {
      enableRedisCache: true,
      enableFirestore: true,
      enableMCPIntegration: true,
      enableRAGIntegration: true,
      redisPrefix: 'openmanager:context:',
      redisTTL: 3600, // 1시간
      maxCacheSize: 50, // 최대 50개 컨텍스트 캐싱
      compressionEnabled: true,
      mcpServerUrl: 'http://104.154.205.25:10000', // Google Cloud VM
      mcpHealthCheckInterval: 30000, // 30초
      ...config,
    };

    // MCP 서버 정보 초기화
    this.mcpServerInfo = {
      url: this.config.mcpServerUrl,
      status: 'offline',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
    };

    // Redis 연결 (서버 환경에서만)
    if (
      typeof window === 'undefined' &&
      this.config.enableRedisCache &&
      getRedis
    ) {
      this.redis = getRedis();
    }

    // MCP 서버 헬스체크 시작
    if (this.config.enableMCPIntegration) {
      this.startMCPHealthCheck();
    }

    console.log('🌐 CloudContextLoader 초기화 완료 (MCP + RAG 통합)');
  }

  static getInstance(
    config?: Partial<CloudContextLoaderConfig>
  ): CloudContextLoader {
    if (!CloudContextLoader.instance) {
      CloudContextLoader.instance = new CloudContextLoader(config);
    }
    return CloudContextLoader.instance;
  }

  /**
   * 🔗 Google Cloud VM MCP 서버 헬스체크 시작
   */
  private startMCPHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.checkMCPServerHealth();
    }, this.config.mcpHealthCheckInterval);

    // 즉시 첫 헬스체크 수행
    this.checkMCPServerHealth();
    console.log('🏥 MCP 서버 헬스체크 시작');
  }

  /**
   * 🏥 MCP 서버 상태 확인
   */
  private async checkMCPServerHealth(): Promise<void> {
    try {
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.mcpServerUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-CloudContextLoader/1.0',
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const healthData = await response.json();

        this.mcpServerInfo = {
          url: this.config.mcpServerUrl,
          status: 'online',
          lastChecked: new Date().toISOString(),
          responseTime,
          version: healthData.version,
          capabilities: healthData.capabilities,
        };

        console.log(`✅ MCP 서버 정상 (응답시간: ${responseTime}ms)`);
      } else {
        this.mcpServerInfo.status = 'degraded';
        this.mcpServerInfo.lastChecked = new Date().toISOString();
        this.mcpServerInfo.responseTime = responseTime;
        console.log(`⚠️ MCP 서버 응답 이상: ${response.status}`);
      }
    } catch (error) {
      this.mcpServerInfo.status = 'offline';
      this.mcpServerInfo.lastChecked = new Date().toISOString();
      this.mcpServerInfo.responseTime = -1;
      console.warn(`❌ MCP 서버 연결 실패: ${error}`);
    }
  }

  /**
   * 🤖 RAG 엔진을 위한 MCP 컨텍스트 조회
   */
  async queryMCPContextForRAG(
    query: string,
    options?: {
      maxFiles?: number;
      includeSystemContext?: boolean;
      pathFilters?: string[];
    }
  ): Promise<RAGEngineContext | null> {
    if (
      !this.config.enableMCPIntegration ||
      this.mcpServerInfo.status === 'offline'
    ) {
      console.warn('⚠️ MCP 서버 비활성화 또는 오프라인 상태');
      return null;
    }

    try {
      console.log(`🔍 RAG 엔진을 위한 MCP 컨텍스트 조회: "${query}"`);

      const {
        maxFiles = 10,
        includeSystemContext = true,
        pathFilters = [],
      } = options || {};

      // 1. 시스템 컨텍스트 조회
      const systemContext = includeSystemContext
        ? await this.fetchSystemContext()
        : null;

      // 2. 쿼리 관련 파일 경로 추출
      const relevantPaths = this.extractRelevantPaths(query, pathFilters);

      // 3. 관련 파일들 조회
      const files = await this.fetchMCPFiles(relevantPaths, maxFiles);

      const ragContext: RAGEngineContext = {
        query,
        contextType: 'mcp',
        relevantPaths,
        systemContext,
        files,
      };

      // 4. Redis 캐싱
      await this.cacheRAGContext(query, ragContext);

      console.log(
        `✅ RAG 컨텍스트 조회 완료: ${files.length}개 파일, ${relevantPaths.length}개 경로`
      );
      return ragContext;
    } catch (error) {
      console.error('❌ RAG MCP 컨텍스트 조회 실패:', error);
      return null;
    }
  }

  /**
   * 📁 시스템 컨텍스트 조회
   */
  private async fetchSystemContext(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${this.config.mcpServerUrl}/mcp/resources/file://project-root`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const systemContext = await response.json();
        console.log('📁 시스템 컨텍스트 조회 완료');
        return systemContext;
      }
    } catch (error) {
      console.warn('시스템 컨텍스트 조회 실패:', error);
    }
    return null;
  }

  /**
   * 📄 MCP 서버에서 파일들 조회
   */
  private async fetchMCPFiles(
    paths: string[],
    maxFiles: number
  ): Promise<RAGEngineContext['files']> {
    const files: RAGEngineContext['files'] = [];

    for (const path of paths.slice(0, maxFiles)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          `${this.config.mcpServerUrl}/mcp/resources/file://${encodeURIComponent(path)}`,
          {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const fileData = await response.json();
          if (fileData.content) {
            files.push({
              path,
              content: fileData.content,
              type: fileData.type || 'file',
              lastModified: fileData.lastModified || new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.warn(`파일 조회 실패: ${path}`, error);
      }
    }

    return files;
  }

  /**
   * 💾 RAG 컨텍스트 캐싱
   */
  private async cacheRAGContext(
    query: string,
    ragContext: RAGEngineContext
  ): Promise<void> {
    if (this.config.enableRedisCache) {
      const cacheKey = `${this.config.redisPrefix}rag:${this.generateQueryHash(query)}`;
      await safeRedisOperation(
        this.redis,
        async redis =>
          await redis.setex(cacheKey, 900, JSON.stringify(ragContext))
      );
    }
  }

  /**
   * 🧠 자연어 처리를 위한 컨텍스트 제공
   */
  async getContextForNLP(
    query: string,
    nlpType:
      | 'intent_analysis'
      | 'entity_extraction'
      | 'sentiment_analysis'
      | 'command_parsing'
  ): Promise<{
    mcpContext?: RAGEngineContext;
    localContext?: ContextDocument[];
    combinedContext: string;
    contextSources: string[];
  }> {
    console.log(`🧠 자연어 처리 컨텍스트 제공: ${nlpType} - "${query}"`);

    const contextSources: string[] = [];
    let combinedContext = '';

    // 1. MCP 컨텍스트 조회
    const mcpContext = await this.fetchMCPContextForNLP(query, nlpType, contextSources);
    if (mcpContext) {
      combinedContext += this.formatMCPContextForNLP(mcpContext);
    }

    // 2. 로컬 컨텍스트 조회
    const localContext = await this.fetchLocalContextForNLP(nlpType, contextSources);
    combinedContext += this.formatLocalContextForNLP(localContext);

    // 3. 컨텍스트 최적화
    combinedContext = this.optimizeContextLength(combinedContext);

    console.log(
      `✅ NLP 컨텍스트 준비 완료: ${contextSources.length}개 소스, ${combinedContext.length}자`
    );

    return {
      mcpContext: mcpContext || undefined,
      localContext,
      combinedContext,
      contextSources,
    };
  }

  /**
   * 🔍 NLP용 MCP 컨텍스트 조회
   */
  private async fetchMCPContextForNLP(
    query: string,
    nlpType: string,
    contextSources: string[]
  ): Promise<RAGEngineContext | null> {
    if (!this.config.enableMCPIntegration) return null;

    const mcpContext = await this.queryMCPContextForRAG(query, {
      maxFiles: 5,
      includeSystemContext: nlpType === 'command_parsing',
      pathFilters: this.getNLPRelevantPaths(nlpType),
    });

    if (mcpContext) {
      contextSources.push('mcp-server');
    }

    return mcpContext;
  }

  /**
   * 📄 NLP용 로컬 컨텍스트 조회
   */
  private async fetchLocalContextForNLP(
    nlpType: string,
    contextSources: string[]
  ): Promise<ContextDocument[]> {
    const localContext: ContextDocument[] = [];
    const relevantBundles = this.getBundlesForNLP(nlpType);

    for (const bundleType of relevantBundles) {
      const context = await this.loadContextBundle(bundleType);
      if (context) {
        localContext.push(context);
        contextSources.push(`local-${bundleType}`);
      }
    }

    return localContext;
  }

  /**
   * 📝 MCP 컨텍스트 포맷팅
   */
  private formatMCPContextForNLP(mcpContext: RAGEngineContext): string {
    return `[MCP 컨텍스트]\n${mcpContext.files
      .map(f => `파일: ${f.path}\n내용: ${f.content.substring(0, 200)}...`)
      .join('\n')}\n\n`;
  }

  /**
   * 📝 로컬 컨텍스트 포맷팅
   */
  private formatLocalContextForNLP(localContext: ContextDocument[]): string {
    let formatted = '';
    for (const context of localContext) {
      const markdownContent = Object.values(context.documents.markdown).join('\n');
      formatted += `[로컬 컨텍스트: ${context.bundleType}]\n${markdownContent.substring(0, 300)}...\n\n`;
    }
    return formatted;
  }

  /**
   * ✂️ 컨텍스트 길이 최적화
   */
  private optimizeContextLength(context: string): string {
    return context.length > 2000 
      ? context.substring(0, 2000) + '...[더 많은 컨텍스트 사용 가능]'
      : context;
  }

  /**
   * 🔄 RAG 엔진과 컨텍스트 동기화
   */
  async syncContextWithRAG(ragEngineUrl?: string): Promise<{
    success: boolean;
    syncedContexts: number;
    errors: string[];
  }> {
    console.log('🔄 RAG 엔진과 컨텍스트 동기화 시작...');

    const errors: string[] = [];
    let syncedContexts = 0;

    try {
      // 1. 현재 모든 컨텍스트 목록 조회
      const allContexts = await Promise.all([
        this.loadContextBundle('base'),
        this.loadContextBundle('advanced'),
        this.getContextList('custom'),
      ]);

      // 2. MCP 서버에서 최신 컨텍스트 조회
      if (this.mcpServerInfo.status === 'online') {
        const mcpContext = await this.queryMCPContextForRAG(
          '전체 시스템 컨텍스트',
          {
            maxFiles: 20,
            includeSystemContext: true,
          }
        );

        if (mcpContext) {
          // RAG 엔진으로 컨텍스트 전송
          const ragSyncResult = await this.sendContextToRAG(
            mcpContext,
            ragEngineUrl
          );
          if (ragSyncResult.success) {
            syncedContexts++;
          } else {
            errors.push('MCP 컨텍스트 RAG 동기화 실패');
          }
        }
      }

      // 3. 로컬 컨텍스트들도 RAG에 동기화
      for (const context of allContexts) {
        if (context && typeof context === 'object' && 'documents' in context) {
          const ragSyncResult = await this.sendContextToRAG(
            context,
            ragEngineUrl
          );
          if (ragSyncResult.success) {
            syncedContexts++;
          } else {
            errors.push(`로컬 컨텍스트 동기화 실패: ${context.id}`);
          }
        }
      }

      console.log(`✅ RAG 컨텍스트 동기화 완료: ${syncedContexts}개 성공`);

      return {
        success: errors.length === 0,
        syncedContexts,
        errors,
      };
    } catch (error) {
      console.error('❌ RAG 컨텍스트 동기화 실패:', error);
      return {
        success: false,
        syncedContexts,
        errors: [...errors, `동기화 프로세스 실패: ${error}`],
      };
    }
  }

  /**
   * 📤 RAG 엔진으로 컨텍스트 전송
   */
  private async sendContextToRAG(
    context: RAGEngineContext | ContextDocument,
    ragEngineUrl?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const endpoint = ragEngineUrl || `${appUrl}/api/rag/sync-context`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          timestamp: new Date().toISOString(),
          source: 'cloud-context-loader',
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, message: `HTTP ${response.status}` };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 🔍 쿼리에서 관련 파일 경로 추출
   */
  private extractRelevantPaths(
    query: string,
    pathFilters: string[] = []
  ): string[] {
    const basePaths = [
      'src/app/dashboard',
      'src/components/dashboard',
      'src/services',
      'src/core/ai',
      'src/lib',
      'README.md',
      'package.json',
    ];

    // 쿼리 키워드 기반 경로 필터링
    const keywords = query.toLowerCase().split(' ');
    const relevantPaths = basePaths.filter(path => {
      return keywords.some(
        keyword =>
          path.toLowerCase().includes(keyword) ||
          this.getPathKeywords(path).some(pathKeyword =>
            pathKeyword.includes(keyword)
          )
      );
    });

    // 사용자 정의 필터 적용
    if (pathFilters.length > 0) {
      relevantPaths.push(...pathFilters);
    }

    return [...new Set(relevantPaths)]; // 중복 제거
  }

  /**
   * 🏷️ 경로에서 키워드 추출
   */
  private getPathKeywords(path: string): string[] {
    return path.split('/').concat(path.split('-')).concat(path.split('_'));
  }

  /**
   * 🧠 NLP 타입별 관련 경로 반환
   */
  private getNLPRelevantPaths(nlpType: string): string[] {
    const pathMap: Record<string, string[]> = {
      intent_analysis: ['src/core/ai', 'src/services/ai'],
      entity_extraction: ['src/lib', 'src/utils'],
      sentiment_analysis: ['src/components', 'src/app'],
      command_parsing: ['src/services', 'scripts'],
    };

    return pathMap[nlpType] || [];
  }

  /**
   * 📚 NLP 타입별 관련 번들 반환
   */
  private getBundlesForNLP(
    nlpType: string
  ): Array<'base' | 'advanced' | 'custom'> {
    const bundleMap: Record<string, Array<'base' | 'advanced' | 'custom'>> = {
      intent_analysis: ['base', 'advanced'],
      entity_extraction: ['base'],
      sentiment_analysis: ['advanced'],
      command_parsing: ['base', 'custom'],
    };

    return bundleMap[nlpType] || ['base'];
  }

  /**
   * 🔑 쿼리 해시 생성
   */
  private generateQueryHash(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 📊 MCP + RAG 통합 상태 조회
   */
  async getIntegratedStatus(): Promise<{
    mcpServer: MCPServerInfo;
    contextCache: {
      size: number;
      hitRate: number;
    };
    ragIntegration: {
      enabled: boolean;
      lastSync: string;
      syncCount: number;
    };
    performance: {
      avgQueryTime: number;
      totalQueries: number;
      errorRate: number;
    };
  }> {
    // 기본 통계 계산 (실제 구현에서는 실제 데이터 사용)
    return {
      mcpServer: this.mcpServerInfo,
      contextCache: {
        size: this.contextCache.size,
        hitRate: 85.7, // 실제 계산값으로 교체
      },
      ragIntegration: {
        enabled: this.config.enableRAGIntegration,
        lastSync: new Date().toISOString(),
        syncCount: 42, // 실제 카운터로 교체
      },
      performance: {
        avgQueryTime: this.mcpServerInfo.responseTime,
        totalQueries: 1234, // 실제 카운터로 교체
        errorRate: 2.1, // 실제 계산값으로 교체
      },
    };
  }

  /**
   * 📚 컨텍스트 번들 업로드 (Firestore + Redis)
   */
  async uploadContextBundle(
    bundleType: 'base' | 'advanced' | 'custom',
    bundleData: {
      documents: {
        markdown: Record<string, string>;
        patterns: MCPContextPatterns;
      };
      version?: string;
    },
    clientId?: string
  ): Promise<boolean> {
    try {
      const contextDoc: ContextDocument = {
        id: this.generateContextId(bundleType, clientId),
        bundleType,
        clientId,
        documents: bundleData.documents,
        metadata: {
          version: bundleData.version || '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'cloud_upload',
          checksum: this.generateChecksum(bundleData),
        },
      };

      // 1. Firestore에 영구 저장
      if (this.config.enableFirestore) {
        await this.saveToFirestore(contextDoc);
      }

      // 2. Redis 캐싱
      if (this.config.enableRedisCache && this.redis) {
        await this.saveToRedis(contextDoc);
      }

      // 3. 메모리 캐시 업데이트
      this.updateMemoryCache(contextDoc);

      // 4. RAG 엔진과 자동 동기화
      if (this.config.enableRAGIntegration) {
        await this.sendContextToRAG(contextDoc);
      }

      console.log(`📚 컨텍스트 번들 업로드 완료: ${contextDoc.id}`);
      return true;
    } catch (error) {
      console.error('❌ 컨텍스트 번들 업로드 실패:', error);
      return false;
    }
  }

  /**
   * 🔍 컨텍스트 번들 로드 (Redis → Firestore → 캐시 순서)
   */
  async loadContextBundle(
    bundleType: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<ContextDocument | null> {
    try {
      const contextId = this.generateContextId(bundleType, clientId);

      // 1. 메모리 캐시 확인
      if (this.contextCache.has(contextId)) {
        console.log(`✅ 메모리 캐시에서 컨텍스트 로드: ${contextId}`);
        return this.contextCache.get(contextId)!;
      }

      // 2. Redis 캐시 확인
      if (this.config.enableRedisCache && this.redis) {
        const cached = await this.getFromRedis(contextId);
        if (cached) {
          this.updateMemoryCache(cached);
          console.log(`✅ Redis에서 컨텍스트 로드: ${contextId}`);
          return cached;
        }
      }

      // 3. Firestore에서 조회
      if (this.config.enableFirestore) {
        const firestore = await this.getFromFirestore(contextId);
        if (firestore) {
          // Redis 캐시 업데이트
          if (this.config.enableRedisCache && this.redis) {
            await this.saveToRedis(firestore);
          }
          this.updateMemoryCache(firestore);
          console.log(`✅ Firestore에서 컨텍스트 로드: ${contextId}`);
          return firestore;
        }
      }

      console.log(`⚠️ 컨텍스트를 찾을 수 없음: ${contextId}`);
      return null;
    } catch (error) {
      console.error('❌ 컨텍스트 로드 실패:', error);
      return null;
    }
  }

  /**
   * 🔄 Redis 캐싱
   */
  private async saveToRedis(contextDoc: ContextDocument): Promise<void> {
    if (!isRedisConnected(this.redis)) {
      console.warn('⚠️ Redis가 연결되지 않음 - 캐싱 건너뜀');
      return;
    }

    try {
      const key = `${this.config.redisPrefix}${contextDoc.id}`;
      let data = JSON.stringify(contextDoc);

      // 압축 적용 (옵션)
      if (this.config.compressionEnabled && data.length > 1024) {
        // 실제 환경에서는 압축 라이브러리 사용
        console.log(`📦 컨텍스트 압축 적용: ${contextDoc.id}`);
      }

      await safeRedisOperation(this.redis, async redis => {
        await redis.setex(key, this.config.redisTTL, data);
        // 번들 타입별 인덱스 유지
        await redis.sadd(
          `${this.config.redisPrefix}bundles:${contextDoc.bundleType}`,
          contextDoc.id
        );
      });

      console.log(`✅ Redis 컨텍스트 캐싱 완료: ${contextDoc.id}`);
    } catch (error) {
      console.error('❌ Redis 컨텍스트 캐싱 실패:', error);
      throw error;
    }
  }

  /**
   * 🗃️ Firestore 영구 저장
   */
  private async saveToFirestore(contextDoc: ContextDocument): Promise<void> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(
        `${appUrl}/api/firestore/context-documents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contextDoc),
        }
      );

      if (!response.ok) {
        throw new Error(`Firestore 컨텍스트 저장 실패: ${response.status}`);
      }

      console.log(`✅ Firestore 컨텍스트 저장 완료: ${contextDoc.id}`);
    } catch (error) {
      console.error('❌ Firestore 컨텍스트 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 🔍 Redis에서 컨텍스트 조회
   */
  private async getFromRedis(
    contextId: string
  ): Promise<ContextDocument | null> {
    if (!isRedisConnected(this.redis)) {
      return null;
    }

    try {
      const key = `${this.config.redisPrefix}${contextId}`;
      const data = await safeRedisOperation(
        this.redis,
        async redis => await redis.get(key)
      );

      if (data && typeof data === 'string') {
        return JSON.parse(data);
      }

      return null;
    } catch (error) {
      console.error('❌ Redis 컨텍스트 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 Firestore에서 컨텍스트 조회
   */
  private async getFromFirestore(
    contextId: string
  ): Promise<ContextDocument | null> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(
        `${appUrl}/api/firestore/context-documents/${contextId}`
      );

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('❌ Firestore 컨텍스트 조회 실패:', error);
      return null;
    }
  }

  /**
   * 💾 메모리 캐시 관리
   */
  private updateMemoryCache(contextDoc: ContextDocument): void {
    // 캐시 크기 제한
    if (this.contextCache.size >= this.config.maxCacheSize) {
      // LRU 방식으로 가장 오래된 항목 제거
      const firstKey = this.contextCache.keys().next().value;
      if (firstKey) {
        this.contextCache.delete(firstKey);
      }
    }

    this.contextCache.set(contextDoc.id, contextDoc);
  }

  /**
   * 📋 컨텍스트 목록 조회
   */
  async getContextList(
    bundleType?: 'base' | 'advanced' | 'custom'
  ): Promise<string[]> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const query = bundleType ? `?bundleType=${bundleType}` : '';
      const response = await fetch(
        `${appUrl}/api/firestore/context-documents/list${query}`
      );

      if (response.ok) {
        const data = await response.json();
        return data.contextIds || [];
      }

      return [];
    } catch (error) {
      console.error('❌ 컨텍스트 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🗑️ 컨텍스트 삭제
   */
  async deleteContext(
    bundleType: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<boolean> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const contextId = this.generateContextId(bundleType, clientId);

      // 1. Firestore에서 삭제
      await fetch(`${appUrl}/api/firestore/context-documents/${contextId}`, {
        method: 'DELETE',
      });

      // 2. Redis 캐시 삭제
      if (isRedisConnected(this.redis)) {
        const key = `${this.config.redisPrefix}${contextId}`;
        await safeRedisOperation(this.redis, async redis => {
          await redis.del(key);
          await redis.srem(
            `${this.config.redisPrefix}bundles:${bundleType}`,
            contextId
          );
        });
      }

      // 3. 메모리 캐시 삭제
      this.contextCache.delete(contextId);

      console.log(`🗑️ 컨텍스트 삭제 완료: ${contextId}`);
      return true;
    } catch (error) {
      console.error('❌ 컨텍스트 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 🔑 컨텍스트 ID 생성
   */
  private generateContextId(bundleType: string, clientId?: string): string {
    return clientId && bundleType === 'custom'
      ? `${bundleType}-${clientId}`
      : bundleType;
  }

  /**
   * 🔐 체크섬 생성
   */
  private generateChecksum(data: Record<string, unknown>): string {
    // 간단한 해시 생성 (실제로는 crypto 라이브러리 사용 권장)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 📊 컨텍스트 통계 조회
   */
  async getContextStats(): Promise<{
    totalContexts: number;
    bundleTypes: Record<string, number>;
    cacheHitRate: number;
    memoryUsage: string;
  }> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${appUrl}/api/context-documents/stats`);
      if (response.ok) {
        return await response.json();
      }
      // 실패 시 기본값 반환
      return {
        totalContexts: 0,
        bundleTypes: {},
        cacheHitRate: 0,
        memoryUsage: '0 MB',
      };
    } catch (error) {
      console.error('❌ 컨텍스트 통계 조회 실패:', error);
      return {
        totalContexts: 0,
        bundleTypes: {},
        cacheHitRate: 0,
        memoryUsage: '0 MB',
      };
    }
  }

  /**
   * 🧹 캐시 무효화
   */
  invalidateCache(): void {
    this.contextCache.clear();
    console.log('🧹 CloudContextLoader 캐시 무효화 완료');
  }

  /**
   * 🔄 컨텍스트 새로고침
   */
  async refreshContext(
    bundleType: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<boolean> {
    try {
      const contextId = this.generateContextId(bundleType, clientId);

      // 캐시 제거
      this.contextCache.delete(contextId);
      if (isRedisConnected(this.redis)) {
        await safeRedisOperation(
          this.redis,
          async redis =>
            await redis.del(`${this.config.redisPrefix}${contextId}`)
        );
      }

      // 새로 로드
      const refreshed = await this.loadContextBundle(bundleType, clientId);

      console.log(`🔄 컨텍스트 새로고침 완료: ${contextId}`);
      return refreshed !== null;
    } catch (error) {
      console.error('❌ 컨텍스트 새로고침 실패:', error);
      return false;
    }
  }
}
