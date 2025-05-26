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

/**
 * 패턴 이름 변환
 */
function getPatternName(pattern: string): string {
  switch (pattern) {
    case 'normal':
      return '정상 운영';
    case 'high-load':
      return '고부하';
    case 'maintenance':
      return '유지보수';
    default:
      return '알 수 없음';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pattern } = body;

    if (!action || !['start-realtime', 'stop-realtime', 'init-history', 'change-pattern'].includes(action)) {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다. (start-realtime, stop-realtime, init-history, change-pattern 중 선택)' },
        { status: 400 }
      );
    }

    console.log(`🎭 Data generator action: ${action}`);

    switch (action) {
      case 'start-realtime':
        const startPattern = pattern || 'normal'; // 기본값: 정상 운영
        console.log(`🎭 [Data Generator] Starting realtime generation with pattern: ${startPattern}`);
        
        await serverDataGenerator.startRealtimeGeneration(startPattern);
        
        console.log(`✅ [Data Generator] Realtime generation started successfully`);
        
        return NextResponse.json({
          success: true,
          message: `10분간 실시간 데이터 생성을 시작했습니다. (${getPatternName(startPattern)} 패턴, 5초 간격)`,
          data: {
            action: 'start-realtime',
            pattern: startPattern,
            patternName: getPatternName(startPattern),
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
        // 3가지 버전의 24시간 데이터 생성 (백그라운드에서 실행)
        const historyPattern = pattern || 'random'; // random, normal, crisis 중 선택
        
        serverDataGenerator.initializeHistoryDataWithVariants(historyPattern).catch(error => {
          console.error('History data initialization failed:', error);
        });
        
        return NextResponse.json({
          success: true,
          message: `24시간 히스토리 데이터 초기화를 시작했습니다. (${historyPattern} 패턴)`,
          data: {
            action: 'init-history',
            pattern: historyPattern,
            variants: [
              { name: 'normal', description: '정상 운영 (5% 경고, 1% 장애)' },
              { name: 'busy', description: '바쁜 일상 (15% 경고, 3% 장애)' },
              { name: 'crisis', description: '위기 상황 (30% 경고, 10% 장애)' }
            ],
            features: [
              '출퇴근 시간 트래픽 급증',
              '점심시간 사용량 감소',
              '새벽 백업 작업 영향',
              '주기적 배치 작업 부하',
              '랜덤 장애 발생 패턴'
            ],
            duration: '24 hours',
            timestamp: new Date().toISOString()
          }
        });

      case 'change-pattern':
        if (!pattern || !['normal', 'high-load', 'maintenance'].includes(pattern)) {
          return NextResponse.json(
            { error: '유효하지 않은 패턴입니다. (normal, high-load, maintenance 중 선택)' },
            { status: 400 }
          );
        }

        const success = serverDataGenerator.changeRealtimePattern(pattern);
        
        if (!success) {
          return NextResponse.json(
            { error: '패턴 변경에 실패했습니다. 실시간 생성이 활성화되어 있는지 확인하세요.' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `데이터 패턴이 ${getPatternName(pattern)}(으)로 변경되었습니다.`,
          data: {
            action: 'change-pattern',
            pattern,
            patternName: getPatternName(pattern),
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