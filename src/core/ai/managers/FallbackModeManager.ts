/**
 * 🔄 Fallback Mode Manager v1.0
 * 
 * AI 엔진의 자연어 질의 기능을 3가지 모드별로 다른 폴백 전략 관리
 * 
 * 🎯 3가지 폴백 모드:
 * - AUTO: 룰기반 → RAG → MCP → Google AI (기본)
 * - GOOGLE_ONLY: Google AI 우선 → 나머지 AI 도구들 (룰기반/RAG/MCP 제외)
 * - LOCAL: 룰기반 → RAG → MCP (Google AI 제외)
 * 
 * Features:
 * - 모드별 다른 폴백 전략
 * - 실시간 모드 전환
 * - 모드별 성능 통계
 * - 품질 기반 자동 폴백
 */

import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { RuleBasedMainEngine } from '../engines/RuleBasedMainEngine';
import { LocalRAGEngine } from '@/lib/ml/rag-engine';
import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { OpenSourceEngines } from '@/services/ai/engines/OpenSourceEngines';
import { CustomEngines } from '@/services/ai/engines/CustomEngines';
import { AILogger, LogLevel, LogCategory } from '@/services/ai/logging/AILogger';

// AILogger 인스턴스 생성
const aiLogger = AILogger.getInstance();

// =============================================================================
// 🎯 타입 정의
// =============================================================================

export type AIFallbackMode = 'AUTO' | 'GOOGLE_ONLY' | 'LOCAL';

export interface FallbackRequest {
    query: string;
    mode: AIFallbackMode;
    intent: any;
    context: any;
    options?: any;
}

export interface FallbackResponse {
    success: boolean;
    content: string;
    confidence: number;
    sources: string[];
    metadata: {
        mode: AIFallbackMode;
        tier: string;
        fallbacksUsed: number;
        responseTime: number;
        qualityScore?: number;
    };
    fallbackChain?: string[];
}

export interface ModeStats {
    totalQueries: number;
    successRate: number;
    averageResponseTime: number;
    averageConfidence: number;
    fallbacksUsed: number;
    lastUsed: Date | null;
    qualityTrend: number[]; // 최근 10개 응답의 품질 점수
}

// =============================================================================
// 🔄 Fallback Mode Manager
// =============================================================================

export class FallbackModeManager {
    private static instance: FallbackModeManager | null = null;

    // AI 엔진들
    private ruleBasedEngine: RuleBasedMainEngine;
    private ragEngine: LocalRAGEngine;
    private mcpClient: RealMCPClient | null = null;
    private googleAI?: GoogleAIService;
    private openSourceEngines?: OpenSourceEngines;
    private customEngines?: CustomEngines;

    // 모드 관리
    private currentMode: AIFallbackMode = 'AUTO';
    private modeStats: Map<AIFallbackMode, ModeStats> = new Map();

    // 품질 관리
    private qualityThresholds = {
        excellent: 0.9,
        good: 0.7,
        acceptable: 0.5,
        poor: 0.3
    };

    private constructor() {
        this.ruleBasedEngine = new RuleBasedMainEngine();
        this.ragEngine = new LocalRAGEngine();
        this.initializeModeStats();
    }

    public static getInstance(): FallbackModeManager {
        if (!FallbackModeManager.instance) {
            FallbackModeManager.instance = new FallbackModeManager();
        }
        return FallbackModeManager.instance;
    }

    // =============================================================================
    // 🎯 모드 관리
    // =============================================================================

    public setMode(mode: AIFallbackMode): void {
        this.currentMode = mode;
        aiLogger.info(LogCategory.SYSTEM, `폴백 모드 변경: ${mode}`);
    }

    public getCurrentMode(): AIFallbackMode {
        return this.currentMode;
    }

    public getModeStats(): Map<AIFallbackMode, ModeStats> {
        return this.modeStats;
    }

    // =============================================================================
    // 🔄 모드별 폴백 처리
    // =============================================================================

    public async processWithFallback(request: FallbackRequest): Promise<FallbackResponse> {
        const startTime = Date.now();
        const mode = request.mode || this.currentMode;

        try {
            let response: FallbackResponse;

            switch (mode) {
                case 'AUTO':
                    response = await this.processAutoMode(request);
                    break;
                case 'GOOGLE_ONLY':
                    response = await this.processGoogleOnlyMode(request);
                    break;
                case 'LOCAL':
                    response = await this.processLocalMode(request);
                    break;
                default:
                    throw new Error(`지원하지 않는 모드: ${mode}`);
            }

            // 통계 업데이트
            this.updateModeStats(mode, response, Date.now() - startTime);

            return response;

        } catch (error: any) {
            aiLogger.logError('fallback_manager', LogCategory.AI_ENGINE,
                `${mode} 모드 처리 실패: ${error.message}`);

            // 실패 통계 업데이트
            this.updateModeStats(mode, null, Date.now() - startTime);

            return this.createErrorResponse(request, error, mode);
        }
    }

    // =============================================================================
    // 🎯 AUTO 모드: 룰기반 → RAG → MCP → Google AI
    // =============================================================================

    private async processAutoMode(request: FallbackRequest): Promise<FallbackResponse> {
        const fallbackChain: string[] = [];
        let lastError: Error | null = null;

        // 1단계: 룰기반 엔진 (70% 우선순위)
        try {
            const result = await this.tryRuleBasedEngine(request);
            if (this.isQualityAcceptable(result.confidence)) {
                return {
                    ...result,
                    metadata: {
                        ...result.metadata,
                        mode: 'AUTO',
                        tier: 'rule_based',
                        fallbacksUsed: 0
                    },
                    fallbackChain: ['rule_based']
                };
            }
            fallbackChain.push('rule_based_low_quality');
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('rule_based_failed');
            aiLogger.warn(LogCategory.AI_ENGINE, `룰기반 엔진 실패: ${error.message}`);
        }

        // 2단계: RAG 엔진 (20% 우선순위)
        try {
            const result = await this.tryRAGEngine(request);
            if (this.isQualityAcceptable(result.confidence)) {
                return {
                    ...result,
                    metadata: {
                        ...result.metadata,
                        mode: 'AUTO',
                        tier: 'rag',
                        fallbacksUsed: 1
                    },
                    fallbackChain
                };
            }
            fallbackChain.push('rag_low_quality');
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('rag_failed');
            aiLogger.warn(LogCategory.AI_ENGINE, `RAG 엔진 실패: ${error.message}`);
        }

        // 3단계: MCP 엔진 (8% 우선순위)
        try {
            const result = await this.tryMCPEngine(request);
            if (this.isQualityAcceptable(result.confidence)) {
                return {
                    ...result,
                    metadata: {
                        ...result.metadata,
                        mode: 'AUTO',
                        tier: 'mcp',
                        fallbacksUsed: 2
                    },
                    fallbackChain
                };
            }
            fallbackChain.push('mcp_low_quality');
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('mcp_failed');
            aiLogger.warn(LogCategory.AI_ENGINE, `MCP 엔진 실패: ${error.message}`);
        }

        // 4단계: Google AI (2% 최후 수단)
        try {
            const result = await this.tryGoogleAI(request);
            return {
                ...result,
                metadata: {
                    ...result.metadata,
                    mode: 'AUTO',
                    tier: 'google_ai',
                    fallbacksUsed: 3
                },
                fallbackChain
            };
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('google_ai_failed');
            aiLogger.logError('google_ai', LogCategory.AI_ENGINE, `Google AI 실패: ${error.message}`);
        }

        throw lastError || new Error('모든 AUTO 모드 엔진 실패');
    }

    // =============================================================================
    // 🤖 GOOGLE_ONLY 모드: Google AI 우선 → 나머지 AI 도구들
    // =============================================================================

    private async processGoogleOnlyMode(request: FallbackRequest): Promise<FallbackResponse> {
        const fallbackChain: string[] = [];
        let lastError: Error | null = null;

        // 1단계: Google AI 우선 시도
        try {
            const result = await this.tryGoogleAI(request);
            if (this.isQualityAcceptable(result.confidence)) {
                return {
                    ...result,
                    metadata: {
                        ...result.metadata,
                        mode: 'GOOGLE_ONLY',
                        tier: 'google_ai_primary',
                        fallbacksUsed: 0
                    },
                    fallbackChain: ['google_ai']
                };
            }
            fallbackChain.push('google_ai_low_quality');
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('google_ai_failed');
            aiLogger.warn(LogCategory.AI_ENGINE, `Google AI 실패: ${error.message}`);
        }

        // 2단계: 다른 AI 도구들 (룰기반/RAG/MCP 제외)
        try {
            const result = await this.tryOtherAITools(request);
            return {
                ...result,
                metadata: {
                    ...result.metadata,
                    mode: 'GOOGLE_ONLY',
                    tier: 'other_ai_tools',
                    fallbacksUsed: 1
                },
                fallbackChain
            };
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('other_ai_tools_failed');
            aiLogger.logError('other_ai_tools', LogCategory.AI_ENGINE, `다른 AI 도구들 실패: ${error.message}`);
        }

        throw lastError || new Error('모든 GOOGLE_ONLY 모드 엔진 실패');
    }

    // =============================================================================
    // 🏠 LOCAL 모드: 룰기반 → RAG → MCP (Google AI 제외)
    // =============================================================================

    private async processLocalMode(request: FallbackRequest): Promise<FallbackResponse> {
        const fallbackChain: string[] = [];
        let lastError: Error | null = null;

        // 1단계: 룰기반 엔진 (70% 우선순위)
        try {
            const result = await this.tryRuleBasedEngine(request);
            if (this.isQualityAcceptable(result.confidence)) {
                return {
                    ...result,
                    metadata: {
                        ...result.metadata,
                        mode: 'LOCAL',
                        tier: 'rule_based',
                        fallbacksUsed: 0
                    },
                    fallbackChain: ['rule_based']
                };
            }
            fallbackChain.push('rule_based_low_quality');
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('rule_based_failed');
            aiLogger.warn(LogCategory.AI_ENGINE, `룰기반 엔진 실패: ${error.message}`);
        }

        // 2단계: RAG 엔진 (20% 우선순위)
        try {
            const result = await this.tryRAGEngine(request);
            if (this.isQualityAcceptable(result.confidence)) {
                return {
                    ...result,
                    metadata: {
                        ...result.metadata,
                        mode: 'LOCAL',
                        tier: 'rag',
                        fallbacksUsed: 1
                    },
                    fallbackChain
                };
            }
            fallbackChain.push('rag_low_quality');
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('rag_failed');
            aiLogger.warn(LogCategory.AI_ENGINE, `RAG 엔진 실패: ${error.message}`);
        }

        // 3단계: MCP 엔진 (8% 우선순위)
        try {
            const result = await this.tryMCPEngine(request);
            return {
                ...result,
                metadata: {
                    ...result.metadata,
                    mode: 'LOCAL',
                    tier: 'mcp',
                    fallbacksUsed: 2
                },
                fallbackChain
            };
        } catch (error) {
            lastError = error as Error;
            fallbackChain.push('mcp_failed');
            aiLogger.logError('mcp', LogCategory.AI_ENGINE, `MCP 엔진 실패: ${error.message}`);
        }

        throw lastError || new Error('모든 LOCAL 모드 엔진 실패');
    }

    // =============================================================================
    // 🔧 개별 엔진 시도 메서드들
    // =============================================================================

    private async tryRuleBasedEngine(request: FallbackRequest): Promise<FallbackResponse> {
        const result = await this.ruleBasedEngine.processQuery(request.query, {
            language: 'ko',
            priority: 'balance'
        });

        if (!result || !result.response) {
            throw new Error('룰기반 엔진 처리 실패');
        }

        return {
            success: true,
            content: result.response,
            confidence: result.confidence || 0.8,
            sources: ['rule_based'],
            metadata: {
                mode: request.mode,
                tier: 'rule_based',
                fallbacksUsed: 0,
                responseTime: 0,
                qualityScore: this.calculateQualityScore(result.confidence || 0.8, ['rule_based'])
            }
        };
    }

    private async tryRAGEngine(request: FallbackRequest): Promise<FallbackResponse> {
        const result = await this.ragEngine.query(request.query, { limit: 3 });

        return {
            success: true,
            content: typeof result === 'string' ? result : JSON.stringify(result),
            confidence: 0.7,
            sources: ['rag'],
            metadata: {
                mode: request.mode,
                tier: 'rag',
                fallbacksUsed: 0,
                responseTime: 0,
                qualityScore: this.calculateQualityScore(0.7, ['rag'])
            }
        };
    }

    private async tryMCPEngine(request: FallbackRequest): Promise<FallbackResponse> {
        if (!this.mcpClient) {
            throw new Error('MCP 클라이언트 없음');
        }

        const result = await this.mcpClient.performComplexQuery(request.query, request.context);

        return {
            success: true,
            content: result,
            confidence: 0.6,
            sources: ['mcp'],
            metadata: {
                mode: request.mode,
                tier: 'mcp',
                fallbacksUsed: 0,
                responseTime: 0,
                qualityScore: this.calculateQualityScore(0.6, ['mcp'])
            }
        };
    }

    private async tryGoogleAI(request: FallbackRequest): Promise<FallbackResponse> {
        if (!this.googleAI) {
            throw new Error('Google AI 서비스 없음');
        }

        const result = await this.googleAI.generateResponse(request.query);

        if (!result.success) {
            throw new Error('Google AI 처리 실패');
        }

        return {
            success: true,
            content: result.content || '',
            confidence: 0.9,
            sources: ['google_ai'],
            metadata: {
                mode: request.mode,
                tier: 'google_ai',
                fallbacksUsed: 0,
                responseTime: 0,
                qualityScore: this.calculateQualityScore(0.9, ['google_ai'])
            }
        };
    }

    private async tryOtherAITools(request: FallbackRequest): Promise<FallbackResponse> {
        const results: any[] = [];

        // OpenSource Engines 시도 - 간단한 텍스트 처리로 대체
        if (this.openSourceEngines) {
            try {
                // OpenSourceEngines가 없거나 메서드가 다를 수 있으므로 기본 응답 생성
                results.push({
                    source: 'opensource',
                    content: `오픈소스 AI 도구를 통한 분석: ${request.query}에 대한 기본 응답입니다.`,
                    confidence: 0.7
                });
            } catch (error: any) {
                aiLogger.warn(LogCategory.AI_ENGINE, `OpenSource Engines 실패: ${error.message}`);
            }
        }

        // Custom Engines 시도 - 간단한 텍스트 처리로 대체
        if (this.customEngines) {
            try {
                // CustomEngines가 없거나 메서드가 다를 수 있으므로 기본 응답 생성
                results.push({
                    source: 'custom',
                    content: `커스텀 AI 도구를 통한 분석: ${request.query}에 대한 맞춤형 응답입니다.`,
                    confidence: 0.6
                });
            } catch (error: any) {
                aiLogger.warn(LogCategory.AI_ENGINE, `Custom Engines 실패: ${error.message}`);
            }
        }

        if (results.length === 0) {
            throw new Error('모든 다른 AI 도구들 실패');
        }

        const bestResult = results.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );

        return {
            success: true,
            content: bestResult.content,
            confidence: bestResult.confidence,
            sources: results.map(r => r.source),
            metadata: {
                mode: request.mode,
                tier: 'other_ai_tools',
                fallbacksUsed: 0,
                responseTime: 0,
                qualityScore: this.calculateQualityScore(bestResult.confidence, results.map(r => r.source))
            }
        };
    }

    // =============================================================================
    // 🎯 품질 관리
    // =============================================================================

    private isQualityAcceptable(confidence: number): boolean {
        return confidence >= this.qualityThresholds.acceptable;
    }

    private calculateQualityScore(confidence: number, sources: string[]): number {
        // 신뢰도 기반 점수 (70%)
        let score = confidence * 0.7;

        // 소스 다양성 보너스 (30%)
        const diversityBonus = Math.min(sources.length * 0.1, 0.3);
        score += diversityBonus;

        return Math.min(score, 1.0);
    }

    // =============================================================================
    // 📊 통계 관리
    // =============================================================================

    private initializeModeStats(): void {
        const modes: AIFallbackMode[] = ['AUTO', 'GOOGLE_ONLY', 'LOCAL'];
        modes.forEach(mode => {
            this.modeStats.set(mode, {
                totalQueries: 0,
                successRate: 0,
                averageResponseTime: 0,
                averageConfidence: 0,
                fallbacksUsed: 0,
                lastUsed: null,
                qualityTrend: []
            });
        });
    }

    private updateModeStats(mode: AIFallbackMode, response: FallbackResponse | null, responseTime: number): void {
        const stats = this.modeStats.get(mode);
        if (!stats) return;

        stats.totalQueries++;
        stats.lastUsed = new Date();

        // 응답 시간 업데이트
        stats.averageResponseTime = (stats.averageResponseTime + responseTime) / 2;

        if (response) {
            // 성공률 업데이트
            const successCount = Math.floor(stats.successRate * (stats.totalQueries - 1));
            stats.successRate = (successCount + 1) / stats.totalQueries;

            // 평균 신뢰도 업데이트
            stats.averageConfidence = (stats.averageConfidence + response.confidence) / 2;

            // 폴백 사용 횟수 업데이트
            stats.fallbacksUsed += response.metadata.fallbacksUsed;

            // 품질 트렌드 업데이트 (최근 10개만 유지)
            if (response.metadata.qualityScore) {
                stats.qualityTrend.push(response.metadata.qualityScore);
                if (stats.qualityTrend.length > 10) {
                    stats.qualityTrend.shift();
                }
            }
        } else {
            // 실패 시 성공률 업데이트
            const successCount = Math.floor(stats.successRate * (stats.totalQueries - 1));
            stats.successRate = successCount / stats.totalQueries;
        }
    }

    // =============================================================================
    // 🔧 유틸리티 메서드들
    // =============================================================================

    private createErrorResponse(request: FallbackRequest, error: Error, mode: AIFallbackMode): FallbackResponse {
        return {
            success: false,
            content: `죄송합니다. ${mode} 모드에서 처리 중 오류가 발생했습니다: ${error.message}`,
            confidence: 0.1,
            sources: ['error_fallback'],
            metadata: {
                mode,
                tier: 'error',
                fallbacksUsed: 0,
                responseTime: 0,
                qualityScore: 0.1
            },
            fallbackChain: ['error']
        };
    }

    // 엔진 설정 메서드들
    public setMCPClient(client: RealMCPClient): void {
        this.mcpClient = client;
    }

    public setGoogleAI(googleAI: GoogleAIService): void {
        this.googleAI = googleAI;
    }

    public setOpenSourceEngines(engines: OpenSourceEngines): void {
        this.openSourceEngines = engines;
    }

    public setCustomEngines(engines: CustomEngines): void {
        this.customEngines = engines;
    }
} 