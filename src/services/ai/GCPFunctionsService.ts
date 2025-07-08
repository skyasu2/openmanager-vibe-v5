/**
 * 🚀 GCP Functions AI 서비스 v1.1
 * 
 * OpenManager AI 엔진 이전 프로젝트
 * 베르셀 부하 75% 감소 + AI 처리 성능 50% 향상
 * 
 * 3-Tier 아키텍처:
 * 1. Vercel (유지): Next.js 웹앱, API 게이트웨이
 * 2. GCP Functions (무료): 4개 Cloud Functions
 * 3. VM (기존): Simple Context API
 */

import { systemLogger } from '@/lib/logger';
import type { AIRequest, AIResponse } from '@/types/ai-types';

interface GCPFunctionsConfig {
    enabled: boolean;
    timeout: number;
    maxRetries: number;
    fallbackToLocal: boolean;
    endpoints: {
        aiGateway: string;
        koreanNLP: string;
        ruleEngine: string;
        basicML: string;
    };
    vmContext: {
        enabled: boolean;
        endpoint: string;
    };
}

interface GCPResponse {
    success: boolean;
    response: string;
    confidence: number;
    engine: string;
    processingTime: number;
    sources?: string[];
    suggestions?: string[];
    metadata?: any;
    error?: string;
}

interface UsageStats {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    engineUsage: {
        korean: number;
        rule: number;
        ml: number;
        fallback: number;
    };
    freeQuotaUsage: {
        calls: number;
        compute: number;
        network: number;
        // 백분율 프로퍼티 추가
        callsPercent: number;
        computePercent: number;
        networkPercent: number;
    };
}

/**
 * 🚀 GCP Functions AI 서비스
 * 베르셀 → GCP 연동 및 폴백 전략 구현
 */
export class GCPFunctionsService {
    private static instance: GCPFunctionsService;
    private config: GCPFunctionsConfig;
    private stats: UsageStats;
    private initialized = false;

    // 생성자를 public으로 변경하여 직접 인스턴스 생성 허용
    constructor(customConfig?: Partial<GCPFunctionsConfig>) {
        this.config = {
            enabled: process.env.GCP_FUNCTIONS_ENABLED === 'true',
            timeout: parseInt(process.env.GCP_FUNCTIONS_TIMEOUT || '8000'),
            maxRetries: parseInt(process.env.GCP_FUNCTIONS_MAX_RETRIES || '2'),
            fallbackToLocal: process.env.GCP_FUNCTIONS_FALLBACK === 'true',
            endpoints: {
                aiGateway: process.env.GCP_AI_GATEWAY_URL || 'https://asia-northeast3-openmanager-ai.cloudfunctions.net/ai-gateway',
                koreanNLP: process.env.GCP_KOREAN_NLP_URL || 'https://asia-northeast3-openmanager-ai.cloudfunctions.net/korean-nlp',
                ruleEngine: process.env.GCP_RULE_ENGINE_URL || 'https://asia-northeast3-openmanager-ai.cloudfunctions.net/rule-engine',
                basicML: process.env.GCP_BASIC_ML_URL || 'https://asia-northeast3-openmanager-ai.cloudfunctions.net/basic-ml',
            },
            vmContext: {
                enabled: process.env.GCP_VM_CONTEXT_ENABLED === 'true',
                endpoint: process.env.GCP_VM_CONTEXT_URL || 'http://34.64.213.108:10001',
            },
            ...customConfig // 사용자 정의 설정 오버라이드
        };

        this.stats = {
            totalRequests: 0,
            successRate: 100,
            averageResponseTime: 0,
            engineUsage: {
                korean: 0,
                rule: 0,
                ml: 0,
                fallback: 0,
            },
            freeQuotaUsage: {
                calls: 0,
                compute: 0,
                network: 0,
                callsPercent: 0,
                computePercent: 0,
                networkPercent: 0,
            },
        };

        systemLogger.info('🚀 GCP Functions Service 초기화');
    }

    public static getInstance(): GCPFunctionsService {
        if (!GCPFunctionsService.instance) {
            GCPFunctionsService.instance = new GCPFunctionsService();
        }
        return GCPFunctionsService.instance;
    }

    /**
     * 🔧 서비스 초기화
     */
    public async initialize(): Promise<void> {
        if (this.initialized || !this.config.enabled) {
            return;
        }

        try {
            // GCP Functions 헬스체크
            await this.healthCheck();
            this.initialized = true;
            systemLogger.info('✅ GCP Functions Service 초기화 완료');
        } catch (error) {
            systemLogger.error('❌ GCP Functions Service 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 🎯 개별 Function 호출 메서드 (신규 추가)
     */
    public async callFunction(functionName: string, data: any): Promise<GCPResponse> {
        if (!this.config.enabled) {
            throw new Error('GCP Functions가 비활성화되어 있습니다');
        }

        if (!this.initialized) {
            await this.initialize();
        }

        const endpoint = this.getFunctionEndpoint(functionName);
        if (!endpoint) {
            throw new Error(`Unknown function: ${functionName}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Vercel-Request': 'true',
                    'User-Agent': 'OpenManager-Vercel/1.1',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // 통계 업데이트
            this.updateFunctionStats(functionName);

            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            systemLogger.error(`GCP Function ${functionName} 호출 실패:`, error);
            throw error;
        }
    }

    /**
     * 🗺️ Function 이름에서 엔드포인트 URL 가져오기
     */
    private getFunctionEndpoint(functionName: string): string | null {
        const endpointMap: Record<string, string> = {
            'ai-gateway': this.config.endpoints.aiGateway,
            'korean-nlp': this.config.endpoints.koreanNLP,
            'rule-engine': this.config.endpoints.ruleEngine,
            'basic-ml': this.config.endpoints.basicML,
        };

        return endpointMap[functionName] || null;
    }

    /**
     * 📊 Function별 통계 업데이트
     */
    private updateFunctionStats(functionName: string): void {
        switch (functionName) {
            case 'korean-nlp':
                this.stats.engineUsage.korean++;
                break;
            case 'rule-engine':
                this.stats.engineUsage.rule++;
                break;
            case 'basic-ml':
                this.stats.engineUsage.ml++;
                break;
            default:
                break;
        }
        this.stats.totalRequests++;
    }

    /**
     * 🤖 메인 AI 처리 (AI Gateway를 통한 통합 처리)
     */
    public async processQuery(request: AIRequest): Promise<AIResponse> {
        if (!this.config.enabled) {
            throw new Error('GCP Functions가 비활성화되어 있습니다');
        }

        if (!this.initialized) {
            await this.initialize();
        }

        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            // 1. AI Gateway를 통한 통합 처리
            const response = await this.callAIGateway(request);

            // 2. 응답 처리
            const processedResponse = this.processGCPResponse(response, startTime);

            // 3. 통계 업데이트
            this.updateStats(processedResponse, startTime);

            return processedResponse;

        } catch (error) {
            systemLogger.error('GCP Functions 처리 실패:', error);

            // 폴백 전략 적용
            if (this.config.fallbackToLocal) {
                this.stats.engineUsage.fallback++;
                throw new Error(`GCP Functions 실패 (폴백 필요): ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            throw error;
        }
    }

    /**
     * 📡 AI Gateway 호출
     */
    private async callAIGateway(request: AIRequest): Promise<GCPResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(this.config.endpoints.aiGateway, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Vercel-Request': 'true',
                    'User-Agent': 'OpenManager-Vercel/1.0',
                },
                body: JSON.stringify({
                    query: request.query,
                    mode: request.mode || 'auto',
                    data: request.data,
                    context: request.context,
                    options: {
                        timeout: this.config.timeout,
                        maxRetries: this.config.maxRetries,
                    },
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 🏥 헬스체크
     */
    private async healthCheck(): Promise<void> {
        const healthPromises = Object.entries(this.config.endpoints).map(
            async ([name, url]) => {
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        timeout: 3000,
                    });
                    return { name, status: response.ok };
                } catch {
                    return { name, status: false };
                }
            }
        );

        const results = await Promise.all(healthPromises);
        const failedServices = results.filter(r => !r.status);

        if (failedServices.length > 0) {
            systemLogger.warn(`GCP Functions 일부 서비스 불안정:`, failedServices);
        }
    }

    /**
     * 🔄 GCP 응답을 AI 응답으로 변환
     */
    private processGCPResponse(gcpResponse: GCPResponse, startTime: number): AIResponse {
        const processingTime = Date.now() - startTime;

        return {
            success: gcpResponse.success,
            response: gcpResponse.response,
            confidence: gcpResponse.confidence || 0.8,
            processingTime,
            sources: gcpResponse.sources || ['gcp-functions'],
            metadata: {
                engine: gcpResponse.engine,
                timestamp: new Date().toISOString(),
                gcpProcessingTime: gcpResponse.processingTime || 0,
                vercelProcessingTime: processingTime,
            },
        };
    }

    /**
     * 📊 통계 업데이트
     */
    private updateStats(response: AIResponse, startTime: number): void {
        const responseTime = Date.now() - startTime;

        // 평균 응답 시간 계산
        this.stats.averageResponseTime =
            (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) /
            this.stats.totalRequests;

        // 성공률 계산
        const successCount = response.success ? 1 : 0;
        this.stats.successRate =
            (this.stats.successRate * (this.stats.totalRequests - 1) + successCount * 100) /
            this.stats.totalRequests;

        // 할당량 사용량 추정
        this.stats.freeQuotaUsage.calls++;
        this.stats.freeQuotaUsage.network += this.estimateNetworkUsage(response as any, response);
        this.stats.freeQuotaUsage.compute += this.estimateComputeUsage(responseTime);

        // 백분율 계산 (무료 한도 기준)
        this.stats.freeQuotaUsage.callsPercent = (this.stats.freeQuotaUsage.calls / 2000000) * 100;
        this.stats.freeQuotaUsage.computePercent = (this.stats.freeQuotaUsage.compute / 400000) * 100;
        this.stats.freeQuotaUsage.networkPercent = (this.stats.freeQuotaUsage.network / (5 * 1024 * 1024 * 1024)) * 100;
    }

    /**
     * 🌐 네트워크 사용량 추정
     */
    private estimateNetworkUsage(request: AIRequest, response: any): number {
        const requestSize = JSON.stringify(request).length;
        const responseSize = JSON.stringify(response).length;
        return requestSize + responseSize; // bytes
    }

    /**
     * 💻 컴퓨팅 사용량 추정
     */
    private estimateComputeUsage(responseTime: number): number {
        // 256MB 메모리 기준으로 GB-초 계산
        return (0.256 * responseTime) / 1000;
    }

    /**
     * 📊 사용량 통계 조회
     */
    public getUsageStats(): UsageStats {
        return { ...this.stats };
    }

    /**
     * 🔍 서비스 상태 조회
     */
    public getServiceStatus() {
        return {
            name: 'GCP Functions Service v1.1',
            enabled: this.config.enabled,
            initialized: this.initialized,
            endpoints: this.config.endpoints,
            vmContext: this.config.vmContext,
            stats: this.stats,
            config: {
                timeout: this.config.timeout,
                maxRetries: this.config.maxRetries,
                fallbackToLocal: this.config.fallbackToLocal,
            },
        };
    }

    /**
     * ⚙️ 설정 업데이트
     */
    public updateConfig(newConfig: Partial<GCPFunctionsConfig>): void {
        this.config = { ...this.config, ...newConfig };
        systemLogger.info('GCP Functions Service 설정 업데이트');
    }

    /**
     * 🔄 통계 초기화
     */
    public resetUsageStats(): void {
        this.stats = {
            totalRequests: 0,
            successRate: 100,
            averageResponseTime: 0,
            engineUsage: {
                korean: 0,
                rule: 0,
                ml: 0,
                fallback: 0,
            },
            freeQuotaUsage: {
                calls: 0,
                compute: 0,
                network: 0,
                callsPercent: 0,
                computePercent: 0,
                networkPercent: 0,
            },
        };
        systemLogger.info('GCP Functions Service 통계 초기화');
    }
} 