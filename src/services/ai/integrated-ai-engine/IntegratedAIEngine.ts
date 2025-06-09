/**
 * 🤖 Integrated AI Engine v3.0
 * 
 * 통합 AI 엔진 메인 클래스
 * - 모든 모듈 통합 관리
 * - 단일 인터페이스 제공
 * - 의존성 주입 및 설정 관리
 * - 생명주기 관리
 */

import { autoReportGenerator } from '../report-generator';
import {
    SystemManager
} from './system/SystemManager';
import {
    aiEngineUtils
} from './utils/AIEngineUtils';
import {
    nlpProcessor
} from './nlp/NLPProcessor';
import {
    intentHandlerManager
} from './intents/IntentHandlerManager';
import {
    responseGeneratorManager
} from './generators/ResponseGeneratorManager';
import {
    streamingProcessor
} from './streaming/StreamingProcessor';
import {
    AIQueryRequest,
    AIQueryResponse,
    AIEngineConfig,
    AIEngineStatus,
    StreamingChunk,
    IntentType,
    ReportConfig
} from './types/AIEngineTypes';

export class IntegratedAIEngine {
    private systemManager: SystemManager;
    private lastAnalysisCache: Map<string, any> = new Map();

    constructor(config?: Partial<AIEngineConfig>) {
        this.systemManager = new SystemManager(config);
        console.log('🤖 통합 AI 엔진 v3.0 인스턴스 생성');
    }

    /**
     * 엔진 초기화
     */
    async initialize(): Promise<void> {
        console.log('🚀 통합 AI 엔진 v3.0 초기화 시작...');

        try {
            await this.systemManager.initialize();
            console.log('✅ 통합 AI 엔진 초기화 완료');
        } catch (error: any) {
            console.error('❌ 통합 AI 엔진 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 메인 쿼리 처리
     */
    async processQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
        const startTime = performance.now();
        const queryId = aiEngineUtils.generateQueryId();

        console.log(`📝 쿼리 처리 시작: ${queryId}`);
        console.log(`🔍 쿼리: "${request.query}"`);

        try {
            // 1. NLP 처리
            const nlpResult = await nlpProcessor.processQuery(request.query);
            console.log(`🧠 Intent 감지: ${nlpResult.intent} (신뢰도: ${(nlpResult.confidence * 100).toFixed(1)}%)`);

            // 2. 초기 응답 구조 생성
            const response: AIQueryResponse = {
                success: true,
                query_id: queryId,
                intent: nlpResult.intent,
                confidence: nlpResult.confidence,
                answer: '',
                analysis_results: {
                    nlp_analysis: nlpResult,
                },
                recommendations: [],
                processing_stats: {
                    total_time: 0,
                    components_used: ['nlp-processor'],
                    models_executed: [],
                    data_sources: []
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    language: nlpResult.language,
                    session_id: request.context?.session_id
                }
            };

            // 세션 추적
            if (request.context?.session_id) {
                this.systemManager.addSession(request.context.session_id);
            }

            // 3. Intent별 처리
            const intentResult = await intentHandlerManager.handleIntent(
                nlpResult,
                request,
                response
            );

            if (!intentResult.success) {
                throw new Error(intentResult.error || 'Intent 처리 실패');
            }

            // 처리 통계 업데이트
            response.processing_stats.components_used.push(...intentResult.components_used);
            response.processing_stats.models_executed.push(...intentResult.models_executed);

            // 4. 답변 생성
            await this.generateComprehensiveAnswer(nlpResult, request, response);

            // 5. 보고서 생성 (필요시)
            if (this.shouldGenerateReport(nlpResult, request)) {
                await this.generateReport(response, request);
            }

            // 6. 최종 통계 계산
            response.processing_stats.total_time = performance.now() - startTime;

            console.log(`✅ 쿼리 처리 완료: ${queryId} (${response.processing_stats.total_time.toFixed(2)}ms)`);
            console.log(`📊 사용된 컴포넌트: ${response.processing_stats.components_used.join(', ')}`);

            // 캐시 저장
            this.lastAnalysisCache.set(queryId, {
                request,
                response,
                timestamp: Date.now()
            });

            return response;

        } catch (error: any) {
            console.error(`❌ 쿼리 처리 실패: ${queryId}`, error);

            return {
                success: false,
                query_id: queryId,
                intent: 'general',
                confidence: 0,
                answer: this.generateErrorAnswer(request.context?.language || 'ko', error.message),
                analysis_results: {
                    nlp_analysis: null,
                },
                recommendations: [],
                processing_stats: {
                    total_time: performance.now() - startTime,
                    components_used: [],
                    models_executed: [],
                    data_sources: []
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    language: request.context?.language || 'ko',
                    session_id: request.context?.session_id,
                    debug_info: {
                        error: error.message,
                        stack: error.stack
                    }
                }
            };
        }
    }

    /**
     * 스트리밍 쿼리 처리
     */
    async *processQueryStream(
        request: AIQueryRequest
    ): AsyncGenerator<StreamingChunk, void, unknown> {
        console.log('🔄 스트리밍 쿼리 처리 시작');

        try {
            yield* streamingProcessor.processQueryStream(request);
        } catch (error: any) {
            console.error('❌ 스트리밍 처리 실패:', error);
            yield {
                type: 'error',
                data: {
                    message: error.message || '스트리밍 처리 중 오류가 발생했습니다.',
                    code: 'STREAMING_ERROR'
                },
                timestamp: Date.now(),
                chunk_id: `error_${Date.now()}`
            };
        }
    }

    /**
     * 종합 답변 생성
     */
    private async generateComprehensiveAnswer(
        nlpResult: any,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<void> {
        console.log('📝 답변 생성 시작...');

        try {
            // 답변 생성
            const generatedAnswer = responseGeneratorManager.generateResponse(
                nlpResult.intent as IntentType,
                response,
                {
                    language: nlpResult.language as 'ko' | 'en',
                    include_details: true,
                    include_recommendations: true,
                    format: 'detailed'
                }
            );

            response.answer = generatedAnswer;

            // 권장사항이 아직 없는 경우 생성
            if (response.recommendations.length === 0) {
                this.generateRecommendations(nlpResult, response);
            }

            console.log('✅ 답변 생성 완료');
        } catch (error: any) {
            console.error('❌ 답변 생성 실패:', error);
            response.answer = this.generateErrorAnswer(
                nlpResult.language,
                '답변 생성 중 오류가 발생했습니다.'
            );
        }
    }

    /**
     * 권장사항 생성
     */
    private generateRecommendations(nlpResult: any, response: AIQueryResponse): void {
        const recommendations: string[] = [];
        const lang = nlpResult.language;

        // Intent별 기본 권장사항
        switch (nlpResult.intent) {
            case 'troubleshooting':
                if (lang === 'ko') {
                    recommendations.push('시스템 로그를 확인하여 근본 원인을 파악하세요.');
                    recommendations.push('관련 서비스의 상태를 점검하세요.');
                    recommendations.push('필요시 재시작을 고려하세요.');
                } else {
                    recommendations.push('Check system logs to identify root cause.');
                    recommendations.push('Verify the status of related services.');
                    recommendations.push('Consider restart if necessary.');
                }
                break;

            case 'prediction':
                if (lang === 'ko') {
                    recommendations.push('예측 결과를 바탕으로 예방 조치를 계획하세요.');
                    recommendations.push('임계값을 재검토하고 필요시 조정하세요.');
                } else {
                    recommendations.push('Plan preventive actions based on predictions.');
                    recommendations.push('Review and adjust thresholds if needed.');
                }
                break;

            case 'performance':
                if (lang === 'ko') {
                    recommendations.push('리소스 사용률을 모니터링하세요.');
                    recommendations.push('병목 지점을 식별하고 최적화하세요.');
                } else {
                    recommendations.push('Monitor resource utilization.');
                    recommendations.push('Identify and optimize bottlenecks.');
                }
                break;

            default:
                if (lang === 'ko') {
                    recommendations.push('정기적인 시스템 상태 확인을 권장합니다.');
                } else {
                    recommendations.push('Regular system health checks are recommended.');
                }
        }

        response.recommendations = recommendations;
    }

    /**
     * 보고서 생성 필요 여부 확인
     */
    private shouldGenerateReport(nlpResult: any, request: AIQueryRequest): boolean {
        return (
            request.context?.include_charts === true ||
            nlpResult.intent === 'reporting' ||
            (nlpResult.intent === 'analysis' && nlpResult.confidence > 0.8)
        );
    }

    /**
     * 보고서 생성
     */
    private async generateReport(
        response: AIQueryResponse,
        request: AIQueryRequest
    ): Promise<void> {
        try {
            console.log('📄 보고서 생성 중...');

            const reportData = {
                timestamp: new Date().toISOString(),
                summary: response.metadata.language === 'ko'
                    ? '시스템 분석 보고서입니다.'
                    : 'System analysis report.',
                failure_analysis: response.analysis_results.anomaly_detection || {},
                prediction_results: response.analysis_results.ai_predictions || {},
                ai_insights: response.recommendations,
                recommendations: response.recommendations,
                metrics_data: {},
                charts: [],
                system_status: { overall: 'healthy' },
                time_range: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString(),
                    duration: '24h',
                },
            };

            const reportConfig: ReportConfig = {
                format: 'markdown',
                include_charts: request.context?.include_charts || false,
                include_raw_data: false,
                template: 'technical',
                language: response.metadata.language as 'ko' | 'en',
                time_range: reportData.time_range
            };

            const generatedReport = await autoReportGenerator.generateReport(
                reportData,
                reportConfig
            );

            if (generatedReport.success && generatedReport.report) {
                response.generated_report = generatedReport.report;
                response.processing_stats.components_used.push('report-generator');
                console.log('✅ 보고서 생성 완료');
            }
        } catch (error: any) {
            console.error('❌ 보고서 생성 실패:', error);
        }
    }

    /**
     * 에러 답변 생성
     */
    private generateErrorAnswer(language: string, error: string): string {
        if (language === 'ko') {
            return `죄송합니다. 처리 중 오류가 발생했습니다: ${error}`;
        } else {
            return `Sorry, an error occurred during processing: ${error}`;
        }
    }

    /**
     * 엔진 상태 조회
     */
    async getEngineStatus(): Promise<AIEngineStatus> {
        return await this.systemManager.getEngineStatus();
    }

    /**
     * Render 상태 조회
     */
    getRenderStatus(): 'active' | 'sleeping' | 'error' {
        return this.systemManager.getRenderStatus();
    }

    /**
     * 캐시된 분석 결과 조회
     */
    getCachedAnalysis(queryId?: string): any[] {
        if (queryId) {
            const cached = this.lastAnalysisCache.get(queryId);
            return cached ? [cached] : [];
        }

        return Array.from(this.lastAnalysisCache.values());
    }

    /**
     * 캐시 정리
     */
    clearCache(): void {
        this.lastAnalysisCache.clear();
        console.log('🧹 분석 캐시 정리 완료');
    }

    /**
     * 설정 업데이트
     */
    updateConfig(config: Partial<AIEngineConfig>): void {
        this.systemManager.updateConfig(config);
    }

    /**
     * 현재 설정 조회
     */
    getConfig(): AIEngineConfig {
        return this.systemManager.getConfig();
    }

    /**
     * 상태 체크
     */
    async healthCheck(): Promise<any> {
        return await this.systemManager.healthCheck();
    }

    /**
     * 리소스 정리
     */
    dispose(): void {
        console.log('🧹 통합 AI 엔진 리소스 정리 중...');

        this.systemManager.dispose();
        this.clearCache();
        streamingProcessor.reset();

        console.log('✅ 통합 AI 엔진 리소스 정리 완료');
    }

    /**
     * 재시작
     */
    async restart(): Promise<void> {
        console.log('🔄 통합 AI 엔진 재시작 중...');

        this.dispose();
        await this.systemManager.restart();

        console.log('✅ 통합 AI 엔진 재시작 완료');
    }
}

// 기본 인스턴스 생성 및 익스포트
export const integratedAIEngine = new IntegratedAIEngine(); 