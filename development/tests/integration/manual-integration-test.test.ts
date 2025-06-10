import { describe, it, expect, beforeAll } from 'vitest';
import { SlackNotificationService } from '@/services/SlackNotificationService';

/**
 * 🧪 수동 통합 테스트 - 실제 API 키와 웹훅으로 테스트
 * 환경변수를 직접 설정하여 실제 연동을 확인합니다.
 */
describe('Manual Integration Test', () => {
  beforeAll(() => {
    // 환경변수 직접 설정
    process.env.GOOGLE_AI_API_KEY = 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM';
    process.env.GOOGLE_AI_ENABLED = 'true';
    process.env.GOOGLE_AI_MODEL = 'gemini-1.5-flash';
    process.env.GOOGLE_AI_BETA_MODE = 'true';
    process.env.SLACK_WEBHOOK_URL =
      'https://hooks.slack.com/services/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';
    process.env.SLACK_DEFAULT_CHANNEL = '#openmanager-alerts';
    process.env.GEMINI_LEARNING_ENABLED = 'true';

    // 기존 싱글톤 인스턴스 초기화
    (SlackNotificationService as any).instance = null;

    console.log('🔧 환경변수 설정 완료');
    console.log(
      '- GOOGLE_AI_API_KEY:',
      process.env.GOOGLE_AI_API_KEY ? '✅ 설정됨' : '❌ 없음'
    );
    console.log(
      '- SLACK_WEBHOOK_URL:',
      process.env.SLACK_WEBHOOK_URL ? '✅ 설정됨' : '❌ 없음'
    );
  });

  it('환경변수가 올바르게 설정되었는지 확인한다', () => {
    expect(process.env.GOOGLE_AI_API_KEY).toBeDefined();
    expect(process.env.GOOGLE_AI_API_KEY).toBe(
      'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM'
    );
    expect(process.env.SLACK_WEBHOOK_URL).toBeDefined();
    expect(process.env.SLACK_WEBHOOK_URL).toContain('hooks.slack.com');
    expect(process.env.GOOGLE_AI_ENABLED).toBe('true');
  });

  it('SlackNotificationService가 웹훅을 감지한다', () => {
    const slackService = SlackNotificationService.getInstance();
    const status = slackService.getStatus();

    expect(status.enabled).toBe(true);
    expect(status.webhook).toBe(true);

    console.log('📊 슬랙 서비스 상태:', status);
  });

  it.skip('SlackNotificationService 실제 알림 전송을 테스트한다', async () => {
    const slackService = SlackNotificationService.getInstance();

    const result = await slackService.sendSystemNotification(
      '🧪 OpenManager Vibe v5 - 통합 테스트 성공!\n✅ 구글 AI API 및 슬랙 알림이 정상적으로 연동되었습니다.',
      'info'
    );

    expect(result).toBe(true);
    console.log('✅ 슬랙 알림 전송 성공!');
  }, 15000); // 15초 타임아웃

  it('Google AI API 키 설정을 확인한다', () => {
    const hasGoogleAI = !!process.env.GOOGLE_AI_API_KEY;
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    expect(hasGoogleAI).toBe(true);
    expect(apiKey).toBeDefined();
    if (apiKey) {
      expect(apiKey.length).toBeGreaterThan(30); // Google AI API 키는 보통 39자
      expect(apiKey.startsWith('AIza')).toBe(true); // Google AI API 키 접두사
    }

    console.log('🤖 구글 AI API 키 검증 완료');
  });

  it.skip('서버 알림 전송을 테스트한다', async () => {
    const slackService = SlackNotificationService.getInstance();

    const serverAlert = {
      serverId: 'test-server-001',
      hostname: 'openmanager-test.example.com',
      metric: 'cpu',
      value: 85,
      threshold: 80,
      severity: 'warning' as const,
      timestamp: new Date().toISOString(),
    };

    const result = await slackService.sendServerAlert(serverAlert);
    expect(result).toBe(true);

    console.log('📊 서버 알림 전송 성공!');
  }, 15000);

  it.skip('메모리 알림 전송을 테스트한다', async () => {
    const slackService = SlackNotificationService.getInstance();

    const memoryAlert = {
      usagePercent: 92,
      heapUsed: 512, // MB 단위로 수정
      heapTotal: 1024, // MB 단위로 수정
      severity: 'critical' as const,
      timestamp: new Date().toISOString(),
    };

    const result = await slackService.sendMemoryAlert(memoryAlert);
    expect(result).toBe(true);

    console.log('🧠 메모리 알림 전송 성공!');
  }, 15000);
});
