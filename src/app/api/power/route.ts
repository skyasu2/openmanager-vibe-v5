/**
 * Power Management API
 * 
 * 🔋 시스템 절전 모드 제어 API
 * - 절전 모드 전환
 * - 에너지 효율성 최적화
 * - 배터리 수명 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverDataCollector } from '../../../services/collectors/ServerDataCollector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, energyLevel } = body;

    if (!mode || !['sleep', 'active', 'monitoring', 'emergency'].includes(mode)) {
      return NextResponse.json(
        { error: '유효하지 않은 절전 모드입니다. (sleep, active, monitoring, emergency 중 선택)' },
        { status: 400 }
      );
    }

    console.log(`🔋 Switching to power mode: ${mode}`);

    // 서버 데이터 수집기 절전 모드 설정
    serverDataCollector.setPowerMode(mode);

    // 모드별 설정
    const modeConfig = {
      sleep: {
        collectionInterval: 300000, // 5분
        description: '최소 전력 소모 모드',
        batteryLife: '24시간+',
        features: ['백그라운드 모니터링 최소화', '데이터 수집 일시 중단', 'AI 에이전트 대기']
      },
      monitoring: {
        collectionInterval: 120000, // 2분
        description: '균형 모니터링 모드',
        batteryLife: '12시간',
        features: ['제한적 실시간 모니터링', '중요 알림만 처리', '성능 최적화']
      },
      active: {
        collectionInterval: 30000, // 30초
        description: '전체 기능 활성화',
        batteryLife: '8시간',
        features: ['실시간 모니터링', 'AI 분석 활성화', '모든 기능 사용 가능']
      },
      emergency: {
        collectionInterval: 600000, // 10분
        description: '비상 절전 모드',
        batteryLife: '48시간+',
        features: ['핵심 기능만 유지', '최소 데이터 수집', '긴급 알림만 처리']
      }
    };

    const currentConfig = modeConfig[mode as keyof typeof modeConfig];

    return NextResponse.json({
      success: true,
      message: `절전 모드가 ${mode}로 변경되었습니다.`,
      data: {
        mode,
        energyLevel: energyLevel || 'medium',
        config: currentConfig,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Power mode change failed:', error);
    
    return NextResponse.json({
      success: false,
      error: '절전 모드 변경에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = serverDataCollector.getCollectionStats();
    
    // 현재 절전 모드 추정 (수집 간격 기반)
    let currentMode = 'active';
    const interval = stats.config.collectionInterval;
    
    if (interval >= 600000) currentMode = 'emergency';
    else if (interval >= 300000) currentMode = 'sleep';
    else if (interval >= 120000) currentMode = 'monitoring';
    else currentMode = 'active';

    return NextResponse.json({
      success: true,
      data: {
        currentMode,
        collectionInterval: interval,
        isCollecting: stats.isCollecting,
        lastUpdate: stats.lastCollectionTime.toISOString(),
        errors: stats.collectionErrors,
        powerStatus: {
          estimatedBatteryLife: currentMode === 'emergency' ? '48시간+' :
                               currentMode === 'sleep' ? '24시간+' :
                               currentMode === 'monitoring' ? '12시간' : '8시간',
          energyEfficiency: currentMode === 'emergency' ? 'maximum' :
                           currentMode === 'sleep' ? 'high' :
                           currentMode === 'monitoring' ? 'medium' : 'standard'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get power status:', error);
    
    return NextResponse.json({
      success: false,
      error: '절전 상태 조회에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 