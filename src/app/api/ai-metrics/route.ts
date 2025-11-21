/**
 * 🤖 AI Metrics API Endpoint
 * 
 * @description
 * Provides real-time AI engine metrics data for monitoring and analytics.
 * Supports system-wide metrics, engine-specific metrics, and provider-specific metrics.
 * 
 * @endpoints
 * - GET /api/ai-metrics - Get system-wide AI metrics
 * - GET /api/ai-metrics?engine=google-ai - Get metrics for specific engine
 * - GET /api/ai-metrics?engine=google-ai&provider=rag - Get metrics for specific provider
 * - GET /api/ai-metrics?timeseries=1m - Get time series data (1m, 5m, 15m, 1h, 24h)
 * 
 * @version 1.0.0
 * @date 2025-11-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIMetricsCollector } from '@/lib/ai/metrics/AIMetricsCollector';
import type { AggregationPeriod } from '@/lib/ai/metrics/AIMetricsCollector';
import type { AIEngineType } from '@/types/core-types';

/**
 * 📊 GET /api/ai-metrics
 * 
 * Query Parameters:
 * - engine: AIEngineType ('google-ai' | 'performance-optimized' | 'simplified')
 * - provider: string ('rag' | 'ml' | 'nlp' | 'rule')
 * - timeseries: AggregationPeriod ('1m' | '5m' | '15m' | '1h' | '24h')
 * - metric: string (specific metric name for time series)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const collector = AIMetricsCollector.getInstance();
    const searchParams = request.nextUrl.searchParams;
    
    // Query parameters
    const engineType = searchParams.get('engine') as AIEngineType | null;
    const provider = searchParams.get('provider');
    const timeseriesPeriod = searchParams.get('timeseries') as AggregationPeriod | null;
    const metricName = searchParams.get('metric');
    
    // 1️⃣ Time Series Request
    if (timeseriesPeriod && metricName) {
      const timeSeries = collector.getTimeSeries(metricName, timeseriesPeriod);
      
      if (!timeSeries) {
        return NextResponse.json(
          {
            success: false,
            error: 'Time series data not found',
            details: {
              metric: metricName,
              period: timeseriesPeriod,
            },
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        type: 'timeseries',
        metric: metricName,
        period: timeseriesPeriod,
        data: timeSeries,
        timestamp: Date.now(),
      });
    }
    
    // 2️⃣ Provider-Specific Metrics Request
    if (engineType && provider) {
      const providerMetrics = collector.getProviderMetrics(engineType, provider);
      
      if (!providerMetrics) {
        return NextResponse.json(
          {
            success: false,
            error: 'Provider metrics not found',
            details: {
              engine: engineType,
              provider,
            },
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        type: 'provider',
        engine: engineType,
        provider,
        metrics: providerMetrics,
        timestamp: Date.now(),
      });
    }
    
    // 3️⃣ Engine-Specific Metrics Request
    if (engineType) {
      const engineMetrics = collector.getEngineMetrics(engineType);
      
      if (!engineMetrics) {
        return NextResponse.json(
          {
            success: false,
            error: 'Engine metrics not found',
            details: {
              engine: engineType,
              availableEngines: ['google-ai', 'performance-optimized', 'simplified'],
            },
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        type: 'engine',
        engine: engineType,
        metrics: engineMetrics,
        timestamp: Date.now(),
      });
    }
    
    // 4️⃣ System-Wide Metrics Request (Default)
    const systemMetrics = collector.getMetrics();
    
    return NextResponse.json({
      success: true,
      type: 'system',
      metrics: systemMetrics,
      timestamp: Date.now(),
    });
    
  } catch (error) {
    console.error('AI Metrics API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 OPTIONS /api/ai-metrics
 * 
 * CORS preflight handler
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
