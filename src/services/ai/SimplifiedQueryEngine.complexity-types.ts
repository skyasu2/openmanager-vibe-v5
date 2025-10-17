/**
 * 🎯 Query Complexity Types
 *
 * Minimal type definitions extracted from removed query-complexity-analyzer.
 * Used by SimplifiedQueryEngine for query complexity analysis.
 */

export interface ComplexityScore {
  score: number;
  factors: {
    length: number;
    keywords: number;
    patterns: number;
    context: number;
    language: number;
  };
  recommendation: 'local' | 'google-ai' | 'hybrid';
  confidence: number;
}
