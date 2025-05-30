/**
 * 🏥 시스템 상태 확인 API
 * 전역 상태 동기화를 위한 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { PythonWarmupService } from '@/services/ai/PythonWarmupService';

const pythonWarmup = PythonWarmupService.getInstance();

export async function GET(request: NextRequest) {
  try {
    // 웜업 상태 확인
    const warmupStats = pythonWarmup.getWarmupStats();
    const pythonStatus = await pythonWarmup.checkPythonStatus();
    
    // 시스템 활성화 여부 판단
    const isActive = 
      warmupStats.systemActive || 
      warmupStats.isCompleted || 
      pythonStatus.isWarm;

    return NextResponse.json({
      isActive,
      status: isActive ? 'active' : 'inactive',
      warmup: {
        active: warmupStats.systemActive,
        completed: warmupStats.isCompleted,
        count: warmupStats.warmupCount,
        remaining: warmupStats.remainingWarmups
      },
      python: {
        isWarm: pythonStatus.isWarm,
        status: pythonStatus.status,
        responseTime: pythonStatus.responseTime
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      isActive: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
} 