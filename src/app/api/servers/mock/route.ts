/**
 * 🎭 Mock 서버 데이터 API
 *
 * 실제 서버가 없을 때 24시간 시뮬레이션 데이터 제공
 * - 30초 간격 실시간 갱신
 * - 다양한 장애 시나리오
 * - AI 분석 가능한 메타데이터 포함
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getMockSystem, mockHelpers } from '@/__mocks__/data';
import debug from '@/utils/debug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // URL 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';
    const includeMetadata = searchParams.get('metadata') === 'true';

    const mockSystem = getMockSystem({
      autoRotate: true,
      rotationInterval: 30000, // 30초
      speed: 1,
    });

    // 액션별 처리
    switch (action) {
      case 'list': {
        // 현재 서버 목록 반환
        const servers = mockSystem.getServers();
        const systemInfo = mockSystem.getSystemInfo();

        const response = {
          success: true,
          data: {
            servers,
            total: servers.length,
            timestamp: new Date().toISOString(),
          },
          metadata: includeMetadata
            ? {
                ...systemInfo,
                dataSource: 'mock-rotation',
                updateInterval: 30000,
                currentTime:
                  systemInfo.rotatorStatus?.simulationTime || '00:00:00',
                scenarioDescription: 'Mock scenario (rotation)',
              }
            : undefined,
        };

        return NextResponse.json(response, {
          headers: {
            'X-Response-Time': `${Date.now() - startTime}ms`,
            'X-Data-Source': 'Mock-System-v2',
            'X-Simulation-Time':
              systemInfo.rotatorStatus?.simulationTime || '00:00:00',
          },
        });
      }

      case 'jump': {
        // 특정 시간으로 점프
        const hour = parseInt(searchParams.get('hour') || '0', 10);
        const minute = parseInt(searchParams.get('minute') || '0', 10);
        mockSystem.jumpToTime(hour, minute);

        return NextResponse.json({
          success: true,
          message: `Jumped to ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        });
      }

      case 'speed': {
        // 재생 속도 변경
        const speed = parseFloat(searchParams.get('value') || '1');
        mockSystem.setSpeed(speed);

        return NextResponse.json({
          success: true,
          message: `Speed set to ${speed}x`,
        });
      }

      case 'scenario': {
        // 시나리오 트리거
        const type = searchParams.get('type') || 'random';
        let message = '';

        switch (type) {
          case 'random':
            message = mockHelpers.triggerRandomIncident();
            break;
          case 'normal':
            message = mockHelpers.jumpToNormalTime();
            break;
          case 'peak':
            message = mockHelpers.jumpToPeakTime();
            break;
          default:
            message = 'Unknown scenario type';
        }

        return NextResponse.json({
          success: true,
          message,
        });
      }

      case 'info': {
        // 시스템 정보만 반환
        const systemInfo = mockSystem.getSystemInfo();

        return NextResponse.json({
          success: true,
          systemInfo,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    debug.error('❌ Mock API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Mock system error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 Mock 시스템 리셋
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      // Mock 시스템 리셋
      const { resetMockSystem } = await import('@/__mocks__/data');
      resetMockSystem();

      return NextResponse.json({
        success: true,
        message: 'Mock system reset successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    debug.error('❌ Mock API POST 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Mock system error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
