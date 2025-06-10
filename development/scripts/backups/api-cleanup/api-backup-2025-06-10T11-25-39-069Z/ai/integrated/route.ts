/**
 * 🧠 통합 AI 엔진 API 엔드포인트
 * TypeScript 기반 단일 서버 AI 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIEngine } from '@/core/ai/integrated-ai-engine';

/**
 * 🎯 통합 AI 분석 요청 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    console.log('🧠 통합 AI 요청 수신:', {
      query: body.query?.substring(0, 50) + '...',
      hasMetrics: !!body.metrics,
      metricsCount: body.metrics?.length || 0,
      hasContext: !!body.context,
      timestamp: new Date().toISOString(),
    });

    // 🏥 헬스체크 요청 처리
    if (body.action === 'health-check' || body.action === 'health') {
      const aiEngine = getAIEngine();
      const status = aiEngine.getEngineStatus();

      return NextResponse.json({
        success: true,
        status: 'healthy',
        message: '통합 AI 엔진이 정상 동작 중입니다',
        timestamp: new Date().toISOString(),
        engine_info: status,
        processing_time: Date.now() - startTime,
      });
    }

    // 🛡️ 요청 데이터 검증
    if (!body.query || typeof body.query !== 'string') {
      console.warn('⚠️ 잘못된 쿼리 형식:', {
        bodyKeys: Object.keys(body),
        queryType: typeof body.query,
        action: body.action,
      });
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 쿼리입니다',
          message:
            '쿼리는 문자열이어야 합니다. 헬스체크의 경우 GET /?action=health 또는 POST { "action": "health-check" }를 사용하세요.',
          received_data: {
            keys: Object.keys(body),
            query_type: typeof body.query,
          },
        },
        { status: 400 }
      );
    }

    // AI 엔진 인스턴스 가져오기
    const aiEngine = getAIEngine();

    // 기본 AI 분석 수행 (analyze 메서드 사용)
    const analysisRequest = {
      type: 'prediction' as const,
      serverId: body.serverId,
      data: body.data || body.metrics || {},
    };

    const result = await aiEngine.analyze(analysisRequest);

    // 🔍 결과 검증 및 변환
    if (!result || result.status === 'error') {
      console.error('❌ AI 엔진 분석 실패:', result?.error);
      return NextResponse.json(
        {
          success: false,
          error: result?.error || 'AI 분석 실패',
          message: '분석을 완료할 수 없습니다. 다시 시도해주세요.',
        },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;

    // 결과를 기존 형식에 맞게 변환
    const aiResult = result.result as any;

    console.log('✅ 통합 AI 분석 완료:', {
      success: result.status === 'success',
      confidence: aiResult?.confidence,
      totalTime,
      engine: 'integrated-typescript',
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: `AI 분석이 완료되었습니다. 신뢰도: ${((aiResult?.confidence || 0.8) * 100).toFixed(1)}%`,
        confidence: aiResult?.confidence || 0.8,
        recommendations: aiResult?.recommendations || [
          '시스템이 정상적으로 작동 중입니다.',
        ],
        analysis_data: aiResult?.predictions || {},
      },
      metadata: {
        engine: 'IntegratedAIEngine',
        engine_version: 'integrated-1.0.0',
        processing_time: totalTime,
        timestamp: new Date().toISOString(),
        standalone: true,
      },
    });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.error('❌ 통합 AI 처리 오류:', {
      error: error.message,
      processingTime: totalTime,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: '통합 AI 분석 중 오류가 발생했습니다',
        message:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        processing_time: totalTime,
        retryable: true,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * 🏥 통합 AI 엔진 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const aiEngine = getAIEngine();

    if (action === 'health') {
      const status = aiEngine.getEngineStatus();

      return NextResponse.json({
        status: 'healthy',
        message:
          '통합 AI 엔진이 정상 동작 중입니다 (현재: LLM API 없이 완전 독립 동작, 향후: 선택적 API 연동 확장 가능)',
        timestamp: new Date().toISOString(),
        engine_info: status,
        standalone: true,
        external_dependencies: false,
        future_enhancement: 'Optional LLM API integration planned',
      });
    }

    if (action === 'status') {
      return NextResponse.json(aiEngine.getEngineStatus());
    }

    return NextResponse.json({
      service: 'Integrated AI Engine',
      version: 'integrated-1.0.0',
      description: 'TypeScript 기반 단일 서버 AI 분석 엔진',
      endpoints: {
        'POST /': 'AI 분석 요청',
        'GET /?action=health': '시스템 상태 확인',
        'GET /?action=status': '엔진 상태 조회',
      },
      advantages: [
        '외부 Python 서비스 불필요',
        '단일 서버 운영',
        '빠른 응답 시간',
        '콜드 스타트 없음',
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: '통합 AI 엔진 상태 확인 실패',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
