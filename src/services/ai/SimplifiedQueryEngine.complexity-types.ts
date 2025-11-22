/**
 * 🎯 Query Complexity Types
 *
 * Minimal type definitions extracted from removed query-complexity-analyzer.
 * Used by SimplifiedQueryEngine for query complexity analysis.
 */

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MEDIUM = 'medium',
  COMPLEX = 'complex',
}

export interface ComplexityScore {
  score: number;
  level?: ComplexityLevel;
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
