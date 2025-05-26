/**
 * Smart Query API
 * 
 * 🧠 스마트 모드 감지 및 자동 전환 API
 * - 질문 유형 자동 분석
 * - Basic/Advanced 모드 자동 선택
 * - 모드별 처리 시간 제한
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedAIAgentEngine } from '../../../../modules/ai-agent/core/EnhancedAIAgentEngine';

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId, userId, forceMode, serverData } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query is required and must be a string'
      }, { status: 400 });
    }

    // AI 에이전트 활동 기록 (자동 활성화)
    try {
      await fetch(`${request.nextUrl.origin}/api/ai-agent/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activity' })
      });
      console.log('🤖 AI Agent activity recorded from smart-query');
    } catch (error) {
      console.warn('Failed to record AI agent activity:', error);
    }

    // Enhanced AI Agent Engine을 통한 스마트 쿼리 처리
    const response = await enhancedAIAgentEngine.processSmartQuery({
      query,
      sessionId: sessionId || `smart_query_${Date.now()}`,
      userId: userId || 'anonymous',
      forceMode,
      serverData,
      context: {
        source: 'modal',
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        response: response.response,
        mode: response.mode,
        confidence: response.analysis.confidence,
        intent: response.intent.name,
        suggestions: response.actions,
        metadata: {
          processingTime: response.metadata.processingTime,
          sessionId: response.metadata.sessionId,
          userId: userId || 'anonymous',
          engineVersion: response.metadata.engineVersion,
          detectedMode: response.analysis.detectedMode,
          reasoning: response.analysis.reasoning
        }
      }
    });

  } catch (error) {
    console.error('Smart Query API Error:', error);
    
    // 에러 타입에 따른 상세 응답
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'AI 분석 시간이 초과되었습니다. 다시 시도해주세요.';
        statusCode = 408;
      } else if (error.message.includes('initialization')) {
        errorMessage = 'AI 엔진 초기화 중입니다. 잠시 후 다시 시도해주세요.';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : String(error) : undefined
    }, { status: statusCode });
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: {
        currentMode: 'basic',
        autoModeEnabled: true
      },
      examples: {
        basicQueries: [
          "현재 서버 상태 확인해줘",
          "지금 시스템 어때?",
          "간단히 상태 보여줘",
          "CPU 사용률 확인"
        ],
        advancedQueries: [
          "서버 장애 원인을 분석해서 보고서 작성해줘",
          "전체 시스템의 성능 트렌드를 예측해줘",
          "다중 서버 간 상관관계를 분석해줘",
          "용량 계획을 세워줘",
          "종합 보고서를 작성해줘"
        ]
      }
    });

  } catch (error) {
    console.error('Smart Query Status API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '상태 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 