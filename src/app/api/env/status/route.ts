import autoDecryptEnv from '@/lib/environment/auto-decrypt-env';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 자동 복호화 시스템 상태 확인
    const status = autoDecryptEnv.getStatus();

    // 현재 환경변수 상태 점검
    const envVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'GOOGLE_AI_API_KEY',
      'RENDER_MCP_SERVER_URL',
    ];

    const envStatus = envVars.map(varName => ({
      name: varName,
      exists: !!process.env[varName],
      length: process.env[varName]?.length || 0,
      preview: process.env[varName]
        ? `${process.env[varName].substring(0, 10)}...`
        : 'undefined',
    }));

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      autoDecryptSystem: status,
      environmentVariables: envStatus,
      summary: {
        totalVars: envVars.length,
        availableVars: envStatus.filter(v => v.exists).length,
        missingVars: envStatus.filter(v => !v.exists).length,
        healthStatus: status.healthStatus,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('환경변수 상태 확인 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '환경변수 상태 확인 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'forceRestore':
        result = autoDecryptEnv.forceRestoreAll();
        break;

      case 'restoreSpecific':
        const { varName } = body;
        if (!varName) {
          throw new Error('varName이 필요합니다');
        }
        result = autoDecryptEnv.forceRestore(varName);
        break;

      default:
        throw new Error(`지원하지 않는 액션: ${action}`);
    }

    // 복구 후 상태 재확인
    const status = autoDecryptEnv.getStatus();

    return NextResponse.json({
      success: true,
      action,
      result,
      newStatus: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('환경변수 복구 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '환경변수 복구 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
