import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚀 실시간 메트릭 API
 * 
 * 실제 API 호출 통계와 엔진 메트릭을 제공
 * (간소화된 버전 - RealTimeMetricsCollector 제거)
 */

// 간단한 메트릭 수집 로직
const metricsData = {
    engines: {
        'google-ai': {
            calls: 0,
            successRate: 100,
            avgResponseTime: 0,
            lastUsed: new Date().toISOString()
        },
        'supabase-rag': {
            calls: 0,
            successRate: 100,
            avgResponseTime: 0,
            lastUsed: new Date().toISOString()
        },
        'local': {
            calls: 0,
            successRate: 100,
            avgResponseTime: 0,
            lastUsed: new Date().toISOString()
        }
    },
    system: {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        activeEngines: 3,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        uptime: process.uptime()
    },
    logs: [] as Array<{
        timestamp: string;
        level: string;
        message: string;
        context?: any;
    }>
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';

        let data;

        switch (type) {
            case 'engines':
                data = {
                    engines: metricsData.engines
                };
                break;

            case 'system':
                data = {
                    system: {
                        ...metricsData.system,
                        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                        uptime: process.uptime()
                    }
                };
                break;

            case 'logs':
                const limit = parseInt(searchParams.get('limit') || '50');
                data = {
                    logs: metricsData.logs.slice(-limit)
                };
                break;

            case 'all':
            default:
                data = {
                    engines: metricsData.engines,
                    system: {
                        ...metricsData.system,
                        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                        uptime: process.uptime()
                    },
                    recentLogs: metricsData.logs.slice(-20)
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
                // 로그 정리
                metricsData.logs = metricsData.logs.slice(-100);
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