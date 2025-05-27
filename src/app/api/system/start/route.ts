import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';
import { dataManager } from '../../../../services/dataManager';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 시스템 시작 API 호출');

    // 요청 본문에서 세션 타입 확인
    let sessionType = 'user'; // 기본값은 사용자 세션
    let duration = 60 * 60; // 기본 60분
    
    try {
      const body = await request.json();
      sessionType = body.sessionType || 'user';
      duration = body.duration || (sessionType === 'user' ? 60 * 60 : 20 * 60);
    } catch {
      // JSON 파싱 실패 시 기본값 사용
    }

    // 이미 시작된 상태인지 확인
    if (simulationEngine.isRunning()) {
      const state = simulationEngine.getState();
      const runtime = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
      
      console.log('ℹ️ 시스템이 이미 실행 중입니다');
      
      return NextResponse.json({
        success: true, // 이미 실행 중인 것도 성공으로 처리
        message: '시스템이 이미 실행 중입니다.',
        data: {
          isRunning: true,
          startTime: state.startTime,
          runtime: runtime,
          serverCount: state.servers.length,
          sessionType: 'existing'
        }
      });
    }

    // 기존 실시간 데이터 클리어
    dataManager.clearRealtimeData();

    // 시뮬레이션 엔진 시작
    simulationEngine.start();

    // 자동 종료 타이머 설정 (세션 타입에 따라 다름)
    const autoStopTimeout = setTimeout(() => {
      console.log(`⏰ ${duration / 60}분 타이머 도달 - 자동 시스템 종료 (${sessionType} 세션)`);
      if (simulationEngine.isRunning()) {
        simulationEngine.stop();
        // 실시간 데이터를 일일 저장소로 마이그레이션
        dataManager.migrateToDaily();
        console.log('✅ 자동 종료 완료');
      }
    }, duration * 1000);

    // 5초마다 데이터 저장
    const dataCollectionInterval = setInterval(() => {
      if (!simulationEngine.isRunning()) {
        clearInterval(dataCollectionInterval);
        clearTimeout(autoStopTimeout);
        return;
      }

      const servers = simulationEngine.getServers();
      if (servers.length > 0) {
        dataManager.storeRealtimeMetrics(servers);
      }
    }, 5000);

    const state = simulationEngine.getState();
    const sessionTypeText = sessionType === 'user' ? '사용자 세션' : 'AI 세션';

    console.log(`✅ ${sessionTypeText} 시작 완료 (${duration / 60}분)`);

    return NextResponse.json({
      success: true,
      message: `${sessionTypeText}이 성공적으로 시작되었습니다.`,
      data: {
        isRunning: state.isRunning,
        startTime: state.startTime,
        serverCount: state.servers.length,
        sessionType,
        duration,
        autoStopIn: `${duration / 60}분`,
        features: {
          dataCollection: true,
          aiAgent: true,
          realTimeMonitoring: true
        }
      }
    });

  } catch (error) {
    console.error('❌ 시스템 시작 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: '시스템 시작에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      data: {
        isRunning: false,
        troubleshooting: [
          '네트워크 연결을 확인해주세요',
          '브라우저를 새로고침해주세요',
          '잠시 후 다시 시도해주세요'
        ]
      }
    }, { status: 500 });
  }
} 