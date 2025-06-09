/**
 * 🧠 Enhanced AI Engine Types v1.0
 * 
 * Enhanced AI Engine 모듈화를 위한 공통 타입 정의
 * - 인터페이스 기반 의존성 분리
 * - SOLID 원칙 적용을 위한 추상화
 * - 모듈 간 타입 안전성 보장
 */

// ===== 기본 데이터 타입 =====

export interface DocumentContext {
    path: string;
    content: string;
    keywords: string[];
    lastModified: number;
    relevanceScore: number;
    contextLinks: string[];
}

export interface AIAnalysisResult {
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
}

export interface SmartQuery {
    originalQuery: string;
    intent: QueryIntent;
    keywords: string[];
    requiredDocs: string[];
    mcpActions: string[];
    tensorflowModels: string[];
    isKorean: boolean;
}

export type QueryIntent =
    | 'analysis'
    | 'search'
    | 'prediction'
    | 'optimization'
    | 'troubleshooting';

// ===== 모듈 인터페이스 =====

export interface IInitializationManager {
    initialize(): Promise<void>;
    initializeTensorFlowInBackground(): Promise<void>;
    ensureTensorFlowInitialized(): Promise<void>;
    isInitialized(): boolean;
    getInitializationStatus(): InitializationStatus;
}

export interface IDocumentIndexManager {
    buildDocumentIndex(): Promise<void>;
    analyzeDocument(path: string, content: string): Promise<DocumentContext>;
    searchRelevantDocuments(smartQuery: SmartQuery): Promise<DocumentContext[]>;
    loadFallbackKnowledge(): Promise<void>;
    getDocumentContext(path: string): DocumentContext | undefined;
    getIndexStats(): IndexStats;
}

export interface IQueryProcessor {
    analyzeQueryIntent(query: string): Promise<SmartQuery>;
    detectKorean(text: string): boolean;
    executeMCPActions(smartQuery: SmartQuery): Promise<string[]>;
    extractKeywords(text: string): string[];
    processQuery(query: string, sessionId?: string): Promise<SmartQuery>;
}

export interface IAnalysisEngine {
    runTensorFlowAnalysis(smartQuery: SmartQuery, docs: DocumentContext[]): Promise<any>;
    generateContextualAnswer(
        smartQuery: SmartQuery,
        docs: DocumentContext[],
        tensorflowPredictions?: any
    ): Promise<{ text: string; confidence: number; reasoning: string[] }>;
    calculateAnswerConfidence(docs: DocumentContext[], tensorflowPredictions?: any): number;
    generateReasoningSteps(smartQuery: SmartQuery, docs: DocumentContext[]): string[];
}

// ===== 상태 및 설정 타입 =====

export interface InitializationStatus {
    mcpClient: boolean;
    koreanEngine: boolean;
    tensorflowEngine: boolean;
    transformersEngine: boolean;
    vectorDB: boolean;
    documentIndex: boolean;
    isFullyInitialized: boolean;
    initializationTime: number;
}

export interface IndexStats {
    documentCount: number;
    lastUpdate: number;
    indexSize: number;
    averageRelevanceScore: number;
    topKeywords: string[];
}

export interface AnalysisMetrics {
    queryProcessingTime: number;
    documentSearchTime: number;
    tensorflowAnalysisTime: number;
    answerGenerationTime: number;
    totalProcessingTime: number;
    documentsAnalyzed: number;
    confidenceScore: number;
}

export interface AIEngineConfig {
    enableKoreanNLP: boolean;
    enableTensorFlow: boolean;
    enableTransformers: boolean;
    enableVectorDB: boolean;
    maxDocuments: number;
    indexUpdateInterval: number;
    tensorflowBackgroundInit: boolean;
    memoryOptimization: boolean;
}

// ===== 에러 및 예외 타입 =====

export class AIEngineError extends Error {
    constructor(
        message: string,
        public code: AIErrorCode,
        public details?: any
    ) {
        super(message);
        this.name = 'AIEngineError';
    }
}

export type AIErrorCode =
    | 'INITIALIZATION_FAILED'
    | 'DOCUMENT_INDEX_ERROR'
    | 'QUERY_PROCESSING_ERROR'
    | 'TENSORFLOW_ERROR'
    | 'MCP_CONNECTION_ERROR'
    | 'MEMORY_LIMIT_EXCEEDED';

// ===== 유틸리티 타입 =====

export interface FallbackKnowledge {
    category: string;
    title: string;
    content: string;
    keywords: string[];
    priority: number;
}

export interface ContextMemory {
    sessionId: string;
    lastQuery: string;
    queryHistory: string[];
    documentCache: Map<string, DocumentContext>;
    tensorflowCache: Map<string, any>;
    timestamp: number;
}

export interface MCPActionResult {
    action: string;
    success: boolean;
    result: any;
    error?: string;
    executionTime: number;
}

// ===== 성능 모니터링 타입 =====

export interface PerformanceMetrics {
    initializationTime: number;
    averageQueryTime: number;
    documentIndexSize: number;
    memoryUsage: number;
    cacheHitRate: number;
    errorRate: number;
    uptime: number;
}

export interface BenchmarkResult {
    operation: string;
    duration: number;
    memoryUsed: number;
    documentsProcessed: number;
    accuracy: number;
    timestamp: number;
}

// ===== 플러그인 및 확장 타입 =====

export interface AIEnginePlugin {
    name: string;
    version: string;
    initialize(): Promise<void>;
    process(query: SmartQuery): Promise<any>;
    dispose(): void;
}

export interface ExtensionPoint {
    name: string;
    handler: (data: any) => Promise<any>;
    priority: number;
}

// ===== 로깅 및 디버깅 타입 =====

export interface AIEngineLog {
    timestamp: number;
    level: 'debug' | 'info' | 'warn' | 'error';
    module: string;
    message: string;
    data?: any;
    sessionId?: string;
}

export interface DebugInfo {
    queryAnalysis: any;
    documentSelection: any;
    tensorflowOutput: any;
    answerGeneration: any;
    performanceMetrics: PerformanceMetrics;
} 