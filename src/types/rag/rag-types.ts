import type { AIMetadata } from '../../types/ai-service-types';

export interface DocumentMetadata {
  category?: string;
  title?: string;
  tags?: string[];
  source?: string;
  author?: string;
  timestamp?: string;
  priority?: number;
  version?: string;
  [key: string]: unknown;
}

export interface RAGSearchOptions {
  maxResults?: number;
  threshold?: number;
  category?: string;
  includeContext?: boolean;
  cached?: boolean;
  enableKeywordFallback?: boolean; // 키워드 기반 fallback 활성화
  useLocalEmbeddings?: boolean; // 로컬 임베딩 강제 사용
}

export interface RAGEngineSearchResult {
  success: boolean;
  results: Array<{
    id: string;
    content: string;
    similarity: number;
    metadata?: AIMetadata;
  }>;
  context?: string;
  totalResults: number;
  processingTime: number;
  cached: boolean;
  error?: string;
  metadata?: {
    processingTime?: number;
  };
  queryEmbedding?: number[];
}

export interface _EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

export interface RAGSearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: AIMetadata;
}

/**
 * 🎯 쿼리 의도 타입 (AI analyzeRequest 결과)
 */
export type QueryIntent = 'monitoring' | 'analysis' | 'guide' | 'general';

/**
 * 🔍 컨텍스트 기반 검색 옵션
 */
export interface RAGContextSearchOptions extends RAGSearchOptions {
  /** 쿼리 의도 (자동 카테고리 매핑) */
  intent?: QueryIntent;
  /** 복잡도 힌트 1-5 (자동 maxResults 조정) */
  complexity?: number;
}

/**
 * 📊 컨텍스트 검색 결과 (메타데이터 포함)
 */
export interface RAGContextSearchResult extends RAGEngineSearchResult {
  _meta: {
    intent?: QueryIntent;
    complexity?: number;
    resolvedCategory?: string;
    resolvedMaxResults: number;
  };
}
