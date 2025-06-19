import { NextResponse } from 'next/server';
import { realServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { transformServerInstancesToServers } from '@/adapters/server-data-adapter';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const generator = realServerDataGenerator;
        if (!generator.getStatus().isInitialized) {
            await generator.initialize();
        }

        const allServerInstances = generator.getAllServers();
        const transformedServers = transformServerInstancesToServers(allServerInstances);

        return NextResponse.json({
            success: true,
            data: transformedServers,
            timestamp: Date.now(),
            count: transformedServers.length,
        });
    } catch (error) {
        console.error('❌ /api/servers/all API 오류:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류',
                data: [],
            },
            { status: 500 }
        );
    }
} 