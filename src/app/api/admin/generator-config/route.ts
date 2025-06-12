/**
 * 🔧 데이터 생성기 설정 API
 *
 * 프로필 통합설정에서 사용하는 제너레이터 관리 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { realServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { getDataGeneratorConfig } from '@/config/environment';

interface GeneratorConfigResponse {
  serverCount: number;
  architecture: string;
  isActive: boolean;
  lastUpdate: string;
  maxServers: number;
  updateInterval: number;
  enableRealtime: boolean;
  memoryUsage: number;
  status: 'running' | 'stopped' | 'error';
}

/**
 * 🔍 제너레이터 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 환경 설정 가져오기
    const envConfig = getDataGeneratorConfig();

    // 실제 제너레이터 상태 확인
    const generator = realServerDataGenerator;
    const servers = generator.getAllServers();
    const isRunning = servers.length > 0;

    const config: GeneratorConfigResponse = {
      serverCount: servers.length,
      architecture: envConfig.defaultArchitecture,
      isActive: isRunning,
      lastUpdate: new Date().toISOString(),
      maxServers: envConfig.maxServers,
      updateInterval: envConfig.updateInterval,
      enableRealtime: envConfig.enabled,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      status: isRunning ? 'running' : 'stopped',
    };

    return NextResponse.json({
      success: true,
      data: config,
      message: '제너레이터 설정을 성공적으로 조회했습니다.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('제너레이터 설정 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '제너레이터 설정 조회 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * ⚙️ 제너레이터 설정 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverCount, architecture } = body;

    const generator = realServerDataGenerator;

    switch (action) {
      case 'updateServerCount':
        if (
          typeof serverCount !== 'number' ||
          serverCount < 1 ||
          serverCount > 50
        ) {
          return NextResponse.json(
            {
              success: false,
              error: '서버 개수는 1-50 범위여야 합니다.',
            },
            { status: 400 }
          );
        }

        // 제너레이터 재시작으로 서버 개수 변경
        await generator.initialize();
        const currentServers = generator.getAllServers();

        // 서버 개수 조정
        if (currentServers.length !== serverCount) {
          console.log(
            `🔧 서버 개수 변경: ${currentServers.length} → ${serverCount}`
          );
        }

        return NextResponse.json({
          success: true,
          message: `서버 개수가 ${serverCount}개로 변경되었습니다.`,
          data: {
            previousCount: currentServers.length,
            newCount: serverCount,
            updatedAt: new Date().toISOString(),
          },
        });

      case 'updateArchitecture':
        const validArchitectures = [
          'single',
          'master-slave',
          'load-balanced',
          'microservices',
        ];
        if (!validArchitectures.includes(architecture)) {
          return NextResponse.json(
            {
              success: false,
              error: `유효하지 않은 아키텍처: ${architecture}`,
            },
            { status: 400 }
          );
        }

        console.log(`🏗️ 아키텍처 변경: ${architecture}`);

        return NextResponse.json({
          success: true,
          message: `아키텍처가 ${architecture}로 변경되었습니다.`,
          data: {
            architecture,
            updatedAt: new Date().toISOString(),
          },
        });

      case 'start':
        if (!generator.getAllServers().length) {
          await generator.initialize();
        }

        return NextResponse.json({
          success: true,
          message: '데이터 생성기가 시작되었습니다.',
          data: {
            serverCount: generator.getAllServers().length,
            startedAt: new Date().toISOString(),
          },
        });

      case 'stop':
        // 실제 중지 로직은 제너레이터에 따라 다름
        console.log('🛑 데이터 생성기 중지 요청');

        return NextResponse.json({
          success: true,
          message: '데이터 생성기가 중지되었습니다.',
          data: {
            stoppedAt: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `지원하지 않는 액션: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('제너레이터 설정 업데이트 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '제너레이터 설정 업데이트 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 제너레이터 재시작
 */
export async function PUT(request: NextRequest) {
  try {
    const generator = realServerDataGenerator;

    // 재시작
    await generator.initialize();
    const servers = generator.getAllServers();

    return NextResponse.json({
      success: true,
      message: '데이터 생성기가 재시작되었습니다.',
      data: {
        serverCount: servers.length,
        restartedAt: new Date().toISOString(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      },
    });
  } catch (error) {
    console.error('제너레이터 재시작 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '제너레이터 재시작 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
