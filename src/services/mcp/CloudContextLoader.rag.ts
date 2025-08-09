/**
 * 🤖 RAG Integration Module - CloudContextLoader
 * 
 * RAG (Retrieval-Augmented Generation) integration:
 * - MCP context queries for RAG engines
 * - Context synchronization with RAG systems
 * - Natural Language Processing context provisioning
 * - System context fetching
 * - File retrieval from MCP servers
 */

import type { 
  RAGEngineContext, 
  MCPQueryOptions,
  RAGSyncResult,
  RAGSendResult,
  NLPContextResponse,
  NLPType,
  ContextDocument,
  CloudContextLoaderConfig
} from './CloudContextLoader.types';
import { 
  extractRelevantPaths,
  getNLPRelevantPaths,
  getBundlesForNLP,
  formatMCPContextForNLP,
  formatLocalContextForNLP,
  optimizeContextLength,
  generateQueryHash
} from './CloudContextLoader.utils';
import { MemoryContextCache } from './CloudContextLoader.cache';
import { ContextStorageManager } from './CloudContextLoader.storage';

/**
 * RAG 통합 관리자
 */
export class RAGIntegrationManager {
  private config: CloudContextLoaderConfig;
  private memoryCache: MemoryContextCache;
  private storageManager: ContextStorageManager;

  constructor(
    config: CloudContextLoaderConfig,
    memoryCache: MemoryContextCache,
    storageManager: ContextStorageManager
  ) {
    this.config = config;
    this.memoryCache = memoryCache;
    this.storageManager = storageManager;
  }

  /**
   * 🤖 RAG 엔진을 위한 MCP 컨텍스트 조회
   */
  async queryMCPContextForRAG(
    query: string,
    mcpServerInfo: { status: string },
    options?: MCPQueryOptions
  ): Promise<RAGEngineContext | null> {
    if (
      !this.config.enableMCPIntegration ||
      mcpServerInfo.status === 'offline'
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
      const relevantPaths = extractRelevantPaths(query, pathFilters);

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
   * 🧠 자연어 처리를 위한 컨텍스트 제공
   */
  async getContextForNLP(
    query: string,
    nlpType: NLPType,
    mcpServerInfo: { status: string }
  ): Promise<NLPContextResponse> {
    console.log(`🧠 자연어 처리 컨텍스트 제공: ${nlpType} - "${query}"`);

    const contextSources: string[] = [];
    let combinedContext = '';

    // 1. MCP 컨텍스트 조회
    const mcpContext = await this.fetchMCPContextForNLP(
      query,
      nlpType,
      contextSources,
      mcpServerInfo
    );
    if (mcpContext) {
      combinedContext += formatMCPContextForNLP(mcpContext);
    }

    // 2. 로컬 컨텍스트 조회
    const localContext = await this.fetchLocalContextForNLP(
      nlpType,
      contextSources
    );
    combinedContext += formatLocalContextForNLP(localContext);

    // 3. 컨텍스트 최적화
    combinedContext = optimizeContextLength(combinedContext);

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
   * 🔄 RAG 엔진과 컨텍스트 동기화
   */
  async syncContextWithRAG(
    mcpServerInfo: { status: string },
    ragEngineUrl?: string
  ): Promise<RAGSyncResult> {
    console.log('🔄 RAG 엔진과 컨텍스트 동기화 시작...');

    const errors: string[] = [];
    let syncedContexts = 0;

    try {
      // 1. 현재 모든 컨텍스트 목록 조회
      const allContexts = await Promise.all([
        this.storageManager.loadContextBundle('base'),
        this.storageManager.loadContextBundle('advanced'),
        this.storageManager.getContextList('custom'),
      ]);

      // 2. MCP 서버에서 최신 컨텍스트 조회
      if (mcpServerInfo.status === 'online') {
        const mcpContext = await this.queryMCPContextForRAG(
          '전체 시스템 컨텍스트',
          mcpServerInfo,
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
            errors.push(`로컬 컨텍스트 동기화 실패: ${context && typeof context === 'object' && 'id' in context ? (context as { id: string }).id : 'unknown'}`);
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
      const cacheKey = `${this.config.memoryPrefix}rag:${generateQueryHash(query)}`;
      this.memoryCache.set(cacheKey, ragContext, 900); // 15분 캐시
      console.log(`💾 RAG 컨텍스트 메모리 캐싱: ${cacheKey}`);
    }
  }

  /**
   * 🔍 NLP용 MCP 컨텍스트 조회
   */
  private async fetchMCPContextForNLP(
    query: string,
    nlpType: string,
    contextSources: string[],
    mcpServerInfo: { status: string }
  ): Promise<RAGEngineContext | null> {
    if (!this.config.enableMCPIntegration) return null;

    const mcpContext = await this.queryMCPContextForRAG(query, mcpServerInfo, {
      maxFiles: 5,
      includeSystemContext: nlpType === 'command_parsing',
      pathFilters: getNLPRelevantPaths(nlpType),
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
    const relevantBundles = getBundlesForNLP(nlpType);

    for (const bundleType of relevantBundles) {
      const context = await this.storageManager.loadContextBundle(bundleType);
      if (context) {
        localContext.push(context);
        contextSources.push(`local-${bundleType}`);
      }
    }

    return localContext;
  }

  /**
   * 📤 RAG 엔진으로 컨텍스트 전송
   */
  private async sendContextToRAG(
    context: RAGEngineContext | ContextDocument,
    ragEngineUrl?: string
  ): Promise<RAGSendResult> {
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
}