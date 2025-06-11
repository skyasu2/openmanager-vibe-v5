import { NextRequest, NextResponse } from 'next/server';

/**
 * 📱 Slack Webhook 연결 테스트 API
 *
 * GET /api/test/slack - Webhook 설정 상태 확인
 * POST /api/test/slack - 테스트 메시지 전송
 */

export async function GET() {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    const channel = process.env.SLACK_DEFAULT_CHANNEL || '#server-alerts';

    const status = {
      configured: !!webhookUrl,
      webhookLength: webhookUrl ? webhookUrl.length : 0,
      webhookMasked: webhookUrl
        ? `${webhookUrl.substring(0, 30)}...${webhookUrl.slice(-10)}`
        : null,
      channel,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: '🔍 Slack 설정 상태를 확인했습니다',
      data: status,
    });
  } catch (error) {
    console.error('❌ Slack 설정 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        message: '❌ Slack 설정 확인 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          message: '❌ SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다',
          help: '환경변수를 설정한 후 다시 시도해주세요',
        },
        { status: 400 }
      );
    }

    // 요청 본문에서 사용자 정의 메시지 가져오기 (선택사항)
    let customMessage = '';
    try {
      const body = await request.json();
      customMessage = body.message || '';
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }

    const testMessage = {
      text: customMessage || `✅ OpenManager Vibe v5 Slack 연결 테스트 성공!`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🧪 Slack Webhook 테스트',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              customMessage ||
              '✅ *OpenManager Vibe v5*에서 보내는 테스트 메시지입니다.\n\n🔗 Webhook 연결이 정상적으로 작동하고 있습니다!',
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⏰ 테스트 시간: ${new Date().toLocaleString('ko-KR')}`,
            },
            {
              type: 'mrkdwn',
              text: `🌍 환경: ${process.env.NODE_ENV || 'development'}`,
            },
          ],
        },
      ],
    };

    console.log('📤 Slack 테스트 메시지 전송 시도...');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        ...testMessage,
        channel: process.env.SLACK_DEFAULT_CHANNEL || '#server-alerts',
        username: 'OpenManager Test Bot',
        icon_emoji: ':test_tube:',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`
      );
    }

    console.log('✅ Slack 테스트 메시지 전송 성공');

    return NextResponse.json({
      success: true,
      message: '✅ Slack 테스트 메시지가 성공적으로 전송되었습니다!',
      data: {
        channel: process.env.SLACK_DEFAULT_CHANNEL || '#server-alerts',
        sentAt: new Date().toISOString(),
        responseStatus: response.status,
        webhookConfigured: true,
      },
    });
  } catch (error) {
    console.error('❌ Slack 테스트 메시지 전송 실패:', error);

    return NextResponse.json(
      {
        success: false,
        message: '❌ Slack 테스트 메시지 전송에 실패했습니다',
        error: error instanceof Error ? error.message : String(error),
        help: [
          '1. SLACK_WEBHOOK_URL 환경변수가 올바르게 설정되었는지 확인',
          '2. 새로운 Webhook URL을 Slack에서 생성했는지 확인',
          '3. 채널 권한이 올바르게 설정되었는지 확인',
        ],
      },
      { status: 500 }
    );
  }
}
