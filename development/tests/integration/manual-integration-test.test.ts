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
      process.env.GOOGLE_AI_API_KEY ||
      'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM';
    process.env.GOOGLE_AI_ENABLED = 'true';
    process.env.GOOGLE_AI_MODEL = 'gemini-1.5-flash';
    process.env.GOOGLE_AI_BETA_MODE = 'true';
    process.env.SLACK_WEBHOOK_URL =
      process.env.SLACK_WEBHOOK_URL ||
      'https://hooks.slack.com/services/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';
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

    console.log('📊 슬랙 서비스 상태:', status);

    expect(status.enabled).toBe(true);
    expect(status.webhook).toBe(true);
  });

  it('SlackNotificationService 실제 알림 전송을 테스트한다', async () => {
    const slackService = SlackNotificationService.getInstance();

    // 새로운 웹훅 URL로 업데이트
    slackService.updateConfig(
      'https://hooks.slack.com/services/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',
      '#server-alerts'
    );

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
    expect(apiKey.length).toBeGreaterThan(10);
  });

  it('서버 알림 전송을 테스트한다', async () => {
    const slackService = SlackNotificationService.getInstance();

    // 새로운 웹훅 URL로 업데이트
    slackService.updateConfig(
      'https://hooks.slack.com/services/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',
      '#server-alerts'
    );

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

    // 새로운 웹훅 URL로 업데이트
    slackService.updateConfig(
      'https://hooks.slack.com/services/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',
      '#server-alerts'
    );

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
