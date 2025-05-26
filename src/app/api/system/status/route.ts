import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';
import { dataManager } from '../../../../services/dataManager';

export async function GET(request: NextRequest) {
  try {
    const state = simulationEngine.getState();
    const isRunning = simulationEngine.isRunning();
    
    // 기본 시스템 정보
    const systemStatus = {
      isRunning,
      startTime: state.startTime,
      runtime: state.startTime ? Date.now() - state.startTime : 0,
      dataCount: state.dataCount,
      activeScenarios: state.activeScenarios
    };

    // 실행 중일 때 추가 정보
    if (isRunning) {
      const servers = dataManager.getLatestServerStates();
      const alertStats = dataManager.getAlertStatistics();
      const statusDistribution = dataManager.getServerStatusDistribution();
      const envDistribution = dataManager.getEnvironmentDistribution();
      const avgMetrics = dataManager.getAverageMetrics();
      const storageInfo = dataManager.getStorageInfo();

      return NextResponse.json({
        success: true,
        data: {
          system: systemStatus,
          servers: {
            total: servers.length,
            byStatus: statusDistribution,
            byEnvironment: envDistribution,
            averageMetrics: avgMetrics
          },
          alerts: alertStats,
          storage: storageInfo,
          realtimeData: servers
        }
      });
    }

    // 중지 상태일 때 기본 정보만
    return NextResponse.json({
      success: true,
      data: {
        system: systemStatus,
        storage: dataManager.getStorageInfo()
      }
    });

  } catch (error) {
    console.error('❌ 시스템 상태 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: '시스템 상태 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 