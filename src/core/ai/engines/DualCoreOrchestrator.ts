/**
 * 🎭 Dual-Core Orchestrator
 * 
 * MCP Engine과 RAG Engine을 조합하여 관리:
 * - 두 엔진의 독립적 동작 보장
 * - 결과 융합 및 최적화
 * - 장애 시 자동 폴백
 * - 성능 모니터링 및 로드 밸런싱
 */

import { MCPEngine, MCPEngineResponse } from './MCPEngine';
import { RAGEngine, RAGSearchResult } from './RAGEngine';

export interface DualCoreConfig {
    mcpWeight: number;        // MCP 결과 가중치 (0-1)
    ragWeight: number;        // RAG 결과 가중치 (0-1)
    fusionThreshold: number;  // 결과 융합 임계값
    fallbackMode: 'mcp' | 'rag' | 'both'; // 장애 시 폴백 모드
    enableLoadBalancing: boolean;
}

export interface DualCoreResult {
    success: boolean;
    query: string;
    mcpResult?: MCPEngineResponse;
    ragResult?: RAGSearchResult;
    fusedResult: {
        response: string;
        confidence: number;
        sources: string[];
        suggestions: string[];
        processingTime: number;
    };
    engineStatus: {
        mcp: 'active' | 'fallback' | 'failed';
        rag: 'active' | 'fallback' | 'failed';
    };
    performance: {
        mcpTime: number;
        ragTime: number;
        fusionTime: number;
        totalTime: number;
    };
}

export class DualCoreOrchestrator {
    private mcpEngine: MCPEngine;
    private ragEngine: RAGEngine;
    private config: DualCoreConfig;
    private stats: {
        totalQueries: number;
        mcpSuccessRate: number;
        ragSuccessRate: number;
        averageResponseTime: number;
        lastHealthCheck: string;
    };

    constructor(config?: Partial<DualCoreConfig>) {
        this.config = {
            mcpWeight: 0.6,
            ragWeight: 0.4,
            fusionThreshold: 0.5,
            fallbackMode: 'both',
            enableLoadBalancing: true,
            ...config,
        };

        this.mcpEngine = MCPEngine.getInstance();
        this.ragEngine = new RAGEngine();

        this.stats = {
            totalQueries: 0,
            mcpSuccessRate: 100,
            ragSuccessRate: 100,
            averageResponseTime: 0,
            lastHealthCheck: new Date().toISOString(),
        };

        console.log('🎭 Dual-Core Orchestrator 생성됨');
    }

    /**
     * 🚀 이중 코어 시스템 초기화
     */
    public async initialize(): Promise<void> {
        try {
            console.log('🚀 Dual-Core Orchestrator 초기화 시작...');

            // RAG 엔진 초기화 (MCP는 이미 초기화됨)
            await this.ragEngine.initialize();

            console.log('✅ Dual-Core Orchestrator 초기화 완료');
            console.log(`⚖️ 가중치 - MCP: ${this.config.mcpWeight}, RAG: ${this.config.ragWeight}`);
        } catch (error) {
            console.error('❌ Dual-Core Orchestrator 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 🔍 이중 코어 검색 (병렬 실행 + 결과 융합)
     */
    public async search(query: string, options?: {
        preferEngine?: 'mcp' | 'rag' | 'auto';
        maxResults?: number;
        enableFusion?: boolean;
    }): Promise<DualCoreResult> {
        const startTime = Date.now();
        this.stats.totalQueries++;

        try {
            // 엔진 선택 로직
            const useEngine = this.selectEngine(options?.preferEngine);

            let mcpResult: MCPEngineResponse | undefined;
            let ragResult: RAGSearchResult | undefined;
            let mcpTime = 0;
            let ragTime = 0;

            // 병렬 검색 실행
            const searchPromises: Promise<any>[] = [];

            if (useEngine.mcp) {
                const mcpStart = Date.now();
                searchPromises.push(
                    this.mcpEngine.processQuery(query, {
                        maxResults: options?.maxResults,
                        enableMLAnalysis: true,
                    }).then(result => {
                        mcpResult = result;
                        mcpTime = Date.now() - mcpStart;
                        return result;
                    }).catch(error => {
                        console.warn('⚠️ MCP Engine 검색 실패:', error);
                        mcpTime = Date.now() - mcpStart;
                        return null;
                    })
                );
            }

            if (useEngine.rag) {
                const ragStart = Date.now();
                searchPromises.push(
                    this.ragEngine.search(query, {
                        maxResults: options?.maxResults,
                        enableMLAnalysis: true,
                    }).then(result => {
                        ragResult = result;
                        ragTime = Date.now() - ragStart;
                        return result;
                    }).catch(error => {
                        console.warn('⚠️ RAG Engine 검색 실패:', error);
                        ragTime = Date.now() - ragStart;
                        return null;
                    })
                );
            }

            // 모든 검색 완료 대기
            await Promise.all(searchPromises);

            // 결과 융합
            const fusionStart = Date.now();
            const fusedResult = await this.fuseResults(mcpResult, ragResult, query);
            const fusionTime = Date.now() - fusionStart;

            // 엔진 상태 결정
            const engineStatus = {
                mcp: (mcpResult && mcpResult.confidence > 0.3) ? 'active' : (useEngine.mcp ? 'failed' : 'fallback') as 'active' | 'fallback' | 'failed',
                rag: ragResult?.success ? 'active' : (useEngine.rag ? 'failed' : 'fallback') as 'active' | 'fallback' | 'failed',
            };

            // 성능 통계 업데이트
            const totalTime = Date.now() - startTime;
            this.updateStats((mcpResult && mcpResult.confidence > 0.3) || false, ragResult?.success || false, totalTime);

            return {
                success: fusedResult.confidence > this.config.fusionThreshold,
                query,
                mcpResult,
                ragResult,
                fusedResult,
                engineStatus,
                performance: {
                    mcpTime,
                    ragTime,
                    fusionTime,
                    totalTime,
                },
            };
        } catch (error) {
            console.error('❌ Dual-Core 검색 실패:', error);

            return {
                success: false,
                query,
                fusedResult: {
                    response: '검색 중 오류가 발생했습니다.',
                    confidence: 0,
                    sources: [],
                    suggestions: [],
                    processingTime: Date.now() - startTime,
                },
                engineStatus: {
                    mcp: 'failed',
                    rag: 'failed',
                },
                performance: {
                    mcpTime: 0,
                    ragTime: 0,
                    fusionTime: 0,
                    totalTime: Date.now() - startTime,
                },
            };
        }
    }

    /**
     * 🎯 엔진 선택 로직
     */
    private selectEngine(preference?: 'mcp' | 'rag' | 'auto'): { mcp: boolean; rag: boolean } {
        if (preference === 'mcp') return { mcp: true, rag: false };
        if (preference === 'rag') return { mcp: false, rag: true };

        // 자동 선택 (로드 밸런싱 고려)
        if (this.config.enableLoadBalancing) {
            const mcpHealthy = this.mcpEngine.isReady();
            const ragHealthy = this.ragEngine.isReady();

            if (!mcpHealthy && ragHealthy) return { mcp: false, rag: true };
            if (mcpHealthy && !ragHealthy) return { mcp: true, rag: false };
            if (!mcpHealthy && !ragHealthy) return { mcp: true, rag: true }; // 둘 다 시도

            // 둘 다 정상이면 성능 기반 선택
            if (this.stats.mcpSuccessRate > this.stats.ragSuccessRate + 10) {
                return { mcp: true, rag: false };
            } else if (this.stats.ragSuccessRate > this.stats.mcpSuccessRate + 10) {
                return { mcp: false, rag: true };
            }
        }

        // 기본값: 둘 다 실행
        return { mcp: true, rag: true };
    }

    /**
     * 🔗 결과 융합 (Hybrid Fusion)
     */
    private async fuseResults(
        mcpResult?: MCPEngineResponse,
        ragResult?: RAGSearchResult,
        query?: string
    ): Promise<{
        response: string;
        confidence: number;
        sources: string[];
        suggestions: string[];
        processingTime: number;
    }> {
        const startTime = Date.now();

        try {
            // 결과 유효성 확인
            const mcpValid = mcpResult && mcpResult.confidence > 0.3;
            const ragValid = ragResult?.success && ragResult.confidence > 0.3;

            if (!mcpValid && !ragValid) {
                return {
                    response: '관련 정보를 찾을 수 없습니다.',
                    confidence: 0.1,
                    sources: [],
                    suggestions: ['다른 키워드로 검색해보세요', '더 구체적인 질문을 해보세요'],
                    processingTime: Date.now() - startTime,
                };
            }

            // 단일 결과만 있는 경우
            if (mcpValid && !ragValid) {
                return {
                    response: mcpResult!.answer,
                    confidence: mcpResult!.confidence * 0.9, // 단일 엔진 페널티
                    sources: mcpResult!.sources,
                    suggestions: mcpResult!.recommendations,
                    processingTime: Date.now() - startTime,
                };
            }

            if (ragValid && !mcpValid) {
                return {
                    response: ragResult!.response,
                    confidence: ragResult!.confidence * 0.9, // 단일 엔진 페널티
                    sources: ragResult!.results.map(r => r.id),
                    suggestions: ragResult!.suggestions,
                    processingTime: Date.now() - startTime,
                };
            }

            // 두 결과 모두 유효한 경우 - 가중 융합
            const mcpWeight = this.config.mcpWeight;
            const ragWeight = this.config.ragWeight;

            const fusedConfidence =
                (mcpResult!.confidence * mcpWeight) +
                (ragResult!.confidence * ragWeight);

            // 응답 융합 (더 신뢰도 높은 것 우선)
            let fusedResponse: string;
            if (mcpResult!.confidence > ragResult!.confidence) {
                fusedResponse = mcpResult!.answer;
                if (ragResult!.response && ragResult!.confidence > 0.6) {
                    fusedResponse += `\n\n추가 정보: ${ragResult!.response}`;
                }
            } else {
                fusedResponse = ragResult!.response;
                if (mcpResult!.answer && mcpResult!.confidence > 0.6) {
                    fusedResponse += `\n\n추가 정보: ${mcpResult!.answer}`;
                }
            }

            // 소스 통합
            const fusedSources = [
                ...mcpResult!.sources,
                ...ragResult!.results.map(r => r.id),
            ].filter((source, index, arr) => arr.indexOf(source) === index);

            // 제안 통합
            const fusedSuggestions = [
                ...mcpResult!.recommendations,
                ...ragResult!.suggestions,
            ].filter((suggestion, index, arr) => arr.indexOf(suggestion) === index)
                .slice(0, 5); // 최대 5개

            return {
                response: fusedResponse,
                confidence: Math.min(0.95, fusedConfidence + 0.1), // 융합 보너스
                sources: fusedSources,
                suggestions: fusedSuggestions,
                processingTime: Date.now() - startTime,
            };
        } catch (error) {
            console.error('❌ 결과 융합 실패:', error);

            return {
                response: '결과 처리 중 오류가 발생했습니다.',
                confidence: 0.1,
                sources: [],
                suggestions: [],
                processingTime: Date.now() - startTime,
            };
        }
    }

    /**
     * 📊 성능 통계 업데이트
     */
    private updateStats(mcpSuccess: boolean, ragSuccess: boolean, responseTime: number): void {
        // 성공률 업데이트 (이동 평균)
        this.stats.mcpSuccessRate =
            (this.stats.mcpSuccessRate * 0.9) + ((mcpSuccess ? 100 : 0) * 0.1);
        this.stats.ragSuccessRate =
            (this.stats.ragSuccessRate * 0.9) + ((ragSuccess ? 100 : 0) * 0.1);

        // 평균 응답 시간 업데이트
        this.stats.averageResponseTime =
            (this.stats.averageResponseTime * 0.9) + (responseTime * 0.1);

        this.stats.lastHealthCheck = new Date().toISOString();
    }

    /**
     * 📊 상태 정보 반환
     */
    public getStats() {
        return {
            ...this.stats,
            engines: {
                mcp: this.mcpEngine.getStats(),
                rag: this.ragEngine.getStats(),
            },
            config: this.config,
        };
    }

    /**
     * 🏥 헬스체크
     */
    public async healthCheck(): Promise<{
        overall: boolean;
        mcp: boolean;
        rag: boolean;
        details: any;
    }> {
        const mcpHealthy = this.mcpEngine.isReady();
        const ragHealthy = this.ragEngine.isReady();

        return {
            overall: mcpHealthy || ragHealthy, // 하나라도 정상이면 OK
            mcp: mcpHealthy,
            rag: ragHealthy,
            details: {
                mcpStats: this.mcpEngine.getStats(),
                ragStats: this.ragEngine.getStats(),
                orchestratorStats: this.stats,
            },
        };
    }

    /**
     * 🔄 정리 작업
     */
    public async cleanup(): Promise<void> {
        await Promise.all([
            this.mcpEngine.cleanup(),
            this.ragEngine.cleanup(),
        ]);

        console.log('🧹 Dual-Core Orchestrator 정리 완료');
    }

    /**
     * 🔍 레거시 호환성 메서드들
     */
    public isReady(): boolean {
        return this.mcpEngine.isReady() || this.ragEngine.isReady();
    }

    public async query(query: string, options?: any): Promise<DualCoreResult> {
        return this.search(query, options);
    }

    public async processQuery(query: string, sessionId: string): Promise<any> {
        const result = await this.search(query);
        return {
            response: result.fusedResult.response,
            confidence: result.fusedResult.confidence,
            sources: result.fusedResult.sources,
            suggestions: result.fusedResult.suggestions,
            processingTime: result.performance.totalTime,
            sessionLearning: true,
            reliability: result.fusedResult.confidence > 0.7 ? 'high' :
                result.fusedResult.confidence > 0.4 ? 'medium' : 'low',
            source: 'dual-core-orchestrator',
            engineStatus: result.engineStatus,
        };
    }
} 