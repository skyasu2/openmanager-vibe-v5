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
      metricsCount: body.metrics?.length || 0
    });

    // AI 엔진 초기화 (필요시)
    await aiEngine.initialize();

    // 분석 수행
    const result = await aiEngine.analyzeMetrics(
      body.query || '시스템 상태를 분석해주세요',
      body.metrics || [],
      body.data || {}
    );

    const totalTime = Date.now() - startTime;

    console.log('✅ 통합 AI 분석 완료:', {
      success: result.success,
      confidence: result.confidence,
      totalTime,
      engine: 'integrated-typescript'
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: result.summary,
        confidence: result.confidence,
        recommendations: result.recommendations,
        analysis_data: result.analysis_data
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
    console.error('❌ 통합 AI 처리 오류:', error);

    return NextResponse.json({
      success: false,
      error: '통합 AI 분석 중 오류가 발생했습니다',
      message: error.message,
      processing_time: Date.now() - startTime
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