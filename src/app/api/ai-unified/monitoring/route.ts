/**
 * 📊 AI 모니터링 & 분석 통합 API
 * 
 * 기존 6개 모니터링 API를 하나로 통합
 * - /ai/monitoring (AI 시스템 모니터링)
 * - /ai/performance (AI 성능 모니터링)
 * - /ai/cache-stats (캐시 통계)
 * - /ai/intelligent-monitoring (지능형 모니터링)
 * - /ai/incident-report (장애 보고서)
 * - /ai/raw-metrics (원시 메트릭)
 * 
 * GET /api/ai-unified/monitoring?type=system|performance|cache|intelligent|incident|raw
 * POST /api/ai-unified/monitoring (분석 실행)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiRoute } from '@/lib/api/zod-middleware';
import { withAuth } from '@/lib/api-auth';
import { supabase } from '@/lib/supabase/supabase-client';
import debug from '@/utils/debug';

// 모니터링 타입 정의
const monitoringTypes = [
  'system',      // AI 시스템 모니터링
  'performance', // AI 성능 모니터링
  'cache',       // 캐시 통계
  'intelligent', // 지능형 모니터링
  'incident',    // 장애 보고서
  'raw'          // 원시 메트릭
] as const;

// 요청 스키마
const monitoringRequestSchema = z.object({
  type: z.enum(monitoringTypes),
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('1h'),
  serverId: z.string().optional(),
  metrics: z.array(z.string()).optional(),
  analysisDepth: z.enum(['quick', 'standard', 'deep']).default('standard')
});

type MonitoringRequest = z.infer<typeof monitoringRequestSchema>;

// 모니터링 데이터 수집 클래스
class AIMonitoringCollector {
  // AI 시스템 모니터링
  static async getSystemMetrics(timeRange: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/monitoring`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      debug.error('System Metrics Error:', error);
      return { error: 'Failed to fetch system metrics' };
    }
  }

  // AI 성능 모니터링
  static async getPerformanceMetrics(timeRange: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/performance`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      debug.error('Performance Metrics Error:', error);
      return { error: 'Failed to fetch performance metrics' };
    }
  }

  // 캐시 통계
  static async getCacheStats(timeRange: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/cache-stats`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      debug.error('Cache Stats Error:', error);
      return { error: 'Failed to fetch cache stats' };
    }
  }

  // 지능형 모니터링
  static async getIntelligentMonitoring(request: MonitoringRequest): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/intelligent-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: request.serverId,
          analysisDepth: request.analysisDepth,
          includeSteps: {
            anomalyDetection: true,
            rootCauseAnalysis: true,
            predictiveMonitoring: true
          }
        })
      });
      return await response.json();
    } catch (error) {
      debug.error('Intelligent Monitoring Error:', error);
      return { error: 'Failed to execute intelligent monitoring' };
    }
  }

  // 장애 보고서
  static async getIncidentReport(serverId?: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/incident-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId })
      });
      return await response.json();
    } catch (error) {
      debug.error('Incident Report Error:', error);
      return { error: 'Failed to generate incident report' };
    }
  }

  // 원시 메트릭
  static async getRawMetrics(timeRange: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/raw-metrics`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      debug.error('Raw Metrics Error:', error);
      return { error: 'Failed to fetch raw metrics' };
    }
  }

  // 통합 대시보드 데이터
  static async getUnifiedDashboard(timeRange: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      // 병렬로 모든 메트릭 수집
      const [system, performance, cache, raw] = await Promise.allSettled([
        this.getSystemMetrics(timeRange),
        this.getPerformanceMetrics(timeRange),
        this.getCacheStats(timeRange),
        this.getRawMetrics(timeRange)
      ]);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime,
        timestamp: new Date().toISOString(),
        timeRange,
        data: {
          system: system.status === 'fulfilled' ? system.value : { error: 'Failed' },
          performance: performance.status === 'fulfilled' ? performance.value : { error: 'Failed' },
          cache: cache.status === 'fulfilled' ? cache.value : { error: 'Failed' },
          raw: raw.status === 'fulfilled' ? raw.value : { error: 'Failed' }
        },
        summary: {
          totalQueries: 0, // 실제 계산 로직 추가
          averageResponseTime: responseTime,
          cacheHitRate: 0, // 실제 계산 로직 추가
          errorRate: 0     // 실제 계산 로직 추가
        }
      };
    } catch (error) {
      debug.error('Unified Dashboard Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// GET 핸들러 - 모니터링 데이터 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'system';
  const timeRange = searchParams.get('timeRange') || '1h';
  const serverId = searchParams.get('serverId') || undefined;

  debug.log('AI Monitoring GET Request:', { type, timeRange, serverId });

  try {
    let result;

    switch (type) {
      case 'system':
        result = await AIMonitoringCollector.getSystemMetrics(timeRange);
        break;
      case 'performance':
        result = await AIMonitoringCollector.getPerformanceMetrics(timeRange);
        break;
      case 'cache':
        result = await AIMonitoringCollector.getCacheStats(timeRange);
        break;
      case 'raw':
        result = await AIMonitoringCollector.getRawMetrics(timeRange);
        break;
      case 'dashboard':
        result = await AIMonitoringCollector.getUnifiedDashboard(timeRange);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported monitoring type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      timeRange,
      timestamp: new Date().toISOString(),
      data: result
    });

  } catch (error) {
    debug.error('AI Monitoring Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// POST 핸들러 - 분석 실행
export const POST = createApiRoute(
  monitoringRequestSchema,
  withAuth(async (validatedData: MonitoringRequest, request: NextRequest) => {
    debug.log('AI Monitoring POST Request:', validatedData);

    const startTime = Date.now();
    let result;

    try {
      switch (validatedData.type) {
        case 'intelligent':
          result = await AIMonitoringCollector.getIntelligentMonitoring(validatedData);
          break;
        case 'incident':
          result = await AIMonitoringCollector.getIncidentReport(validatedData.serverId);
          break;
        default:
          // GET 방식으로 처리
          switch (validatedData.type) {
            case 'system':
              result = await AIMonitoringCollector.getSystemMetrics(validatedData.timeRange);
              break;
            case 'performance':
              result = await AIMonitoringCollector.getPerformanceMetrics(validatedData.timeRange);
              break;
            case 'cache':
              result = await AIMonitoringCollector.getCacheStats(validatedData.timeRange);
              break;
            case 'raw':
              result = await AIMonitoringCollector.getRawMetrics(validatedData.timeRange);
              break;
          }
      }

      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        type: validatedData.type,
        responseTime,
        timestamp: new Date().toISOString(),
        request: validatedData,
        result
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      debug.error('AI Monitoring Analysis Error:', error);
      
      return NextResponse.json({
        success: false,
        type: validatedData.type,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  })
);