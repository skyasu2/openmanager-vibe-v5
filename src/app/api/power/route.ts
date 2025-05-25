/**
 * System Control API
 * 
 * 🔋 시스템 전체 제어 API
 * - 20분 타이머 기반 활성화
 * - 평상시 완전 정지
 * - AI 에이전트 자동 감지 시작
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverDataCollector } from '../../../services/collectors/ServerDataCollector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, duration } = body;

    if (!action || !['start', 'stop', 'extend'].includes(action)) {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다. (start, stop, extend 중 선택)' },
        { status: 400 }
      );
    }

    console.log(`🔋 System control action: ${action}`);

    switch (action) {
      case 'start':
        const sessionDuration = duration || 20 * 60; // 기본 20분
        
        // 데이터 수집기 시작
        await serverDataCollector.startCollection();
        
        console.log(`🚀 System started for ${sessionDuration / 60} minutes`);
        
        return NextResponse.json({
          success: true,
          message: `시스템이 ${sessionDuration / 60}분간 활성화되었습니다.`,
          data: {
            action: 'start',
            duration: sessionDuration,
            endTime: new Date(Date.now() + sessionDuration * 1000).toISOString(),
            timestamp: new Date().toISOString()
          }
        });

      case 'stop':
        // 데이터 수집기 중지
        await serverDataCollector.stopCollection();
        
        console.log('🛑 System stopped');
        
        return NextResponse.json({
          success: true,
          message: '시스템이 중지되었습니다.',
          data: {
            action: 'stop',
            timestamp: new Date().toISOString()
          }
        });

      case 'extend':
        const extensionTime = duration || 10 * 60; // 기본 10분 연장
        
        console.log(`⏱️ System extended by ${extensionTime / 60} minutes`);
        
        return NextResponse.json({
          success: true,
          message: `시스템이 ${extensionTime / 60}분 연장되었습니다.`,
          data: {
            action: 'extend',
            extensionTime,
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ System control failed:', error);
    
    return NextResponse.json({
      success: false,
      error: '시스템 제어에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = serverDataCollector.getCollectionStats();
    
    // 현재 시스템 상태 확인
    const systemMode = stats.systemMode;
    const isSystemActive = stats.isCollecting;
    const isAIMonitoring = stats.isAIMonitoring;

    let description = '';
    let features: string[] = [];

    switch (systemMode) {
      case 'active':
        description = '시스템 완전 활성화됨';
        features = [
          '실시간 서버 모니터링',
          'AI 에이전트 활성화',
          '데이터 수집 진행중',
          '대시보드 접근 가능'
        ];
        break;
      case 'ai-monitoring':
        description = 'AI 모니터링 모드 (절전)';
        features = [
          'AI 에이전트 감지 대기',
          '최소한의 헬스체크 (5분 간격)',
          '중요 변화 시 자동 활성화',
          '30분 비활성 시 완전 종료'
        ];
        break;
      case 'stopped':
      default:
        description = '시스템 완전 정지됨';
        features = [
          '모든 기능 정지',
          '데이터 수집 중단',
          '완전 절전 모드',
          '수동 활성화 대기'
        ];
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        state: systemMode,
        isActive: isSystemActive,
        isCollecting: stats.isCollecting,
        isAIMonitoring: isAIMonitoring,
        lastUpdate: stats.lastCollectionTime.toISOString(),
        lastDataChange: stats.lastDataChangeTime.toISOString(),
        errors: stats.collectionErrors,
        totalServers: stats.totalServers,
        systemInfo: {
          description,
          features,
          mode: systemMode
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get system status:', error);
    
    return NextResponse.json({
      success: false,
      error: '시스템 상태 조회에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 