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
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'overview';
        const timeframe = searchParams.get('timeframe') || '24h';

        // 전략적 분석 데이터 생성
        const strategicAnalysis = {
            type,
            timeframe,
            analysis: {
                overview: {
                    systemHealth: 'good',
                    performanceScore: 85,
                    riskLevel: 'low',
                    recommendedActions: 3
                },
                trends: {
                    serverLoad: {
                        current: 68,
                        trend: 'stable',
                        prediction: 'maintaining'
                    },
                    errorRate: {
                        current: 1.2,
                        trend: 'decreasing',
                        prediction: 'improving'
                    },
                    responseTime: {
                        current: 245,
                        trend: 'stable',
                        prediction: 'maintaining'
                    }
                },
                insights: [
                    {
                        category: 'performance',
                        priority: 'high',
                        insight: '서버 응답 시간이 목표치 내에서 안정적으로 유지되고 있습니다',
                        action: '현재 최적화 설정을 유지하세요'
                    },
                    {
                        category: 'reliability',
                        priority: 'medium',
                        insight: '오류율이 지속적으로 감소하고 있습니다',
                        action: '모니터링을 계속하고 추가 개선 기회를 탐색하세요'
                    },
                    {
                        category: 'capacity',
                        priority: 'low',
                        insight: '현재 용량 활용률이 적정 수준입니다',
                        action: '피크 시간대 대비 용량 계획을 검토하세요'
                    }
                ],
                recommendations: [
                    {
                        id: 'rec-001',
                        title: '로드 밸런싱 최적화',
                        description: '트래픽 분산을 개선하여 응답 시간을 5% 단축할 수 있습니다',
                        impact: 'medium',
                        effort: 'low',
                        priority: 1
                    },
                    {
                        id: 'rec-002',
                        title: '캐싱 전략 강화',
                        description: '자주 요청되는 데이터의 캐싱을 확대하여 성능을 향상시킬 수 있습니다',
                        impact: 'high',
                        effort: 'medium',
                        priority: 2
                    },
                    {
                        id: 'rec-003',
                        title: '모니터링 대시보드 개선',
                        description: '실시간 알림 시스템을 추가하여 문제 대응 시간을 단축할 수 있습니다',
                        impact: 'medium',
                        effort: 'high',
                        priority: 3
                    }
                ]
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                dataPoints: 1247,
                confidenceScore: 92,
                analysisVersion: '2.1.0'
            }
        };

        return NextResponse.json({
            success: true,
            data: strategicAnalysis
        });
    } catch (error) {
        console.error('전략적 분석 조회 오류:', error);
        return NextResponse.json(
            {
                success: false,
                error: '전략적 분석 조회 실패',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 