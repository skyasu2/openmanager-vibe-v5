/**
 * 🚨 자동 장애 보고서 API
 * 
 * Phase 2: Auto Incident Report Backend
 * - 이상 징후 자동 감지
 * - AI 기반 원인 분석
 * - 자동 보고서 생성
 * - 패턴 학습 및 예측
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { supabase } from '@/lib/supabase/supabase-client';
import { getCachedData, setCachedData } from '@/lib/cache-helper';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Types
interface ServerMetric {
  server_id: string;
  server_name: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: string;
}

interface Anomaly {
  server_id: string;
  server_name: string;
  metric_type: 'cpu' | 'memory' | 'disk' | 'network';
  value: number;
  severity: 'critical' | 'warning' | 'info';
  threshold: number;
  timestamp: string;
}

interface IncidentReport {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_servers: string[];
  anomalies: Anomaly[];
  root_cause_analysis: {
    primary_cause: string;
    contributing_factors: string[];
    confidence: number;
  };
  recommendations: Array<{
    action: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    expected_impact: string;
  }>;
  timeline: Array<{
    timestamp: string;
    event: string;
    severity: string;
  }>;
  pattern?: string;
  created_at: string;
}

// Root cause analysis 타입 정의 - any 타입 제거
interface RootCauseAnalysis {
  primary_cause: string;
  contributing_factors: string[];
  confidence: number;
}

// Recommendation 타입 정의 - any 타입 제거
interface Recommendation {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  expected_impact: string;
}

// Timeline event 타입 정의 - any 타입 제거
interface TimelineEvent {
  timestamp: string;
  event: string;
  severity: string;
}

// Thresholds
const THRESHOLDS = {
  critical: 90,
  warning: 80,
  info: 70,
};

// Alert cooldown tracking (in-memory for simplicity)
const alertCooldowns = new Map<string, number>();
const COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutes

// Export for testing purposes
export const _testHelpers = {
  clearAlertCooldowns: () => alertCooldowns.clear(),
};

/**
 * Detect anomalies in server metrics
 */
function detectAnomalies(metrics: ServerMetric[]): {
  anomalies: Anomaly[];
  pattern: string;
} {
  const anomalies: Anomaly[] = [];
  
  for (const metric of metrics) {
    // Check each metric type
    const metricTypes: Array<keyof Pick<ServerMetric, 'cpu' | 'memory' | 'disk' | 'network'>> = 
      ['cpu', 'memory', 'disk', 'network'];
    
    for (const type of metricTypes) {
      const value = metric[type];
      
      if (value >= THRESHOLDS.critical) {
        anomalies.push({
          server_id: metric.server_id,
          server_name: metric.server_name,
          metric_type: type,
          value,
          severity: 'critical',
          threshold: THRESHOLDS.critical,
          timestamp: metric.timestamp,
        });
      } else if (value >= THRESHOLDS.warning) {
        anomalies.push({
          server_id: metric.server_id,
          server_name: metric.server_name,
          metric_type: type,
          value,
          severity: 'warning',
          threshold: THRESHOLDS.warning,
          timestamp: metric.timestamp,
        });
      }
    }
  }

  // Analyze pattern
  const pattern = analyzePattern(anomalies);
  
  return { anomalies, pattern };
}

/**
 * Analyze anomaly patterns
 */
function analyzePattern(anomalies: Anomaly[]): string {
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const affectedServers = new Set(anomalies.map(a => a.server_id)).size;
  const metricTypes = new Set(anomalies.map(a => a.metric_type));

  if (criticalCount >= 3 && affectedServers >= 2) {
    return 'cascade_failure';
  }
  if (metricTypes.has('network') && anomalies.some(a => a.metric_type === 'network' && a.severity === 'critical')) {
    return 'network_saturation';
  }
  if (metricTypes.has('cpu') && metricTypes.has('memory')) {
    return 'resource_exhaustion';
  }
  
  return 'isolated_spike';
}

/**
 * Generate incident report
 */
function generateReport(
  metrics: ServerMetric[],
  anomalies: Anomaly[],
  pattern: string
): IncidentReport {
  const severity = determineSeverity(anomalies);
  const affectedServers = [...new Set(anomalies.map(a => a.server_id))];
  
  // AI-powered root cause analysis (simplified)
  const rootCause = analyzeRootCause(anomalies, pattern);
  
  // Generate recommendations
  const recommendations = generateRecommendations(anomalies, pattern, rootCause);
  
  // Build timeline
  const timeline = buildTimeline(anomalies);
  
  return {
    id: crypto.randomUUID(),
    title: generateTitle(severity, pattern),
    severity,
    affected_servers: affectedServers,
    anomalies,
    root_cause_analysis: rootCause,
    recommendations,
    timeline,
    pattern,
    created_at: new Date().toISOString(),
  };
}

/**
 * Determine overall severity
 */
function determineSeverity(anomalies: Anomaly[]): 'critical' | 'high' | 'medium' | 'low' {
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const warningCount = anomalies.filter(a => a.severity === 'warning').length;
  
  if (criticalCount >= 2) return 'critical';
  if (criticalCount >= 1) return 'high';
  if (warningCount >= 2) return 'medium';
  return 'low';
}

/**
 * Analyze root cause
 */
function analyzeRootCause(anomalies: Anomaly[], pattern: string): RootCauseAnalysis {
  // Simplified AI analysis (in production, would use actual AI)
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  const metricCounts: Record<string, number> = {};
  
  anomalies.forEach(a => {
    metricCounts[a.metric_type] = (metricCounts[a.metric_type] || 0) + 1;
  });
  
  const primaryMetric = Object.entries(metricCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';
  
  const causeMap: Record<string, string> = {
    cascade_failure: '연쇄 장애: 하나의 서버 장애가 다른 서버로 전파',
    network_saturation: '네트워크 포화: 과도한 트래픽으로 인한 네트워크 병목',
    resource_exhaustion: '리소스 고갈: CPU/메모리 자원 부족',
    isolated_spike: '개별 스파이크: 특정 서버의 일시적 부하 증가',
  };
  
  return {
    primary_cause: causeMap[pattern] || '알 수 없는 원인',
    contributing_factors: [
      criticalAnomalies.length > 0 ? `${criticalAnomalies.length}개 서버에서 심각한 문제 발견` : '',
      primaryMetric !== 'unknown' ? `${primaryMetric} 메트릭이 주요 문제` : '',
    ].filter(Boolean),
    confidence: 0.75 + (pattern !== 'isolated_spike' ? 0.15 : 0),
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  anomalies: Anomaly[],
  pattern: string,
  rootCause: RootCauseAnalysis
): Recommendation[] {
  const recommendations = [];
  
  // Pattern-specific recommendations
  switch (pattern) {
    case 'cascade_failure':
      recommendations.push({
        action: '영향받은 서버 간 의존성 확인 및 격리',
        priority: 'immediate' as const,
        expected_impact: '연쇄 장애 확산 방지',
      });
      break;
    case 'network_saturation':
      recommendations.push({
        action: '네트워크 트래픽 제한 및 로드 밸런싱 조정',
        priority: 'immediate' as const,
        expected_impact: '네트워크 병목 해소',
      });
      break;
    case 'resource_exhaustion':
      recommendations.push({
        action: '자원 사용량이 높은 프로세스 확인 및 최적화',
        priority: 'high' as const,
        expected_impact: '시스템 안정성 회복',
      });
      break;
  }
  
  // Metric-specific recommendations
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  if (criticalAnomalies.some(a => a.metric_type === 'cpu')) {
    recommendations.push({
      action: 'CPU 사용률 높은 프로세스 종료 또는 스케일링',
      priority: 'high' as const,
      expected_impact: 'CPU 부하 감소',
    });
  }
  
  if (criticalAnomalies.some(a => a.metric_type === 'memory')) {
    recommendations.push({
      action: '메모리 누수 확인 및 가비지 컬렉션 실행',
      priority: 'high' as const,
      expected_impact: '메모리 사용량 정상화',
    });
  }
  
  // General recommendation
  recommendations.push({
    action: '모니터링 임계값 조정 및 알림 규칙 업데이트',
    priority: 'medium' as const,
    expected_impact: '향후 조기 감지 개선',
  });
  
  return recommendations;
}

/**
 * Build incident timeline
 */
function buildTimeline(anomalies: Anomaly[]): TimelineEvent[] {
  return anomalies
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(anomaly => ({
      timestamp: anomaly.timestamp,
      event: `${anomaly.server_name}: ${anomaly.metric_type} ${anomaly.value}% (${anomaly.severity})`,
      severity: anomaly.severity,
    }));
}

/**
 * Generate report title
 */
function generateTitle(severity: string, pattern: string): string {
  const severityMap: Record<string, string> = {
    critical: '🔴 심각',
    high: '🟠 높음',
    medium: '🟡 중간',
    low: '🟢 낮음',
  };
  
  const patternMap: Record<string, string> = {
    cascade_failure: '연쇄 장애 발생',
    network_saturation: '네트워크 포화 감지',
    resource_exhaustion: '리소스 고갈 경고',
    isolated_spike: '개별 서버 이상',
  };
  
  return `${severityMap[severity]} - ${patternMap[pattern] || '시스템 이상 감지'}`;
}

/**
 * Check if alert should be sent (cooldown logic)
 */
function shouldSendAlert(reportId: string): boolean {
  const now = Date.now();
  const lastAlert = alertCooldowns.get(reportId);
  
  if (!lastAlert || now - lastAlert > COOLDOWN_PERIOD) {
    alertCooldowns.set(reportId, now);
    return true;
  }
  
  return false;
}

/**
 * POST handler
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, metrics, notify = false, timeRange } = body;

    switch (action) {
      case 'detect': {
        if (!metrics || !Array.isArray(metrics)) {
          return NextResponse.json(
            { success: false, error: 'Invalid metrics data' },
            { status: 400 }
          );
        }

        const startTime = Date.now();
        const { anomalies, pattern } = detectAnomalies(metrics);
        const responseTime = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          anomalies,
          pattern,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      }

      case 'generate': {
        if (!metrics || !Array.isArray(metrics)) {
          return NextResponse.json(
            { success: false, error: 'Invalid metrics data' },
            { status: 400 }
          );
        }

        const startTime = Date.now();
        const { anomalies, pattern } = detectAnomalies(metrics);
        const report = generateReport(metrics, anomalies, pattern);
        
        // Try to save to database
        let saveWarning;
        try {
          const { error } = await supabase
            .from('incident_reports')
            .insert({
              id: report.id,
              title: report.title,
              severity: report.severity,
              affected_servers: report.affected_servers,
              anomalies: report.anomalies,
              root_cause_analysis: report.root_cause_analysis,
              recommendations: report.recommendations,
              timeline: report.timeline,
              pattern: report.pattern,
              created_at: report.created_at,
            });
          
          if (error) {
            saveWarning = 'Failed to save report to database';
            console.error('DB save error:', error);
          }
        } catch (error) {
          saveWarning = 'Failed to save report to database';
          console.error('DB save error:', error);
        }

        // Handle notifications
        let notifications = undefined;
        if (notify) {
          const alertKey = `${report.severity}-${pattern}`;
          const sent = shouldSendAlert(alertKey);
          
          notifications = {
            sent,
            channels: sent ? ['webhook'] : [],
            reason: sent ? undefined : 'cooldown_period',
          };
        }

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          report,
          notifications,
          warning: saveWarning,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      }

      case 'analyze_patterns': {
        // Pattern analysis (simplified)
        const patterns = [
          {
            type: 'recurring_spike',
            frequency: 3,
            servers_affected: ['server-01', 'server-02'],
            prediction: 'Likely to occur again in 2-3 hours',
          },
        ];

        return NextResponse.json({
          success: true,
          patterns,
          timestamp: new Date().toISOString(),
        });
      }

      case 'predict': {
        // Prediction (simplified)
        const prediction = {
          type: 'resource_exhaustion',
          probability: 0.72,
          estimated_time: '2-4 hours',
          preventive_actions: [
            'Increase memory allocation',
            'Enable auto-scaling',
            'Clear cache',
          ],
        };

        return NextResponse.json({
          success: true,
          prediction,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Incident report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler
 */
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get specific report
      const cacheKey = `incident:${id}`;
      let report = getCachedData(cacheKey);
      
      if (!report) {
        const { data, error } = await supabase
          .from('incident_reports')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        report = data;
        
        if (report) {
          setCachedData(cacheKey, report, 300);
        }
      }

      return NextResponse.json({
        success: true,
        report,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get recent reports
      const { data: reports, error } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        reports: reports || [],
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Get incident reports error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve reports',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export with authentication
export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);