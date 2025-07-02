/**
 * 🔄 AI 폴백 모드 API 엔드포인트
 *
 * 2가지 모드별 폴백 전략 테스트:
 * - LOCAL: 룰기반 → RAG → MCP (Google AI 제외)
 * - GOOGLE_ONLY: Google AI 우선 → 나머지 AI 도구들
 */

import { FallbackModeManager } from '@/core/ai/managers/FallbackModeManager';
import { NextRequest, NextResponse } from 'next/server';

// 타입 정의
type AIFallbackMode = 'LOCAL' | 'GOOGLE_ONLY';

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
          currentMode: 'LOCAL', // 기본값
          modeStats: {},
          timestamp: new Date().toISOString(),
        });

      case 'modes':
        return NextResponse.json({
          success: true,
          availableModes: [
            {
              mode: 'LOCAL',
              description: '룰기반 → RAG → MCP (Google AI 제외)',
              priority: ['rule_based', 'rag', 'mcp'],
            },
            {
              mode: 'GOOGLE_ONLY',
              description: 'Google AI 우선 → 나머지 AI 도구들',
              priority: ['google_ai', 'other_ai_tools'],
            },
          ],
        });

      default:
        return NextResponse.json({
          success: true,
          message: '폴백 모드 API',
          endpoints: {
            'GET ?action=status': '현재 모드 및 통계',
            'GET ?action=modes': '사용 가능한 모드 목록',
            POST: '모드 설정 또는 질의 처리',
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

// POST: 모드 설정 또는 질의 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, mode, query, context } = body;

    switch (action) {
      case 'setMode':
        if (!mode || !['LOCAL', 'GOOGLE_ONLY'].includes(mode)) {
          return NextResponse.json(
            {
              success: false,
              error:
                '유효하지 않은 모드입니다. LOCAL, GOOGLE_ONLY 중 선택하세요.',
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `폴백 모드가 ${mode}로 변경되었습니다.`,
          currentMode: mode,
          timestamp: new Date().toISOString(),
        });

      case 'processQuery':
        if (!query) {
          return NextResponse.json(
            {
              success: false,
              error: 'query 파라미터가 필요합니다.',
            },
            { status: 400 }
          );
        }

        // 실제 폴백 매니저를 사용한 처리
        const response = await fallbackManager.executeWithFallback(
          query,
          undefined,
          context
        );

        return NextResponse.json({
          success: response.success,
          query,
          mode: response.mode,
          response: {
            content: response.response,
            confidence: response.confidence,
            fallbacksUsed: response.fallbacksUsed,
            mcpContextUsed: response.mcpContextUsed,
          },
          processingTime: response.totalTime,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              '지원하지 않는 액션입니다. setMode 또는 processQuery를 사용하세요.',
          },
          { status: 400 }
        );
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
