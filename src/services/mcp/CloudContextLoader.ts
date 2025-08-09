/**
 * 🌐 Cloud-based Context Loader (Redis-Free) - Modular Architecture
 *
 * ContextLoader 대체: 파일 시스템 → GCP+Memory+MCP+RAG 통합 인프라
 *
 * 핵심 기능:
 * - MCP 서버 컨텍스트 문서를 Firestore에 구조화 저장
 * - 메모리 기반 컨텍스트 캐싱 (TTL 1시간)
 * - Google Cloud VM AI 백엔드 직접 연동
 * - RAG 엔진과의 협업 및 컨텍스트 공유
 * - 자연어 처리 파이프라인 지원
 *
 * 모듈 아키텍처 (1195 → ~200 lines):
 * - CloudContextLoader.types.ts: 타입 정의
 * - CloudContextLoader.cache.ts: 메모리 캐싱 
 * - CloudContextLoader.health.ts: MCP 서버 헬스체크
 * - CloudContextLoader.utils.ts: 유틸리티 함수
 * - CloudContextLoader.storage.ts: 스토리지 CRUD 관리
 * - CloudContextLoader.rag.ts: RAG/NLP 통합 처리
 */

import type { 
  ContextDocument, 
  MCPServerInfo, 
  RAGEngineContext, 
  CloudContextLoaderConfig,
  IntegratedStatusResponse,
  ContextStatsResponse,
  NLPContextResponse,
  NLPType,
  BundleUploadData,
  BundleType,
  MCPQueryOptions
} from './CloudContextLoader.types';
import { MemoryContextCache } from './CloudContextLoader.cache';
import { MCPHealthChecker } from './CloudContextLoader.health';
import { ContextStorageManager } from './CloudContextLoader.storage';
import { RAGIntegrationManager } from './CloudContextLoader.rag';
import { createDefaultConfig, generateChecksum, generateContextId } from './CloudContextLoader.utils';

export class CloudContextLoader {
  private static instance: CloudContextLoader;
  private config: CloudContextLoaderConfig;
  private memoryCache: MemoryContextCache;
  private healthChecker: MCPHealthChecker;
  private storageManager: ContextStorageManager;
  private ragIntegration: RAGIntegrationManager;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CloudContextLoaderConfig>) {
    this.config = { ...createDefaultConfig(), ...config };

    // 모듈 초기화
    this.memoryCache = new MemoryContextCache();
    this.healthChecker = new MCPHealthChecker(this.config);
    this.storageManager = new ContextStorageManager(this.config);
    this.ragIntegration = new RAGIntegrationManager(
      this.config,
      this.memoryCache,
      this.storageManager
    );

    // MCP 서버 헬스체크 시작
    if (this.config.enableMCPIntegration) {
      this.healthChecker.startHealthCheck();
    }

    // 주기적 캐시 정리 (5분마다)
    this.startCacheCleanup();

    console.log('🌐 CloudContextLoader 초기화 완료 (Modular Architecture: 6 modules)');
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
      this.storageManager.cleanup();
    }, 5 * 60 * 1000); // 5분마다
  }

  // ===== RAG & NLP 통합 API (모두 RAG 모듈로 위임) =====

  /**
   * 🤖 RAG 엔진을 위한 MCP 컨텍스트 조회
   */
  async queryMCPContextForRAG(
    query: string,
    options?: MCPQueryOptions
  ): Promise<RAGEngineContext | null> {
    return this.ragIntegration.queryMCPContextForRAG(
      query,
      this.healthChecker.getServerInfo(),
      options
    );
  }

  /**
   * 🧠 자연어 처리를 위한 컨텍스트 제공
   */
  async getContextForNLP(
    query: string,
    nlpType: NLPType
  ): Promise<NLPContextResponse> {
    return this.ragIntegration.getContextForNLP(
      query,
      nlpType,
      this.healthChecker.getServerInfo()
    );
  }

  /**
   * 🔄 RAG 엔진과 컨텍스트 동기화
   */
  async syncContextWithRAG(ragEngineUrl?: string): Promise<{
    success: boolean;
    syncedContexts: number;
    errors: string[];
  }> {
    return this.ragIntegration.syncContextWithRAG(
      this.healthChecker.getServerInfo(),
      ragEngineUrl
    );
  }

  // ===== 스토리지 관리 API (모두 스토리지 모듈로 위임) =====

  /**
   * 📚 컨텍스트 번들 업로드 (Firestore + Memory)
   */
  async uploadContextBundle(
    bundleType: 'base' | 'advanced' | 'custom',
    bundleData: BundleUploadData,
    clientId?: string
  ): Promise<boolean> {
    try {
      const contextDoc: ContextDocument = {
        id: generateContextId(bundleType, clientId),
        bundleType,
        clientId,
        documents: bundleData.documents,
        metadata: {
          version: bundleData.version || '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'cloud_upload',
          checksum: generateChecksum(bundleData as unknown as Record<string, unknown>),
        },
      };

      // 스토리지 모듈로 위임
      const saved = await this.storageManager.saveContextBundle(contextDoc);

      // RAG 엔진과 자동 동기화
      if (saved && this.config.enableRAGIntegration) {
        await this.ragIntegration.syncContextWithRAG(this.healthChecker.getServerInfo());
      }

      return saved;
    } catch (error) {
      console.error('❌ 컨텍스트 번들 업로드 실패:', error);
      return false;
    }
  }

  /**
   * 🔍 컨텍스트 번들 로드
   */
  async loadContextBundle(
    bundleType: BundleType,
    clientId?: string
  ): Promise<ContextDocument | null> {
    return this.storageManager.loadContextBundle(bundleType, clientId);
  }

  /**
   * 🗑️ 컨텍스트 삭제
   */
  async deleteContext(
    bundleType: BundleType,
    clientId?: string
  ): Promise<boolean> {
    return this.storageManager.deleteContext(bundleType, clientId);
  }

  /**
   * 🔄 컨텍스트 새로고침
   */
  async refreshContext(
    bundleType: BundleType,
    clientId?: string
  ): Promise<boolean> {
    return this.storageManager.refreshContext(bundleType, clientId);
  }

  /**
   * 📋 컨텍스트 목록 조회
   */
  async getContextList(
    bundleType?: BundleType
  ): Promise<string[]> {
    return this.storageManager.getContextList(bundleType);
  }

  /**
   * 📊 컨텍스트 통계 조회
   */
  async getContextStats(): Promise<ContextStatsResponse> {
    return this.storageManager.getContextStats();
  }

  // ===== 상태 조회 및 관리 API =====

  /**
   * 📊 MCP + RAG 통합 상태 조회
   */
  async getIntegratedStatus(): Promise<IntegratedStatusResponse> {
    const cacheStats = this.memoryCache.getStats();
    const serverInfo = this.healthChecker.getServerInfo();
    
    return {
      mcpServer: serverInfo,
      contextCache: {
        size: cacheStats.size,
        hitRate: cacheStats.hitRate,
      },
      ragIntegration: {
        enabled: this.config.enableRAGIntegration,
        lastSync: new Date().toISOString(),
        syncCount: 42, // TODO: 실제 카운터로 교체
      },
      performance: {
        avgQueryTime: serverInfo.responseTime,
        totalQueries: cacheStats.hits + cacheStats.misses,
        errorRate: 2.1, // TODO: 실제 계산값으로 교체
      },
    };
  }

  /**
   * 🏥 MCP 서버 상태 조회
   */
  getMCPServerInfo(): MCPServerInfo {
    return this.healthChecker.getServerInfo();
  }

  /**
   * 🔍 MCP 서버 온라인 여부
   */
  isMCPServerOnline(): boolean {
    return this.healthChecker.isServerOnline();
  }

  /**
   * 🧹 캐시 무효화
   */
  invalidateCache(): void {
    this.memoryCache.clear();
    this.storageManager.invalidateCache();
    console.log('🧹 CloudContextLoader 캐시 무효화 완료');
  }

  /**
   * 📊 캐시 통계
   */
  getCacheStats() {
    return this.memoryCache.getStats();
  }

  /**
   * 🛑 리소스 정리
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.healthChecker.destroy();
    this.invalidateCache();
    console.log('🛑 CloudContextLoader 리소스 정리 완료');
  }
}