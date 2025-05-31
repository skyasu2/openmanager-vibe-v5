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
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { query, sessionId, serverData, context } = body;

    console.log('🤖 AI 에이전트 요청 수신:', {
      query: query?.substring?.(0, 50) + '...',
      hasSessionId: !!sessionId,
      hasServerData: !!serverData,
      hasContext: !!context,
      timestamp: new Date().toISOString()
    });

    // 🛡️ 요청 데이터 검증
    if (!query || typeof query !== 'string') {
      console.warn('⚠️ 잘못된 쿼리 형식:', { query: typeof query, length: query?.length });
      return NextResponse.json(
        { 
          success: false,
          error: 'query 파라미터가 필요합니다.',
          message: '유효한 문자열 쿼리를 제공해주세요.'
        },
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

    // 🧠 AI 엔진 상태 확인
    const engineStatus = aiAgentEngine.getEngineStatus();
    if (!engineStatus.isInitialized) {
      console.warn('⚠️ AI 엔진이 준비되지 않음:', engineStatus);
      return NextResponse.json({
        success: false,
        error: 'AI 에이전트가 아직 준비되지 않았습니다',
        message: '시스템이 초기화 중입니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
        engineStatus
      }, { status: 503 });
    }

    // AI 에이전트 엔진으로 질의 처리
    const response = await aiAgentEngine.processQuery(agentRequest);
    
    const totalTime = Date.now() - startTime;
    console.log('✅ AI 에이전트 처리 완료:', {
      success: response.success,
      processingTime: totalTime,
      hasResponse: !!response.response
    });

    return NextResponse.json(response);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    console.error('❌ AI Agent API 오류:', {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack?.split('\n')[0] : undefined,
      processingTime: totalTime,
      timestamp: new Date().toISOString()
    });

    // 🔧 개발 모드에서 더 상세한 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 AI 에이전트 상세 에러:', error);
    }
    
    // 🛡️ 에러 타입별 응답
    let errorMessage = '죄송합니다. AI 에이전트 처리 중 오류가 발생했습니다.';
    let statusCode = 500;
    
    if (error instanceof SyntaxError) {
      errorMessage = '요청 데이터 형식이 올바르지 않습니다.';
      statusCode = 400;
    } else if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'AI 처리가 시간 초과되었습니다. 잠시 후 다시 시도해주세요.';
        statusCode = 408;
      } else if (error.message.includes('connection')) {
        errorMessage = 'AI 서비스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        response: errorMessage,
        intent: {
          name: 'error',
          confidence: 0,
          entities: {}
        },
        actions: [],
        context: {},
        metadata: {
          processingTime: totalTime,
          timestamp: new Date().toISOString(),
          engineVersion: '1.0.0',
          sessionId: 'error'
        },
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : '알 수 없는 오류')
          : '서비스 오류',
        retryable: statusCode >= 500
      },
      { status: statusCode }
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