import { systemLogger } from '@/lib/logger';
import { realTimeSystemStatus } from '@/services/system/RealTimeSystemStatus';
import { getKoreanTime } from '@/utils/DateUtils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🌐 실시간 상태 공유 시스템 제어 API v3
 *
 * 모든 사용자가 자유롭게 시스템 제어 가능
 * - 실시간 상태 브로드캐스트
 * - 제어 히스토리 추적
 * - 베르셀 환경 최적화
 */

export type SystemControlAction = 'start' | 'stop' | 'restart' | 'maintenance';

interface SystemControlRequest {
  action: SystemControlAction;
  userId?: string;
  userName?: string;
}

/**
 * GET - 시스템 상태 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const userName = url.searchParams.get('userName') || '익명 사용자';

    // 클라이언트 IP 추출
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 사용자 연결 등록
    realTimeSystemStatus.addUser(userId, userName, clientIP);

    // 현재 상태 조회
    const currentState = realTimeSystemStatus.getCurrentState();
    const currentTime = getKoreanTime();

    return NextResponse.json({
      success: true,
      data: {
        systemState: currentState.systemState,
        lastAction: currentState.lastAction,
        recentActions: currentState.recentActions,
        connectedUsers: currentState.connectedUsers,
        canControl: true, // 모든 사용자가 항상 제어 가능
        timestamp: currentTime,
      },
      message: '시스템 상태 조회 성공',
    });
  } catch (error) {
    systemLogger.error('시스템 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '시스템 상태 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        timestamp: getKoreanTime(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 시스템 제어 실행
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SystemControlRequest = await request.json();
    const { action, userId = 'anonymous', userName = '익명 사용자' } = body;

    // 클라이언트 IP 추출
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const currentTime = getKoreanTime();

    systemLogger.info(
      '🎯 시스템 제어 요청: ' + userName + ' (' + action + ') - IP: ' + clientIP
    );

    // 실시간 상태 공유를 통한 시스템 제어 실행
    const result = await realTimeSystemStatus.executeAction(
      action,
      userId,
      userName,
      clientIP
    );

    if (result.success) {
      systemLogger.info(
        '✅ 시스템 제어 성공: ' + userName + ' (' + action + ')'
      );

      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          action,
          actionId: result.actionId,
          controller: {
            userId,
            userName,
            clientIP,
          },
          timestamp: currentTime,
        },
      });
    } else {
      systemLogger.error(
        '❌ 시스템 제어 실패: ' + userName + ' (' + action + ')'
      );

      return NextResponse.json(
        {
          success: false,
          message: result.message,
          data: {
            action,
            actionId: result.actionId,
            timestamp: currentTime,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    systemLogger.error('시스템 제어 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '시스템 제어 요청 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        timestamp: getKoreanTime(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 사용자 연결 해제
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: '사용자 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 사용자 연결 해제
    realTimeSystemStatus.removeUser(userId);

    return NextResponse.json({
      success: true,
      message: '사용자 연결이 해제되었습니다.',
      timestamp: getKoreanTime(),
    });
  } catch (error) {
    systemLogger.error('사용자 연결 해제 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '사용자 연결 해제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        timestamp: getKoreanTime(),
      },
      { status: 500 }
    );
  }
}
