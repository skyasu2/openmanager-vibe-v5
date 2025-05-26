import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';
import { dataManager } from '../../../../services/dataManager';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 시스템 시작 API 호출');

    // 이미 시작된 상태인지 확인
    if (simulationEngine.isRunning()) {
      return NextResponse.json({
        success: false,
        message: '시스템이 이미 실행 중입니다.',
        data: {
          isRunning: true,
          startTime: simulationEngine.getState().startTime
        }
      }, { status: 400 });
    }

    // 기존 실시간 데이터 클리어
    dataManager.clearRealtimeData();

    // 시뮬레이션 엔진 시작
    simulationEngine.start();

    // 20분 자동 종료 타이머 설정 (Vercel 함수 제한 고려)
    setTimeout(() => {
      console.log('⏰ 20분 타이머 도달 - 자동 시스템 종료');
      if (simulationEngine.isRunning()) {
        simulationEngine.stop();
        // 실시간 데이터를 일일 저장소로 마이그레이션
        dataManager.migrateToDaily();
      }
    }, 20 * 60 * 1000); // 20분

    // 5초마다 데이터 저장
    const dataCollectionInterval = setInterval(() => {
      if (!simulationEngine.isRunning()) {
        clearInterval(dataCollectionInterval);
        return;
      }

      const servers = simulationEngine.getServers();
      if (servers.length > 0) {
        dataManager.storeRealtimeMetrics(servers);
      }
    }, 5000);

    const state = simulationEngine.getState();

    return NextResponse.json({
      success: true,
      message: '시스템이 성공적으로 시작되었습니다.',
      data: {
        isRunning: state.isRunning,
        startTime: state.startTime,
        serverCount: state.servers.length,
        autoStopIn: '20분'
      }
    });

  } catch (error) {
    console.error('❌ 시스템 시작 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: '시스템 시작에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 