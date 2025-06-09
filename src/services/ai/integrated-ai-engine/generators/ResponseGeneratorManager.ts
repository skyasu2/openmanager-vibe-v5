/**
 * 📝 Response Generator Manager
 * 
 * 답변 생성기 통합 관리
 * - Intent별 맞춤 답변 생성
 * - 다국어 지원
 * - 템플릿 기반 답변
 * - 동적 콘텐츠 삽입
 */

import {
    ResponseGenerator,
    ResponseGeneratorConfig,
    AIQueryResponse,
    IntentType
} from '../types/AIEngineTypes';

export class ResponseGeneratorManager {
    private static instance: ResponseGeneratorManager;
    private generators = new Map<IntentType, ResponseGenerator>();

    /**
     * 싱글톤 인스턴스 조회
     */
    static getInstance(): ResponseGeneratorManager {
        if (!ResponseGeneratorManager.instance) {
            ResponseGeneratorManager.instance = new ResponseGeneratorManager();
            ResponseGeneratorManager.instance.initializeGenerators();
        }
        return ResponseGeneratorManager.instance;
    }

    /**
     * 생성기 초기화
     */
    private initializeGenerators(): void {
        this.registerGenerator('troubleshooting', new TroubleshootingGenerator());
        this.registerGenerator('prediction', new PredictionGenerator());
        this.registerGenerator('analysis', new AnalysisGenerator());
        this.registerGenerator('monitoring', new MonitoringGenerator());
        this.registerGenerator('reporting', new ReportingGenerator());
        this.registerGenerator('performance', new PerformanceGenerator());
        this.registerGenerator('general', new GeneralGenerator());
    }

    /**
     * 생성기 등록
     */
    registerGenerator(intent: IntentType, generator: ResponseGenerator): void {
        this.generators.set(intent, generator);
    }

    /**
     * 답변 생성
     */
    generateResponse(
        intent: IntentType,
        response: AIQueryResponse,
        config: ResponseGeneratorConfig
    ): string {
        const generator = this.generators.get(intent) || this.generators.get('general');

        if (!generator) {
            return this.generateFallbackResponse(config.language);
        }

        try {
            return generator.generate(response, config);
        } catch (error: any) {
            console.error(`답변 생성 실패 (${intent}):`, error);
            return this.generateErrorResponse(config.language, error.message);
        }
    }

    /**
     * 폴백 답변 생성
     */
    private generateFallbackResponse(language: 'ko' | 'en'): string {
        return language === 'ko'
            ? '죄송합니다. 적절한 답변을 생성할 수 없습니다.'
            : 'Sorry, I cannot generate an appropriate response.';
    }

    /**
     * 에러 답변 생성
     */
    private generateErrorResponse(language: 'ko' | 'en', error: string): string {
        return language === 'ko'
            ? `답변 생성 중 오류가 발생했습니다: ${error}`
            : `An error occurred while generating response: ${error}`;
    }
}

/**
 * 문제 해결 답변 생성기
 */
class TroubleshootingGenerator implements ResponseGenerator {
    canGenerate(intent: IntentType): boolean {
        return intent === 'troubleshooting';
    }

    generate(response: AIQueryResponse, config: ResponseGeneratorConfig): string {
        const { language } = config;
        const hasAnomalies = response.analysis_results.anomaly_detection &&
            Object.keys(response.analysis_results.anomaly_detection).length > 0;
        const hasAlerts = response.analysis_results.active_alerts &&
            response.analysis_results.active_alerts.length > 0;

        if (language === 'ko') {
            let answer = '🔧 **시스템 문제 해결 분석 결과**\n\n';

            if (hasAnomalies) {
                answer += '**감지된 이상 징후:**\n';
                for (const [metric, anomaly] of Object.entries(response.analysis_results.anomaly_detection)) {
                    answer += `- ${metric}: ${anomaly.description} (심각도: ${anomaly.severity})\n`;
                }
                answer += '\n';
            }

            if (hasAlerts) {
                answer += '**활성 알림:**\n';
                response.analysis_results.active_alerts.forEach((alert: any) => {
                    answer += `- ${alert.message} (${alert.severity})\n`;
                });
                answer += '\n';
            }

            if (!hasAnomalies && !hasAlerts) {
                answer += '현재 시스템에서 특별한 문제가 감지되지 않았습니다.\n\n';
            }

            answer += '**권장 조치사항:**\n';
            if (response.recommendations.length > 0) {
                response.recommendations.forEach(rec => {
                    answer += `- ${rec}\n`;
                });
            } else {
                answer += '- 정기적인 시스템 모니터링을 계속 진행하세요.\n';
                answer += '- 성능 지표를 주기적으로 확인하세요.\n';
            }

            return answer;
        } else {
            let answer = '🔧 **System Troubleshooting Analysis Results**\n\n';

            if (hasAnomalies) {
                answer += '**Detected Anomalies:**\n';
                for (const [metric, anomaly] of Object.entries(response.analysis_results.anomaly_detection)) {
                    answer += `- ${metric}: ${anomaly.description} (Severity: ${anomaly.severity})\n`;
                }
                answer += '\n';
            }

            if (hasAlerts) {
                answer += '**Active Alerts:**\n';
                response.analysis_results.active_alerts.forEach((alert: any) => {
                    answer += `- ${alert.message} (${alert.severity})\n`;
                });
                answer += '\n';
            }

            if (!hasAnomalies && !hasAlerts) {
                answer += 'No specific issues detected in the current system.\n\n';
            }

            answer += '**Recommended Actions:**\n';
            if (response.recommendations.length > 0) {
                response.recommendations.forEach(rec => {
                    answer += `- ${rec}\n`;
                });
            } else {
                answer += '- Continue regular system monitoring.\n';
                answer += '- Check performance metrics periodically.\n';
            }

            return answer;
        }
    }
}

/**
 * 예측 답변 생성기
 */
class PredictionGenerator implements ResponseGenerator {
    canGenerate(intent: IntentType): boolean {
        return intent === 'prediction';
    }

    generate(response: AIQueryResponse, config: ResponseGeneratorConfig): string {
        const { language } = config;
        const hasPredictions = response.analysis_results.ai_predictions &&
            Object.keys(response.analysis_results.ai_predictions).length > 0;

        if (language === 'ko') {
            let answer = '🔮 **AI 예측 분석 결과**\n\n';

            if (hasPredictions) {
                answer += '**장애 예측 결과:**\n';
                for (const [metric, prediction] of Object.entries(response.analysis_results.ai_predictions)) {
                    const probability = (prediction.prediction[0] * 100).toFixed(1);
                    const confidence = (prediction.confidence * 100).toFixed(1);
                    answer += `- ${metric}: ${probability}% 확률 (신뢰도: ${confidence}%)\n`;

                    if (prediction.factors && prediction.factors.length > 0) {
                        answer += `  영향 요인: ${prediction.factors.join(', ')}\n`;
                    }
                }
                answer += '\n';
            } else {
                answer += '현재 수집된 데이터로는 명확한 예측을 제공하기 어렵습니다.\n\n';
            }

            // 트렌드 예측 추가
            if (response.analysis_results.trend_forecasts) {
                answer += '**트렌드 예측:**\n';
                for (const [metric, trend] of Object.entries(response.analysis_results.trend_forecasts)) {
                    answer += `- ${metric}: ${trend.trend} 추세 (신뢰도: ${(trend.confidence * 100).toFixed(1)}%)\n`;
                }
                answer += '\n';
            }

            answer += '**예방 조치 권장사항:**\n';
            response.recommendations.forEach(rec => {
                answer += `- ${rec}\n`;
            });

            return answer;
        } else {
            let answer = '🔮 **AI Prediction Analysis Results**\n\n';

            if (hasPredictions) {
                answer += '**Failure Prediction Results:**\n';
                for (const [metric, prediction] of Object.entries(response.analysis_results.ai_predictions)) {
                    const probability = (prediction.prediction[0] * 100).toFixed(1);
                    const confidence = (prediction.confidence * 100).toFixed(1);
                    answer += `- ${metric}: ${probability}% probability (Confidence: ${confidence}%)\n`;

                    if (prediction.factors && prediction.factors.length > 0) {
                        answer += `  Contributing factors: ${prediction.factors.join(', ')}\n`;
                    }
                }
                answer += '\n';
            } else {
                answer += 'Unable to provide clear predictions with currently collected data.\n\n';
            }

            // 트렌드 예측 추가
            if (response.analysis_results.trend_forecasts) {
                answer += '**Trend Forecasts:**\n';
                for (const [metric, trend] of Object.entries(response.analysis_results.trend_forecasts)) {
                    answer += `- ${metric}: ${trend.trend} trend (Confidence: ${(trend.confidence * 100).toFixed(1)}%)\n`;
                }
                answer += '\n';
            }

            answer += '**Preventive Action Recommendations:**\n';
            response.recommendations.forEach(rec => {
                answer += `- ${rec}\n`;
            });

            return answer;
        }
    }
}

/**
 * 분석 답변 생성기
 */
class AnalysisGenerator implements ResponseGenerator {
    canGenerate(intent: IntentType): boolean {
        return intent === 'analysis';
    }

    generate(response: AIQueryResponse, config: ResponseGeneratorConfig): string {
        const { language } = config;

        if (language === 'ko') {
            let answer = '📊 **시스템 분석 결과**\n\n';

            // AI 예측 결과
            if (response.analysis_results.ai_predictions) {
                answer += '**AI 분석 결과:**\n';
                const predictionCount = Object.keys(response.analysis_results.ai_predictions).length;
                answer += `- ${predictionCount}개 메트릭에 대한 분석 완료\n`;
            }

            // 이상 탐지 결과
            if (response.analysis_results.anomaly_detection) {
                const anomalies = Object.values(response.analysis_results.anomaly_detection)
                    .filter((anomaly: any) => anomaly.is_anomaly);
                answer += `- ${anomalies.length}개 이상 징후 탐지\n`;
            }

            answer += '\n**세부 분석:**\n';
            answer += '시스템 메트릭을 종합적으로 분석한 결과, ';

            if (response.analysis_results.active_alerts && response.analysis_results.active_alerts.length > 0) {
                answer += `${response.analysis_results.active_alerts.length}개의 주의사항이 발견되었습니다.\n\n`;
            } else {
                answer += '시스템이 정상적으로 운영되고 있습니다.\n\n';
            }

            return answer;
        } else {
            let answer = '📊 **System Analysis Results**\n\n';

            // AI 예측 결과
            if (response.analysis_results.ai_predictions) {
                answer += '**AI Analysis Results:**\n';
                const predictionCount = Object.keys(response.analysis_results.ai_predictions).length;
                answer += `- Analysis completed for ${predictionCount} metrics\n`;
            }

            // 이상 탐지 결과
            if (response.analysis_results.anomaly_detection) {
                const anomalies = Object.values(response.analysis_results.anomaly_detection)
                    .filter((anomaly: any) => anomaly.is_anomaly);
                answer += `- ${anomalies.length} anomalies detected\n`;
            }

            answer += '\n**Detailed Analysis:**\n';
            answer += 'Based on comprehensive analysis of system metrics, ';

            if (response.analysis_results.active_alerts && response.analysis_results.active_alerts.length > 0) {
                answer += `${response.analysis_results.active_alerts.length} concerns were identified.\n\n`;
            } else {
                answer += 'the system is operating normally.\n\n';
            }

            return answer;
        }
    }
}

/**
 * 모니터링 답변 생성기
 */
class MonitoringGenerator implements ResponseGenerator {
    canGenerate(intent: IntentType): boolean {
        return intent === 'monitoring';
    }

    generate(response: AIQueryResponse, config: ResponseGeneratorConfig): string {
        const { language } = config;

        if (language === 'ko') {
            let answer = '📊 **실시간 모니터링 현황**\n\n';

            answer += '**시스템 상태:**\n';
            if (response.analysis_results.active_alerts && response.analysis_results.active_alerts.length > 0) {
                answer += `- 활성 알림: ${response.analysis_results.active_alerts.length}개\n`;
                response.analysis_results.active_alerts.forEach((alert: any) => {
                    answer += `  • ${alert.message}\n`;
                });
            } else {
                answer += '- 모든 시스템이 정상 상태입니다.\n';
            }

            answer += '\n**모니터링 정보:**\n';
            answer += `- 데이터 수집 시간: ${response.metadata.timestamp}\n`;
            answer += `- 사용된 컴포넌트: ${response.processing_stats.components_used.join(', ')}\n`;

            return answer;
        } else {
            let answer = '📊 **Real-time Monitoring Status**\n\n';

            answer += '**System Status:**\n';
            if (response.analysis_results.active_alerts && response.analysis_results.active_alerts.length > 0) {
                answer += `- Active alerts: ${response.analysis_results.active_alerts.length}\n`;
                response.analysis_results.active_alerts.forEach((alert: any) => {
                    answer += `  • ${alert.message}\n`;
                });
            } else {
                answer += '- All systems are operating normally.\n';
            }

            answer += '\n**Monitoring Information:**\n';
            answer += `- Data collection time: ${response.metadata.timestamp}\n`;
            answer += `- Components used: ${response.processing_stats.components_used.join(', ')}\n`;

            return answer;
        }
    }
}

/**
 * 보고서 답변 생성기
 */
class ReportingGenerator implements ResponseGenerator {
    canGenerate(intent: IntentType): boolean {
        return intent === 'reporting';
    }

    generate(response: AIQueryResponse, config: ResponseGeneratorConfig): string {
        const { language } = config;

        if (language === 'ko') {
            let answer = '📄 **보고서 생성 완료**\n\n';

            if (response.generated_report) {
                answer += '상세한 보고서가 생성되었습니다:\n\n';
                answer += response.generated_report;
            } else {
                answer += '**요약 보고서:**\n';
                answer += `- 분석 완료 시간: ${response.metadata.timestamp}\n`;
                answer += `- 처리된 데이터 소스: ${response.processing_stats.data_sources.length}개\n`;
                answer += `- 사용된 AI 모델: ${response.processing_stats.models_executed.join(', ')}\n\n`;

                answer += '**주요 발견사항:**\n';
                if (response.recommendations.length > 0) {
                    response.recommendations.forEach(rec => {
                        answer += `- ${rec}\n`;
                    });
                } else {
                    answer += '- 특별한 이슈가 발견되지 않았습니다.\n';
                }
            }

            return answer;
        } else {
            let answer = '📄 **Report Generation Complete**\n\n';

            if (response.generated_report) {
                answer += 'A detailed report has been generated:\n\n';
                answer += response.generated_report;
            } else {
                answer += '**Summary Report:**\n';
                answer += `- Analysis completion time: ${response.metadata.timestamp}\n`;
                answer += `- Data sources processed: ${response.processing_stats.data_sources.length}\n`;
                answer += `- AI models used: ${response.processing_stats.models_executed.join(', ')}\n\n`;

                answer += '**Key Findings:**\n';
                if (response.recommendations.length > 0) {
                    response.recommendations.forEach(rec => {
                        answer += `- ${rec}\n`;
                    });
                } else {
                    answer += '- No specific issues were identified.\n';
                }
            }

            return answer;
        }
    }
}

/**
 * 성능 답변 생성기
 */
class PerformanceGenerator implements ResponseGenerator {
    canGenerate(intent: IntentType): boolean {
        return intent === 'performance';
    }

    generate(response: AIQueryResponse, config: ResponseGeneratorConfig): string {
        const { language } = config;

        if (language === 'ko') {
            let answer = '⚡ **시스템 성능 분석 결과**\n\n';

            answer += '**성능 지표:**\n';
            answer += `- 총 처리 시간: ${response.processing_stats.total_time}ms\n`;

            if (response.analysis_results.performance_metrics) {
                answer += '- 주요 성능 메트릭이 분석되었습니다.\n';
            }

            answer += '\n**성능 최적화 권장사항:**\n';
            if (response.recommendations.length > 0) {
                response.recommendations.forEach(rec => {
                    answer += `- ${rec}\n`;
                });
            } else {
                answer += '- 현재 성능 수준이 양호합니다.\n';
                answer += '- 정기적인 성능 모니터링을 계속하세요.\n';
            }

            return answer;
        } else {
            let answer = '⚡ **System Performance Analysis Results**\n\n';

            answer += '**Performance Metrics:**\n';
            answer += `- Total processing time: ${response.processing_stats.total_time}ms\n`;

            if (response.analysis_results.performance_metrics) {
                answer += '- Key performance metrics have been analyzed.\n';
            }

            answer += '\n**Performance Optimization Recommendations:**\n';
            if (response.recommendations.length > 0) {
                response.recommendations.forEach(rec => {
                    answer += `- ${rec}\n`;
                });
            } else {
                answer += '- Current performance level is good.\n';
                answer += '- Continue regular performance monitoring.\n';
            }

            return answer;
        }
    }
}

/**
 * 일반 답변 생성기
 */
class GeneralGenerator implements ResponseGenerator {
    canGenerate(intent: IntentType): boolean {
        return intent === 'general';
    }

    generate(response: AIQueryResponse, config: ResponseGeneratorConfig): string {
        const { language } = config;

        if (language === 'ko') {
            let answer = '💬 **질의 응답 결과**\n\n';

            if (response.analysis_results.document_results && response.analysis_results.document_results.length > 0) {
                answer += '**관련 문서 검색 결과:**\n';
                response.analysis_results.document_results.slice(0, 3).forEach((doc: any) => {
                    answer += `- ${doc.title} (관련도: ${(doc.relevance_score * 100).toFixed(1)}%)\n`;
                });
                answer += '\n';
            }

            if (response.analysis_results.system_overview) {
                answer += '**시스템 개요:**\n';
                const overview = response.analysis_results.system_overview;
                answer += `- 관리 서버 수: ${overview.server_count}개\n`;
                answer += `- 활성 알림: ${overview.alert_count}개\n`;
                answer += `- 마지막 업데이트: ${overview.last_update}\n\n`;
            }

            answer += '추가 질문이 있으시면 언제든지 말씀해 주세요.';

            return answer;
        } else {
            let answer = '💬 **Query Response Results**\n\n';

            if (response.analysis_results.document_results && response.analysis_results.document_results.length > 0) {
                answer += '**Related Document Search Results:**\n';
                response.analysis_results.document_results.slice(0, 3).forEach((doc: any) => {
                    answer += `- ${doc.title} (Relevance: ${(doc.relevance_score * 100).toFixed(1)}%)\n`;
                });
                answer += '\n';
            }

            if (response.analysis_results.system_overview) {
                answer += '**System Overview:**\n';
                const overview = response.analysis_results.system_overview;
                answer += `- Managed servers: ${overview.server_count}\n`;
                answer += `- Active alerts: ${overview.alert_count}\n`;
                answer += `- Last update: ${overview.last_update}\n\n`;
            }

            answer += 'Please feel free to ask if you have any additional questions.';

            return answer;
        }
    }
}

// 싱글톤 인스턴스 익스포트
export const responseGeneratorManager = ResponseGeneratorManager.getInstance(); 