/**
 * Query Complexity Analyzer
 *
 * Analyzes query complexity to determine:
 * - Appropriate timeout settings
 * - Whether simplification is needed
 * - Optimal execution strategy
 *
 * v1.3.0 - Intelligent query analysis
 */

import { config } from '../config.js';

/**
 * Query complexity levels
 */
export enum QueryComplexity {
  /** Simple queries: < 50 chars, no code blocks */
  SIMPLE = 'simple',
  /** Medium queries: 50-200 chars, or simple code blocks */
  MEDIUM = 'medium',
  /** Complex queries: > 200 chars, or multiple code blocks */
  COMPLEX = 'complex',
}

/**
 * Query analysis result
 */
export interface QueryAnalysis {
  /** Overall complexity level */
  complexity: QueryComplexity;
  /** Query length in characters */
  length: number;
  /** Number of newlines */
  lineCount: number;
  /** Has code blocks (```) */
  hasCodeBlocks: boolean;
  /** Number of code blocks */
  codeBlockCount: number;
  /** Has dangerous characters (blocked by security) */
  hasDangerousChars: boolean;
  /** Estimated token count (rough approximation) */
  estimatedTokens: number;
  /** Suggested timeouts by AI provider */
  suggestedTimeouts: {
    codex: number;
    gemini: number;
    qwen: number;
  };
  /** Whether simplification is recommended */
  needsSimplification: boolean;
  /** Reason for simplification recommendation */
  simplificationReason?: string;
}

/**
 * Analyze query complexity
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const length = query.length;
  const lineCount = (query.match(/\n/g) || []).length + 1;

  // Detect code blocks
  const codeBlockMatches = query.match(/```/g) || [];
  const codeBlockCount = Math.floor(codeBlockMatches.length / 2);
  const hasCodeBlocks = codeBlockCount > 0;

  // Detect dangerous characters (security filter will block these)
  // ✅ Backticks (`) are now ALLOWED for code blocks
  const hasDangerousChars = /[$\\]/.test(query);

  // Estimate token count (rough: 1 token ≈ 4 chars for Korean, 1 token ≈ 4 chars for code)
  const estimatedTokens = Math.ceil(length / 4);

  // Determine complexity
  let complexity: QueryComplexity;
  let needsSimplification = false;
  let simplificationReason: string | undefined;

  if (length > 200 || codeBlockCount > 1) {
    complexity = QueryComplexity.COMPLEX;

    // Complex queries may need simplification
    if (hasDangerousChars) {
      needsSimplification = true;
      simplificationReason = 'Query contains dangerous characters ($, \) that will trigger security filter';
    } else if (length > 500) {
      needsSimplification = true;
      simplificationReason = 'Query is very long (>500 chars) and may cause timeout';
    } else if (codeBlockCount > 2) {
      needsSimplification = true;
      simplificationReason = 'Query has multiple code blocks (>2) that may cause timeout';
    }
  } else if (length > 50 || codeBlockCount === 1) {
    complexity = QueryComplexity.MEDIUM;

    // Medium queries with dangerous chars need simplification
    if (hasDangerousChars) {
      needsSimplification = true;
      simplificationReason = 'Query contains dangerous characters ($, \) that will trigger security filter';
    }
  } else {
    complexity = QueryComplexity.SIMPLE;
  }

  // Suggest timeouts based on complexity
  const suggestedTimeouts = {
    codex:
      complexity === QueryComplexity.SIMPLE
        ? config.codex.simple
        : complexity === QueryComplexity.MEDIUM
        ? config.codex.medium
        : config.codex.complex,
    gemini: config.gemini.timeout, // Gemini uses fixed timeout
    qwen:
      complexity === QueryComplexity.SIMPLE
        ? config.qwen.normal
        : config.qwen.plan, // Use plan mode for complex queries
  };

  return {
    complexity,
    length,
    lineCount,
    hasCodeBlocks,
    codeBlockCount,
    hasDangerousChars,
    estimatedTokens,
    suggestedTimeouts,
    needsSimplification,
    simplificationReason,
  };
}

/**
 * Get human-readable analysis summary
 */
export function getAnalysisSummary(analysis: QueryAnalysis): string {
  const lines = [
    `📊 Query Analysis:`,
    `  - Complexity: ${analysis.complexity.toUpperCase()}`,
    `  - Length: ${analysis.length} chars (${analysis.lineCount} lines)`,
    `  - Estimated tokens: ${analysis.estimatedTokens}`,
    `  - Code blocks: ${analysis.codeBlockCount}`,
    `  - Dangerous chars: ${analysis.hasDangerousChars ? 'YES ⚠️' : 'NO ✅'}`,
    ``,
    `⏱️ Suggested Timeouts:`,
    `  - Codex: ${analysis.suggestedTimeouts.codex / 1000}s`,
    `  - Gemini: ${analysis.suggestedTimeouts.gemini / 1000}s`,
    `  - Qwen: ${analysis.suggestedTimeouts.qwen / 1000}s`,
  ];

  if (analysis.needsSimplification) {
    lines.push(``, `⚡ Simplification: RECOMMENDED`);
    if (analysis.simplificationReason) {
      lines.push(`  - Reason: ${analysis.simplificationReason}`);
    }
  }

  return lines.join('\n');
}

/**
 * Determine if query should use Qwen plan mode
 */
export function shouldUseQwenPlanMode(analysis: QueryAnalysis): boolean {
  return analysis.complexity !== QueryComplexity.SIMPLE;
}
