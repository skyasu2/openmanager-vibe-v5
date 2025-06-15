/**
 * 🎯 전략적 AI 엔진 API 엔드포인트
 * 
 * 새로운 DataProcessingOrchestrator와 통합된 UnifiedAIEngine의
 * processStrategicQuery 메서드를 테스트하는 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedAIEngine } from '@/core/ai/UnifiedAIEngine';
import type { UnifiedAnalysisRequest } from '@/core/ai/UnifiedAIEngine';

export async function POST(request: NextRequest) {
    try {
        console.log('🎯 전략적 AI 엔진 API 요청 수신');

        const body = await request.json();
        const { query, context, options } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'query 필드가 필요합니다'
                },
                { status: 400 }
            );
        }

        // UnifiedAnalysisRequest 구성
        const analysisRequest: UnifiedAnalysisRequest = {
            query: query.trim(),
            context: {
                urgency: context?.urgency || 'medium',
                sessionId: context?.sessionId,
                ...context
            },
            options: {
                use_cache: options?.useCache !== false,
                enable_thinking_log: options?.enableThinking !== false,
                maxResponseTime: options?.timeout || 30000,
                confidenceThreshold: options?.confidenceThreshold || 0.7,
                ...options
            }
        };

        console.log(`🚀 전략적 쿼리 처리: "${query}"`);

        // AI 엔진 초기화 확인
        await unifiedAIEngine.initialize();

        // 새로운 전략적 쿼리 처리
        const result = await unifiedAIEngine.processStrategicQuery(analysisRequest);

        console.log(`✅ 전략적 처리 완료: ${result.metadata.sessionId}`);

        return NextResponse.json({
            success: true,
            data: result,
            metadata: {
                apiVersion: '5.44.0-strategic',
                processingMethod: 'DataProcessingOrchestrator',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ 전략적 AI 엔진 API 오류:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : '알 수 없는 오류',
                    code: 'STRATEGIC_AI_ERROR',
                    timestamp: new Date().toISOString()
                }
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'status':
                // 시스템 상태 조회
                const systemStatus = await unifiedAIEngine.getSystemStatus();
                return NextResponse.json({
                    success: true,
                    data: {
                        ...systemStatus,
                        strategicArchitecture: {
                            orchestrator: 'DataProcessingOrchestrator',
                            strategies: ['monitoring_focus', 'ai_analysis', 'hybrid', 'auto_select'],
                            caching: 'UnifiedCacheManager (L1/L2/L3)',
                            errorHandling: 'ErrorHandlingMiddleware'
                        }
                    }
                });

            case 'test':
                // 간단한 테스트 쿼리
                const testQueries = [
                    '서버 상태 확인해줘',
                    '성능 이상이 있는 서버 찾아줘',
                    '전체 시스템 상태 분석해줘'
                ];

                const testQuery = testQueries[Math.floor(Math.random() * testQueries.length)];

                const testRequest: UnifiedAnalysisRequest = {
                    query: testQuery,
                    context: { urgency: 'low' },
                    options: { use_cache: false, enable_thinking_log: true }
                };

                await unifiedAIEngine.initialize();
                const testResult = await unifiedAIEngine.processStrategicQuery(testRequest);

                return NextResponse.json({
                    success: true,
                    data: {
                        testQuery,
                        result: testResult,
                        performance: {
                            responseTime: testResult.response_time,
                            cacheHit: testResult.cache_hit,
                            strategy: testResult.engine_used
                        }
                    }
                });

            default:
                return NextResponse.json({
                    success: true,
                    data: {
                        message: '전략적 AI 엔진 API',
                        version: '5.44.0-strategic',
                        endpoints: {
                            'POST /': '전략적 쿼리 처리',
                            'GET /?action=status': '시스템 상태 조회',
                            'GET /?action=test': '테스트 쿼리 실행'
                        },
                        architecture: {
                            orchestrator: 'DataProcessingOrchestrator',
                            strategies: ['monitoring_focus', 'ai_analysis', 'hybrid', 'auto_select'],
                            caching: 'Multi-level (L1/L2/L3)',
                            errorHandling: 'Centralized middleware'
                        }
                    }
                });
        }

    } catch (error) {
        console.error('❌ 전략적 AI 엔진 GET API 오류:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : '알 수 없는 오류',
                    code: 'STRATEGIC_AI_GET_ERROR'
                }
            },
            { status: 500 }
        );
    }
} 