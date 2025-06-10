/**
 * 🔔 알림 설정 API
 */

import { NextRequest, NextResponse } from 'next/server';

// 알림 설정 타입
interface NotificationConfig {
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    channel: string;
    username: string;
    severity: string[];
  };
  email: {
    enabled: boolean;
    smtp: {
      host?: string;
      port?: number;
      username?: string;
    };
    recipients: string[];
  };
  webhook: {
    enabled: boolean;
    urls: string[];
    headers: Record<string, string>;
  };
  schedule: {
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    throttle: {
      enabled: boolean;
      maxPerHour: number;
    };
  };
}

// 기본 알림 설정
const DEFAULT_CONFIG: NotificationConfig = {
  slack: {
    enabled: true,
    channel: '#alerts',
    username: 'OpenManager Bot',
    severity: ['warning', 'error', 'critical'],
  },
  email: {
    enabled: false,
    smtp: {},
    recipients: [],
  },
  webhook: {
    enabled: false,
    urls: [],
    headers: {},
  },
  schedule: {
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    throttle: {
      enabled: true,
      maxPerHour: 10,
    },
  },
};

/**
 * 🔍 알림 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 실제로는 데이터베이스에서 가져오지만, 지금은 시뮬레이션
    const config = DEFAULT_CONFIG;

    // 웹훅 URL 등 민감한 정보는 마스킹
    const safeConfig = {
      ...config,
      slack: {
        ...config.slack,
        webhookUrl: config.slack.webhookUrl ? '***masked***' : undefined,
      },
    };

    return NextResponse.json({
      success: true,
      data: safeConfig,
      message: '알림 설정을 성공적으로 조회했습니다.',
      stats: {
        totalSent: 1247,
        lastSent: new Date(Date.now() - 3600000).toISOString(),
        failureRate: 2.3,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '알림 설정 조회 실패',
        message: 'API 호출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * ⚙️ 알림 설정 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 설정 검증
    const updatedConfig = {
      ...DEFAULT_CONFIG,
      ...body,
    };

    // 슬랙 웹훅 URL 유효성 검사
    if (updatedConfig.slack.enabled && updatedConfig.slack.webhookUrl) {
      if (
        !updatedConfig.slack.webhookUrl.startsWith('https://hooks.slack.com/')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: '유효하지 않은 슬랙 웹훅 URL입니다.',
          },
          { status: 400 }
        );
      }
    }

    // 이메일 설정 검증
    if (
      updatedConfig.email.enabled &&
      updatedConfig.email.recipients.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: '이메일 알림을 활성화하려면 최소 1개의 수신자가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 실제로는 데이터베이스에 저장
    console.log('🔧 알림 설정 업데이트:', updatedConfig);

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: '알림 설정이 성공적으로 업데이트되었습니다.',
      appliedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '알림 설정 업데이트 실패',
        message: 'API 호출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 테스트 알림 전송
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'test' } = body;

    // 테스트 알림 시뮬레이션
    console.log(`🔔 테스트 알림 전송: ${type}`);

    return NextResponse.json({
      success: true,
      message: '테스트 알림이 성공적으로 전송되었습니다.',
      sentAt: new Date().toISOString(),
      channels: ['slack', 'webhook'],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '테스트 알림 전송 실패',
        message: 'API 호출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
