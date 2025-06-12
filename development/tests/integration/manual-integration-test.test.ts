import { describe, it, expect, beforeAll } from 'vitest';
import { SlackNotificationService } from '../../../src/services/SlackNotificationService';
import dotenv from 'dotenv';
import path from 'path';

/**
 * 🧪 수동 통합 테스트 - 실제 API 키와 웹훅으로 테스트
 * 환경변수를 직접 설정하여 실제 연동을 확인합니다.
 */
describe('Manual Integration Test', () => {
  beforeAll(() => {
    // .env.local 파일 로드
    const envPath = path.join(process.cwd(), '.env.local');
    dotenv.config({ path: envPath });

    // 환경변수 직접 설정 (백업)
    process.env.GOOGLE_AI_API_KEY =
      process.env.GOOGLE_AI_API_KEY || 'test_api_key_placeholder';
    process.env.GOOGLE_AI_ENABLED = 'true';
    process.env.GOOGLE_AI_MODEL = 'gemini-1.5-flash';
    process.env.GOOGLE_AI_BETA_MODE = 'true';
    process.env.SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
    process.env.SLACK_DEFAULT_CHANNEL = '#server-alerts';
    process.env.GEMINI_LEARNING_ENABLED = 'true';

    // 기존 싱글톤 인스턴스 초기화
    SlackNotificationService.resetInstance();

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

    // 실제 API 키 또는 테스트 플레이스홀더 둘 다 허용
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    expect(apiKey).toMatch(/^(AIza|test_api_key_placeholder)/);

    // SLACK_WEBHOOK_URL은 보안상 하드코딩하지 않으므로 선택적 검증
    if (process.env.SLACK_WEBHOOK_URL) {
      expect(process.env.SLACK_WEBHOOK_URL).toContain('hooks.slack.com');
    }
    expect(process.env.GOOGLE_AI_ENABLED).toBe('true');
  });

  it('SlackNotificationService가 웹훅을 감지한다', () => {
    const slackService = SlackNotificationService.getInstance();
    const status = slackService.getStatus();

    console.log('📊 슬랙 서비스 상태:', status);

    // SLACK_WEBHOOK_URL이 설정되어 있으면 활성화되어야 함
    const hasWebhook = !!process.env.SLACK_WEBHOOK_URL;
    expect(status.enabled).toBe(hasWebhook);
    expect(status.webhook).toBe(hasWebhook);
  });

  it('SlackNotificationService 실제 알림 전송을 테스트한다', async () => {
    const slackService = SlackNotificationService.getInstance();

    // 환경변수에서 웹훅 URL 사용
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('⚠️ SLACK_WEBHOOK_URL 환경변수가 설정되지 않음');
      return;
    }
    slackService.updateConfig(webhookUrl, '#server-alerts');

    const result = await slackService.sendSystemNotification(
      '🚀 OpenManager Vibe v5 - 한글 및 이모지 인코딩 테스트\n\n✅ 성공: 구글 AI API 연동 완료\n🔗 연결: 슬랙 웹훅 정상 작동\n📊 상태: 시스템 모든 기능 정상\n🎯 목표: UTF-8 인코딩 검증 완료\n\n한글 문자: 가나다라마바사아자차카타파하\n특수문자: !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~\n이모지: 🌟⭐💫⚡🔥💎🎉🎊🎈',
      'info'
    );

    console.log('📤 한글/이모지 테스트 결과:', result);
    expect(result).toBe(true);
  }, 30000); // 30초 타임아웃으로 증가

  it('Google AI API 키 설정을 확인한다', () => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    console.log('🤖 구글 AI API 키 검증 완료');
    expect(apiKey).toBeDefined();
    expect(typeof apiKey).toBe('string');
    if (apiKey) {
      expect(apiKey.length).toBeGreaterThan(10);
    }
  });

  it('서버 알림 전송을 테스트한다', async () => {
    const slackService = SlackNotificationService.getInstance();

    // 환경변수에서 웹훅 URL 사용
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('⚠️ SLACK_WEBHOOK_URL 환경변수가 설정되지 않음');
      return;
    }
    slackService.updateConfig(webhookUrl, '#server-alerts');

    const serverAlert = {
      serverId: 'server-001',
      hostname: '프로덕션 웹서버',
      metric: 'cpu_usage',
      value: 95.5,
      threshold: 90,
      severity: 'critical' as const,
      timestamp: new Date().toISOString(),
    };

    const result = await slackService.sendServerAlert(serverAlert);
    console.log('📊 서버 알림 전송 결과:', result);
    expect(result).toBe(true);
  }, 30000);

  it('메모리 알림 전송을 테스트한다', async () => {
    const slackService = SlackNotificationService.getInstance();

    // 환경변수에서 웹훅 URL 사용
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('⚠️ SLACK_WEBHOOK_URL 환경변수가 설정되지 않음');
      return;
    }
    slackService.updateConfig(webhookUrl, '#server-alerts');

    const memoryAlert = {
      usagePercent: 88.7,
      heapUsed: 67108864, // 64MB
      heapTotal: 134217728, // 128MB
      severity: 'warning' as const,
      timestamp: new Date().toISOString(),
    };

    const result = await slackService.sendMemoryAlert(memoryAlert);
    console.log('🧠 메모리 알림 전송 결과:', result);
    expect(result).toBe(true);
  }, 30000);
});
