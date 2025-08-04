/**
 * 🌐 Cloud-based Context Loader (Redis-Free)
 *
 * ContextLoader 대체: 파일 시스템 → GCP+Memory+MCP+RAG 통합 인프라
 *
 * 기능:
 * - MCP 서버 컨텍스트 문서를 Firestore에 구조화 저장
 * - 메모리 기반 컨텍스트 캐싱 (TTL 1시간)
 * - Google Cloud VM MCP 서버 직접 연동
 * - RAG 엔진과의 협업 및 컨텍스트 공유
 * - 자연어 처리 파이프라인 지원
 * - 버전 관리 및 백업 지원
 * - 실시간 컨텍스트 업데이트
 * - Redis 완전 제거, 메모리 캐시만 사용
 */

import type { MCPContextPatterns } from '@/types/mcp';

// 메모리 기반 캐시 클래스
class MemoryContextCache {
  private cache = new Map<string, { value: any; expires: number; lastAccess: number }>();
  private maxSize = 50; // 최대 50개 컨텍스트
  private hits = 0;
  private misses = 0;

  set(key: string, value: any, ttlSeconds: number): void {
    // LRU 방식으로 캐시 크기 관리
    if (this.cache.size >= this.maxSize) {
      let oldestKey = '';
      let oldestTime = Date.now();
      
      for (const [k, v] of this.cache.entries()) {
        if (v.lastAccess < oldestTime) {
          oldestTime = v.lastAccess;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
      lastAccess: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    item.lastAccess = Date.now();
    this.hits++;
    return item.value as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      size: this.cache.size,
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }
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
  enableMemoryCache: boolean;
  enableFirestore: boolean;
  enableMCPIntegration: boolean;
  enableRAGIntegration: boolean;
  memoryPrefix: string;
  memoryTTL: number; // 1시간 기본
  maxCacheSize: number;
  compressionEnabled: boolean;
  mcpServerUrl: string;
  mcpHealthCheckInterval: number; // 헬스체크 간격 (ms)
}

export class CloudContextLoader {
  private static instance: CloudContextLoader;
  private config: CloudContextLoaderConfig;
  private memoryCache: MemoryContextCache;
  private contextCache: Map<string, ContextDocument> = new Map();
  private mcpServerInfo: MCPServerInfo;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CloudContextLoaderConfig>) {
    this.config = {
      enableMemoryCache: true,
      enableFirestore: true,
      enableMCPIntegration: true,
      enableRAGIntegration: true,
      memoryPrefix: 'openmanager:context:',
      memoryTTL: 3600, // 1시간
      maxCacheSize: 50, // 최대 50개 컨텍스트 캐싱
      compressionEnabled: true,
      mcpServerUrl:
        process.env.GCP_MCP_SERVER_URL ||
        `http://${process.env.GCP_VM_IP || '104.154.205.25'}:${process.env.GCP_MCP_SERVER_PORT || '10000'}`, // Google Cloud VM
      mcpHealthCheckInterval: 30000, // 30초
      ...config,
    };

    // 메모리 캐시 초기화
    this.memoryCache = new MemoryContextCache();

    // MCP 서버 정보 초기화
    this.mcpServerInfo = {
      url: this.config.mcpServerUrl,
      status: 'offline',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
    };

    // MCP 서버 헬스체크 시작
    if (this.config.enableMCPIntegration) {
      this.startMCPHealthCheck();
    }

    // 주기적 캐시 정리 (5분마다)
    this.startCacheCleanup();

    console.log('🌐 CloudContextLoader 초기화 완료 (MCP + RAG 통합, Memory-based)');
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
   * 🧹 주기적 캐시 정리 시작
   */
  private startCacheCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.memoryCache.cleanup();
    }, 5 * 60 * 1000); // 5분마다
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
        systemContext: systemContext || {},
        files,
      };

      // 4. 메모리 캐싱
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
  private async fetchSystemContext(): Promise<{
    platform?: string;
    nodeVersion?: string;
    memory?: Record<string, number>;
    environment?: string;
    metadata?: Record<string, unknown>;
  } | null> {
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
    if (this.config.enableMemoryCache) {
      const cacheKey = `${this.config.memoryPrefix}rag:${this.generateQueryHash(query)}`;
      this.memoryCache.set(cacheKey, ragContext, 900); // 15분 캐시
      console.log(`💾 RAG 컨텍스트 메모리 캐싱: ${cacheKey}`);
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
    const mcpContext = await this.fetchMCPContextForNLP(
      query,
      nlpType,
      contextSources
    );
    if (mcpContext) {
      combinedContext += this.formatMCPContextForNLP(mcpContext);
    }

    // 2. 로컬 컨텍스트 조회
    const localContext = await this.fetchLocalContextForNLP(
      nlpType,
      contextSources
    );
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
      .map((f) => `파일: ${f.path}\n내용: ${f.content.substring(0, 200)}...`)
      .join('\n')}\n\n`;
  }

  /**
   * 📝 로컬 컨텍스트 포맷팅
   */
  private formatLocalContextForNLP(localContext: ContextDocument[]): string {
    let formatted = '';
    for (const context of localContext) {
      const markdownContent = Object.values(context.documents.markdown).join(
        '\n'
      );
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
            errors.push(`로컬 컨텍스트 동기화 실패: ${(context as any).id}`);
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
    const relevantPaths = basePaths.filter((path) => {
      return keywords.some(
        (keyword) =>
          path.toLowerCase().includes(keyword) ||
          this.getPathKeywords(path).some((pathKeyword) =>
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
    const cacheStats = this.memoryCache.getStats();
    
    return {
      mcpServer: this.mcpServerInfo,
      contextCache: {
        size: cacheStats.size,
        hitRate: cacheStats.hitRate,
      },
      ragIntegration: {
        enabled: this.config.enableRAGIntegration,
        lastSync: new Date().toISOString(),
        syncCount: 42, // 실제 카운터로 교체
      },
      performance: {
        avgQueryTime: this.mcpServerInfo.responseTime,
        totalQueries: cacheStats.hits + cacheStats.misses,
        errorRate: 2.1, // 실제 계산값으로 교체
      },
    };
  }

  /**
   * 📚 컨텍스트 번들 업로드 (Firestore + Memory)
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

      // 2. 메모리 캐싱
      if (this.config.enableMemoryCache) {
        await this.saveToMemory(contextDoc);
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
   * 🔍 컨텍스트 번들 로드 (Memory → Firestore → 캐시 순서)
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

      // 2. 메모리 캐시에서 조회
      if (this.config.enableMemoryCache) {
        const cached = await this.getFromMemory(contextId);
        if (cached) {
          this.updateMemoryCache(cached);
          console.log(`✅ 메모리에서 컨텍스트 로드: ${contextId}`);
          return cached;
        }
      }

      // 3. Firestore에서 조회
      if (this.config.enableFirestore) {
        const firestore = await this.getFromFirestore(contextId);
        if (firestore) {
          // 메모리 캐시 업데이트
          if (this.config.enableMemoryCache) {
            await this.saveToMemory(firestore);
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
   * 💾 메모리 캐싱
   */
  private async saveToMemory(contextDoc: ContextDocument): Promise<void> {
    try {
      const key = `${this.config.memoryPrefix}${contextDoc.id}`;
      this.memoryCache.set(key, contextDoc, this.config.memoryTTL);

      console.log(`✅ 메모리 컨텍스트 캐싱 완료: ${contextDoc.id}`);
    } catch (error) {
      console.error('❌ 메모리 컨텍스트 캐싱 실패:', error);
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
   * 🔍 메모리에서 컨텍스트 조회
   */
  private async getFromMemory(
    contextId: string
  ): Promise<ContextDocument | null> {
    try {
      const key = `${this.config.memoryPrefix}${contextId}`;
      return this.memoryCache.get<ContextDocument>(key);
    } catch (error) {
      console.error('❌ 메모리 컨텍스트 조회 실패:', error);
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

      // 2. 메모리 캐시 삭제
      const key = `${this.config.memoryPrefix}${contextId}`;
      this.memoryCache.delete(key);

      // 3. 로컬 메모리 캐시 삭제
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
        const data = await response.json();
        const cacheStats = this.memoryCache.getStats();
        return {
          ...data,
          cacheHitRate: cacheStats.hitRate,
        };
      }
      // 실패 시 기본값 반환
      const cacheStats = this.memoryCache.getStats();
      return {
        totalContexts: this.contextCache.size,
        bundleTypes: {},
        cacheHitRate: cacheStats.hitRate,
        memoryUsage: `${Math.round(this.contextCache.size * 50)}KB`, // 추정치
      };
    } catch (error) {
      console.error('❌ 컨텍스트 통계 조회 실패:', error);
      const cacheStats = this.memoryCache.getStats();
      return {
        totalContexts: this.contextCache.size,
        bundleTypes: {},
        cacheHitRate: cacheStats.hitRate,
        memoryUsage: `${Math.round(this.contextCache.size * 50)}KB`,
      };
    }
  }

  /**
   * 🧹 캐시 무효화
   */
  invalidateCache(): void {
    this.contextCache.clear();
    this.memoryCache.clear();
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
      const key = `${this.config.memoryPrefix}${contextId}`;
      this.memoryCache.delete(key);

      // 새로 로드
      const refreshed = await this.loadContextBundle(bundleType, clientId);

      console.log(`🔄 컨텍스트 새로고침 완료: ${contextId}`);
      return refreshed !== null;
    } catch (error) {
      console.error('❌ 컨텍스트 새로고침 실패:', error);
      return false;
    }
  }

  /**
   * 🛑 리소스 정리
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.invalidateCache();
    console.log('🛑 CloudContextLoader 리소스 정리 완료');
  }
}