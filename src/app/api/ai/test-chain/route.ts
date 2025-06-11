/**
 * 🧪 AI 엔진 체인 테스트 API
 * 
 * MCP → RAG → Google AI 폴백 체인 테스트용
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIEngineChain } from '@/core/ai/AIEngineChain';
import { getUnifiedAISystem } from '@/core/ai/unified-ai-system';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { question, userId } = body;

        if (!question) {
            return NextResponse.json(
                { error: '질문이 필요합니다' },
                { status: 400 }
            );
        }

        // AI 엔진 체인 직접 테스트
        const aiChain = getAIEngineChain();

        const result = await aiChain.processQuery({
            id: `test_${Date.now()}`,
            text: question,
            userId: userId || 'test-user'
        });

        return NextResponse.json({
            success: true,
            result,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('AI 엔진 체인 테스트 오류:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            timestamp: Date.now()
        }, { status: 500 });
    }
}

export async function GET(): Promise<NextResponse> {
    try {
        // 시스템 상태 확인
        const aiChain = getAIEngineChain();
        const healthStatus = await aiChain.getSystemHealth();

        const unifiedAI = getUnifiedAISystem();
        const systemHealth = await unifiedAI.getSystemHealth();

        return NextResponse.json({
            aiChain: healthStatus,
            unifiedSystem: systemHealth,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('시스템 상태 확인 오류:', error);

        return NextResponse.json({
            error: error instanceof Error ? error.message : '상태 확인 실패',
            timestamp: Date.now()
        }, { status: 500 });
    }
} 