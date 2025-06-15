import { NextRequest, NextResponse } from 'next/server';
import { autoReportService } from '../../../../services/monitoring/AutoReportService';

export async function GET() {
  try {
    const activeIncidents = autoReportService.getActiveIncidents();
    const stats = autoReportService.getIncidentStats();

    return NextResponse.json({
      success: true,
      data: {
        activeIncidents,
        stats,
        service: {
          name: 'AutoReportService',
          version: '1.0.0',
          status: 'active',
          lastCheck: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('자동 장애 보고서 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({
        success: false,
        error: '서버 메트릭 데이터가 필요합니다'
      }, { status: 400 });
    }

    const incidents = await autoReportService.analyzeMetrics(metrics);

    return NextResponse.json({
      success: true,
      data: {
        newIncidents: incidents,
        incidentsCount: incidents.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('자동 장애 분석 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 