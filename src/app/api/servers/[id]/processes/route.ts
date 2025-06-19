import { NextResponse } from 'next/server';
import { getRealtime } from '@/lib/cache/redis'; // Redis에서 데이터를 가져오는 함수

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const serverId = params.id;

    if (!serverId) {
        return NextResponse.json(
            { error: 'Server ID is required' },
            { status: 400 }
        );
    }

    try {
        // Redis에서 실시간 메트릭 데이터를 조회
        const latestMetrics = await getRealtime(`server:${serverId}:metrics:latest`);

        if (!latestMetrics || !latestMetrics.processes) {
            return NextResponse.json(
                { processes: [] },
                { status: 404, statusText: 'No process data found for this server.' }
            );
        }

        // 프로세스 목록만 추출하여 반환
        return NextResponse.json({ processes: latestMetrics.processes });

    } catch (error) {
        console.error(`[API Error] Failed to fetch processes for server ${serverId}:`, error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 