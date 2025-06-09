/**
 * 🔄 Streaming Processor
 * 
 * 스트리밍 응답 처리
 * - 실시간 응답 스트리밍
 * - 청크 단위 데이터 처리
 * - 진행 상황 추적
 * - 에러 처리 및 복구
 */

import { aiEngineUtils } from '../utils/AIEngineUtils';
import { nlpProcessor } from '../nlp/NLPProcessor';
import { intentHandlerManager } from '../intents/IntentHandlerManager';
import { responseGeneratorManager } from '../generators/ResponseGeneratorManager';
import {
    StreamingProcessor as IStreamingProcessor,
    StreamingChunk,
    AIQueryRequest,
    AIQueryResponse,
    IntentType
} from '../types/AIEngineTypes';

export class StreamingProcessor implements IStreamingProcessor {
    private static instance: StreamingProcessor;
    private chunkCounter = 0;

    /**
     * 싱글톤 인스턴스 조회
     */
    static getInstance(): StreamingProcessor {
        if (!StreamingProcessor.instance) {
            StreamingProcessor.instance = new StreamingProcessor();
        }
        return StreamingProcessor.instance;
    }

    /**
     * 쿼리 스트리밍 처리
     */
    async *processQueryStream(
        request: AIQueryRequest
    ): AsyncGenerator<StreamingChunk, void, unknown> {
        const queryId = aiEngineUtils.generateQueryId();
        const startTime = performance.now();

        try {
            // 1. 초기화 청크
            yield this.createChunk('progress', {
                step: 'initialization',
                message: 'AI 엔진 초기화 중...',
                progress: 0
            });

            // 2. NLP 처리 청크
            yield this.createChunk('progress', {
                step: 'nlp_processing',
                message: '자연어 처리 중...',
                progress: 20
            });

            const nlpResult = await nlpProcessor.processQuery(request.query);

            yield this.createChunk('partial_result', {
                step: 'nlp_complete',
                data: {
                    intent: nlpResult.intent,
                    confidence: nlpResult.confidence,
                    language: nlpResult.language
                },
                progress: 40
            });

            // 3. Intent 처리 청크
            yield this.createChunk('progress', {
                step: 'intent_processing',
                message: `${nlpResult.intent} 처리 중...`,
                progress: 60
            });

            // 초기 응답 구조 생성
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
                    components_used: [],
                    models_executed: [],
                    data_sources: []
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    language: nlpResult.language,
                    session_id: request.context?.session_id
                }
            };

            // Intent 처리
            const intentResult = await intentHandlerManager.handleIntent(
                nlpResult,
                request,
                response
            );

            if (!intentResult.success) {
                yield this.createChunk('error', {
                    message: intentResult.error || 'Intent 처리 실패',
                    code: 'INTENT_PROCESSING_ERROR'
                });
                return;
            }

            // 처리 통계 업데이트
            response.processing_stats.components_used.push(...intentResult.components_used);
            response.processing_stats.models_executed.push(...intentResult.models_executed);

            yield this.createChunk('partial_result', {
                step: 'intent_complete',
                data: {
                    components_used: intentResult.components_used,
                    models_executed: intentResult.models_executed
                },
                progress: 80
            });

            // 4. 답변 생성 청크
            yield this.createChunk('progress', {
                step: 'response_generation',
                message: '답변 생성 중...',
                progress: 90
            });

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

            // 권장사항 생성
            this.generateRecommendations(nlpResult, response);

            // 최종 통계 계산
            response.processing_stats.total_time = performance.now() - startTime;

            // 5. 최종 결과 청크
            yield this.createChunk('final_result', {
                step: 'complete',
                data: response,
                progress: 100
            });

        } catch (error: any) {
            console.error('스트리밍 처리 중 오류:', error);

            yield this.createChunk('error', {
                message: error.message || '알 수 없는 오류가 발생했습니다.',
                code: 'STREAMING_ERROR',
                stack: error.stack
            });
        }
    }

    /**
     * 정적 응답을 스트리밍으로 변환
     */
    async *createStreamingResponse(
        response: AIQueryResponse,
        chunkSize: number = 100
    ): AsyncGenerator<StreamingChunk, void, unknown> {
        try {
            const answer = response.answer;
            const chunks = this.splitIntoChunks(answer, chunkSize);

            for (let i = 0; i < chunks.length; i++) {
                const isLast = i === chunks.length - 1;
                const progress = Math.round(((i + 1) / chunks.length) * 100);

                yield this.createChunk(isLast ? 'final_result' : 'partial_result', {
                    chunk_index: i,
                    chunk_total: chunks.length,
                    content: chunks[i],
                    progress,
                    is_complete: isLast,
                    metadata: isLast ? response.metadata : undefined
                });

                // 스트리밍 효과를 위한 지연
                await this.delay(50);
            }

        } catch (error: any) {
            yield this.createChunk('error', {
                message: error.message || '스트리밍 응답 생성 실패',
                code: 'STREAMING_RESPONSE_ERROR'
            });
        }
    }

    /**
     * 스트리밍 청크 생성
     */
    private createChunk(
        type: StreamingChunk['type'],
        data: any
    ): StreamingChunk {
        return {
            type,
            data,
            timestamp: Date.now(),
            chunk_id: `chunk_${++this.chunkCounter}_${Date.now()}`
        };
    }

    /**
     * 텍스트를 청크로 분할
     */
    private splitIntoChunks(text: string, chunkSize: number): string[] {
        const chunks: string[] = [];
        let currentChunk = '';
        const words = text.split(' ');

        for (const word of words) {
            if (currentChunk.length + word.length + 1 <= chunkSize) {
                currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = word;
                } else {
                    // 단어 자체가 청크 크기보다 큰 경우
                    chunks.push(word);
                }
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    /**
     * 권장사항 생성
     */
    private generateRecommendations(nlpResult: any, response: AIQueryResponse): void {
        const recommendations: string[] = [];
        const lang = nlpResult.language;

        // Intent별 권장사항
        switch (nlpResult.intent) {
            case 'troubleshooting':
                if (lang === 'ko') {
                    recommendations.push('시스템 로그를 정기적으로 확인하세요.');
                    recommendations.push('모니터링 알림을 설정하여 조기 탐지하세요.');
                    recommendations.push('백업 시스템이 정상 작동하는지 확인하세요.');
                } else {
                    recommendations.push('Check system logs regularly.');
                    recommendations.push('Set up monitoring alerts for early detection.');
                    recommendations.push('Verify backup systems are functioning properly.');
                }
                break;

            case 'prediction':
                if (lang === 'ko') {
                    recommendations.push('예측 모델의 정확도를 주기적으로 검증하세요.');
                    recommendations.push('임계값 설정을 현재 시스템에 맞게 조정하세요.');
                    recommendations.push('예측 결과를 바탕으로 예방 조치를 수립하세요.');
                } else {
                    recommendations.push('Regularly validate prediction model accuracy.');
                    recommendations.push('Adjust threshold settings for current system.');
                    recommendations.push('Establish preventive measures based on predictions.');
                }
                break;

            case 'performance':
                if (lang === 'ko') {
                    recommendations.push('성능 기준치를 정의하고 모니터링하세요.');
                    recommendations.push('병목 지점을 식별하고 최적화하세요.');
                    recommendations.push('리소스 사용률을 정기적으로 검토하세요.');
                } else {
                    recommendations.push('Define and monitor performance benchmarks.');
                    recommendations.push('Identify and optimize bottlenecks.');
                    recommendations.push('Review resource utilization regularly.');
                }
                break;

            default:
                if (lang === 'ko') {
                    recommendations.push('시스템 상태를 정기적으로 확인하세요.');
                    recommendations.push('문서화를 최신 상태로 유지하세요.');
                } else {
                    recommendations.push('Check system status regularly.');
                    recommendations.push('Keep documentation up to date.');
                }
        }

        // 분석 결과에 따른 추가 권장사항
        if (response.analysis_results.active_alerts?.length > 0) {
            if (lang === 'ko') {
                recommendations.push('활성 알림에 대한 즉시 조치가 필요합니다.');
            } else {
                recommendations.push('Immediate action required for active alerts.');
            }
        }

        response.recommendations = recommendations;
    }

    /**
     * 지연 함수
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 스트리밍 상태 확인
     */
    isStreamingSupported(): boolean {
        return typeof AsyncGenerator !== 'undefined';
    }

    /**
     * 청크 유효성 검사
     */
    validateChunk(chunk: StreamingChunk): boolean {
        return !!(
            chunk.type &&
            chunk.data !== undefined &&
            chunk.timestamp &&
            chunk.chunk_id
        );
    }

    /**
     * 스트리밍 메트릭 수집
     */
    collectStreamingMetrics(): {
        total_chunks_sent: number;
        last_chunk_timestamp: number;
        streaming_active: boolean;
    } {
        return {
            total_chunks_sent: this.chunkCounter,
            last_chunk_timestamp: Date.now(),
            streaming_active: true
        };
    }

    /**
     * 스트리밍 리셋
     */
    reset(): void {
        this.chunkCounter = 0;
    }
}

// 싱글톤 인스턴스 익스포트
export const streamingProcessor = StreamingProcessor.getInstance(); 