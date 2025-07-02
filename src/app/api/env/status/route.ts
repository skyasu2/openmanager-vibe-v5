import { checkEnvironmentStatus } from '@/lib/environment/auto-decrypt-env';
import { envManagerProxy } from '@/lib/environment/client-safe-env';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Environment Status API Endpoint
 *
 * 환경변수 상태 및 설정 정보를 제공합니다.
 */

export async function GET(request: NextRequest) {
  try {
    const envStatus = {
      environment: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isVercel: process.env.VERCEL === '1',
      variables: {
        // 중요한 환경변수들의 존재 여부만 확인
        GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        MCP_SERVER_URL: !!process.env.MCP_SERVER_URL,
        REDIS_URL: !!process.env.REDIS_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
      },
      features: {
        aiEnabled: !!process.env.GOOGLE_AI_API_KEY,
        supabaseEnabled: !!(
          process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
        ),
        mcpEnabled: !!process.env.MCP_SERVER_URL,
        redisEnabled: !!process.env.REDIS_URL,
        databaseEnabled: !!process.env.DATABASE_URL,
      },
      deployment: {
        platform: process.env.VERCEL ? 'Vercel' : 'Local',
        region: process.env.VERCEL_REGION || 'unknown',
        url: process.env.VERCEL_URL || 'localhost:3000',
      },
    };

    return NextResponse.json({
      success: true,
      data: envStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Environment status API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get environment status',
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
        result = await envManagerProxy.autoRecovery([
          'SUPABASE_ANON_KEY',
          'GOOGLE_AI_API_KEY',
        ]);
        break;

      case 'restoreSpecific':
        const { varName } = body;
        if (!varName) {
          throw new Error('varName이 필요합니다');
        }
        result = await envManagerProxy.autoRecovery([varName]);
        break;

      case 'backup':
        result = await envManagerProxy.backupEnvironment();
        break;

      default:
        throw new Error(`지원하지 않는 액션: ${action}`);
    }

    // 복구 후 상태 재확인
    const status = await checkEnvironmentStatus();

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
