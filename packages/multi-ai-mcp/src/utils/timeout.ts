/**
 * Adaptive Timeout Management
 *
 * Based on codex-wrapper.sh logic
 * P95 response time + 1.67x safety coefficient
 */

import type { QueryComplexity, TimeoutConfig } from '../types.js';

/**
 * Detect query complexity for adaptive timeout selection
 * 
 * Improved algorithm with keyword-based hints for better accuracy.
 * 
 * Classification criteria:
 * - Simple (< 100 chars): Quick questions, status checks
 * - Medium (100-300 chars): Standard analysis, code review
 * - Complex (> 300 chars): Detailed analysis, multi-file operations
 * 
 * Keyword hints override length-based classification:
 * - Complex keywords: "분석", "아키텍처", "최적화", "analyze", "architecture"
 * - Simple keywords: "상태", "확인", "status", "check"
 * 
 * @param query - The query string to analyze
 * @param planMode - Whether Plan Mode is enabled (Qwen-specific, bumps up complexity)
 * @returns QueryComplexity level
 * 
 * @example
 * ```typescript
 * detectQueryComplexity("서버 상태 확인") // 'simple'
 * detectQueryComplexity("성능 최적화 분석") // 'complex' (keyword override)
 * detectQueryComplexity("간단한 질문", true) // 'medium' (Plan Mode bump)
 * ```
 */

export function detectQueryComplexity(query: string, planMode: boolean = false): QueryComplexity {
  // Step 1: Length-based classification
  const length = query.length;
  
  // Step 2: Keyword-based hints for better accuracy
  const complexKeywords = [
    '분석', '검토', '아키텍처', '최적화', '리팩토링', '교차검증',
    'analyze', 'architecture', 'optimize', 'refactor', 'cross-verification'
  ];
  const simpleKeywords = [
    '상태', '확인', '간단', '빠른',
    'status', 'check', 'simple', 'quick'
  ];
  
  const hasComplexKeyword = complexKeywords.some(keyword => 
    query.toLowerCase().includes(keyword.toLowerCase())
  );
  const hasSimpleKeyword = simpleKeywords.some(keyword => 
    query.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Step 3: Determine complexity
  let complexity: QueryComplexity;
  
  if (length < 100 && hasSimpleKeyword) {
    complexity = 'simple';
  } else if (length > 300 || hasComplexKeyword) {
    complexity = 'complex';
  } else if (length < 100) {
    complexity = 'simple';
  } else if (length >= 100 && length <= 300) {
    complexity = 'medium';
  } else {
    // Fallback for edge cases
    complexity = 'medium';
  }
  
  // Step 4: Plan Mode adjustment (Qwen-specific)
  // Plan Mode requires more time for safe planning, bump up one level
  if (planMode && complexity === 'simple') {
    complexity = 'medium';
  } else if (planMode && complexity === 'medium') {
    complexity = 'complex';
  }
  
  return complexity;
}

export function getAdaptiveTimeout(
  complexity: QueryComplexity,
  config: TimeoutConfig
): number {
  return config[complexity];
}

export function calculateRetryTimeout(
  originalTimeout: number,
  attempt: number
): number {
  // 50% increase per retry
  return Math.floor(originalTimeout * (1 + 0.5 * attempt));
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    // ✅ Always clear timeout to prevent memory leak
    clearTimeout(timeoutId);
  });
}
