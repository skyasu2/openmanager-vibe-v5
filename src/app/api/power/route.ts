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
    const isSystemActive = stats.isCollecting;
    const currentState = isSystemActive ? 'active' : 'stopped';

    return NextResponse.json({
      success: true,
      data: {
        state: currentState,
        isActive: isSystemActive,
        isCollecting: stats.isCollecting,
        lastUpdate: stats.lastCollectionTime.toISOString(),
        errors: stats.collectionErrors,
        totalServers: stats.totalServers,
        systemInfo: {
          description: isSystemActive ? '시스템 활성화됨' : '시스템 정지됨',
          features: isSystemActive ? [
            '실시간 서버 모니터링',
            'AI 에이전트 활성화',
            '데이터 수집 진행중',
            '대시보드 접근 가능'
          ] : [
            '모든 기능 정지',
            'AI 에이전트만 감지 대기',
            '데이터 수집 중단',
            '절전 모드'
          ]
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