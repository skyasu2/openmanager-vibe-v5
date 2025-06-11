/**
 * 🤖 통합 AI 시스템 v3.0
 * 
 * MCP → RAG → Google AI 폴백 체인 구현
 * - 깔끔한 아키텍처
 * - FastAPI 완전 제거
 * - AI 엔진 체인 중심 설계
 */

import { getAIEngineChain, AIQuery, AIResponse } from './AIEngineChain';
import { aiLogger, LogLevel, LogCategory } from '@/services/ai/logging/AILogger';

export interface UnifiedAIConfig {
    maxResponseTime: number;
    cacheEnabled: boolean;
    enableLogging: boolean;
}

export interface UnifiedQuery {
    id: string;
    query: string;
    text: string;
    userId?: string;
    context?: any;
    analysisType?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    organizationId?: string;
    sessionId?: string;
}

export interface UnifiedResponse {
    id: string;
    queryId: string;
    success: boolean;
    content: string;
    answer: string;
    confidence: number;
    processingTime: number;
    sources: string[];
    engine: string;
    metadata?: any;
    timestamp: number;
    analysis?: any;
    recommendations?: string[];
    actions?: any[];
}

export interface SystemHealth {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    engines: Record<string, boolean>;
    components?: Record<string, boolean>;
    stats: {
        totalQueries: number;
        avgResponseTime: number;
        successRate: number;
    };
    timestamp: number;
}

/**
 * 🔗 통합 AI 시스템 v3.0
 */
export class UnifiedAISystem {
    private aiEngineChain = getAIEngineChain();
    private config: UnifiedAIConfig;
    private queryCache = new Map<string, UnifiedResponse>();
    private initialized = false;
    private stats = {
        totalQueries: 0,
        successfulQueries: 0,
        totalResponseTime: 0,
    };

    constructor(config: Partial<UnifiedAIConfig> = {}) {
        this.config = {
            maxResponseTime: 30000,
            cacheEnabled: true,
            enableLogging: true,
            ...config,
        };
    }

    /**
     * 🚀 시스템 초기화
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            if (this.config.enableLogging) {
                await aiLogger.logAI({
                    level: LogLevel.INFO,
                    category: LogCategory.AI_ENGINE,
                    engine: 'UnifiedAISystem',
                    message: '🚀 통합 AI 시스템 초기화 시작',
                    metadata: { config: this.config }
                });
            }

            await this.aiEngineChain.initialize();
            this.initialized = true;

            if (this.config.enableLogging) {
                await aiLogger.logAI({
                    level: LogLevel.INFO,
                    category: LogCategory.AI_ENGINE,
                    engine: 'UnifiedAISystem',
                    message: '✅ 통합 AI 시스템 초기화 완료',
                    metadata: { initialized: true }
                });
            }
        } catch (error) {
            if (this.config.enableLogging) {
                await aiLogger.logError('UnifiedAISystem', LogCategory.AI_ENGINE, error as Error);
            }
            throw error;
        }
    }

    /**
     * 🧠 통합 질의 처리
     */
    async processQuery(query: UnifiedQuery): Promise<UnifiedResponse> {
        if (!this.initialized) {
            await this.initialize();
        }

        const startTime = Date.now();
        this.stats.totalQueries++;

        // 캐시 확인
        if (this.config.cacheEnabled) {
            const cacheKey = this.generateCacheKey(query);
            const cached = this.queryCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 300000) { // 5분 캐시
                return cached;
            }
        }

        try {
            if (this.config.enableLogging) {
                await aiLogger.logAI({
                    level: LogLevel.INFO,
                    category: LogCategory.AI_ENGINE,
                    engine: 'UnifiedAISystem',
                    message: `🧠 질의 처리 시작: "${query.query}"`,
                    metadata: { queryId: query.id, userId: query.userId }
                });
            }

            // AI 엔진 체인으로 처리
            const aiQuery: AIQuery = {
                id: query.id,
                text: query.query,
                context: query.context,
                userId: query.userId
            };

            const aiResponse = await this.aiEngineChain.processQuery(aiQuery);

            // 통합 응답 생성
            const response: UnifiedResponse = {
                id: aiResponse.id,
                queryId: query.id,
                success: true,
                content: aiResponse.answer,
                answer: aiResponse.answer,
                confidence: aiResponse.confidence,
                engine: aiResponse.engine,
                processingTime: aiResponse.processingTime,
                sources: aiResponse.sources || [],
                metadata: { ...aiResponse.metadata },
                timestamp: aiResponse.timestamp,
            };

            // 캐시 저장
            if (this.config.cacheEnabled) {
                const cacheKey = this.generateCacheKey(query);
                this.queryCache.set(cacheKey, response);
            }

            // 통계 업데이트
            this.stats.successfulQueries++;
            this.stats.totalResponseTime += response.processingTime;

            if (this.config.enableLogging) {
                await aiLogger.logAI({
                    level: LogLevel.INFO,
                    category: LogCategory.AI_ENGINE,
                    engine: 'UnifiedAISystem',
                    message: `✅ 질의 처리 완료 (${response.processingTime}ms)`,
                    metadata: {
                        queryId: query.id,
                        engine: response.engine,
                        confidence: response.confidence
                    }
                });
            }

            return response;

        } catch (error) {
            if (this.config.enableLogging) {
                await aiLogger.logError('UnifiedAISystem', LogCategory.AI_ENGINE, error as Error, {
                    queryId: query.id,
                    processingTime: Date.now() - startTime
                });
            }

            // 실패 응답 생성
            return {
                id: `error_${Date.now()}`,
                queryId: query.id,
                success: false,
                content: `죄송합니다. 요청을 처리할 수 없습니다: ${(error as Error).message}`,
                answer: `죄송합니다. 요청을 처리할 수 없습니다: ${(error as Error).message}`,
                confidence: 0,
                engine: 'error',
                processingTime: Date.now() - startTime,
                sources: [],
                metadata: { error: true, errorMessage: (error as Error).message },
                timestamp: Date.now()
            };
        }
    }

    /**
     * 🔍 시스템 상태 확인
     */
    async getSystemHealth(): Promise<SystemHealth> {
        const engineHealth = await this.aiEngineChain.getSystemHealth();

        return {
            overall: engineHealth.overall,
            engines: engineHealth.engines,
            components: engineHealth.components,
            stats: {
                totalQueries: this.stats.totalQueries,
                avgResponseTime: this.stats.totalQueries > 0
                    ? this.stats.totalResponseTime / this.stats.totalQueries
                    : 0,
                successRate: this.stats.totalQueries > 0
                    ? this.stats.successfulQueries / this.stats.totalQueries
                    : 0
            },
            timestamp: Date.now()
        };
    }

    /**
     * 🛠️ 캐시 키 생성
     */
    private generateCacheKey(query: UnifiedQuery): string {
        return `${query.query}_${JSON.stringify(query.context || {})}_${query.userId || 'anonymous'}`;
    }

    /**
     * 🧹 캐시 정리
     */
    async clearCache(): Promise<void> {
        this.queryCache.clear();

        if (this.config.enableLogging) {
            await aiLogger.logAI({
                level: LogLevel.INFO,
                category: LogCategory.AI_ENGINE,
                engine: 'UnifiedAISystem',
                message: '🧹 캐시 정리 완료',
                metadata: { clearedAt: Date.now() }
            });
        }
    }

    /**
     * 📊 통계 초기화
     */
    async resetStats(): Promise<void> {
        this.stats = {
            totalQueries: 0,
            successfulQueries: 0,
            totalResponseTime: 0,
        };

        if (this.config.enableLogging) {
            await aiLogger.logAI({
                level: LogLevel.INFO,
                category: LogCategory.AI_ENGINE,
                engine: 'UnifiedAISystem',
                message: '📊 통계 초기화 완료',
                metadata: { resetAt: Date.now() }
            });
        }
    }

    /**
     * 🔄 시스템 재시작
     */
    async restart(): Promise<void> {
        this.initialized = false;
        await this.clearCache();
        await this.resetStats();
        await this.initialize();
    }
}

// 싱글톤 인스턴스
let unifiedAIInstance: UnifiedAISystem | null = null;

export function getUnifiedAISystem(): UnifiedAISystem {
    if (!unifiedAIInstance) {
        unifiedAIInstance = new UnifiedAISystem();
    }
    return unifiedAIInstance;
}

// 편의를 위한 인스턴스 export
export const unifiedAISystem = getUnifiedAISystem(); 