import { detectEnvironment } from '@/config/environment';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🌐 GCP 실제 서버 데이터 API
 * Vercel 환경에서 GCP Monitoring API를 통해 실제 서버 메트릭 제공
 */
export async function GET(request: NextRequest) {
    try {
        const env = detectEnvironment();

        // 🚫 로컬 환경에서는 사용 불가
        if (!env.IS_VERCEL) {
            return NextResponse.json({
                success: false,
                error: 'GCP 실제 데이터는 Vercel 환경에서만 사용 가능',
                message: '로컬 환경에서는 목업 데이터를 사용하세요',
                timestamp: new Date().toISOString()
            }, { status: 400 });
        }

        console.log('🌐 GCP 실제 서버 데이터 API 호출');

        // GCP 실제 데이터 서비스 초기화
        const gcpService = GCPRealDataService.getInstance();

        if (!gcpService.isInitialized) {
            const initialized = await gcpService.initialize();
            if (!initialized) {
                return NextResponse.json({
                    success: false,
                    error: 'GCP 서비스 초기화 실패',
                    message: 'GCP 인증 정보를 확인하세요',
                    timestamp: new Date().toISOString()
                }, { status: 500 });
            }
        }

        // 실제 서버 메트릭 조회
        const metricsResponse = await gcpService.getRealServerMetrics();

        if (!metricsResponse.success) {
            return NextResponse.json({
                success: false,
                error: 'GCP 메트릭 조회 실패',
                message: 'GCP Monitoring API 호출 오류',
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }

        console.log(`✅ GCP 실제 서버 데이터 조회 성공: ${metricsResponse.totalServers}개 서버`);

        return NextResponse.json({
            success: true,
            data: metricsResponse.data,
            summary: {
                totalServers: metricsResponse.totalServers,
                healthyServers: metricsResponse.healthyServers,
                warningServers: metricsResponse.warningServers,
                criticalServers: metricsResponse.criticalServers,
                averageCpuUsage: calculateAverageCpuUsage(metricsResponse.data),
                averageMemoryUsage: calculateAverageMemoryUsage(metricsResponse.data)
            },
            source: 'gcp-real-data',
            timestamp: metricsResponse.timestamp,
            environment: 'vercel'
        });

    } catch (error) {
        console.error('❌ GCP 실제 서버 데이터 API 오류:', error);

        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

/**
 * 📊 평균 CPU 사용률 계산
 */
function calculateAverageCpuUsage(servers: any[]): number {
    if (servers.length === 0) return 0;

    const totalCpuUsage = servers.reduce((sum, server) => {
        return sum + (server.metrics?.cpu?.usage || 0);
    }, 0);

    return Math.round(totalCpuUsage / servers.length);
}

/**
 * 📊 평균 메모리 사용률 계산
 */
function calculateAverageMemoryUsage(servers: any[]): number {
    if (servers.length === 0) return 0;

    const totalMemoryUsage = servers.reduce((sum, server) => {
        return sum + (server.metrics?.memory?.usage || 0);
    }, 0);

    return Math.round(totalMemoryUsage / servers.length);
} 