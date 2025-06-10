/**
 * 🔧 서버 데이터 생성기 설정 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataGeneratorConfig } from '@/config/environment';

// 서버 데이터 생성기 설정 타입
interface GeneratorConfig {
  enabled: boolean;
  maxServers: number;
  defaultArchitecture:
    | 'single'
    | 'master-slave'
    | 'load-balanced'
    | 'microservices';
  updateInterval: number;
  refreshInterval: number;
  mode: 'development' | 'production';
  environment: {
    isVercel: boolean;
    isLocal: boolean;
    nodeEnv: string;
  };
  features: {
    networkTopology: boolean;
    demoScenarios: boolean;
    baselineOptimization: boolean;
    maxNodes: number;
    autoRotate: boolean;
  };
  performance: {
    memoryLimit: number;
    batchProcessing: boolean;
    parallelProcessing: boolean;
  };
}

/**
 * 📊 현재 서버 데이터 생성기 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    const config = getDataGeneratorConfig();

    // 현재 설정을 GeneratorConfig 형태로 변환
    const generatorConfig: GeneratorConfig = {
      enabled: config.enabled,
      maxServers: config.maxServers,
      defaultArchitecture:
        (config as any).defaultArchitecture || 'load-balanced',
      updateInterval: config.updateInterval,
      refreshInterval: config.refreshInterval,
      mode: config.mode as 'development' | 'production',
      environment: {
        isVercel: process.env.VERCEL === '1',
        isLocal: process.env.NODE_ENV === 'development',
        nodeEnv: process.env.NODE_ENV || 'development',
      },
      features: {
        networkTopology: config.features.networkTopology || false,
        demoScenarios: config.features.demoScenarios || false,
        baselineOptimization: config.features.baselineOptimization || false,
        maxNodes: config.features.maxNodes || 20,
        autoRotate: config.features.autoRotate || false,
      },
      performance: {
        memoryLimit: config.memoryLimit,
        batchProcessing: true,
        parallelProcessing: true,
      },
    };

    return NextResponse.json({
      success: true,
      data: generatorConfig,
      message: '서버 데이터 생성기 설정을 성공적으로 조회했습니다.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 서버 데이터 생성기 설정 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 데이터 생성기 설정 조회에 실패했습니다.',
        message: 'API 호출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * ⚙️ 서버 데이터 생성기 설정 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 설정 유효성 검사
    const {
      maxServers,
      defaultArchitecture,
      updateInterval,
      refreshInterval,
      features,
    } = body;

    // 서버 수 제한 검사
    if (maxServers && (maxServers < 1 || maxServers > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: '서버 수는 1-100 범위여야 합니다.',
        },
        { status: 400 }
      );
    }

    // 간격 제한 검사
    if (updateInterval && updateInterval < 1000) {
      return NextResponse.json(
        {
          success: false,
          error: '업데이트 간격은 최소 1000ms여야 합니다.',
        },
        { status: 400 }
      );
    }

    if (refreshInterval && refreshInterval < 5000) {
      return NextResponse.json(
        {
          success: false,
          error: '새로고침 간격은 최소 5000ms여야 합니다.',
        },
        { status: 400 }
      );
    }

    // 아키텍처 유효성 검사
    const validArchitectures = [
      'single',
      'master-slave',
      'load-balanced',
      'microservices',
    ];
    if (
      defaultArchitecture &&
      !validArchitectures.includes(defaultArchitecture)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 서버 아키텍처입니다.',
        },
        { status: 400 }
      );
    }

    // 실제로는 여기서 설정을 저장하거나 생성기에 적용
    console.log('🔧 서버 데이터 생성기 설정 업데이트:', body);

    // 현재 설정 다시 조회하여 반환
    const currentConfig = getDataGeneratorConfig();

    const updatedConfig: GeneratorConfig = {
      enabled: body.enabled ?? currentConfig.enabled,
      maxServers: maxServers ?? currentConfig.maxServers,
      defaultArchitecture:
        defaultArchitecture ??
        (currentConfig as any).defaultArchitecture ??
        'load-balanced',
      updateInterval: updateInterval ?? currentConfig.updateInterval,
      refreshInterval: refreshInterval ?? currentConfig.refreshInterval,
      mode: currentConfig.mode as 'development' | 'production',
      environment: {
        isVercel: process.env.VERCEL === '1',
        isLocal: process.env.NODE_ENV === 'development',
        nodeEnv: process.env.NODE_ENV || 'development',
      },
      features: {
        networkTopology:
          features?.networkTopology ?? currentConfig.features.networkTopology,
        demoScenarios:
          features?.demoScenarios ?? currentConfig.features.demoScenarios,
        baselineOptimization:
          features?.baselineOptimization ??
          currentConfig.features.baselineOptimization,
        maxNodes: features?.maxNodes ?? currentConfig.features.maxNodes,
        autoRotate: features?.autoRotate ?? currentConfig.features.autoRotate,
      },
      performance: {
        memoryLimit: currentConfig.memoryLimit,
        batchProcessing: true,
        parallelProcessing: true,
      },
    };

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: '서버 데이터 생성기 설정이 성공적으로 업데이트되었습니다.',
      appliedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 서버 데이터 생성기 설정 업데이트 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 데이터 생성기 설정 업데이트에 실패했습니다.',
        message: 'API 호출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
