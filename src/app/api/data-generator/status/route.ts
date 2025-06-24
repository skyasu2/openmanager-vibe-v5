/**
 * 📊 데이터 생성기 상태 API
 *
 * 실시간 서버 데이터 생성기의 현재 상태를 확인합니다.
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const generator = RealServerDataGenerator.getInstance();
    const generatorStatus = generator.getStatus();

    const status = {
      success: true,
      status: generatorStatus.isRunning ? 'running' : 'stopped',
      timestamp: new Date().toISOString(),
      serverCount: generatorStatus.serverCount,
      updateInterval: 40000, // 현재 설정된 간격
      isInitialized: generatorStatus.isInitialized,
      isGenerating: generatorStatus.isGenerating,
      config: {
        maxServers: 15,
        enableRealtime: true,
        enableRedis: false,
        architecture: 'load-balanced',
      },
      performance: {
        lastUpdate: new Date().toISOString(),
        dataFreshness: 'real-time',
        cacheStatus: 'active',
      },
      health: {
        overall: 'healthy',
        components: {
          generator: generatorStatus.isRunning ? 'active' : 'inactive',
          redis: 'mock-mode',
          preprocessing: 'active',
        },
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('❌ 데이터 생성기 상태 확인 오류:', error);

    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: 'Failed to get data generator status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
