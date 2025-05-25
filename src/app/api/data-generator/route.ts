/**
 * Data Generator API
 * 
 * 🎭 서버 데이터 생성기 제어 API
 * - 초기 24시간 데이터 생성
 * - 실시간 10분 데이터 생성 시작/중지
 * - 생성 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverDataGenerator } from '../../../services/collectors/ServerDataGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action || !['start-realtime', 'stop-realtime', 'init-history'].includes(action)) {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다. (start-realtime, stop-realtime, init-history 중 선택)' },
        { status: 400 }
      );
    }

    console.log(`🎭 Data generator action: ${action}`);

    switch (action) {
      case 'start-realtime':
        await serverDataGenerator.startRealtimeGeneration();
        
        return NextResponse.json({
          success: true,
          message: '10분간 실시간 데이터 생성을 시작했습니다. (5초 간격)',
          data: {
            action: 'start-realtime',
            duration: '10 minutes',
            interval: '5 seconds',
            timestamp: new Date().toISOString()
          }
        });

      case 'stop-realtime':
        serverDataGenerator.stopRealtimeGeneration();
        
        return NextResponse.json({
          success: true,
          message: '실시간 데이터 생성을 중지했습니다.',
          data: {
            action: 'stop-realtime',
            timestamp: new Date().toISOString()
          }
        });

      case 'init-history':
        // 백그라운드에서 실행 (시간이 오래 걸릴 수 있음)
        serverDataGenerator.initializeHistoryData().catch(error => {
          console.error('History data initialization failed:', error);
        });
        
        return NextResponse.json({
          success: true,
          message: '24시간 히스토리 데이터 초기화를 시작했습니다.',
          data: {
            action: 'init-history',
            patterns: ['정상 운영', '고부하', '유지보수'],
            duration: '24 hours',
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
    console.error('❌ Data generator failed:', error);
    
    return NextResponse.json({
      success: false,
      error: '데이터 생성기 제어에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = serverDataGenerator.getGenerationStatus();
    const limits = serverDataGenerator.getAnalysisLimits();
    
    return NextResponse.json({
      success: true,
      data: {
        generation: {
          isGenerating: status.isGenerating,
          startTime: status.startTime?.toISOString(),
          remainingTime: status.remainingTime,
          remainingMinutes: Math.ceil(status.remainingTime / 60000),
          patterns: status.patterns
        },
        limits: {
          maxHistoryHours: limits.maxHistoryHours,
          realtimeMinutes: limits.realtimeMinutes,
          dataInterval: limits.dataInterval,
          supportedPatterns: limits.supportedPatterns
        },
        tables: {
          realtime: 'server_metrics_realtime (10분간 5초 간격)',
          history: 'server_metrics_history (24시간 5분 간격)',
          patterns: 'server_metrics_patterns (미리 생성된 패턴들)'
        },
        description: status.isGenerating 
          ? `실시간 데이터 생성 중 (${Math.ceil(status.remainingTime / 60000)}분 남음)`
          : '데이터 생성 대기 중'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get data generator status:', error);
    
    return NextResponse.json({
      success: false,
      error: '데이터 생성기 상태 조회에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 