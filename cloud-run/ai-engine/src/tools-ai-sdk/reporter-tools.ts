/**
 * Reporter Tools (AI SDK Format)
 *
 * Converted from LangChain reporter-agent tools to Vercel AI SDK format.
 * Includes RAG search with GraphRAG and command recommendations.
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

import { tool } from 'ai';
import { z } from 'zod';

// Data sources
import { getSupabaseConfig, getTavilyApiKey } from '../lib/config-parser';
import { searchWithEmbedding, embedText } from '../lib/embedding';
import { hybridGraphSearch } from '../lib/llamaindex-rag-service';

// ============================================================================
// 1. Types
// ============================================================================

interface SupabaseClientLike {
  rpc: (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>;
}

interface RAGResultItem {
  id: string;
  title: string;
  content: string;
  category: string;
  similarity: number;
  sourceType: 'vector' | 'graph' | 'fallback';
  hopDistance: number;
}

interface CommandRecommendation {
  command: string;
  description: string;
  keywords: string[];
}

// ============================================================================
// 2. Supabase Client Singleton
// ============================================================================

let supabaseInstance: SupabaseClientLike | null = null;

async function getSupabaseClient(): Promise<SupabaseClientLike | null> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const config = getSupabaseConfig();
  if (!config) {
    console.warn('⚠️ [Reporter Tools] Supabase config missing');
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(
      config.url,
      config.serviceRoleKey
    ) as unknown as SupabaseClientLike;
    return supabaseInstance;
  } catch (err) {
    console.error('⚠️ [Reporter Tools] Supabase client init failed:', err);
    return null;
  }
}

// ============================================================================
// 3. AI SDK Tools
// ============================================================================

/**
 * Search Knowledge Base Tool
 * Uses GraphRAG hybrid search (Vector + Graph traversal)
 */
export const searchKnowledgeBase = tool({
  description:
    '과거 장애 이력 및 해결 방법을 검색합니다 (GraphRAG: Vector + Graph)',
  inputSchema: z.object({
    query: z.string().describe('검색 쿼리'),
    category: z
      .enum(['troubleshooting', 'security', 'performance', 'incident', 'best_practice'])
      .optional()
      .describe('카테고리 필터'),
    severity: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional()
      .describe('심각도 필터'),
    useGraphRAG: z
      .boolean()
      .default(true)
      .describe('GraphRAG 하이브리드 검색 사용 여부'),
  }),
  execute: async ({
    query,
    category,
    severity,
    useGraphRAG = true,
  }: {
    query: string;
    category?: 'troubleshooting' | 'security' | 'performance' | 'incident' | 'best_practice';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    useGraphRAG?: boolean;
  }) => {
    console.log(
      `🔍 [Reporter Tools] GraphRAG search: ${query} (graph: ${useGraphRAG})`
    );

    const supabase = await getSupabaseClient();

    if (!supabase) {
      console.warn('⚠️ [Reporter Tools] Supabase unavailable, using fallback');
      return {
        success: true,
        results: [
          {
            id: 'fallback-1',
            title: '기본 문제 해결 가이드',
            content:
              '일반적인 문제 해결 절차: 1. 로그 확인 2. 리소스 사용량 체크 3. 서비스 재시작',
            category: 'troubleshooting',
            similarity: 0.8,
            sourceType: 'fallback' as const,
            hopDistance: 0,
          },
        ] as RAGResultItem[],
        totalFound: 1,
        _source: 'Fallback (No Supabase)',
      };
    }

    try {
      // 1. Generate query embedding
      const queryEmbedding = await embedText(query);

      // 2. Use hybrid GraphRAG search if enabled
      if (useGraphRAG) {
        const hybridResults = await hybridGraphSearch(queryEmbedding, {
          similarityThreshold: 0.3,
          maxVectorResults: 5,
          maxGraphHops: 2,
          maxTotalResults: 10,
        });

        if (hybridResults.length > 0) {
          const graphEnhanced: RAGResultItem[] = hybridResults.map((r) => ({
            id: r.id,
            title: r.title,
            content: r.content.substring(0, 500),
            category: category || 'auto',
            similarity: r.score,
            sourceType: r.sourceType as 'vector' | 'graph',
            hopDistance: r.hopDistance,
          }));

          const vectorCount = hybridResults.filter(
            (r) => r.sourceType === 'vector'
          ).length;
          const graphCount = hybridResults.filter(
            (r) => r.sourceType === 'graph'
          ).length;

          console.log(
            `📊 [Reporter Tools] GraphRAG: ${vectorCount} vector, ${graphCount} graph`
          );

          return {
            success: true,
            results: graphEnhanced,
            totalFound: graphEnhanced.length,
            _source: 'GraphRAG Hybrid (Vector + Graph)',
            graphStats: { vectorResults: vectorCount, graphResults: graphCount },
          };
        }
      }

      // 3. Fallback to traditional vector search
      const result = await searchWithEmbedding(supabase, query, {
        similarityThreshold: 0.3,
        maxResults: 5,
        category: category || undefined,
        severity: severity || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'RAG search failed');
      }

      return {
        success: true,
        results: result.results.map((r) => ({
          ...r,
          sourceType: 'vector' as const,
          hopDistance: 0,
        })),
        totalFound: result.results.length,
        _source: 'Supabase pgvector (Vector Only)',
      };
    } catch (error) {
      console.error('❌ [Reporter Tools] RAG search error:', error);

      return {
        success: true,
        results: [
          {
            id: 'error-fallback',
            title: '검색 오류 발생',
            content: `검색 중 오류가 발생했습니다. 오류: ${String(error)}`,
            category: 'error',
            similarity: 0,
            sourceType: 'fallback' as const,
            hopDistance: 0,
          },
        ] as RAGResultItem[],
        totalFound: 1,
        _source: 'Error Fallback',
      };
    }
  },
});

/**
 * Recommend Commands Tool
 * Matches keywords to CLI command recommendations
 */
export const recommendCommands = tool({
  description: '사용자 질문에 적합한 CLI 명령어를 추천합니다',
  inputSchema: z.object({
    keywords: z.array(z.string()).describe('질문에서 추출한 핵심 키워드'),
  }),
  execute: async ({ keywords }: { keywords: string[] }) => {
    const recommendations: CommandRecommendation[] = [
      {
        keywords: ['서버', '목록', '조회'],
        command: 'list servers',
        description: '서버 목록 조회',
      },
      {
        keywords: ['상태', '체크', '확인'],
        command: 'status check',
        description: '시스템 상태 점검',
      },
      {
        keywords: ['로그', '분석', '에러'],
        command: 'analyze logs',
        description: '로그 분석',
      },
      {
        keywords: ['재시작', 'restart', '복구'],
        command: 'service restart <service_name>',
        description: '서비스 재시작',
      },
      {
        keywords: ['메모리', '정리', 'cache'],
        command: 'clear cache',
        description: '캐시 정리',
      },
      {
        keywords: ['cpu', '프로세서', '부하'],
        command: 'top -o cpu',
        description: 'CPU 사용량 상위 프로세스 조회',
      },
      {
        keywords: ['디스크', '용량', 'disk'],
        command: 'df -h',
        description: '디스크 사용량 조회',
      },
      {
        keywords: ['네트워크', 'network', '연결'],
        command: 'netstat -an',
        description: '네트워크 연결 상태 조회',
      },
    ];

    const matched = recommendations.filter((rec) =>
      keywords.some((k) =>
        rec.keywords.some(
          (rk) =>
            rk.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(rk.toLowerCase())
        )
      )
    );

    const result =
      matched.length > 0 ? matched : recommendations.slice(0, 3);

    return {
      success: true,
      recommendations: result.map((r) => ({
        command: r.command,
        description: r.description,
      })),
      matchedKeywords: keywords,
      _mode: 'command-recommendation',
    };
  },
});

// ============================================================================
// 4. Helper: Extract Keywords from Query
// ============================================================================

/**
 * Extract keywords from user query for command matching
 */
export function extractKeywordsFromQuery(query: string): string[] {
  const keywords: string[] = [];
  const q = query.toLowerCase();

  const patterns = [
    { regex: /서버|server/gi, keyword: '서버' },
    { regex: /상태|status/gi, keyword: '상태' },
    { regex: /에러|error|오류/gi, keyword: '에러' },
    { regex: /로그|log/gi, keyword: '로그' },
    { regex: /메모리|memory/gi, keyword: '메모리' },
    { regex: /cpu|프로세서/gi, keyword: 'cpu' },
    { regex: /디스크|disk/gi, keyword: '디스크' },
    { regex: /재시작|restart/gi, keyword: '재시작' },
    { regex: /장애|failure|incident/gi, keyword: '장애' },
    { regex: /네트워크|network/gi, keyword: '네트워크' },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(q)) {
      keywords.push(pattern.keyword);
    }
  }

  return keywords.length > 0 ? keywords : ['일반', '조회'];
}

// ============================================================================
// 5. Web Search Tool (Tavily)
// ============================================================================

interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

/**
 * Web Search Tool
 * Uses Tavily API for real-time web search
 */
export const searchWeb = tool({
  description:
    '실시간 웹 검색을 수행합니다. 최신 기술 정보, 문서, 보안 이슈 등을 검색할 때 사용합니다.',
  inputSchema: z.object({
    query: z.string().describe('검색 쿼리'),
    maxResults: z
      .number()
      .default(5)
      .describe('반환할 결과 수 (기본: 5)'),
    searchDepth: z
      .enum(['basic', 'advanced'])
      .default('basic')
      .describe('검색 깊이 (basic: 빠른 검색, advanced: 심층 검색)'),
    includeDomains: z
      .array(z.string())
      .optional()
      .describe('특정 도메인만 검색 (예: ["docs.aws.com"])'),
    excludeDomains: z
      .array(z.string())
      .optional()
      .describe('제외할 도메인 (예: ["reddit.com"])'),
  }),
  execute: async ({
    query,
    maxResults = 5,
    searchDepth = 'basic',
    includeDomains,
    excludeDomains,
  }: {
    query: string;
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeDomains?: string[];
    excludeDomains?: string[];
  }) => {
    console.log(`🌐 [Reporter Tools] Web search: ${query}`);

    const tavilyApiKey = getTavilyApiKey();

    if (!tavilyApiKey) {
      console.warn('⚠️ [Reporter Tools] Tavily API key not configured');
      return {
        success: false,
        error: 'Tavily API key not configured',
        results: [],
        _source: 'Tavily (Unconfigured)',
      };
    }

    try {
      const { tavily } = await import('@tavily/core');
      const client = tavily({ apiKey: tavilyApiKey });

      const response = await client.search(query, {
        maxResults,
        searchDepth,
        includeDomains: includeDomains || [],
        excludeDomains: excludeDomains || [],
      });

      const results: WebSearchResult[] = response.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content.substring(0, 500),
        score: r.score,
      }));

      console.log(`📊 [Reporter Tools] Web search: ${results.length} results`);

      return {
        success: true,
        query,
        results,
        totalFound: results.length,
        _source: 'Tavily Web Search',
        answer: response.answer || null,
      };
    } catch (error) {
      console.error('❌ [Reporter Tools] Web search error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        results: [],
        _source: 'Tavily (Error)',
      };
    }
  },
});
