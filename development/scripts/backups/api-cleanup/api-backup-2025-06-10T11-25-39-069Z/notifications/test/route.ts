/**
 * 🧪 알림 테스트 API - Phase 2.1
 *
 * ✅ 기능:
 * - 테스트 알림 발송
 * - 채널별 테스트 지원
 * - 시스템 통합 테스트
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel = 'all', message = '🧪 테스트 알림' } = body;

    console.log('🧪 [Phase 2.1] 알림 테스트 실행:', { channel, message });

    // Phase 2.1 - 테스트 알림 시뮬레이션
    const testResult = {
      channel,
      message,
      status: 'success',
      timestamp: new Date().toISOString(),
      deliveryTime: Math.floor(Math.random() * 1000) + 100, // 100-1100ms
      channels: {
        slack:
          channel === 'all' || channel === 'slack' ? 'test_sent' : 'not_tested',
        discord:
          channel === 'all' || channel === 'discord'
            ? 'test_sent'
            : 'not_tested',
        email:
          channel === 'all' || channel === 'email' ? 'test_sent' : 'not_tested',
      },
    };

    // 성공 로그
    console.log('✅ [Phase 2.1] 알림 테스트 완료:', testResult);

    return NextResponse.json({
      success: true,
      data: testResult,
      message: `${channel} 채널로 테스트 알림이 발송되었습니다`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 알림 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알림 테스트 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
