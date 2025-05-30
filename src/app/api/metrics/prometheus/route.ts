import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';

/**
 * 📊 Prometheus 메트릭 엔드포인트
 * GET /api/metrics/prometheus
 * Prometheus 형식의 메트릭 데이터를 반환합니다
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'text';
    const serverId = searchParams.get('server');
    
    // 시뮬레이션 엔진이 실행 중인지 확인
    if (!simulationEngine.isRunning()) {
      return NextResponse.json({
        success: false,
        message: '시뮬레이션 엔진이 실행 중이 아닙니다.',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    if (format === 'text') {
      // Prometheus 텍스트 형식 반환
      const prometheusText = simulationEngine.getPrometheusText(serverId || undefined);
      
      return new Response(prometheusText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      // JSON 형식으로 메트릭 반환
      const metrics = simulationEngine.getPrometheusMetrics(serverId || undefined);
      const summary = simulationEngine.getSimulationSummary();
      
      return NextResponse.json({
        success: true,
        data: {
          metrics,
          summary: {
            totalServers: summary.totalServers,
            totalMetrics: metrics.length,
            prometheusEnabled: summary.prometheusEnabled,
            timestamp: new Date().toISOString()
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Prometheus 메트릭 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Prometheus 메트릭 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📈 집계된 메트릭 조회
 * POST /api/metrics/prometheus
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation = 'avg', filters = {} } = body;
    
    if (!simulationEngine.isRunning()) {
      return NextResponse.json({
        success: false,
        message: '시뮬레이션 엔진이 실행 중이 아닙니다.',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // 필터된 메트릭 조회
    const filteredMetrics = simulationEngine.getFilteredPrometheusMetrics(filters);
    
    // 집계 연산 수행
    const aggregatedMetrics = simulationEngine.getAggregatedMetrics(operation);
    
    return NextResponse.json({
      success: true,
      data: {
        operation,
        filters,
        filteredCount: filteredMetrics.length,
        aggregatedMetrics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Prometheus 메트릭 집계 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Prometheus 메트릭 집계에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 