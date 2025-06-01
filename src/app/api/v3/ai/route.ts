/**
 * 🚀 AI 엔진 v3.0 API 엔드포인트
 * 
 * ✅ 실제 MCP 표준 프로토콜
 * ✅ TensorFlow.js 로컬 AI
 * ✅ 완전한 RAG 시스템
 * ✅ Vercel 서버리스 최적화
 */

import { NextRequest, NextResponse } from 'next/server';
import { integratedAIEngine } from '@/services/ai/integrated-ai-engine';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    
    console.log('🚀 AI v3.0 요청 수신:', {
      query: body.query?.substring(0, 50) + '...',
      context: body.context,
      timestamp: new Date().toISOString()
    });

    // 🛡️ 입력 검증
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 쿼리입니다',
        message: '쿼리는 문자열이어야 합니다'
      }, { status: 400 });
    }

    // 🧠 AI 엔진 초기화
    await integratedAIEngine.initialize();

    // 🎯 통합 AI 처리
    const result = await integratedAIEngine.processQuery({
      query: body.query,
      context: {
        session_id: body.sessionId,
        user_id: body.userId,
        server_ids: body.serverIds,
        include_predictions: body.include_predictions !== false,
        include_charts: body.include_charts !== false,
        language: body.language || 'ko'
      },
      options: {
        max_response_time: 30000,
        confidence_threshold: 0.3,
        enable_streaming: false,
        include_debug: process.env.NODE_ENV === 'development'
      }
    });

    const totalTime = Date.now() - startTime;

    console.log('✅ AI v3.0 처리 완료:', {
      success: result.success,
      intent: result.intent,
      time: totalTime,
      models_used: result.processing_stats.models_executed
    });

    return NextResponse.json({
      ...result,
      version: 'v3.0',
      engine_info: {
        framework: 'TensorFlow.js + MCP',
        local_ai: true,
        external_dependencies: false,
        vercel_optimized: true
      }
    });

  } catch (error: any) {
    console.error('❌ AI v3.0 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '시스템 오류가 발생했습니다',
      message: error.message,
      timestamp: new Date().toISOString(),
      version: 'v3.0'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      const status = await integratedAIEngine.getEngineStatus();
      
      return NextResponse.json({
        status: 'healthy',
        message: 'AI 엔진 v3.0이 정상 동작 중입니다',
        timestamp: new Date().toISOString(),
        engine_status: status,
        features: [
          '🧠 TensorFlow.js 로컬 AI',
          '📄 실제 MCP 프로토콜',
          '🔍 RAG 문서 검색',
          '📊 장애 예측 + 이상 탐지',
          '⚡ Vercel 서버리스 최적화'
        ]
      });
    }

    if (action === 'status') {
      return NextResponse.json(await integratedAIEngine.getEngineStatus());
    }

    if (action === 'models') {
      const { tensorFlowAIEngine } = await import('@/services/ai/tensorflow-engine');
      return NextResponse.json(await tensorFlowAIEngine.getModelInfo());
    }

    if (action === 'mcp') {
      const { realMCPClient } = await import('@/services/mcp/real-mcp-client');
      return NextResponse.json({
        connection_info: realMCPClient.getConnectionInfo(),
        server_status: await realMCPClient.getServerStatus()
      });
    }

    return NextResponse.json({
      service: 'AI Engine v3.0',
      version: '3.0.0',
      description: '실제 MCP + TensorFlow.js 통합 AI 엔진',
      architecture: {
        ai_framework: 'TensorFlow.js',
        protocol: 'MCP v1.12.1',
        processing: 'Local (서버리스)',
        deployment: 'Vercel 최적화'
      },
      endpoints: {
        'POST /api/v3/ai': 'AI 분석 요청',
        'GET /api/v3/ai?action=health': '시스템 상태',
        'GET /api/v3/ai?action=status': '엔진 상태',
        'GET /api/v3/ai?action=models': '모델 정보',
        'GET /api/v3/ai?action=mcp': 'MCP 상태'
      },
      capabilities: [
        'AI 장애 예측 (신경망)',
        'AI 이상 탐지 (오토인코더)',
        'AI 시계열 예측 (LSTM)',
        'MCP 문서 검색 (RAG)',
        '자연어 처리 (NLP)',
        '자동 보고서 생성'
      ],
      advantages: [
        '외부 API 의존성 없음',
        '완전한 로컬 AI 처리',
        'Vercel 서버리스 호환',
        '실제 MCP 표준 준수',
        '빠른 콜드 스타트',
        '확장 가능한 아키텍처'
      ]
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'AI 엔진 v3.0 상태 확인 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 