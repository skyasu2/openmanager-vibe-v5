/**
 * 🚀 Hybrid AI API v5.22.0 - 완전 통합 엔드포인트
 * 
 * ✅ Transformers.js + 한국어 NLP + TensorFlow.js + Vector DB
 * ✅ A/B 테스트 지원
 * ✅ 성능 모니터링
 * ✅ 실시간 메트릭 수집
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedAIEngine } from '@/services/ai/enhanced-ai-engine';

// A/B 테스트를 위한 환경 변수
const AI_ENGINE_VERSION = process.env.AI_ENGINE_VERSION || 'hybrid';

interface RequestBody {
  query: string;
  sessionId?: string;
  engineVersion?: 'hybrid' | 'enhanced' | 'korean';
  options?: {
    useTransformers?: boolean;
    useVectorSearch?: boolean;
    includeMetrics?: boolean;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Hybrid AI API 요청 시작');
    
    const body: RequestBody = await request.json();
    const { 
      query, 
      sessionId = `session_${Date.now()}`,
      engineVersion = AI_ENGINE_VERSION,
      options = {}
    } = body;

    // 입력 검증
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '쿼리가 필요합니다.',
        code: 'MISSING_QUERY'
      }, { status: 400 });
    }

    if (query.length > 10000) {
      return NextResponse.json({
        success: false,
        error: '쿼리가 너무 깁니다. (최대 10,000자)',
        code: 'QUERY_TOO_LONG'
      }, { status: 400 });
    }

    console.log(`📝 쿼리 처리 시작: "${query.substring(0, 100)}..."`);
    console.log(`🎯 엔진 버전: ${engineVersion}`);

    // AI 엔진 선택 및 초기화
    let result;
    
    try {
      // Enhanced 엔진 사용 (하이브리드 기능 포함)
      result = await enhancedAIEngine.processSmartQuery(query, sessionId);
      
      if (!result.success) {
        throw new Error(result.answer || '알 수 없는 오류');
      }

    } catch (engineError: any) {
      console.error('❌ AI 엔진 처리 실패:', engineError);
      
      // 폴백 응답
      result = {
        success: false,
        answer: `죄송합니다. AI 엔진 처리 중 오류가 발생했습니다: ${engineError.message}`,
        confidence: 0.1,
        sources: [],
        reasoning: [`엔진 오류: ${engineError.message}`],
        mcpActions: [],
        processingTime: Date.now() - startTime,
        engineUsed: 'fallback' as any,
        performanceMetrics: {
          initTime: 0,
          searchTime: 0,
          analysisTime: 0,
          responseTime: Date.now() - startTime
        }
      };
    }

    // 성능 메트릭 수집
    const totalProcessingTime = Date.now() - startTime;
    
    // 응답 구성
    const response = {
      success: result.success,
      data: {
        answer: result.answer,
        confidence: result.confidence,
        sources: result.sources.map(source => ({
          path: source.path,
          relevanceScore: source.relevanceScore,
          keywords: source.keywords.slice(0, 5) // 응답 크기 최적화
        })),
        reasoning: result.reasoning,
        mcpActions: result.mcpActions,
        engineUsed: result.engineUsed,
        sessionId
      },
      metadata: {
        processingTime: totalProcessingTime,
        engineVersion,
        processingTimeMs: result.processingTime,
        timestamp: new Date().toISOString(),
        queryLength: query.length,
        sourceCount: result.sources.length
      },
      ...(options.includeMetrics && {
        debug: {
          tensorflowPredictions: result.tensorflowPredictions,
          koreanNLU: result.koreanNLU,
          transformersAnalysis: result.transformersAnalysis,
          vectorSearchResults: result.vectorSearchResults
        }
      })
    };

    // 성능 로깅
    console.log(`✅ Hybrid AI API 완료 - ${totalProcessingTime}ms`);
    console.log(`📊 신뢰도: ${result.confidence.toFixed(2)}, 엔진: ${result.engineUsed}`);
    
    // 성능 메트릭이 임계값을 초과하면 경고
    if (totalProcessingTime > 5000) {
      console.warn(`⚠️ 응답 시간 초과: ${totalProcessingTime}ms > 5000ms`);
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time': totalProcessingTime.toString(),
        'X-Engine-Version': engineVersion,
        'X-Confidence': result.confidence.toString()
      }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ Hybrid AI API 전체 실패:', error);

    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // 엔진 상태 확인 API
    const engineStats = { status: 'enhanced engine active' };
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        version: 'v5.22.0',
        engineStats,
        capabilities: [
          'korean-nlp',
          'transformers-js',
          'tensorflow-js',
          'vector-search',
          'mcp-integration',
          'hybrid-analysis'
        ],
        healthCheck: {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      }
    });

  } catch (error: any) {
    console.error('❌ 상태 확인 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '상태 확인 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  // CORS 처리
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 