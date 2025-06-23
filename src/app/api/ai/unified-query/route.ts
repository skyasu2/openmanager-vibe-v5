/**
 * 🎯 통합 AI 쿼리 API v3.0
 *
 * 새로운 AI 엔진 아키텍처 기반:
 * - Supabase RAG: 메인 엔진 (자연어 처리 및 로컬 AI 엔진의 핵심)
 * - Google AI: 모드별 가중치 조정
 * - MCP: 표준 MCP 서버 역할 (AI 기능 제거)
 * - 하위 AI 도구들: 모든 모드에서 편리하게 사용
 *
 * 지원 모드:
 * - AUTO: 다층 폴백 (기본값)
 * - LOCAL: Google AI 제외
 * - GOOGLE_ONLY: Google AI 우선
 */

import {
  AIRequest,
  AIResponse,
  unifiedAIRouter,
} from '@/core/ai/engines/UnifiedAIEngineRouter';
import { NextRequest, NextResponse } from 'next/server';

// 요청 검증 스키마
interface UnifiedQueryRequest {
  query: string;
  mode?: 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY';
  category?: string;
  context?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// 응답 형식
interface UnifiedQueryResponse {
  success: boolean;
  data?: AIResponse;
  error?: string;
  timestamp: string;
  version: string;
  architecture: {
    mainEngine: string;
    mode: string;
    enginePath: string[];
    processingTime: number;
  };
}

/**
 * POST /api/ai/unified-query
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 요청 데이터 파싱
    const body: UnifiedQueryRequest = await request.json();

    // 필수 필드 검증
    if (
      !body.query ||
      typeof body.query !== 'string' ||
      body.query.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: '질의(query)는 필수이며 빈 문자열일 수 없습니다.',
          timestamp: new Date().toISOString(),
          version: '3.0',
          architecture: {
            mainEngine: 'none',
            mode: 'none',
            enginePath: [],
            processingTime: Date.now() - startTime,
          },
        } as UnifiedQueryResponse,
        { status: 400 }
      );
    }

    // 모드 검증
    const validModes = ['AUTO', 'LOCAL', 'GOOGLE_ONLY'];
    if (body.mode && !validModes.includes(body.mode)) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 모드입니다. 지원 모드: ${validModes.join(', ')}`,
          timestamp: new Date().toISOString(),
          version: '3.0',
          architecture: {
            mainEngine: 'none',
            mode: body.mode || 'invalid',
            enginePath: [],
            processingTime: Date.now() - startTime,
          },
        } as UnifiedQueryResponse,
        { status: 400 }
      );
    }

    // AI 요청 객체 생성
    const aiRequest: AIRequest = {
      query: body.query.trim(),
      mode: body.mode || 'AUTO',
      category: body.category,
      context: body.context,
      priority: body.priority || 'medium',
    };

    console.log(
      `🎯 통합 AI 쿼리 요청: "${aiRequest.query}" (모드: ${aiRequest.mode})`
    );

    // 통합 AI 엔진 라우터로 처리
    const aiResponse = await unifiedAIRouter.processQuery(aiRequest);

    // 성공 응답
    const response: UnifiedQueryResponse = {
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString(),
      version: '3.0',
      architecture: {
        mainEngine: aiResponse.metadata.mainEngine,
        mode: aiResponse.mode,
        enginePath: aiResponse.enginePath,
        processingTime: aiResponse.processingTime,
      },
    };

    console.log(
      `✅ 통합 AI 쿼리 완료: ${aiResponse.processingTime}ms (엔진: ${aiResponse.metadata.mainEngine})`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Engine': aiResponse.metadata.mainEngine,
        'X-AI-Mode': aiResponse.mode,
        'X-Processing-Time': aiResponse.processingTime.toString(),
        'X-Confidence': aiResponse.confidence.toString(),
      },
    });
  } catch (error) {
    console.error('❌ 통합 AI 쿼리 처리 실패:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.';

    const errorResponse: UnifiedQueryResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      version: '3.0',
      architecture: {
        mainEngine: 'error',
        mode: 'error',
        enginePath: ['error'],
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Error': 'unified-ai-query-failed',
      },
    });
  }
}

/**
 * GET /api/ai/unified-query - 상태 및 설정 조회
 */
export async function GET(): Promise<NextResponse> {
  try {
    const status = unifiedAIRouter.getEngineStatus();
    const stats = unifiedAIRouter.getStats();

    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'active',
          version: '3.0',
          architecture: 'unified-router',
          currentMode: status.currentMode,
          engines: status.engines,
          statistics: {
            totalQueries: stats.totalQueries,
            modeUsage: stats.modeUsage,
            engineUsage: stats.engineUsage,
            averageResponseTime: Math.round(stats.averageResponseTime),
            fallbackRate: Math.round(stats.fallbackRate * 100) / 100,
          },
          features: {
            supabaseRAG: {
              role: 'main-engine',
              description: '자연어 처리 및 로컬 AI 엔진의 핵심',
              weight: '50-80%',
            },
            googleAI: {
              role: 'mode-dependent',
              description: '모드에 따라 가중치 조정',
              weight: '2-80%',
            },
            mcp: {
              role: 'standard-server',
              description: '표준 MCP 서버 역할 (AI 기능 제거)',
              weight: '지원 도구',
            },
            subEngines: {
              role: 'enhancement-tools',
              description: '모든 모드에서 편리하게 사용 가능한 하위 AI 도구들',
              engines: ['korean', 'transformers', 'openSource', 'custom'],
            },
          },
          modes: {
            AUTO: {
              description:
                'Supabase RAG (50%) → MCP+하위AI (30%) → 하위AI (18%) → Google AI (2%)',
              recommended: true,
            },
            LOCAL: {
              description:
                'Supabase RAG (80%) → MCP+하위AI (20%) → Google AI 제외',
              useCase: 'Google AI 없이 로컬 처리만',
            },
            GOOGLE_ONLY: {
              description: 'Google AI (80%) → Supabase RAG (15%) → 하위AI (5%)',
              useCase: 'Google AI 우선 처리',
            },
          },
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('❌ 통합 AI 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상태 조회 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai/unified-query - 모드 변경
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!body.mode || !['AUTO', 'LOCAL', 'GOOGLE_ONLY'].includes(body.mode)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 모드를 지정해주세요: AUTO, LOCAL, GOOGLE_ONLY',
        },
        { status: 400 }
      );
    }

    const oldMode = unifiedAIRouter.getCurrentMode();
    unifiedAIRouter.setMode(body.mode);

    return NextResponse.json({
      success: true,
      data: {
        message: `AI 모드가 변경되었습니다: ${oldMode} → ${body.mode}`,
        oldMode,
        newMode: body.mode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ AI 모드 변경 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '모드 변경 실패',
      },
      { status: 500 }
    );
  }
}
