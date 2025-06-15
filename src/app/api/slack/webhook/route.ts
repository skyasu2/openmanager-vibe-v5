import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * 🛡️ 보안 강화 Slack Webhook API
 *
 * OpenManager Vibe v5 - 서버 모니터링 알림 시스템
 *
 * 보안 기능:
 * - 환경변수 기반 설정 (하드코딩 금지)
 * - Rate Limiting (1분에 10회 제한)
 * - 입력값 검증 및 Sanitization
 * - 민감한 정보 노출 방지
 * - 서버 사이드 전용 실행
 */

// Rate Limiting을 위한 메모리 기반 스토어
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 입력값 검증을 위한 스키마
interface ServerStatusRequest {
  server_name: string;
  status: 'normal' | 'warning' | 'critical';
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  timestamp?: string;
  custom_message?: string;
}

/**
 * 🔒 보안 유틸리티 함수들
 */
class SecurityUtils {
  /**
   * 📝 입력값 Sanitization
   */
  static sanitizeString(input: string, maxLength: number = 200): string {
    if (typeof input !== 'string') return '';

    return input
      .slice(0, maxLength)
      .replace(/[<>\"'&]/g, '') // XSS 방지
      .trim();
  }

  /**
   * 🚦 Rate Limiting 검사
   */
  static checkRateLimit(clientId: string): {
    allowed: boolean;
    remaining: number;
  } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1분
    const maxRequests = 10;

    // 이전 기록 정리
    rateLimitStore.forEach((value, key) => {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    });

    const clientData = rateLimitStore.get(clientId);

    if (!clientData) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (now > clientData.resetTime) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (clientData.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    clientData.count++;
    return { allowed: true, remaining: maxRequests - clientData.count };
  }

  /**
   * ✅ 서버 상태 데이터 검증
   */
  static validateServerStatus(data: any): {
    valid: boolean;
    errors: string[];
    sanitized?: ServerStatusRequest;
  } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('요청 데이터가 올바르지 않습니다');
      return { valid: false, errors };
    }

    // 필수 필드 검증
    if (!data.server_name || typeof data.server_name !== 'string') {
      errors.push('server_name은 필수 문자열 필드입니다');
    }

    if (!['normal', 'warning', 'critical'].includes(data.status)) {
      errors.push('status는 normal, warning, critical 중 하나여야 합니다');
    }

    // 숫자 필드 검증
    const numericFields = ['cpu_usage', 'memory_usage', 'disk_usage'];
    for (const field of numericFields) {
      const value = data[field];
      if (typeof value !== 'number' || value < 0 || value > 100) {
        errors.push(`${field}는 0-100 사이의 숫자여야 합니다`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Sanitization 적용
    const sanitized: ServerStatusRequest = {
      server_name: this.sanitizeString(data.server_name, 50),
      status: data.status,
      cpu_usage: Math.round(data.cpu_usage * 100) / 100,
      memory_usage: Math.round(data.memory_usage * 100) / 100,
      disk_usage: Math.round(data.disk_usage * 100) / 100,
      timestamp: data.timestamp || new Date().toISOString(),
      custom_message: data.custom_message
        ? this.sanitizeString(data.custom_message, 500)
        : undefined,
    };

    return { valid: true, errors: [], sanitized };
  }
}

/**
 * 🎨 Slack 메시지 포맷터
 */
class SlackMessageFormatter {
  /**
   * 🏥 서버 상태에 따른 색상 및 이모지
   */
  static getStatusConfig(status: string) {
    const configs = {
      normal: { color: '#36a64f', emoji: '🟢', label: '정상' },
      warning: { color: '#ff9900', emoji: '🟡', label: '주의' },
      critical: { color: '#ff0000', emoji: '🔴', label: '위험' },
    };
    return configs[status as keyof typeof configs] || configs.normal;
  }

  /**
   * 📊 사용률에 따른 진행 바 생성
   */
  static createProgressBar(usage: number): string {
    const barLength = 10;
    const filled = Math.round((usage / 100) * barLength);
    const empty = barLength - filled;

    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${usage}%`;
  }

  /**
   * 📝 Slack 메시지 생성
   */
  static createMessage(data: ServerStatusRequest) {
    const statusConfig = this.getStatusConfig(data.status);

    const message = {
      text: `${statusConfig.emoji} 서버 알림: ${data.server_name} - ${statusConfig.label}`,
      attachments: [
        {
          color: statusConfig.color,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${statusConfig.emoji} 서버 모니터링 알림`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*서버명:*\n${data.server_name}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*상태:*\n${statusConfig.emoji} ${statusConfig.label}`,
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text:
                  `*📊 시스템 사용률*\n` +
                  `CPU: ${this.createProgressBar(data.cpu_usage)}\n` +
                  `메모리: ${this.createProgressBar(data.memory_usage)}\n` +
                  `디스크: ${this.createProgressBar(data.disk_usage)}`,
              },
            },
          ],
        },
      ],
    };

    // 사용자 정의 메시지가 있는 경우 추가
    if (data.custom_message) {
      message.attachments[0].blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📝 추가 정보:*\n${data.custom_message}`,
        },
      });
    }

    // 컨텍스트 정보 추가
    (message.attachments[0].blocks as any).push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `⏰ ${new Date(data.timestamp!).toLocaleString('ko-KR')}`,
        },
        {
          type: 'mrkdwn',
          text: `🏷️ OpenManager Vibe v5`,
        },
      ],
    });

    return message;
  }
}

/**
 * 📤 POST /api/slack/webhook
 * 보안 강화 서버 상태 알림 전송
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 🔒 환경변수 검증
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    const rateLimit = parseInt(process.env.SLACK_RATE_LIMIT || '10');
    const timeout = parseInt(process.env.SLACK_TIMEOUT || '5000');

    if (!webhookUrl) {
      console.error('❌ SLACK_WEBHOOK_URL 환경변수가 설정되지 않음');
      return NextResponse.json(
        {
          success: false,
          error: 'Slack Webhook이 설정되지 않았습니다',
          code: 'WEBHOOK_NOT_CONFIGURED',
        },
        { status: 400 }
      );
    }

    // 🚦 클라이언트 식별 및 Rate Limiting
    const headersList = await headers();
    const clientIP =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';
    const userAgent = headersList.get('user-agent') || '';
    const clientId = `${clientIP}-${userAgent.substring(0, 50)}`;

    const rateLimitResult = SecurityUtils.checkRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      console.warn(`🚫 Rate limit exceeded for client: ${clientId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Too Many Requests - Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 60),
          },
        }
      );
    }

    // 📝 요청 데이터 파싱 및 검증
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 JSON 형식입니다',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    const validation = SecurityUtils.validateServerStatus(requestData);
    if (!validation.valid) {
      console.warn('❌ 입력값 검증 실패:', validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: '입력값 검증 실패',
          code: 'VALIDATION_ERROR',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const sanitizedData = validation.sanitized!;

    // 📊 Slack 메시지 생성
    const slackMessage = SlackMessageFormatter.createMessage(sanitizedData);

    // 📤 Slack으로 메시지 전송
    console.log(
      `📤 Slack 알림 전송 시작: ${sanitizedData.server_name} (${sanitizedData.status})`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'OpenManager-Vibe-v5/1.0',
      },
      body: JSON.stringify({
        ...slackMessage,
        channel: process.env.SLACK_DEFAULT_CHANNEL || '#server-alerts',
        username: 'OpenManager Bot',
        icon_emoji: ':robot_face:',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'Unknown Slack API error');
      throw new Error(`Slack API Error: ${response.status} - ${errorText}`);
    }

    const processingTime = Date.now() - startTime;

    console.log(
      `✅ Slack 알림 전송 성공: ${sanitizedData.server_name} (${processingTime}ms)`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Slack 알림이 성공적으로 전송되었습니다',
        data: {
          server_name: sanitizedData.server_name,
          status: sanitizedData.status,
          sentAt: new Date().toISOString(),
          processingTime,
        },
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-Processing-Time': String(processingTime),
        },
      }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;

    // 🛡️ 에러 정보 보안 처리 (민감한 정보 노출 방지)
    const isTimeoutError =
      error instanceof Error && error.name === 'AbortError';
    const isNetworkError = error instanceof TypeError;

    let errorMessage = '알 수 없는 오류가 발생했습니다';
    let errorCode = 'UNKNOWN_ERROR';

    if (isTimeoutError) {
      errorMessage = 'Slack API 응답 시간 초과';
      errorCode = 'TIMEOUT_ERROR';
    } else if (isNetworkError) {
      errorMessage = '네트워크 연결 오류';
      errorCode = 'NETWORK_ERROR';
    } else if (error instanceof Error) {
      errorMessage = error.message.includes('Slack API')
        ? error.message
        : '서버 처리 오류';
      errorCode = 'SERVER_ERROR';
    }

    console.error(`❌ Slack Webhook API 오류 (${processingTime}ms):`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        processingTime,
      },
      {
        status: 500,
        headers: {
          'X-Processing-Time': String(processingTime),
        },
      }
    );
  }
}

/**
 * 📋 GET /api/slack/webhook
 * Webhook 설정 상태 및 헬스 체크
 */
export async function GET() {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    const channel = process.env.SLACK_DEFAULT_CHANNEL || '#server-alerts';
    const rateLimit = process.env.SLACK_RATE_LIMIT || '10';
    const timeout = process.env.SLACK_TIMEOUT || '5000';

    const status = {
      configured: !!webhookUrl,
      channel,
      rateLimit: parseInt(rateLimit),
      timeout: parseInt(timeout),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      security: {
        rateLimiting: true,
        inputValidation: true,
        sanitization: true,
        errorProtection: true,
      },
    };

    return NextResponse.json({
      success: true,
      message: '🛡️ 보안 강화 Slack Webhook API 상태',
      data: status,
    });
  } catch (error) {
    console.error('❌ Slack Webhook 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '상태 확인 중 오류가 발생했습니다',
        code: 'HEALTH_CHECK_ERROR',
      },
      { status: 500 }
    );
  }
}
