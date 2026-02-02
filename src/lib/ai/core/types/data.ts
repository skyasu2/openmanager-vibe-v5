/**
 * Provider Data Types
 *
 * RAG, ML, Rule Provider 데이터 타입
 */

/**
 * RAG Provider 데이터
 */
export interface RAGData {
  /** 검색된 문서 */
  documents: RAGDocument[];

  /** 총 결과 수 */
  totalResults: number;

  /** 평균 유사도 */
  avgSimilarity?: number;

  /** 쿼리 벡터 임베딩 (Supabase RAG Engine 제공) */
  queryEmbedding?: number[];
}

/**
 * RAG 문서
 */
export interface RAGDocument {
  /** 문서 ID */
  id: string;

  /** 문서 내용 */
  content: string;

  /** 문서 출처 (파일명, URL 등) */
  source: string;

  /** 유사도 점수 (0.0 ~ 1.0) */
  similarity: number;

  /** 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * ML Provider 데이터 (Cloud Run ML Analytics)
 */
export interface MLData {
  /** 이상 탐지 결과 */
  anomalies: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    metric: string;
    value: number;
    timestamp: string;
  }>;

  /** 트렌드 분석 결과 */
  trends: Array<{
    direction: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    prediction: number;
    timeframe: string;
  }>;

  /** 패턴 인식 결과 */
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;

  /** 개선 권장사항 */
  recommendations: string[];
}

/**
 * Rule Provider 데이터 (Cloud Run Korean NLP)
 */
export interface RuleData {
  /** 추출된 키워드 (명사, 동사, 형용사) */
  keywords: string[];

  /** 인식된 엔티티 (서버명, 메트릭, 커맨드 등) */
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;

  /** 의도 분류 결과 */
  intent: {
    category: string;
    confidence: number;
    params?: Record<string, string>;
  };

  /** 도메인 특화 용어 (서버 모니터링) */
  domainTerms: string[];

  /** 정규화된 쿼리 */
  normalizedQuery: string;
}
