
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { search, SafeSearchType } from 'duck-duck-scrape';

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export const searchWebTool = tool(
  async ({ query, limit = 5 }: { query: string; limit?: number }) => {
    console.log(`🌐 [Web Search Tool] Searching for: ${query}`);

    try {
      const searchResults = await search(query, {
        safeSearch: SafeSearchType.MODERATE,
      });

      if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
        return {
           success: true,
           results: [],
           message: 'No results found.'
        }
      }

      // Format results
      const results: SearchResult[] = searchResults.results.slice(0, limit).map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description || ''
      }));

      return {
        success: true,
        results,
        _source: 'DuckDuckGo (MCP)'
      };

    } catch (error) {
      console.error('❌ [Web Search Tool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search error',
        results: []
      };
    }
  },
  {
    name: 'searchWeb',
    description: '웹(DuckDuckGo)에서 외부 정보, 최신 매뉴얼, 기술 문서를 검색합니다.',
    schema: z.object({
      query: z.string().describe('검색어'),
      limit: z.number().optional().describe('결과 개수 (기본 5)'),
    }),
  }
);
