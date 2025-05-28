/**
 * 🧠 MCP (Model Context Protocol) API 엔드포인트
 * 
 * 컨텍스트 인식 기반 통합 AI 분석
 * - 자연어 쿼리 처리
 * - 다중 도구 체인 실행
 * - 컨텍스트 기반 의사결정
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPOrchestrator, MCPRequest } from '../../../../core/mcp/mcp-orchestrator';

// MCP 오케스트레이터 싱글톤 인스턴스
let mcpOrchestrator: MCPOrchestrator | null = null;

function getMCPOrchestrator(): MCPOrchestrator {
  if (!mcpOrchestrator) {
    console.log('🧠 MCP 오케스트레이터 초기화...');
    mcpOrchestrator = new MCPOrchestrator();
  }
  return mcpOrchestrator;
}

/**
 * 🎯 MCP 분석 요청 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    
    console.log('🧠 MCP 요청 수신:', {
      query: body.query?.substring(0, 50) + '...',
      hasMetrics: !!body.parameters?.metrics,
      sessionId: body.context?.session_id
    });

    // MCP 요청 객체 구성
    const mcpRequest: MCPRequest = {
      query: body.query || '시스템 상태를 분석해주세요',
      parameters: body.parameters || {},
      context: {
        session_id: body.context?.session_id,
        user_preferences: body.context?.user_preferences || {},
        urgency: body.context?.urgency || 'medium'
      }
    };

    // MCP 오케스트레이터 실행
    const orchestrator = getMCPOrchestrator();
    const result = await orchestrator.process(mcpRequest);

    const totalTime = Date.now() - startTime;

    console.log('✅ MCP 분석 완료:', {
      toolsUsed: result.tools_used,
      confidence: result.confidence,
      totalTime
    });

    return NextResponse.json({
      success: true,
      data: result.result,
      metadata: {
        tools_used: result.tools_used,
        context_id: result.context_id,
        processing_time: result.processing_time,
        confidence: result.confidence,
        total_time: totalTime
      }
    });

  } catch (error: any) {
    console.error('❌ MCP 처리 오류:', error);

    return NextResponse.json({
      success: false,
      error: 'MCP 분석 중 오류가 발생했습니다',
      message: error.message,
      processing_time: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * 🏥 MCP 시스템 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      const orchestrator = getMCPOrchestrator();
      
      return NextResponse.json({
        status: 'healthy',
        message: 'MCP 오케스트레이터가 정상 동작 중입니다',
        timestamp: new Date().toISOString(),
        tools_registered: 6, // statistical_analysis, anomaly_detection, time_series_forecast, pattern_recognition, root_cause_analysis, optimization_advisor
        context_active: true
      });
    }

    if (action === 'tools') {
      return NextResponse.json({
        tools: [
          'statistical_analysis',
          'anomaly_detection', 
          'time_series_forecast',
          'pattern_recognition',
          'root_cause_analysis',
          'optimization_advisor'
        ],
        description: 'MCP 등록된 도구 목록'
      });
    }

    return NextResponse.json({
      service: 'MCP Orchestrator',
      version: '1.0.0',
      endpoints: {
        'POST /': 'MCP 분석 요청',
        'GET /?action=health': '시스템 상태 확인',
        'GET /?action=tools': '등록된 도구 목록'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'MCP 상태 확인 실패',
      message: error.message
    }, { status: 500 });
  }
} 