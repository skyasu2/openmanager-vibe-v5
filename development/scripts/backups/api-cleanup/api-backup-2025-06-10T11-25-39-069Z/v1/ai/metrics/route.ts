/**
 * 🚀 API v1 - 메트릭 분석 전용 엔드포인트
 *
 * 서버 메트릭 분석에 특화된 AI 엔드포인트
 * - 실시간 메트릭 처리
 * - 성능 분석 및 최적화 제안
 * - 이상 탐지
 */

import { NextRequest, NextResponse } from 'next/server';
import { realAIProcessor } from '@/services/ai/RealAIProcessor';
import { realPrometheusCollector } from '@/services/collectors/RealPrometheusCollector';
import { getRedisClient } from '@/lib/redis';

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
  analysisType?:
    | 'performance'
    | 'anomaly'
    | 'trend'
    | 'prediction'
    | 'comprehensive';
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
  console.log('📊 AI 메트릭 분석 요청 수신');

  try {
    const body: MetricsRequest = await request.json();

    // 메트릭 데이터 검증
    if (
      !body.metrics ||
      !Array.isArray(body.metrics) ||
      body.metrics.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid metrics array is required',
          code: 'INVALID_METRICS',
        },
        { status: 400 }
      );
    }

    // 캐시 확인
    const cacheKey = generateMetricsCacheKey(body);
    const cached = getCachedMetrics(cacheKey);
    if (cached) {
      console.log('💨 캐시된 메트릭 분석 결과 반환');
      return NextResponse.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          totalTime: Date.now() - startTime,
        },
      });
    }

    // 실제 시스템 메트릭 수집
    await realPrometheusCollector.initialize();
    const currentMetrics = await realPrometheusCollector.collectMetrics();

    // AI 분석 수행
    const aiAnalysis = await realAIProcessor.processQuery({
      query: generateAnalysisQuery(
        body.analysisType || 'comprehensive',
        body.metrics
      ),
      context: {
        serverMetrics: body.metrics,
        systemState: currentMetrics,
      },
      options: {
        model: 'gpt-3.5-turbo',
        useCache: true,
        usePython: false,
      },
    });

    // 메트릭 인사이트 생성
    const insights = extractMetricsInsights(body.metrics);
    const performanceScore = calculatePerformanceScore(body.metrics);
    const trends = analyzeTrends(body.metrics);

    // 결과 구성
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      query: generateAnalysisQuery(
        body.analysisType || 'comprehensive',
        body.metrics
      ),
      analysis: {
        intent: aiAnalysis.intent,
        confidence: aiAnalysis.confidence,
        summary: aiAnalysis.summary,
        details: aiAnalysis.details,
        urgency: aiAnalysis.urgency,
      },
      insights,
      performance: {
        score: performanceScore,
        grade:
          performanceScore >= 80
            ? 'excellent'
            : performanceScore >= 60
              ? 'good'
              : 'poor',
        trends,
        currentMetrics: {
          cpu: currentMetrics.cpu.usage,
          memory: currentMetrics.memory.usage,
          disk: currentMetrics.disk.usage,
          uptime: currentMetrics.server.uptime,
        },
      },
      recommendations: aiAnalysis.actions,
      alerts: generateAlerts(body.metrics),
      metadata: {
        sessionId: body.sessionId || `metrics_${Date.now()}`,
        processingTime: Date.now() - startTime,
        metricsAnalyzed: body.metrics.length,
        realTimeData: true,
        aiModel: aiAnalysis.model,
        version: '2.1.0',
      },
    };

    // 결과 캐시
    setCachedMetrics(cacheKey, result);

    console.log(`✅ AI 메트릭 분석 완료 (${Date.now() - startTime}ms)`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ AI 메트릭 분석 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '메트릭 분석 실패',
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime: Date.now() - startTime,
          fallback: true,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 메트릭 분석 상태 조회
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const analysisType = searchParams.get('type') || 'status';

    let response: any = {};

    switch (analysisType) {
      case 'health':
        response = await realAIProcessor.healthCheck();
        break;

      case 'collector':
        response = await realPrometheusCollector.healthCheck();
        break;

      case 'summary':
        response = await realPrometheusCollector.getMetricsSummary();
        break;

      default:
        response = {
          status: 'running',
          version: '2.1.0',
          features: [
            'Real-time metrics collection',
            'AI-powered analysis',
            'Performance insights',
            'Anomaly detection',
            'Trend prediction',
          ],
          capabilities: {
            aiModels: [
              'gpt-3.5-turbo',
              'claude-3-haiku',
              'gemini-1.5-flash',
              'local-analyzer',
            ],
            collectors: ['system-metrics', 'prometheus', 'docker'],
            analytics: ['performance', 'trends', 'anomalies', 'predictions'],
          },
        };
    }

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        sessionId,
      },
    });
  } catch (error) {
    console.error('❌ 메트릭 분석 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상태 조회 실패',
        metadata: {
          processingTime: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 유틸리티 함수들
 */
function generateMetricsCacheKey(body: MetricsRequest): string {
  const keyData = {
    type: body.analysisType,
    count: body.metrics.length,
    latest: body.metrics[body.metrics.length - 1]?.timestamp,
  };
  return `metrics:${Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 32)}`;
}

function getCachedMetrics(key: string): any {
  const cached = metricsCache.get(key);
  if (cached && Date.now() - cached.timestamp < METRICS_CACHE_TTL) {
    return cached.result;
  }

  if (cached) {
    metricsCache.delete(key);
  }

  return null;
}

function setCachedMetrics(key: string, result: any): void {
  metricsCache.set(key, {
    result,
    timestamp: Date.now(),
  });

  // 캐시 크기 제한 (최대 50개)
  if (metricsCache.size > 50) {
    const firstKey = metricsCache.keys().next().value;
    if (firstKey) {
      metricsCache.delete(firstKey);
    }
  }
}

function generateAnalysisQuery(type: string, metrics: any[]): string {
  const latest = metrics[metrics.length - 1];

  switch (type) {
    case 'performance':
      return `현재 서버 성능을 분석해주세요. CPU ${latest?.cpu}%, 메모리 ${latest?.memory}%, 디스크 ${latest?.disk}%`;
    case 'anomaly':
      return '시스템 메트릭에서 이상 징후가 있는지 분석해주세요';
    case 'trend':
      return '메트릭 트렌드를 분석하고 향후 예측을 제공해주세요';
    case 'prediction':
      return '시스템 리소스 사용량 예측과 용량 계획을 도와주세요';
    default:
      return `종합적인 시스템 메트릭 분석을 수행해주세요. ${metrics.length}개의 데이터 포인트가 있습니다`;
  }
}

function determineUrgency(
  metrics: any[]
): 'low' | 'medium' | 'high' | 'critical' {
  const latest = metrics[metrics.length - 1];
  if (!latest) return 'low';

  const maxUsage = Math.max(
    latest.cpu || 0,
    latest.memory || 0,
    latest.disk || 0
  );

  if (maxUsage >= 95) return 'critical';
  if (maxUsage >= 85) return 'high';
  if (maxUsage >= 70) return 'medium';
  return 'low';
}

function extractMetricsInsights(metrics: any[]): any {
  if (metrics.length === 0) return { message: '분석할 메트릭이 없습니다' };

  const latest = metrics[metrics.length - 1];
  const avg = {
    cpu: metrics.reduce((sum, m) => sum + (m.cpu || 0), 0) / metrics.length,
    memory:
      metrics.reduce((sum, m) => sum + (m.memory || 0), 0) / metrics.length,
    disk: metrics.reduce((sum, m) => sum + (m.disk || 0), 0) / metrics.length,
  };

  return {
    current: {
      cpu: latest?.cpu || 0,
      memory: latest?.memory || 0,
      disk: latest?.disk || 0,
      timestamp: latest?.timestamp,
    },
    averages: {
      cpu: Math.round(avg.cpu * 100) / 100,
      memory: Math.round(avg.memory * 100) / 100,
      disk: Math.round(avg.disk * 100) / 100,
    },
    dataPoints: metrics.length,
    timeSpan: `${Math.round((new Date(latest?.timestamp || Date.now()).getTime() - new Date(metrics[0]?.timestamp || Date.now()).getTime()) / 1000 / 60)} 분`,
  };
}

function calculatePerformanceScore(metrics: any[]): number {
  if (metrics.length === 0) return 0;

  const latest = metrics[metrics.length - 1];
  const cpuScore = Math.max(0, (100 - (latest?.cpu || 0)) / 100);
  const memoryScore = Math.max(0, (100 - (latest?.memory || 0)) / 100);
  const diskScore = Math.max(0, (100 - (latest?.disk || 0)) / 100);

  return Math.round(((cpuScore + memoryScore + diskScore) / 3) * 100);
}

function analyzeTrends(metrics: any[]): any {
  if (metrics.length < 2) {
    return { cpu: 'stable', memory: 'stable', disk: 'stable' };
  }

  const cpuTrend = calculateTrend(metrics.slice(-5).map(m => m.cpu || 0));
  const memoryTrend = calculateTrend(metrics.slice(-5).map(m => m.memory || 0));
  const diskTrend = calculateTrend(metrics.slice(-5).map(m => m.disk || 0));

  return {
    cpu: getTrendDirection(cpuTrend),
    memory: getTrendDirection(memoryTrend),
    disk: getTrendDirection(diskTrend),
    values: { cpu: cpuTrend, memory: memoryTrend, disk: diskTrend },
  };
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  return (values[values.length - 1] - values[0]) / values.length;
}

function getTrendDirection(trend: number): string {
  if (trend > 2) return 'increasing';
  if (trend < -2) return 'decreasing';
  return 'stable';
}

function generateAlerts(
  metrics: any[]
): Array<{ level: string; message: string; metric: string }> {
  const alerts: Array<{ level: string; message: string; metric: string }> = [];
  const latest = metrics[metrics.length - 1];

  if (!latest) return alerts;

  if (latest.cpu >= 90) {
    alerts.push({
      level: 'critical',
      message: `CPU 사용률이 위험 수준입니다 (${latest.cpu}%)`,
      metric: 'cpu',
    });
  } else if (latest.cpu >= 80) {
    alerts.push({
      level: 'warning',
      message: `CPU 사용률이 높습니다 (${latest.cpu}%)`,
      metric: 'cpu',
    });
  }

  if (latest.memory >= 90) {
    alerts.push({
      level: 'critical',
      message: `메모리 사용률이 위험 수준입니다 (${latest.memory}%)`,
      metric: 'memory',
    });
  } else if (latest.memory >= 80) {
    alerts.push({
      level: 'warning',
      message: `메모리 사용률이 높습니다 (${latest.memory}%)`,
      metric: 'memory',
    });
  }

  if (latest.disk >= 95) {
    alerts.push({
      level: 'critical',
      message: `디스크 사용률이 위험 수준입니다 (${latest.disk}%)`,
      metric: 'disk',
    });
  } else if (latest.disk >= 85) {
    alerts.push({
      level: 'warning',
      message: `디스크 사용률이 높습니다 (${latest.disk}%)`,
      metric: 'disk',
    });
  }

  return alerts;
}
