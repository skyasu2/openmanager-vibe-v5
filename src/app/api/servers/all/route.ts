import { transformServerInstancesToServersOptimized } from '@/adapters/server-data-adapter';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🚀 /api/servers/all - 최적화된 전처리 시작');

    const dataGenerator = RealServerDataGenerator.getInstance();

    // 🎯 초기화 확인 및 실행
    const status = dataGenerator.getStatus();
    if (!status.isInitialized) {
      console.log('🔄 데이터 생성기 초기화 중...');
      await dataGenerator.initialize();

      // 자동 생성 시작
      if (!status.isGenerating) {
        dataGenerator.startAutoGeneration();
        console.log('✅ 자동 데이터 생성 시작');
      }
    }

    const serverInstances = dataGenerator.getAllServers();
    console.log('📊 원본 데이터:', serverInstances.length, '개 서버');

    // 🚀 배치 최적화 변환 사용
    const servers = transformServerInstancesToServersOptimized(serverInstances);

    console.log('✅ 최적화된 변환 완료:', servers.length, '개 서버');

    return NextResponse.json({
      success: true,
      data: servers,
      count: servers.length,
      timestamp: Date.now(),
      optimized: true,
      initialized: status.isInitialized,
    });
  } catch (error) {
    console.error('❌ /api/servers/all 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch servers',
        optimized: false,
      },
      { status: 500 }
    );
  }
}
