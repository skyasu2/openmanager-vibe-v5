/**
 * 🤖 AI 현재 상태 분석 API
 *
 * OpenManager AI v5.12.0 - 현재 상태 중심 분석
 * - 현재 서버 상태 분석
 * - 실시간 문제 진단
 * - 현재 리소스 사용량 분석
 * - 즉시 대응 권장사항
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandler,
} from '../../../../lib/api/errorHandler';
import { cacheService } from '../../../../services/cacheService';

/**
 * 📊 현재 상태 분석 대시보드 데이터 조회 (GET)
 */
async function getCurrentAnalysisDashboardHandler(request: NextRequest) {
  try {
    console.log('🤖 AI 현재 상태 분석 대시보드 API 호출');

    // 현재 서버 상태 데이터 수집
    const cachedServers = await cacheService.getCachedServers();
    const servers = cachedServers?.servers || [];

    if (servers.length === 0) {
      return createErrorResponse('서버 데이터가 없습니다', 'NOT_FOUND');
    }

    // 현재 상태 분석
    const currentAnalysis = analyzeCurrentState(servers);

    return createSuccessResponse(
      {
        analysis: currentAnalysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          serverCount: servers.length,
          analysisType: '현재 상태 분석',
          dataFreshness: '실시간',
        },
      },
      'AI 현재 상태 분석 완료'
    );
  } catch (error) {
    console.error('❌ AI 현재 상태 분석 실패:', error);
    return createErrorResponse(
      `현재 상태 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 📈 현재 리소스 사용량 분석 (POST)
 */
async function analyzeCurrentResourceUsageHandler(request: NextRequest) {
  try {
    console.log('📈 현재 리소스 사용량 분석 API 호출');

    const body = await request.json().catch(() => ({}));
    const { serverIds = [] } = body;

    // 현재 서버 상태 데이터 수집
    const cachedServers = await cacheService.getCachedServers();
    let servers = cachedServers?.servers || [];

    // 특정 서버들만 분석하는 경우
    if (serverIds.length > 0) {
      servers = servers.filter(server => serverIds.includes(server.id));
    }

    if (servers.length === 0) {
      return createErrorResponse('분석할 서버 데이터가 없습니다', 'NOT_FOUND');
    }

    // 현재 리소스 사용량 분석
    const resourceAnalysis = analyzeCurrentResources(servers);

    return createSuccessResponse(
      {
        analysis: resourceAnalysis,
        serverCount: servers.length,
        timestamp: new Date().toISOString(),
        recommendations: generateCurrentStateRecommendations(resourceAnalysis),
      },
      `${servers.length}개 서버의 현재 리소스 상태 분석 완료`
    );
  } catch (error) {
    console.error('❌ 현재 리소스 사용량 분석 실패:', error);
    return createErrorResponse(
      `리소스 사용량 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

// GET과 POST 요청 처리
export const GET = withErrorHandler(getCurrentAnalysisDashboardHandler);
export const POST = withErrorHandler(analyzeCurrentResourceUsageHandler);

/**
 * 🔍 현재 상태 분석
 */
function analyzeCurrentState(servers: any[]) {
  const healthyCount = servers.filter(
    s => s.status === 'normal' || s.status === 'healthy'
  ).length;
  const warningCount = servers.filter(s => s.status === 'warning').length;
  const errorCount = servers.filter(
    s => s.status === 'error' || s.status === 'critical'
  ).length;

  // 현재 평균 메트릭 계산
  const avgCpu =
    servers.reduce((sum, s) => sum + (s.metrics?.cpu || s.cpu || 0), 0) /
    servers.length;
  const avgMemory =
    servers.reduce((sum, s) => sum + (s.metrics?.memory || s.memory || 0), 0) /
    servers.length;
  const avgDisk =
    servers.reduce((sum, s) => sum + (s.metrics?.disk || s.disk || 0), 0) /
    servers.length;

  // 현재 문제점 식별
  const currentIssues = [];
  if (avgCpu > 80) currentIssues.push('높은 CPU 사용률');
  if (avgMemory > 85) currentIssues.push('높은 메모리 사용률');
  if (avgDisk > 90) currentIssues.push('높은 디스크 사용률');
  if (errorCount > 0) currentIssues.push(`${errorCount}개 서버 오류 상태`);

  return {
    systemHealth: {
      current:
        healthyCount / servers.length > 0.8
          ? 'healthy'
          : warningCount > 0
            ? 'warning'
            : 'critical',
      healthyServers: healthyCount,
      warningServers: warningCount,
      errorServers: errorCount,
    },
    currentMetrics: {
      avgCpu: Number(avgCpu.toFixed(1)),
      avgMemory: Number(avgMemory.toFixed(1)),
      avgDisk: Number(avgDisk.toFixed(1)),
    },
    currentIssues,
    urgentAlerts: servers.filter(
      s =>
        (s.metrics?.cpu || s.cpu || 0) > 90 ||
        (s.metrics?.memory || s.memory || 0) > 95
    ),
  };
}

/**
 * 📊 현재 리소스 사용량 분석
 */
function analyzeCurrentResources(servers: any[]) {
  const resources = ['cpu', 'memory', 'disk'];
  const analysis: any = {};

  resources.forEach(resource => {
    const values = servers.map(s => s.metrics?.[resource] || s[resource] || 0);
    const currentAvg =
      values.reduce((sum, val) => sum + val, 0) / values.length;
    const maxUsage = Math.max(...values);
    const minUsage = Math.min(...values);

    // 현재 상태 평가
    let status = 'normal';
    if (currentAvg > 90) status = 'critical';
    else if (currentAvg > 80) status = 'warning';
    else if (currentAvg > 70) status = 'caution';

    analysis[resource] = {
      currentAverage: Number(currentAvg.toFixed(1)),
      currentMax: Number(maxUsage.toFixed(1)),
      currentMin: Number(minUsage.toFixed(1)),
      status,
      serversOverThreshold: values.filter(v => v > 80).length,
    };
  });

  return analysis;
}

/**
 * 📋 현재 상태 기반 권장사항 생성
 */
function generateCurrentStateRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];

  Object.entries(analysis).forEach(([resource, data]: [string, any]) => {
    if (data.status === 'critical') {
      recommendations.push(
        `🚨 ${resource.toUpperCase()} 사용률이 위험 수준: 즉시 조치 필요`
      );
    } else if (data.status === 'warning') {
      recommendations.push(
        `⚠️ ${resource.toUpperCase()} 사용률 높음: 모니터링 강화 권장`
      );
    } else if (data.status === 'caution') {
      recommendations.push(
        `📊 ${resource.toUpperCase()} 사용률 주의: 추세 관찰 필요`
      );
    }

    if (data.serversOverThreshold > 0) {
      recommendations.push(
        `🔍 ${data.serversOverThreshold}개 서버의 ${resource} 사용률이 80% 초과`
      );
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('✅ 현재 모든 리소스가 정상 범위에 있습니다');
  }

  return recommendations;
}
