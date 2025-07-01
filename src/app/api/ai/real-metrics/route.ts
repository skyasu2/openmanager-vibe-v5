import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '../../../../services/ai/RealTimeMetricsCollector';

/**
 * 🚀 실시간 메트릭 API
 * 
 * 실제 API 호출 통계와 엔진 메트릭을 제공
 */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';

        let data;

        switch (type) {
            case 'engines':
                data = {
                    engines: metricsCollector.getEngineMetrics()
                };
                break;

            case 'system':
                data = {
                    system: metricsCollector.getSystemMetrics()
                };
                break;

            case 'logs':
                const limit = parseInt(searchParams.get('limit') || '50');
                data = {
                    logs: metricsCollector.getRecentLogs(limit)
                };
                break;

            case 'all':
            default:
                data = {
                    engines: metricsCollector.getEngineMetrics(),
                    system: metricsCollector.getSystemMetrics(),
                    recentLogs: metricsCollector.getRecentLogs(20)
                };
                break;
        }

        return NextResponse.json({
            success: true,
            type,
            data,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('실시간 메트릭 API 오류:', error);

        return NextResponse.json({
            success: false,
            error: '메트릭 조회 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();

        switch (action) {
            case 'cleanup':
                metricsCollector.cleanup();
                return NextResponse.json({
                    success: true,
                    message: '메트릭 데이터가 정리되었습니다.',
                    timestamp: new Date().toISOString()
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: '지원하지 않는 액션입니다.',
                    availableActions: ['cleanup']
                }, { status: 400 });
        }

    } catch (error) {
        console.error('실시간 메트릭 POST API 오류:', error);

        return NextResponse.json({
            success: false,
            error: '메트릭 처리 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, { status: 500 });
    }
} 