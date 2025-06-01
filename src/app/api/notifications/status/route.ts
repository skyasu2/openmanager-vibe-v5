/**
 * 📱 알림 시스템 상태 API - Phase 2.1
 * 
 * ✅ 기능:
 * - 알림 시스템 상태 조회
 * - 채널별 연결 상태 확인
 * - 대기 중인 알림 수 조회
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Phase 2.1 - 알림 시스템 상태 시뮬레이션
    const notificationStatus = {
      isEnabled: true,
      channels: {
        slack: false, // Phase 2.1에서는 비활성화
        discord: false,
        email: false
      },
      pending: 0,
      lastSent: null,
      stats: {
        totalSent: 0,
        successRate: 100,
        averageDeliveryTime: 0
      }
    };

    return NextResponse.json({
      success: true,
      data: notificationStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 알림 상태 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알림 상태 조회 실패',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 