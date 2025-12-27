/**
 * Web Search Tool - Tavily Integration
 *
 * AI Engine용 웹 검색 도구
 * - DuckDuckGo 스크래핑 → Tavily API로 교체 (2025-12-28)
 * - 안정적인 공식 API 사용
 * - Rate limit 및 에러 처리 내장
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { getTavilyApiKey } from '../lib/config-parser';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  score?: number;
}

// Tavily 클라이언트 초기화 (Lazy)
let tavilyClient: ReturnType<typeof tavily> | null = null;

function getTavilyClient() {
  if (!tavilyClient) {
    const apiKey = getTavilyApiKey();
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is not configured. Check AI_PROVIDERS_CONFIG or TAVILY_API_KEY env var.');
    }
    tavilyClient = tavily({ apiKey });
  }
  return tavilyClient;
}

export const searchWebTool = tool(
  async ({ query, limit = 5 }: { query: string; limit?: number }) => {
    console.log(`🌐 [Web Search Tool] Searching for: ${query}`);

    try {
      const client = getTavilyClient();

      const response = await client.search(query, {
        searchDepth: 'basic',
        maxResults: limit,
        includeAnswer: false,
        includeRawContent: false,
      });

      if (!response || !response.results || response.results.length === 0) {
        console.log('🌐 [Web Search Tool] No results found');
        return {
          success: true,
          results: [],
          message: 'No results found.',
        };
      }

      // Format results
      const results: SearchResult[] = response.results.map((r) => ({
        title: r.title,
        url: r.url,
        description: r.content || '',
        score: r.score,
      }));

      console.log(`🌐 [Web Search Tool] Found ${results.length} results`);

      return {
        success: true,
        results,
        _source: 'Tavily API',
      };
    } catch (error) {
      console.error('❌ [Web Search Tool] Error:', error);

      // 에러 타입별 처리
      const errorMessage = error instanceof Error ? error.message : 'Unknown search error';

      // Rate limit 또는 API 오류 시 graceful degradation
      if (errorMessage.includes('rate') || errorMessage.includes('quota')) {
        return {
          success: false,
          error: 'Web search rate limit exceeded. Please try again later.',
          results: [],
          fallbackSuggestion: 'LLM 내장 지식을 활용하세요.',
        };
      }

      return {
        success: false,
        error: errorMessage,
        results: [],
      };
    }
  },
  {
    name: 'searchWeb',
    description:
      '웹에서 외부 정보, 최신 매뉴얼, 기술 문서를 검색합니다. (Tavily API 사용)',
    schema: z.object({
      query: z.string().describe('검색어 (한글/영어 모두 가능)'),
      limit: z.number().optional().describe('결과 개수 (기본 5, 최대 10)'),
    }),
  }
);

// Export for testing
export { getTavilyClient };
