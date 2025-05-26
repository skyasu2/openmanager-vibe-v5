/**
 * System Health Check API v2.0
 * 
 * 🏥 시스템 전체 상태 진단 및 자동 복구 (관리자 대시보드 시각화 지원)
 * GET: 현재 시스템 상태 조회 (통계 분석 + 이상 징후 + 예측 포함)
 * POST: 자동 복구 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AnomalyDetection, StatisticalAnalysis } from '@/services/SystemHealthChecker';

// 📊 관리자 대시보드용 응답 타입 정의
interface SystemHealthAPIResponse {
  success: boolean;
  timestamp: string;
  
  // 📋 요약 정보
  summary: {
    overallStatus: 'healthy' | 'warning' | 'critical';
    healthScore: number;
    serverCount: number;
    criticalIssues: number;
    warnings: number;
    dataSource: 'api' | 'fallback' | 'none';
  };
  
  // 📊 메트릭 정보 (시각화용)
  metrics: {
    current: {
      avgCpuUsage: number;
      avgMemoryUsage: number;
      avgDiskUsage: number;
      avgResponseTime: number;
      totalAlerts: number;
      serverStatusDistribution: Record<string, number>;
      providerDistribution: Record<string, number>;
      healthScore: number;
    };
    trends: Record<string, {
      trend: 'increasing' | 'decreasing' | 'stable';
      changeRate: number;
      volatility: number;
    }>;
    movingAverages: Record<string, number>;
    predictions: Record<string, { nextValue: number; confidence: number }>;
  };
  
  // 🔍 이상 징후 정보
  anomalies: Array<{
    id: string;
    type: 'performance' | 'availability' | 'resource' | 'pattern';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedServers: string[];
    metrics: {
      current: number;
      baseline: number;
      deviation: number;
      threshold: number;
    };
    recommendation: string;
    detectedAt: string;
  }>;
  
  // 💡 권장사항
  recommendations: string[];
  
  // 📈 상세 분석 (대시보드 차트용)
  charts: {
    performanceChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        status: string;
        trend: string;
      }>;
    };
    availabilityChart: {
      rate: number;
      status: string;
      online: number;
      total: number;
    };
    alertsChart: {
      total: number;
      bySeverity: Record<string, number>;
      trend: string;
    };
    trendsChart: {
      timePoints: string[];
      metrics: Record<string, number[]>;
    };
  };
  
  // 🔧 레거시 호환성
  health?: any;
}

// 🔧 타입 변환 헬퍼 함수들
function convertAnomalyForAPI(anomaly: AnomalyDetection): SystemHealthAPIResponse['anomalies'][0] {
  return {
    ...anomaly,
    detectedAt: anomaly.detectedAt.toISOString()
  };
}

function ensureValidStatus(status: string): 'healthy' | 'warning' | 'critical' {
  if (status === 'healthy' || status === 'warning' || status === 'critical') {
    return status;
  }
  return 'warning'; // 기본값
}

function ensureValidMetrics(metrics: any): SystemHealthAPIResponse['metrics']['current'] {
  return {
    avgCpuUsage: metrics?.avgCpuUsage || 0,
    avgMemoryUsage: metrics?.avgMemoryUsage || 0,
    avgDiskUsage: metrics?.avgDiskUsage || 0,
    avgResponseTime: metrics?.avgResponseTime || 0,
    totalAlerts: metrics?.totalAlerts || 0,
    serverStatusDistribution: metrics?.serverStatusDistribution || {},
    providerDistribution: metrics?.providerDistribution || {},
    healthScore: metrics?.healthScore || 50
  };
}

// 📊 Fallback 응답 생성
function generateFallbackResponse(): SystemHealthAPIResponse {
  const timestamp = new Date().toISOString();
  
  return {
    success: true,
    timestamp,
    summary: {
      overallStatus: 'warning',
      healthScore: 50,
      serverCount: 0,
      criticalIssues: 1,
      warnings: 0,
      dataSource: 'none'
    },
    metrics: {
      current: {
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgDiskUsage: 0,
        avgResponseTime: 0,
        totalAlerts: 1,
        serverStatusDistribution: {},
        providerDistribution: {},
        healthScore: 50
      },
      trends: {
        cpu: { trend: 'stable', changeRate: 0, volatility: 0 },
        memory: { trend: 'stable', changeRate: 0, volatility: 0 },
        alerts: { trend: 'stable', changeRate: 0, volatility: 0 }
      },
      movingAverages: {
        cpu: 0,
        memory: 0,
        disk: 0,
        responseTime: 0,
        alerts: 1
      },
      predictions: {
        cpu: { nextValue: 0, confidence: 0 },
        memory: { nextValue: 0, confidence: 0 },
        responseTime: { nextValue: 0, confidence: 0 }
      }
    },
    anomalies: [
      {
        id: 'no_data_anomaly',
        type: 'availability',
        severity: 'critical',
        description: 'No server data available for analysis',
        affectedServers: [],
        metrics: {
          current: 0,
          baseline: 1,
          deviation: 100,
          threshold: 1
        },
        recommendation: 'Initialize data collection and server registration',
        detectedAt: timestamp
      }
    ],
    recommendations: [
      '🚀 데이터 수집 시스템 초기화 필요',
      '🔧 서버 등록 프로세스 확인',
      '📊 모니터링 시스템 상태 점검'
    ],
    charts: {
      performanceChart: {
        labels: ['CPU', 'Memory', 'Disk', 'Response Time'],
        datasets: [{
          label: 'Current Usage',
          data: [0, 0, 0, 0],
          status: 'warning',
          trend: 'stable'
        }]
      },
      availabilityChart: {
        rate: 0,
        status: 'critical',
        online: 0,
        total: 0
      },
      alertsChart: {
        total: 1,
        bySeverity: { critical: 1, high: 0, medium: 0, low: 0 },
        trend: 'stable'
      },
      trendsChart: {
        timePoints: [timestamp],
        metrics: {
          cpu: [0],
          memory: [0],
          alerts: [1]
        }
      }
    }
  };
}

// GET: 시스템 헬스체크 실행 (확장된 응답)
export async function GET() {
  try {
    console.log('🏥 Starting enhanced system health check...');
    
    const { systemHealthChecker } = await import('@/services/SystemHealthChecker');
    
    // 📋 종합 진단 보고서 생성
    let healthReport;
    try {
      healthReport = await systemHealthChecker.generateHealthReport();
    } catch (reportError) {
      console.warn('📋 Health report generation failed, using basic health check:', reportError);
      
      // Fallback: 기본 헬스체크 사용
      const basicHealth = await systemHealthChecker.performHealthCheck();
      
             const response: SystemHealthAPIResponse = {
         success: true,
         timestamp: new Date().toISOString(),
         summary: {
           overallStatus: ensureValidStatus(basicHealth.isHealthy ? 'healthy' : 
                         basicHealth.issues.length > 2 ? 'critical' : 'warning'),
           healthScore: basicHealth.statisticalAnalysis?.healthScore || 50,
           serverCount: basicHealth.serverCount,
           criticalIssues: basicHealth.anomalies?.filter(a => a.severity === 'critical').length || 0,
           warnings: basicHealth.anomalies?.filter(a => a.severity === 'medium' || a.severity === 'high').length || 0,
           dataSource: basicHealth.dataSource
         },
         metrics: {
           current: ensureValidMetrics(basicHealth.statisticalAnalysis),
           trends: {},
           movingAverages: {},
           predictions: {}
         },
         anomalies: (basicHealth.anomalies || []).map(convertAnomalyForAPI),
         recommendations: basicHealth.actions || [],
         charts: generateFallbackResponse().charts,
         health: basicHealth // 레거시 호환성
       };
      
      return NextResponse.json(response);
    }
    
    // 📊 시각화용 차트 데이터 생성
    const charts = {
      performanceChart: {
        labels: ['CPU', 'Memory', 'Disk', 'Response Time'],
        datasets: [{
          label: 'Current Usage (%)',
          data: [
            healthReport.metrics.current.avgCpuUsage,
            healthReport.metrics.current.avgMemoryUsage,
            healthReport.metrics.current.avgDiskUsage,
            healthReport.metrics.current.avgResponseTime
          ],
          status: healthReport.summary.overallStatus,
          trend: 'stable' // 기본값
        }]
      },
      availabilityChart: {
        rate: healthReport.detailedAnalysis.availability.rate,
        status: healthReport.detailedAnalysis.availability.status,
        online: healthReport.detailedAnalysis.availability.onlineServers,
        total: healthReport.detailedAnalysis.availability.totalServers
      },
      alertsChart: {
        total: healthReport.metrics.current.totalAlerts,
        bySeverity: healthReport.detailedAnalysis.patterns.anomalyPatterns,
        trend: healthReport.metrics.trends.alerts?.trend || 'stable'
      },
      trendsChart: {
        timePoints: [healthReport.timestamp.toISOString()],
        metrics: {
          cpu: [healthReport.metrics.current.avgCpuUsage],
          memory: [healthReport.metrics.current.avgMemoryUsage],
          alerts: [healthReport.metrics.current.totalAlerts]
        }
      }
    };
    
    // 📨 완전한 응답 구성
    const response: SystemHealthAPIResponse = {
      success: true,
      timestamp: healthReport.timestamp.toISOString(),
             summary: {
         overallStatus: ensureValidStatus(healthReport.summary.overallStatus),
         healthScore: healthReport.summary.healthScore,
         serverCount: healthReport.summary.serverCount,
         criticalIssues: healthReport.summary.criticalIssues,
         warnings: healthReport.summary.warnings,
         dataSource: 'api' as const // 성공적으로 가져온 경우
       },
       metrics: {
         current: ensureValidMetrics(healthReport.metrics.current),
         trends: healthReport.metrics.trends,
         movingAverages: healthReport.metrics.movingAverages,
         predictions: healthReport.metrics.predictions
       },
      anomalies: healthReport.anomalies.map(convertAnomalyForAPI),
      recommendations: healthReport.recommendations,
      charts,
      health: healthReport // 레거시 호환성
    };
    
    console.log(`✅ Enhanced health check complete: ${response.summary.overallStatus} (Score: ${response.summary.healthScore})`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('🚨 Health check API error:', error);
    
    // 📊 오류 발생 시 fallback 응답
    const fallbackResponse = generateFallbackResponse();
    fallbackResponse.success = false;
    
    return NextResponse.json({
      ...fallbackResponse,
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: [
        '🚨 시스템 헬스체크 실패',
        '📋 로그 확인 필요',
        '🔧 수동 점검 권장',
        ...fallbackResponse.recommendations
      ]
    }, { status: 500 });
  }
}

// POST: 자동 복구 실행 (기존 유지 + 응답 형식 통일)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      maxRetries = 3,
      retryDelayMs = 2000,
      forceInit = true,
      generateFallback = true
    } = body;
    
    const { systemHealthChecker } = await import('@/services/SystemHealthChecker');
    
    console.log('🔧 Starting auto recovery via API...');
    const recoveryResult = await systemHealthChecker.performAutoRecovery({
      maxRetries,
      retryDelayMs,
      forceInit,
      generateFallback
    });
    
    // 📋 복구 후 전체 보고서 다시 생성
    let postRecoveryReport;
    try {
      postRecoveryReport = await systemHealthChecker.generateHealthReport();
    } catch {
      // Fallback: 기본 결과 사용
      postRecoveryReport = {
        timestamp: new Date(),
        summary: {
          overallStatus: recoveryResult.isHealthy ? 'healthy' : 'critical',
          healthScore: recoveryResult.isHealthy ? 80 : 30,
          serverCount: recoveryResult.serverCount,
          criticalIssues: recoveryResult.issues.length,
          warnings: 0
        },
        metrics: { current: {}, trends: {}, movingAverages: {}, predictions: {} },
        anomalies: [],
        recommendations: recoveryResult.actions || [],
        detailedAnalysis: { availability: { rate: 0, status: 'unknown', onlineServers: 0, totalServers: 0 } }
      };
    }
    
         const response: SystemHealthAPIResponse = {
       success: recoveryResult.isHealthy,
       timestamp: new Date().toISOString(),
       summary: {
         overallStatus: ensureValidStatus(postRecoveryReport.summary.overallStatus as string),
         healthScore: postRecoveryReport.summary.healthScore,
         serverCount: postRecoveryReport.summary.serverCount,
         criticalIssues: postRecoveryReport.summary.criticalIssues,
         warnings: postRecoveryReport.summary.warnings,
         dataSource: recoveryResult.dataSource
       },
       metrics: {
         current: ensureValidMetrics(postRecoveryReport.metrics.current),
         trends: postRecoveryReport.metrics.trends || {},
         movingAverages: postRecoveryReport.metrics.movingAverages || {},
         predictions: postRecoveryReport.metrics.predictions || {}
       },
       anomalies: (postRecoveryReport.anomalies || []).map(convertAnomalyForAPI),
      recommendations: recoveryResult.isHealthy ? 
        ['✅ 시스템 복구 완료', '📊 안정성 모니터링 지속', ...postRecoveryReport.recommendations] :
        ['⚠️ 수동 개입 필요', '📋 시스템 로그 확인', '👨‍💻 관리자 문의', ...postRecoveryReport.recommendations],
      charts: generateFallbackResponse().charts, // 기본 차트
      health: recoveryResult // 레거시 호환성
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('🚨 Auto recovery API error:', error);
    
    const fallbackResponse = generateFallbackResponse();
    fallbackResponse.success = false;
    
    return NextResponse.json({
      ...fallbackResponse,
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: [
        '🚨 자동 복구 실패',
        '📋 API 로그 확인',
        '🔧 시스템 의존성 검증',
        '👨‍💻 수동 복구 시도'
      ]
    }, { status: 500 });
  }
} 