/**
 * 🔔 브라우저 네이티브 알림 API
 *
 * ✅ 기능:
 * - 알림 상태 조회
 * - 테스트 알림 전송
 * - 알림 히스토리 관리
 * - 설정 업데이트
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 서버 사이드에서는 브라우저 알림 직접 관리 불가
// 클라이언트 상태 정보만 제공

interface BrowserNotificationStatus {
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'default';
  isEnabled: boolean;
  lastCheck: string;
  stats: {
    totalSent: number;
    todaySent: number;
    successRate: number;
  };
}

interface NotificationRequest {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  serverId?: string;
  type?: string;
}

/**
 * 📊 GET - 브라우저 알림 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        return handleGetStatus();
      case 'history':
        return handleGetHistory(url.searchParams);
      case 'test':
        return handleTestSupport();
      default:
        return handleGetStatus();
    }
  } catch (error) {
    console.error('❌ 브라우저 알림 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '브라우저 알림 상태 조회 실패',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 📤 POST - 알림 관련 액션 실행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'test':
        return handleSendTestNotification(_data);
      case 'validate':
        return handleValidateNotification(_data);
      case 'clear-history':
        return handleClearHistory();
      case 'update-settings':
        return handleUpdateSettings(_data);
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 브라우저 알림 액션 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '알림 액션 실행 실패',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 알림 상태 조회
 */
async function handleGetStatus(): Promise<NextResponse> {
  // 서버 사이드에서는 기본 정보만 제공
  const status: BrowserNotificationStatus = {
    isSupported: true, // 클라이언트에서 확인
    permission: 'default', // 클라이언트에서 확인
    isEnabled: false, // 클라이언트에서 확인
    lastCheck: new Date().toISOString(),
    stats: {
      totalSent: 0,
      todaySent: 0,
      successRate: 0,
    },
  };

  return NextResponse.json({
    success: true,
    _data: status,
    message:
      '브라우저 알림 상태 조회 완료 (클라이언트에서 실제 상태 확인 필요)',
    timestamp: new Date().toISOString(),
  });
}

/**
 * 📜 알림 히스토리 조회
 */
async function handleGetHistory(
  searchParams: URLSearchParams
): Promise<NextResponse> {
  const limit = parseInt(searchParams.get('limit') || '20');
  const severity = searchParams.get('severity');
  const serverId = searchParams.get('serverId');

  // 서버 사이드에서는 빈 히스토리 반환 (클라이언트에서 관리)
  const history = {
    notifications: [] as any[],
    total: 0,
    filters: {
      limit,
      severity,
      serverId,
    },
    pagination: {
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };

  return NextResponse.json({
    success: true,
    _data: history,
    message: '알림 히스토리는 클라이언트에서 관리됩니다.',
    timestamp: new Date().toISOString(),
  });
}

/**
 * 🧪 브라우저 지원 테스트
 */
async function handleTestSupport(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    _data: {
      serverSupport: false, // 서버에서는 브라우저 알림 불가
      requiresClientCheck: true,
      features: {
        basicNotification: 'client-check-required',
        persistentNotification: 'client-check-required',
        actions: 'client-check-required',
        silent: 'client-check-required',
      },
    },
    message: '브라우저 알림 지원은 클라이언트에서 확인해야 합니다.',
    timestamp: new Date().toISOString(),
  });
}

/**
 * 🧪 테스트 알림 전송 (클라이언트 지시)
 */
async function handleSendTestNotification(_data: any): Promise<NextResponse> {
  const testNotification: NotificationRequest = {
    title: _data.title || 'OpenManager 테스트 알림',
    message: _data.message || '브라우저 알림이 정상적으로 작동합니다.',
    severity: _data.severity || 'warning',
    serverId: _data.serverId || 'test-server',
    type: 'test',
  };

  // 서버에서는 알림 데이터만 검증하고 반환
  return NextResponse.json({
    success: true,
    _data: {
      notification: testNotification,
      instruction: 'client-send-required',
      timestamp: new Date().toISOString(),
    },
    message: '테스트 알림 데이터 준비 완료. 클라이언트에서 전송하세요.',
    timestamp: new Date().toISOString(),
  });
}

/**
 * ✅ 알림 데이터 검증
 */
async function handleValidateNotification(
  _data: NotificationRequest
): Promise<NextResponse> {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!_data.title || _data.title.trim().length === 0) {
    errors.push('제목이 필요합니다.');
  }
  if (!_data.message || _data.message.trim().length === 0) {
    errors.push('메시지가 필요합니다.');
  }
  if (
    !_data.severity ||
    !['info', 'warning', 'critical'].includes(_data.severity)
  ) {
    errors.push('올바른 심각도를 지정해야 합니다.');
  }

  // 길이 제한 검증
  if (_data.title && _data.title.length > 100) {
    errors.push('제목은 100자를 초과할 수 없습니다.');
  }
  if (_data.message && _data.message.length > 300) {
    errors.push('메시지는 300자를 초과할 수 없습니다.');
  }

  const isValid = errors.length === 0;

  return NextResponse.json({
    success: isValid,
    _data: {
      isValid,
      errors,
      validatedData: isValid ? _data : null,
    },
    message: isValid ? '알림 데이터 검증 성공' : '알림 데이터 검증 실패',
    timestamp: new Date().toISOString(),
  });
}

/**
 * 🧹 히스토리 초기화 (클라이언트 지시)
 */
async function handleClearHistory(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    _data: {
      instruction: 'client-clear-required',
      timestamp: new Date().toISOString(),
    },
    message: '히스토리 초기화 지시 완료. 클라이언트에서 실행하세요.',
    timestamp: new Date().toISOString(),
  });
}

/**
 * ⚙️ 설정 업데이트 (클라이언트 지시)
 */
async function handleUpdateSettings(settings: any): Promise<NextResponse> {
  // 설정 검증
  const validSettings: any = {};

  if (
    typeof settings.duplicatePreventionTime === 'number' &&
    settings.duplicatePreventionTime > 0
  ) {
    validSettings.duplicatePreventionTime = Math.min(
      settings.duplicatePreventionTime,
      30 * 60 * 1000
    ); // 최대 30분
  }

  if (
    typeof settings.maxHistorySize === 'number' &&
    settings.maxHistorySize > 0
  ) {
    validSettings.maxHistorySize = Math.min(settings.maxHistorySize, 1000); // 최대 1000개
  }

  if (typeof settings.enableBrowserNotifications === 'boolean') {
    validSettings.enableBrowserNotifications =
      settings.enableBrowserNotifications;
  }

  return NextResponse.json({
    success: true,
    _data: {
      validatedSettings: validSettings,
      instruction: 'client-update-required',
      timestamp: new Date().toISOString(),
    },
    message: '설정 검증 완료. 클라이언트에서 적용하세요.',
    timestamp: new Date().toISOString(),
  });
}
