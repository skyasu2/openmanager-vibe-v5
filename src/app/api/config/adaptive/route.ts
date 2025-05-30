import { NextRequest, NextResponse } from 'next/server';
import { adaptiveConfigManager } from '../../../../utils/VercelPlanDetector';

/**
 * 🎯 적응형 서버 구성 API
 * GET /api/config/adaptive
 * 
 * Vercel 플랜을 자동 감지하여 최적 서버 구성을 제공합니다.
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Vercel 플랜 감지 시작...');
    
    // 적응형 구성 관리자로 최적 구성 생성
    const optimalConfig = await adaptiveConfigManager.getOptimalServerConfig();
    
    const responseTime = Date.now() - startTime;
    
    // 성능 예측
    const performancePrediction = adaptiveConfigManager.predictPerformance(optimalConfig);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      config: {
        serverCount: optimalConfig.serverCount,
        generationInterval: optimalConfig.generationInterval,
        batchSize: optimalConfig.batchSize,
        memoryOptimization: optimalConfig.memoryOptimization,
        aiEnabled: optimalConfig.aiEnabled,
        performance: optimalConfig.performance
      },
      predictions: {
        estimatedCompleteTime: `${performancePrediction.estimatedCompleteTime}초`,
        memoryUsage: `${performancePrediction.memoryUsage}MB`,
        successProbability: `${Math.round(performancePrediction.successProbability * 100)}%`
      },
      recommendations: {
        serverCount: optimalConfig.serverCount,
        planOptimized: true,
        summary: `${optimalConfig.planInfo.plan} 플랜에 최적화된 구성`
      },
      detectedPlan: {
        plan: optimalConfig.planInfo.plan,
        confidence: Math.round(optimalConfig.planInfo.confidence * 100),
        detectionMethods: optimalConfig.planInfo.detectionMethods,
        limitations: optimalConfig.planInfo.limitations,
        recommendations: optimalConfig.planInfo.recommendations
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ 적응형 구성 생성 실패:', error);
    
    // 폴백 구성 (안전 모드)
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      fallback: true,
      config: {
        serverCount: 8,
        generationInterval: 1500,
        batchSize: 2,
        memoryOptimization: true,
        aiEnabled: true,
        performance: {
          expectedCompleteTime: 12,
          maxMemoryPerServer: 6,
          recommendedConcurrency: 2
        }
      },
      predictions: {
        estimatedCompleteTime: '12초',
        memoryUsage: '48MB',
        successProbability: '90%'
      },
      recommendations: {
        serverCount: 8,
        planOptimized: false,
        summary: '플랜 감지 실패, 안전 모드 적용'
      },
      detectedPlan: {
        plan: 'unknown',
        confidence: 0,
        detectionMethods: ['fallback'],
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    }, { status: 200 }); // 실패해도 200으로 반환 (폴백 제공)
  }
}

/**
 * 🔄 플랜 재감지 강제 실행 API
 * POST /api/config/adaptive
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { forceRedetection } = await request.json();
    
    if (forceRedetection) {
      console.log('🔄 플랜 강제 재감지 시작...');
      // 캐시 클리어 후 재감지
      const { vercelPlanDetector } = await import('../../../../utils/VercelPlanDetector');
      vercelPlanDetector.clearCache();
    }
    
    const newConfig = await adaptiveConfigManager.getOptimalServerConfig();
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      message: forceRedetection ? '플랜 재감지 완료' : '구성 갱신 완료',
      config: newConfig,
      redetected: forceRedetection || false,
      cacheCleared: forceRedetection || false
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : '재감지 실패',
      message: '플랜 재감지에 실패했습니다'
    }, { status: 500 });
  }
}

/**
 * 🎛️ 성능 기반 구성 조정 API
 * PUT /api/config/adaptive
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { 
      performanceMetrics,
      currentConfig 
    } = await request.json();
    
    if (!performanceMetrics || !currentConfig) {
      return NextResponse.json({
        success: false,
        error: 'performanceMetrics와 currentConfig가 필요합니다',
        required: {
          performanceMetrics: {
            memoryUsage: 'number (0-100)',
            responseTime: 'number (ms)',
            errorRate: 'number (0-100)'
          },
          currentConfig: 'OptimalServerConfig object'
        }
      }, { status: 400 });
    }
    
    console.log('🎛️ 성능 기반 구성 조정 시작...', performanceMetrics);
    
    // 성능 메트릭을 기반으로 구성 조정
    const adjustedConfig = await adaptiveConfigManager.adjustConfigByPerformance(
      currentConfig,
      performanceMetrics
    );
    
    const responseTime = Date.now() - startTime;
    
    // 조정 이유 분석
    const adjustmentReasons = [];
    
    if (performanceMetrics.memoryUsage > 80) {
      adjustmentReasons.push('높은 메모리 사용률로 인한 서버 수 감소');
    }
    if (performanceMetrics.responseTime > 2000) {
      adjustmentReasons.push('응답 지연으로 인한 생성 간격 증가');
    }
    if (performanceMetrics.errorRate > 5) {
      adjustmentReasons.push('높은 에러율로 인한 보수적 구성 적용');
    }
    if (adjustmentReasons.length === 0) {
      adjustmentReasons.push('성능 메트릭이 양호하여 조정 불필요');
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      adjusted: adjustedConfig.serverCount !== currentConfig.serverCount || 
                adjustedConfig.generationInterval !== currentConfig.generationInterval,
      originalConfig: {
        serverCount: currentConfig.serverCount,
        generationInterval: currentConfig.generationInterval
      },
      adjustedConfig: {
        serverCount: adjustedConfig.serverCount,
        generationInterval: adjustedConfig.generationInterval,
        aiEnabled: adjustedConfig.aiEnabled
      },
      performanceMetrics,
      adjustmentReasons,
      message: adjustmentReasons.length > 1 ? 
        '성능 이슈로 인한 구성 조정 완료' : 
        '현재 성능이 양호하여 구성 유지'
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : '구성 조정 실패',
      message: '성능 기반 구성 조정에 실패했습니다'
    }, { status: 500 });
  }
} 