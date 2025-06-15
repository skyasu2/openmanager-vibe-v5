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
  lightweightMLPredictions?: any;
  transformersResults?: any;
  vectorSearchResults?: any;
  mcpResults?: any;
  engineUsed:
    | 'korean'
    | 'lightweight-ml'
    | 'transformers'
    | 'vector'
    | 'hybrid';
  processingTime: number;
}

export interface SmartQuery {
  originalQuery: string;
  intent:
    | 'analysis'
    | 'search'
    | 'prediction'
    | 'optimization'
    | 'troubleshooting';
  keywords: string[];
  requiredDocs: string[];
  mcpActions: string[];
  tensorflowModels: string[];
  isKorean: boolean;
  useTransformers: boolean;
  useVectorSearch: boolean;
}

export interface EngineStats {
  korean: { initialized: boolean; successCount: number; avgTime: number };
  lightweightML: {
    initialized: boolean;
    successCount: number;
    avgTime: number;
  };
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
  korean: { enabled: boolean; priority: number };
  lightweightML: { enabled: boolean; priority: number; models: string[] };
  transformers: { enabled: boolean; priority: number; models: string[] };
  vector: { enabled: boolean; priority: number; threshold: number };
  mcp: { enabled: boolean; priority: number };
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

export interface EngineCapabilities {
  korean: string[];
  lightweightMLModels: string[];
  transformersModels: string[];
  vectorDatabases: string[];
  mcpServers: string[];
}

export interface HybridEngineConfig {
  korean: {
    enabled: boolean;
    nlpModels: string[];
    responseTemplates: string[];
  };
  lightweightML: {
    enabled: boolean;
    models: string[];
    algorithms: string[];
    maxComplexity: number;
  };
  transformers: {
    enabled: boolean;
    models: string[];
    maxTokens: number;
  };
  vector: {
    enabled: boolean;
    dimensions: number;
    similarity: number;
  };
  mcp: {
    enabled: boolean;
    servers: string[];
    timeout: number;
  };
}
