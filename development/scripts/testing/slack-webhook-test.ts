/**
 * 🧪 Slack Webhook 테스트 유틸리티
 * OpenManager Vibe v5 - 실제 Slack 알림 테스트
 */

interface SlackTestMessage {
  text: string;
  blocks?: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

/**
 * Slack 웹훅 연결 테스트
 * @param message 테스트 메시지 (기본값: '🧪 OpenManager 테스트')
 * @param webhookUrl 웹훅 URL (환경변수에서 자동 가져옴)
 */
export const testSlackWebhook = async (
  message = '🧪 OpenManager 테스트',
  webhookUrl?: string
): Promise<{ success: boolean; error?: string; status?: number }> => {
  const url = webhookUrl || process.env.SLACK_WEBHOOK_URL;

  if (!url) {
    return {
      success: false,
      error: 'SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다.',
    };
  }

  const payload: SlackTestMessage = {
    text: `${message}`,
    username: 'OpenManager Bot',
    icon_emoji: ':robot_face:',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🧪 OpenManager Vibe v5 - 테스트 메시지',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*메시지:* ${message}\n*시각:* ${new Date().toLocaleString('ko-KR')}\n*환경:* ${process.env.NODE_ENV || 'development'}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '✅ Slack 통합이 정상적으로 작동하고 있습니다!',
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    return {
      success: true,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
};

/**
 * 다양한 유형의 Slack 알림 테스트
 */
export const testSlackAlertTypes = async (): Promise<{
  serverAlert: boolean;
  memoryAlert: boolean;
  systemAlert: boolean;
  anomalyAlert: boolean;
}> => {
  const results = {
    serverAlert: false,
    memoryAlert: false,
    systemAlert: false,
    anomalyAlert: false,
  };

  // 1. 서버 알림 테스트
  try {
    const serverResult = await testSlackWebhook(
      '🖥️ 서버 CPU 사용률 경고 (테스트)'
    );
    results.serverAlert = serverResult.success;
  } catch (error) {
    console.error('서버 알림 테스트 실패:', error);
  }

  // 2. 메모리 알림 테스트
  try {
    const memoryResult = await testSlackWebhook(
      '🧠 메모리 사용률 90% 초과 (테스트)'
    );
    results.memoryAlert = memoryResult.success;
  } catch (error) {
    console.error('메모리 알림 테스트 실패:', error);
  }

  // 3. 시스템 알림 테스트
  try {
    const systemResult = await testSlackWebhook(
      '⚙️ 시스템 상태 변화 감지 (테스트)'
    );
    results.systemAlert = systemResult.success;
  } catch (error) {
    console.error('시스템 알림 테스트 실패:', error);
  }

  // 4. 이상 탐지 알림 테스트
  try {
    const anomalyResult = await testSlackWebhook(
      '🔍 AI 이상 패턴 감지 (테스트)'
    );
    results.anomalyAlert = anomalyResult.success;
  } catch (error) {
    console.error('이상 탐지 알림 테스트 실패:', error);
  }

  return results;
};

/**
 * 환경별 Slack 설정 검증
 */
export const validateSlackConfig = (): {
  valid: boolean;
  issues: string[];
  config: {
    webhookUrl: boolean;
    channel: string;
    enabled: boolean;
  };
} => {
  const issues: string[] = [];
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const channel = process.env.SLACK_DEFAULT_CHANNEL || '#openmanager-alerts';
  const enabled = !!webhookUrl;

  if (!webhookUrl) {
    issues.push('SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다.');
  } else if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
    issues.push('SLACK_WEBHOOK_URL 형식이 올바르지 않습니다.');
  }

  if (!channel.startsWith('#')) {
    issues.push('SLACK_DEFAULT_CHANNEL은 #으로 시작해야 합니다.');
  }

  return {
    valid: issues.length === 0,
    issues,
    config: {
      webhookUrl: !!webhookUrl,
      channel,
      enabled,
    },
  };
};

/**
 * CLI에서 실행 가능한 테스트 함수
 */
export const runSlackTest = async (): Promise<void> => {
  console.log('🧪 Slack 웹훅 테스트 시작...\n');

  // 1. 설정 검증
  console.log('1️⃣ 설정 검증');
  const validation = validateSlackConfig();
  console.log(
    `   ✅ 웹훅 URL: ${validation.config.webhookUrl ? '설정됨' : '❌ 미설정'}`
  );
  console.log(`   ✅ 채널: ${validation.config.channel}`);
  console.log(
    `   ✅ 활성화: ${validation.config.enabled ? '예' : '❌ 아니오'}`
  );

  if (!validation.valid) {
    console.log('\n❌ 설정 문제:');
    validation.issues.forEach(issue => console.log(`   - ${issue}`));
    return;
  }

  // 2. 기본 웹훅 테스트
  console.log('\n2️⃣ 기본 웹훅 테스트');
  const basicTest = await testSlackWebhook(
    '✨ OpenManager Vibe v5 기본 연결 테스트'
  );
  console.log(
    `   ${basicTest.success ? '✅' : '❌'} 기본 테스트: ${basicTest.success ? '성공' : basicTest.error}`
  );

  // 3. 다양한 알림 유형 테스트
  console.log('\n3️⃣ 알림 유형별 테스트');
  const typeTests = await testSlackAlertTypes();
  console.log(`   ${typeTests.serverAlert ? '✅' : '❌'} 서버 알림`);
  console.log(`   ${typeTests.memoryAlert ? '✅' : '❌'} 메모리 알림`);
  console.log(`   ${typeTests.systemAlert ? '✅' : '❌'} 시스템 알림`);
  console.log(`   ${typeTests.anomalyAlert ? '✅' : '❌'} 이상 탐지 알림`);

  const allSuccess =
    Object.values(typeTests).every(Boolean) && basicTest.success;

  console.log('\n🎉 테스트 완료!');
  console.log(
    `📊 결과: ${allSuccess ? '✅ 모든 테스트 통과' : '❌ 일부 테스트 실패'}`
  );
};

// CLI에서 직접 실행될 때
if (require.main === module) {
  runSlackTest().catch(console.error);
}
