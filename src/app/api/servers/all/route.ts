import { transformServerInstancesToServersOptimized } from '@/adapters/server-data-adapter';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🚀 /api/servers/all - 서버리스 호환 데이터 생성 시작');

    // 🌐 GCP 실제 데이터 서비스 사용
    const gcpDataService = GCPRealDataService.getInstance();
    await gcpDataService.initialize();

    // 🔧 서버 데이터 가져오기
    const metricsResponse = await gcpDataService.getRealServerMetrics();
    const serverData = metricsResponse.data;
    console.log('📊 생성된 데이터:', serverData.length, '개 서버');

    // 🚀 배치 최적화 변환 사용
    const servers = transformServerInstancesToServersOptimized(serverData);

    console.log('✅ 최적화된 변환 완료:', servers.length, '개 서버');

    return NextResponse.json({
      success: true,
      data: servers,
      count: servers.length,
      timestamp: Date.now(),
      optimized: true,
      serverless: true,
      dataSource: 'request-scoped',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
        'CDN-Cache-Control': 'public, s-maxage=120',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=120',
      },
    });
  } catch (error) {
    console.error('❌ /api/servers/all 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch servers',
        optimized: false,
        serverless: true,
      },
      { status: 500 }
    );
  }
}
