/**
 * 🤖 Google AI Mode Manager
 * 
 * Google AI의 3가지 운영 모드를 관리:
 * - AUTO: MCP/RAG 백업으로 Google AI 사용
 * - LOCAL: Google AI 완전 비활성화, MCP+RAG만 사용
 * - GOOGLE_ONLY: Google AI 단독 동작
 */

import { DualCoreOrchestrator, DualCoreResult } from './DualCoreOrchestrator';
import { GoogleAIService } from '@/services/ai/GoogleAIService';

export type GoogleAIMode = 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY';

export interface GoogleAIModeConfig {
    mode: GoogleAIMode;
    fallbackTimeout: number;
    confidenceThreshold: number;
    enableAutoSwitch: boolean;
    maxRetries: number;
}

export interface GoogleAIResult {
    success: boolean;
    mode: GoogleAIMode;
    response: string;
    confidence: number;
    sources: string[];
    suggestions: string[];
    processingTime: number;
    fallbackUsed: boolean;
    engineDetails: any;
}

export class GoogleAIModeManager {
    private dualCore: DualCoreOrchestrator;
    private googleAI: GoogleAIService;
    private config: GoogleAIModeConfig;
    private currentMode: GoogleAIMode;
    private stats: any;

    constructor(config?: Partial<GoogleAIModeConfig>) {
        this.config = {
            mode: 'AUTO',
            fallbackTimeout: 5000,
            confidenceThreshold: 0.7,
            enableAutoSwitch: true,
            maxRetries: 2,
            ...config,
        };

        this.currentMode = this.config.mode;
        this.dualCore = new DualCoreOrchestrator();
        this.googleAI = new GoogleAIService();

        this.stats = {
            totalQueries: 0,
            modeUsage: { AUTO: 0, LOCAL: 0, GOOGLE_ONLY: 0 },
            googleAISuccessRate: 100,
            fallbackRate: 0,
            averageResponseTime: 0,
        };

        console.log(`🤖 Google AI Mode Manager 생성됨 (모드: ${this.currentMode})`);
    }

    public async initialize(): Promise<void> {
        try {
            console.log('🚀 Google AI Mode Manager 초기화 시작...');
            await this.dualCore.initialize();

            if (this.currentMode !== 'LOCAL') {
                try {
                    await this.googleAI.initialize();
                    console.log('✅ Google AI 서비스 초기화 완료');
                } catch (error) {
                    console.warn('⚠️ Google AI 초기화 실패, LOCAL 모드로 전환:', error);
                    if (this.config.enableAutoSwitch) {
                        this.currentMode = 'LOCAL';
                    }
                }
            }

            console.log(`✅ Google AI Mode Manager 초기화 완료 (최종 모드: ${this.currentMode})`);
        } catch (error) {
            console.error('❌ Google AI Mode Manager 초기화 실패:', error);
            throw error;
        }
    }

    public async processQuery(query: string, options?: any): Promise<GoogleAIResult> {
        const startTime = Date.now();
        this.stats.totalQueries++;

        const activeMode = options?.forceMode || this.currentMode;
        this.stats.modeUsage[activeMode]++;

        try {
            let result: GoogleAIResult;

            switch (activeMode) {
                case 'AUTO':
                    result = await this.processAutoMode(query, options);
                    break;
                case 'LOCAL':
                    result = await this.processLocalMode(query, options);
                    break;
                case 'GOOGLE_ONLY':
                    result = await this.processGoogleOnlyMode(query, options);
                    break;
                default:
                    throw new Error(`지원하지 않는 모드: ${activeMode}`);
            }

            const responseTime = Date.now() - startTime;
            this.updateStats(result, responseTime);

            return result;
        } catch (error) {
            console.error(`❌ ${activeMode} 모드 처리 실패:`, error);
            return this.createEmergencyFallback(query, activeMode, Date.now() - startTime);
        }
    }

    private async processAutoMode(query: string, options?: any): Promise<GoogleAIResult> {
        const startTime = Date.now();

        try {
            console.log('🔄 AUTO 모드: MCP+RAG 우선, Google AI 백업');

            // 1단계: Dual-Core (MCP+RAG) 먼저 시도
            let dualCoreResult: any = null;
            let dualCoreError: any = null;

            try {
                console.log('🥇 1단계: Dual-Core (MCP+RAG) 시도');
                dualCoreResult = await this.dualCore.search(query, {
                    maxResults: options?.maxResults,
                    enableFusion: true,
                });

                // Dual-Core 성공 시 바로 반환 (Google AI 사용 안함)
                if (dualCoreResult.success && dualCoreResult.fusedResult.confidence >= this.config.confidenceThreshold) {
                    console.log('✅ Dual-Core 성공 - Google AI 백업 불필요');
                    return {
                        success: true,
                        mode: 'AUTO',
                        response: dualCoreResult.fusedResult.response,
                        confidence: dualCoreResult.fusedResult.confidence,
                        sources: dualCoreResult.fusedResult.sources,
                        suggestions: dualCoreResult.fusedResult.suggestions,
                        processingTime: Date.now() - startTime,
                        fallbackUsed: false,
                        engineDetails: {
                            dualCore: {
                                used: true,
                                success: true,
                                responseTime: Date.now() - startTime,
                                engineStatus: dualCoreResult.engineStatus,
                            },
                            googleAI: {
                                used: false,
                                reason: 'dual_core_sufficient'
                            }
                        },
                    };
                }
            } catch (error) {
                dualCoreError = error;
                console.warn('⚠️ Dual-Core 실패, Google AI 백업 시도:', error);
            }

            // 2단계: Dual-Core 실패 시에만 Google AI 백업 사용
            console.log('🆘 2단계: Google AI 백업 시도 (Dual-Core 실패)');

            let lastGoogleError: any = null;
            for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
                try {
                    const googleAIResult = await this.googleAI.generateContent(query);

                    if (googleAIResult?.confidence >= 0.3) {
                        console.log('✅ Google AI 백업 성공');
                        return {
                            success: true,
                            mode: 'AUTO',
                            response: googleAIResult.content || '응답을 생성했습니다.',
                            confidence: googleAIResult.confidence * 0.9, // 백업 사용 페널티
                            sources: ['Google AI (백업)'],
                            suggestions: [],
                            processingTime: Date.now() - startTime,
                            fallbackUsed: true,
                            engineDetails: {
                                dualCore: {
                                    used: true,
                                    success: false,
                                    error: dualCoreError?.message,
                                },
                                googleAI: {
                                    used: true,
                                    success: true,
                                    responseTime: Date.now() - startTime,
                                    attempt: attempt,
                                },
                            },
                        };
                    }
                } catch (error) {
                    lastGoogleError = error;
                    console.warn(`⚠️ Google AI 백업 시도 ${attempt}/${this.config.maxRetries} 실패:`, error);

                    if (attempt < this.config.maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            }

            // 모든 시도 실패 시 긴급 폴백
            console.error('❌ 모든 엔진 실패 - 긴급 폴백 사용');
            throw new Error(`모든 엔진 실패: Dual-Core(${dualCoreError?.message}), Google AI(${lastGoogleError?.message})`);

        } catch (error) {
            console.error('❌ AUTO 모드 처리 실패:', error);
            return this.createEmergencyFallback(query, 'AUTO', Date.now() - startTime);
        }
    }

    private async processLocalMode(query: string, options?: any): Promise<GoogleAIResult> {
        const startTime = Date.now();

        try {
            console.log('🏠 LOCAL 모드: Dual-Core 전용 처리');

            const dualCoreResult = await this.dualCore.search(query, {
                maxResults: options?.maxResults,
                enableFusion: true,
            });

            return {
                success: dualCoreResult.success,
                mode: 'LOCAL',
                response: dualCoreResult.fusedResult.response,
                confidence: dualCoreResult.fusedResult.confidence,
                sources: dualCoreResult.fusedResult.sources,
                suggestions: dualCoreResult.fusedResult.suggestions,
                processingTime: Date.now() - startTime,
                fallbackUsed: false,
                engineDetails: {
                    dualCore: {
                        used: true,
                        success: dualCoreResult.success,
                        responseTime: Date.now() - startTime,
                        engineStatus: dualCoreResult.engineStatus,
                    },
                },
            };
        } catch (error) {
            console.error('❌ LOCAL 모드 처리 실패:', error);
            throw error;
        }
    }

    private async processGoogleOnlyMode(query: string, options?: any): Promise<GoogleAIResult> {
        const startTime = Date.now();

        try {
            console.log('🤖 GOOGLE_ONLY 모드: Google AI 단독 처리');

            let lastError: any = null;

            for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
                try {
                    const googleAIResult = await this.googleAI.generateContent(query);

                    if (googleAIResult?.confidence >= 0.3) {
                        return {
                            success: true,
                            mode: 'GOOGLE_ONLY',
                            response: googleAIResult.content || '응답을 생성했습니다.',
                            confidence: googleAIResult.confidence,
                            sources: ['Google AI'],
                            suggestions: [],
                            processingTime: Date.now() - startTime,
                            fallbackUsed: false,
                            engineDetails: {
                                googleAI: {
                                    used: true,
                                    success: true,
                                    responseTime: Date.now() - startTime,
                                },
                            },
                        };
                    }
                } catch (error) {
                    lastError = error;
                    console.warn(`⚠️ Google AI 시도 ${attempt}/${this.config.maxRetries} 실패:`, error);

                    if (attempt < this.config.maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            }

            throw new Error(`Google AI ${this.config.maxRetries}회 시도 모두 실패: ${lastError?.message}`);
        } catch (error) {
            console.error('❌ GOOGLE_ONLY 모드 처리 실패:', error);
            throw error;
        }
    }

    private createEmergencyFallback(query: string, mode: GoogleAIMode, processingTime: number): GoogleAIResult {
        return {
            success: false,
            mode,
            response: `죄송합니다. ${mode} 모드에서 "${query}" 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`,
            confidence: 0.1,
            sources: ['Emergency Fallback'],
            suggestions: [
                '다른 모드로 전환해보세요',
                '더 간단한 질문으로 시도해보세요',
                '시스템 상태를 확인해보세요',
            ],
            processingTime,
            fallbackUsed: true,
            engineDetails: {},
        };
    }

    private updateStats(result: GoogleAIResult, responseTime: number): void {
        if (result.engineDetails.googleAI?.used) {
            const success = result.engineDetails.googleAI.success ? 100 : 0;
            this.stats.googleAISuccessRate =
                (this.stats.googleAISuccessRate * 0.9) + (success * 0.1);
        }

        const fallbackUsed = result.fallbackUsed ? 100 : 0;
        this.stats.fallbackRate =
            (this.stats.fallbackRate * 0.9) + (fallbackUsed * 0.1);

        this.stats.averageResponseTime =
            (this.stats.averageResponseTime * 0.9) + (responseTime * 0.1);
    }

    public setMode(mode: GoogleAIMode): void {
        const oldMode = this.currentMode;
        this.currentMode = mode;

        console.log(`🔧 Google AI 모드 변경: ${oldMode} → ${mode}`);
    }

    public getStats() {
        return {
            currentMode: this.currentMode,
            config: this.config,
            stats: this.stats,
            systemHealth: {
                googleAI: this.googleAI.isReady ? this.googleAI.isReady() : this.googleAI.isAvailable(),
                dualCore: this.dualCore.isReady(),
            },
        };
    }

    public async healthCheck(): Promise<{
        overall: boolean;
        googleAI: boolean;
        dualCore: boolean;
        currentMode: GoogleAIMode;
        recommendations: string[];
    }> {
        const googleAIHealthy = this.currentMode === 'LOCAL' ? true : (this.googleAI.isReady ? this.googleAI.isReady() : this.googleAI.isAvailable());
        const dualCoreHealth = await this.dualCore.healthCheck();

        const recommendations: string[] = [];

        if (!googleAIHealthy && this.currentMode !== 'LOCAL') {
            recommendations.push('Google AI 서비스 확인 필요');
        }

        if (!dualCoreHealth.overall) {
            recommendations.push('Dual-Core 시스템 점검 필요');
        }

        if (this.stats.fallbackRate > 50) {
            recommendations.push('폴백 사용률이 높음 - 시스템 최적화 권장');
        }

        return {
            overall: googleAIHealthy && dualCoreHealth.overall,
            googleAI: googleAIHealthy,
            dualCore: dualCoreHealth.overall,
            currentMode: this.currentMode,
            recommendations,
        };
    }

    public async cleanup(): Promise<void> {
        await this.dualCore.cleanup();
        console.log('🧹 Google AI Mode Manager 정리 완료');
    }

    public isReady(): boolean {
        if (this.currentMode === 'LOCAL') {
            return this.dualCore.isReady();
        }
        return this.googleAI.isReady() && this.dualCore.isReady();
    }

    public async query(query: string, options?: any): Promise<GoogleAIResult> {
        return this.processQuery(query, options);
    }

    public async processQueryLegacy(query: string, sessionId: string): Promise<any> {
        const result = await this.processQuery(query);
        return {
            response: result.response,
            confidence: result.confidence,
            sources: result.sources,
            suggestions: result.suggestions,
            processingTime: result.processingTime,
            sessionLearning: true,
            reliability: result.confidence > 0.7 ? 'high' :
                result.confidence > 0.4 ? 'medium' : 'low',
            source: `google-ai-mode-manager-${result.mode.toLowerCase()}`,
            mode: result.mode,
            fallbackUsed: result.fallbackUsed,
            engineDetails: result.engineDetails,
        };
    }
}
