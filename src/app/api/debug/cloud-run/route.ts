/**
 * Cloud Run Debug API
 * 환경 변수 상태 확인용 (테스트 후 삭제 예정)
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Trim environment variables to handle whitespace/newlines
  const enabledRaw = process.env.CLOUD_RUN_ENABLED;
  const enabledTrimmed = enabledRaw?.trim();
  const urlTrimmed = process.env.CLOUD_RUN_AI_URL?.trim();
  const secretTrimmed = process.env.CLOUD_RUN_API_SECRET?.trim();

  const config = {
    CLOUD_RUN_ENABLED_RAW: JSON.stringify(enabledRaw), // Shows exact value with escapes
    CLOUD_RUN_ENABLED_TRIMMED: enabledTrimmed,
    CLOUD_RUN_AI_URL: urlTrimmed ? '✅ SET' : '❌ NOT SET',
    CLOUD_RUN_API_SECRET: secretTrimmed ? '✅ SET' : '❌ NOT SET',
    // 조건 체크 (with trim)
    isEnabled: enabledTrimmed === 'true',
    hasUrl: !!urlTrimmed,
    hasSecret: !!secretTrimmed,
    allConditionsMet:
      enabledTrimmed === 'true' && !!urlTrimmed && !!secretTrimmed,
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cloudRunConfig: config,
    message: config.allConditionsMet
      ? '✅ Cloud Run should be enabled'
      : '❌ Cloud Run will be disabled - check conditions above',
  });
}
