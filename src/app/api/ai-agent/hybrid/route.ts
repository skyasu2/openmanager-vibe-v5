/**
 * 🔄 AI 어시스턴트 하이브리드 데이터 API
 *
 * 목적: 서버 모니터링 데이터와 AI 전용 데이터를 융합하여 AI 어시스턴트 응답 제공
 * 특징:
 * - 실시간 모니터링 데이터 + AI 분석 데이터 융합
 * - 컨텍스트 기반 데이터 소스 선택
 * - 교차 검증 및 신뢰도 평가
 * - 다양한 분석 타입 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAIEngine } from '@/core/ai/UnifiedAIEngine';
import { hybridDataManager } from '@/services/ai-agent/HybridDataManager';

interface HybridQueryRequest {
  query: string;
  requestType?: 'monitoring_focus' | 'ai_analysis' | 'hybrid' | 'auto_select';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  filters?: {
    // 모니터링 필터
    status?: 'online' | 'warning' | 'offline' | 'all';
    location?: string;
    searchTerm?: string;
    limit?: number;

    // AI 필터
    analysisType?:
      | 'anomaly_detection'
      | 'performance_prediction'
      | 'pattern_analysis'
      | 'recommendation';
    includeHealthy?: boolean;
    includeWarning?: boolean;
    includeCritical?: boolean;
  };
  options?: {
    useHybridEngine?: boolean;
    prioritizeRealtime?: boolean;
    includeInsights?: boolean;
    crossValidate?: boolean;
    confidenceThreshold?: number;
  };
}

/**
 * 🎯 하이브리드 AI 질의 처리
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body: HybridQueryRequest = await request.json();

    console.log('🔄 하이브리드 AI 질의 처리 시작:', {
      query: body.query,
      requestType: body.requestType || 'auto_select',
      urgency: body.urgency || 'medium',
    });

    // 입력 검증
    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '질의 내용이 필요합니다',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // UnifiedAIEngine 인스턴스 가져오기
    const aiEngine = UnifiedAIEngine.getInstance();
    await aiEngine.initialize();

    // 하이브리드 분석 요청 구성
    const analysisRequest = {
      query: body.query,
      context: {
        urgency: body.urgency || 'medium',
        sessionId: `hybrid-${Date.now()}`,
      },
      options: {
        enableMCP: true,
        enableAnalysis: true,
        maxResponseTime: body.urgency === 'critical' ? 5000 : 15000,
        confidenceThreshold: body.options?.confidenceThreshold || 0.7,
        ...body.options,
      },
    };

    let response;

    // 하이브리드 엔진 사용 여부 결정
    if (body.options?.useHybridEngine !== false) {
      console.log('🔄 하이브리드 엔진 사용');
      response = await aiEngine.processHybridQuery(analysisRequest);
    } else {
      console.log('🔄 기본 엔진 사용');
      response = await aiEngine.processQuery(analysisRequest);
    }

    const processingTime = Date.now() - startTime;

    console.log(
      `✅ 하이브리드 AI 질의 완료: ${processingTime}ms, 신뢰도: ${Math.round((response.analysis.confidence || 0) * 100)}%`
    );

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        hybridMetadata: {
          processingTime,
          engineType:
            body.options?.useHybridEngine !== false ? 'hybrid' : 'standard',
          requestType: body.requestType || 'auto_select',
          filtersApplied: body.filters ? Object.keys(body.filters).length : 0,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ 하이브리드 AI 질의 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '하이브리드 AI 질의 처리에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        metadata: {
          processingTime,
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 하이브리드 데이터 상태 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const includeDebug = searchParams.get('debug') === 'true';

    // 하이브리드 매니저 상태
    const hybridStatus = hybridDataManager.getStatus();

    // AI 엔진 상태
    const aiEngine = UnifiedAIEngine.getInstance();
    const engineStatuses = aiEngine.getEngineStatuses();

    // 시스템 상태
    const systemStatus = await aiEngine.getSystemStatus();

    const response = {
      success: true,
      data: {
        hybridManager: {
          ...hybridStatus,
          status: 'active',
        },
        aiEngines: engineStatuses,
        systemHealth: systemStatus,
        capabilities: {
          supportedRequestTypes: [
            'monitoring_focus',
            'ai_analysis',
            'hybrid',
            'auto_select',
          ],
          supportedAnalysisTypes: [
            'anomaly_detection',
            'performance_prediction',
            'pattern_analysis',
            'recommendation',
          ],
          supportedFilters: [
            'status',
            'location',
            'searchTerm',
            'analysisType',
          ],
          features: [
            'real_time_monitoring',
            'ai_pattern_analysis',
            'data_fusion',
            'cross_validation',
            'confidence_scoring',
          ],
        },
      },
      timestamp: Date.now(),
    };

    if (includeDebug) {
      (response.data as any).debug = {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ 하이브리드 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '하이브리드 상태 조회에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 하이브리드 데이터 테스트
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const testType = body.testType || 'basic';

    console.log(`🧪 하이브리드 데이터 테스트 시작: ${testType}`);

    let testResults;

    switch (testType) {
      case 'data_fusion':
        testResults = await testDataFusion();
        break;
      case 'cross_validation':
        testResults = await testCrossValidation();
        break;
      case 'performance':
        testResults = await testPerformance();
        break;
      default:
        testResults = await testBasicFunctionality();
    }

    return NextResponse.json({
      success: true,
      data: {
        testType,
        results: testResults,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('❌ 하이브리드 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '하이브리드 테스트에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

// 테스트 함수들
async function testBasicFunctionality() {
  const testQuery = '현재 서버 상태를 분석해주세요';

  const hybridRequest = {
    requestType: 'hybrid' as const,
    query: testQuery,
    urgency: 'medium' as const,
  };

  const result = await hybridDataManager.processHybridRequest(hybridRequest);

  return {
    queryProcessed: true,
    dataSourcesUsed: result.metadata.dataSourcesUsed,
    processingTime: result.metadata.processingTime,
    confidence: result.fusedInsights.confidence,
    serversAnalyzed:
      result.monitoringData.servers.length + result.aiData.data.length,
  };
}

async function testDataFusion() {
  const hybridRequest = {
    requestType: 'hybrid' as const,
    query: '이상 패턴이 있는 서버를 찾아주세요',
    urgency: 'medium' as const,
    aiFilters: {
      analysisType: 'anomaly_detection' as const,
    },
  };

  const result = await hybridDataManager.processHybridRequest(hybridRequest);

  return {
    fusionStrategy: result.metadata.fusionStrategy,
    dataQuality: result.metadata.dataQuality,
    keyFindings: result.fusedInsights.keyFindings.length,
    anomaliesDetected: result.aiData.data.filter(d => d.labels.isAnomalous)
      .length,
    crossValidationScore: result.debug?.overlapCount || 0,
  };
}

async function testCrossValidation() {
  const hybridRequest = {
    requestType: 'hybrid' as const,
    query: '심각한 상태의 서버들을 확인해주세요',
    urgency: 'high' as const,
    fusionOptions: {
      crossValidate: true,
      confidenceThreshold: 0.8,
    },
  };

  const result = await hybridDataManager.processHybridRequest(hybridRequest);

  return {
    crossValidationEnabled: true,
    discrepancies: result.debug?.discrepancies || [],
    overlapCount: result.debug?.overlapCount || 0,
    confidence: result.fusedInsights.confidence,
    dataConsistency: result.metadata.dataQuality.fusion,
  };
}

async function testPerformance() {
  const startTime = Date.now();

  const promises = Array.from({ length: 5 }, (_, i) =>
    hybridDataManager.processHybridRequest({
      requestType: 'auto_select',
      query: `테스트 질의 ${i + 1}`,
      urgency: 'medium',
    })
  );

  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  return {
    concurrentRequests: 5,
    totalProcessingTime: totalTime,
    averageProcessingTime: totalTime / 5,
    allSuccessful: results.every(r => r.fusedInsights.confidence > 0),
    cacheHits: results.filter(r => r.metadata.processingTime < 100).length,
  };
}
