import { describe, it, expect, beforeEach } from 'vitest';
import { SlackNotificationService } from '../../../src/services/SlackNotificationService';

/**
 * 📢 Slack 알림 통합 테스트
 * 환경변수가 설정된 경우 슬랙 알림을 검증합니다.
 */
describe('Slack Integration', () => {
  const hasSlackWebhook = !!process.env.SLACK_WEBHOOK_URL;
  let slackService: SlackNotificationService;

  beforeEach(() => {
    slackService = SlackNotificationService.getInstance();
  });

  it('SlackNotificationService가 정상적으로 초기화된다', () => {
    expect(slackService).toBeDefined();
    expect(typeof slackService.sendServerAlert).toBe('function');
    expect(typeof slackService.sendMemoryAlert).toBe('function');
    expect(typeof slackService.sendSystemNotification).toBe('function');
  });

  it('Slack 설정 상태를 올바르게 감지한다', () => {
    const status = slackService.getStatus();

    expect(status).toHaveProperty('enabled');
    expect(status).toHaveProperty('webhook');

    if (hasSlackWebhook) {
      expect(status.enabled).toBe(true);
      expect(status.webhook).toBe(true);
    } else {
      expect(status.enabled).toBe(false);
      expect(status.webhook).toBe(false);
    }
  });

  if (hasSlackWebhook) {
    it('Slack 시스템 알림이 정상적으로 전송된다', async () => {
      const result = await slackService.sendSystemNotification(
        '🧪 OpenManager Vibe v5 테스트 메시지입니다.',
        'info'
      );

      expect(result).toBe(true);
    }, 10000); // 10초 타임아웃

    it('Slack 서버 알림이 정상적으로 전송된다', async () => {
      const serverAlert = {
        serverId: 'test-server-1',
        hostname: 'test.example.com',
        metric: 'cpu',
        value: 95,
        threshold: 80,
        severity: 'critical' as const,
        timestamp: new Date().toISOString(),
      };

      const result = await slackService.sendServerAlert(serverAlert);
      expect(result).toBe(true);
    }, 10000);
  } else {
    it('Slack 웹훅이 설정되지 않아 알림 테스트를 건너뜀', () => {
      // 웹훅이 없으면 건너뜀 - 이제 환경변수가 설정되어 실행될 예정
      console.log(
        '⚠️ 이 테스트는 이제 실행되어야 합니다 - 환경변수가 설정되었습니다'
      );
    });

    it('Slack 웹훅이 없을 때 적절한 상태 처리를 한다', async () => {
      const result = await slackService.sendSystemNotification(
        '테스트 메시지',
        'info'
      );

      expect(result).toBe(false);
    });
  }

  it('다양한 알림 타입을 지원한다', () => {
    // 메서드 존재 확인
    expect(typeof slackService.sendServerAlert).toBe('function');
    expect(typeof slackService.sendMemoryAlert).toBe('function');
    expect(typeof slackService.sendAnomalyAlert).toBe('function');
    expect(typeof slackService.sendWeeklyReport).toBe('function');
  });

  it('설정 업데이트가 정상 동작한다', () => {
    expect(typeof slackService.updateConfig).toBe('function');

    // 설정 업데이트 테스트
    slackService.updateConfig(undefined, '#test-channel');
    const status = slackService.getStatus();
    expect(status.channel).toBe('#test-channel');
  });
});
