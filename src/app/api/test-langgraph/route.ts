import { NextRequest, NextResponse } from 'next/server';
import { mcpLangGraphAgent } from '@/services/ai-agent/MCPLangGraphAgent';

/**
 * 🧠 LangGraph Agent 테스트 API
 * 
 * LangGraph 스타일의 사고 과정과 ReAct 프레임워크를 테스트합니다
 * GET /api/test-langgraph
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const question = searchParams.get('question') || '현재 서버 상태를 알려주세요';
    const priority = (searchParams.get('priority') || 'medium') as 'low' | 'medium' | 'high' | 'critical';
    const category = (searchParams.get('category') || 'monitoring') as 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general';

    console.log(`🧠 LangGraph Agent 테스트 시작: "${question}"`);

    // MCP Agent 초기화
    await mcpLangGraphAgent.initialize();

    // MCP 질의 생성
    const mcpQuery = {
      id: `test_query_${Date.now()}`,
      question,
      context: 'Test environment',
      priority,
      category
    };

    // MCP LangGraph Agent로 처리
    const mcpResponse = await mcpLangGraphAgent.processQuery(mcpQuery);
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ LangGraph Agent 테스트 완료: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      test_info: {
        question,
        priority,
        category,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      },
      mcp_response: mcpResponse,
      system_info: {
        version: 'LangGraph v1.0',
        features: ['ReAct Framework', 'Logic Steps', 'MCP Integration', 'Prometheus Compatible'],
        test_mode: true
      }
    });

  } catch (error) {
    console.error('❌ LangGraph Agent 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'LangGraph Agent test failed',
      message: error instanceof Error ? error.message : '테스트 중 오류가 발생했습니다',
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * POST - 커스텀 질의 테스트
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { question, priority = 'medium', category = 'general', context } = body;

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question is required',
        message: 'question 필드가 필요합니다'
      }, { status: 400 });
    }

    console.log(`🧠 LangGraph Agent 커스텀 테스트: "${question}"`);

    // MCP Agent 초기화
    await mcpLangGraphAgent.initialize();

    // MCP 질의 생성
    const mcpQuery = {
      id: `custom_query_${Date.now()}`,
      question,
      context: context || 'Custom test environment',
      priority,
      category
    };

    // MCP LangGraph Agent로 처리
    const mcpResponse = await mcpLangGraphAgent.processQuery(mcpQuery);
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ LangGraph Agent 커스텀 테스트 완료: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      test_info: {
        question,
        priority,
        category,
        context,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      },
      mcp_response: mcpResponse,
      system_info: {
        version: 'LangGraph v1.0',
        mode: 'custom_test',
        features_enabled: ['ReAct Framework', 'Logic Steps', 'Real-time Thinking', 'MCP Integration']
      }
    });

  } catch (error) {
    console.error('❌ LangGraph Agent 커스텀 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'LangGraph Agent custom test failed',
      message: error instanceof Error ? error.message : '커스텀 테스트 중 오류가 발생했습니다',
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 