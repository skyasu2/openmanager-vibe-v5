/**
 * 📊 Prometheus Metrics API Endpoint
 * 
 * ✅ AI 엔진 성능 메트릭 제공
 * ✅ 시스템 리소스 모니터링
 * ✅ Prometheus 표준 형식 지원
 * ✅ 실시간 메트릭 수집
 */

import { NextRequest, NextResponse } from 'next/server';
import { prometheusMetrics } from '@/services/monitoring/prometheus-metrics';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Prometheus 메트릭 요청');
    
    // Prometheus 메트릭 수집
    const metrics = await prometheusMetrics.getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('❌ Prometheus 메트릭 수집 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Prometheus 메트릭 수집 실패',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 커스텀 메트릭 기록 API
    const body = await request.json();
    const { type, metrics } = body;

    switch (type) {
      case 'query':
        prometheusMetrics.recordQueryMetrics(metrics);
        break;
      case 'engine_init':
        prometheusMetrics.recordEngineInitialization(metrics.engineName, metrics.initialized);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 메트릭 타입',
          supportedTypes: ['query', 'engine_init']
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '메트릭이 성공적으로 기록되었습니다.',
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ 메트릭 기록 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '메트릭 기록 실패',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 