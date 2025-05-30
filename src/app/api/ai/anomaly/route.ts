/**
 * 🤖 머신러닝 이상 탐지 API
 * 
 * OpenManager AI v5.12.0 - 지능형 이상 탐지
 * - GET: 이상 탐지 대시보드 조회
 * - POST: 실시간 이상 탐지 실행
 * - PUT: 탐지 패턴 설정 업데이트
 * - DELETE: 오래된 알람 정리
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api/errorHandler';
import { anomalyDetection } from '../../../../services/ai/AnomalyDetection';
import { EnhancedDataGenerator, EnhancedServerMetrics } from '../../../../utils/enhanced-data-generator';

/**
 * 📊 이상 탐지 대시보드 조회 (GET)
 */
async function getAnomalyDashboardHandler(request: NextRequest) {
  try {
    console.log('📊 이상 탐지 대시보드 조회 API 호출');

    // 통계 정보 수집
    const statistics = anomalyDetection.getAnomalyStatistics();

    // 패턴 설정 조회
    const patterns = (anomalyDetection as any).patterns || [];

    return createSuccessResponse({
      dashboard: {
        statistics: {
          totalAnomalies: statistics.totalAnomalies,
          criticalAnomalies: statistics.criticalAnomalies,
          accuracy: statistics.accuracy,
          detectionRate: statistics.detectionRate,
          falsePositives: statistics.falsePositives,
          averageResponseTime: statistics.averageResponseTime
        },
        recentAnomalies: statistics.recentAnomalies.map(anomaly => ({
          id: anomaly.id,
          timestamp: new Date(anomaly.timestamp).toISOString(),
          serverId: anomaly.serverId,
          metric: anomaly.metric,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          description: anomaly.description,
          recommendations: anomaly.recommendations.slice(0, 3) // 최대 3개만 표시
        })),
        patterns: patterns.map((pattern: any) => ({
          id: pattern.id,
          name: pattern.name,
          enabled: pattern.enabled,
          accuracy: pattern.accuracy,
          falsePositiveRate: pattern.falsePositiveRate
        })),
        systemHealth: {
          overallStatus: statistics.criticalAnomalies === 0 ? 'healthy' : 
                       statistics.criticalAnomalies < 3 ? 'warning' : 'critical',
          alerts: {
            critical: statistics.criticalAnomalies,
            total: statistics.totalAnomalies
          },
          performance: {
            detectionLatency: statistics.averageResponseTime,
            accuracy: statistics.accuracy
          }
        }
      },
      recommendations: generateDashboardRecommendations(statistics)
    }, '이상 탐지 대시보드 조회 완료');

  } catch (error) {
    console.error('❌ 이상 탐지 대시보드 조회 실패:', error);
    return createErrorResponse(
      `이상 탐지 대시보드 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🔍 실시간 이상 탐지 실행 (POST)
 */
async function runAnomalyDetectionHandler(request: NextRequest) {
  try {
    console.log('🔍 실시간 이상 탐지 실행 API 호출');

    // 요청 본문에서 설정 확인
    const body = await request.json().catch(() => ({}));
    const { 
      serverIds = [], 
      metrics = ['cpu_usage', 'memory_usage', 'disk_usage', 'response_time'],
      sensitivity = 'medium' // 'low' | 'medium' | 'high'
    } = body;

    // 서버 데이터 가져오기
    const dataGenerator = new EnhancedDataGenerator();
    const enhancedServers = dataGenerator.generateRealisticServerMetrics(10, 'normal');
    
    // EnhancedServerMetrics를 기존 형식으로 변환
    let servers = enhancedServers.map(enhancedServer => ({
      id: enhancedServer.serverId,
      hostname: enhancedServer.hostname,
      cpu_usage: enhancedServer.metrics.cpu,
      memory_usage: enhancedServer.metrics.memory,
      disk_usage: enhancedServer.metrics.disk,
      response_time: enhancedServer.application.responseTime,
      status: enhancedServer.status,
      uptime: enhancedServer.uptime,
      timestamp: enhancedServer.timestamp
    }));

    // 특정 서버만 분석하는 경우 필터링
    if (serverIds.length > 0) {
      servers = servers.filter((server: any) => serverIds.includes(server.id));
    }

    if (servers.length === 0) {
      return createErrorResponse('분석할 서버가 없습니다', 'BAD_REQUEST');
    }

    // 민감도에 따른 임계값 조정
    const thresholdMultiplier = sensitivity === 'high' ? 0.8 : 
                               sensitivity === 'low' ? 1.2 : 1.0;

    // 이상 탐지 실행
    const startTime = Date.now();
    const detectedAnomalies = await anomalyDetection.detectAnomalies(servers);
    const detectionTime = Date.now() - startTime;

    // 메트릭 필터링
    const filteredAnomalies = detectedAnomalies.filter(anomaly => 
      metrics.includes(anomaly.metric) || anomaly.metric === 'system_health'
    );

    // 심각도별 분류
    const severityGroups = {
      critical: filteredAnomalies.filter(a => a.severity === 'critical'),
      high: filteredAnomalies.filter(a => a.severity === 'high'),
      medium: filteredAnomalies.filter(a => a.severity === 'medium'),
      low: filteredAnomalies.filter(a => a.severity === 'low')
    };

    return createSuccessResponse({
      detection: {
        executionTime: detectionTime,
        serversAnalyzed: servers.length,
        anomaliesDetected: filteredAnomalies.length,
        sensitivity,
        timestamp: new Date().toISOString()
      },
      anomalies: {
        total: filteredAnomalies.length,
        byServerity: {
          critical: severityGroups.critical.length,
          high: severityGroups.high.length,
          medium: severityGroups.medium.length,
          low: severityGroups.low.length
        },
        details: filteredAnomalies.map(anomaly => ({
          id: anomaly.id,
          serverId: anomaly.serverId,
          metric: anomaly.metric,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          description: anomaly.description,
          currentValue: anomaly.currentValue,
          expectedValue: anomaly.expectedValue,
          recommendations: anomaly.recommendations,
          timestamp: new Date(anomaly.timestamp).toISOString(),
          historicalContext: anomaly.historicalContext
        }))
      },
      systemStatus: {
        overallHealth: severityGroups.critical.length === 0 ? 'healthy' : 'critical',
        riskScore: calculateRiskScore(filteredAnomalies),
        affectedServers: [...new Set(filteredAnomalies.map(a => a.serverId))].length
      },
      recommendations: generateDetectionRecommendations(filteredAnomalies, severityGroups)
    }, `이상 탐지 완료 - ${filteredAnomalies.length}개 이상 징후 발견`);

  } catch (error) {
    console.error('❌ 실시간 이상 탐지 실행 실패:', error);
    return createErrorResponse(
      `이상 탐지 실행 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * ⚙️ 탐지 패턴 설정 업데이트 (PUT)
 */
async function updateDetectionPatternsHandler(request: NextRequest) {
  try {
    console.log('⚙️ 탐지 패턴 설정 업데이트 API 호출');

    const body = await request.json();
    const { 
      patterns = [],
      learningMode = null,
      globalSettings = {}
    } = body;

    let updatedCount = 0;

    // 패턴 활성화/비활성화 업데이트
    for (const pattern of patterns) {
      if (pattern.id && typeof pattern.enabled === 'boolean') {
        anomalyDetection.togglePattern(pattern.id, pattern.enabled);
        updatedCount++;
      }
    }

    // 학습 모드 설정
    if (typeof learningMode === 'boolean') {
      anomalyDetection.setLearningMode(learningMode);
    }

    return createSuccessResponse({
      update: {
        patternsUpdated: updatedCount,
        learningModeChanged: learningMode !== null,
        timestamp: new Date().toISOString()
      },
      currentSettings: {
        learningMode: (anomalyDetection as any).isLearningMode,
        enabledPatterns: (anomalyDetection as any).patterns?.filter((p: any) => p.enabled).length || 0,
        totalPatterns: (anomalyDetection as any).patterns?.length || 0
      }
    }, '탐지 패턴 설정 업데이트 완료');

  } catch (error) {
    console.error('❌ 탐지 패턴 설정 업데이트 실패:', error);
    return createErrorResponse(
      `패턴 설정 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🧹 오래된 알람 정리 (DELETE)
 */
async function cleanupOldAlertsHandler(request: NextRequest) {
  try {
    console.log('🧹 오래된 알람 정리 API 호출');

    const beforeStats = anomalyDetection.getAnomalyStatistics();
    
    // 정리 실행
    anomalyDetection.cleanupOldAlerts();
    
    const afterStats = anomalyDetection.getAnomalyStatistics();
    const cleanedCount = beforeStats.totalAnomalies - afterStats.totalAnomalies;

    return createSuccessResponse({
      cleanup: {
        beforeCount: beforeStats.totalAnomalies,
        afterCount: afterStats.totalAnomalies,
        cleanedCount,
        timestamp: new Date().toISOString()
      },
      recommendations: cleanedCount > 0 ? 
        ['✅ 알람 정리 완료', '📊 시스템 성능 개선됨'] :
        ['💡 정리할 오래된 알람이 없습니다']
    }, `알람 정리 완료 - ${cleanedCount}개 항목 제거`);

  } catch (error) {
    console.error('❌ 알람 정리 실패:', error);
    return createErrorResponse(
      `알람 정리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 📊 위험도 점수 계산
 */
function calculateRiskScore(anomalies: any[]): number {
  if (anomalies.length === 0) return 0;

  const weights = { critical: 4, high: 3, medium: 2, low: 1 };
  const totalScore = anomalies.reduce((sum, anomaly) => {
    return sum + (weights[anomaly.severity as keyof typeof weights] || 0) * anomaly.confidence;
  }, 0);

  const maxPossibleScore = anomalies.length * 4; // 모두 critical일 때
  return Math.min(100, Math.round((totalScore / maxPossibleScore) * 100));
}

/**
 * 💡 대시보드 권장사항 생성
 */
function generateDashboardRecommendations(statistics: any): string[] {
  const recommendations: string[] = [];

  if (statistics.criticalAnomalies > 0) {
    recommendations.push(`🚨 ${statistics.criticalAnomalies}개 위험 이상 징후 - 즉시 조치 필요`);
  }

  if (statistics.accuracy < 0.85) {
    recommendations.push('🎯 탐지 정확도 개선 필요 - 모델 재훈련 권장');
  }

  if (statistics.falsePositives > statistics.totalAnomalies * 0.1) {
    recommendations.push('🔧 임계값 조정 필요 - 과탐지 발생');
  }

  if (statistics.averageResponseTime > 500) {
    recommendations.push('⚡ 탐지 성능 최적화 필요 - 응답시간 개선');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ 이상 탐지 시스템 정상 운영 중');
  }

  return recommendations;
}

/**
 * 🔍 탐지 권장사항 생성
 */
function generateDetectionRecommendations(anomalies: any[], severityGroups: any): string[] {
  const recommendations: string[] = [];

  if (severityGroups.critical.length > 0) {
    recommendations.push(`🚨 ${severityGroups.critical.length}개 위험 이상 - 즉시 대응 필요`);
    recommendations.push('📞 운영팀 알림 및 긴급 점검 수행');
  }

  if (severityGroups.high.length > 2) {
    recommendations.push('⚠️ 다수 높은 위험도 이상 - 시스템 전체 점검 권장');
  }

  const memoryAnomalies = anomalies.filter(a => a.metric === 'memory_usage');
  if (memoryAnomalies.length > 0) {
    recommendations.push('🧠 메모리 최적화 실행 권장');
  }

  const cpuAnomalies = anomalies.filter(a => a.metric === 'cpu_usage');
  if (cpuAnomalies.length > 0) {
    recommendations.push('⚡ CPU 부하 분산 검토 필요');
  }

  if (anomalies.length === 0) {
    recommendations.push('✅ 시스템 정상 상태 - 지속적 모니터링 유지');
  }

  return recommendations;
}

// 에러 핸들러로 래핑
export const GET = withErrorHandler(getAnomalyDashboardHandler);
export const POST = withErrorHandler(runAnomalyDetectionHandler);
export const PUT = withErrorHandler(updateDetectionPatternsHandler);
export const DELETE = withErrorHandler(cleanupOldAlertsHandler); 