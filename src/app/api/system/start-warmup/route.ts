/**
 * 🚀 서버 시작 - 제한된 웜업 시스템 API
 * 첫 페이지 "서버 시작" 버튼용
 */

import { NextRequest, NextResponse } from 'next/server';
import { PythonWarmupService } from '@/services/ai/PythonWarmupService';

const pythonWarmup = PythonWarmupService.getInstance();

/**
 * 🎯 서버 시작 - 4번 제한 웜업 실행
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const maxWarmups = body.maxWarmups || 4; // 기본값 4번
    
    console.log(`🚀 서버 시작 요청 - ${maxWarmups}번 웜업 예정`);

    // 최대 웜업 횟수 설정
    pythonWarmup.setMaxWarmups(maxWarmups);

    // 제한된 웜업 시스템 시작
    pythonWarmup.startLimitedWarmupSystem();

    // 현재 상태 조회
    const stats = pythonWarmup.getWarmupStats();

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `서버 시작됨 - ${maxWarmups}번 웜업 예정`,
      data: {
        warmup_started: true,
        max_warmups: maxWarmups,
        warmup_interval: '8분',
        estimated_duration: `${maxWarmups * 8}분`,
        current_stats: stats
      },
      metadata: {
        processing_time: responseTime,
        timestamp: new Date().toISOString(),
        warmup_schedule: {
          interval_minutes: 8,
          total_warmups: maxWarmups,
          auto_stop: true
        }
      }
    });

  } catch (error: any) {
    console.error('❌ 서버 시작 오류:', error);

    return NextResponse.json({
      success: false,
      error: '서버 시작 중 오류가 발생했습니다',
      message: error.message,
      processing_time: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * 🏥 웜업 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const stats = pythonWarmup.getWarmupStats();
    const pythonStatus = await pythonWarmup.checkPythonStatus();

    return NextResponse.json({
      warmup_status: {
        active: stats.systemActive,
        completed: stats.isCompleted,
        current_count: stats.warmupCount,
        max_count: stats.maxWarmups,
        remaining: stats.remainingWarmups,
        last_warmup: stats.lastWarmup,
        next_warmup: stats.nextWarmup,
        average_response_time: stats.averageResponseTime
      },
      python_service: {
        status: pythonStatus.status,
        is_warm: pythonStatus.isWarm,
        response_time: pythonStatus.responseTime,
        last_check: pythonStatus.lastCheck
      },
      progress: {
        percentage: Math.round((stats.warmupCount / stats.maxWarmups) * 100),
        stage: stats.isCompleted ? 'completed' : stats.systemActive ? 'running' : 'stopped',
        eta_minutes: stats.remainingWarmups * 8
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '웜업 상태 확인 실패',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * 🛑 웜업 시스템 중지
 */
export async function DELETE(request: NextRequest) {
  try {
    pythonWarmup.stopWarmupSystem();
    const stats = pythonWarmup.getWarmupStats();

    return NextResponse.json({
      success: true,
      message: '웜업 시스템이 중지되었습니다',
      final_stats: {
        completed_warmups: stats.warmupCount,
        max_warmups: stats.maxWarmups,
        was_completed: stats.isCompleted
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: '웜업 시스템 중지 실패',
      message: error.message
    }, { status: 500 });
  }
} 