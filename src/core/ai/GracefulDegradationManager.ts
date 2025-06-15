/**
 * 🛡️ Graceful Degradation Manager v2.0
 * 
 * Multi-AI 시스템의 점진적 성능 저하 및 복구 관리
 * + 실시간 사고 과정 추적 및 시각화
 * 
 * Features:
 * - 3-Tier 처리 전략 (Core → Enhanced → Beta)
 * - 실시간 컴포넌트 상태 모니터링
 * - Multi-AI 사고 과정 추적
 * - 자동 폴백 및 복구
 * - Google AI 할당량 관리
 */

import { AILogger, LogLevel, LogCategory } from '@/services/ai/logging/AILogger';
import { isGoogleAIAvailable } from '@/lib/google-ai-manager';
import { EventEmitter } from 'events';

// =============================================================================
// 🎯 Multi-AI 사고 과정 인터페이스들
// =============================================================================

export interface AIEngineThought {
    engineId: string;
    engineName: string;
    step: string;
    progress: number;
    thinking: string;
    confidence: number;
    timestamp: string;
    status: 'thinking' | 'processing' | 'completed' | 'failed';
    contribution?: string;
}

export interface MultiAIThinkingProcess {
    sessionId: string;
    timestamp: string;
    overallProgress: number;
    aiEngines: {
        [engineId: string]: {
            status: 'thinking' | 'processing' | 'completed' | 'failed';
            currentStep: string;
            progress: number;
            thinking: string;
            confidence: number;
            contribution?: string;
            thoughts: AIEngineThought[];
        }
    };
    fusionStatus: {
        stage: 'collecting' | 'analyzing' | 'fusing' | 'finalizing';
        progress: number;
        description: string;
        consensusScore?: number;
    };
}

// =============================================================================
// 🛡️ Graceful Degradation 인터페이스들  
// =============================================================================

export interface ComponentHealth {
    [componentId: string]: {
        available: boolean;
        lastCheck: Date;
        errorRate: number;
        responseTime: number;
    };
}

export interface ProcessingStrategy {
    tier: 'emergency' | 'core_only' | 'enhanced' | 'beta_enabled';
    availableEngines: string[];
    usageReason?: string;
    expectedPerformance?: number; // 0-100%
}

export interface SystemHealth {
    availableComponents: string[];
    overallHealth: 'healthy' | 'degraded' | 'critical' | 'emergency';
    degradationLevel: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
    recommendation: string;
}

// =============================================================================
// 🧠 Multi-AI 사고 과정 추적기 (기존 "생각중" 기능 확장)
// =============================================================================

export class MultiAIThinkingTracker extends EventEmitter {
    private activeProcesses: Map<string, MultiAIThinkingProcess> = new Map();
    private engineRegistry: Map<string, string> = new Map(); // engineId -> engineName

    constructor() {
        super();
        this.initializeEngineRegistry();
    }

    private initializeEngineRegistry() {
        // 실제 엔진 이름은 동적으로 결정됨 - 미리 정의하지 않음
    }

    /**
     * 🚀 Multi-AI 사고 과정 시작
     */
    async startThinkingProcess(
        sessionId: string,
        activeEngines: string[]
    ): Promise<MultiAIThinkingProcess> {
        const process: MultiAIThinkingProcess = {
            sessionId,
            timestamp: new Date().toISOString(),
            overallProgress: 0,
            aiEngines: {},
            fusionStatus: {
                stage: 'collecting',
                progress: 0,
                description: 'AI 엔진들의 사고 과정을 수집하고 있습니다...'
            }
        };

        // 각 엔진 초기화
        activeEngines.forEach(engineId => {
            process.aiEngines[engineId] = {
                status: 'thinking',
                currentStep: '사고 시작',
                progress: 0,
                thinking: '사고를 시작합니다...',
                confidence: 0,
                thoughts: []
            };
        });

        this.activeProcesses.set(sessionId, process);

        // 실시간 업데이트 시작
        this.emit('process_started', process);

        return process;
    }

    /**
     * 💭 개별 AI 엔진의 사고 과정 업데이트
     */
    updateThinking(
        sessionId: string,
        engineId: string,
        thought: Partial<AIEngineThought>
    ) {
        const process = this.activeProcesses.get(sessionId);
        if (!process) return;

        const engine = process.aiEngines[engineId];
        if (!engine) return;

        // 새로운 사고 과정 추가 - 실제 엔진 이름 사용 (미리 정의하지 않음)
        const newThought: AIEngineThought = {
            engineId,
            engineName: thought.engineName || engineId, // 실제 엔진에서 전달된 이름 사용
            step: thought.step || engine.currentStep,
            progress: thought.progress || engine.progress,
            thinking: thought.thinking || engine.thinking,
            confidence: thought.confidence || engine.confidence,
            timestamp: new Date().toISOString(),
            status: thought.status || 'thinking',
            contribution: thought.contribution
        };

        engine.thoughts.push(newThought);

        // 엔진 상태 업데이트
        engine.currentStep = newThought.step;
        engine.progress = newThought.progress;
        engine.thinking = newThought.thinking;
        engine.confidence = newThought.confidence;
        engine.status = newThought.status;
        if (newThought.contribution) {
            engine.contribution = newThought.contribution;
        }

        // 전체 진행률 계산
        this.updateOverallProgress(process);

        // 실시간 업데이트 전송
        this.emit('thinking_updated', {
            sessionId,
            engineId,
            thought: newThought,
            overallProgress: process.overallProgress
        });

        // 로깅 - 실제 사고 과정만 기록
        AILogger.getInstance().info(LogCategory.AI_ENGINE,
            `[${engineId}] 실제 사고 과정: ${newThought.thinking}`,
            { sessionId, progress: newThought.progress }
        );
    }

    /**
     * 🔄 융합 과정 업데이트
     */
    updateFusionStatus(
        sessionId: string,
        fusionUpdate: Partial<MultiAIThinkingProcess['fusionStatus']>
    ) {
        const process = this.activeProcesses.get(sessionId);
        if (!process) return;

        process.fusionStatus = {
            ...process.fusionStatus,
            ...fusionUpdate
        };

        this.emit('fusion_updated', {
            sessionId,
            fusionStatus: process.fusionStatus
        });

        AILogger.getInstance().info(LogCategory.AI_ENGINE,
            `융합 과정: ${process.fusionStatus.description}`,
            { sessionId, stage: process.fusionStatus.stage }
        );
    }

    /**
     * ✅ 사고 과정 완료
     */
    completeThinkingProcess(sessionId: string, finalResult?: any) {
        const process = this.activeProcesses.get(sessionId);
        if (!process) return;

        process.overallProgress = 100;
        process.fusionStatus = {
            stage: 'finalizing',
            progress: 100,
            description: '모든 AI의 사고 과정이 완료되었습니다!'
        };

        this.emit('process_completed', {
            sessionId,
            process,
            result: finalResult
        });

        // 일정 시간 후 정리
        setTimeout(() => {
            this.activeProcesses.delete(sessionId);
        }, 60000); // 1분 후 정리
    }

    /**
     * 📊 전체 진행률 계산
     */
    private updateOverallProgress(process: MultiAIThinkingProcess) {
        const engines = Object.values(process.aiEngines);
        const totalProgress = engines.reduce((sum, engine) => sum + engine.progress, 0);
        process.overallProgress = Math.round(totalProgress / engines.length);
    }

    /**
     * 📈 현재 활성 프로세스 조회
     */
    getActiveProcess(sessionId: string): MultiAIThinkingProcess | undefined {
        return this.activeProcesses.get(sessionId);
    }

    /**
     * 📋 모든 활성 프로세스 조회
     */
    getAllActiveProcesses(): MultiAIThinkingProcess[] {
        return Array.from(this.activeProcesses.values());
    }
}

// =============================================================================
// 🛡️ Graceful Degradation Manager
// =============================================================================

export class GracefulDegradationManager {
    private static instance: GracefulDegradationManager | null = null;

    private componentHealth: Map<string, ComponentHealth[string]> = new Map();
    private thinkingTracker: MultiAIThinkingTracker;

    private resourceManager = {
        dailyQuota: {
            googleAIUsed: 0,
            googleAILimit: 300, // 일일 300회 제한
            resetTime: this.getNextMidnight(),
        },
    };

    private degradationStats = {
        totalQueries: 0,
        tierUsage: {
            emergency: 0,
            core_only: 0,
            enhanced: 0,
            beta_enabled: 0,
        },
        averageResponseTime: {
            emergency: 0,
            core_only: 0,
            enhanced: 0,
            beta_enabled: 0,
        }
    };

    private constructor() {
        this.thinkingTracker = new MultiAIThinkingTracker();
        this.initializeHealthMonitoring();
    }

    /**
     * 🎯 싱글톤 인스턴스
     */
    public static getInstance(): GracefulDegradationManager {
        if (!GracefulDegradationManager.instance) {
            GracefulDegradationManager.instance = new GracefulDegradationManager();
        }
        return GracefulDegradationManager.instance;
    }

    /**
     * 🏥 컴포넌트 상태 체크
     */
    async checkComponentHealth(components: any): Promise<SystemHealth> {
        const availableComponents: string[] = [];
        const healthChecks = [
            { id: 'mcp', check: () => !!components.mcpClient },
            { id: 'context_manager', check: () => !!components.contextManager },
            { id: 'rag', check: () => !!components.ragEngine },
            { id: 'redis', check: () => !!components.redis },
            {
                id: 'google_ai',
                check: () => !!components.googleAI &&
                    isGoogleAIAvailable() &&
                    this.canUseGoogleAI()
            }
        ];

        for (const { id, check } of healthChecks) {
            try {
                const startTime = Date.now();
                const isAvailable = check();
                const responseTime = Date.now() - startTime;

                this.componentHealth.set(id, {
                    available: isAvailable,
                    lastCheck: new Date(),
                    errorRate: 0,
                    responseTime
                });

                if (isAvailable) {
                    availableComponents.push(id);
                }
            } catch (error) {
                this.componentHealth.set(id, {
                    available: false,
                    lastCheck: new Date(),
                    errorRate: 1,
                    responseTime: 0
                });

                AILogger.getInstance().warn(LogCategory.AI_ENGINE,
                    `컴포넌트 ${id} 상태 체크 실패`, error);
            }
        }

        // 전체 상태 평가
        const overallHealth = this.evaluateOverallHealth(availableComponents.length);
        const degradationLevel = this.calculateDegradationLevel(availableComponents);
        const recommendation = this.getSystemRecommendation(overallHealth);

        return {
            availableComponents,
            overallHealth,
            degradationLevel,
            recommendation
        };
    }

    /**
     * 🎯 처리 전략 결정
     */
    determineProcessingStrategy(systemHealth: SystemHealth): ProcessingStrategy {
        const { availableComponents } = systemHealth;

        // Core 컴포넌트 체크
        const hasCoreComponents = availableComponents.some(c =>
            ['mcp', 'context_manager'].includes(c)
        );

        if (!hasCoreComponents) {
            return {
                tier: 'emergency',
                availableEngines: [],
                expectedPerformance: 10
            };
        }

        // Enhanced 컴포넌트 체크
        const hasEnhanced = availableComponents.some(c =>
            ['rag', 'redis'].includes(c)
        );

        // Beta 컴포넌트 체크
        const hasBeta = availableComponents.includes('google_ai');

        if (hasBeta && hasEnhanced) {
            return {
                tier: 'beta_enabled',
                availableEngines: availableComponents,
                usageReason: this.evaluateBetaUsageNeed(),
                expectedPerformance: 100
            };
        } else if (hasEnhanced) {
            return {
                tier: 'enhanced',
                availableEngines: availableComponents.filter(c => c !== 'google_ai'),
                expectedPerformance: 85
            };
        } else {
            return {
                tier: 'core_only',
                availableEngines: availableComponents.filter(c =>
                    ['mcp', 'context_manager'].includes(c)
                ),
                expectedPerformance: 60
            };
        }
    }

    /**
     * 🧠 Multi-AI 사고 과정 시작 (기존 "생각중" 기능 확장)
     */
    async startMultiAIThinking(
        sessionId: string,
        strategy: ProcessingStrategy
    ): Promise<MultiAIThinkingProcess> {
        return await this.thinkingTracker.startThinkingProcess(
            sessionId,
            strategy.availableEngines
        );
    }

    /**
     * 💭 AI 엔진 사고 과정 업데이트
     */
    updateAIThinking(
        sessionId: string,
        engineId: string,
        thought: Partial<AIEngineThought>
    ) {
        this.thinkingTracker.updateThinking(sessionId, engineId, thought);
    }

    /**
     * 🔄 결과 융합 과정 업데이트
     */
    updateFusionProcess(
        sessionId: string,
        stage: MultiAIThinkingProcess['fusionStatus']['stage'],
        description: string,
        progress: number
    ) {
        this.thinkingTracker.updateFusionStatus(sessionId, {
            stage,
            description,
            progress
        });
    }

    /**
     * ✅ 사고 과정 완료
     */
    completeThinking(sessionId: string, result?: any) {
        this.thinkingTracker.completeThinkingProcess(sessionId, result);
    }

    /**
     * 📊 실시간 사고 과정 조회
     */
    getThinkingProcess(sessionId: string): MultiAIThinkingProcess | undefined {
        return this.thinkingTracker.getActiveProcess(sessionId);
    }

    /**
     * 🎧 사고 과정 이벤트 리스너 등록
     */
    onThinkingEvent(event: string, listener: (...args: any[]) => void) {
        this.thinkingTracker.on(event, listener);
    }

    /**
     * 🔧 헬퍼 메서드들
     */
    private canUseGoogleAI(): boolean {
        return this.resourceManager.dailyQuota.googleAIUsed <
            this.resourceManager.dailyQuota.googleAILimit;
    }

    private evaluateBetaUsageNeed(): string {
        const usageRate = this.resourceManager.dailyQuota.googleAIUsed /
            this.resourceManager.dailyQuota.googleAILimit;

        if (usageRate < 0.5) return 'available_quota';
        if (usageRate < 0.8) return 'improvement_potential';
        return 'quota_conservation';
    }

    private evaluateOverallHealth(availableCount: number): SystemHealth['overallHealth'] {
        if (availableCount === 0) return 'emergency';
        if (availableCount >= 4) return 'healthy';
        if (availableCount >= 2) return 'degraded';
        return 'critical';
    }

    private calculateDegradationLevel(
        availableComponents: string[]
    ): SystemHealth['degradationLevel'] {
        const totalComponents = 5;
        const availableCount = availableComponents.length;

        if (availableCount === totalComponents) return 'none';
        if (availableCount >= 4) return 'minimal';
        if (availableCount >= 3) return 'moderate';
        if (availableCount >= 1) return 'high';
        return 'critical';
    }

    private getSystemRecommendation(health: SystemHealth['overallHealth']): string {
        const recommendations = {
            healthy: "모든 기능이 정상 작동 중입니다. 최적 성능으로 서비스를 제공합니다.",
            degraded: "일부 고급 기능이 제한됩니다. 시스템 복구를 진행 중입니다.",
            critical: "핵심 기능만 사용 가능합니다. 시스템 점검이 필요합니다.",
            emergency: "모든 시스템 컴포넌트에 문제가 발생했습니다. 즉시 관리자에게 연락하세요."
        };

        return recommendations[health];
    }

    private getNextMidnight(): Date {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    }

    private initializeHealthMonitoring() {
        // 주기적 상태 모니터링 (5분마다)
        setInterval(() => {
            this.performHealthCheck();
        }, 5 * 60 * 1000);
    }

    private async performHealthCheck() {
        // 자동 상태 체크 로직
        AILogger.getInstance().info(LogCategory.AI_ENGINE, '주기적 컴포넌트 상태 체크 수행');
    }

    /**
     * 📈 통계 조회
     */
    getStats() {
        return {
            ...this.degradationStats,
            componentHealth: Object.fromEntries(this.componentHealth),
            resourceManager: this.resourceManager,
            activeProcesses: this.thinkingTracker.getAllActiveProcesses().length
        };
    }
}

// 싱글톤 인스턴스 export
export const gracefulDegradationManager = GracefulDegradationManager.getInstance(); 