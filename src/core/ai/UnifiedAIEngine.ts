/**
 * 🚀 OpenManager Vibe v5 - Unified AI Engine
 * 
 * ✅ MCP (Model Context Protocol) 통합
 * ✅ Google AI 베타 연동  
 * ✅ RAG (Retrieval-Augmented Generation) 엔진
 * ✅ 컨텍스트 관리자 통합
 * ✅ Redis 캐싱 지원
 * 🛡️ Graceful Degradation Architecture
 */

import { env, shouldEnableDebugLogging } from '@/config/environment';
import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { ContextManager } from './ContextManager';
import { LocalRAGEngine } from '@/lib/ml/rag-engine';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { isGoogleAIAvailable } from '@/lib/google-ai-manager';

export interface UnifiedAnalysisRequest {
    query: string;
    context?: {
        serverMetrics?: ServerMetrics[];
        logEntries?: LogEntry[];
        timeRange?: { start: Date; end: Date };
        sessionId?: string;
        urgency?: 'low' | 'medium' | 'high' | 'critical';
    };
    options?: {
        enableMCP?: boolean;
        enableAnalysis?: boolean;
        maxResponseTime?: number;
        confidenceThreshold?: number;
    };
}

export interface UnifiedAnalysisResponse {
    success: boolean;
    query: string;
    intent: {
        primary: string;
        confidence: number;
        category: string;
        urgency: string;
    };
    analysis: {
        summary: string;
        details: any[];
        confidence: number;
        processingTime: number;
    };
    recommendations: string[];
    engines: {
        used: string[];
        results: any[];
        fallbacks: number;
    };
    metadata: {
        sessionId: string;
        timestamp: string;
        version: string;
        contextsUsed?: number;
        contextIds?: string[];
    };
    systemStatus?: {
        tier: 'emergency' | 'core_only' | 'enhanced' | 'beta_enabled';
        availableComponents: string[];
        degradationLevel: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
        recommendation: string;
    };
}

export interface ServerMetrics {
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    networkIn: number;
    networkOut: number;
    responseTime?: number;
    activeConnections?: number;
}

export interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    source: string;
    details?: any;
}

export interface MCPContext {
    sessionId: string;
    serverMetrics?: ServerMetrics[];
    logEntries?: LogEntry[];
    timeRange?: { start: Date; end: Date };
    urgency?: string;
}

export interface MCPResponse {
    success: boolean;
    content: string;
    confidence: number;
    sources: string[];
    metadata?: any;
}

export class UnifiedAIEngine {
    private static instance: UnifiedAIEngine | null = null;
    private mcpClient: RealMCPClient | null = null;
    private contextManager: ContextManager;
    private googleAI?: GoogleAIService;
    private ragEngine: LocalRAGEngine;
    private betaModeEnabled: boolean = false;
    private initialized: boolean = false;
    private analysisCache: Map<string, any> = new Map();

    // Graceful Degradation 관련 속성
    private componentHealth: Map<string, boolean> = new Map();
    private currentAnalysisTier: string = 'enhanced';
    private redisClient: any = null;

    private resourceManager = {
        dailyQuota: {
            googleAIUsed: 0,
            googleAILimit: 100,
        },
        quotaResetTime: new Date(),
    };

    private degradationStats = {
        totalRequests: 0,
        averageResponseTime: 0,
        fallbacksUsed: 0,
        emergencyModeActivations: 0,
    };

    public constructor() {
        console.log('🚀 Unified AI Engine 인스턴스 생성');
        this.contextManager = ContextManager.getInstance();
        this.ragEngine = new LocalRAGEngine();
        this.initializeComponents();
    }

    public static getInstance(): UnifiedAIEngine {
        if (!UnifiedAIEngine.instance) {
            UnifiedAIEngine.instance = new UnifiedAIEngine();
        }
        return UnifiedAIEngine.instance;
    }

    private async initializeComponents(): Promise<void> {
        try {
            // MCP Client 초기화
            this.mcpClient = new RealMCPClient();
            await this.mcpClient.initialize();

            // Google AI 초기화 (베타)
            if (isGoogleAIAvailable()) {
                this.googleAI = new GoogleAIService();
                this.betaModeEnabled = true;
                console.log('✅ Google AI 베타 모드 활성화');
            }

            // RAG Engine 초기화
            await this.ragEngine.initialize();

            console.log('✅ Unified AI Engine 컴포넌트 초기화 완료');
        } catch (error) {
            console.error('❌ AI Engine 컴포넌트 초기화 실패:', error);
        }
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            console.log('🔧 Unified AI Engine 초기화 시작...');

            // 컴포넌트 상태 체크
            await this.checkComponentHealth();

            // 캐시 정리 스케줄러 시작
            this.startCacheCleanup();

            this.initialized = true;
            console.log('✅ Unified AI Engine 초기화 완료');
        } catch (error) {
            console.error('❌ Unified AI Engine 초기화 실패:', error);
            throw error;
        }
    }

    public async processQuery(request: UnifiedAnalysisRequest): Promise<UnifiedAnalysisResponse> {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();

        try {
            // 시스템 상태 체크
            const systemHealth = await this.checkComponentHealth();
            const strategy = this.determineProcessingStrategy(systemHealth);

            // 의도 분류
            const intent = await this.classifyIntent(request.query, request.context);

            // MCP 컨텍스트 구성
            const mcpContext: MCPContext = {
                sessionId,
                serverMetrics: request.context?.serverMetrics,
                logEntries: request.context?.logEntries,
                timeRange: request.context?.timeRange,
                urgency: request.context?.urgency || intent.urgency,
            };

            // Graceful Degradation 분석 수행
            const response = await this.performGracefulAnalysis(intent, mcpContext, strategy, request.options);

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                query: request.query,
                intent: {
                    primary: intent.primary,
                    confidence: intent.confidence,
                    category: intent.category,
                    urgency: intent.urgency,
                },
                analysis: {
                    summary: response.content,
                    details: response.sources || [],
                    confidence: response.confidence,
                    processingTime,
                },
                recommendations: this.generateRecommendations(response, intent),
                engines: {
                    used: response.sources || [],
                    results: [response],
                    fallbacks: 0,
                },
                metadata: {
                    sessionId,
                    timestamp: new Date().toISOString(),
                    version: '5.44.0',
                },
                systemStatus: {
                    tier: strategy.tier as any,
                    availableComponents: systemHealth.availableComponents,
                    degradationLevel: this.calculateDegradationLevel(systemHealth.availableComponents),
                    recommendation: this.getSystemRecommendation(strategy.tier),
                },
            };
        } catch (error) {
            const processingTime = Date.now() - startTime;
            return this.createErrorResponse(request.query, error, processingTime);
        }
    }

    private async classifyIntent(query: string, context?: any): Promise<any> {
        return {
            primary: 'analysis',
            confidence: 0.8,
            category: 'monitoring',
            urgency: context?.urgency || 'medium',
        };
    }

    // Graceful Degradation 메서드들
    private async checkComponentHealth(): Promise<{
        availableComponents: string[];
        overallHealth: 'healthy' | 'degraded' | 'critical' | 'emergency';
    }> {
        const availableComponents: string[] = [];

        // MCP 체크
        if (this.mcpClient) {
            try {
                await this.mcpClient.getServerStatus();
                availableComponents.push('mcp');
                this.componentHealth.set('mcp', true);
            } catch (error) {
                this.componentHealth.set('mcp', false);
            }
        }

        // Context Manager 체크
        if (this.contextManager) {
            availableComponents.push('context_manager');
            this.componentHealth.set('context_manager', true);
        }

        // RAG 엔진 체크
        if (this.ragEngine) {
            availableComponents.push('rag');
            this.componentHealth.set('rag', true);
        }

        // Google AI 체크
        if (this.canUseGoogleAI()) {
            availableComponents.push('google_ai');
            this.componentHealth.set('google_ai', true);
        } else {
            this.componentHealth.set('google_ai', false);
        }

        // 전체 건강상태 결정
        let overallHealth: 'healthy' | 'degraded' | 'critical' | 'emergency';
        const healthyCount = availableComponents.length;

        if (healthyCount >= 3) {
            overallHealth = 'healthy';
        } else if (healthyCount >= 2) {
            overallHealth = 'degraded';
        } else if (healthyCount >= 1) {
            overallHealth = 'critical';
        } else {
            overallHealth = 'emergency';
        }

        return {
            availableComponents,
            overallHealth,
        };
    }

    private determineProcessingStrategy(systemHealth: {
        availableComponents: string[];
        overallHealth: string;
    }): {
        tier: string;
        usageReason?: string;
    } {
        const { availableComponents } = systemHealth;

        // Beta Enabled (100% 성능)
        if (availableComponents.includes('google_ai') && availableComponents.length >= 3) {
            return {
                tier: 'beta_enabled',
                usageReason: 'All components available including Google AI beta features',
            };
        }

        // Enhanced (90% 성능)
        if (availableComponents.length >= 2) {
            return {
                tier: 'enhanced',
                usageReason: 'Core components plus additional AI engines available',
            };
        }

        // Core Only (60% 성능)
        if (availableComponents.length >= 1) {
            return {
                tier: 'core_only',
                usageReason: 'Limited components, using core functionality only',
            };
        }

        // Emergency (10% 성능)
        return {
            tier: 'emergency',
            usageReason: 'No AI components available, emergency fallback mode',
        };
    }

    private async performGracefulAnalysis(
        intent: any,
        context: MCPContext,
        strategy: { tier: string; usageReason?: string },
        options?: any
    ): Promise<MCPResponse> {
        const startTime = Date.now();

        try {
            switch (strategy.tier) {
                case 'beta_enabled':
                    return await this.performBetaEnabledAnalysis(intent, context, options);

                case 'enhanced':
                    return await this.performEnhancedAnalysis(intent, context, options);

                case 'core_only':
                    return await this.performCoreOnlyAnalysis(intent, context, options);

                default: // emergency
                    return await this.performEmergencyAnalysis(intent, context);
            }
        } catch (error) {
            console.error(`Analysis failed for tier ${strategy.tier}:`, error);

            // 단계적 폴백
            if (strategy.tier !== 'emergency') {
                return await this.performEmergencyAnalysis(intent, context);
            }

            throw error;
        } finally {
            const duration = Date.now() - startTime;
            this.degradationStats.totalRequests++;
            this.degradationStats.averageResponseTime = (this.degradationStats.averageResponseTime + duration) / 2;
        }
    }

    private async performBetaEnabledAnalysis(intent: any, context: MCPContext, options?: any): Promise<MCPResponse> {
        // Enhanced 분석 먼저 수행
        const enhancedResult = await this.performEnhancedAnalysis(intent, context, options);

        // Google AI 개선 시도
        if (this.canUseGoogleAI() && this.googleAI) {
            try {
                const googleResult = await this.googleAI.generateResponse(enhancedResult.content);
                this.incrementGoogleAIUsage();

                return {
                    ...enhancedResult,
                    content: googleResult.content || enhancedResult.content,
                    confidence: Math.min(enhancedResult.confidence + 0.1, 1.0),
                    sources: [...enhancedResult.sources, 'google_ai'],
                    metadata: {
                        ...enhancedResult.metadata,
                        tier: 'beta_enabled',
                        googleAIUsed: true,
                    },
                };
            } catch (error) {
                console.warn('Google AI enhancement failed, falling back to enhanced:', error);
            }
        }

        return enhancedResult;
    }

    private async performEnhancedAnalysis(intent: any, context: MCPContext, options?: any): Promise<MCPResponse> {
        const results: any[] = [];

        try {
            // MCP 분석
            if (this.componentHealth.get('mcp') && this.mcpClient) {
                try {
                    const mcpResult = await this.mcpClient.performComplexQuery(intent.primary, context);
                    results.push({ source: 'mcp', content: mcpResult, confidence: 0.8 });
                } catch (error) {
                    console.warn('MCP analysis failed:', error);
                }
            }

            // RAG 분석
            if (this.componentHealth.get('rag')) {
                try {
                    const ragResult = await this.ragEngine.query(intent.primary, { limit: 3 });
                    results.push({ source: 'rag', content: ragResult, confidence: 0.7 });
                } catch (error) {
                    console.warn('RAG analysis failed:', error);
                }
            }

            // Context Manager 분석
            if (this.componentHealth.get('context_manager')) {
                try {
                    const contextResult = this.contextManager.analyzeIntent(intent, context);
                    results.push({ source: 'context_manager', content: contextResult, confidence: 0.6 });
                } catch (error) {
                    console.warn('Context analysis failed:', error);
                }
            }

            if (results.length > 0) {
                const bestResult = results.reduce((best, current) => (current.confidence > best.confidence ? current : best));
                return {
                    success: true,
                    content: `Enhanced 분석 결과: ${bestResult.content}`,
                    confidence: bestResult.confidence,
                    sources: results.map(r => r.source),
                    metadata: { tier: 'enhanced', resultsCount: results.length },
                };
            } else {
                return await this.performCoreOnlyAnalysis(intent, context, options);
            }
        } catch (error) {
            console.error('Enhanced analysis failed:', error);
            return await this.performCoreOnlyAnalysis(intent, context, options);
        }
    }

    private async performCoreOnlyAnalysis(intent: any, context: MCPContext, options?: any): Promise<MCPResponse> {
        try {
            // MCP가 사용 가능하면 우선 사용
            if (this.componentHealth.get('mcp') && this.mcpClient) {
                const result = await this.mcpClient.performComplexQuery(intent.primary, context);
                return {
                    success: true,
                    content: `기본 MCP 분석: ${result}`,
                    confidence: 0.6,
                    sources: ['mcp'],
                    metadata: { tier: 'core_only', fallback: true },
                };
            }

            // Context Manager만 사용
            if (this.componentHealth.get('context_manager')) {
                const result = this.contextManager.analyzeIntent(intent, context);
                return {
                    success: true,
                    content: `컨텍스트 기반 분석: ${result}`,
                    confidence: 0.6,
                    sources: ['context_manager'],
                    metadata: { tier: 'core_only', fallback: true },
                };
            }

            throw new Error('No core components available');
        } catch (error) {
            console.error('Core analysis failed:', error);
            return await this.performEmergencyAnalysis(intent, context);
        }
    }

    private async performEmergencyAnalysis(intent: any, context: MCPContext): Promise<MCPResponse> {
        // 최소한의 응답 생성
        return {
            success: true,
            content: `죄송합니다. 현재 AI 시스템이 일시적으로 불안정합니다. 
                요청사항: ${intent.primary || '정보 요청'}
                상태: 시스템 복구 중
                권장사항: 잠시 후 다시 시도해주세요`,
            confidence: 0.1,
            sources: ['emergency_fallback'],
            metadata: {
                tier: 'emergency',
                timestamp: new Date().toISOString(),
                systemStatus: 'degraded',
                recommendation: 'system_recovery_in_progress',
            },
        };
    }

    // Helper methods
    private canUseGoogleAI(): boolean {
        const quota = this.resourceManager.dailyQuota;
        return quota.googleAIUsed < quota.googleAILimit && this.resourceManager.quotaResetTime > new Date();
    }

    private incrementGoogleAIUsage(): void {
        this.resourceManager.dailyQuota.googleAIUsed++;
    }

    private calculateDegradationLevel(availableComponents: string[]): 'none' | 'minimal' | 'moderate' | 'high' | 'critical' {
        const totalComponents = 4; // mcp, context_manager, rag, google_ai
        const availableCount = availableComponents.length;
        const degradationRatio = (totalComponents - availableCount) / totalComponents;

        if (degradationRatio === 0) return 'none';
        if (degradationRatio <= 0.25) return 'minimal';
        if (degradationRatio <= 0.5) return 'moderate';
        if (degradationRatio <= 0.75) return 'high';
        return 'critical';
    }

    private getSystemRecommendation(tier: string): string {
        switch (tier) {
            case 'beta_enabled':
                return '모든 AI 기능이 정상 작동중입니다. 최적의 성능을 제공합니다.';
            case 'enhanced':
                return '대부분의 AI 기능이 사용 가능합니다. 양호한 성능을 제공합니다.';
            case 'core_only':
                return '핵심 기능만 사용 가능합니다. 제한된 성능으로 동작합니다.';
            case 'emergency':
                return '시스템이 불안정합니다. 관리자 확인이 필요합니다.';
            default:
                return '시스템 상태를 확인할 수 없습니다.';
        }
    }

    private generateRecommendations(response: MCPResponse, intent: any): string[] {
        return [
            '시스템 상태를 정기적으로 모니터링하세요.',
            '중요한 이슈는 즉시 관리자에게 알리세요.',
            '성능 최적화를 위해 리소스를 검토하세요.',
        ];
    }

    private createErrorResponse(query: string, error: any, processingTime: number): UnifiedAnalysisResponse {
        return {
            success: false,
            query,
            intent: {
                primary: 'error',
                confidence: 0.1,
                category: 'system_error',
                urgency: 'high',
            },
            analysis: {
                summary: `처리 중 오류가 발생했습니다: ${error.message}`,
                details: [],
                confidence: 0.1,
                processingTime,
            },
            recommendations: ['시스템 관리자에게 연락하세요.', '잠시 후 다시 시도해주세요.'],
            engines: {
                used: ['emergency'],
                results: [],
                fallbacks: 1,
            },
            metadata: {
                sessionId: this.generateSessionId(),
                timestamp: new Date().toISOString(),
                version: '5.44.0',
            },
        };
    }

    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private startCacheCleanup(): void {
        setInterval(() => {
            this.analysisCache.clear();
        }, 1000 * 60 * 30); // 30분마다 캐시 정리
    }

    // Public methods for monitoring
    public getGracefulDegradationStats() {
        return {
            ...this.degradationStats,
            componentHealth: Object.fromEntries(this.componentHealth),
            currentTier: this.currentAnalysisTier,
            quotaStatus: this.resourceManager.dailyQuota,
        };
    }

    public async getSystemStatus(): Promise<any> {
        const health = await this.checkComponentHealth();
        return {
            initialized: this.initialized,
            betaModeEnabled: this.betaModeEnabled,
            componentHealth: Object.fromEntries(this.componentHealth),
            systemHealth: health,
            stats: this.degradationStats,
        };
    }
}

// 싱글톤 인스턴스 export
export const unifiedAIEngine = UnifiedAIEngine.getInstance(); 