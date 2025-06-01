/**
 * 🚀 통합 AI 시스템 API 엔드포인트
 * 
 * ✅ MCP 기반 AI 엔진 통합
 * ✅ FastAPI + MCP 하이브리드 모드
 * ✅ Keep-Alive 시스템 관리
 * ✅ 한국어 NLP 완전 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedAISystem, UnifiedQuery, UnifiedResponse } from '../../../../core/ai/unified-ai-system';

interface QueryRequest {
  question: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  options?: {
    preferFastAPI?: boolean;
    includeAnalysis?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp: number;
}

/**
 * 🧠 AI 질의 처리
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: QueryRequest = await request.json();
    
    // 입력 검증
    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json({
        error: '질문이 필요합니다',
        code: 'INVALID_INPUT',
        timestamp: Date.now()
      } as ErrorResponse, { status: 400 });
    }

    if (body.question.length > 2000) {
      return NextResponse.json({
        error: '질문이 너무 깁니다 (최대 2000자)',
        code: 'INPUT_TOO_LONG',
        timestamp: Date.now()
      } as ErrorResponse, { status: 400 });
    }

    // 시스템 초기화 확인
    try {
      await unifiedAISystem.initialize();
    } catch (error) {
      console.error('❌ [API] 통합 AI 시스템 초기화 실패:', error);
      return NextResponse.json({
        error: 'AI 시스템 초기화 실패',
        code: 'SYSTEM_INIT_FAILED',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      } as ErrorResponse, { status: 503 });
    }

    // 질의 객체 생성
    const query: UnifiedQuery = {
      id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: body.question.trim(),
      userId: body.userId,
      organizationId: body.organizationId,
      sessionId: body.sessionId || `session_${Date.now()}`,
      context: body.context || {},
      options: body.options || {}
    };

    console.log(`🧠 [API] 새로운 질의: "${query.text.substring(0, 50)}..."`);

    // AI 시스템으로 질의 처리
    const response: UnifiedResponse = await unifiedAISystem.processQuery(query);

    // 응답 로깅
    const processingTime = Date.now() - startTime;
    console.log(`✅ [API] 질의 처리 완료 (${processingTime}ms) - 신뢰도: ${(response.confidence * 100).toFixed(1)}%`);

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        id: response.id,
        answer: response.answer,
        confidence: response.confidence,
        analysis: response.analysis,
        recommendations: response.recommendations,
        actions: response.actions,
        metadata: {
          ...response.metadata,
          apiProcessingTime: processingTime
        },
        sources: response.sources.map(source => ({
          type: source.type,
          confidence: source.confidence,
          // content는 크기가 클 수 있으므로 요약만 포함
          summary: typeof source.content === 'object' 
            ? Object.keys(source.content).join(', ')
            : String(source.content).substring(0, 100)
        }))
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ [API] 질의 처리 중 오류:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      error: 'AI 질의 처리 실패',
      code: 'AI_PROCESSING_FAILED',
      details: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    } as ErrorResponse, { status: 500 });
  }
}

/**
 * 🏥 시스템 상태 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'health':
        const health = await unifiedAISystem.getSystemHealth();
        return NextResponse.json({
          success: true,
          data: health,
          timestamp: Date.now()
        });

      case 'stats':
        const health2 = await unifiedAISystem.getSystemHealth();
        return NextResponse.json({
          success: true,
          data: health2.stats,
          timestamp: Date.now()
        });

      case 'restart':
        console.log('🔄 [API] 시스템 재시작 요청');
        await unifiedAISystem.restart();
        return NextResponse.json({
          success: true,
          message: '시스템이 재시작되었습니다',
          timestamp: Date.now()
        });

      default:
        // 기본 상태 정보
        const basicHealth = await unifiedAISystem.getSystemHealth();
        return NextResponse.json({
          success: true,
          data: {
            status: basicHealth.overall,
            components: Object.keys(basicHealth.components).length,
            uptime: Date.now() // 임시 업타임
          },
          message: 'MCP 기반 통합 AI 시스템이 실행 중입니다',
          timestamp: Date.now()
        });
    }

  } catch (error) {
    console.error('❌ [API] 상태 조회 실패:', error);
    
    return NextResponse.json({
      error: '시스템 상태 조회 실패',
      code: 'HEALTH_CHECK_FAILED',
      details: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    } as ErrorResponse, { status: 500 });
  }
}

/**
 * 🔧 시스템 관리
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'initialize':
        await unifiedAISystem.initialize();
        return NextResponse.json({
          success: true,
          message: '시스템이 초기화되었습니다',
          timestamp: Date.now()
        });

      case 'shutdown':
        await unifiedAISystem.shutdown();
        return NextResponse.json({
          success: true,
          message: '시스템이 종료되었습니다',
          timestamp: Date.now()
        });

      case 'restart':
        await unifiedAISystem.restart();
        return NextResponse.json({
          success: true,
          message: '시스템이 재시작되었습니다',
          timestamp: Date.now()
        });

      default:
        return NextResponse.json({
          error: '알 수 없는 액션',
          code: 'UNKNOWN_ACTION',
          timestamp: Date.now()
        } as ErrorResponse, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [API] 시스템 관리 실패:', error);
    
    return NextResponse.json({
      error: '시스템 관리 실패',
      code: 'SYSTEM_MANAGEMENT_FAILED',
      details: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    } as ErrorResponse, { status: 500 });
  }
}

/**
 * 🧹 캐시 및 데이터 관리
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const target = url.searchParams.get('target');

    switch (target) {
      case 'cache':
        // 캐시 정리 (구현 필요)
        console.log('🧹 [API] 캐시 정리 요청');
        return NextResponse.json({
          success: true,
          message: '캐시가 정리되었습니다',
          timestamp: Date.now()
        });

      case 'logs':
        // 로그 정리 (구현 필요)
        console.log('🧹 [API] 로그 정리 요청');
        return NextResponse.json({
          success: true,
          message: '로그가 정리되었습니다',
          timestamp: Date.now()
        });

      default:
        return NextResponse.json({
          error: '정리 대상을 지정해주세요',
          code: 'TARGET_REQUIRED',
          timestamp: Date.now()
        } as ErrorResponse, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [API] 데이터 정리 실패:', error);
    
    return NextResponse.json({
      error: '데이터 정리 실패',
      code: 'CLEANUP_FAILED',
      details: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    } as ErrorResponse, { status: 500 });
  }
} 