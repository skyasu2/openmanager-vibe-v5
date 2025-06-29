import { systemStateManager } from '@/core/system/SystemStateManager';
import { systemLogger } from '@/lib/logger';
import { getKoreanTime } from '@/utils/DateUtils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛑 시스템 중지 API
 *
 * 안전한 시스템 종료 절차 제공
 * - 실행 중인 작업 완료 대기
 * - 안전한 상태 전환
 * - 중지 로그 기록
 */

interface SystemStopRequest {
  triggeredBy?: string;
  userId?: string;
  reason?: string;
  force?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SystemStopRequest = await request.json();
    const {
      triggeredBy = '시스템',
      userId = 'system',
      reason = '사용자 요청',
      force = false,
    } = body;

    const currentTime = getKoreanTime();

    systemLogger.info(`🛑 시스템 중지 요청: ${triggeredBy} (${reason})`);

    // 현재 시스템 상태 확인
    const currentState = systemStateManager.getCurrentState();

    if (currentState.state === 'STOPPED') {
      return NextResponse.json({
        success: false,
        message: '시스템이 이미 중지되어 있습니다.',
        data: {
          currentState: currentState.state,
          triggeredBy,
          timestamp: currentTime,
        },
      });
    }

    if (currentState.state === 'STOPPING' && !force) {
      return NextResponse.json({
        success: false,
        message: '시스템이 이미 중지 중입니다.',
        data: {
          currentState: currentState.state,
          triggeredBy,
          timestamp: currentTime,
        },
      });
    }

    // 시스템 중지 시작
    systemStateManager.setState('STOPPING', '시스템 중지 진행 중');

    try {
      // 1. 진행 중인 작업 완료 대기 (강제 중지가 아닌 경우)
      if (!force) {
        systemLogger.info('⏳ 진행 중인 작업 완료 대기...');

        // 실제 환경에서는 실행 중인 작업들을 확인하고 대기
        // 여기서는 간단히 3초 대기
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // 2. 각 서비스 중지
      await stopSystemServices(triggeredBy);

      // 3. 시스템 상태를 STOPPED로 전환
      systemStateManager.setState(
        'STOPPED',
        '시스템이 안전하게 중지되었습니다'
      );

      systemLogger.info(`✅ 시스템 중지 완료: ${triggeredBy}`);

      return NextResponse.json({
        success: true,
        message: '시스템이 성공적으로 중지되었습니다.',
        data: {
          stoppedBy: triggeredBy,
          userId,
          reason,
          stopTime: currentTime,
          finalState: 'STOPPED',
        },
        timestamp: currentTime,
      });
    } catch (stopError) {
      // 중지 실패 시 ERROR 상태로 전환
      systemStateManager.setState(
        'ERROR',
        `시스템 중지 실패: ${stopError instanceof Error ? stopError.message : String(stopError)}`
      );

      systemLogger.error(`❌ 시스템 중지 실패: ${triggeredBy}`, stopError);

      return NextResponse.json(
        {
          success: false,
          message: '시스템 중지 중 오류가 발생했습니다.',
          error:
            stopError instanceof Error ? stopError.message : String(stopError),
          data: {
            triggeredBy,
            userId,
            timestamp: currentTime,
            currentState: 'ERROR',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    systemLogger.error('시스템 중지 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '시스템 중지 요청 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        timestamp: getKoreanTime(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🛑 시스템 서비스들 중지
 */
async function stopSystemServices(triggeredBy: string): Promise<void> {
  const services = [
    'AI 에이전트 서비스',
    '실시간 모니터링 서비스',
    '데이터 수집 서비스',
    '알림 서비스',
    '배치 작업 스케줄러',
  ];

  systemLogger.info(`🔄 ${services.length}개 서비스 중지 시작...`);

  for (const service of services) {
    try {
      systemLogger.info(`⏹️ ${service} 중지 중...`);

      // 실제 서비스 중지 로직 (시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 500));

      systemLogger.info(`✅ ${service} 중지 완료`);
    } catch (error) {
      systemLogger.warn(`⚠️ ${service} 중지 중 오류 발생:`, error);
      // 개별 서비스 중지 실패는 전체 중지를 막지 않음
    }
  }

  systemLogger.info(`✅ 모든 서비스 중지 완료 (by ${triggeredBy})`);
}
