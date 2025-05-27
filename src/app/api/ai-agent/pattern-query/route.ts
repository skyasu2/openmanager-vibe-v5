import { NextRequest, NextResponse } from 'next/server';
import { predictivePatternMatcher } from '@/modules/ai-agent/pattern/PredictivePatternMatcher';

/**
 * 🧠 AI 에이전트 고도화 패턴 매칭 API
 * 
 * POST /api/ai-agent/pattern-query
 * 
 * 기능:
 * - 다양한 질문 패턴에 대한 유연한 매칭
 * - 여러 키워드 조합 처리
 * - 신뢰도 기반 fallback 응답
 * - 실시간 서버 상태 데이터 연계
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { 
          error: 'Query parameter is required and must be a string',
          example: { query: "CPU랑 메모리가 동시에 높아요" }
        },
        { status: 400 }
      );
    }

    console.log(`🧠 Received pattern query: "${query}"`);

    // PredictivePatternMatcher로 쿼리 분석
    const result = await predictivePatternMatcher.analyzeQuery(query);

    // 응답 로깅
    console.log(`✅ Pattern analysis complete:`, {
      confidence: result.confidenceScore.toFixed(2),
      patterns: result.matchedPatterns,
      fallbackLevel: result.fallbackLevel,
      sourceContext: result.sourceContext
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      query: query,
      result: {
        // 신뢰도 및 매칭 정보
        confidenceScore: result.confidenceScore,
        matchedPatterns: result.matchedPatterns,
        sourceContext: result.sourceContext,
        fallbackLevel: result.fallbackLevel,
        
        // 메인 응답
        response: result.response,
        
        // 동적 메트릭 데이터
        dynamicMetrics: result.dynamicMetrics,
        
        // 메타데이터
        metaData: result.metaData
      },
      
      // 추가 컨텍스트 정보
      context: {
        healthDataAvailable: !!result.dynamicMetrics,
        responseQuality: result.confidenceScore >= 0.8 ? 'high' : 
                        result.confidenceScore >= 0.5 ? 'medium' : 'low',
        recommendedAction: result.confidenceScore < 0.5 ? 
          'Consider rephrasing the query for better results' : 
          'Response generated successfully'
      }
    });

  } catch (error) {
    console.error('❌ Pattern query API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * 패턴 매칭 통계 조회
 */
export async function GET() {
  try {
    const stats = predictivePatternMatcher.getPatternStats();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        patterns: stats,
        systemInfo: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Pattern stats API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve pattern statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 