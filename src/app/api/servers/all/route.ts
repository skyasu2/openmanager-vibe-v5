import { NextResponse } from 'next/server';
import { getMockSystem } from '@/mock';

export const dynamic = 'force-dynamic';

/**
 * 🚀 목업 데이터 전용 서버 API
 *
 * Supabase 연동을 제거하고 목업 데이터만 사용하도록 최적화
 * - 빠른 응답 속도
 * - 외부 의존성 없음
 * - 무료 티어 최적화
 */
export async function GET() {
  try {
    console.log('🚀 /api/servers/all - 목업 서버 데이터 가져오기');

    // 목업 시스템에서 바로 데이터 가져오기
    const mockSystem = getMockSystem();
    const servers = mockSystem.getServers();

    // 통계 정보 계산
    const stats = {
      total: servers.length,
      online: servers.filter(s => s.status === 'online').length,
      warning: servers.filter(s => s.status === 'warning').length,
      critical: servers.filter(s => s.status === 'critical').length,
    };

    console.log('📈 서버 통계:', stats);

    return NextResponse.json(
      {
        success: true,
        data: servers,
        count: servers.length,
        stats,
        timestamp: Date.now(),
        optimized: true,
        serverless: true,
        dataSource: 'mock-only',
        metadata: {
          scenarioActive: true,
          mockVersion: '3.0',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'CDN-Cache-Control': 'public, s-maxage=30',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
        },
      }
    );
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
