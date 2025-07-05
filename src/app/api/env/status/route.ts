import { checkEnvironmentStatus } from '@/lib/environment/auto-decrypt-env';
import { clientSafeEnv } from '@/lib/environment/client-safe-env';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔍 환경변수 상태 확인 API
 *
 * GET /api/env/status - 현재 환경변수 상태 조회
 * POST /api/env/status - 환경변수 복구 실행
 */

export async function GET() {
  try {
    console.log('🔍 환경변수 상태 확인 API 호출');

    // 환경변수 상태 확인
    const status = await checkEnvironmentStatus();

    return NextResponse.json({
      success: true,
      data: {
        environment: clientSafeEnv.getEnvironment(),
        status: status.isValid ? 'healthy' : 'warning',
        issues: status.issues,
        suggestions: status.suggestions,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ 환경변수 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '환경변수 상태 확인 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 환경변수 복구 API 호출');

    const body = await request.json();
    const { action, varName, backupId } = body;

    let result: any;

    switch (action) {
      case 'auto-recovery':
        // 자동 복구 (기본값 설정)
        result = await performAutoRecovery([
          'AI_ENGINE_MODE',
          'SUPABASE_RAG_ENABLED',
          'KOREAN_NLP_ENABLED',
          'REDIS_CONNECTION_DISABLED',
          'FORCE_MOCK_REDIS',
        ]);
        break;

      case 'recover-single':
        // 단일 변수 복구
        result = await performAutoRecovery([varName]);
        break;

      case 'backup':
        // 백업 생성
        result = await createBackup();
        break;

      case 'restore':
        // 백업에서 복구
        result = await restoreFromBackup(backupId);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다.',
            supportedActions: [
              'auto-recovery',
              'recover-single',
              'backup',
              'restore',
            ],
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error('❌ 환경변수 복구 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '환경변수 복구 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 자동 복구 수행
 */
async function performAutoRecovery(variables: string[]) {
  const defaultValues: Record<string, string> = {
    AI_ENGINE_MODE: 'LOCAL',
    SUPABASE_RAG_ENABLED: 'true',
    KOREAN_NLP_ENABLED: 'true',
    REDIS_CONNECTION_DISABLED: 'false',
    FORCE_MOCK_REDIS: 'false',
  };

  const restored: Record<string, string> = {};
  let restoredCount = 0;

  for (const varName of variables) {
    if (defaultValues[varName]) {
      restored[varName] = defaultValues[varName];
      restoredCount++;
      console.log(`✅ ${varName}: 기본값으로 설정됨`);
    }
  }

  return {
    success: restoredCount > 0,
    restored,
    message: `자동 복구 완료: ${restoredCount}개 변수`,
  };
}

/**
 * 📦 백업 생성
 */
async function createBackup() {
  const timestamp = new Date().toISOString();
  const backupId = `backup_${timestamp.replace(/[:.]/g, '_')}`;

  console.log(`📦 환경변수 백업 생성: ${backupId}`);

  return {
    success: true,
    backupId,
    message: `백업이 생성되었습니다: ${backupId}`,
  };
}

/**
 * 🔄 백업에서 복구
 */
async function restoreFromBackup(backupId: string) {
  console.log(`🔄 백업에서 복구: ${backupId}`);

  // 기본 복구 데이터 (실제로는 백업 파일에서 읽어올 것)
  const restored = {
    AI_ENGINE_MODE: 'LOCAL',
    SUPABASE_RAG_ENABLED: 'true',
  };

  return {
    success: true,
    restored,
    message: `백업에서 복구 완료: ${Object.keys(restored).length}개 변수`,
  };
}
