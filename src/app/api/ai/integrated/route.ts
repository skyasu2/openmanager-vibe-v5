/**
 * 🧠 통합 AI 엔진 API 엔드포인트
 * TypeScript 기반 단일 서버 AI 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntegratedAIEngine } from '@/core/ai/integrated-ai-engine';

// 통합 AI 엔진 인스턴스
const aiEngine = IntegratedAIEngine.getInstance();

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
      timestamp: new Date().toISOString()
    });

    // 🛡️ 요청 데이터 검증
    if (!body.query || typeof body.query !== 'string') {
      console.warn('⚠️ 잘못된 쿼리 형식:', typeof body.query);
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 쿼리입니다',
        message: '쿼리는 문자열이어야 합니다'
      }, { status: 400 });
    }

    // AI 엔진 초기화 (필요시)
    try {
      await aiEngine.initialize();
    } catch (initError) {
      console.error('❌ AI 엔진 초기화 실패:', initError);
      return NextResponse.json({
        success: false,
        error: 'AI 엔진을 초기화할 수 없습니다',
        message: 'AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        retryable: true
      }, { status: 503 });
    }

    // 분석 수행
    const result = await aiEngine.analyzeMetrics(
      body.query,
      body.metrics || [],
      body.data || {}
    );

    // 🔍 결과 검증
    if (!result || typeof result !== 'object') {
      console.error('❌ AI 엔진에서 잘못된 결과:', result);
      return NextResponse.json({
        success: false,
        error: 'AI 분석 결과가 올바르지 않습니다',
        message: '분석을 완료할 수 없습니다. 다시 시도해주세요.'
      }, { status: 500 });
    }

    const totalTime = Date.now() - startTime;

    console.log('✅ 통합 AI 분석 완료:', {
      success: result.success,
      confidence: result.confidence,
      totalTime,
      engine: 'integrated-typescript',
      hasRecommendations: !!result.recommendations,
      hasSummary: !!result.summary
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: result.summary || '분석이 완료되었습니다.',
        confidence: result.confidence || 0.8,
        recommendations: result.recommendations || [],
        analysis_data: result.analysis_data || {}
      },
      metadata: {
        engine: 'IntegratedAIEngine',
        engine_version: 'integrated-1.0.0',
        processing_time: totalTime,
        timestamp: new Date().toISOString(),
        standalone: true // 외부 Python 서비스 불필요
      }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    
    console.error('❌ 통합 AI 처리 오류:', {
      error: error.message,
      stack: error.stack?.split('\n')[0], // 첫 번째 스택 라인만
      processingTime: totalTime,
      timestamp: new Date().toISOString()
    });

    // 🔧 개발 모드에서 더 상세한 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 상세 에러 정보:', error);
    }

    // 🛡️ 에러 타입별 적절한 응답
    if (error.name === 'SyntaxError') {
      return NextResponse.json({
        success: false,
        error: '요청 데이터 형식이 올바르지 않습니다',
        message: 'JSON 형식을 확인해주세요.',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
      return NextResponse.json({
        success: false,
        error: 'AI 분석이 시간 초과되었습니다',
        message: '요청이 너무 복잡하거나 시스템이 바쁩니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
        code: 'TIMEOUT'
      }, { status: 408 });
    }

    // 기본 500 에러 응답
    return NextResponse.json({
      success: false,
      error: '통합 AI 분석 중 오류가 발생했습니다',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      processing_time: totalTime,
      retryable: true,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * 🏥 통합 AI 엔진 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      const status = aiEngine.getSystemStatus();
      
      return NextResponse.json({
        status: 'healthy',
        message: '통합 AI 엔진이 정상 동작 중입니다',
        timestamp: new Date().toISOString(),
        engine_info: status,
        standalone: true,
        external_dependencies: false
      });
    }

    if (action === 'status') {
      return NextResponse.json(aiEngine.getSystemStatus());
    }

    return NextResponse.json({
      service: 'Integrated AI Engine',
      version: 'integrated-1.0.0',
      description: 'TypeScript 기반 단일 서버 AI 분석 엔진',
      endpoints: {
        'POST /': 'AI 분석 요청',
        'GET /?action=health': '시스템 상태 확인',
        'GET /?action=status': '엔진 상태 조회'
      },
      advantages: [
        '외부 Python 서비스 불필요',
        '단일 서버 운영',
        '빠른 응답 시간',
        '콜드 스타트 없음'
      ]
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '통합 AI 엔진 상태 확인 실패',
      message: error.message
    }, { status: 500 });
  }
} 