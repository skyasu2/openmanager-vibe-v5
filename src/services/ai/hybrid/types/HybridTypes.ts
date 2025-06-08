/**
 * 🚀 Hybrid AI Engine 타입 정의
 * 
 * Single Responsibility: 모든 Hybrid AI 관련 인터페이스와 타입을 통합 관리
 */

export interface DocumentContext {
  path: string;
  content: string;
  keywords: string[];
  lastModified: number;
  relevanceScore: number;
  contextLinks: string[];
  embedding?: number[]; // 벡터 DB용
}

export interface HybridAnalysisResult {
  success: boolean;
  answer: string;
  confidence: number;
  sources: DocumentContext[];
  reasoning: string[];
  tensorflowPredictions?: any;
  koreanNLU?: any;
  transformersAnalysis?: any;
  vectorSearchResults?: any;
  mcpActions: string[];
  processingTime: number;
  engineUsed: 'korean' | 'tensorflow' | 'transformers' | 'vector' | 'hybrid';
  performanceMetrics: {
    initTime: number;
    searchTime: number;
    analysisTime: number;
    responseTime: number;
  };
}

export interface SmartQuery {
  originalQuery: string;
  intent: QueryIntent;
  keywords: string[];
  requiredDocs: string[];
  mcpActions: string[];
  tensorflowModels: string[];
  isKorean: boolean;
  useTransformers: boolean;
  useVectorSearch: boolean;
}

export type QueryIntent = 
  | 'analysis'
  | 'search'
  | 'prediction'
  | 'optimization'
  | 'troubleshooting';

export interface EngineStats {
  korean: { initialized: boolean; successCount: number; avgTime: number };
  tensorflow: { initialized: boolean; successCount: number; avgTime: number };
  transformers: { initialized: boolean; successCount: number; avgTime: number };
  vector: { initialized: boolean; documentCount: number; searchCount: number };
}

export interface EngineInstance {
  name: string;
  initialized: boolean;
  initialize(): Promise<void>;
  dispose?(): void;
}

export interface VectorSearchResult {
  id: string;
  similarity: number;
}

export interface DocumentSearchOptions {
  maxResults?: number;
  minRelevanceScore?: number;
  includeEmbeddings?: boolean;
}

export interface AnalysisContext {
  smartQuery: SmartQuery;
  documents: DocumentContext[];
  sessionId?: string;
}

export interface ResponseContext {
  text: string;
  confidence: number;
  reasoning: string[];
}

export interface EngineConfiguration {
  korean: {
    enabled: boolean;
    priority: number;
  };
  tensorflow: {
    enabled: boolean;
    priority: number;
    backgroundInit: boolean;
  };
  transformers: {
    enabled: boolean;
    priority: number;
  };
  vector: {
    enabled: boolean;
    maxDocuments: number;
  };
  mcp: {
    enabled: boolean;
    timeout: number;
  };
}

export interface ProcessingMetrics {
  startTime: number;
  initTime?: number;
  searchTime?: number;
  analysisTime?: number;
  responseTime?: number;
  totalTime?: number;
}

export interface HybridEngineState {
  isInitialized: boolean;
  lastIndexUpdate: number;
  documentCount: number;
  activeEngines: string[];
  configuration: EngineConfiguration;
}

export interface DocumentIndexOptions {
  forceRebuild?: boolean;
  maxConcurrency?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
} 