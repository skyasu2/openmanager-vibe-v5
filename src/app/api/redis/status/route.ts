/**
 * 🌐 Redis 연결 상태 확인 API
 * 
 * 대시보드에서 Redis 연결 상태를 확인하는 엔드포인트
 */

import { getRedis, getRedisStatus } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Redis 연결 상태 확인 중...');

        // Redis 인스턴스 가져오기
        const redis = getRedis();

        // 기본 상태 정보
        const status = getRedisStatus();

        // 실제 연결 테스트 (ping)
        let pingResult: string | null = null;
        let connectionTest = false;

        try {
            const startTime = Date.now();
            pingResult = await redis.ping();
            const responseTime = Date.now() - startTime;
            connectionTest = pingResult === 'PONG';

            console.log(`✅ Redis 연결 테스트 성공: ${pingResult} (${responseTime}ms)`);

            return NextResponse.json({
                success: true,
                data: {
                    connected: connectionTest,
                    status: status.status,
                    uptime: status.uptime,
                    ping: pingResult,
                    responseTime,
                    host: process.env.GCP_REDIS_HOST || 'charming-condor-46598.upstash.io',
                    port: process.env.GCP_REDIS_PORT || '6379',
                    timestamp: new Date().toISOString(),
                },
            });

        } catch (pingError) {
            console.error('❌ Redis ping 실패:', pingError);

            return NextResponse.json({
                success: false,
                data: {
                    connected: false,
                    status: 'error',
                    uptime: status.uptime,
                    ping: null,
                    responseTime: null,
                    host: process.env.GCP_REDIS_HOST || 'charming-condor-46598.upstash.io',
                    port: process.env.GCP_REDIS_PORT || '6379',
                    timestamp: new Date().toISOString(),
                    error: pingError instanceof Error ? pingError.message : String(pingError),
                },
            }, { status: 503 });
        }

    } catch (error) {
        console.error('❌ Redis 상태 확인 실패:', error);

        return NextResponse.json({
            success: false,
            error: 'Redis 상태 확인 실패',
            details: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
} 