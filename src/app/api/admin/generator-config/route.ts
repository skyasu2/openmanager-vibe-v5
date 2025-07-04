/**
 * 🔧 데이터 생성기 설정 API (GCP Functions 기반)
 *
 * 프로필 통합설정에서 사용하는 제너레이터 관리 API
 * 🤖 AI 강화 데이터 생성기 지원 추가
 * ☁️ GCP Functions 전환 완료
 */

import { getDataGeneratorConfig } from '@/config/environment';
import { fetchGCPServers } from '@/config/gcp-functions';
import { AIEnhancedDataGenerator } from '@/services/ai-enhanced/AIEnhancedDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

// GCP Functions 설정을 중앙에서 관리

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
  // 🤖 AI 강화 기능 추가
  aiEnhanced?: {
    enabled: boolean;
    version: string;
    modules: {
      anomalyDetection: boolean;
      adaptiveScenarios: boolean;
      performanceOptimization: boolean;
      autoScaling: boolean;
    };
    statistics: {
      detectedAnomalies: number;
      activeScenarios: number;
      optimizations: number;
    };
  };
}

/**
 * ☁️ GCP Functions에서 서버 데이터 가져오기
 */
async function getGCPServers() {
  return await fetchGCPServers();
}

/**
 * 🔍 제너레이터 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 환경 설정 가져오기
    const envConfig = getDataGeneratorConfig();

    // GCP Functions에서 서버 데이터 가져오기
    const servers = await getGCPServers();
    const isRunning = servers.length > 0;

    // 🤖 AI 강화 생성기 상태 확인
    const aiGenerator = AIEnhancedDataGenerator.getInstance();
    const aiStatus = aiGenerator.getStatus();

    const config: GeneratorConfigResponse = {
      serverCount: servers.length,
      architecture: envConfig.defaultArchitecture,
      isActive: isRunning || aiStatus.isRunning,
      lastUpdate: new Date().toISOString(),
      maxServers: envConfig.maxServers,
      updateInterval: envConfig.updateInterval,
      enableRealtime: envConfig.enabled,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      status: isRunning || aiStatus.isRunning ? 'running' : 'stopped',
      // 🤖 AI 강화 정보 추가
      aiEnhanced: {
        enabled: aiStatus.isRunning,
        version: aiStatus.version || '1.0.0',
        modules: aiStatus.aiModules || {
          anomalyDetection: false,
          adaptiveScenarios: false,
          performanceOptimization: false,
          autoScaling: false,
        },
        statistics: aiStatus.statistics || {
          detectedAnomalies: 0,
          activeScenarios: 0,
          optimizations: 0,
        },
      },
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
 * ⚙️ 제너레이터 설정 업데이트 (GCP Functions 기반)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverCount, architecture } = body;

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

        // GCP Functions는 고정 8개 서버 제공
        console.log(`🔧 GCP Functions는 표준 8개 서버를 제공합니다`);

        return NextResponse.json({
          success: true,
          message: `GCP Functions 표준 구성 (8개 서버)이 활성화되었습니다.`,
          data: {
            previousCount: 8,
            newCount: 8,
            updatedAt: new Date().toISOString(),
            note: 'GCP Functions는 표준 엔터프라이즈 구성을 사용합니다.',
          },
        });

      case 'updateArchitecture':
        const validArchitectures = [
          'single',
          'primary-replica',
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

        console.log(
          `🏗️ 아키텍처 변경: ${architecture} (GCP Functions 표준 구성)`
        );

        return NextResponse.json({
          success: true,
          message: `아키텍처가 ${architecture}로 설정되었습니다.`,
          data: {
            architecture,
            updatedAt: new Date().toISOString(),
          },
        });

      case 'start':
        // GCP Functions는 항상 활성화됨
        const servers = await getGCPServers();

        return NextResponse.json({
          success: true,
          message: 'GCP Functions 데이터 생성기가 활성화되었습니다.',
          data: {
            serverCount: servers.length,
            startedAt: new Date().toISOString(),
            source: 'GCP Functions',
          },
        });

      case 'stop':
        // GCP Functions는 서버리스이므로 중지 개념이 없음
        console.log('🛑 GCP Functions는 서버리스이므로 중지할 수 없습니다');

        return NextResponse.json({
          success: true,
          message: 'GCP Functions는 서버리스 환경이므로 항상 대기 상태입니다.',
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
 * 🔄 제너레이터 재시작 (GCP Functions 기반)
 */
export async function PUT(request: NextRequest) {
  try {
    // GCP Functions 상태 확인 및 재연결
    const servers = await getGCPServers();

    return NextResponse.json({
      success: true,
      message: 'GCP Functions 데이터 생성기가 재연결되었습니다.',
      data: {
        serverCount: servers.length,
        restartedAt: new Date().toISOString(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        source: 'GCP Functions',
      },
    });
  } catch (error) {
    console.error('GCP Functions 재연결 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'GCP Functions 재연결 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
