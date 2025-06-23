/**
 * 🤖 Google AI Mode Manager
 * 
 * Google AI의 3가지 운영 모드를 관리:
 * - AUTO: MCP/RAG 백업으로 Google AI 사용
 * - LOCAL: Google AI 완전 비활성화, MCP+RAG만 사용
 * - GOOGLE_ONLY: Google AI 단독 동작
 */

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
        this.googleAI = GoogleAIService.getInstance();

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
                case 'GOOGLE_ONLY':
                    result = await this.processGoogleOnlyMode(query, options);
                    break;
                case 'LOCAL':
                    result = await this.processLocalMode(query, options);
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

    private async processLocalMode(query: string, options?: any): Promise<GoogleAIResult> {
        const startTime = Date.now();

        console.log('🏠 LOCAL 모드: Google AI 비활성화, 기본 응답만 제공');

        return {
            success: true,
            mode: 'LOCAL',
            response: `질문을 받았습니다: "${query}". LOCAL 모드에서는 Google AI를 사용하지 않습니다.`,
            confidence: 0.5,
            sources: ['로컬 처리'],
            suggestions: ['Google AI 모드로 전환하여 더 나은 답변을 받아보세요.'],
            processingTime: Date.now() - startTime,
            fallbackUsed: false,
            engineDetails: {
                googleAI: { used: false, reason: 'local_mode' }
            },
        };
    }

    private async processGoogleOnlyMode(query: string, options?: any): Promise<GoogleAIResult> {
        const startTime = Date.now();

        console.log('🤖 GOOGLE_ONLY 모드: Google AI 단독 동작');

        let lastError: any = null;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const googleAIResult = await this.googleAI.generateContent(query);

                if (googleAIResult?.confidence >= 0.3) {
                    console.log('✅ Google AI 성공');
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
                                attempt,
                                responseTime: Date.now() - startTime,
                            }
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

        // 모든 시도 실패
        throw new Error(`Google AI 모든 시도 실패: ${lastError?.message}`);
    }

    private createEmergencyFallback(query: string, mode: GoogleAIMode, processingTime: number): GoogleAIResult {
        console.log('🆘 응급 폴백 응답 생성');
        return {
            success: false,
            mode,
            response: `죄송합니다. 현재 AI 서비스에 문제가 있어 답변을 제공할 수 없습니다. 잠시 후 다시 시도해 주세요.`,
            confidence: 0.1,
            sources: ['응급 폴백'],
            suggestions: ['잠시 후 다시 시도해 주세요.', '다른 질문을 해보세요.'],
            processingTime,
            fallbackUsed: true,
            engineDetails: {
                emergency: true,
                reason: 'all_engines_failed'
            },
        };
    }

    private updateStats(result: GoogleAIResult, responseTime: number): void {
        // 성공률 업데이트
        if (result.mode === 'GOOGLE_ONLY' || result.mode === 'AUTO') {
            const currentRate = this.stats.googleAISuccessRate;
            this.stats.googleAISuccessRate = (currentRate * 0.9) + (result.success ? 10 : 0);
        }

        // 폴백 사용률 업데이트
        if (result.fallbackUsed) {
            this.stats.fallbackRate = (this.stats.fallbackRate * 0.9) + 10;
        }

        // 평균 응답 시간 업데이트
        this.stats.averageResponseTime = (this.stats.averageResponseTime * 0.9) + (responseTime * 0.1);
    }

    public setMode(mode: GoogleAIMode): void {
        console.log(`🔄 모드 변경: ${this.currentMode} → ${mode}`);
        this.currentMode = mode;
        this.config.mode = mode;
    }

    public getStats() {
        return {
            ...this.stats,
            currentMode: this.currentMode,
            config: this.config,
        };
    }

    public async healthCheck(): Promise<{
        overall: boolean;
        googleAI: boolean;
        currentMode: GoogleAIMode;
        recommendations: string[];
    }> {
        const recommendations: string[] = [];
        let googleAI = false;

        try {
            if (this.currentMode !== 'LOCAL') {
                const testResult = await this.googleAI.generateContent('테스트');
                googleAI = testResult?.confidence > 0;
            } else {
                googleAI = true; // LOCAL 모드에서는 Google AI 상태 무관
            }
        } catch (error) {
            console.warn('Google AI 헬스체크 실패:', error);
            recommendations.push('Google AI 연결 상태를 확인하세요.');
        }

        const overall = googleAI;

        if (!overall) {
            recommendations.push('LOCAL 모드로 전환을 고려하세요.');
        }

        return { overall, googleAI, currentMode: this.currentMode, recommendations };
    }

    public async cleanup(): Promise<void> {
        console.log('🧹 Google AI Mode Manager 정리 중...');
    }

    public isReady(): boolean {
        return this.currentMode === 'LOCAL' || this.googleAI !== null;
    }

    public async query(query: string, options?: any): Promise<GoogleAIResult> {
        return this.processQuery(query, options);
    }

    public async processQueryLegacy(query: string, sessionId: string): Promise<any> {
        const result = await this.processQuery(query, { sessionId });
        return {
            response: result.response,
            confidence: result.confidence,
            sources: result.sources,
            suggestions: result.suggestions,
        };
    }
}
