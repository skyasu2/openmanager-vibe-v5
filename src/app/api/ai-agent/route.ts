/**
 * AI Agent API Endpoint - Vercel 서버리스 최적화
 * 
 * 🤖 OpenManager AI 에이전트 메인 API
 * - 지능형 AI 추론 엔진
 * - MCP 프로토콜 지원
 * - 실시간 서버 모니터링 AI
 * - 함수 크기 최적화 (Vercel 50MB 제한 대응)
 */

import { NextRequest, NextResponse } from 'next/server';

// ⚡ Dynamic Import로 AI 엔진 지연 로딩 (번들 사이즈 최적화)
const getAIAgent = async () => {
  const { aiAgentEngine } = await import('../../../modules/ai-agent/core/AIAgentEngine');
  return aiAgentEngine;
};

// 🔧 요청 검증 함수 강화
const validateRequest = (body: any) => {
  // body가 없거나 null인 경우
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        success: false,
        error: '요청 본문이 필요합니다.',
        message: '유효한 JSON 데이터를 제공해주세요.',
        retryable: false
      }
    };
  }

  const { query, sessionId, context, serverData } = body;
  
  // query 검증 강화
  if (!query) {
    return {
      isValid: false,
      error: {
        success: false,
        error: 'query 파라미터가 필요합니다.',
        message: '질문이나 명령을 입력해주세요.',
        retryable: false
      }
    };
  }
  
  if (typeof query !== 'string') {
    return {
      isValid: false,
      error: {
        success: false,
        error: 'query는 문자열이어야 합니다.',
        message: '질문을 문자열 형태로 제공해주세요.',
        retryable: false
      }
    };
  }

  if (query.trim().length === 0) {
    return {
      isValid: false,
      error: {
        success: false,
        error: '빈 query는 처리할 수 없습니다.',
        message: '실제 질문이나 명령을 입력해주세요.',
        retryable: false
      }
    };
  }

  if (query.length > 5000) {
    return {
      isValid: false,
      error: {
        success: false,
        error: 'query가 너무 깁니다.',
        message: '5000자 이하의 질문을 입력해주세요.',
        retryable: false
      }
    };
  }

  // sessionId 검증 (선택적)
  if (sessionId && typeof sessionId !== 'string') {
    return {
      isValid: false,
      error: {
        success: false,
        error: 'sessionId는 문자열이어야 합니다.',
        message: '올바른 세션 ID를 제공해주세요.',
        retryable: false
      }
    };
  }

  // context 검증 (선택적)
  if (context && typeof context !== 'object') {
    return {
      isValid: false,
      error: {
        success: false,
        error: 'context는 객체여야 합니다.',
        message: '올바른 컨텍스트 데이터를 제공해주세요.',
        retryable: false
      }
    };
  }
  
  return { isValid: true };
};

// 🛡️ 에러 응답 생성 함수
const createErrorResponse = (error: any, processingTime: number) => {
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
  
  return {
    responseData: {
      success: false,
      response: errorMessage,
      intent: { name: 'error', confidence: 0, entities: {} },
      actions: [],
      context: {},
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        engineVersion: '1.0.0',
        sessionId: 'error'
      },
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : '알 수 없는 오류')
        : '서비스 오류',
      retryable: statusCode >= 500
    },
    statusCode
  };
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { query, sessionId, serverData, context } = body;

    // 📊 요청 로깅 (간소화)
    console.log('🤖 AI 에이전트 요청:', {
      queryLength: query?.length,
      hasSessionId: !!sessionId,
      timestamp: new Date().toISOString()
    });

    // 🛡️ 요청 검증
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    // ⚡ AI 엔진 동적 로딩
    const aiAgentEngine = await getAIAgent();
    
    // 🧠 엔진 상태 확인
    const engineStatus = aiAgentEngine.getEngineStatus();
    if (!engineStatus.isInitialized) {
      return NextResponse.json({
        success: false,
        error: 'AI 에이전트가 아직 준비되지 않았습니다',
        message: '시스템이 초기화 중입니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
        engineStatus
      }, { status: 503 });
    }

    // 🔧 AI 요청 구성 (최소화)
    const agentRequest = {
      query: query.trim(),
      sessionId: sessionId || undefined,
      context: context || {},
      serverData: serverData,
      metadata: {
        timestamp: new Date().toISOString(),
        dataSource: serverData ? 'real-time' : 'none'
      }
    };

    // 🤖 AI 처리
    const response = await aiAgentEngine.processQuery(agentRequest);
    
    const totalTime = Date.now() - startTime;
    console.log('✅ AI 처리 완료:', { success: response.success, time: totalTime });

    return NextResponse.json(response);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ AI Agent API 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    
    const { responseData, statusCode } = createErrorResponse(error, totalTime);
    return NextResponse.json(responseData, { status: statusCode });
  }
}

// ⚡ GET 요청 최적화 (빠른 상태 확인용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'health':
        return NextResponse.json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });

      case 'status':
        const aiAgentEngine = await getAIAgent();
        const status = aiAgentEngine.getEngineStatus();
        return NextResponse.json({ success: true, data: status });

      default:
        return NextResponse.json(
          { error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
} 