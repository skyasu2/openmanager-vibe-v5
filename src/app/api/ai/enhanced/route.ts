import { NextRequest, NextResponse } from 'next/server';
import { EnhancedAIEngine } from '@/services/ai/enhanced-ai-engine';

/**
 * 🧠 Enhanced AI Engine API v2.0
 * 
 * ✅ MCP 문서 활용 극대화
 * ✅ 스마트 쿼리 분석
 * ✅ TensorFlow.js + MCP 하이브리드
 * ✅ Render 자동 관리
 */

// Enhanced AI Engine 싱글톤 인스턴스
let enhancedAIEngine: EnhancedAIEngine | null = null;

async function getEnhancedAIEngine(): Promise<EnhancedAIEngine> {
  if (!enhancedAIEngine) {
    enhancedAIEngine = new EnhancedAIEngine();
    await enhancedAIEngine.initialize();
  }
  return enhancedAIEngine;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, sessionId, mode = 'smart' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Query parameter is required and must be a string' 
        },
        { status: 400 }
      );
    }

    console.log(`🧠 Enhanced AI 쿼리: "${query}" (세션: ${sessionId || 'anonymous'})`);

    // Enhanced AI Engine 인스턴스 가져오기
    const aiEngine = await getEnhancedAIEngine();

    // 스마트 쿼리 처리
    const result = await aiEngine.processSmartQuery(query, sessionId);

    const totalTime = Date.now() - startTime;

    // 성공 응답
    return NextResponse.json({
      success: true,
      mode: 'enhanced',
      query,
      sessionId,
      result: {
        answer: result.answer,
        confidence: result.confidence,
        sources: result.sources.map(source => ({
          path: source.path,
          relevanceScore: source.relevanceScore,
          summary: source.content.substring(0, 200) + '...'
        })),
        reasoning: result.reasoning,
        mcpActions: result.mcpActions,
        tensorflowPredictions: result.tensorflowPredictions,
        renderStatus: result.renderStatus
      },
      performance: {
        aiProcessingTime: result.processingTime,
        totalApiTime: totalTime,
        efficiency: result.processingTime / totalTime
      },
      metadata: {
        timestamp: new Date().toISOString(),
        documentsAnalyzed: result.sources.length,
        intentDetected: result.reasoning[0] || 'unknown',
        mcpActionsUsed: result.mcpActions.length,
        aiEngineVersion: '2.0'
      }
    });

  } catch (error: any) {
    console.error('❌ Enhanced AI API 오류:', error);

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: false,
      mode: 'enhanced',
      error: {
        message: error.message || '알 수 없는 오류가 발생했습니다',
        type: error.name || 'UnknownError',
        timestamp: new Date().toISOString()
      },
      performance: {
        totalApiTime: totalTime,
        failed: true
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Enhanced AI Engine 상태 조회
    const aiEngine = await getEnhancedAIEngine();

    return NextResponse.json({
      success: true,
      status: 'active',
      engine: 'Enhanced AI Engine v2.0',
      features: [
        'MCP 문서 활용 극대화',
        '벡터 DB 없는 고성능 검색',
        'TensorFlow.js + MCP 하이브리드',
        '실시간 컨텍스트 학습',
        'Render 자동 관리'
      ],
      capabilities: {
        documentSearch: true,
        intentAnalysis: true,
        tensorflowPredictions: true,
        contextualAnswers: true,
        renderManagement: true
      },
      performance: {
        initialized: true,
        memoryOptimized: true,
        serverless: true
      }
    });

  } catch (error: any) {
    console.error('❌ Enhanced AI 상태 조회 실패:', error);

    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message || '상태 조회 실패'
    }, { status: 500 });
  }
} 