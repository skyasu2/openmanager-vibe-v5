import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';
import { dataManager } from '../../../../services/dataManager';

/**
 * 🚀 시스템 시작 API
 * POST /api/system/start
 * 시뮬레이션 엔진을 시작하고 데이터 수집을 시작합니다
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 시스템 시작 API 호출');

    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'full'; // 'fast' | 'full'

    // 이미 실행 중인지 확인
    if (simulationEngine.isRunning()) {
      const state = simulationEngine.getState();
      const runtime = state.startTime ? Date.now() - state.startTime : 0;
      
      return NextResponse.json({
        success: true,
        message: '시스템이 이미 실행 중입니다.',
        data: {
          isRunning: true,
          runtime: Math.round(runtime / 1000), // 초 단위
          dataCount: state.dataCount,
          mode: 'already_running'
        },
        fallback: false
      }, { status: 200 });
    }

    let fallback = false;

    try {
      // 시뮬레이션 엔진 시작
      console.log(`🎯 시뮬레이션 엔진 시작 (${mode} 모드)...`);
      
      simulationEngine.start();
      
      console.log('✅ 시뮬레이션 엔진 시작 완료');

      const state = simulationEngine.getState();
      
      return NextResponse.json({
        success: true,
        message: `시스템이 성공적으로 시작되었습니다 (${mode} 모드).`,
        data: {
          isRunning: true,
          startTime: state.startTime,
          serverCount: state.servers.length,
          mode: mode,
          dataCount: 0
        },
        fallback: fallback
      });

    } catch (engineError) {
      console.warn('⚠️ 시뮬레이션 엔진 시작 실패, Fallback 모드로 전환:', engineError);
      
      // Fallback 모드: 기본 시스템 상태 설정
      fallback = true;
      const warnings = [
        '시뮬레이션 엔진 시작 실패 - Fallback 모드로 동작',
        '일부 고급 기능이 제한될 수 있습니다'
      ];

      return NextResponse.json({
        success: true,
        message: '시스템이 Fallback 모드로 시작되었습니다.',
        data: {
          isRunning: false,
          fallbackMode: true,
          mode: 'fallback',
          serverCount: 0,
          dataCount: 0
        },
        warnings: warnings,
        fallback: true,
        recommendations: [
          '대시보드에서 기본 기능을 사용할 수 있습니다',
          '서버 모니터링 및 AI 에이전트는 제한적으로 동작합니다'
        ]
      }, { status: 206 }); // 206 Partial Content
    }

  } catch (error) {
    console.error('❌ 시스템 시작 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: '시스템 시작에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      data: {
        isRunning: false,
        fallbackMode: false
      }
    }, { status: 500 });
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 