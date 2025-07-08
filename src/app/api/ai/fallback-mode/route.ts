/**
 * 🔄 AI 폴백 모드 API 엔드포인트 (ThreeTierAIRouter 통합)
 *
 * 3-Tier 폴백 전략:
 * - Local → GCP → Google AI
 * - 성능, 비용, 안정성 전략 지원
 */

import { ThreeTierAIRouter } from '@/services/ai/ThreeTierAIRouter';
import { AIRequest } from '@/types/ai-types';
import { NextRequest, NextResponse } from 'next/server';

// 타입 정의
type AIFallbackStrategy = 'performance' | 'cost' | 'reliability';

// ThreeTierAIRouter 인스턴스
const threeTierRouter = ThreeTierAIRouter.getInstance();

// GET: 현재 모드 및 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const stats = await threeTierRouter.getStats();
        return NextResponse.json({
          success: true,
          currentStrategy: process.env.THREE_TIER_STRATEGY || 'performance',
          tierStats: stats,
          timestamp: new Date().toISOString(),
        });

      case 'strategies':
        return NextResponse.json({
          success: true,
          availableStrategies: [
            {
              strategy: 'performance',
              description: '성능 우선: Local → GCP → Google AI',
              priority: ['local', 'gcp', 'google'],
            },
            {
              strategy: 'cost',
              description: '비용 우선: Local → GCP → Google AI (비용 최적화)',
              priority: ['local', 'gcp', 'google'],
            },
            {
              strategy: 'reliability',
              description: '안정성 우선: GCP → Local → Google AI',
              priority: ['gcp', 'local', 'google'],
            },
          ],
        });

      default:
        return NextResponse.json({
          success: true,
          message: '3-Tier AI 폴백 API',
          endpoints: {
            'GET ?action=status': '현재 전략 및 통계',
            'GET ?action=strategies': '사용 가능한 전략 목록',
            POST: '전략 설정 또는 질의 처리',
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
    const { action, strategy, query, context } = body;

    switch (action) {
      case 'setStrategy':
        if (!strategy || !['performance', 'cost', 'reliability'].includes(strategy)) {
          return NextResponse.json(
            {
              success: false,
              error:
                '유효하지 않은 전략입니다. performance, cost, reliability 중 선택하세요.',
            },
            { status: 400 }
          );
        }

        // 환경 변수 업데이트 (실제로는 설정 파일이나 데이터베이스에 저장)
        process.env.THREE_TIER_STRATEGY = strategy;

        return NextResponse.json({
          success: true,
          message: `3-Tier 전략이 ${strategy}로 변경되었습니다.`,
          currentStrategy: strategy,
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

        // ThreeTierAIRouter를 사용한 처리
        const aiRequest: AIRequest = {
          query,
          mode: 'auto',
          context,
        };

        const response = await threeTierRouter.processQuery(aiRequest);

        return NextResponse.json({
          success: response.success,
          query,
          strategy: process.env.THREE_TIER_STRATEGY || 'performance',
          response: {
            content: response.response,
            confidence: response.confidence,
            tier: response.metadata?.tier,
            fallbackUsed: response.metadata?.fallbackUsed,
          },
          processingTime: response.processingTime,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              '지원하지 않는 액션입니다. setStrategy 또는 processQuery를 사용하세요.',
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
