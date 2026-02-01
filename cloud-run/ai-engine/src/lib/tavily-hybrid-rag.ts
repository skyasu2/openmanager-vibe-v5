/**
 * Tavily Hybrid RAG Module
 *
 * Integrates Tavily web search into the RAG pipeline for enhanced
 * knowledge retrieval. Combines internal KB with real-time web results.
 *
 * Architecture:
 * 1. Internal KB search (Vector + BM25 + Graph)
 * 2. Tavily web search (when KB results insufficient)
 * 3. Result merging and deduplication
 * 4. LLM reranking (optional)
 *
 * @version 1.0.0
 * @created 2026-01-26
 */

import { getTavilyApiKey, getTavilyApiKeyBackup } from './config-parser';
import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export interface HybridRAGDocument {
  id: string;
  title: string;
  content: string;
  score: number;
  source: 'knowledge_base' | 'web';
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface HybridRAGOptions {
  /** Minimum KB results before triggering web search (default: 2) */
  minKBResults?: number;
  /** Minimum KB score before triggering web search (default: 0.6) */
  minKBScore?: number;
  /** Maximum web results to fetch (default: 3) */
  maxWebResults?: number;
  /** Web search depth (default: 'basic') */
  webSearchDepth?: 'basic' | 'advanced';
  /** Domains to include in web search */
  webIncludeDomains?: string[];
  /** Domains to exclude from web search */
  webExcludeDomains?: string[];
  /** Weight for KB results in final scoring (default: 0.7) */
  kbWeight?: number;
  /** Weight for web results in final scoring (default: 0.3) */
  webWeight?: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// ============================================================================
// Constants
// ============================================================================

const TAVILY_TIMEOUT_MS = 10000;
const TAVILY_MAX_RETRIES = 2;
const TAVILY_RETRY_DELAY_MS = 1000;
const DEFAULT_MIN_KB_RESULTS = 2;
const DEFAULT_MIN_KB_SCORE = 0.6;
const DEFAULT_MAX_WEB_RESULTS = 3;

// Server monitoring focused domains
const DEFAULT_INCLUDE_DOMAINS = [
  'docs.aws.com',
  'cloud.google.com',
  'learn.microsoft.com',
  'kubernetes.io',
  'docs.docker.com',
  'prometheus.io',
  'grafana.com',
  'nginx.org',
  'redis.io',
  'postgresql.org',
];

// ============================================================================
// Tavily Search
// ============================================================================

/**
 * Execute Tavily web search
 */
async function executeTavilySearch(
  query: string,
  options: {
    maxResults: number;
    searchDepth: 'basic' | 'advanced';
    includeDomains: string[];
    excludeDomains: string[];
  }
): Promise<WebSearchResult[]> {
  const primaryKey = getTavilyApiKey();
  const backupKey = getTavilyApiKeyBackup();
  const apiKey = primaryKey || backupKey;

  if (!apiKey) {
    logger.warn('[TavilyHybrid] No Tavily API key configured');
    return [];
  }

  const { tavily } = await import('@tavily/core');
  const client = tavily({ apiKey });

  for (let attempt = 0; attempt <= TAVILY_MAX_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Tavily timeout after ${TAVILY_TIMEOUT_MS}ms`)), TAVILY_TIMEOUT_MS);
      });

      const searchPromise = client.search(query, {
        maxResults: options.maxResults,
        searchDepth: options.searchDepth,
        includeDomains: options.includeDomains.length > 0 ? options.includeDomains : undefined,
        excludeDomains: options.excludeDomains.length > 0 ? options.excludeDomains : undefined,
      });

      const response = await Promise.race([searchPromise, timeoutPromise]);

      return response.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content.substring(0, 500),
        score: r.score,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (attempt < TAVILY_MAX_RETRIES) {
        console.log(`🔄 [TavilyHybrid] Retry ${attempt + 1}/${TAVILY_MAX_RETRIES} after error: ${errorMsg}`);
        await new Promise((resolve) => setTimeout(resolve, TAVILY_RETRY_DELAY_MS));
      } else {
        logger.warn(`[TavilyHybrid] Web search failed after ${TAVILY_MAX_RETRIES + 1} attempts: ${errorMsg}`);
        return [];
      }
    }
  }

  return [];
}

// ============================================================================
// Hybrid RAG Functions
// ============================================================================

/**
 * Determine if web search should be triggered
 *
 * @param kbResults - Results from internal KB search
 * @param options - Hybrid RAG options
 * @returns Whether to trigger web search
 */
export function shouldTriggerWebSearch(
  kbResults: Array<{ score: number }>,
  options: HybridRAGOptions = {}
): boolean {
  const {
    minKBResults = DEFAULT_MIN_KB_RESULTS,
    minKBScore = DEFAULT_MIN_KB_SCORE,
  } = options;

  // Too few KB results
  if (kbResults.length < minKBResults) {
    console.log(`[TavilyHybrid] Triggering web search: KB results (${kbResults.length}) < min (${minKBResults})`);
    return true;
  }

  // KB results have low scores
  const avgScore = kbResults.reduce((sum, r) => sum + r.score, 0) / kbResults.length;
  if (avgScore < minKBScore) {
    console.log(`[TavilyHybrid] Triggering web search: avg KB score (${avgScore.toFixed(2)}) < min (${minKBScore})`);
    return true;
  }

  return false;
}

/**
 * Enhance RAG results with Tavily web search
 *
 * @param query - User query
 * @param kbResults - Results from internal KB search
 * @param options - Hybrid RAG options
 * @returns Combined and scored results
 *
 * @example
 * ```typescript
 * const kbResults = await hybridGraphSearch(...);
 * const enhanced = await enhanceWithWebSearch(
 *   query,
 *   kbResults,
 *   { maxWebResults: 3, kbWeight: 0.7 }
 * );
 * ```
 */
export async function enhanceWithWebSearch(
  query: string,
  kbResults: HybridRAGDocument[],
  options: HybridRAGOptions = {}
): Promise<{
  results: HybridRAGDocument[];
  webSearchTriggered: boolean;
  webResultsCount: number;
}> {
  const {
    maxWebResults = DEFAULT_MAX_WEB_RESULTS,
    webSearchDepth = 'basic',
    webIncludeDomains = DEFAULT_INCLUDE_DOMAINS,
    webExcludeDomains = [],
    kbWeight = 0.7,
    webWeight = 0.3,
  } = options;

  // Check if web search is needed
  if (!shouldTriggerWebSearch(kbResults.map(r => ({ score: r.score })), options)) {
    return {
      results: kbResults,
      webSearchTriggered: false,
      webResultsCount: 0,
    };
  }

  // Execute web search
  const webResults = await executeTavilySearch(query, {
    maxResults: maxWebResults,
    searchDepth: webSearchDepth,
    includeDomains: webIncludeDomains,
    excludeDomains: webExcludeDomains,
  });

  if (webResults.length === 0) {
    return {
      results: kbResults,
      webSearchTriggered: true,
      webResultsCount: 0,
    };
  }

  // Convert web results to HybridRAGDocument format
  const webDocuments: HybridRAGDocument[] = webResults.map((r, idx) => ({
    id: `web-${idx}-${Date.now()}`,
    title: r.title,
    content: r.content,
    score: r.score * webWeight, // Apply weight
    source: 'web' as const,
    url: r.url,
  }));

  // Apply weight to KB results
  const weightedKBResults = kbResults.map((r) => ({
    ...r,
    score: r.score * kbWeight,
  }));

  // Merge and deduplicate (by title similarity)
  const merged = [...weightedKBResults];
  const existingTitles = new Set(kbResults.map((r) => r.title.toLowerCase()));

  for (const webDoc of webDocuments) {
    // Skip if similar title exists in KB
    const titleLower = webDoc.title.toLowerCase();
    const hasSimilar = [...existingTitles].some((t) =>
      t.includes(titleLower.slice(0, 20)) || titleLower.includes(t.slice(0, 20))
    );

    if (!hasSimilar) {
      merged.push(webDoc);
    }
  }

  // Sort by score
  merged.sort((a, b) => b.score - a.score);

  console.log(
    `[TavilyHybrid] Merged ${kbResults.length} KB + ${webResults.length} web → ${merged.length} results`
  );

  return {
    results: merged,
    webSearchTriggered: true,
    webResultsCount: webResults.length,
  };
}

/**
 * Check if Tavily is available
 */
export function isTavilyAvailable(): boolean {
  return getTavilyApiKey() !== null || getTavilyApiKeyBackup() !== null;
}

/**
 * Get optimized include domains for a query type
 */
export function getOptimizedDomains(queryType: 'devops' | 'database' | 'security' | 'general'): string[] {
  switch (queryType) {
    case 'devops':
      return ['kubernetes.io', 'docs.docker.com', 'prometheus.io', 'grafana.com', 'nginx.org'];
    case 'database':
      return ['postgresql.org', 'redis.io', 'docs.mongodb.com', 'dev.mysql.com'];
    case 'security':
      return ['owasp.org', 'cve.mitre.org', 'nvd.nist.gov', 'security.googleblog.com'];
    case 'general':
    default:
      return DEFAULT_INCLUDE_DOMAINS;
  }
}
