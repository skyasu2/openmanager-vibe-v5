/**
 * 🌐 CloudContextLoader Type Definitions
 *
 * Type interfaces for the CloudContextLoader system:
 * - Context document structures
 * - MCP server information
 * - RAG engine contexts
 * - Configuration interfaces
 * - API response types
 */

import type { MCPContextPatterns } from '@/types/mcp';

/**
 * 📄 컨텍스트 문서 인터페이스
 */
export interface ContextDocument {
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

/**
 * 🖥️ MCP 서버 정보 인터페이스
 */
export interface MCPServerInfo {
  url: string;
  status: 'online' | 'offline' | 'degraded';
  lastChecked: string;
  responseTime: number;
  version?: string;
  capabilities?: string[];
}

/**
 * 🧠 RAG 엔진 컨텍스트 인터페이스
 */
export interface RAGEngineContext {
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

/**
 * ⚙️ CloudContextLoader 설정 인터페이스
 */
export interface CloudContextLoaderConfig {
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

/**
 * 🧠 NLP 컨텍스트 응답 인터페이스
 */
export interface NLPContextResponse {
  mcpContext?: RAGEngineContext;
  localContext?: ContextDocument[];
  combinedContext: string;
  contextSources: string[];
}

/**
 * 🔄 RAG 동기화 결과 인터페이스
 */
export interface RAGSyncResult {
  success: boolean;
  syncedContexts: number;
  errors: string[];
}

/**
 * 📤 RAG 전송 결과 인터페이스
 */
export interface RAGSendResult {
  success: boolean;
  message?: string;
}

/**
 * 📊 통합 상태 응답 인터페이스
 */
export interface IntegratedStatusResponse {
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
}

/**
 * 📈 컨텍스트 통계 응답 인터페이스
 */
export interface ContextStatsResponse {
  totalContexts: number;
  bundleTypes: Record<string, number>;
  cacheHitRate: number;
  memoryUsage: string;
}

/**
 * 🎯 MCP 컨텍스트 쿼리 옵션
 */
export interface MCPQueryOptions {
  maxFiles?: number;
  includeSystemContext?: boolean;
  pathFilters?: string[];
}

/**
 * 🎯 번들 업로드 데이터 인터페이스
 */
export interface BundleUploadData {
  documents: {
    markdown: Record<string, string>;
    patterns: MCPContextPatterns;
  };
  version?: string;
}

/**
 * 📝 NLP 타입 열거형
 */
export type NLPType =
  | 'intent_analysis'
  | 'entity_extraction'
  | 'sentiment_analysis'
  | 'command_parsing';

/**
 * 📦 번들 타입 열거형
 */
export type BundleType = 'base' | 'advanced' | 'custom';
