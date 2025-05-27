/**
 * 🚀 Optimized AI Agent API
 * 
 * Vercel 최적화 AI 에이전트 API 엔드포인트
 * - 환경별 자동 최적화
 * - 5-8초 내 응답 보장
 * - 강력한 Fallback 메커니즘
 * - 완전한 에러 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { OptimizedAIAgentEngine, SmartQueryRequest, SmartQueryResponse } from '@/modules/ai-agent/core/OptimizedAIAgentEngine';
import { EnvironmentDetector } from '@/modules/ai-agent/core/EnvironmentDetector';

// 전역 인스턴스 (메모리 효율성)
let aiEngine: OptimizedAIAgentEngine | null = null;
let environmentDetector: EnvironmentDetector | null = null;

/**
 * 🔧 AI 엔진 초기화 (지연 로딩)
 */
async function getAIEngine(): Promise<OptimizedAIAgentEngine> {
  if (!aiEngine) {
    aiEngine = OptimizedAIAgentEngine.getInstance();
    await aiEngine.initialize();
  }
  return aiEngine;
}

/**
 * 🌍 환경 감지기 초기화
 */
async function getEnvironmentDetector(): Promise<EnvironmentDetector> {
  if (!environmentDetector) {
    environmentDetector = EnvironmentDetector.getInstance();
    await environmentDetector.detectEnvironment();
  }
  return environmentDetector;
}

/**
 * 📊 GET - 엔진 상태 조회
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const envDetector = await getEnvironmentDetector();
    const envStatus = envDetector.getEnvironmentStatus();
    
    // AI 엔진이 초기화되어 있으면 상태 포함
    let engineStatus = null;
    if (aiEngine) {
      engineStatus = aiEngine.getEngineStatus();
    }

    return NextResponse.json({
      success: true,
      status: 'healthy',
      environment: envStatus,
      engine: engineStatus,
      capabilities: {
        smartQuery: true,
        pythonAnalysis: envStatus.environment?.capabilities?.pythonAnalysis || false,
        mcpProcessing: true,
        environmentOptimization: true
      },
      metadata: {
        version: '3.0.0-optimized',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        platform: envStatus.environment?.platform || 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ 상태 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 🧠 POST - 스마트 쿼리 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 요청 데이터 파싱
    const body = await request.json();
    const { action, ...requestData } = body;

    // 액션별 처리
    switch (action) {
      case 'smart-query':
        return await handleSmartQuery(requestData, startTime);
      
      case 'status':
        return await handleStatusQuery(startTime);
      
      case 'environment':
        return await handleEnvironmentQuery(startTime);
      
      case 'optimize':
        return await handleOptimizeQuery(requestData, startTime);
      
      default:
        return NextResponse.json({
          success: false,
          error: `지원하지 않는 액션: ${action}`,
          supportedActions: ['smart-query', 'status', 'environment', 'optimize'],
          metadata: {
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ POST 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Request processing failed',
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 🧠 스마트 쿼리 처리
 */
async function handleSmartQuery(requestData: any, startTime: number): Promise<NextResponse> {
  try {
    // 요청 데이터 검증
    const validationResult = validateSmartQueryRequest(requestData);
    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        error: `요청 데이터 검증 실패: ${validationResult.error}`,
        metadata: {
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // AI 엔진 초기화 및 쿼리 처리
    const engine = await getAIEngine();
    
    const smartQueryRequest: SmartQueryRequest = {
      query: requestData.query,
      userId: requestData.userId,
      sessionId: requestData.sessionId,
      context: requestData.context,
      serverData: requestData.serverData,
      metadata: requestData.metadata,
      priority: requestData.priority || 'medium'
    };

    const result = await engine.processSmartQuery(smartQueryRequest);

    return NextResponse.json({
      success: result.success,
      data: {
        response: result.response,
        method: result.method,
        analysis: result.analysis,
        metadata: {
          ...result.metadata,
          apiResponseTime: Date.now() - startTime
        }
      },
      error: result.error
    });

  } catch (error) {
    console.error('❌ 스마트 쿼리 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Smart query processing failed',
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 📊 상태 쿼리 처리
 */
async function handleStatusQuery(startTime: number): Promise<NextResponse> {
  try {
    const engine = await getAIEngine();
    const status = engine.getEngineStatus();

    return NextResponse.json({
      success: true,
      data: {
        status: 'operational',
        engine: status,
        health: {
          isHealthy: status.isInitialized,
          uptime: status.uptime,
          memoryUsage: status.memory,
          successRate: status.metrics.totalRequests > 0 
            ? (status.metrics.successfulRequests / status.metrics.totalRequests) * 100 
            : 100
        }
      },
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 상태 쿼리 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Status query failed',
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 🌍 환경 쿼리 처리
 */
async function handleEnvironmentQuery(startTime: number): Promise<NextResponse> {
  try {
    const envDetector = await getEnvironmentDetector();
    const envStatus = envDetector.getEnvironmentStatus();

    return NextResponse.json({
      success: true,
      data: {
        environment: envStatus.environment,
        optimization: envStatus.optimization,
        runtime: envStatus.runtime,
        recommendations: generateEnvironmentRecommendations(envStatus.environment)
      },
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 환경 쿼리 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Environment query failed',
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * ⚙️ 최적화 쿼리 처리
 */
async function handleOptimizeQuery(requestData: any, startTime: number): Promise<NextResponse> {
  try {
    const envDetector = await getEnvironmentDetector();
    
    // 성능 데이터가 제공되면 동적 조정
    if (requestData.performanceData) {
      const { averageResponseTime, errorRate, memoryUsage } = requestData.performanceData;
      await envDetector.adjustConfigBasedOnPerformance(
        averageResponseTime,
        errorRate,
        memoryUsage
      );
    }

    const optimizationConfig = await envDetector.getOptimizationConfig();

    return NextResponse.json({
      success: true,
      data: {
        optimization: optimizationConfig,
        adjustments: requestData.performanceData ? 'Applied performance-based adjustments' : 'No adjustments needed',
        recommendations: generateOptimizationRecommendations(optimizationConfig)
      },
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 최적화 쿼리 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Optimization query failed',
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * ✅ 스마트 쿼리 요청 검증
 */
function validateSmartQueryRequest(data: any): { isValid: boolean; error?: string } {
  if (!data.query || typeof data.query !== 'string') {
    return { isValid: false, error: 'query 필드가 필요합니다 (문자열)' };
  }

  if (data.query.length > 1000) {
    return { isValid: false, error: 'query는 1000자를 초과할 수 없습니다' };
  }

  if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
    return { isValid: false, error: 'priority는 low, medium, high 중 하나여야 합니다' };
  }

  return { isValid: true };
}

/**
 * 💡 환경별 추천사항 생성
 */
function generateEnvironmentRecommendations(environment: any): string[] {
  const recommendations: string[] = [];

  if (!environment) return recommendations;

  switch (environment.platform) {
    case 'vercel-free':
      recommendations.push('Vercel Pro로 업그레이드하면 더 강력한 AI 분석이 가능합니다');
      recommendations.push('메모리 제한으로 인해 일부 고급 기능이 제한됩니다');
      break;

    case 'vercel-pro':
      recommendations.push('Pro 티어의 모든 기능을 활용할 수 있습니다');
      recommendations.push('대용량 데이터 분석과 장시간 실행이 가능합니다');
      break;

    case 'local':
      recommendations.push('로컬 환경에서 모든 기능을 제한 없이 사용할 수 있습니다');
      recommendations.push('개발 및 테스트에 최적화된 환경입니다');
      break;

    default:
      recommendations.push('환경을 감지할 수 없어 보수적 설정으로 동작합니다');
  }

  if (environment.memoryLimit < 1024) {
    recommendations.push('메모리 제한이 낮아 경량 모드로 동작합니다');
  }

  if (!environment.capabilities?.pythonAnalysis) {
    recommendations.push('Python 분석 기능이 비활성화되어 있습니다');
  }

  return recommendations;
}

/**
 * 🎯 최적화 추천사항 생성
 */
function generateOptimizationRecommendations(config: any): string[] {
  const recommendations: string[] = [];

  if (!config) return recommendations;

  if (config.fallbackMode) {
    recommendations.push('Fallback 모드가 활성화되어 있습니다. 환경을 점검해보세요');
  }

  if (config.maxProcesses === 1) {
    recommendations.push('단일 프로세스 모드로 동작 중입니다');
  }

  if (config.pythonTimeout < 10000) {
    recommendations.push('Python 분석 타임아웃이 짧게 설정되어 있습니다');
  }

  if (config.enableCaching) {
    recommendations.push(`캐시가 활성화되어 있습니다 (크기: ${config.cacheSize})`);
  }

  return recommendations;
}

 