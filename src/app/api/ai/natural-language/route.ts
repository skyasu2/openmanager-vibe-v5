/**
 * 🗣️ 자연어 질의 처리 API
 * 
 * 2가지 모드 지원:
 * - LOCAL: 로컬 AI 엔진들 (Korean AI + MCP + RAG)
 * - GOOGLE_AI: Google AI 우선 처리
 * 
 * 각 모드별 폴백 처리:
 * - LOCAL 모드: Korean AI → MCP → RAG → 에러
 * - GOOGLE_AI 모드: Google AI → Korean AI → 에러
 */

import { NaturalLanguageModeProcessor, NLModeRequest } from '@/services/ai/NaturalLanguageModeProcessor';
import { NextRequest, NextResponse } from 'next/server';

// 2가지 모드 정의
type NaturalLanguageMode = 'LOCAL' | 'GOOGLE_AI';

interface NaturalLanguageRequest {
    query: string;
    mode: NaturalLanguageMode;
    context?: any;
    options?: {
        enableFallback?: boolean;
        maxRetries?: number;
        timeout?: number;
    };
}

interface NaturalLanguageResponse {
    success: boolean;
    response: string;
    mode: NaturalLanguageMode;
    engine: string;
    confidence: number;
    processingTime: number;
    fallbacksUsed: string[];
    error?: string;
    metadata?: {
        originalMode: NaturalLanguageMode;
        finalEngine: string;
        fallbackReason?: string;
    };
}

// GET: 사용 가능한 모드 및 상태 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        const processor = NaturalLanguageModeProcessor.getInstance();

        switch (action) {
            case 'modes':
                return NextResponse.json({
                    success: true,
                    availableModes: [
                        {
                            mode: 'LOCAL',
                            description: '로컬 AI 엔진들 (Korean AI + MCP + RAG)',
                            engines: ['korean-ai', 'mcp', 'rag'],
                            fallbackOrder: ['korean-ai', 'mcp', 'rag'],
                        },
                        {
                            mode: 'GOOGLE_AI',
                            description: 'Google AI 우선 처리',
                            engines: ['google-ai', 'korean-ai'],
                            fallbackOrder: ['google-ai', 'korean-ai'],
                        },
                    ],
                });

            case 'status':
                const systemStatus = await processor.getSystemStatus();
                return NextResponse.json({
                    success: true,
                    status: systemStatus,
                    timestamp: new Date().toISOString(),
                });

            default:
                return NextResponse.json({
                    success: true,
                    message: '자연어 질의 처리 API',
                    endpoints: {
                        'GET ?action=modes': '사용 가능한 모드 목록',
                        'GET ?action=status': '엔진 상태 확인',
                        'POST': '자연어 질의 처리',
                    },
                });
        }
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// POST: 자연어 질의 처리
export async function POST(request: NextRequest) {
    try {
        const body: NaturalLanguageRequest = await request.json();
        const { query, mode, context, options = {} } = body;

        // 입력 검증
        if (!query || !query.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'query 파라미터가 필요합니다.',
                },
                { status: 400 }
            );
        }

        if (!mode || !['LOCAL', 'GOOGLE_AI'].includes(mode)) {
            return NextResponse.json(
                {
                    success: false,
                    error: '유효한 모드를 선택해주세요. (LOCAL, GOOGLE_AI)',
                },
                { status: 400 }
            );
        }

        // 자연어 질의 처리
        const processor = NaturalLanguageModeProcessor.getInstance();
        const processRequest: NLModeRequest = {
            query,
            mode,
            context,
            options: {
                enableFallback: options.enableFallback !== false,
                maxRetries: options.maxRetries || 2,
                timeout: options.timeout || 10000,
            },
        };

        const result = await processor.processQuery(processRequest);

        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
} 