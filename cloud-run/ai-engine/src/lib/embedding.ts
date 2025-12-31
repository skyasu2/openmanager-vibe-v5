/**
 * Mistral Embedding Utility
 * AI SDK @ai-sdk/mistral 사용
 *
 * Model: mistral-embed (1024 dimensions)
 * - Context window: 8,000 tokens
 * - MTEB retrieval score: 55.26
 * - Price: $0.10 / 1M tokens (affordable)
 *
 * ## Migration from Gemini (2025-12-31)
 * - Changed from Google text-embedding-004 (384d) to Mistral mistral-embed (1024d)
 * - Supabase schema updated via migration
 * - All knowledge_base embeddings need regeneration
 *
 * ## Secret Configuration
 * Uses MISTRAL_API_KEY environment variable
 */

import { createMistral } from '@ai-sdk/mistral';
import { embed, embedMany } from 'ai';
import { getMistralConfig } from './config-parser';

// Lazy-initialized Mistral provider
let mistralProvider: ReturnType<typeof createMistral> | null = null;

function getMistralProvider() {
  if (mistralProvider) {
    return mistralProvider;
  }

  const config = getMistralConfig();
  if (!config?.apiKey) {
    throw new Error('Mistral API key not configured. Check MISTRAL_API_KEY or AI_PROVIDERS_CONFIG secret.');
  }

  mistralProvider = createMistral({
    apiKey: config.apiKey,
  });

  return mistralProvider;
}

// Supabase 클라이언트 인터페이스 (동적 import 호환)
interface SupabaseClientLike {
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

/**
 * 텍스트를 1024차원 벡터로 임베딩
 * Mistral mistral-embed 사용
 *
 * @param text - 임베딩할 텍스트
 * @returns 1024차원 float 배열
 */
export async function embedText(text: string): Promise<number[]> {
  const mistral = getMistralProvider();
  const model = mistral.embedding('mistral-embed');

  const { embedding } = await embed({
    model,
    value: text,
    experimental_telemetry: { isEnabled: false },
  });

  return embedding;
}

/**
 * 여러 텍스트를 배치로 임베딩 (시드 데이터용)
 * AI SDK embedMany 사용 - 자동 배치 처리
 *
 * @param texts - 임베딩할 텍스트 배열
 * @returns 1024차원 벡터 배열
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const mistral = getMistralProvider();
  const model = mistral.embedding('mistral-embed');

  const { embeddings } = await embedMany({
    model,
    values: texts,
    experimental_telemetry: { isEnabled: false },
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
  supabaseClient: SupabaseClientLike,
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

    // 1. 쿼리 임베딩 생성 (Mistral mistral-embed)
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
