import { NextRequest, NextResponse } from 'next/server';
import { EnhancedAIEngine } from '@/services/ai/enhanced-ai-engine';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

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
    const { query, sessionId, action, config } = body;

    if (action === 'update-environment') {
      // 환경 설정 업데이트
      const dataGenerator = RealServerDataGenerator.getInstance();
      dataGenerator.updateEnvironmentConfig(config);
      
      return NextResponse.json({
        success: true,
        message: '환경 설정이 업데이트되었습니다',
        newConfig: dataGenerator.getEnvironmentConfig()
      });
    }

    if (action === 'test-custom-scenario') {
      // 커스텀 시나리오 테스트
      const aiEngine = await getEnhancedAIEngine();
      const testQuery = query || `현재 ${config?.serverArchitecture || '로드밸런싱'} 환경에서 ${config?.specialWorkload || '표준'} 워크로드 모니터링 방법`;
      
      const result = await aiEngine.processSmartQuery(testQuery, sessionId || 'test-custom');
      
      return NextResponse.json({
        success: true,
        query: testQuery,
        result,
        environmentConfig: config
      });
    }

    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'query가 필요합니다' 
      }, { status: 400 });
    }

    console.log(`🧠 Enhanced AI 쿼리: "${query}" (세션: ${sessionId || 'anonymous'})`);

    // Enhanced AI Engine 인스턴스 가져오기
    const aiEngine = await getEnhancedAIEngine();

    // 스마트 쿼리 처리
    const result = await aiEngine.processSmartQuery(query, sessionId);

    const totalTime = Date.now() - startTime;

    // 성공 응답 (UTF-8 인코딩 명시)
    const response = NextResponse.json({
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

    // UTF-8 인코딩 헤더 설정
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    return response;

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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'environment-config') {
      // 현재 서버 데이터 생성기 환경 설정 조회
      const dataGenerator = RealServerDataGenerator.getInstance();
      const config = dataGenerator.getEnvironmentConfig();
      
      return NextResponse.json({
        success: true,
        currentConfig: config,
        availableOptions: {
          serverArchitecture: ['single', 'master-slave', 'load-balanced', 'microservices'],
          databaseType: ['single', 'replica', 'sharded', 'distributed'],
          networkTopology: ['simple', 'dmz', 'multi-cloud', 'hybrid'],
          specialWorkload: ['standard', 'gpu', 'storage', 'container'],
          scalingPolicy: ['manual', 'auto', 'predictive'],
          securityLevel: ['basic', 'enhanced', 'enterprise']
        }
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action parameter' 
    });

  } catch (error) {
    console.error('❌ Enhanced AI API 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 내부 오류' 
    }, { status: 500 });
  }
} 