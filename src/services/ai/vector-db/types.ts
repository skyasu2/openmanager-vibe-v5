/**
 * Vector DB Types
 *
 * PostgreSQL + pgvector 벡터 DB 관련 타입
 */

/**
 * 문서 메타데이터
 */
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

/**
 * 벡터 문서
 */
export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: DocumentMetadata;
  created_at?: string;
  updated_at?: string;
}

/**
 * 검색 결과
 */
export interface SearchResult {
  id: string;
  content: string;
  metadata?: DocumentMetadata;
  similarity: number;
}

/**
 * 메타데이터 필터
 */
export interface MetadataFilter {
  category?: string;
  title?: string;
  tags?: string[];
  source?: string;
  author?: string;
  priority?: number;
  [key: string]: unknown;
}

/**
 * 검색 옵션
 */
export interface SearchOptions {
  topK?: number;
  threshold?: number;
  metadata_filter?: MetadataFilter;
  category?: string;
}

/**
 * 하이브리드 검색 결과
 */
export interface HybridSearchResult extends SearchResult {
  vector_similarity: number;
  text_rank: number;
  combined_score: number;
}
