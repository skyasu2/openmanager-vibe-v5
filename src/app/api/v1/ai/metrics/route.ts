/**
 * 🚀 API v1 - 메트릭 분석 전용 엔드포인트
 * 
 * 서버 메트릭 분석에 특화된 AI 엔드포인트
 * - 실시간 메트릭 처리
 * - 성능 분석 및 최적화 제안
 * - 이상 탐지
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedAIEngine, UnifiedAnalysisRequest } from '@/core/ai/UnifiedAIEngine';

interface MetricsRequest {
  metrics: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    networkIn?: number;
    networkOut?: number;
    responseTime?: number;
    activeConnections?: number;
  }>;
  timeRange?: {
    start: string;
    end: string;
  };
  analysisType?: 'performance' | 'anomaly' | 'trend' | 'prediction' | 'comprehensive';
  sessionId?: string;
}

// 🧠 메트릭 캐시 (짧은 TTL)
const metricsCache = new Map<string, { result: any; timestamp: number }>();
const METRICS_CACHE_TTL = 60 * 1000; // 1분

/**
 * 🎯 메트릭 분석 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: MetricsRequest = await request.json();
    
    // 메트릭 데이터 검증
    if (!body.metrics || !Array.isArray(body.metrics) || body.metrics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Valid metrics array is required',
        code: 'INVALID_METRICS'
      }, { status: 400 });
    }

    // 캐시 키 생성
    const cacheKey = generateMetricsCacheKey(body);
    const cached = getCachedMetrics(cacheKey);
    
    if (cached) {
      console.log('🚀 메트릭 캐시 히트:', cacheKey);
      return NextResponse.json({
        ...cached,
        meta: {
          ...cached.meta,
          cached: true,
          totalTime: Date.now() - startTime
        }
      });
    }

    // 분석 타입에 따른 쿼리 생성
    const query = generateAnalysisQuery(body.analysisType || 'comprehensive', body.metrics);

    // UnifiedAnalysisRequest 구성
    const analysisRequest: UnifiedAnalysisRequest = {
      query,
      context: {
        serverMetrics: body.metrics.map(metric => ({
          timestamp: metric.timestamp,
          cpu: metric.cpu,
          memory: metric.memory,
          disk: metric.disk,
          networkIn: metric.networkIn || 0,
          networkOut: metric.networkOut || 0,
          responseTime: metric.responseTime || 0,
          activeConnections: metric.activeConnections || 0
        })),
        timeRange: body.timeRange ? {
          start: new Date(body.timeRange.start),
          end: new Date(body.timeRange.end)
        } : {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        },
        sessionId: body.sessionId,
        urgency: determineUrgency(body.metrics)
      },
      options: {
        enablePython: true,
        enableJavaScript: true,
        maxResponseTime: 20000, // 메트릭 분석은 더 빠르게
        confidenceThreshold: 0.5
      }
    };

    console.log('🔥 V1 메트릭 분석:', {
      analysisType: body.analysisType,
      metricsCount: body.metrics.length,
      timeSpan: body.timeRange ? 'custom' : 'default',
      urgency: analysisRequest.context?.urgency
    });

    // UnifiedAIEngine으로 분석 수행
    const result = await unifiedAIEngine.processQuery(analysisRequest);

    // 메트릭 특화 응답 구성
    const response = {
      success: result.success,
      
      // 🧠 메트릭 분석 결과
      data: {
        analysis: {
          ...result.analysis,
          metricsInsights: extractMetricsInsights(body.metrics),
          performanceScore: calculatePerformanceScore(body.metrics),
          trends: analyzeTrends(body.metrics)
        },
        recommendations: enhanceRecommendations(result.recommendations, body.metrics),
        alerts: generateAlerts(body.metrics)
      },
      
      // 🔧 메타데이터
      meta: {
        sessionId: result.metadata.sessionId,
        processingTime: Date.now() - startTime,
        engines: result.engines,
        apiVersion: 'v1.0.0',
        analysisType: body.analysisType || 'comprehensive',
        metricsCount: body.metrics.length,
        timestamp: new Date().toISOString(),
        cached: false
      }
    };

    // 결과 캐싱
    if (result.success) {
      setCachedMetrics(cacheKey, response);
    }

    console.log('✅ V1 메트릭 응답:', {
      success: result.success,
      performanceScore: response.data.analysis.performanceScore,
      alertsCount: response.data.alerts.length,
      totalTime: Date.now() - startTime
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ V1 메트릭 API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '메트릭 분석 중 오류가 발생했습니다',
      code: 'METRICS_ANALYSIS_ERROR',
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
 * 🔍 메트릭 시스템 상태
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
            size: metricsCache.size,
            ttl: METRICS_CACHE_TTL / 1000 + 's'
          },
          capabilities: [
            'real-time metrics analysis',
            'performance scoring',
            'trend analysis',
            'anomaly detection',
            'predictive insights'
          ],
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          name: 'Metrics Analysis API v1',
          version: 'v1.0.0',
          description: '서버 메트릭 전용 AI 분석',
          analysisTypes: [
            'performance - 성능 분석',
            'anomaly - 이상 탐지', 
            'trend - 트렌드 분석',
            'prediction - 예측 분석',
            'comprehensive - 종합 분석'
          ],
          endpoints: {
            'POST /api/v1/ai/metrics': '메트릭 분석',
            'GET /api/v1/ai/metrics?action=health': '시스템 상태'
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

// 🔧 메트릭 유틸리티 함수들
function generateMetricsCacheKey(body: MetricsRequest): string {
  const keyData = {
    type: body.analysisType || 'comprehensive',
    count: body.metrics.length,
    latest: body.metrics[body.metrics.length - 1]?.timestamp || '',
    checksum: body.metrics.slice(-3).map(m => `${m.cpu}-${m.memory}-${m.disk}`).join('|')
  };
  return `metrics_${Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 20)}`;
}

function getCachedMetrics(key: string): any {
  const cached = metricsCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > METRICS_CACHE_TTL) {
    metricsCache.delete(key);
    return null;
  }
  
  return cached.result;
}

function setCachedMetrics(key: string, result: any): void {
  // 캐시 크기 제한 (500개)
  if (metricsCache.size >= 500) {
    const firstKey = metricsCache.keys().next().value;
    if (firstKey) {
      metricsCache.delete(firstKey);
    }
  }
  
  metricsCache.set(key, {
    result,
    timestamp: Date.now()
  });
}

function generateAnalysisQuery(type: string, metrics: any[]): string {
  const latest = metrics[metrics.length - 1];
  
  switch (type) {
    case 'performance':
      return `현재 서버 성능 상태를 분석해주세요. CPU: ${latest.cpu}%, 메모리: ${latest.memory}%, 디스크: ${latest.disk}%`;
    case 'anomaly':
      return `서버 메트릭에서 이상 징후를 탐지하고 분석해주세요. ${metrics.length}개의 데이터 포인트를 검토합니다.`;
    case 'trend':
      return `서버 성능 트렌드를 분석하고 향후 예상 변화를 예측해주세요.`;
    case 'prediction':
      return `현재 메트릭 기반으로 향후 서버 성능을 예측하고 용량 계획을 수립해주세요.`;
    default:
      return `서버 메트릭을 종합적으로 분석하여 성능 상태, 이상 징후, 트렌드, 예측을 제공해주세요.`;
  }
}

function determineUrgency(metrics: any[]): 'low' | 'medium' | 'high' | 'critical' {
  const latest = metrics[metrics.length - 1];
  
  if (latest.cpu > 90 || latest.memory > 95 || latest.disk > 95) return 'critical';
  if (latest.cpu > 80 || latest.memory > 85 || latest.disk > 90) return 'high';
  if (latest.cpu > 70 || latest.memory > 75 || latest.disk > 80) return 'medium';
  return 'low';
}

function extractMetricsInsights(metrics: any[]): any {
  const latest = metrics[metrics.length - 1];
  const previous = metrics[metrics.length - 2] || latest;
  
  return {
    current: latest,
    changes: {
      cpu: latest.cpu - previous.cpu,
      memory: latest.memory - previous.memory,
      disk: latest.disk - previous.disk
    },
    peaks: {
      cpu: Math.max(...metrics.map(m => m.cpu)),
      memory: Math.max(...metrics.map(m => m.memory)),
      disk: Math.max(...metrics.map(m => m.disk))
    },
    averages: {
      cpu: metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length,
      memory: metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length,
      disk: metrics.reduce((sum, m) => sum + m.disk, 0) / metrics.length
    }
  };
}

function calculatePerformanceScore(metrics: any[]): number {
  const latest = metrics[metrics.length - 1];
  
  // 100점 만점 성능 점수 계산
  const cpuScore = Math.max(0, 100 - latest.cpu);
  const memoryScore = Math.max(0, 100 - latest.memory);
  const diskScore = Math.max(0, 100 - latest.disk);
  
  return Math.round((cpuScore + memoryScore + diskScore) / 3);
}

function analyzeTrends(metrics: any[]): any {
  if (metrics.length < 3) {
    return { status: 'insufficient_data' };
  }
  
  const recent = metrics.slice(-5);
  const cpuTrend = calculateTrend(recent.map(m => m.cpu));
  const memoryTrend = calculateTrend(recent.map(m => m.memory));
  const diskTrend = calculateTrend(recent.map(m => m.disk));
  
  return {
    cpu: { direction: getTrendDirection(cpuTrend), value: cpuTrend },
    memory: { direction: getTrendDirection(memoryTrend), value: memoryTrend },
    disk: { direction: getTrendDirection(diskTrend), value: diskTrend }
  };
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return ((last - first) / first) * 100;
}

function getTrendDirection(trend: number): string {
  if (Math.abs(trend) < 2) return 'stable';
  return trend > 0 ? 'increasing' : 'decreasing';
}

function enhanceRecommendations(baseRecommendations: string[], metrics: any[]): string[] {
  const enhanced = [...baseRecommendations];
  const latest = metrics[metrics.length - 1];
  
  // 메트릭 기반 추가 권장사항
  if (latest.cpu > 85) {
    enhanced.push('CPU 부하가 높습니다. 프로세스 최적화를 고려하세요.');
  }
  if (latest.memory > 90) {
    enhanced.push('메모리 사용률이 위험 수준입니다. 즉시 메모리 정리가 필요합니다.');
  }
  if (latest.disk > 95) {
    enhanced.push('디스크 공간이 거의 없습니다. 긴급한 정리 작업이 필요합니다.');
  }
  
  return enhanced;
}

function generateAlerts(metrics: any[]): Array<{ level: string; message: string; metric: string }> {
  const alerts = [];
  const latest = metrics[metrics.length - 1];
  
  if (latest.cpu > 90) {
    alerts.push({
      level: 'critical',
      message: `CPU 사용률이 ${latest.cpu}%로 위험 수준입니다`,
      metric: 'cpu'
    });
  }
  
  if (latest.memory > 95) {
    alerts.push({
      level: 'critical',
      message: `메모리 사용률이 ${latest.memory}%로 위험 수준입니다`,
      metric: 'memory'
    });
  }
  
  if (latest.disk > 95) {
    alerts.push({
      level: 'critical',
      message: `디스크 사용률이 ${latest.disk}%로 위험 수준입니다`,
      metric: 'disk'
    });
  }
  
  return alerts;
} 