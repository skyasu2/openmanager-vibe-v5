/**
 * 🌐 글로벌 시스템 상태 API
 *
 * 모든 클라이언트가 공유하는 시스템 상태를 서버에서 관리
 */

import { NextRequest, NextResponse } from 'next/server';

// 글로벌 시스템 상태 (서버 메모리에 저장)
let globalSystemState = {
  state: 'STOPPED' as 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'ERROR',
  startedAt: null as number | null,
  stoppedAt: Date.now(),
  activeUsers: 0,
  lastStateChange: Date.now(),
  operatorName: null as string | null,
  isManualControl: true,
  autoShutdownEnabled: false,
  autoShutdownAt: null as number | null,
  startingProgress: 0, // 0-100 시작 진행률
  stoppingProgress: 0, // 0-100 종료 진행률
};

// 상태 변경 리스너들 (Server-Sent Events용)
const stateListeners = new Set<(state: typeof globalSystemState) => void>();

// 상태 변경 알림
function notifyStateChange() {
  stateListeners.forEach(listener => {
    try {
      listener(globalSystemState);
    } catch (error) {
      console.error('❌ State listener error:', error);
    }
  });
}

// 시스템 시작 프로세스 시뮬레이션
async function startSystemProcess(operatorName: string): Promise<boolean> {
  try {
    globalSystemState.state = 'STARTING';
    globalSystemState.operatorName = operatorName;
    globalSystemState.lastStateChange = Date.now();
    globalSystemState.startingProgress = 0;
    notifyStateChange();

    // 단계별 시작 프로세스 (실제로는 실제 시스템 초기화)
    const steps = [
      { name: '시스템 검증', duration: 1000 },
      { name: '서비스 초기화', duration: 2000 },
      { name: '데이터베이스 연결', duration: 1500 },
      { name: 'AI 엔진 활성화', duration: 2000 },
      { name: '시스템 준비 완료', duration: 500 },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      globalSystemState.startingProgress = Math.round(
        ((i + 1) / steps.length) * 100
      );
      notifyStateChange();
    }

    // 시작 완료
    globalSystemState.state = 'RUNNING';
    globalSystemState.startedAt = Date.now();
    globalSystemState.startingProgress = 100;

    // 자동 종료 설정 (선택적)
    if (globalSystemState.autoShutdownEnabled) {
      globalSystemState.autoShutdownAt = Date.now() + 30 * 60 * 1000;
    }

    notifyStateChange();
    return true;
  } catch (error) {
    console.error('❌ 시스템 시작 실패:', error);
    globalSystemState.state = 'ERROR';
    globalSystemState.startingProgress = 0;
    notifyStateChange();
    return false;
  }
}

// 시스템 종료 프로세스 시뮬레이션
async function stopSystemProcess(operatorName: string): Promise<boolean> {
  try {
    globalSystemState.state = 'STOPPING';
    globalSystemState.operatorName = operatorName;
    globalSystemState.lastStateChange = Date.now();
    globalSystemState.stoppingProgress = 0;
    notifyStateChange();

    // 안전한 종료 프로세스
    const steps = [
      { name: '진행 중인 작업 완료 대기', duration: 2000 },
      { name: 'AI 엔진 안전 종료', duration: 1500 },
      { name: '데이터베이스 연결 종료', duration: 1000 },
      { name: '서비스 정리', duration: 1500 },
      { name: '시스템 종료 완료', duration: 500 },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      globalSystemState.stoppingProgress = Math.round(
        ((i + 1) / steps.length) * 100
      );
      notifyStateChange();
    }

    // 종료 완료
    globalSystemState.state = 'STOPPED';
    globalSystemState.stoppedAt = Date.now();
    globalSystemState.startedAt = null;
    globalSystemState.autoShutdownAt = null;
    globalSystemState.stoppingProgress = 100;

    notifyStateChange();
    return true;
  } catch (error) {
    console.error('❌ 시스템 종료 실패:', error);
    globalSystemState.state = 'ERROR';
    globalSystemState.stoppingProgress = 0;
    notifyStateChange();
    return false;
  }
}

// GET: 현재 상태 조회
export async function GET() {
  return NextResponse.json({
    success: true,
    data: globalSystemState,
  });
}

// POST: 상태 변경 요청
export async function POST(request: NextRequest) {
  try {
    const {
      action,
      operatorName = '사용자',
      ...options
    } = await request.json();

    switch (action) {
      case 'start':
        if (
          globalSystemState.state !== 'STOPPED' &&
          globalSystemState.state !== 'ERROR'
        ) {
          return NextResponse.json({
            success: false,
            message: `시스템을 시작할 수 없습니다. 현재 상태: ${globalSystemState.state}`,
            data: globalSystemState,
          });
        }

        // 비동기 시작 프로세스 실행
        startSystemProcess(operatorName);

        return NextResponse.json({
          success: true,
          message: '시스템 시작 프로세스가 시작되었습니다.',
          data: globalSystemState,
        });

      case 'stop':
        if (
          globalSystemState.state !== 'RUNNING' &&
          globalSystemState.state !== 'STARTING'
        ) {
          return NextResponse.json({
            success: false,
            message: `시스템을 종료할 수 없습니다. 현재 상태: ${globalSystemState.state}`,
            data: globalSystemState,
          });
        }

        // 비동기 종료 프로세스 실행
        stopSystemProcess(operatorName);

        return NextResponse.json({
          success: true,
          message: '시스템 종료 프로세스가 시작되었습니다.',
          data: globalSystemState,
        });

      case 'join':
        globalSystemState.activeUsers += 1;
        notifyStateChange();

        return NextResponse.json({
          success: true,
          message: '세션에 참여했습니다.',
          data: globalSystemState,
        });

      case 'leave':
        globalSystemState.activeUsers = Math.max(
          0,
          globalSystemState.activeUsers - 1
        );
        notifyStateChange();

        return NextResponse.json({
          success: true,
          message: '세션에서 나갔습니다.',
          data: globalSystemState,
        });

      case 'toggle-auto-shutdown':
        globalSystemState.autoShutdownEnabled = options.enabled;
        if (!options.enabled) {
          globalSystemState.autoShutdownAt = null;
        } else if (globalSystemState.state === 'RUNNING') {
          globalSystemState.autoShutdownAt = Date.now() + 30 * 60 * 1000;
        }
        notifyStateChange();

        return NextResponse.json({
          success: true,
          message: `자동 종료가 ${options.enabled ? '활성화' : '비활성화'}되었습니다.`,
          data: globalSystemState,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            message: '알 수 없는 액션입니다.',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 시스템 상태 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// Server-Sent Events를 위한 스트림 등록
export function registerStateListener(
  callback: (state: typeof globalSystemState) => void
) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}
