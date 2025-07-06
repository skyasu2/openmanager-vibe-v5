import { APICacheManager, getCacheHeaders, getCacheKey } from '@/lib/api-cache-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 📊 시스템 헬스체크 API
 * 시스템 전반적인 상태를 확인하고 캐싱된 응답을 제공합니다.
 */
export async function GET(request: NextRequest) {
    try {
        const cacheManager = APICacheManager.getInstance();

        // 캐시 키 생성
        const cacheKey = getCacheKey('health', {});
        const cached = cacheManager.get(cacheKey);

        if (cached) {
            return NextResponse.json(cached, {
                status: 200,
                headers: getCacheHeaders(true, 300) // 5분 캐시
            });
        }

        // 시스템 상태 확인
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            environment: process.env.NODE_ENV || 'development'
        };

        // 캐시에 저장
        cacheManager.set(cacheKey, healthData, {
            category: 'health',
            customTTL: 300000 // 5분
        });

        return NextResponse.json(healthData, {
            status: 200,
            headers: getCacheHeaders(false, 300)
        });

    } catch (error) {
        console.error('Health check failed:', error);

        const errorResponse = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        };

        return NextResponse.json(errorResponse, {
            status: 500,
            headers: getCacheHeaders(false, 60) // 1분 캐시 (오류 시 짧게)
        });
    }
}
