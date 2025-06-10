/**
 * 🔔 슬랙 전용 알림 전송 API v2.0 - 단일 채널
 *
 * #server-alerts 채널 전용 API:
 * - 채널 선택 로직 제거
 * - 단순화된 파라미터
 * - 향상된 에러 처리
 * - 타임아웃 대응 개선
 */

import { NextRequest, NextResponse } from 'next/server';
import { slackNotificationService } from '@/services/SlackNotificationService';

// 단일 채널 고정
const SLACK_CHANNEL = '#server-alerts';

export async function POST(request: NextRequest) {
  try {
    const { message, severity } = await request.json();

    // 입력 검증 (단순화)
    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: '메시지가 필요합니다.',
          details: 'message 파라미터는 필수입니다.',
        },
        { status: 400 }
      );
    }

    // 심각도 기본값 및 검증
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const finalSeverity = severity || 'medium';

    if (!validSeverities.includes(finalSeverity)) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 심각도입니다.',
          details: `severity는 ${validSeverities.join(', ')} 중 하나여야 합니다.`,
        },
        { status: 400 }
      );
    }

    // 슬랙 서비스 상태 확인
    const slackStatus = slackNotificationService.getStatus();
    if (!slackStatus.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: '슬랙 알림이 비활성화되어 있습니다.',
          details: 'SLACK_WEBHOOK_URL 환경변수를 확인하세요.',
          messageId: null,
          channel: SLACK_CHANNEL,
        },
        { status: 503 }
      );
    }

    // 심각도를 슬랙 서비스 형식으로 변환
    const severityMap = {
      low: 'info',
      medium: 'info',
      high: 'warning',
      critical: 'critical',
    };

    // 실제 슬랙 전송 (단일 채널)
    const success = await slackNotificationService.sendSystemNotification(
      `${message}`,
      severityMap[finalSeverity]
    );

    if (success) {
      return NextResponse.json({
        success: true,
        messageId: `slack_${Date.now()}`,
        timestamp: new Date().toISOString(),
        channel: SLACK_CHANNEL,
        severity: finalSeverity,
        details: '슬랙 알림이 성공적으로 전송되었습니다.',
      });
    } else {
      throw new Error('슬랙 서비스에서 전송에 실패했습니다.');
    }
  } catch (error) {
    console.error('❌ 슬랙 알림 전송 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '슬랙 알림 전송 실패',
        details:
          error instanceof Error
            ? error.stack
            : '알 수 없는 오류가 발생했습니다.',
        messageId: null,
        timestamp: new Date().toISOString(),
        channel: SLACK_CHANNEL,
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 슬랙 상태 확인 (개선)
export async function GET() {
  try {
    const status = slackNotificationService.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        enabled: status.enabled,
        webhook: status.webhook,
        channel: SLACK_CHANNEL, // 고정 채널 표시
        alertsSent: status.alertsSent,
        lastCheck: new Date().toISOString(),
        serviceStatus: 'active',
      },
    });
  } catch (error) {
    console.error('❌ 슬랙 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '슬랙 상태 확인 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        data: {
          enabled: false,
          webhook: false,
          channel: SLACK_CHANNEL,
          alertsSent: 0,
          lastCheck: new Date().toISOString(),
          serviceStatus: 'error',
        },
      },
      { status: 500 }
    );
  }
}
