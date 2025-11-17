/**
 * 브라우저 알림 API
 * 사용자별 브라우저 푸시 알림 설정 및 발송
 * - Zod 스키마로 타입 안전성 보장
 */

import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/types/type-utils';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  NotificationRequestSchema,
  NotificationResponseSchema,
  NotificationStatusResponseSchema,
  type NotificationStatus,
  type TestNotificationData,
  type ValidateNotificationData,
  type UpdateNotificationSettings,

  type NotificationResponse,
  type NotificationStatusResponse,
} from '@/schemas/api.schema';

/**
 * 알림 상태 확인
 */
function checkNotificationStatus(): Promise<NotificationStatus> {
  // 실제 브라우저 알림 상태 확인 로직
  return Promise.resolve({
    supported: true,
    permission: 'granted',
    enabled: true,
  });
}

/**
 * 테스트 알림 발송
 */
function handleSendTestNotification(
  data: TestNotificationData
): Promise<NotificationResponse> {
  // 테스트 알림 발송 로직
  return Promise.resolve({
    success: true,
    message: '테스트 알림이 발송되었습니다.',
    data,
  });
}

/**
 * 알림 유효성 검증
 */
function handleValidateNotification(
  data: ValidateNotificationData
): Promise<NotificationResponse> {
  // 알림 유효성 검증 로직
  return Promise.resolve({
    success: true,
    valid: true,
    data,
  });
}

/**
 * 알림 이력 삭제
 */
function handleClearHistory(): Promise<NotificationResponse> {
  // 알림 이력 삭제 로직
  return Promise.resolve({
    success: true,
    message: '알림 이력이 삭제되었습니다.',
  });
}

/**
 * 알림 설정 업데이트
 */
function handleUpdateSettings(
  data: UpdateNotificationSettings
): Promise<NotificationResponse> {
  // 설정 업데이트 로직
  return Promise.resolve({
    success: true,
    message: '알림 설정이 업데이트되었습니다.',
    data,
  });
}

// GET 핸들러
const getHandler = createApiRoute()
  .response(NotificationStatusResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, _context): Promise<NotificationStatusResponse> => {
    const status = await checkNotificationStatus();

    return {
      success: true,
      data: status,
    };
  });

/**
 * 🔔 GET - 브라우저 알림 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    return await getHandler(request);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '브라우저 알림 상태 조회 실패',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// POST 핸들러
const postHandler = createApiRoute()
  .body(NotificationRequestSchema)
  .response(NotificationResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<NotificationResponse> => {
    const body = context.body;

    switch (body.action) {
      case 'test': {
        const { action: _action, ...data } = body;
        return handleSendTestNotification(data);
      }
      case 'validate': {
        const { action: _action, ...data } = body;
        return handleValidateNotification(data);
      }
      case 'clear-history':
        return handleClearHistory();
      case 'update-settings': {
        const { action: _action, ...data } = body;
        return handleUpdateSettings(data);
      }
      default:
        throw new Error('지원하지 않는 액션입니다.');
    }
  });

/**
 * 📤 POST - 알림 관련 액션 실행
 */
export async function POST(request: NextRequest) {
  try {
    const response = await postHandler(request);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '알림 액션 실행 실패',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
