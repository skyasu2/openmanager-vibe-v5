/**
 * 🔄 AI 폴백 모드 API 엔드포인트
 * 
 * 3가지 모드별 폴백 전략 테스트:
 * - AUTO: 룰기반 → RAG → MCP → Google AI (기본)
 * - GOOGLE_ONLY: Google AI 우선 → 나머지 AI 도구들
 * - LOCAL: 룰기반 → RAG → MCP (Google AI 제외)
 */

import { NextRequest, NextResponse } from 'next/server';
import { FallbackModeManager, AIFallbackMode } from '@/core/ai/managers/FallbackModeManager';

// FallbackModeManager 인스턴스
const fallbackManager = FallbackModeManager.getInstance();

// GET: 현재 모드 및 통계 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'status':
                return NextResponse.json({
                    success: true,
                    currentMode: fallbackManager.getCurrentMode(),
                    modeStats: Object.fromEntries(fallbackManager.getModeStats()),
                    timestamp: new Date().toISOString()
                });

            case 'modes':
                return NextResponse.json({
                    success: true,
                    availableModes: [
                        {
                            mode: 'AUTO',
                            description: '룰기반 → RAG → MCP → Google AI (기본)',
                            priority: ['rule_based', 'rag', 'mcp', 'google_ai']
                        },
                        {
                            mode: 'GOOGLE_ONLY',
                            description: 'Google AI 우선 → 나머지 AI 도구들',
                            priority: ['google_ai', 'other_ai_tools']
                        },
                        {
                            mode: 'LOCAL',
                            description: '룰기반 → RAG → MCP (Google AI 제외)',
                            priority: ['rule_based', 'rag', 'mcp']
                        }
                    ]
                });

            default:
                return NextResponse.json({
                    success: true,
                    message: '폴백 모드 API',
                    endpoints: {
                        'GET ?action=status': '현재 모드 및 통계',
                        'GET ?action=modes': '사용 가능한 모드 목록',
                        'POST': '모드 설정 또는 질의 처리'
                    }
                });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// POST: 모드 설정 또는 질의 처리
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, mode, query, context, options } = body;

        switch (action) {
            case 'setMode':
                if (!mode || !['AUTO', 'GOOGLE_ONLY', 'LOCAL'].includes(mode)) {
                    return NextResponse.json({
                        success: false,
                        error: '유효하지 않은 모드입니다. AUTO, GOOGLE_ONLY, LOCAL 중 선택하세요.'
                    }, { status: 400 });
                }

                fallbackManager.setMode(mode as AIFallbackMode);

                return NextResponse.json({
                    success: true,
                    message: `폴백 모드가 ${mode}로 변경되었습니다.`,
                    currentMode: fallbackManager.getCurrentMode(),
                    timestamp: new Date().toISOString()
                });

            case 'processQuery':
                if (!query) {
                    return NextResponse.json({
                        success: false,
                        error: 'query 파라미터가 필요합니다.'
                    }, { status: 400 });
                }

                const requestMode = mode || fallbackManager.getCurrentMode();
                const fallbackRequest = {
                    query,
                    mode: requestMode as AIFallbackMode,
                    intent: { primary: query, confidence: 0.8, category: 'general' },
                    context: context || {},
                    options: options || {}
                };

                const response = await fallbackManager.processWithFallback(fallbackRequest);

                return NextResponse.json({
                    success: response.success,
                    query,
                    mode: requestMode,
                    response: {
                        content: response.content,
                        confidence: response.confidence,
                        sources: response.sources,
                        tier: response.metadata.tier,
                        fallbacksUsed: response.metadata.fallbacksUsed,
                        fallbackChain: response.fallbackChain,
                        qualityScore: response.metadata.qualityScore
                    },
                    processingTime: response.metadata.responseTime,
                    timestamp: new Date().toISOString()
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: '지원하지 않는 액션입니다. setMode 또는 processQuery를 사용하세요.'
                }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 