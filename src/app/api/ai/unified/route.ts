/**
 * 🚀 통합 AI 엔진 API - 경연대회용 최적화
 * 
 * UnifiedAIEngine을 사용한 단일 진입점 API
 * 모든 AI 기능을 하나로 통합하여 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedAIEngine, UnifiedAnalysisRequest } from '@/core/ai/UnifiedAIEngine';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // 요청 검증
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required and must be a string',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // UnifiedAnalysisRequest 구성
    const analysisRequest: UnifiedAnalysisRequest = {
      query: body.query,
      context: {
        serverMetrics: body.context?.serverMetrics || [],
        logEntries: body.context?.logEntries || [],
        timeRange: body.context?.timeRange ? {
          start: new Date(body.context.timeRange.start),
          end: new Date(body.context.timeRange.end)
        } : undefined,
        sessionId: body.context?.sessionId,
        urgency: body.context?.urgency || 'medium'
      },
      options: {
        enablePython: body.options?.enablePython !== false, // 기본값: true
        enableJavaScript: body.options?.enableJavaScript !== false, // 기본값: true
        maxResponseTime: body.options?.maxResponseTime || 30000, // 30초
        confidenceThreshold: body.options?.confidenceThreshold || 0.3
      }
    };

    console.log('🔥 UnifiedAI 요청:', {
      query: body.query,
      hasMetrics: analysisRequest.context?.serverMetrics?.length || 0,
      hasLogs: analysisRequest.context?.logEntries?.length || 0,
      options: analysisRequest.options
    });

    // UnifiedAIEngine으로 분석 수행
    const result = await unifiedAIEngine.processQuery(analysisRequest);

    // 응답 생성
    const response = {
      ...result,
      meta: {
        processingTime: Date.now() - startTime,
        apiVersion: '2.0.0',
        engine: 'UnifiedAIEngine',
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ UnifiedAI 응답:', {
      success: result.success,
      intent: result.intent?.primary,
      confidence: result.analysis?.confidence,
      enginesUsed: result.engines?.used,
      totalTime: Date.now() - startTime
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ UnifiedAI API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        processingTime: Date.now() - startTime,
        apiVersion: '2.0.0',
        engine: 'UnifiedAIEngine',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 🔍 시스템 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      const status = await unifiedAIEngine.getSystemStatus();
      
      return NextResponse.json({
        status: 'healthy',
        engine: 'UnifiedAIEngine',
        version: '2.0.0',
        details: status,
        timestamp: new Date().toISOString()
      });
    }

    // 기본 정보 반환
    return NextResponse.json({
      name: 'Unified AI Engine API',
      version: '2.0.0',
      description: 'MCP 기반 통합 AI 분석 엔진',
      endpoints: {
        'POST /': '통합 AI 분석 요청',
        'GET /?action=health': '시스템 상태 확인'
      },
      features: [
        '🧠 Intent 분류 및 최적화',
        '🔧 JavaScript + Python 하이브리드 엔진',
        '📊 실시간 서버 메트릭 분석',
        '🔍 로그 분석 및 이상 탐지',
        '📈 예측 분석 및 용량 계획',
        '⚡ 세션 관리 및 컨텍스트 유지'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 