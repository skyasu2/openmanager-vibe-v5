/**
 * 🎯 Intent Handler Manager
 * 
 * Intent 핸들러 통합 관리
 * - 7가지 Intent 타입 처리
 * - 핸들러 등록 및 실행
 * - 성능 모니터링
 * - 에러 처리
 */

import { realMCPClient } from '../../../mcp/real-mcp-client';
import { tensorFlowAIEngine } from '../../tensorflow-engine';
import { aiEngineUtils } from '../utils/AIEngineUtils';
import {
    IntentHandler,
    IntentHandlerResult,
    NLPResult,
    AIQueryRequest,
    AIQueryResponse,
    IntentType,
    SystemMetrics
} from '../types/AIEngineTypes';

export class IntentHandlerManager {
    private static instance: IntentHandlerManager;
    private handlers = new Map<IntentType, IntentHandler>();

    /**
     * 싱글톤 인스턴스 조회
     */
    static getInstance(): IntentHandlerManager {
        if (!IntentHandlerManager.instance) {
            IntentHandlerManager.instance = new IntentHandlerManager();
            IntentHandlerManager.instance.initializeHandlers();
        }
        return IntentHandlerManager.instance;
    }

    /**
     * 핸들러 초기화
     */
    private initializeHandlers(): void {
        this.registerHandler('troubleshooting', new TroubleshootingHandler());
        this.registerHandler('prediction', new PredictionHandler());
        this.registerHandler('analysis', new AnalysisHandler());
        this.registerHandler('monitoring', new MonitoringHandler());
        this.registerHandler('reporting', new ReportingHandler());
        this.registerHandler('performance', new PerformanceHandler());
        this.registerHandler('general', new GeneralHandler());
    }

    /**
     * 핸들러 등록
     */
    registerHandler(intent: IntentType, handler: IntentHandler): void {
        this.handlers.set(intent, handler);
    }

    /**
     * Intent 처리
     */
    async handleIntent(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult> {
        const intent = nlpResult.intent as IntentType;
        const handler = this.handlers.get(intent) || this.handlers.get('general');

        if (!handler) {
            return {
                success: false,
                error: `No handler found for intent: ${intent}`,
                processing_time: 0,
                components_used: [],
                models_executed: []
            };
        }

        const startTime = performance.now();

        try {
            const result = await handler.handle(nlpResult, request, response);
            result.processing_time = performance.now() - startTime;
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Unknown error',
                processing_time: performance.now() - startTime,
                components_used: [],
                models_executed: []
            };
        }
    }

    /**
     * 등록된 핸들러 목록 조회
     */
    getRegisteredHandlers(): IntentType[] {
        return Array.from(this.handlers.keys());
    }
}

/**
 * 문제 해결 핸들러
 */
class TroubleshootingHandler implements IntentHandler {
    canHandle(intent: IntentType): boolean {
        return intent === 'troubleshooting';
    }

    async handle(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult> {
        console.log('🔧 문제 해결 모드 실행');

        try {
            // 시스템 메트릭 수집
            const systemMetrics = await aiEngineUtils.collectSystemMetrics(
                request.context?.server_ids
            );

            // AI 분석 수행 (메트릭이 있는 경우)
            if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
                const flattenedMetrics = this.flattenMetrics(systemMetrics.servers);
                const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);

                response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
                response.analysis_results.anomaly_detection = aiAnalysis.anomaly_detections;
            }

            return {
                success: true,
                data: systemMetrics,
                processing_time: 0,
                components_used: ['mcp-client', 'tensorflow-engine'],
                models_executed: ['failure-prediction', 'anomaly-detection']
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                processing_time: 0,
                components_used: [],
                models_executed: []
            };
        }
    }

    private flattenMetrics(servers: Record<string, Record<string, number[]>>): Record<string, number[]> {
        const flattened: Record<string, number[]> = {};
        for (const [serverId, serverMetrics] of Object.entries(servers)) {
            for (const [metricName, values] of Object.entries(serverMetrics)) {
                flattened[`${serverId}_${metricName}`] = values;
            }
        }
        return flattened;
    }
}

/**
 * 예측 핸들러
 */
class PredictionHandler implements IntentHandler {
    canHandle(intent: IntentType): boolean {
        return intent === 'prediction';
    }

    async handle(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult> {
        console.log('🔮 예측 모드 실행');

        try {
            const systemMetrics = await aiEngineUtils.collectSystemMetrics(
                request.context?.server_ids
            );

            if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
                const flattenedMetrics = this.flattenMetrics(systemMetrics.servers);
                const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);

                response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
                response.analysis_results.trend_forecasts = aiAnalysis.trend_predictions;

                // 높은 신뢰도 예측에 대한 알림 생성
                for (const [metric, prediction] of Object.entries(aiAnalysis.failure_predictions)) {
                    if (prediction.confidence > 0.8 && prediction.prediction[0] > 0.6) {
                        systemMetrics.alerts.push({
                            type: 'prediction',
                            severity: 'high',
                            metric: metric,
                            message: `높은 확률의 장애 예측: ${(prediction.prediction[0] * 100).toFixed(1)}%`,
                            confidence: prediction.confidence,
                        });
                    }
                }
            }

            response.analysis_results.active_alerts = systemMetrics.alerts;

            return {
                success: true,
                data: systemMetrics,
                processing_time: 0,
                components_used: ['tensorflow-engine', 'prediction-model'],
                models_executed: ['failure-prediction', 'trend-prediction']
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                processing_time: 0,
                components_used: [],
                models_executed: []
            };
        }
    }

    private flattenMetrics(servers: Record<string, Record<string, number[]>>): Record<string, number[]> {
        const flattened: Record<string, number[]> = {};
        for (const [serverId, serverMetrics] of Object.entries(servers)) {
            for (const [metricName, values] of Object.entries(serverMetrics)) {
                flattened[`${serverId}_${metricName}`] = values;
            }
        }
        return flattened;
    }
}

/**
 * 분석 핸들러
 */
class AnalysisHandler implements IntentHandler {
    canHandle(intent: IntentType): boolean {
        return intent === 'analysis';
    }

    async handle(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult> {
        console.log('📊 분석 모드 실행');

        try {
            const systemMetrics = await aiEngineUtils.collectSystemMetrics(
                request.context?.server_ids
            );

            if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
                const flattenedMetrics = this.flattenMetrics(systemMetrics.servers);
                const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);

                response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
                response.analysis_results.anomaly_detection = aiAnalysis.anomaly_detections;
            }

            // MCP를 통한 추가 컨텍스트 수집
            if (request.context?.session_id) {
                const sessionContext = await realMCPClient.retrieveContext(
                    request.context.session_id
                );
                response.analysis_results.session_context = sessionContext;
            }

            return {
                success: true,
                data: systemMetrics,
                processing_time: 0,
                components_used: ['tensorflow-engine', 'mcp-client'],
                models_executed: ['failure-prediction', 'anomaly-detection']
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                processing_time: 0,
                components_used: [],
                models_executed: []
            };
        }
    }

    private flattenMetrics(servers: Record<string, Record<string, number[]>>): Record<string, number[]> {
        const flattened: Record<string, number[]> = {};
        for (const [serverId, serverMetrics] of Object.entries(servers)) {
            for (const [metricName, values] of Object.entries(serverMetrics)) {
                flattened[`${serverId}_${metricName}`] = values;
            }
        }
        return flattened;
    }
}

/**
 * 모니터링 핸들러
 */
class MonitoringHandler implements IntentHandler {
    canHandle(intent: IntentType): boolean {
        return intent === 'monitoring';
    }

    async handle(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult> {
        console.log('📊 모니터링 모드 실행');

        try {
            const systemMetrics = await aiEngineUtils.collectSystemMetrics(
                request.context?.server_ids
            );

            // 실시간 상태 분석
            if (systemMetrics.alerts && systemMetrics.alerts.length > 0) {
                response.analysis_results.active_alerts = systemMetrics.alerts;
            }

            return {
                success: true,
                data: systemMetrics,
                processing_time: 0,
                components_used: ['system_metrics', 'real_time_monitoring'],
                models_executed: []
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                processing_time: 0,
                components_used: [],
                models_executed: []
            };
        }
    }
}

/**
 * 보고서 핸들러
 */
class ReportingHandler implements IntentHandler {
    canHandle(intent: IntentType): boolean {
        return intent === 'reporting';
    }

    async handle(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult> {
        console.log('📄 보고서 생성 모드 실행');

        try {
            const systemMetrics = await aiEngineUtils.collectSystemMetrics(
                request.context?.server_ids
            );

            // 보고서 생성 플래그 설정
            response.metadata.debug_info = {
                ...response.metadata.debug_info,
                should_generate_report: true,
                report_type: 'system_analysis'
            };

            return {
                success: true,
                data: systemMetrics,
                processing_time: 0,
                components_used: ['report-generator', 'system_metrics'],
                models_executed: []
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                processing_time: 0,
                components_used: [],
                models_executed: []
            };
        }
    }
}

/**
 * 성능 핸들러
 */
class PerformanceHandler implements IntentHandler {
    canHandle(intent: IntentType): boolean {
        return intent === 'performance';
    }

    async handle(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult> {
        console.log('⚡ 성능 분석 모드 실행');

        try {
            const systemMetrics = await aiEngineUtils.collectSystemMetrics(
                request.context?.server_ids
            );

            // 성능 관련 메트릭 강조
            response.analysis_results.performance_metrics = {
                response_times: systemMetrics.servers,
                throughput: systemMetrics.global_stats,
                resource_utilization: systemMetrics.servers
            };

            return {
                success: true,
                data: systemMetrics,
                processing_time: 0,
                components_used: ['performance-analyzer', 'system_metrics'],
                models_executed: ['performance-prediction']
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                processing_time: 0,
                components_used: [],
                models_executed: []
            };
        }
    }
}

/**
 * 일반 핸들러
 */
class GeneralHandler implements IntentHandler {
    canHandle(intent: IntentType): boolean {
        return intent === 'general';
    }

    async handle(
        nlpResult: NLPResult,
        request: AIQueryRequest,
        response: AIQueryResponse
    ): Promise<IntentHandlerResult> {
        console.log('💬 일반 질의 모드 실행');

        try {
            // 키워드 기반 문서 검색
            const searchResults = await aiEngineUtils.searchDocumentsByKeywords(
                nlpResult.keywords
            );

            response.analysis_results.document_results = searchResults;

            // 기본 시스템 상태 정보
            const systemMetrics = await aiEngineUtils.collectSystemMetrics();
            response.analysis_results.system_overview = {
                server_count: Object.keys(systemMetrics.servers).length,
                alert_count: systemMetrics.alerts.length,
                last_update: systemMetrics.timestamp
            };

            return {
                success: true,
                data: { searchResults, systemMetrics },
                processing_time: 0,
                components_used: ['document-search', 'system_metrics'],
                models_executed: []
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                processing_time: 0,
                components_used: [],
                models_executed: []
            };
        }
    }
}

// 싱글톤 인스턴스 익스포트
export const intentHandlerManager = IntentHandlerManager.getInstance(); 