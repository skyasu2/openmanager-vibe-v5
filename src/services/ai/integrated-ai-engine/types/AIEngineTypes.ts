/**
 * 🎯 AI Engine Types
 * 
 * 통합 AI 엔진의 모든 타입 정의
 * - 요청/응답 인터페이스
 * - 시스템 메트릭 타입
 * - Intent 및 NLP 타입
 * - 설정 및 상태 타입
 */

export interface AIQueryRequest {
    query: string;
    context?: {
        session_id?: string;
        user_id?: string;
        server_ids?: string[];
        include_predictions?: boolean;
        include_charts?: boolean;
        language?: 'ko' | 'en';
    };
    options?: {
        max_response_time?: number;
        confidence_threshold?: number;
        enable_streaming?: boolean;
        include_debug?: boolean;
    };
}

export interface AIQueryResponse {
    success: boolean;
    query_id: string;
    intent: string;
    confidence: number;
    answer: string;
    analysis_results: {
        nlp_analysis: any;
        ai_predictions?: any;
        anomaly_detection?: any;
        trend_forecasts?: any;
        active_alerts?: any[];
        session_context?: any;
        performance_metrics?: any;
        document_results?: any[];
        system_overview?: any;
    };
    recommendations: string[];
    generated_report?: string;
    mcp_results?: any;
    processing_stats: {
        total_time: number;
        components_used: string[];
        models_executed: string[];
        data_sources: string[];
    };
    metadata: {
        timestamp: string;
        language: string;
        session_id?: string;
        debug_info?: any;
    };
}

export interface SystemMetrics {
    servers: Record<string, Record<string, number[]>>;
    global_stats: any;
    alerts: any[];
    timestamp: string;
}

export interface NLPResult {
    intent: string;
    confidence: number;
    entities: any[];
    keywords: string[];
    language: string;
    sentiment: string;
    query_type: string;
}

export interface IntentHandlerResult {
    success: boolean;
    data?: any;
    error?: string;
    processing_time: number;
    components_used: string[];
    models_executed: string[];
}

export interface ResponseGeneratorConfig {
    language: 'ko' | 'en';
    include_details: boolean;
    include_recommendations: boolean;
    format: 'short' | 'medium' | 'detailed';
}

export interface StreamingChunk {
    type: 'progress' | 'partial_result' | 'final_result' | 'error';
    data: any;
    timestamp: number;
    chunk_id: string;
}

export interface AIEngineConfig {
    enabled_components: {
        nlp_processor: boolean;
        mcp_client: boolean;
        tensorflow_engine: boolean;
        report_generator: boolean;
        streaming: boolean;
    };
    performance: {
        max_response_time: number;
        confidence_threshold: number;
        cache_ttl: number;
        render_ping_interval: number;
    };
    features: {
        auto_report_generation: boolean;
        render_management: boolean;
        session_tracking: boolean;
        debug_mode: boolean;
    };
    language: {
        default_language: 'ko' | 'en';
        supported_languages: string[];
    };
}

export interface AIEngineStatus {
    initialized: boolean;
    render_status: 'active' | 'sleeping' | 'error';
    components_status: {
        mcp_client: boolean;
        tensorflow_engine: boolean;
        report_generator: boolean;
    };
    active_sessions: number;
    cache_size: number;
    last_activity: string;
    uptime: number;
}

export interface DocumentSearchResult {
    id: string;
    title: string;
    content: string;
    relevance_score: number;
    keywords_matched: string[];
    source: string;
    last_updated: string;
}

export interface ReportConfig {
    format: 'markdown' | 'html' | 'json';
    include_charts: boolean;
    include_raw_data: boolean;
    template: 'technical' | 'executive' | 'operational';
    language: 'ko' | 'en';
    time_range: {
        start: string;
        end: string;
        duration: string;
    };
}

export interface AIAnalysisResult {
    failure_predictions: Record<string, {
        prediction: number[];
        confidence: number;
        factors: string[];
    }>;
    anomaly_detections: Record<string, {
        is_anomaly: boolean;
        severity: 'low' | 'medium' | 'high';
        description: string;
    }>;
    trend_predictions: Record<string, {
        trend: 'increasing' | 'decreasing' | 'stable';
        forecast: number[];
        confidence: number;
    }>;
    processing_stats: {
        models_used: string[];
        processing_time: number;
        data_points_analyzed: number;
    };
}

export interface SessionContext {
    session_id: string;
    user_id?: string;
    created_at: string;
    last_activity: string;
    query_history: Array<{
        query: string;
        timestamp: string;
        intent: string;
        response_summary: string;
    }>;
    user_preferences: {
        language: 'ko' | 'en';
        detail_level: 'basic' | 'detailed';
        include_charts: boolean;
    };
    context_data: Record<string, any>;
}

export type IntentType =
    | 'troubleshooting'
    | 'prediction'
    | 'analysis'
    | 'monitoring'
    | 'reporting'
    | 'performance'
    | 'general';

export type QueryType =
    | 'status_check'
    | 'troubleshooting'
    | 'prediction'
    | 'analysis'
    | 'performance'
    | 'configuration'
    | 'general';

export interface IntentHandler {
    canHandle(intent: IntentType): boolean;
    handle(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult>;
}

export interface ResponseGenerator {
    canGenerate(intent: IntentType): boolean;
    generate(
        response: AIQueryResponse,
        config: ResponseGeneratorConfig
    ): string;
}

export interface NLPProcessor {
    processQuery(query: string): Promise<NLPResult>;
    detectIntent(query: string): string;
    detectLanguage(query: string): string;
    extractKeywords(query: string): string[];
    classifyQueryType(query: string): string;
}

export interface SystemManager {
    initialize(): Promise<void>;
    startRenderManagement(): void;
    getRenderStatus(): 'active' | 'sleeping' | 'error';
    getEngineStatus(): Promise<AIEngineStatus>;
    dispose(): void;
}

export interface StreamingProcessor {
    processQueryStream(
        request: AIQueryRequest
    ): AsyncGenerator<StreamingChunk, void, unknown>;
    createStreamingResponse(
        response: AIQueryResponse,
        chunkSize?: number
    ): AsyncGenerator<StreamingChunk, void, unknown>;
}

export interface AIEngineUtils {
    generateQueryId(): string;
    collectSystemMetrics(serverIds?: string[]): Promise<SystemMetrics>;
    searchDocumentsByKeywords(keywords: string[]): Promise<DocumentSearchResult[]>;
    calculateKeywordRelevance(content: string, keywords: string[]): number;
    isCommonWord(word: string): boolean;
    simpleTokenize(text: string): string[];
}

export interface CacheEntry<T = any> {
    key: string;
    data: T;
    timestamp: number;
    ttl: number;
    hit_count: number;
}

export interface PerformanceMetrics {
    query_processing_time: number;
    nlp_processing_time: number;
    ai_analysis_time: number;
    response_generation_time: number;
    total_processing_time: number;
    cache_hit_rate: number;
    memory_usage: number;
    active_sessions: number;
}

export interface ErrorContext {
    component: string;
    operation: string;
    request_id?: string;
    session_id?: string;
    timestamp: string;
    stack_trace?: string;
}

export interface AIEngineError extends Error {
    code: string;
    context: ErrorContext;
    recoverable: boolean;
    retry_after?: number;
}

// 상수 정의
export const AI_ENGINE_CONSTANTS = {
    DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
    MAX_RESPONSE_TIME: 30000,
    CACHE_TTL: 300000, // 5분
    RENDER_PING_INTERVAL: 300000, // 5분
    MAX_CACHE_SIZE: 1000,
    MAX_SESSION_DURATION: 3600000, // 1시간
    SUPPORTED_LANGUAGES: ['ko', 'en'],
    INTENT_TYPES: [
        'troubleshooting',
        'prediction',
        'analysis',
        'monitoring',
        'reporting',
        'performance',
        'general'
    ] as const,
    QUERY_TYPES: [
        'status_check',
        'troubleshooting',
        'prediction',
        'analysis',
        'performance',
        'configuration',
        'general'
    ] as const
} as const;

export const KOREAN_COMMON_WORDS = [
    '이', '가', '을', '를', '에', '에서', '로', '으로', '와', '과', '의', '은', '는',
    '있다', '없다', '이다', '아니다', '하다', '되다', '보다', '같다', '다르다',
    '그', '이', '저', '그것', '이것', '저것', '여기', '거기', '저기',
    '오늘', '어제', '내일', '지금', '나중에', '항상', '가끔', '자주',
    '무엇', '누구', '언제', '어디', '왜', '어떻게'
] as const;

export const ENGLISH_COMMON_WORDS = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must',
    'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how',
    'what', 'who', 'which', 'some', 'any', 'all', 'no', 'not', 'very', 'so', 'just'
] as const; 