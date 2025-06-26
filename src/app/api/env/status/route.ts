import { checkEnvironmentStatus } from '@/lib/environment/auto-decrypt-env';
import { envManagerProxy } from '@/lib/environment/client-safe-env';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 환경변수 상태 API 호출됨');

    // 환경변수 상태 확인
    const envStatus = await checkEnvironmentStatus();

    // 환경변수 백업 시도 (서버에서만)
    let backupResult: any = null;
    try {
      backupResult = await envManagerProxy.backupEnvironment();
    } catch (error) {
      console.warn('⚠️ 환경변수 백업 실패:', error);
    }

    const response = {
      timestamp: new Date().toISOString(),
      environment: {
        status: envStatus.valid ? 'healthy' : 'warning',
        initialized: envStatus.initialized,
        valid: envStatus.valid,
        missingCount: envStatus.missing.length,
        missingVariables: envStatus.missing,
        message: envStatus.message,
      },
      backup: backupResult
        ? {
          success: backupResult.success,
          message: backupResult.message,
          backupId: backupResult.backupId,
        }
        : null,
    };

    console.log(
      `✅ 환경변수 상태 확인 완료 - ${envStatus.valid ? '정상' : '경고'}`
    );

    return NextResponse.json(response, {
      status: envStatus.valid ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ 환경변수 상태 API 오류:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'EnvironmentStatusError',
        },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
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
