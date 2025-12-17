/**
 * Gemini Embedding Utility (FREE Tier)
 * AI SDK @ai-sdk/google 사용 (기존 의존성 활용)
 *
 * 무료 티어 제한:
 * - 모델: text-embedding-004 (무료)
 * - Rate Limit: 1,500 RPM (분당 요청)
 * - 일일 한도: 충분함 (5명 × 1시간 = ~150 쿼리/일)
 *
 * 주의: On-demand only - 백그라운드 작업 금지
 */

import { google } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 텍스트를 384차원 벡터로 임베딩
 * Gemini text-embedding-004 사용 (무료)
 * outputDimensionality: 384로 기존 command_vectors와 호환
 *
 * @param text - 임베딩할 텍스트
 * @returns 384차원 float 배열
 */
export async function embedText(text: string): Promise<number[]> {
  const model = google.textEmbedding('text-embedding-004');

  const { embedding } = await embed({
    model,
    value: text,
    experimental_telemetry: { isEnabled: false },
    providerOptions: {
      google: {
        outputDimensionality: 384, // 기존 command_vectors와 호환
        taskType: 'RETRIEVAL_QUERY', // RAG 검색 최적화
      },
    },
  });

  return embedding;
}

/**
 * 여러 텍스트를 배치로 임베딩 (시드 데이터용)
 * AI SDK embedMany 사용 - 자동 배치 처리
 *
 * @param texts - 임베딩할 텍스트 배열
 * @returns 384차원 벡터 배열
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = google.textEmbedding('text-embedding-004');

  const { embeddings } = await embedMany({
    model,
    values: texts,
    experimental_telemetry: { isEnabled: false },
    providerOptions: {
      google: {
        outputDimensionality: 384,
        taskType: 'RETRIEVAL_DOCUMENT', // 문서 저장용
      },
    },
  });

  return embeddings;
}

/**
 * 임베딩을 PostgreSQL vector 형식 문자열로 변환
 * Supabase RPC 호출 시 사용
 */
export function toVectorString(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * RAG 검색 결과 타입
 */
export interface RAGSearchResult {
  success: boolean;
  results: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    similarity: number;
  }>;
  error?: string;
}

/**
 * 쿼리 임베딩 + Supabase 검색을 한 번에 수행
 * Reporter Agent에서 직접 사용
 *
 * @param supabaseClient - Supabase 클라이언트
 * @param query - 검색할 쿼리 문자열 (최대 500자)
 * @param options - 검색 옵션 (threshold, limit, filters)
 */
export async function searchWithEmbedding(
  supabaseClient: SupabaseClient,
  query: string,
  options: {
    similarityThreshold?: number;
    maxResults?: number;
    category?: string;
    severity?: string;
  } = {}
): Promise<RAGSearchResult> {
  try {
    // 입력 검증: 쿼리 길이 제한 (500자)
    if (!query || query.length === 0) {
      return { success: false, results: [], error: 'Query is empty' };
    }
    if (query.length > 500) {
      return { success: false, results: [], error: 'Query too long (max 500 chars)' };
    }

    // 1. 쿼리 임베딩 생성 (Gemini text-embedding-004)
    const queryEmbedding = await embedText(query);
    const vectorString = toVectorString(queryEmbedding);

    // 2. Supabase RPC로 유사도 검색
    const { data, error } = await supabaseClient.rpc('search_knowledge_base', {
      query_embedding: vectorString,
      similarity_threshold: options.similarityThreshold ?? 0.3,
      max_results: options.maxResults ?? 5,
      filter_category: options.category ?? null,
      filter_severity: options.severity ?? null,
    });

    if (error) {
      throw error;
    }

    // 3. 결과 매핑
    const results = Array.isArray(data)
      ? data.map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ''),
          title: String(row.title ?? ''),
          content: String(row.content ?? ''),
          category: String(row.category ?? 'general'),
          similarity: Number(row.similarity ?? 0),
        }))
      : [];

    return {
      success: true,
      results,
    };
  } catch (e) {
    console.error('❌ [Embedding] Search failed:', e);
    return {
      success: false,
      results: [],
      error: String(e),
    };
  }
}
