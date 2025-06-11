/**
 * 🔗 AI 엔진 체인 v1.0
 * 
 * MCP → RAG → Google AI 폴백 체인 구현
 * - 단순하고 명확한 구조
 * - 실패시 다음 엔진으로 자동 폴백
 * - 모든 엔진 실패시 명확한 오류 처리
 */

import { MCPOrchestrator } from '../mcp/mcp-orchestrator';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { aiLogger, LogLevel, LogCategory } from '@/services/ai/logging/AILogger';

export interface AIQuery {
    id: string;
    text: string;
    context?: Record<string, any>;
    userId?: string;
}

export interface AIResponse {
    id: string;
    queryId: string;
    answer: string;
    confidence: number;
    engine: 'mcp' | 'rag' | 'google-ai';
    processingTime: number;
    sources?: any[];
    metadata?: Record<string, any>;
    timestamp: number;
}

export interface AIEngine {
    name: string;
    priority: number;
    isAvailable(): Promise<boolean>;
    process(query: AIQuery): Promise<AIResponse | null>;
}

/**
 * 🧠 MCP 엔진 (우선순위 1)
 */
class MCPEngine implements AIEngine {
    name = 'MCP';
    priority = 1;
    private orchestrator: MCPOrchestrator;

    constructor() {
        this.orchestrator = new MCPOrchestrator();
    }

    async isAvailable(): Promise<boolean> {
        try {
            // MCP 오케스트레이터 상태 확인
            return true; // MCP는 항상 사용 가능하다고 가정
        } catch (error) {
            await aiLogger.logError('MCPEngine', LogCategory.MCP, error as Error);
            return false;
        }
    }

    async process(query: AIQuery): Promise<AIResponse | null> {
        const startTime = Date.now();

        try {
            await aiLogger.logAI({
                level: LogLevel.INFO,
                category: LogCategory.MCP,
                engine: 'MCPEngine',
                message: `MCP 엔진 처리 시작: "${query.text}"`,
                metadata: { queryId: query.id }
            });

            const result = await this.orchestrator.processQuery({
                query: query.text,
                context: query.context || {},
                userId: query.userId
            });

            if (result && result.success) {
                const response: AIResponse = {
                    id: `mcp_${Date.now()}`,
                    queryId: query.id,
                    answer: result.answer,
                    confidence: result.confidence || 0.9,
                    engine: 'mcp',
                    processingTime: Date.now() - startTime,
                    sources: result.sources || [],
                    metadata: result.metadata,
                    timestamp: Date.now()
                };

                await aiLogger.logAI({
                    level: LogLevel.INFO,
                    category: LogCategory.MCP,
                    engine: 'MCPEngine',
                    message: `MCP 엔진 처리 성공 (${response.processingTime}ms)`,
                    metadata: { queryId: query.id, confidence: response.confidence }
                });

                return response;
            }

            return null;
        } catch (error) {
            await aiLogger.logError('MCPEngine', LogCategory.MCP, error as Error, {
                queryId: query.id,
                processingTime: Date.now() - startTime
            });
            return null;
        }
    }
}

/**
 * 📚 RAG 엔진 (우선순위 2)
 */
class RAGEngine implements AIEngine {
    name = 'RAG';
    priority = 2;

    async isAvailable(): Promise<boolean> {
        try {
            // RAG 시스템 상태 확인 (벡터 DB 등)
            return true; // 간단히 항상 사용 가능하다고 가정
        } catch (error) {
            await aiLogger.logError('RAGEngine', LogCategory.RAG, error as Error);
            return false;
        }
    }

    async process(query: AIQuery): Promise<AIResponse | null> {
        const startTime = Date.now();

        try {
            await aiLogger.logAI({
                level: LogLevel.INFO,
                category: LogCategory.RAG,
                engine: 'RAGEngine',
                message: `RAG 엔진 처리 시작: "${query.text}"`,
                metadata: { queryId: query.id }
            });

            // 벡터 검색 및 RAG 처리
            // 현재는 기본 응답 반환 (추후 실제 RAG 로직 구현)
            const answer = `RAG 기반 응답: ${query.text}에 대한 문서 검색 결과입니다.`;

            const response: AIResponse = {
                id: `rag_${Date.now()}`,
                queryId: query.id,
                answer,
                confidence: 0.7,
                engine: 'rag',
                processingTime: Date.now() - startTime,
                sources: [],
                metadata: { vectorSearch: true },
                timestamp: Date.now()
            };

            await aiLogger.logAI({
                level: LogLevel.INFO,
                category: LogCategory.RAG,
                engine: 'RAGEngine',
                message: `RAG 엔진 처리 성공 (${response.processingTime}ms)`,
                metadata: { queryId: query.id, confidence: response.confidence }
            });

            return response;
        } catch (error) {
            await aiLogger.logError('RAGEngine', LogCategory.RAG, error as Error, {
                queryId: query.id,
                processingTime: Date.now() - startTime
            });
            return null;
        }
    }
}

/**
 * 🤖 Google AI 엔진 (우선순위 3, 최종 폴백)
 */
class GoogleAIEngineWrapper implements AIEngine {
    name = 'Google AI';
    priority = 3;
    private googleAI: GoogleAIService;

    constructor() {
        this.googleAI = GoogleAIService.getInstance();
    }

    async isAvailable(): Promise<boolean> {
        try {
            const status = await this.googleAI.getServiceStatus();
            return status.status === 'healthy';
        } catch (error) {
            await aiLogger.logError('GoogleAIEngine', LogCategory.GOOGLE_AI, error as Error);
            return false;
        }
    }

    async process(query: AIQuery): Promise<AIResponse | null> {
        const startTime = Date.now();

        try {
            await aiLogger.logAI({
                level: LogLevel.INFO,
                category: LogCategory.GOOGLE_AI,
                engine: 'GoogleAIEngine',
                message: `Google AI 엔진 처리 시작: "${query.text}"`,
                metadata: { queryId: query.id }
            });

            const result = await this.googleAI.generateResponse(query.text, {
                userId: query.userId,
                context: query.context
            });

            if (result && result.success) {
                const response: AIResponse = {
                    id: `google_${Date.now()}`,
                    queryId: query.id,
                    answer: result.response,
                    confidence: result.confidence || 0.8,
                    engine: 'google-ai',
                    processingTime: Date.now() - startTime,
                    sources: [],
                    metadata: { model: 'gemini', ...result.metadata },
                    timestamp: Date.now()
                };

                await aiLogger.logAI({
                    level: LogLevel.INFO,
                    category: LogCategory.GOOGLE_AI,
                    engine: 'GoogleAIEngine',
                    message: `Google AI 엔진 처리 성공 (${response.processingTime}ms)`,
                    metadata: { queryId: query.id, confidence: response.confidence }
                });

                return response;
            }

            return null;
        } catch (error) {
            await aiLogger.logError('GoogleAIEngine', LogCategory.GOOGLE_AI, error as Error, {
                queryId: query.id,
                processingTime: Date.now() - startTime
            });
            return null;
        }
    }
}

/**
 * 🔗 AI 엔진 체인 오케스트레이터
 */
export class AIEngineChain {
    private engines: AIEngine[] = [];
    private initialized = false;

    constructor() {
        // 우선순위 순으로 엔진 등록
        this.engines = [
            new MCPEngine(),
            new RAGEngine(),
            new GoogleAIEngineWrapper()
        ].sort((a, b) => a.priority - b.priority);
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        await aiLogger.logAI({
            level: LogLevel.INFO,
            category: LogCategory.AI_ENGINE,
            engine: 'AIEngineChain',
            message: '🔗 AI 엔진 체인 초기화 시작',
            metadata: { engineCount: this.engines.length }
        });

        // 각 엔진의 가용성 확인
        const availabilityChecks = await Promise.allSettled(
            this.engines.map(async engine => ({
                name: engine.name,
                available: await engine.isAvailable()
            }))
        );

        const availableEngines = availabilityChecks
            .filter(result => result.status === 'fulfilled' && result.value.available)
            .map(result => (result as PromiseFulfilledResult<any>).value.name);

        await aiLogger.logAI({
            level: LogLevel.INFO,
            category: LogCategory.AI_ENGINE,
            engine: 'AIEngineChain',
            message: `✅ AI 엔진 체인 초기화 완료`,
            metadata: {
                totalEngines: this.engines.length,
                availableEngines,
                availableCount: availableEngines.length
            }
        });

        this.initialized = true;
    }

    /**
     * 🧠 쿼리 처리 (폴백 체인 실행)
     */
    async processQuery(query: AIQuery): Promise<AIResponse> {
        if (!this.initialized) {
            await this.initialize();
        }

        const startTime = Date.now();

        await aiLogger.logAI({
            level: LogLevel.AI_THINKING,
            category: LogCategory.AI_ENGINE,
            engine: 'AIEngineChain',
            message: `🔗 폴백 체인 시작: "${query.text}"`,
            metadata: { queryId: query.id, engineCount: this.engines.length }
        });

        for (const engine of this.engines) {
            try {
                // 엔진 가용성 확인
                const isAvailable = await engine.isAvailable();
                if (!isAvailable) {
                    await aiLogger.logAI({
                        level: LogLevel.WARN,
                        category: LogCategory.AI_ENGINE,
                        engine: 'AIEngineChain',
                        message: `⚠️ ${engine.name} 엔진 사용 불가, 다음 엔진으로 폴백`,
                        metadata: { queryId: query.id, skippedEngine: engine.name }
                    });
                    continue;
                }

                // 엔진 처리 시도
                const result = await engine.process(query);
                if (result) {
                    await aiLogger.logAI({
                        level: LogLevel.INFO,
                        category: LogCategory.AI_ENGINE,
                        engine: 'AIEngineChain',
                        message: `✅ 폴백 체인 성공: ${engine.name} 엔진이 응답 생성`,
                        metadata: {
                            queryId: query.id,
                            successEngine: engine.name,
                            totalTime: Date.now() - startTime,
                            confidence: result.confidence
                        }
                    });
                    return result;
                }

                await aiLogger.logAI({
                    level: LogLevel.WARN,
                    category: LogCategory.AI_ENGINE,
                    engine: 'AIEngineChain',
                    message: `⚠️ ${engine.name} 엔진 처리 실패, 다음 엔진으로 폴백`,
                    metadata: { queryId: query.id, failedEngine: engine.name }
                });

            } catch (error) {
                await aiLogger.logError('AIEngineChain', LogCategory.AI_ENGINE, error as Error, {
                    queryId: query.id,
                    failedEngine: engine.name,
                    errorStage: 'engine_processing'
                });
            }
        }

        // 모든 엔진 실패
        const totalTime = Date.now() - startTime;
        await aiLogger.logError('AIEngineChain', LogCategory.AI_ENGINE, new Error('All AI engines failed'), {
            queryId: query.id,
            totalTime,
            failedEngines: this.engines.map(e => e.name)
        });

        throw new Error(`모든 AI 엔진이 실패했습니다. 시스템 관리자에게 문의하세요. (Query ID: ${query.id})`);
    }

    /**
     * 🔍 시스템 상태 확인
     */
    async getSystemHealth(): Promise<{
        overall: 'healthy' | 'degraded' | 'unhealthy';
        engines: Record<string, boolean>;
        timestamp: number;
    }> {
        const engineStatuses = await Promise.allSettled(
            this.engines.map(async engine => ({
                name: engine.name,
                available: await engine.isAvailable()
            }))
        );

        const engines: Record<string, boolean> = {};
        let availableCount = 0;

        engineStatuses.forEach(result => {
            if (result.status === 'fulfilled') {
                engines[result.value.name] = result.value.available;
                if (result.value.available) availableCount++;
            } else {
                engines['unknown'] = false;
            }
        });

        let overall: 'healthy' | 'degraded' | 'unhealthy';
        if (availableCount >= 2) overall = 'healthy';
        else if (availableCount >= 1) overall = 'degraded';
        else overall = 'unhealthy';

        return {
            overall,
            engines,
            timestamp: Date.now()
        };
    }
}

// 싱글톤 인스턴스
let aiEngineChainInstance: AIEngineChain | null = null;

export function getAIEngineChain(): AIEngineChain {
    if (!aiEngineChainInstance) {
        aiEngineChainInstance = new AIEngineChain();
    }
    return aiEngineChainInstance;
} 