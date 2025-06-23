/**
 * ��� AI 관련 공통 타입 정의
 */

export type AIMode = 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY' | 'MONITORING';

export interface AIRequest {
    query: string;
    mode?: AIMode;
    category?: string;
    context?: any;
    priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIResponse {
    success: boolean;
    response: string;
    confidence: number;
    mode: AIMode;
    enginePath: string[];
    processingTime: number;
    fallbacksUsed: number;
    metadata: {
        mainEngine: string;
        supportEngines: string[];
        ragUsed: boolean;
        googleAIUsed: boolean;
        mcpContextUsed: boolean;
        subEnginesUsed: string[];
    };
    performance?: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        engineSuccessRates: Record<string, number>;
    };
    error?: string;
}
