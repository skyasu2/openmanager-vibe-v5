/**
 * AI Agent API Endpoint
 * 
 * 🤖 OpenManager AI 에이전트 메인 API
 * - 지능형 AI 추론 엔진
 * - MCP 프로토콜 지원
 * - 실시간 서버 모니터링 AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAgentEngine, AIAgentRequest } from '../../../modules/ai-agent/core/AIAgentEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sessionId, serverData, context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 서버 데이터 가져오기 (serverData가 없는 경우)
    let realServerData = serverData;
    if (!realServerData) {
      try {
        // TODO: 새로운 데이터 수집기 구현 후 연결
        realServerData = null;
        console.log('📊 No server data available - using provided data');
      } catch (error) {
        console.warn('Failed to get real server data, using provided data:', error);
        realServerData = serverData;
      }
    }

    // AI 에이전트 요청 구성
    const agentRequest: AIAgentRequest = {
      query: query.trim(),
      sessionId: sessionId || undefined,
      context: context || {},
      serverData: realServerData,
      metadata: {
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        dataSource: realServerData ? 'real-time' : 'none'
      }
    };

    // AI 에이전트 엔진으로 질의 처리
    const response = await aiAgentEngine.processQuery(agentRequest);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ AI Agent API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        response: '죄송합니다. AI 에이전트 처리 중 오류가 발생했습니다.',
        intent: {
          name: 'error',
          confidence: 0,
          entities: {}
        },
        actions: [],
        context: {},
        metadata: {
          processingTime: 0,
          timestamp: new Date().toISOString(),
          engineVersion: '1.0.0',
          sessionId: 'error'
        },
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        // AI 엔진 상태 확인
        const status = aiAgentEngine.getEngineStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      case 'quick-status':
        // 빠른 시스템 상태 확인
        const quickStatus = await aiAgentEngine.getQuickStatus();
        return NextResponse.json(quickStatus);

      case 'health':
        // 헬스 체크
        return NextResponse.json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });

      default:
        return NextResponse.json(
          { error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ AI Agent GET API 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
} 