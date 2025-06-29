import { NextRequest, NextResponse } from 'next/server';
import {
  MCPLangGraphAgent,
  type MCPQuery,
} from '@/services/ai-agent/MCPLangGraphAgent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      question,
      priority = 'medium',
      category = 'general',
      context,
    } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid question is required' },
        { status: 400 }
      );
    }

    // MCP Agent 초기화 및 쿼리 처리
    const mcpAgent = MCPLangGraphAgent.getInstance();
    await mcpAgent.initialize();

    const mcpQuery: MCPQuery = {
      id: `api_query_${Date.now()}`,
      question,
      context,
      priority,
      category,
    };

    const result = await mcpAgent.processQuery(mcpQuery);

    return NextResponse.json({
      success: true,
      data: {
        answer: result.answer,
        confidence: result.confidence,
        reasoning_steps: result.reasoning_steps,
        recommendations: result.recommendations,
        related_servers: result.related_servers,
        execution_time: result.execution_time,
      },
    });
  } catch (error) {
    console.error('❌ MCP API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
