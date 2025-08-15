/**
 * 🏛️ 핵심 타입 정의 - 중앙 집중식 타입 관리
 * 
 * Type-First 개발 철학에 따른 타입 시스템 정리:
 * - 중복 타입 정의 제거
 * - 일관된 네이밍 컨벤션
 * - 업계 표준 패턴 적용
 */

// ==============================================
// 🤖 AI 관련 핵심 타입
// ==============================================

/**
 * AI 엔진 타입 - 통합 정의 (Single Source of Truth)
 */
export type AIEngineType = 
  | 'google-ai'
  | 'local-ai' 
  | 'local-rag' 
  | 'fallback'
  | 'ultra-fast'
  | 'pattern-based'
  | 'keyword-based'
  | 'error-fallback'
  | 'preloaded'
  | 'simplified'
  | 'performance-optimized'
  | 'supabase-rag'
  | 'korean-nlp'
  | 'mcp-client'
  | 'gcp-mcp'
  | 'transformers'
  | 'mcp-context'
  | `quick-${string}`;

/**
 * 복잡도 점수 - 통합 정의
 * Performance.ts의 정의를 기준으로 통합
 */
export interface ComplexityScore {
  overall: number;
  queryLength: number;
  conceptCount: number;
  technicalDepth: number;
  contextDependency: number;
  // Record<string, unknown> 호환성을 위한 인덱스 시그니처
  [key: string]: number;
}

/**
 * AI 메타데이터 - 핵심 정보만 포함
 */
export interface AIMetadata {
  timestamp?: string | Date;
  source?: string;
  version?: string;
  tags?: string[];
  importance?: number;
  category?: string;
  // ComplexityScore 호환을 위한 확장된 인덱스 시그니처
  [key: string]: string | number | boolean | Date | string[] | Record<string, unknown> | undefined;
}

/**
 * 차트 데이터 포인트
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * 타입 가드 함수들
 */
export const TypeGuards = {
  isComplexityScore: (obj: unknown): obj is ComplexityScore => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'overall' in obj &&
      typeof (obj as ComplexityScore).overall === 'number'
    );
  },

  isAIEngineType: (type: string): type is AIEngineType => {
    const validTypes: AIEngineType[] = [
      'google-ai', 'local-ai', 'local-rag', 'fallback',
      'ultra-fast', 'pattern-based', 'keyword-based',
      'error-fallback', 'preloaded', 'simplified',
      'performance-optimized', 'supabase-rag', 'korean-nlp',
      'mcp-client', 'gcp-mcp', 'transformers', 'mcp-context'
    ];
    
    return validTypes.includes(type as AIEngineType) || 
           /^quick-.+$/.test(type);
  }
};
