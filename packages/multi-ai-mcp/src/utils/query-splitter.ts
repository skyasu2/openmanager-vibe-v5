/**
 * Query Splitter
 *
 * Splits long queries into smaller sub-queries to prevent timeouts
 * while preserving original information (no information loss)
 *
 * v1.4.0 - Query splitting for timeout prevention
 */

import type { QueryAnalysis } from './query-analyzer.js';

/**
 * Split result
 */
export interface SplitResult {
  /** Original query */
  original: string;
  /** Sub-queries (if split) */
  subQueries: string[];
  /** Was splitting applied? */
  wasSplit: boolean;
  /** Split strategy used */
  strategy: string;
}

/**
 * Split long query into smaller sub-queries
 *
 * Strategy:
 * 1. Detect natural split points (numbered lists, questions, sections)
 * 2. Split at sentence boundaries
 * 3. Maximum 3 sub-queries
 * 4. Each sub-query: 100-300 chars
 */
export function splitQuery(query: string): SplitResult {
  const original = query;

  // Short queries don't need splitting
  if (query.length < 300) {
    return {
      original,
      subQueries: [query],
      wasSplit: false,
      strategy: 'No split needed (< 300 chars)',
    };
  }

  // Strategy 1: Split by numbered lists (1. 2. 3.)
  const numberedListMatch = query.match(/\d+\.\s+/g);
  if (numberedListMatch && numberedListMatch.length >= 2) {
    const subQueries = query.split(/(?=\d+\.\s+)/).filter(q => q.trim().length > 0);
    if (subQueries.length >= 2 && subQueries.length <= 5) {
      return {
        original,
        subQueries: subQueries.map(q => q.trim()).slice(0, 3), // Max 3
        wasSplit: true,
        strategy: 'Numbered list split',
      };
    }
  }

  // Strategy 2: Split by questions (?)
  const questions = query.split(/\?\s+/).filter(q => q.trim().length > 0);
  if (questions.length >= 2 && questions.length <= 5) {
    const subQueries = questions.map((q, i) =>
      i < questions.length - 1 ? q + '?' : q
    ).filter(q => q.length > 20);

    if (subQueries.length >= 2) {
      return {
        original,
        subQueries: subQueries.slice(0, 3), // Max 3
        wasSplit: true,
        strategy: 'Question split',
      };
    }
  }

  // Strategy 3: Split by sentences (. ! )
  const sentences = query.split(/(?<=[.!])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 3) {
    const subQueries: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if (current.length + sentence.length > 250 && current.length > 0) {
        subQueries.push(current.trim());
        current = sentence;
      } else {
        current += (current ? ' ' : '') + sentence;
      }
    }

    if (current) {
      subQueries.push(current.trim());
    }

    if (subQueries.length >= 2) {
      return {
        original,
        subQueries: subQueries.slice(0, 3), // Max 3
        wasSplit: true,
        strategy: 'Sentence split',
      };
    }
  }

  // Fallback: Split by character count (250 chars each)
  if (query.length > 500) {
    const subQueries: string[] = [];
    let start = 0;

    while (start < query.length) {
      let end = Math.min(start + 250, query.length);

      // Find nearest space to avoid cutting words
      if (end < query.length) {
        const spaceIndex = query.lastIndexOf(' ', end);
        if (spaceIndex > start + 100) {
          end = spaceIndex;
        }
      }

      subQueries.push(query.substring(start, end).trim());
      start = end;

      if (subQueries.length >= 3) break; // Max 3
    }

    return {
      original,
      subQueries,
      wasSplit: true,
      strategy: 'Character count split',
    };
  }

  // No split needed
  return {
    original,
    subQueries: [query],
    wasSplit: false,
    strategy: 'No split needed',
  };
}

/**
 * Auto-split if analysis recommends it
 */
export function autoSplit(query: string, analysis: QueryAnalysis): {
  subQueries: string[];
  wasSplit: boolean;
  strategy?: string;
} {
  // Only split if COMPLEX and long (> 300 chars)
  if (analysis.complexity !== 'complex' || analysis.length < 300) {
    return { subQueries: [query], wasSplit: false };
  }

  const result = splitQuery(query);

  return {
    subQueries: result.subQueries,
    wasSplit: result.wasSplit,
    strategy: result.strategy,
  };
}

/**
 * Get human-readable split summary
 */
export function getSplitSummary(result: SplitResult): string {
  if (!result.wasSplit) {
    return '✅ No split needed';
  }

  const lines = [
    `📝 Query Split:`,
    `  - Original: ${result.original.length} chars`,
    `  - Sub-queries: ${result.subQueries.length}`,
    `  - Strategy: ${result.strategy}`,
    ``,
    `📄 Sub-queries:`,
    ...result.subQueries.map((sq, i) => `  ${i + 1}. ${sq.substring(0, 50)}... (${sq.length} chars)`),
  ];

  return lines.join('\n');
}
