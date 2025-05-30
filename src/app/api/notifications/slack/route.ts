/**
 * 📱 Slack 알림 관리 API
 * GET /api/notifications/slack - 상태 조회
 * POST /api/notifications/slack - 알림 전송
 * PUT /api/notifications/slack - 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api/errorHandler';
import { slackNotificationService } from '../../../../services/SlackNotificationService';

/**
 * 📊 Slack 알림 상태 조회 (GET)
 */
async function getSlackStatusHandler(request: NextRequest) {
  try {
    console.log('📱 Slack 알림 상태 조회');

    const status = slackNotificationService.getStatus();

    return createSuccessResponse({
      slack: {
        service: 'SlackNotificationService',
        status: status.enabled ? 'active' : 'inactive',
        configuration: {
          webhookConfigured: status.webhook,
          channel: status.channel,
          alertsSent: status.alertsSent
        },
        features: [
          '서버 장애 알림',
          '메모리 사용률 경고',
          '시스템 상태 변화 알림',
          '주간 리포트'
        ]
      },
      setup: {
        required: [
          'SLACK_WEBHOOK_URL 환경변수 설정',
          'SLACK_DEFAULT_CHANNEL 환경변수 설정 (선택사항)'
        ],
        example: {
          webhookUrl: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
          channel: '#openmanager-alerts'
        }
      }
    }, 'Slack 알림 상태 조회 완료');

  } catch (error) {
    console.error('❌ Slack 상태 조회 실패:', error);
    return createErrorResponse(
      `Slack 상태 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
}

/**
 * 📤 Slack 알림 전송 (POST)
 */
async function sendSlackNotificationHandler(request: NextRequest) {
  try {
    console.log('📤 Slack 알림 전송 요청');

    const body = await request.json();
    const { type, data } = body;

    let success = false;
    let message = '';

    switch (type) {
      case 'server_alert':
        success = await slackNotificationService.sendServerAlert({
          serverId: data.serverId,
          hostname: data.hostname,
          metric: data.metric,
          value: data.value,
          threshold: data.threshold,
          severity: data.severity,
          timestamp: new Date().toISOString()
        });
        message = '서버 알림 전송 완료';
        break;

      case 'memory_alert':
        success = await slackNotificationService.sendMemoryAlert({
          usagePercent: data.usagePercent,
          heapUsed: data.heapUsed,
          heapTotal: data.heapTotal,
          severity: data.severity,
          timestamp: new Date().toISOString()
        });
        message = '메모리 알림 전송 완료';
        break;

      case 'system_notification':
        success = await slackNotificationService.sendSystemNotification(
          data.message,
          data.severity || 'info'
        );
        message = '시스템 알림 전송 완료';
        break;

      case 'weekly_report':
        success = await slackNotificationService.sendWeeklyReport({
          totalServers: data.totalServers || 0,
          averageUptime: data.averageUptime || 0,
          memoryOptimizations: data.memoryOptimizations || 0,
          criticalAlerts: data.criticalAlerts || 0,
          warningAlerts: data.warningAlerts || 0
        });
        message = '주간 리포트 전송 완료';
        break;

      default:
        return createErrorResponse('지원하지 않는 알림 타입입니다');
    }

    if (success) {
      return createSuccessResponse({
        sent: true,
        type,
        message,
        timestamp: new Date().toISOString()
      }, message);
    } else {
      return createErrorResponse('Slack 알림 전송 실패 - 웹훅 설정을 확인하세요');
    }

  } catch (error) {
    console.error('❌ Slack 알림 전송 실패:', error);
    return createErrorResponse(
      `Slack 알림 전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
}

/**
 * ⚙️ Slack 설정 업데이트 (PUT)
 */
async function updateSlackConfigHandler(request: NextRequest) {
  try {
    console.log('⚙️ Slack 설정 업데이트');

    const body = await request.json();
    const { webhookUrl, defaultChannel } = body;

    if (!webhookUrl) {
      return createErrorResponse('webhookUrl이 필요합니다');
    }

    // 웹훅 URL 검증
    if (!webhookUrl.startsWith('https://hooks.slack.com/services/')) {
      return createErrorResponse('유효하지 않은 Slack 웹훅 URL입니다');
    }

    // 설정 업데이트
    slackNotificationService.updateConfig(webhookUrl, defaultChannel);

    // 테스트 알림 전송
    const testSuccess = await slackNotificationService.sendSystemNotification(
      '✅ OpenManager Slack 알림이 성공적으로 설정되었습니다!',
      'info'
    );

    return createSuccessResponse({
      updated: true,
      configuration: {
        webhookUrl: webhookUrl.substring(0, 50) + '...',
        channel: defaultChannel || '#openmanager-alerts',
        testNotificationSent: testSuccess
      },
      status: slackNotificationService.getStatus()
    }, 'Slack 설정 업데이트 완료');

  } catch (error) {
    console.error('❌ Slack 설정 업데이트 실패:', error);
    return createErrorResponse(
      `Slack 설정 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
}

// 에러 핸들러로 래핑
export const GET = withErrorHandler(getSlackStatusHandler);
export const POST = withErrorHandler(sendSlackNotificationHandler);
export const PUT = withErrorHandler(updateSlackConfigHandler); 