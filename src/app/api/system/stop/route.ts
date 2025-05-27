import { NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';
import { dataManager } from '../../../../services/dataManager';

export async function POST() {
  try {
    console.log('🛑 시스템 중지 API 호출');

    // 실행 중인지 확인
    if (!simulationEngine.isRunning()) {
      return NextResponse.json({
        success: false,
        message: '시스템이 실행 중이 아닙니다.',
        data: {
          isRunning: false
        }
      }, { status: 400 });
    }

    const state = simulationEngine.getState();
    const runtime = state.startTime ? Date.now() - state.startTime : 0;

    // 시뮬레이션 엔진 중지
    simulationEngine.stop();

    // 실시간 데이터를 일일 저장소로 마이그레이션
    dataManager.migrateToDaily();

    // 저장소 정보 조회
    const storageInfo = dataManager.getStorageInfo();

    return NextResponse.json({
      success: true,
      message: '시스템이 성공적으로 중지되었습니다.',
      data: {
        isRunning: false,
        runtime: Math.round(runtime / 1000), // 초 단위
        dataCollected: state.dataCount,
        storageInfo
      }
    });

  } catch (error) {
    console.error('❌ 시스템 중지 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: '시스템 중지에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 