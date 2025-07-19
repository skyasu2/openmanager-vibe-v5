import { NextResponse } from 'next/server';
import { getMockSystem } from '@/mock';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🚀 /api/servers/all - 목업 서버 데이터 가져오기');

    // 🎯 목업 시스템에서 8개 온프레미스 서버 데이터 가져오기
    const mockSystem = getMockSystem();
    const servers = mockSystem.getServers();
    const systemInfo = mockSystem.getSystemInfo();
    
    console.log('📊 목업 데이터:', servers.length, '개 서버');
    console.log('🎭 시나리오:', systemInfo.scenario.description);

    // 📊 통계 정보 계산
    const stats = {
      total: servers.length,
      online: servers.filter(s => s.status === 'online').length,
      warning: servers.filter(s => s.status === 'warning').length,
      critical: servers.filter(s => s.status === 'critical').length,
    };

    console.log('📈 서버 통계:', stats);
    console.log('⏱️ 시뮬레이션 시간:', systemInfo.rotatorStatus?.simulationTime || '시작 전');

    return NextResponse.json({
      success: true,
      data: servers,
      count: servers.length,
      stats,
      timestamp: Date.now(),
      optimized: true,
      serverless: true,
      dataSource: 'mock-onpremise',
      scenario: {
        name: systemInfo.scenario.scenario,
        description: systemInfo.scenario.description,
        startHour: systemInfo.scenario.startHour
      },
      simulationTime: systemInfo.rotatorStatus?.simulationTime,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
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
