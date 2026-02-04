/**
 * Reporter Tools - Web Search (Tavily)
 *
 * Real-time web search using Tavily API with failover support,
 * caching, retry logic, and quota management.
 * Extracted from reporter-tools.ts for modularity.
 *
 * @version 1.0.0
 * @updated 2026-01-04
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getTavilyApiKey, getTavilyApiKeyBackup } from '../../lib/config-parser';
import { logger } from '../../lib/logger';
import { TIMEOUT_CONFIG } from '../../config/timeout-config';
import { recordProviderUsage, getQuotaStatus } from '../../services/resilience/quota-tracker';

// ============================================================================
// Types
// ============================================================================

interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// ============================================================================
// Tavily Best Practices Constants
// ============================================================================
const TAVILY_TIMEOUT_MS = TIMEOUT_CONFIG.external.tavily; // 15초 (timeout-config.ts SSOT)
const TAVILY_MAX_RETRIES = 2; // 최대 재시도 횟수 (베스트 프랙티스: 2회)
const TAVILY_RETRY_DELAY_MS = 1000; // 재시도 간 대기 시간
/**
 * Web Search Cache Configuration
 * Cloud Run Free Tier: 256MB RAM 제한 고려
 */
const SEARCH_CACHE_CONFIG = {
  maxSize: 30,              // 무료 티어 메모리 제한 고려 (100 -> 30)
  evictCount: 10,           // 한 번에 10개 삭제 (LRU)
  ttlMs: 10 * 60 * 1000,    // 10분 TTL (5분 -> 10분으로 증가, 캐시 효율)
} as const;

// ============================================================================
// Cache Implementation
// ============================================================================

/**
 * Simple in-memory cache for web search results
 * @see Best Practice: "Cache results strategically to reduce costs"
 */
interface CacheEntry {
  results: WebSearchResult[];
  answer: string | null;
  timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();

/**
 * Get cached result if valid
 * LRU 방식: 조회 시 TTL 만료 항목 정리
 */
function buildCacheKey(query: string, searchDepth?: string, includeDomains?: string[]): string {
  const parts = [query.toLowerCase().trim()];
  if (searchDepth && searchDepth !== 'basic') parts.push(`depth:${searchDepth}`);
  if (includeDomains && includeDomains.length > 0) parts.push(`domains:${includeDomains.sort().join(',')}`);
  return parts.join('|');
}

function getCachedResult(query: string, searchDepth?: string, includeDomains?: string[]): { results: WebSearchResult[]; answer: string | null } | null {
  const key = buildCacheKey(query, searchDepth, includeDomains);
  const cached = searchCache.get(key);
  const now = Date.now();

  if (!cached) return null;

  // TTL 만료 체크
  if (now - cached.timestamp > SEARCH_CACHE_CONFIG.ttlMs) {
    searchCache.delete(key);
    return null;
  }

  console.log(`📦 [Tavily] Cache hit for: "${query.substring(0, 30)}..." (size: ${searchCache.size})`);
  return { results: cached.results, answer: cached.answer };
}

/**
 * Store result in cache with LRU eviction
 * Cloud Run Free Tier 메모리 제한 대응
 */
function setCacheResult(query: string, results: WebSearchResult[], answer: string | null, searchDepth?: string, includeDomains?: string[]): void {
  const now = Date.now();

  // 1. TTL 만료 항목 먼저 정리
  for (const [key, entry] of searchCache) {
    if (now - entry.timestamp > SEARCH_CACHE_CONFIG.ttlMs) {
      searchCache.delete(key);
    }
  }

  // 2. 크기 제한 (LRU 방식 - 오래된 항목부터 삭제)
  if (searchCache.size >= SEARCH_CACHE_CONFIG.maxSize) {
    const keysToDelete = [...searchCache.keys()].slice(0, SEARCH_CACHE_CONFIG.evictCount);
    keysToDelete.forEach(k => searchCache.delete(k));
    console.log(`🗑️ [Tavily] Cache evicted ${keysToDelete.length} entries (LRU)`);
  }

  searchCache.set(buildCacheKey(query, searchDepth, includeDomains), { results, answer, timestamp: now });
}

// ============================================================================
// Helper Utilities
// ============================================================================

/**
 * Promise with timeout wrapper
 * @see Best Practice: "Implement Timeouts: Don't let your agent wait indefinitely"
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Sleep utility for retry delay
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// Tavily Search Execution
// ============================================================================

/**
 * Execute Tavily search with a specific API key
 * @see Best Practice: "Use Retry Limits: maximum of two attempts"
 */
async function executeTavilySearch(
  apiKey: string,
  query: string,
  options: {
    maxResults: number;
    searchDepth: 'basic' | 'advanced';
    includeDomains: string[];
    excludeDomains: string[];
  },
  retryCount = 0
): Promise<{ results: WebSearchResult[]; answer: string | null }> {
  try {
    const { tavily } = await import('@tavily/core');
    const client = tavily({ apiKey });

    // Timeout wrapper (Best Practice)
    const response = await withTimeout(
      client.search(query, {
        maxResults: options.maxResults,
        searchDepth: options.searchDepth,
        includeDomains: options.includeDomains,
        excludeDomains: options.excludeDomains,
      }),
      TAVILY_TIMEOUT_MS,
      `Tavily search timeout after ${TAVILY_TIMEOUT_MS}ms`
    );

    const results: WebSearchResult[] = response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content.substring(0, 1500),
      score: r.score,
    }));

    return { results, answer: response.answer || null };
  } catch (error) {
    // Retry logic (Best Practice: max 2 retries)
    if (retryCount < TAVILY_MAX_RETRIES) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Only retry on timeout or transient errors, not rate limits
      if (errorMsg.includes('timeout') || errorMsg.includes('ECONNRESET')) {
        console.log(`🔄 [Tavily] Retry ${retryCount + 1}/${TAVILY_MAX_RETRIES} after error: ${errorMsg}`);
        await sleep(TAVILY_RETRY_DELAY_MS);
        return executeTavilySearch(apiKey, query, options, retryCount + 1);
      }
    }
    throw error;
  }
}

// ============================================================================
// Web Search Tool
// ============================================================================

/**
 * Web Search Tool
 * Uses Tavily API for real-time web search
 * Supports failover to backup API key when primary fails
 * @updated 2026-01-04 - Added failover support
 */
export const searchWeb = tool({
  description:
    '실시간 웹 검색을 수행합니다. 최신 기술 정보, 문서, 보안 이슈, 에러 해결 방법 등을 검색할 때 사용합니다. 서버 모니터링과 관련 없는 일반 질문에도 활용 가능합니다.',
  inputSchema: z.object({
    query: z.string().describe('검색 쿼리'),
    maxResults: z
      .number()
      .default(3)
      .describe('반환할 결과 수 (기본: 3, 최대: 5)'),
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
    maxResults = 3,
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

    // Tavily 월간 quota 확인 (Free Tier: 1,000 req/month ~ 33/day)
    try {
      const quotaStatus = await getQuotaStatus('tavily');
      if (quotaStatus.shouldPreemptiveFallback) {
        logger.warn(`⚠️ [Tavily] Daily quota approaching limit (${quotaStatus.usage.minuteRequests} requests today). Skipping web search.`);
        return {
          success: false,
          error: 'Tavily daily quota approaching limit',
          results: [],
          _source: 'Tavily (Quota Exceeded)',
        };
      }
    } catch {
      // quota 확인 실패 시 검색은 계속 진행
    }

    // Best Practice: Check cache first to reduce API calls
    const cached = getCachedResult(query, searchDepth, includeDomains);
    if (cached) {
      return {
        success: true,
        query,
        results: cached.results,
        totalFound: cached.results.length,
        _source: 'Tavily Web Search (Cached)',
        answer: cached.answer,
      };
    }

    const primaryKey = getTavilyApiKey();
    const backupKey = getTavilyApiKeyBackup();

    if (!primaryKey && !backupKey) {
      logger.warn('⚠️ [Reporter Tools] No Tavily API keys configured');
      return {
        success: false,
        error: 'Tavily API key not configured',
        results: [],
        _source: 'Tavily (Unconfigured)',
      };
    }

    const searchOptions = {
      maxResults,
      searchDepth,
      includeDomains: includeDomains || [],
      excludeDomains: excludeDomains || [],
    };

    // Try primary key first
    if (primaryKey) {
      try {
        const { results, answer } = await executeTavilySearch(primaryKey, query, searchOptions);
        console.log(`📊 [Reporter Tools] Web search (primary): ${results.length} results`);

        // Cache successful results (Best Practice)
        setCacheResult(query, results, answer, searchDepth, includeDomains);

        // Tavily quota 기록 (1 request = 1 token 단위로 추적)
        recordProviderUsage('tavily', 1).catch(() => {});

        return {
          success: true,
          query,
          results,
          totalFound: results.length,
          _source: 'Tavily Web Search',
          answer,
        };
      } catch (primaryError) {
        const errorMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
        logger.warn(`⚠️ [Reporter Tools] Primary key failed: ${errorMsg}`);

        // Failover to backup key
        if (backupKey) {
          console.log('🔄 [Reporter Tools] Attempting failover to backup key...');
          try {
            const { results, answer } = await executeTavilySearch(backupKey, query, searchOptions);
            console.log(`📊 [Reporter Tools] Web search (backup): ${results.length} results`);

            // Cache successful results (Best Practice)
            setCacheResult(query, results, answer, searchDepth, includeDomains);

            // Tavily quota 기록
            recordProviderUsage('tavily', 1).catch(() => {});

            return {
              success: true,
              query,
              results,
              totalFound: results.length,
              _source: 'Tavily Web Search (Failover)',
              answer,
            };
          } catch (backupError) {
            logger.error('❌ [Reporter Tools] Backup key also failed:', backupError);
            return {
              success: false,
              error: `Primary: ${errorMsg}, Backup: ${backupError instanceof Error ? backupError.message : String(backupError)}`,
              results: [],
              _source: 'Tavily (All Keys Failed)',
            };
          }
        }

        // No backup key available
        return {
          success: false,
          error: errorMsg,
          results: [],
          _source: 'Tavily (Primary Failed, No Backup)',
        };
      }
    }

    // Only backup key available
    try {
      const { results, answer } = await executeTavilySearch(backupKey!, query, searchOptions);
      console.log(`📊 [Reporter Tools] Web search (backup only): ${results.length} results`);

      // Cache successful results (Best Practice)
      setCacheResult(query, results, answer, searchDepth, includeDomains);

      // Tavily quota 기록
      recordProviderUsage('tavily', 1).catch(() => {});

      return {
        success: true,
        query,
        results,
        totalFound: results.length,
        _source: 'Tavily Web Search (Backup)',
        answer,
      };
    } catch (error) {
      logger.error('❌ [Reporter Tools] Backup key error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        results: [],
        _source: 'Tavily (Error)',
      };
    }
  },
});
