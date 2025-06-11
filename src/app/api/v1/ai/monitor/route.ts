/**
 * 🚀 API v1 - 서버 모니터링 전용 엔드포인트
 * 
 * 실시간 서버 모니터링 및 알림에 특화
 * - 실시간 상태 확인
 * - 임계값 기반 알림
 * - 자동 복구 제안
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAIEngine, UnifiedAnalysisRequest } from '@/core/ai/UnifiedAIEngine';

interface MonitoringRequest {
  serverName?: string;
  currentStatus: {
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    network?: {
      in: number;
      out: number;
    };
    processes?: number;
    uptime?: number;
  };
  thresholds?: {
    cpu?: { warning: number; critical: number };
    memory?: { warning: number; critical: number };
    disk?: { warning: number; critical: number };
  };
  checkType?: 'health' | 'performance' | 'security' | 'comprehensive';
  alertLevel?: 'info' | 'warning' | 'critical';
  sessionId?: string;
}

// 🧠 모니터링 캐시 (매우 짧은 TTL)
const monitorCache = new Map<string, { result: any; timestamp: number }>();
const MONITOR_CACHE_TTL = 30 * 1000; // 30초

/**
 * 🎯 실시간 모니터링 분석
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: MonitoringRequest = await request.json();

    // 현재 상태 검증
    if (!body.currentStatus || typeof body.currentStatus !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Current server status is required',
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // 기본 임계값 설정
    const thresholds = {
      cpu: { warning: 70, critical: 85, ...body.thresholds?.cpu },
      memory: { warning: 75, critical: 90, ...body.thresholds?.memory },
      disk: { warning: 80, critical: 95, ...body.thresholds?.disk }
    };

    // 캐시 키 생성
    const cacheKey = generateMonitorCacheKey(body);
    const cached = getCachedMonitor(cacheKey);

    if (cached) {
      console.log('🚀 모니터링 캐시 히트:', cacheKey);
      return NextResponse.json({
        ...cached,
        meta: {
          ...cached.meta,
          cached: true,
          totalTime: Date.now() - startTime
        }
      });
    }

    // 상태 평가
    const statusAssessment = assessServerStatus(body.currentStatus, thresholds);

    // 분석 타입에 따른 쿼리 생성
    const query = generateMonitoringQuery(body.checkType || 'health', body.currentStatus, statusAssessment);

    // UnifiedAnalysisRequest 구성
    const analysisRequest: UnifiedAnalysisRequest = {
      query,
      context: {
        serverMetrics: [convertToServerMetrics(body.currentStatus)],
        urgency: statusAssessment.overallLevel as any,
        sessionId: body.sessionId
      },
      options: {
        enableMCP: statusAssessment.overallLevel === 'critical', // 심각한 경우에만 MCP 도구 사용
        enableAnalysis: true,
        maxResponseTime: 15000, // 모니터링은 빠르게
        confidenceThreshold: 0.6
      }
    };

    console.log('🔥 V1 모니터링:', {
      serverName: body.serverName || 'unknown',
      checkType: body.checkType,
      overallLevel: statusAssessment.overallLevel,
      issuesFound: statusAssessment.issues.length
    });

    // UnifiedAIEngine으로 분석 수행
    const result = await UnifiedAIEngine.getInstance().processQuery(analysisRequest);

    // 모니터링 특화 응답 구성
    const response = {
      success: result.success,

      // 🧠 모니터링 결과
      data: {
        serverStatus: {
          overall: statusAssessment.overallLevel,
          current: body.currentStatus,
          thresholds,
          issues: statusAssessment.issues,
          score: statusAssessment.score
        },
        analysis: result.analysis,
        recommendations: result.recommendations,
        actions: generateActionItems(statusAssessment.issues, body.currentStatus),
        alerts: statusAssessment.issues.filter((issue: { level: string }) =>
          issue.level === 'warning' || issue.level === 'critical'
        )
      },

      // 🔧 메타데이터
      meta: {
        sessionId: result.metadata.sessionId,
        processingTime: Date.now() - startTime,
        engines: result.engines,
        apiVersion: 'v1.0.0',
        checkType: body.checkType || 'health',
        serverName: body.serverName || 'unknown',
        timestamp: new Date().toISOString(),
        nextCheckRecommended: getNextCheckTime(statusAssessment.overallLevel),
        cached: false
      }
    };

    // 결과 캐싱 (정상 상태인 경우만)
    if (result.success && statusAssessment.overallLevel !== 'critical') {
      setCachedMonitor(cacheKey, response);
    }

    console.log('✅ V1 모니터링 응답:', {
      success: result.success,
      overallStatus: statusAssessment.overallLevel,
      issuesCount: statusAssessment.issues.length,
      actionsCount: response.data.actions.length,
      totalTime: Date.now() - startTime
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ V1 모니터링 API 오류:', error);

    return NextResponse.json({
      success: false,
      error: '서버 모니터링 중 오류가 발생했습니다',
      code: 'MONITORING_ERROR',
      message: error.message,
      meta: {
        processingTime: Date.now() - startTime,
        apiVersion: 'v1.0.0',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 🔍 모니터링 시스템 상태
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'health':
        return NextResponse.json({
          status: 'healthy',
          version: 'v1.0.0',
          cache: {
            size: monitorCache.size,
            ttl: MONITOR_CACHE_TTL / 1000 + 's'
          },
          capabilities: [
            'real-time status monitoring',
            'threshold-based alerting',
            'automated issue detection',
            'action recommendations',
            'performance scoring'
          ],
          timestamp: new Date().toISOString()
        });

      case 'thresholds':
        return NextResponse.json({
          defaultThresholds: {
            cpu: { warning: 70, critical: 85 },
            memory: { warning: 75, critical: 90 },
            disk: { warning: 80, critical: 95 }
          },
          checkTypes: ['health', 'performance', 'security', 'comprehensive'],
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          name: 'Server Monitoring API v1',
          version: 'v1.0.0',
          description: '실시간 서버 모니터링 및 알림',
          checkTypes: [
            'health - 기본 상태 확인',
            'performance - 성능 모니터링',
            'security - 보안 상태 확인',
            'comprehensive - 종합 모니터링'
          ],
          endpoints: {
            'POST /api/v1/ai/monitor': '실시간 모니터링',
            'GET /api/v1/ai/monitor?action=health': '시스템 상태',
            'GET /api/v1/ai/monitor?action=thresholds': '임계값 정보'
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 🔧 모니터링 유틸리티 함수들
function generateMonitorCacheKey(body: MonitoringRequest): string {
  const keyData = {
    type: body.checkType || 'health',
    server: body.serverName || 'default',
    status: `${body.currentStatus.cpu}-${body.currentStatus.memory}-${body.currentStatus.disk}`,
    minute: Math.floor(Date.now() / (60 * 1000)) // 1분 단위로 그룹화
  };
  return `monitor_${Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 20)}`;
}

function getCachedMonitor(key: string): any {
  const cached = monitorCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > MONITOR_CACHE_TTL) {
    monitorCache.delete(key);
    return null;
  }

  return cached.result;
}

function setCachedMonitor(key: string, result: any): void {
  // 캐시 크기 제한 (200개)
  if (monitorCache.size >= 200) {
    const firstKey = monitorCache.keys().next().value;
    if (firstKey) {
      monitorCache.delete(firstKey);
    }
  }

  monitorCache.set(key, {
    result,
    timestamp: Date.now()
  });
}

function convertToServerMetrics(status: any): any {
  return {
    timestamp: status.timestamp,
    cpu: status.cpu,
    memory: status.memory,
    disk: status.disk,
    networkIn: status.network?.in || 0,
    networkOut: status.network?.out || 0,
    responseTime: 0,
    activeConnections: status.processes || 0
  };
}

function assessServerStatus(status: any, thresholds: any): any {
  const issues = [];
  let score = 100;

  // CPU 확인
  if (status.cpu >= thresholds.cpu.critical) {
    issues.push({
      type: 'cpu',
      level: 'critical',
      message: `CPU 사용률이 위험 수준입니다 (${status.cpu}%)`
    });
    score -= 30;
  } else if (status.cpu >= thresholds.cpu.warning) {
    issues.push({
      type: 'cpu',
      level: 'warning',
      message: `CPU 사용률이 높습니다 (${status.cpu}%)`
    });
    score -= 15;
  }

  // Memory 확인
  if (status.memory >= thresholds.memory.critical) {
    issues.push({
      type: 'memory',
      level: 'critical',
      message: `메모리 사용률이 위험 수준입니다 (${status.memory}%)`
    });
    score -= 30;
  } else if (status.memory >= thresholds.memory.warning) {
    issues.push({
      type: 'memory',
      level: 'warning',
      message: `메모리 사용률이 높습니다 (${status.memory}%)`
    });
    score -= 15;
  }

  // Disk 확인
  if (status.disk >= thresholds.disk.critical) {
    issues.push({
      type: 'disk',
      level: 'critical',
      message: `디스크 사용률이 위험 수준입니다 (${status.disk}%)`
    });
    score -= 25;
  } else if (status.disk >= thresholds.disk.warning) {
    issues.push({
      type: 'disk',
      level: 'warning',
      message: `디스크 사용률이 높습니다 (${status.disk}%)`
    });
    score -= 10;
  }

  // 전체 상태 레벨 결정
  const criticalIssues = issues.filter(i => i.level === 'critical').length;
  const warningIssues = issues.filter(i => i.level === 'warning').length;

  let overallLevel = 'healthy';
  if (criticalIssues > 0) overallLevel = 'critical';
  else if (warningIssues > 0) overallLevel = 'warning';
  else if (score < 90) overallLevel = 'caution';

  return {
    issues,
    score: Math.max(0, score),
    overallLevel
  };
}

function generateMonitoringQuery(type: string, status: any, assessment: any): string {
  const baseInfo = `현재 서버 상태: CPU ${status.cpu}%, 메모리 ${status.memory}%, 디스크 ${status.disk}%`;

  switch (type) {
    case 'health':
      return `${baseInfo}. 전체 상태: ${assessment.overallLevel}. 건강 상태를 종합적으로 분석해주세요.`;
    case 'performance':
      return `${baseInfo}. 성능 최적화 관점에서 분석하고 개선 방안을 제시해주세요.`;
    case 'security':
      return `${baseInfo}. 보안 관점에서 위험 요소와 보안 강화 방안을 분석해주세요.`;
    default:
      return `${baseInfo}. 종합적인 서버 모니터링 분석을 수행해주세요. 이슈 수: ${assessment.issues.length}개`;
  }
}

function generateActionItems(issues: any[], status: any): Array<{ priority: string; action: string; category: string }> {
  const actions = [];

  for (const issue of issues) {
    switch (issue.type) {
      case 'cpu':
        if (issue.level === 'critical') {
          actions.push({
            priority: 'urgent',
            action: 'CPU 집약적 프로세스 식별 및 종료',
            category: 'performance'
          });
          actions.push({
            priority: 'urgent',
            action: 'CPU 코어 사용률 분산 확인',
            category: 'optimization'
          });
        } else {
          actions.push({
            priority: 'high',
            action: 'CPU 사용량 모니터링 강화',
            category: 'monitoring'
          });
        }
        break;

      case 'memory':
        if (issue.level === 'critical') {
          actions.push({
            priority: 'urgent',
            action: '메모리 리크 점검 및 정리',
            category: 'maintenance'
          });
          actions.push({
            priority: 'urgent',
            action: '메모리 집약적 프로세스 재시작',
            category: 'performance'
          });
        } else {
          actions.push({
            priority: 'medium',
            action: '메모리 사용 패턴 분석',
            category: 'analysis'
          });
        }
        break;

      case 'disk':
        if (issue.level === 'critical') {
          actions.push({
            priority: 'urgent',
            action: '불필요한 파일 즉시 정리',
            category: 'maintenance'
          });
          actions.push({
            priority: 'urgent',
            action: '로그 파일 아카이빙',
            category: 'maintenance'
          });
        } else {
          actions.push({
            priority: 'medium',
            action: '디스크 사용량 정기 점검',
            category: 'monitoring'
          });
        }
        break;
    }
  }

  // 기본 액션 (이슈가 없는 경우)
  if (actions.length === 0) {
    actions.push({
      priority: 'low',
      action: '정기 상태 점검 계속',
      category: 'monitoring'
    });
  }

  return actions;
}

function getNextCheckTime(level: string): string {
  const now = new Date();
  let minutes = 5; // 기본값

  switch (level) {
    case 'critical': minutes = 1; break;
    case 'warning': minutes = 2; break;
    case 'caution': minutes = 3; break;
    default: minutes = 5; break;
  }

  return new Date(now.getTime() + minutes * 60 * 1000).toISOString();
} 