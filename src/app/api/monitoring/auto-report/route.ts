import { NextRequest, NextResponse } from 'next/server';
import { autoReportService } from '../../../../services/ai/AutoReportService';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        service: {
          name: 'AutoReportService',
          version: '1.0.0',
          status: 'active',
          lastCheck: new Date().toISOString(),
          description: 'AI 기반 자동 장애 보고서 생성 서비스',
        },
      },
    });
  } catch (error) {
    console.error('자동 장애 보고서 서비스 상태 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body;

    if (!context) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI 분석을 위한 컨텍스트 데이터가 필요합니다',
        },
        { status: 400 }
      );
    }

    const report = await autoReportService.generateReport(context);

    return NextResponse.json({
      success: true,
      data: {
        report,
        timestamp: new Date().toISOString(),
        generatedBy: 'AI AutoReportService',
      },
    });
  } catch (error) {
    console.error('자동 장애 보고서 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
